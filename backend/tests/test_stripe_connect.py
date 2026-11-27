"""Connect HTTP/domain tests on a disposable PostgreSQL database only."""

import asyncio
import os
import uuid
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from urllib.parse import parse_qs

import httpx
import pytest
import pytest_asyncio
from fastapi import FastAPI
from sqlalchemy import select, text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.api.v1.endpoints.stripe_connect import router
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.models import Base
from app.models.audit import AuditLog
from app.models.billing import BillingOperation, StripeConnectAccount
from app.models.job import Job
from app.models.payment import PaymentRecord
from app.models.user import User
from app.services import stripe_connect
from app.services.stripe_gateway import StripeGateway


@pytest_asyncio.fixture
async def connect(monkeypatch):
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.skip("TEST_DATABASE_URL is required for isolated PostgreSQL tests")
    if not (make_url(url).database or "").endswith("_test"):
        pytest.fail("Refusing schema recreation outside a dedicated *_test database")
    engine = create_async_engine(url, poolclass=NullPool)
    async with engine.connect() as lock:
        await lock.execute(text("SELECT pg_advisory_lock(742341)"))
        try:
            async with engine.begin() as connection:
                await connection.run_sync(Base.metadata.drop_all)
                await connection.run_sync(Base.metadata.create_all)
            factory = async_sessionmaker(engine, expire_on_commit=False)
            users = {}
            async with factory() as db:
                for name, role in [
                    ("developer", "agent_developer"),
                    ("other", "agent_developer"),
                    ("client", "client"),
                    ("admin", "admin"),
                ]:
                    user = User(
                        id=uuid.uuid4(),
                        email=f"{name}@example.test",
                        full_name=name,
                        role=role,
                        hashed_password="unused",
                    )
                    db.add(user)
                    users[name] = user
                await db.commit()

            async def database():
                async with factory() as db:
                    try:
                        yield db
                        await db.commit()
                    except Exception:
                        await db.rollback()
                        raise

            app = FastAPI()
            app.include_router(router, prefix="/api/v1/billing")
            app.dependency_overrides[get_db] = database
            monkeypatch.setattr(settings, "PAYMENT_MODE", "stripe")
            monkeypatch.setattr(settings, "STRIPE_MODE", "test")
            monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_unit")
            monkeypatch.setattr(settings, "STRIPE_CONNECT_WEBHOOK_SECRET", "whsec_unit")
            monkeypatch.setattr(settings, "BILLING_SITE_URL", "http://localhost:3111")
            state = SimpleNamespace(
                calls=[],
                fail_account=False,
                account_metadata=None,
                redirect=None,
                active=False,
                account_created=None,
                factory=factory,
                users=users,
            )

            async def respond(request):
                data = {key: value[0] for key, value in parse_qs(request.content.decode()).items()}
                state.calls.append(
                    (request.method, request.url.path, data, request.headers.get("Idempotency-Key"))
                )
                if request.url.path == "/v1/accounts" and request.method == "POST":
                    # Reservation must already be durable when Stripe is contacted.
                    async with factory() as check:
                        reserved = await check.get(
                            StripeConnectAccount, uuid.UUID(data["metadata[taskmatch_user_id]"])
                        )
                        assert reserved is not None and reserved.country == data["country"]
                    if state.fail_account:
                        return httpx.Response(
                            503, json={"error": {"message": "secret provider diagnostics"}}
                        )
                    state.account_created = dict(data)
                if request.url.path == "/v1/accounts" or (
                    request.method == "GET" and request.url.path.startswith("/v1/accounts/")
                ):
                    metadata = state.account_metadata or {
                        "app": "taskmatch",
                        "taskmatch_user_id": str(users["developer"].id),
                    }
                    return httpx.Response(
                        200,
                        json={
                            "id": "acct_unit",
                            "object": "account",
                            "country": "FR",
                            "metadata": metadata,
                            "details_submitted": state.active,
                            "payouts_enabled": state.active,
                            "capabilities": {"transfers": "active" if state.active else "pending"},
                            "requirements": {
                                "currently_due": [] if state.active else ["external_account"],
                                "past_due": [],
                            },
                            "controller": {"stripe_dashboard": {"type": "express"}},
                        },
                    )
                if request.url.path == "/v1/account_links":
                    return httpx.Response(
                        200, json={"url": state.redirect or "https://connect.stripe.com/setup/unit"}
                    )
                if request.url.path.endswith("/login_links"):
                    return httpx.Response(
                        200,
                        json={"url": state.redirect or "https://connect.stripe.com/express/unit"},
                    )
                raise AssertionError(
                    f"unexpected Stripe request {request.method} {request.url.path}"
                )

            gateway = StripeGateway(
                "sk_test_unit", transport=httpx.MockTransport(respond), retry_delay=0
            )
            monkeypatch.setattr(stripe_connect, "get_gateway", lambda: gateway)
            state.headers = {
                name: {"Authorization": "Bearer " + create_access_token({"sub": str(user.id)})}
                for name, user in users.items()
            }
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app), base_url="http://test/api/v1/billing"
            ) as client:
                state.http = client
                yield state
        finally:
            await lock.execute(text("SELECT pg_advisory_unlock(742341)"))
    await engine.dispose()


async def call(connect, method, path, role="developer", expected=200, **kwargs):
    response = await connect.http.request(
        method, "/connect" + path, headers=connect.headers[role], **kwargs
    )
    assert response.status_code == expected, response.text
    return response.json()


async def test_status_is_local_and_does_not_invent_connected_account(connect):
    result = await call(connect, "GET", "")
    assert result == {
        "account_id": None,
        "country": None,
        "details_submitted": False,
        "transfers_enabled": False,
        "payouts_enabled": False,
        "requirements": [],
        "enabled": True,
        "mode": "test",
    }
    assert connect.calls == []


@pytest.mark.parametrize("role", ["client", "admin"])
async def test_connect_requires_developer_role(connect, role):
    for method, path in [
        ("GET", ""),
        ("POST", "/onboarding"),
        ("POST", "/sync"),
        ("POST", "/dashboard"),
    ]:
        await call(connect, method, path, role=role, expected=403, json={"country": "FR"})
    assert connect.calls == []


async def test_anonymous_connect_is_rejected(connect):
    assert (await connect.http.get("/connect")).status_code == 401
    assert connect.calls == []


async def test_onboarding_reserves_and_creates_only_required_controller_properties(connect):
    result = await call(connect, "POST", "/onboarding", json={"country": "fr"})
    assert result["url"].startswith("https://connect.stripe.com/")
    created = connect.account_created
    assert created == {
        "country": "FR",
        "controller[stripe_dashboard][type]": "express",
        "controller[fees][payer]": "application",
        "controller[losses][payments]": "application",
        "controller[requirement_collection]": "stripe",
        "capabilities[transfers][requested]": "true",
        "metadata[app]": "taskmatch",
        "metadata[taskmatch_user_id]": str(connect.users["developer"].id),
    }
    link = next(item[2] for item in connect.calls if item[1] == "/v1/account_links")
    assert link["return_url"] == "http://localhost:3111/developer/earnings?connect=return"
    assert link["refresh_url"] == "http://localhost:3111/developer/earnings?connect=refresh"
    assert link["type"] == "account_onboarding"
    await call(connect, "POST", "/onboarding", json={})
    assert sum(item[1] == "/v1/accounts" for item in connect.calls) == 1
    other = await call(connect, "GET", "", role="other")
    assert other["account_id"] is None


async def test_reserved_country_cannot_change_after_unknown_creation(connect):
    connect.fail_account = True
    await call(connect, "POST", "/onboarding", json={"country": "FR"}, expected=502)
    first_keys = {item[3] for item in connect.calls}
    assert len(first_keys) == 1 and next(iter(first_keys)).startswith(
        "taskmatch:connect-account:test:"
    )
    connect.calls.clear()
    await call(connect, "POST", "/onboarding", json={"country": "DE"}, expected=409)
    assert connect.calls == []
    connect.fail_account = False
    await call(connect, "POST", "/onboarding", json={"country": "FR"})
    assert connect.calls[0][3] in first_keys


async def test_creation_with_unknown_outcome_past_retention_fails_closed(connect):
    async with connect.factory() as db:
        db.add(
            StripeConnectAccount(
                user_id=connect.users["developer"].id,
                country="FR",
                livemode=False,
                created_at=datetime.now(UTC) - timedelta(hours=21),
            )
        )
        await db.commit()
    await call(connect, "POST", "/onboarding", json={"country": "FR"}, expected=409)
    assert connect.calls == []


async def reserve_unknown_account(connect):
    async with connect.factory() as db:
        account = StripeConnectAccount(
            user_id=connect.users["developer"].id,
            country="FR",
            livemode=False,
            created_at=datetime.now(UTC) - timedelta(hours=21),
        )
        db.add(account)
        await db.commit()
        return account.created_at


async def test_admin_reconciles_reserved_account_using_get_only_without_resetting_attempt(connect):
    created_at = await reserve_unknown_account(connect)
    result = await call(
        connect,
        "POST",
        f"/{connect.users['developer'].id}/reconcile",
        role="admin",
        json={"account_id": "acct_unit"},
    )
    assert result["account_id"] == "acct_unit"
    assert [item[:2] for item in connect.calls] == [("GET", "/v1/accounts/acct_unit")]
    async with connect.factory() as db:
        account = await db.get(StripeConnectAccount, connect.users["developer"].id)
        assert account.created_at == created_at
        assert await db.scalar(
            select(AuditLog.id).where(AuditLog.action == "stripe.connect.reconcile")
        )


async def test_connect_reconciliation_requires_admin_and_existing_reservation(connect):
    await call(
        connect,
        "POST",
        f"/{connect.users['developer'].id}/reconcile",
        expected=403,
        json={"account_id": "acct_unit"},
    )
    await call(
        connect,
        "POST",
        f"/{connect.users['developer'].id}/reconcile",
        role="admin",
        expected=409,
        json={"account_id": "acct_unit"},
    )
    assert connect.calls == []


@pytest.mark.parametrize("mismatch", ["account_id", "metadata", "mode", "country"])
async def test_admin_cannot_bind_foreign_account_or_replace_immutable_reservation(
    connect, mismatch
):
    await reserve_unknown_account(connect)
    account_id = "acct_unknown" if mismatch == "account_id" else "acct_unit"
    if mismatch == "metadata":
        connect.account_metadata = {
            "app": "taskmatch",
            "taskmatch_user_id": str(connect.users["other"].id),
        }
    if mismatch in {"mode", "country"}:
        async with connect.factory() as db:
            account = await db.get(StripeConnectAccount, connect.users["developer"].id)
            if mismatch == "mode":
                account.livemode = True
            else:
                account.country = "DE"
            await db.commit()
    await call(
        connect,
        "POST",
        f"/{connect.users['developer'].id}/reconcile",
        role="admin",
        expected=409 if mismatch == "mode" else 502,
        json={"account_id": account_id},
    )
    assert all(item[0] == "GET" for item in connect.calls)
    async with connect.factory() as db:
        assert (
            await db.get(StripeConnectAccount, connect.users["developer"].id)
        ).account_id is None


async def test_simultaneous_creation_uses_single_immutable_account_reservation(connect):
    await asyncio.gather(
        *[call(connect, "POST", "/onboarding", json={"country": "FR"}) for _ in range(2)]
    )
    creates = [item for item in connect.calls if item[1] == "/v1/accounts"]
    assert len({item[3] for item in creates}) == 1
    async with connect.factory() as db:
        assert len((await db.scalars(select(StripeConnectAccount))).all()) == 1


async def test_account_identity_from_provider_must_match_local_user(connect):
    connect.account_metadata = {
        "app": "kankele",
        "taskmatch_user_id": str(connect.users["other"].id),
    }
    await call(connect, "POST", "/onboarding", json={"country": "FR"}, expected=502)
    async with connect.factory() as db:
        account = await db.get(StripeConnectAccount, connect.users["developer"].id)
        assert account.account_id is None


@pytest.mark.parametrize(
    "url",
    [
        "https://evil.test/steal",
        "https://connect.stripe.com.evil.test/steal",
        "http://connect.stripe.com/setup",
        "https://connect.stripe.com:invalid/setup",
    ],
)
async def test_only_stripe_https_redirects_are_returned(connect, url):
    connect.redirect = url
    await call(connect, "POST", "/onboarding", json={"country": "FR"}, expected=502)


async def test_sync_refreshes_only_own_account_and_keeps_stripe_mode_isolated(connect):
    await call(connect, "POST", "/onboarding", json={"country": "FR"})
    connect.active = True
    result = await call(connect, "POST", "/sync")
    assert result["transfers_enabled"] is True
    assert result["payouts_enabled"] is True
    assert result["requirements"] == []
    await call(connect, "POST", "/sync", role="other", expected=409)
    async with connect.factory() as db:
        account = await db.get(StripeConnectAccount, connect.users["developer"].id)
        account.livemode = True
        await db.commit()
    connect.calls.clear()
    await call(connect, "POST", "/sync", expected=409)
    assert connect.calls == []


async def test_dashboard_requires_own_existing_express_account(connect):
    await call(connect, "POST", "/dashboard", expected=409)
    await call(connect, "POST", "/onboarding", json={"country": "FR"})
    result = await call(connect, "POST", "/dashboard")
    assert result["url"].startswith("https://connect.stripe.com/")
    assert connect.calls[-1][1] == "/v1/accounts/acct_unit/login_links"


async def test_disabled_connect_does_not_create_local_or_remote_account(connect, monkeypatch):
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", None)
    assert (await call(connect, "GET", ""))["enabled"] is False
    await call(connect, "POST", "/onboarding", json={"country": "FR"}, expected=503)
    assert connect.calls == []


async def test_creation_requires_country_and_disallows_caller_supplied_identity(connect):
    await call(connect, "POST", "/onboarding", json={}, expected=422)
    await call(
        connect,
        "POST",
        "/onboarding",
        json={"country": "FR", "user_id": str(connect.users["other"].id)},
        expected=422,
    )
    assert connect.calls == []


async def test_invalid_iso_country_does_not_reserve_creation_attempt(connect):
    await call(connect, "POST", "/onboarding", json={"country": "ZZ"}, expected=422)
    async with connect.factory() as db:
        assert await db.get(StripeConnectAccount, connect.users["developer"].id) is None
    assert connect.calls == []


async def test_missing_account_event_id_cannot_match_pending_reservations(connect):
    async with connect.factory() as db:
        for name in ("developer", "other"):
            db.add(
                StripeConnectAccount(user_id=connect.users[name].id, country="FR", livemode=False)
            )
        await db.commit()
        assert await stripe_connect.apply_account_update(db, {}) is False
        assert await stripe_connect.apply_account_update(db, {"id": "acct_unknown"}) is False


async def test_verified_snapshot_requeues_only_this_developers_blocked_payout(connect):
    await call(connect, "POST", "/onboarding", json={"country": "FR"})
    payments = {}
    async with connect.factory() as db:
        job = Job(
            id=uuid.uuid4(),
            client_user_id=connect.users["client"].id,
            title="Funded work",
            raw_description="Test",
            budget_min=10,
            budget_max=20,
            status="completed",
        )
        db.add(job)
        await db.flush()
        for name in ("developer", "other"):
            payment = PaymentRecord(
                id=uuid.uuid4(),
                job_id=job.id,
                client_user_id=connect.users["client"].id,
                developer_user_id=connect.users[name].id,
                gross_amount=10,
                platform_fee=1,
                net_amount=9,
                currency="EUR",
                provider="stripe_connect",
                payment_status="blocked",
            )
            db.add(payment)
            payments[name] = payment.id
            db.add(
                BillingOperation(
                    key=f"transfer:{payment.id}",
                    kind="transfer",
                    entity_id=str(payment.id),
                    status="blocked",
                    last_error="Complete onboarding",
                )
            )
        await db.commit()
    connect.active = True
    await call(connect, "POST", "/sync")
    async with connect.factory() as db:
        for name in ("developer", "other"):
            operation = await db.scalar(
                select(BillingOperation).where(BillingOperation.key == f"transfer:{payments[name]}")
            )
            assert operation.status == ("pending" if name == "developer" else "blocked")
        # Same function used by the verified account webhook disables revoked capabilities.
        updated = await stripe_connect.apply_account_update(
            db,
            {
                "id": "acct_unit",
                "country": "FR",
                "metadata": {
                    "app": "taskmatch",
                    "taskmatch_user_id": str(connect.users["developer"].id),
                },
                "details_submitted": True,
                "payouts_enabled": False,
                "capabilities": {"transfers": "inactive"},
                "requirements": {
                    "currently_due": ["external_account"],
                    "past_due": ["external_account"],
                },
            },
        )
        assert updated is True
        account = await db.get(StripeConnectAccount, connect.users["developer"].id)
        assert account.transfers_enabled is False and account.payouts_enabled is False
        assert account.requirements_json == ["external_account"]


async def test_live_key_cannot_be_used_in_test_mode(connect, monkeypatch):
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_live_unit")
    await call(connect, "POST", "/onboarding", json={"country": "FR"}, expected=503)
    assert connect.calls == []
