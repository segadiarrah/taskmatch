"""Stripe HTTP/domain regressions, with no real funds or production data."""

import asyncio
import copy
import hashlib
import hmac
import json
import time
import uuid
from datetime import timedelta
from urllib.parse import parse_qs

import httpx
import pytest
import pytest_asyncio
from sqlalchemy import func, select

from app.core.config import settings
from app.models.billing import BillingOperation, StripeEvent
from app.models.job import Job
from app.models.task import Task
from app.services import billing_service as billing
from app.services.stripe_gateway import StripeGateway
from tests.test_lifecycle_integration import market as market_fixture
from tests.test_lifecycle_integration import planned_job, request

market = market_fixture


class FakeStripe:
    def __init__(self):
        self.sessions = {}
        self.intents = {}
        self.charges = {}
        self.keys = {}
        self.calls = []
        self.hook = None
        self.lose_create = False

    async def handle(self, req):
        path = req.url.path.removeprefix("/v1")
        data = {k: v[0] for k, v in parse_qs(req.content.decode()).items()}
        self.calls.append((req.method, path, data, req.headers.get("idempotency-key")))
        key = req.headers.get("idempotency-key")
        if req.method == "POST" and path == "/checkout/sessions":
            if key not in self.keys:
                idx = len(self.sessions) + 1
                sid = f"cs_test_{idx}"
                meta = {k[9:-1]: v for k, v in data.items() if k.startswith("metadata[")}
                session = {
                    "id": sid,
                    "url": f"https://checkout.stripe.com/c/pay/{sid}",
                    "metadata": meta,
                    "livemode": False,
                    "client_reference_id": data["client_reference_id"],
                    "amount_total": int(data["line_items[0][price_data][unit_amount]"]),
                    "currency": data["line_items[0][price_data][currency]"],
                    "payment_status": "unpaid",
                    "status": "open",
                    "payment_intent": None,
                }
                self.sessions[sid] = session
                self.keys[key] = copy.deepcopy(session)
            if self.lose_create:
                raise httpx.ReadTimeout("lost response")
            return httpx.Response(200, json=self.keys[key])
        if req.method == "GET" and path.startswith("/checkout/sessions/"):
            result = copy.deepcopy(self.sessions[path.rsplit("/", 1)[-1]])
            if self.hook:
                hook, self.hook = self.hook, None
                await hook()
            return httpx.Response(200, json=result)
        if req.method == "POST" and path.endswith("/expire"):
            session = self.sessions[path.split("/")[-2]]
            session["status"] = "expired"
            return httpx.Response(200, json=session)
        if path.startswith("/charges/"):
            return httpx.Response(200, json=self.charges[path.rsplit("/", 1)[-1]])
        if path.startswith("/payment_intents/"):
            return httpx.Response(200, json=self.intents[path.rsplit("/", 1)[-1]])
        raise AssertionError(f"Unexpected Stripe call {req.method} {path}")

    def pay(self, session_id):
        session = self.sessions[session_id]
        charge = {
            "id": f"ch_{session_id}",
            "payment_intent": f"pi_{session_id}",
            "amount": session["amount_total"],
            "currency": session["currency"],
            "livemode": False,
            "paid": True,
            "captured": True,
            "refunded": False,
            "amount_refunded": 0,
            "disputed": False,
            "metadata": session["metadata"],
            "receipt_url": "https://pay.stripe.com/receipts/test",
        }
        intent = {
            "id": charge["payment_intent"],
            "status": "succeeded",
            "amount_received": charge["amount"],
            "currency": charge["currency"],
            "livemode": False,
            "metadata": session["metadata"],
            "latest_charge": charge,
        }
        session.update(payment_status="paid", status="complete", payment_intent=intent)
        self.intents[intent["id"]] = intent
        self.charges[charge["id"]] = charge
        return session


@pytest_asyncio.fixture
async def stripe(market, monkeypatch):
    monkeypatch.setattr(settings, "PAYMENT_MODE", "stripe")
    fake = FakeStripe()
    gateway = StripeGateway(
        "sk_test_local", transport=httpx.MockTransport(fake.handle), retry_delay=0
    )
    monkeypatch.setattr(billing, "get_gateway", lambda: gateway)
    return fake


async def checkout(market):
    plan = await planned_job(market)
    job_id = plan["job"]["id"]
    session = await request(market, "POST", f"/billing/jobs/{job_id}/checkout")
    return job_id, session


async def test_webhook_rejects_untrusted_body(market):
    response = await market.http.post(
        "/billing/webhook", content=b"{}", headers={"Stripe-Signature": "t=0,v1=bad"}
    )
    assert response.status_code == 400


async def test_checkout_is_idempotent_and_unpaid_return_cannot_start_work(market, stripe):
    job_id, first = await checkout(market)
    second = await request(market, "POST", f"/jobs/{job_id}/quote/accept")
    assert first == second
    assert len(stripe.sessions) == 1
    assert (
        next(call[2] for call in stripe.calls if call[0] == "POST")["adaptive_pricing[enabled]"]
        == "false"
    )
    view = await request(market, "POST", f"/billing/jobs/{job_id}/sync")
    assert view["status"] == "checkout_pending"
    async with market.db() as db:
        assert (await db.get(Job, uuid.UUID(job_id))).status == "quoted"
        assert set((await db.scalars(select(Task.status))).all()) == {"pending"}


async def test_paid_confirmation_is_exact_and_queues_execution_once(market, stripe):
    job_id, cs = await checkout(market)
    stripe.pay(cs["session_id"])
    for _ in range(2):
        view = await request(market, "POST", f"/billing/jobs/{job_id}/sync")
        assert view["status"] == "paid"
    async with market.db() as db:
        assert (await db.get(Job, uuid.UUID(job_id))).status == "bidding"
        assert (
            await db.scalar(
                select(func.count())
                .select_from(BillingOperation)
                .where(BillingOperation.kind == "execute")
            )
            == 1
        )


@pytest.mark.parametrize(
    "field,value",
    [
        ("amount_total", 1),
        ("currency", "eur"),
        ("livemode", True),
        ("client_reference_id", "other"),
    ],
)
async def test_mismatched_checkout_never_authorizes_work(market, stripe, field, value):
    job_id, cs = await checkout(market)
    stripe.pay(cs["session_id"])[field] = value
    await request(market, "POST", f"/billing/jobs/{job_id}/sync", expected=409)
    async with market.db() as db:
        assert (await db.get(Job, uuid.UUID(job_id))).status == "quoted"


@pytest.mark.parametrize(
    "state", ["refunded", "partially_refunded", "disputed", "uncaptured", "wrong_charge"]
)
async def test_charge_state_is_checked_before_first_confirmation(market, stripe, state):
    job_id, cs = await checkout(market)
    session = stripe.pay(cs["session_id"])
    charge = session["payment_intent"]["latest_charge"]
    if state in ("refunded", "partially_refunded"):
        charge["amount_refunded"] = charge["amount"] if state == "refunded" else 1
        charge["refunded"] = state == "refunded"
    elif state == "disputed":
        charge["disputed"] = True
    elif state == "uncaptured":
        charge["captured"] = False
    else:
        charge["payment_intent"] = "pi_another"
    response = await market.http.post(
        f"/billing/jobs/{job_id}/sync", headers=market.headers["owner"]
    )
    assert response.status_code in (200, 409)
    async with market.db() as db:
        assert (await db.get(Job, uuid.UUID(job_id))).status == "quoted"
        assert (
            await db.scalar(
                select(func.count())
                .select_from(BillingOperation)
                .where(BillingOperation.kind == "execute")
            )
            == 0
        )
        funding = await billing.latest_funding(db, uuid.UUID(job_id))
        assert funding.status != "paid"
        if state in ("refunded", "partially_refunded", "disputed"):
            assert funding.status == state


@pytest.mark.parametrize("action", ["checkout", "sync", "cancel"])
async def test_stale_expired_session_does_not_overwrite_new_generation(market, stripe, action):
    job_id, cs = await checkout(market)
    stripe.sessions[cs["session_id"]]["status"] = "expired"

    async def next_generation():
        async with market.db() as db:
            fund = await billing.latest_funding(db, uuid.UUID(job_id))
            fund.generation += 1
            fund.checkout_session_id = "cs_test_newer"
            fund.checkout_url = "https://checkout.stripe.com/c/pay/cs_test_newer"
            fund.status = "checkout_pending"
            await db.commit()

    stripe.hook = next_generation
    response = await market.http.post(
        f"/billing/jobs/{job_id}/{action}", headers=market.headers["owner"]
    )
    assert response.status_code in (200, 409)
    async with market.db() as db:
        fund = await billing.latest_funding(db, uuid.UUID(job_id))
        assert fund.generation == 2
        assert fund.checkout_session_id == "cs_test_newer"
        assert fund.status == "checkout_pending"
    assert len(stripe.sessions) == 1


async def test_other_users_cannot_pay_cancel_or_view_funding(market, stripe):
    job_id, _ = await checkout(market)
    for path in ("checkout", "cancel", "sync"):
        await request(
            market, "POST", f"/billing/jobs/{job_id}/{path}", role="stranger", expected=403
        )
    await request(market, "GET", f"/billing/jobs/{job_id}", role="stranger", expected=403)


async def signed_event(market, event):
    body = json.dumps(event).encode()
    stamp = str(int(time.time()))
    signature = hmac.new(
        settings.STRIPE_WEBHOOK_SECRET.encode(), stamp.encode() + b"." + body, hashlib.sha256
    ).hexdigest()
    response = await market.http.post(
        "/billing/webhook", content=body, headers={"Stripe-Signature": f"t={stamp},v1={signature}"}
    )
    assert response.status_code == 200, response.text
    return response.json()


async def test_webhook_durable_dedup_and_other_app_isolation(market, stripe):
    _, cs = await checkout(market)
    session = stripe.pay(cs["session_id"])
    event = {
        "id": "evt_test",
        "type": "checkout.session.completed",
        "livemode": False,
        "data": {"object": session},
    }
    await signed_event(market, event)
    await signed_event(market, event)
    other = copy.deepcopy(event)
    other["id"] = "evt_other"
    other["data"]["object"]["metadata"]["app"] = "kankele"
    assert (await signed_event(market, other))["ignored"]
    async with market.db() as db:
        assert await db.scalar(select(func.count()).select_from(StripeEvent)) == 1
        assert (
            await db.scalar(
                select(func.count())
                .select_from(BillingOperation)
                .where(BillingOperation.kind == "stripe_event")
            )
            == 1
        )


async def test_preconfirmation_refund_event_is_durable(market, stripe):
    _, cs = await checkout(market)
    charge = stripe.pay(cs["session_id"])["payment_intent"]["latest_charge"]
    charge["refunded"] = True
    charge["amount_refunded"] = charge["amount"]
    event = {
        "id": "evt_refund_first",
        "type": "charge.refunded",
        "livemode": False,
        "data": {"object": charge},
    }
    assert not (await signed_event(market, event)).get("ignored")
    async with market.db() as db:
        assert await db.get(StripeEvent, event["id"])


async def test_unknown_checkout_recovery_reuses_exact_request_after_expiry(
    market, stripe, monkeypatch
):
    plan = await planned_job(market)
    job_id = plan["job"]["id"]
    stripe.lose_create = True
    await request(market, "POST", f"/billing/jobs/{job_id}/checkout", expected=503)
    async with market.db() as db:
        fund = await billing.latest_funding(db, uuid.UUID(job_id))
        assert fund.checkout_session_id is None
        later = fund.checkout_started_at + timedelta(hours=2)
    stripe.lose_create = False
    stripe.sessions["cs_test_1"]["status"] = "expired"
    monkeypatch.setattr(billing, "now", lambda: later)
    view = await request(market, "POST", f"/billing/jobs/{job_id}/checkout")
    assert view["status"] == "expired"
    assert len(stripe.sessions) == 1
    creates = [
        call for call in stripe.calls if call[0] == "POST" and call[1] == "/checkout/sessions"
    ]
    assert len({call[3] for call in creates}) == 1
    assert all(call[2] == creates[0][2] for call in creates)


async def test_old_unknown_checkout_needs_verified_operator_reconciliation(
    market, stripe, monkeypatch
):
    plan = await planned_job(market)
    job_id = plan["job"]["id"]
    stripe.lose_create = True
    await request(market, "POST", f"/billing/jobs/{job_id}/checkout", expected=503)
    async with market.db() as db:
        fund = await billing.latest_funding(db, uuid.UUID(job_id))
        later = fund.checkout_started_at + timedelta(hours=25)
    stripe.lose_create = False
    stripe.sessions["cs_test_1"]["status"] = "expired"
    monkeypatch.setattr(billing, "now", lambda: later)
    calls = len(stripe.calls)
    await request(market, "POST", f"/billing/jobs/{job_id}/checkout", expected=409)
    assert len(stripe.calls) == calls
    await request(
        market,
        "POST",
        f"/billing/jobs/{job_id}/reconcile",
        json={"session_id": "cs_test_1"},
        expected=403,
    )
    result = await request(
        market,
        "POST",
        f"/billing/jobs/{job_id}/reconcile",
        role="admin",
        json={"session_id": "cs_test_1"},
    )
    assert result["status"] == "expired"
    assert len(stripe.sessions) == 1


async def test_simultaneous_checkout_creation_uses_one_remote_session(market, stripe):
    plan = await planned_job(market)
    job_id = plan["job"]["id"]
    responses = await asyncio.gather(
        *(
            market.http.post(f"/billing/jobs/{job_id}/checkout", headers=market.headers["owner"])
            for _ in range(4)
        )
    )
    assert all(r.status_code == 200 for r in responses)
    assert len({r.json()["session_id"] for r in responses}) == 1
    assert len(stripe.sessions) == 1


async def test_admin_payment_dto_serializes_numeric_amounts_and_explicit_legacy_policy(market):
    from decimal import Decimal

    from app.models.payment import PaymentRecord

    async with market.db() as db:
        job = Job(
            client_user_id=market.users["owner"].id,
            title="Historical delivery",
            raw_description="Report",
            budget_min=1,
            budget_max=10,
            currency="EUR",
            status="completed",
            billing_mode="legacy_manual",
        )
        db.add(job)
        await db.flush()
        payment = PaymentRecord(
            job_id=job.id,
            client_user_id=job.client_user_id,
            gross_amount=Decimal("10.00"),
            platform_fee=Decimal("1.25"),
            net_amount=Decimal("8.75"),
            currency="EUR",
            payment_status="releasable",
            provider="stripe",
        )
        db.add(payment)
        await db.commit()
    rows = await request(market, "GET", "/admin/payments", role="admin")
    row = next(item for item in rows if item["id"] == str(payment.id))
    assert isinstance(row["gross_amount"], (int, float))
    assert row["gross_amount"] == 10.0 and row["platform_fee"] == 1.25 and row["net_amount"] == 8.75
    assert row["billing_mode"] == "legacy_manual"
    assert row["provider"] == "stripe" and row["funding_id"] is None
