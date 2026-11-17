"""Saved-payment consent and agent spending use real DB, fake provider boundary."""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select
from test_human_tasks import contract, principal
from test_lifecycle_integration import market as market
from test_lifecycle_integration import request

from app.core.config import settings
from app.models import Job


@pytest.fixture(autouse=True)
def enabled(monkeypatch):
    monkeypatch.setattr(settings, "HUMAN_TASKS_ENABLED", True)


async def test_payment_setup_requires_explicit_consent_and_owner(market):
    p = await principal(market)
    await request(
        market, "POST", f"/principals/{p['id']}/payment-method/setup", expected=422, json={}
    )
    await request(
        market,
        "POST",
        f"/principals/{p['id']}/payment-method/setup",
        role="stranger",
        expected=403,
        json={"allow_agent_payments": True},
    )
    await request(
        market, "GET", f"/principals/{p['id']}/payment-method", role="stranger", expected=403
    )


@pytest.fixture
def remote(monkeypatch):
    from app.services import autonomous_funding as fund
    from app.services import payment_authorization as auth

    class Gateway:
        status = "succeeded"
        calls = []
        setup = None
        customer = None
        payment = None
        charge = None

        async def request(self, method, path, data=None, idempotency_key=None):
            self.calls.append((method, path, data, idempotency_key))
            if method == "POST" and path == "/customers":
                self.customer = {
                    "id": "cus_saved",
                    "livemode": False,
                    "metadata": {k[9:-1]: v for k, v in data.items() if k.startswith("metadata[")},
                }
                return self.customer
            if path == "/customers/cus_saved":
                return self.customer
            if method == "POST" and path == "/checkout/sessions":
                self.setup = {
                    "id": "cs_setup",
                    "mode": "setup",
                    "status": "complete",
                    "livemode": False,
                    "customer": data["customer"],
                    "url": "https://checkout.stripe.com/setup",
                    "setup_intent": "seti_saved",
                    "client_reference_id": data["client_reference_id"],
                    "metadata": {k[9:-1]: v for k, v in data.items() if k.startswith("metadata[")},
                }
                return self.setup
            if path == "/checkout/sessions/cs_setup":
                return self.setup
            if path == "/setup_intents/seti_saved":
                return {
                    "id": "seti_saved",
                    "status": "succeeded",
                    "usage": "off_session",
                    "customer": "cus_saved",
                    "payment_method": "pm_saved",
                    "livemode": False,
                    "metadata": self.setup["metadata"],
                }
            if path == "/payment_methods/pm_saved":
                return {
                    "id": "pm_saved",
                    "customer": "cus_saved",
                    "livemode": False,
                    "type": "card",
                    "card": {"brand": "visa", "last4": "4242"},
                }
            if method == "POST" and path == "/payment_intents":
                assert data["off_session"] == "true" and data["confirm"] == "true"
                meta = {k[9:-1]: v for k, v in data.items() if k.startswith("metadata[")}
                self.payment = {
                    "id": "pi_saved",
                    "status": self.status,
                    "amount": data["amount"],
                    "amount_received": data["amount"] if self.status == "succeeded" else 0,
                    "currency": "eur",
                    "livemode": False,
                    "customer": "cus_saved",
                    "payment_method": "pm_saved",
                    "metadata": meta,
                    "latest_charge": "ch_saved" if self.status == "succeeded" else None,
                }
                self.charge = {
                    "id": "ch_saved",
                    "payment_intent": "pi_saved",
                    "amount": data["amount"],
                    "currency": "eur",
                    "livemode": False,
                    "paid": True,
                    "captured": True,
                    "amount_refunded": 0,
                    "disputed": False,
                    "metadata": meta,
                }
                return self.payment
            if method == "GET" and path == "/payment_intents":
                return {"data": [self.payment] if self.payment else [], "has_more": False}
            if path == "/payment_intents/pi_saved":
                return self.payment
            if method == "POST" and path == "/payment_intents/pi_saved/cancel":
                self.payment = {**self.payment, "status": "canceled"}
                return self.payment
            if path == "/charges/ch_saved":
                return self.charge
            raise AssertionError((method, path))

    gateway = Gateway()
    gateway.calls = []
    monkeypatch.setattr(auth, "get_gateway", lambda: gateway)
    monkeypatch.setattr(fund, "get_gateway", lambda: gateway)
    return gateway


async def ready(m, remote):
    p = await principal(m, role="developer")
    d = await request(
        m,
        "POST",
        f"/principals/{p['id']}/delegations",
        role="developer",
        expected=201,
        json={
            "agent_id": str(m.agent.id),
            "max_amount_minor": 1100,
            "categories": ["translation_review"],
            "expires_at": (datetime.now(UTC) + timedelta(hours=1)).isoformat(),
        },
    )
    headers = {"Authorization": "Bearer " + d["access_token"], "Idempotency-Key": "payment-task"}
    body = contract(
        p["id"],
        requester_type="AGENT_REQUESTER",
        requesting_agent_id=str(m.agent.id),
        delegation_id=d["id"],
    )
    response = await m.http.post("/human-tasks", json=body, headers=headers)
    assert response.status_code == 201, response.text
    t = response.json()
    await request(
        m,
        "POST",
        f"/human-tasks/{t['task_id']}/publish",
        role="admin",
        json={
            "authorizations_verified": True,
            "qualifications_verified": True,
            "notes": "Permissions checked",
        },
    )
    setup = await request(
        m,
        "POST",
        f"/principals/{p['id']}/payment-method/setup",
        role="developer",
        json={"allow_agent_payments": True},
    )
    assert setup["url"].startswith("https://")
    status = await request(
        m, "POST", f"/principals/{p['id']}/payment-method/confirm", role="developer", json={}
    )
    assert status["ready"] is True
    return p, d, t, headers


async def test_agent_funding_is_durable_idempotent_and_uses_captured_proof(market, remote):
    from app.models.billing import BillingOperation, JobFunding
    from app.services import autonomous_funding as fund

    p, d, t, headers = await ready(market, remote)
    for _ in range(2):
        r = await market.http.post(f"/human-tasks/{t['task_id']}/fund", headers=headers)
        assert r.status_code == 202, r.text
    async with market.db() as db:
        ops = (
            await db.scalars(
                select(BillingOperation).where(BillingOperation.kind == "fund_human_job")
            )
        ).all()
        assert len(ops) == 1
        op_id = ops[0].id
    await fund.process_funding(op_id, market.db)
    await fund.process_funding(op_id, market.db)
    assert len([x for x in remote.calls if x[:2] == ("POST", "/payment_intents")]) == 1
    async with market.db() as db:
        funding = await db.scalar(
            select(JobFunding).where(JobFunding.job_id == uuid.UUID(t["parent_job_id"]))
        )
        assert (
            funding.status == "paid"
            and funding.amount_minor == 1100
            and funding.charge_id == "ch_saved"
        )
        assert (await db.get(Job, funding.job_id)).status == "bidding"


async def test_revoked_delegation_blocks_a_charge_not_yet_started(market, remote):
    from app.models.billing import BillingOperation
    from app.services import autonomous_funding as fund
    from app.services.billing_processors import BillingBlocked

    p, d, t, headers = await ready(market, remote)
    assert (
        await market.http.post(f"/human-tasks/{t['task_id']}/fund", headers=headers)
    ).status_code == 202
    await request(
        market, "DELETE", f"/principals/{p['id']}/delegations/{d['id']}", role="developer"
    )
    async with market.db() as db:
        op = await db.scalar(
            select(BillingOperation).where(BillingOperation.kind == "fund_human_job")
        )
    with pytest.raises(BillingBlocked):
        await fund.process_funding(op.id, market.db)
    assert not [x for x in remote.calls if x[:2] == ("POST", "/payment_intents")]


async def test_bank_authentication_never_authorizes_execution(market, remote):
    from app.models.billing import BillingOperation, JobFunding
    from app.services import autonomous_funding as fund

    p, d, t, headers = await ready(market, remote)
    remote.status = "requires_action"
    assert (
        await market.http.post(f"/human-tasks/{t['task_id']}/fund", headers=headers)
    ).status_code == 202
    async with market.db() as db:
        op = await db.scalar(
            select(BillingOperation).where(BillingOperation.kind == "fund_human_job")
        )
    await fund.process_funding(op.id, market.db)
    async with market.db() as db:
        funding = await db.scalar(
            select(JobFunding).where(JobFunding.job_id == uuid.UUID(t["parent_job_id"]))
        )
        assert funding.status != "paid" and (await db.get(Job, funding.job_id)).status == "quoted"


async def test_recovery_requires_owner_and_cancels_before_new_payment(market, remote):
    from app.models.billing import BillingOperation, JobFunding
    from app.services import autonomous_funding as fund

    p, d, t, headers = await ready(market, remote)
    remote.status = "requires_action"
    await market.http.post(f"/human-tasks/{t['task_id']}/fund", headers=headers)
    async with market.db() as db:
        op = await db.scalar(
            select(BillingOperation).where(BillingOperation.kind == "fund_human_job")
        )
    await fund.process_funding(op.id, market.db)
    await request(
        market,
        "POST",
        f"/human-tasks/{t['task_id']}/fund/recover",
        role="stranger",
        expected=403,
        json={},
    )
    recovered = await request(
        market, "POST", f"/human-tasks/{t['task_id']}/fund/recover", role="developer", json={}
    )
    assert recovered["status"] == "cancelled"
    assert (
        len([c for c in remote.calls if c[:2] == ("POST", "/payment_intents/pi_saved/cancel")]) == 1
    )
    async with market.db() as db:
        funding = await db.scalar(
            select(JobFunding).where(JobFunding.job_id == uuid.UUID(t["parent_job_id"]))
        )
        assert (
            funding.payment_intent_id is None
            and (await db.get(BillingOperation, op.id)).status == "cancelled"
        )


async def test_wrong_captured_amount_never_starts_execution(market, remote):
    from app.models.billing import BillingOperation, JobFunding
    from app.services import autonomous_funding as fund
    from app.services.billing_processors import BillingBlocked

    p, d, t, headers = await ready(market, remote)
    await market.http.post(f"/human-tasks/{t['task_id']}/fund", headers=headers)
    async with market.db() as db:
        op = await db.scalar(
            select(BillingOperation).where(BillingOperation.kind == "fund_human_job")
        )
    old = remote.request

    async def incorrect(method, path, **kwargs):
        value = await old(method, path, **kwargs)
        if path == "/charges/ch_saved":
            value = {**value, "amount": 1099}
        return value

    remote.request = incorrect
    with pytest.raises(BillingBlocked):
        await fund.process_funding(op.id, market.db)
    async with market.db() as db:
        assert (await db.get(Job, uuid.UUID(t["parent_job_id"]))).status == "quoted"
        assert (
            await db.scalar(
                select(JobFunding).where(JobFunding.job_id == uuid.UUID(t["parent_job_id"]))
            )
        ).status != "paid"


@pytest.mark.parametrize("terminal", ["paid", "refund_pending", "refunded", "disputed"])
async def test_stale_payment_status_never_regresses_captured_or_frozen_funding(
    market, remote, terminal
):
    from app.models.billing import BillingOperation, JobFunding
    from app.services import autonomous_funding as fund

    p, d, t, headers = await ready(market, remote)
    await market.http.post(f"/human-tasks/{t['task_id']}/fund", headers=headers)
    async with market.db() as db:
        op = await db.scalar(
            select(BillingOperation).where(BillingOperation.kind == "fund_human_job")
        )
    await fund.process_funding(op.id, market.db)
    async with market.db() as db:
        funding = await db.scalar(
            select(JobFunding).where(JobFunding.job_id == uuid.UUID(t["parent_job_id"]))
        )
        funding.status = terminal
        await db.commit()
        await fund.verify_intent(
            db, funding, {**remote.payment, "status": "processing", "amount_received": 0}
        )
        await db.commit()
        await db.refresh(funding)
        assert funding.status == terminal


async def test_realistic_http_402_is_reconciled_before_manual_recovery(market, remote):
    from app.services import billing_worker
    from app.services.stripe_gateway import StripeGatewayError

    p, d, t, headers = await ready(market, remote)
    remote.status = "requires_action"
    await market.http.post(f"/human-tasks/{t['task_id']}/fund", headers=headers)
    old = remote.request

    async def decline(method, path, **kwargs):
        value = await old(method, path, **kwargs)
        if method == "POST" and path == "/payment_intents":
            raise StripeGatewayError(
                "The bank requires further action", status_code=402, retryable=False
            )
        return value

    remote.request = decline
    await billing_worker.run_once(market.db, execution=False)
    status = await request(market, "GET", f"/human-tasks/{t['task_id']}/fund", role="developer")
    assert status["status"] == "requires_review"
    recovered = await request(
        market, "POST", f"/human-tasks/{t['task_id']}/fund/recover", role="developer", json={}
    )
    assert recovered["status"] == "cancelled"
    assert len([c for c in remote.calls if c[:2] == ("POST", "/payment_intents")]) == 1
    assert (
        len([c for c in remote.calls if c[:2] == ("POST", "/payment_intents/pi_saved/cancel")]) == 1
    )


async def test_expired_setup_is_replaced_under_new_explicit_consent(market, remote):
    from app.models.payment_authorization import PaymentAuthorization

    p = await principal(market)
    await request(
        market,
        "POST",
        f"/principals/{p['id']}/payment-method/setup",
        json={"allow_agent_payments": True},
    )
    remote.setup["status"] = "expired"
    old = remote.request

    async def renewed(method, path, **kwargs):
        value = await old(method, path, **kwargs)
        if method == "POST" and path == "/customers":
            value["id"] = "cus_new"
        if method == "POST" and path == "/checkout/sessions":
            value["id"] = "cs_setup_new"
        return value

    remote.request = renewed
    r = await request(
        market,
        "POST",
        f"/principals/{p['id']}/payment-method/setup",
        json={"allow_agent_payments": True},
    )
    assert r["status"] == "pending"
    async with market.db() as db:
        rows = (
            await db.scalars(
                select(PaymentAuthorization).where(
                    PaymentAuthorization.principal_id == uuid.UUID(p["id"])
                )
            )
        ).all()
        assert len(rows) == 2 and {a.status for a in rows} == {"expired", "pending"}


async def test_queued_payment_cannot_start_after_its_quote_expires(market, remote):
    from app.models import Quote
    from app.models.billing import BillingOperation
    from app.services import autonomous_funding as fund
    from app.services.billing_processors import BillingBlocked

    _, _, task, headers = await ready(market, remote)
    response = await market.http.post(f"/human-tasks/{task['task_id']}/fund", headers=headers)
    assert response.status_code == 202, response.text
    async with market.db() as db:
        operation = await db.scalar(select(BillingOperation).where(BillingOperation.kind == 'fund_human_job'))
        quote = await db.scalar(select(Quote).where(Quote.job_id == uuid.UUID(task['parent_job_id'])))
        quote.valid_until = datetime.now(UTC) - timedelta(seconds=1)
        await db.commit()
    with pytest.raises(BillingBlocked, match='quote'):
        await fund.process_funding(operation.id, market.db)
    assert not [call for call in remote.calls if call[:2] == ('POST', '/payment_intents')]
