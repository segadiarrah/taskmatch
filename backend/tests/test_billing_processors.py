"""Financial recovery uses real PostgreSQL state and a fake Stripe HTTP boundary."""

import copy
import uuid
from datetime import timedelta
from types import SimpleNamespace
from urllib.parse import parse_qs

import httpx
import pytest
import pytest_asyncio
from sqlalchemy import select

from app.models.billing import BillingOperation, JobFunding, StripeConnectAccount, StripeEvent
from app.models.job import Job
from app.models.payment import PaymentRecord
from app.models.quote import Quote
from app.services import billing_processors as processors
from app.services import billing_service as billing
from app.services.stripe_gateway import StripeGateway
from tests.test_lifecycle_integration import market as _market_fixture

market = _market_fixture


@pytest_asyncio.fixture
async def money(market, monkeypatch):
    async with market.db() as db:
        job = Job(
            id=uuid.uuid4(),
            client_user_id=market.users["owner"].id,
            title="Delivered work",
            raw_description="Report",
            budget_min=100,
            budget_max=100,
            currency="EUR",
            status="completed",
            billing_mode="stripe",
        )
        db.add(job)
        await db.flush()
        quote = Quote(
            id=uuid.uuid4(),
            job_id=job.id,
            status="accepted",
            currency="EUR",
            subtotal=90,
            platform_fee=10,
            total=100,
            pricing_version="test",
        )
        db.add(quote)
        await db.flush()
        funding = JobFunding(
            id=uuid.uuid4(),
            job_id=job.id,
            quote_id=quote.id,
            client_user_id=job.client_user_id,
            amount_minor=10000,
            currency="eur",
            livemode=False,
            status="paid",
            checkout_session_id="cs_unit",
            payment_intent_id="pi_unit",
            charge_id="ch_unit",
        )
        db.add(funding)
        await db.flush()
        payment = PaymentRecord(
            id=uuid.uuid4(),
            job_id=job.id,
            client_user_id=job.client_user_id,
            developer_user_id=market.users["developer"].id,
            gross_amount=100,
            platform_fee=10,
            net_amount=90,
            currency="EUR",
            payment_status="releasable",
            provider="stripe_connect",
            funding_id=funding.id,
        )
        db.add(payment)
        db.add(
            StripeConnectAccount(
                user_id=payment.developer_user_id,
                account_id="acct_unit",
                country="FR",
                livemode=False,
                transfers_enabled=True,
                payouts_enabled=True,
                details_submitted=True,
            )
        )
        await db.commit()
    state = SimpleNamespace(
        db=market.db,
        job=job,
        quote=quote,
        funding=funding,
        payment=payment,
        calls=[],
        transfers=[],
        refunds={},
        refund_status="succeeded",
        reversals={},
    )
    state.charge = {
        "id": "ch_unit",
        "payment_intent": "pi_unit",
        "amount": 10000,
        "amount_captured": 10000,
        "amount_refunded": 0,
        "currency": "eur",
        "livemode": False,
        "paid": True,
        "captured": True,
        "refunded": False,
        "disputed": False,
        "metadata": billing.metadata(funding),
    }
    state.dispute = {
        "id": "dp_unit",
        "charge": "ch_unit",
        "payment_intent": "pi_unit",
        "currency": "eur",
        "amount": 10000,
        "livemode": False,
        "status": "won",
    }
    state.session = {
        "id": "cs_unit",
        "status": "complete",
        "payment_status": "paid",
        "amount_total": 10000,
        "currency": "eur",
        "livemode": False,
        "client_reference_id": f"taskmatch:{funding.id}",
        "metadata": billing.metadata(funding),
        "payment_intent": {
            "id": "pi_unit",
            "status": "succeeded",
            "amount_received": 10000,
            "currency": "eur",
            "livemode": False,
            "metadata": billing.metadata(funding),
            "latest_charge": state.charge,
        },
    }

    def remote_transfer(identifier="tr_unit"):
        return {
            "id": identifier,
            "amount": 9000,
            "currency": "eur",
            "destination": "acct_unit",
            "source_transaction": "ch_unit",
            "transfer_group": f"taskmatch:{job.id}",
            "livemode": False,
            "reversed": False,
            "amount_reversed": 0,
            "metadata": {
                "app": "taskmatch",
                "taskmatch_payment_id": str(payment.id),
                "taskmatch_funding_id": str(funding.id),
            },
        }

    state.remote_transfer = remote_transfer

    async def respond(request):
        data = (
            dict(request.url.params)
            if request.method == "GET"
            else {key: values[0] for key, values in parse_qs(request.content.decode()).items()}
        )
        path = request.url.path.removeprefix("/v1")
        state.calls.append((request.method, path, data, request.headers.get("Idempotency-Key")))
        if request.method == "GET":
            if path == "/charges/ch_unit":
                return httpx.Response(200, json=state.charge)
            if path == "/accounts/acct_unit":
                return httpx.Response(
                    200,
                    json={
                        "id": "acct_unit",
                        "capabilities": {"transfers": "active"},
                        "payouts_enabled": True,
                        "metadata": {
                            "app": "taskmatch",
                            "taskmatch_user_id": str(payment.developer_user_id),
                        },
                    },
                )
            if path == "/transfers":
                # Deliberately paginate at one item to exercise complete reconciliation.
                start = next(
                    (
                        i + 1
                        for i, item in enumerate(state.transfers)
                        if item["id"] == data.get("starting_after")
                    ),
                    0,
                )
                return httpx.Response(
                    200,
                    json={
                        "data": state.transfers[start : start + 1],
                        "has_more": start + 1 < len(state.transfers),
                    },
                )
            if path.startswith("/transfers/") and path.endswith("/reversals"):
                return httpx.Response(
                    200,
                    json={"data": state.reversals.get(path.split("/")[2], []), "has_more": False},
                )
            if path.startswith("/transfers/"):
                return httpx.Response(
                    200,
                    json=next(item for item in state.transfers if item["id"] == path.split("/")[2]),
                )
            if path.startswith("/refunds/"):
                return httpx.Response(200, json=state.refunds[path.split("/")[2]])
            if path == "/refunds":
                return httpx.Response(
                    200, json={"data": list(state.refunds.values()), "has_more": False}
                )
            if path == "/disputes/dp_unit":
                return httpx.Response(200, json=state.dispute)
            if path == "/checkout/sessions":
                return httpx.Response(200, json={"data": [state.session], "has_more": False})
            if path == "/checkout/sessions/cs_unit":
                return httpx.Response(200, json=state.session)
        if request.method == "POST":
            if path == "/transfers":
                result = remote_transfer()
                state.transfers.append(result)
                return httpx.Response(200, json=result)
            if path == "/refunds":
                result = {
                    "id": f"re_unit{len(state.refunds) + 1}",
                    "charge": "ch_unit",
                    "payment_intent": "pi_unit",
                    "amount": int(data.get("amount", 10000 - state.charge["amount_refunded"])),
                    "currency": "eur",
                    "status": state.refund_status,
                    "metadata": {
                        key[9:-1]: value
                        for key, value in data.items()
                        if key.startswith("metadata[")
                    },
                }
                state.refunds[result["id"]] = result
                if state.refund_status == "succeeded":
                    state.charge["amount_refunded"] += result["amount"]
                    state.charge["refunded"] = state.charge["amount_refunded"] == 10000
                return httpx.Response(200, json=result)
            if path.endswith("/reversals"):
                transfer = next(
                    item for item in state.transfers if item["id"] == path.split("/")[2]
                )
                amount = int(data.get("amount", transfer["amount"]))
                assert amount <= transfer["amount"] - transfer["amount_reversed"]
                result = {
                    "id": "trr_unit",
                    "transfer": transfer["id"],
                    "amount": amount,
                    "currency": "eur",
                }
                state.reversals.setdefault(transfer["id"], []).append(result)
                transfer["amount_reversed"] += amount
                transfer["reversed"] = transfer["amount_reversed"] == transfer["amount"]
                return httpx.Response(200, json=result)
        raise AssertionError(f"Unexpected provider request {request.method} {path}")

    gateway = StripeGateway("sk_test_unit", transport=httpx.MockTransport(respond), retry_delay=0)
    monkeypatch.setattr(processors, "get_gateway", lambda: gateway)
    monkeypatch.setattr(billing, "get_gateway", lambda: gateway)
    return state


async def operation(money, kind, *, age_hours=None, payload=None):
    async with money.db() as db:
        item = BillingOperation(
            id=uuid.uuid4(),
            kind=kind,
            key=f"{kind}:{uuid.uuid4()}",
            entity_id=str(money.payment.id if kind == "transfer" else money.funding.id),
            payload=payload,
            external_started_at=billing.now() - timedelta(hours=age_hours)
            if age_hours is not None
            else None,
        )
        db.add(item)
        await db.commit()
        return item


async def event_operation(money, kind, obj):
    async with money.db() as db:
        event = StripeEvent(
            id=f"evt_{uuid.uuid4().hex}",
            event_type=kind,
            livemode=False,
            payload={"data": {"object": obj}},
        )
        item = BillingOperation(kind="stripe_event", key=f"event:{event.id}", entity_id=event.id)
        db.add_all([event, item])
        await db.commit()
        return item


async def funding_status(money, value):
    async with money.db() as db:
        funding = await db.get(JobFunding, money.funding.id)
        funding.status = value
        await db.commit()


@pytest.mark.parametrize(
    "status", ["refund_pending", "refunded", "partially_refunded", "requires_review"]
)
async def test_dispute_won_cannot_lift_existing_financial_freeze(money, status):
    await funding_status(money, status)
    item = await event_operation(
        money, "charge.dispute.closed", {"id": "dp_unit", "charge": "ch_unit"}
    )
    await processors.process_event(item.id, money.db)
    async with money.db() as db:
        assert (await db.get(JobFunding, money.funding.id)).status == status


async def test_dispute_won_restores_only_unreserved_disputed_funding(money):
    await funding_status(money, "disputed")
    item = await event_operation(
        money, "charge.dispute.closed", {"id": "dp_unit", "charge": "ch_unit"}
    )
    await processors.process_event(item.id, money.db)
    async with money.db() as db:
        assert (await db.get(JobFunding, money.funding.id)).status == "paid"
        assert await db.scalar(
            select(BillingOperation.id).where(BillingOperation.kind == "transfer")
        )


@pytest.mark.parametrize(
    "field,value",
    [
        ("id", "ch_other"),
        ("payment_intent", "pi_other"),
        ("currency", "usd"),
        ("livemode", True),
        ("amount", 1),
        ("metadata", {"app": "kankele"}),
    ],
)
async def test_charge_events_cannot_apply_a_different_payment_contract(money, field, value):
    money.charge[field] = value
    money.charge["amount_refunded"] = 10000
    item = await event_operation(money, "charge.refunded", {"id": "ch_unit"})
    with pytest.raises(processors.BillingBlocked):
        await processors.process_event(item.id, money.db)
    async with money.db() as db:
        assert (await db.get(JobFunding, money.funding.id)).status == "paid"


async def test_unknown_transfer_after_retention_is_reconciled_with_gets_only(money):
    other = money.remote_transfer("tr_other")
    other["metadata"]["taskmatch_payment_id"] = str(uuid.uuid4())
    money.transfers = [other, money.remote_transfer()]
    item = await operation(money, "transfer", age_hours=21)
    await processors.transfer(item.id, money.db)
    assert all(method == "GET" for method, *_rest in money.calls)
    assert any(
        data.get("starting_after") == "tr_other" for _method, _path, data, _key in money.calls
    )
    async with money.db() as db:
        assert (await db.get(PaymentRecord, money.payment.id)).transfer_id == "tr_unit"


async def test_no_transfer_proof_after_retention_does_not_recreate_money(money):
    item = await operation(money, "transfer", age_hours=21)
    with pytest.raises(processors.BillingBlocked):
        await processors.transfer(item.id, money.db)
    assert all(method == "GET" for method, *_rest in money.calls)


@pytest.mark.parametrize("bad", ["duplicate", "amount", "metadata", "destination"])
async def test_transfer_reconciliation_requires_one_exact_canonical_match(money, bad):
    remote = money.remote_transfer()
    if bad == "duplicate":
        money.transfers = [remote, money.remote_transfer("tr_duplicate")]
    else:
        remote[bad] = (
            1
            if bad == "amount"
            else {"app": "kankele", "taskmatch_payment_id": str(money.payment.id)}
            if bad == "metadata"
            else "acct_other"
        )
        money.transfers = [remote]
    item = await operation(money, "transfer", age_hours=21)
    with pytest.raises(processors.BillingBlocked):
        await processors.transfer(item.id, money.db)
    assert all(method == "GET" for method, *_rest in money.calls)


async def test_refund_pending_is_retrieved_without_starting_another_attempt(money):
    await funding_status(money, "refund_pending")
    money.refund_status = "pending"
    item = await operation(money, "refund")
    for _ in range(2):
        with pytest.raises(processors.BillingBlocked):
            await processors.refund(item.id, money.db)
    posts = [call for call in money.calls if call[:2] == ("POST", "/refunds")]
    assert len(posts) == 1


async def test_only_verified_failed_refund_allows_a_new_persisted_generation(money):
    await funding_status(money, "refund_pending")
    money.refund_status = "failed"
    item = await operation(money, "refund")
    with pytest.raises(processors.BillingBlocked):
        await processors.refund(item.id, money.db)
    money.refund_status = "succeeded"
    await processors.refund(item.id, money.db)
    posts = [call for call in money.calls if call[:2] == ("POST", "/refunds")]
    assert len(posts) == 2 and posts[0][3] != posts[1][3]
    assert ("GET", "/refunds/re_unit1") in [call[:2] for call in money.calls]
    async with money.db() as db:
        assert (await db.get(BillingOperation, item.id)).payload["refund_generation"] == 2
        assert (await db.get(JobFunding, money.funding.id)).status == "refunded"


async def test_unknown_refund_after_retention_never_reposts(money):
    await funding_status(money, "refund_pending")
    item = await operation(money, "refund", age_hours=21)
    with pytest.raises(processors.BillingBlocked):
        await processors.refund(item.id, money.db)
    assert all(method == "GET" for method, *_rest in money.calls)


async def test_reversal_checks_transfer_contract_before_moving_funds(money):
    await funding_status(money, "refund_pending")
    remote = money.remote_transfer()
    remote["destination"] = "acct_other"
    money.transfers = [remote]
    async with money.db() as db:
        payment = await db.get(PaymentRecord, money.payment.id)
        payment.transfer_id = "tr_unit"
        payment.payment_status = "paid"
        await db.commit()
    item = await operation(money, "refund")
    with pytest.raises(processors.BillingBlocked):
        await processors.refund(item.id, money.db)
    assert all(method == "GET" for method, *_rest in money.calls)


async def test_partial_external_reversal_only_reverses_the_remaining_amount(money):
    await funding_status(money, "refund_pending")
    remote = money.remote_transfer()
    remote["amount_reversed"] = 1000
    money.transfers = [remote]
    money.reversals["tr_unit"] = [
        {"id": "trr_previous", "transfer": "tr_unit", "amount": 1000, "currency": "eur"}
    ]
    async with money.db() as db:
        payment = await db.get(PaymentRecord, money.payment.id)
        payment.transfer_id = "tr_unit"
        payment.payment_status = "paid"
        await db.commit()
    item = await operation(money, "refund")
    await processors.refund(item.id, money.db)
    reverse = next(
        call for call in money.calls if call[:2] == ("POST", "/transfers/tr_unit/reversals")
    )
    assert reverse[2]["amount"] == "8000"
    async with money.db() as db:
        assert (await db.get(PaymentRecord, money.payment.id)).reversal_id == "trr_unit"
        assert (await db.get(JobFunding, money.funding.id)).status == "refunded"


async def test_refund_event_before_local_charge_binding_is_not_discarded(money):
    async with money.db() as db:
        funding = await db.get(JobFunding, money.funding.id)
        funding.charge_id = None
        funding.payment_intent_id = None
        funding.status = "checkout_pending"
        job = await db.get(Job, money.job.id)
        job.status = "quoted"
        quote = await db.get(Quote, money.quote.id)
        quote.status = "pending_client"
        await db.commit()
    money.charge["amount_refunded"] = 10000
    money.charge["refunded"] = True
    item = await event_operation(money, "charge.refunded", copy.deepcopy(money.charge))
    await processors.process_event(item.id, money.db)
    async with money.db() as db:
        funding = await db.get(JobFunding, money.funding.id)
        assert funding.charge_id == "ch_unit"
        assert funding.status == "refunded"


async def test_recovered_transfer_after_external_refund_rearms_completed_reversal(money):
    await funding_status(money, "refunded")
    money.charge["amount_refunded"] = 10000
    money.charge["refunded"] = True
    money.transfers = [money.remote_transfer()]
    async with money.db() as db:
        reverse = BillingOperation(
            kind="reverse_refund",
            key=f"reverse_refund:{money.funding.id}",
            entity_id=str(money.funding.id),
            status="done",
        )
        db.add(reverse)
        await db.commit()
    item = await operation(money, "transfer", age_hours=21)
    await processors.transfer(item.id, money.db)
    assert all(method == "GET" for method, *_rest in money.calls)
    async with money.db() as db:
        assert (await db.get(PaymentRecord, money.payment.id)).transfer_id == "tr_unit"
        assert (await db.get(BillingOperation, reverse.id)).status == "pending"


async def test_transfer_discovered_during_reversal_always_queues_a_later_pass(money):
    await funding_status(money, "refunded")
    money.charge["amount_refunded"] = 10000
    money.charge["refunded"] = True
    money.transfers = [money.remote_transfer()]
    async with money.db() as db:
        db.add(
            BillingOperation(
                kind="reverse_refund",
                key=f"reverse_refund:{money.funding.id}",
                entity_id=str(money.funding.id),
                status="processing",
            )
        )
        await db.commit()
    item = await operation(money, "transfer", age_hours=21)
    await processors.transfer(item.id, money.db)
    async with money.db() as db:
        followup = await db.scalar(
            select(BillingOperation).where(
                BillingOperation.key == f"reverse_refund:{money.funding.id}:tr_unit"
            )
        )
        assert followup is not None and followup.status == "pending"
        assert followup.kind == "reverse_refund"
    assert all(method == "GET" for method, *_rest in money.calls)


async def test_dispute_won_keeps_refund_reservation_even_if_status_was_disputed(money):
    await funding_status(money, "disputed")
    await operation(money, "refund")
    item = await event_operation(
        money, "charge.dispute.closed", {"id": "dp_unit", "charge": "ch_unit"}
    )
    await processors.process_event(item.id, money.db)
    async with money.db() as db:
        assert (await db.get(JobFunding, money.funding.id)).status == "disputed"
        assert not await db.scalar(
            select(BillingOperation.id).where(BillingOperation.kind == "transfer")
        )


@pytest.mark.parametrize(
    "field,value",
    [
        ("charge", "ch_other"),
        ("payment_intent", "pi_other"),
        ("livemode", True),
        ("currency", "usd"),
    ],
)
async def test_dispute_must_match_canonical_charge_before_unfreezing(money, field, value):
    await funding_status(money, "disputed")
    money.dispute[field] = value
    item = await event_operation(
        money, "charge.dispute.closed", {"id": "dp_unit", "charge": "ch_unit"}
    )
    with pytest.raises(processors.BillingBlocked):
        await processors.process_event(item.id, money.db)
    async with money.db() as db:
        assert (await db.get(JobFunding, money.funding.id)).status == "disputed"


async def test_expiration_from_previous_checkout_generation_is_ignored(money):
    await funding_status(money, "checkout_pending")
    money.session["payment_status"] = "unpaid"
    money.session["status"] = "expired"
    money.session["metadata"]["taskmatch_generation"] = "0"
    item = await event_operation(money, "checkout.session.expired", {"id": "cs_unit"})
    await processors.process_event(item.id, money.db)
    async with money.db() as db:
        assert (await db.get(JobFunding, money.funding.id)).status == "checkout_pending"


async def test_fresh_transfer_requires_current_unrefunded_charge(money):
    money.charge["amount_refunded"] = 1000
    item = await operation(money, "transfer")
    with pytest.raises(processors.BillingBlocked):
        await processors.transfer(item.id, money.db)
    assert all(method == "GET" for method, *_rest in money.calls)


async def test_successful_transfer_is_saved_once_and_reconciled_on_retry(money):
    item = await operation(money, "transfer")
    await processors.transfer(item.id, money.db)
    await processors.transfer(item.id, money.db)
    assert len([call for call in money.calls if call[:2] == ("POST", "/transfers")]) == 1
    async with money.db() as db:
        assert (await db.get(PaymentRecord, money.payment.id)).payment_status == "paid"


async def test_foreign_refund_cannot_authorize_a_new_refund_generation(money):
    await funding_status(money, "refund_pending")
    money.refund_status = "failed"
    item = await operation(money, "refund")
    with pytest.raises(processors.BillingBlocked):
        await processors.refund(item.id, money.db)
    money.refunds["re_unit1"]["charge"] = "ch_other"
    with pytest.raises(processors.BillingBlocked):
        await processors.refund(item.id, money.db)
    assert len([call for call in money.calls if call[:2] == ("POST", "/refunds")]) == 1


async def test_reversal_reference_must_belong_to_original_transfer(money):
    await funding_status(money, "refund_pending")
    remote = money.remote_transfer()
    remote.update(amount_reversed=9000, reversed=True)
    money.transfers = [remote]
    money.reversals["tr_unit"] = [
        {"id": "trr_foreign", "transfer": "tr_foreign", "amount": 9000, "currency": "eur"}
    ]
    async with money.db() as db:
        payment = await db.get(PaymentRecord, money.payment.id)
        payment.transfer_id = "tr_unit"
        payment.payment_status = "paid"
        await db.commit()
    item = await operation(money, "refund")
    with pytest.raises(processors.BillingBlocked):
        await processors.refund(item.id, money.db)
    assert all(method == "GET" for method, *_rest in money.calls)


@pytest.mark.parametrize('role', ['client', 'admin'])
@pytest.mark.parametrize('verified', [True, False])
async def test_human_transfers_use_verified_worker_identity_across_account_roles(money, role, verified):
    from app.models import Agent, Task, User
    from app.models.human import WorkerProfile
    async with money.db() as db:
        user = await db.get(User, money.payment.developer_user_id)
        user.role = role
        agent = await db.scalar(select(Agent).where(Agent.developer_user_id == user.id))
        agent.endpoint_url = '/experts/test-worker'
        task = Task(id=uuid.uuid4(), job_id=money.job.id, title='Human review',
                    description='Review', task_type='translation_review', status='approved',
                    human_policy_status='approved', human_contract_json={
                        'language':'fr', 'required_capabilities':['translation'], 'execution_mode':'remote'})
        db.add(task)
        db.add(WorkerProfile(user_id=user.id, agent_id=agent.id, data_consent=True,
                verification_status='verified' if verified else 'pending', attested_skills=['translation'],
                profile={'languages':['fr'],'skills':['translation'],'available':False}))
        await db.flush()
        payment = await db.get(PaymentRecord, money.payment.id)
        payment.task_id = task.id
        await db.commit()
    item = await operation(money, 'transfer')
    if verified:
        await processors.transfer(item.id, money.db)
        assert len([c for c in money.calls if c[:2] == ('POST','/transfers')]) == 1
    else:
        with pytest.raises(processors.BillingBlocked):
            await processors.transfer(item.id, money.db)
        assert not [c for c in money.calls if c[:2] == ('POST','/transfers')]
