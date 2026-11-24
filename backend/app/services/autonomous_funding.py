"""Bounded agent funding. Commit reservations before calling the payment provider."""

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import lazyload

from app.middleware.audit import log_audit
from app.models import Agent, Quote, Task, User
from app.models.billing import BillingOperation, JobFunding
from app.models.human import Delegation, Principal
from app.models.payment_authorization import PaymentAuthorization
from app.services import billing_service as billing
from app.services import first_project_offer, quote_service
from app.services.billing_processors import BillingBlocked
from app.services.human_authorization import enabled, owned_principal
from app.services.human_tasks import require_approved_job
from app.services.stripe_gateway import get_gateway, to_minor


def view(funding):
    return {
        "funding_id": str(funding.id),
        "status": funding.status,
        "amount_minor": funding.amount_minor,
        "currency": funding.currency.upper(),
        "action_required": funding.status == "requires_review",
    }


def matched(remote, expected):
    return all(str((remote.get("metadata") or {}).get(k)) == str(v) for k, v in expected.items())


async def request_funding(db, task_id, user, delegation, expected_quote_id=None):
    enabled()
    billing.ensure_configured()
    task = await db.get(Task, task_id, options=[lazyload("*")])
    if not task or not task.human_contract_json:
        raise HTTPException(404, "Human Task not found")
    contract = task.human_contract_json
    p = await owned_principal(db, uuid.UUID(contract["principal_id"]), user, lock=True)
    if delegation:
        d = await db.scalar(
            select(Delegation)
            .where(Delegation.id == delegation.id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        if (
            not d
            or d.principal_id != p.id
            or d.revoked_at
            or d.expires_at <= billing.now()
            or contract.get("delegation_id") != str(d.id)
        ):
            raise HTTPException(403, "Mission is outside the active spending mandate")
    else:
        d = None
    job = await billing.locked_job(db, task.job_id)
    if job.client_user_id != user.id or job.billing_mode != "stripe":
        raise HTTPException(403, "Only the responsible account may authorize payment")
    await require_approved_job(db, job)
    tasks = (
        await db.scalars(select(Task).options(lazyload("*")).where(Task.job_id == job.id))
    ).all()
    if any(
        not t.human_contract_json
        or t.human_contract_json["principal_id"] != str(p.id)
        or (d and t.human_contract_json.get("delegation_id") != str(d.id))
        for t in tasks
    ):
        raise HTTPException(403, "A mandate cannot fund work assigned to another mandate")
    previous = await billing.latest_funding(db, job.id)
    if previous:
        # Never create a second funding attempt on an unknown, failed or captured outcome.
        return view(previous)
    quote = await quote_service.current_quote(db, job.id)
    if (
        job.status != "quoted"
        or not quote
        or not quote.is_actionable
        or not quote.valid_until
        or quote.valid_until <= billing.now()
    ):
        raise HTTPException(409, "A current approved quote is required before payment")
    if expected_quote_id and quote.id != expected_quote_id:
        raise HTTPException(409, first_project_offer.REQUOTE)
    amount = to_minor(quote.total, quote.currency)
    ceiling = sum(t.human_contract_json["budget"]["amount_minor"] for t in tasks)
    if amount > ceiling or (d and amount > d.reserved_amount_minor):
        raise HTTPException(409, "Payment exceeds the authorized mission budget")
    auth = await db.scalar(
        select(PaymentAuthorization).where(
            PaymentAuthorization.principal_id == p.id,
            PaymentAuthorization.status == "active",
            PaymentAuthorization.livemode == billing.live_mode(),
        )
    )
    if not auth or not auth.customer_id or not auth.payment_method_id:
        raise HTTPException(409, "The responsible account must enable agent payments first")
    funding = JobFunding(
        id=uuid.uuid4(),
        job_id=job.id,
        quote_id=quote.id,
        client_user_id=user.id,
        amount_minor=amount,
        currency=quote.currency.lower(),
        livemode=billing.live_mode(),
        status="creating",
        checkout_started_at=billing.now(),
        checkout_request={"method": "off_session", "authorization_id": str(auth.id)},
    )
    db.add(funding)
    await first_project_offer.reserve(db, funding, quote)
    await db.flush()
    await billing.enqueue_operation(
        db,
        "fund_human_job",
        funding.id,
        f"agent-funding:{funding.id}",
        payload={
            "principal_id": str(p.id),
            "delegation_id": str(d.id) if d else None,
            "authorization_id": str(auth.id),
            "generation": funding.generation,
            "quote_id": str(quote.id),
        },
    )
    if funding.first_project_slot is not None:
        await billing.enqueue_operation(
            db, "check_offer_expiry", funding.id, f"offer-expiry:{funding.id}:{funding.generation}",
            {"generation": funding.generation}, available_at=quote.valid_until,
        )
    await log_audit(
        db,
        actor_type="user",
        actor_id=str(user.id),
        action="human_task.funding_requested",
        entity_type="task",
        entity_id=str(task_id),
        payload={"funding_id": str(funding.id), "amount_minor": amount},
    )
    return view(funding)


async def verify_intent(db, funding, intent):
    """An authoritative PaymentIntent and captured Charge, not a browser assertion."""
    auth = await db.get(
        PaymentAuthorization, uuid.UUID(funding.checkout_request["authorization_id"])
    )
    if (
        not auth
        or intent.get("customer") != auth.customer_id
        or intent.get("payment_method") != auth.payment_method_id
    ):
        raise BillingBlocked("Payment method does not match the responsible account")
    expected = billing.metadata(funding)
    if (
        intent.get("id") != funding.payment_intent_id
        or not matched(intent, expected)
        or intent.get("amount") != funding.amount_minor
        or intent.get("currency") != funding.currency
        or intent.get("livemode") is not funding.livemode
        or funding.livemode != billing.live_mode()
    ):
        raise BillingBlocked("Payment proof does not match the reserved funding contract")
    charge = None
    if intent.get("status") == "succeeded":
        if intent.get("amount_received") != funding.amount_minor:
            raise BillingBlocked("The captured amount does not match the approved quote")
        charge_id = intent.get("latest_charge")
        if isinstance(charge_id, dict):
            charge_id = charge_id.get("id")
        if not isinstance(charge_id, str) or not charge_id.startswith("ch_"):
            raise BillingBlocked("A captured payment reference is required")
        charge = await get_gateway().request("GET", f"/charges/{charge_id}")
    job = await billing.locked_job(db, funding.job_id)
    funding = await db.get(JobFunding, funding.id, populate_existing=True)
    # Every state transition, including a bank-action response, is serialized.
    # A late processing snapshot cannot overwrite a callback's captured/frozen state.
    if (
        intent.get("id") != funding.payment_intent_id
        or not matched(intent, billing.metadata(funding))
        or (funding.checkout_request or {}).get("method") != "off_session"
    ):
        raise BillingBlocked("The payment generation changed during reconciliation")
    if funding.status in (
        "paid",
        "cancelled",
        "refund_pending",
        "refunded",
        "partially_refunded",
        "disputed",
    ):
        return funding.status == "paid"
    if intent.get("status") != "succeeded":
        if funding.charge_id:
            return False
        funding.status = "requires_review" if intent.get("status") != "processing" else "creating"
        funding.last_error = "The payment needs attention from the responsible account."
        return False
    if not matched(charge, expected) or any(
        [
            charge.get("id") != charge_id,
            charge.get("payment_intent") != intent["id"],
            charge.get("amount") != funding.amount_minor,
            charge.get("currency") != funding.currency,
            charge.get("livemode") is not funding.livemode,
            charge.get("paid") is not True,
            charge.get("captured") is not True,
            type(charge.get("amount_refunded")) is not int,
        ]
    ):
        raise BillingBlocked("Captured payment evidence does not match this mission")
    if not 0 <= charge["amount_refunded"] <= funding.amount_minor:
        raise BillingBlocked("Invalid refunded amount")
    if funding.status in ("paid", "refund_pending", "refunded", "partially_refunded", "disputed"):
        return funding.status == "paid"
    if funding.charge_id is None:
        funding.charge_id = charge_id
        funding.captured_at = billing.now()
        await first_project_offer.redeem(db, funding)
    elif funding.charge_id != charge_id:
        raise BillingBlocked("Captured charge changed during payment reconciliation")
    funding.receipt_url = charge.get("receipt_url")
    if charge["amount_refunded"] or charge.get("disputed"):
        funding.refunded_minor = charge["amount_refunded"]
        funding.status = (
            ("refunded" if funding.refunded_minor == funding.amount_minor else "partially_refunded")
            if funding.refunded_minor
            else "disputed"
        )
        return False
    quote = await db.get(Quote, funding.quote_id, options=[lazyload("*")])
    latest = await db.scalar(
        select(Quote.id).where(Quote.job_id == job.id).order_by(Quote.created_at.desc()).limit(1)
    )
    if (
        latest != funding.quote_id
        or job.status != "quoted"
        or quote.status not in ("pending_client", "draft", "expired")
        or to_minor(quote.total, quote.currency) != funding.amount_minor
    ):
        funding.status = "requires_review"
        funding.last_error = "Payment was received but the mission changed; review or refund it."
        return False
    funding.status = "paid"
    funding.last_error = None
    await quote_service.accept_quote(db, quote)
    await billing.enqueue_operation(db, "execute", job.id, f"execute:{funding.id}")
    await log_audit(
        db,
        actor_type="system",
        actor_id="payment-worker",
        action="human_task.funded",
        entity_type="job",
        entity_id=str(job.id),
        payload={"funding_id": str(funding.id), "amount_minor": funding.amount_minor},
    )
    return True


async def process_funding(operation_id, factory):
    async with factory() as db:
        op = await db.get(BillingOperation, operation_id)
        funding = await db.get(JobFunding, uuid.UUID(op.entity_id))
        if funding.livemode != billing.live_mode():
            raise BillingBlocked("This payment was created in a different payment mode")
        if funding.status in (
            "paid",
            "cancelled",
            "refunded",
            "refund_pending",
            "disputed",
            "partially_refunded",
        ):
            return
        payload = op.payload or {}
        principal = await db.scalar(
            select(Principal)
            .where(Principal.id == uuid.UUID(payload["principal_id"]))
            .with_for_update()
        )
        delegation = (
            await db.scalar(
                select(Delegation)
                .where(Delegation.id == uuid.UUID(payload["delegation_id"]))
                .with_for_update()
            )
            if payload.get("delegation_id")
            else None
        )
        job = await billing.locked_job(db, funding.job_id)
        funding = await db.get(JobFunding, funding.id, populate_existing=True)
        if payload.get("generation") != funding.generation:
            return
        if not principal or principal.owner_user_id != job.client_user_id:
            raise BillingBlocked("Responsible account mismatch")
        owner = await db.get(User, principal.owner_user_id, options=[lazyload("*")])
        auth = await db.get(PaymentAuthorization, uuid.UUID(payload["authorization_id"]))
        # A previous external attempt can only be reconciled after revocation, never blindly replayed.
        agent = (
            await db.get(Agent, delegation.agent_id, options=[lazyload("*")])
            if delegation
            else None
        )
        if not funding.payment_intent_id and not op.external_started_at:
            if (
                not owner
                or not owner.is_active
                or not auth
                or auth.status != "active"
                or auth.principal_id != principal.id
                or auth.livemode != funding.livemode
                or (
                    payload.get("delegation_id")
                    and (
                        not delegation
                        or delegation.revoked_at
                        or delegation.expires_at <= billing.now()
                        or delegation.principal_id != principal.id
                        or not agent
                        or agent.status != "active"
                        or agent.developer_user_id != principal.owner_user_id
                    )
                )
            ):
                raise BillingBlocked("The payment consent or spending mandate is no longer active")
            quote = await quote_service.current_quote(db, job.id)
            if (
                not quote
                or quote.id != funding.quote_id
                or not quote.is_actionable
                or not quote.valid_until
                or quote.valid_until <= billing.now()
                or quote.currency.lower() != funding.currency
                or to_minor(quote.total, quote.currency) != funding.amount_minor
            ):
                raise BillingBlocked("The reserved quote expired or changed before payment started")
            await require_approved_job(db, job)
            tasks = (
                await db.scalars(select(Task).options(lazyload("*")).where(Task.job_id == job.id))
            ).all()
            if job.status != "quoted" or any(
                not t.human_contract_json
                or (delegation and t.human_contract_json.get("delegation_id") != str(delegation.id))
                for t in tasks
            ):
                raise BillingBlocked("The mission changed before payment authorization")
        if funding.payment_intent_id:
            intent_id = funding.payment_intent_id
            await db.commit()
            intent = await get_gateway().request("GET", f"/payment_intents/{intent_id}")
        else:
            if op.external_started_at:
                # Recover uncertain creation by exhaustive customer lookup. No blind second POST.
                customer = auth.customer_id
                await db.commit()
                # Use this module gateway so tests and live execution share one transport boundary.
                rows = []
                cursor = None
                for _ in range(100):
                    query = {"customer": customer, "limit": 100}
                    if cursor:
                        query["starting_after"] = cursor
                    page = await get_gateway().request("GET", "/payment_intents", data=query)
                    items = page.get("data")
                    if not isinstance(items, list):
                        raise BillingBlocked("Payment reconciliation returned invalid data")
                    rows.extend(items)
                    if page.get("has_more") is False:
                        break
                    next_cursor = items[-1].get("id") if items else None
                    if not next_cursor or next_cursor == cursor:
                        raise BillingBlocked("Payment reconciliation could not finish")
                    cursor = next_cursor
                else:
                    raise BillingBlocked("Payment reconciliation exceeded its page limit")
                matches = [row for row in rows if matched(row, billing.metadata(funding))]
                if len(matches) != 1:
                    raise BillingBlocked(
                        "Uncertain payment outcome requires reconciliation before retrying"
                    )
                intent = matches[0]
            else:
                op.external_started_at = billing.now()
                expected = billing.metadata(funding)
                data = {
                    "amount": funding.amount_minor,
                    "currency": funding.currency,
                    "customer": auth.customer_id,
                    "payment_method": auth.payment_method_id,
                    "payment_method_types[0]": "card",
                    "off_session": "true",
                    "confirm": "true",
                    "transfer_group": f"taskmatch:{job.id}",
                    **{f"metadata[{k}]": v for k, v in expected.items()},
                }
                await db.commit()
                intent = await get_gateway().request(
                    "POST",
                    "/payment_intents",
                    data=data,
                    idempotency_key=f"taskmatch:agent-payment:{funding.id}:{funding.generation}",
                )
            if not str(intent.get("id", "")).startswith("pi_"):
                raise BillingBlocked("Payment service returned an invalid reference")
            await billing.locked_job(db, funding.job_id)
            funding = await db.get(JobFunding, funding.id, populate_existing=True)
            if funding.generation != payload.get("generation"):
                raise BillingBlocked("Payment generation changed during processing")
            funding.payment_intent_id = intent["id"]
            await db.commit()
        if (
            intent.get("customer") != auth.customer_id
            or intent.get("payment_method") != auth.payment_method_id
        ):
            raise BillingBlocked("Payment method does not match the consented responsible account")
        await verify_intent(db, funding, intent)
        await db.commit()


async def reconcile_intent(db, intent_id, metadata_hint=None):
    funding = await db.scalar(select(JobFunding).where(JobFunding.payment_intent_id == intent_id))
    if not funding and metadata_hint:
        try:
            identifier = uuid.UUID(metadata_hint.get("taskmatch_funding_id", ""))
        except (ValueError, TypeError):
            return False
        funding = await db.get(JobFunding, identifier)
    if not funding or (funding.checkout_request or {}).get("method") != "off_session":
        return False
    if funding.payment_intent_id and funding.payment_intent_id != intent_id:
        raise BillingBlocked("Unexpected payment reference")
    intent = await get_gateway().request("GET", f"/payment_intents/{intent_id}")
    if not matched(intent, billing.metadata(funding)):
        raise BillingBlocked("Payment proof does not match its reservation")
    auth = await db.get(
        PaymentAuthorization, uuid.UUID(funding.checkout_request["authorization_id"])
    )
    if (
        not auth
        or intent.get("customer") != auth.customer_id
        or intent.get("payment_method") != auth.payment_method_id
        or intent.get("id") != intent_id
        or intent.get("amount") != funding.amount_minor
        or intent.get("currency") != funding.currency
        or intent.get("livemode") is not funding.livemode
    ):
        raise BillingBlocked(
            "Payment proof does not match the responsible account and approved amount"
        )
    if not funding.payment_intent_id:
        await billing.locked_job(db, funding.job_id)
        funding = await db.get(JobFunding, funding.id, populate_existing=True)
        if not matched(intent, billing.metadata(funding)) or (
            funding.payment_intent_id and funding.payment_intent_id != intent_id
        ):
            raise BillingBlocked("Payment generation changed before reconciliation")
        funding.payment_intent_id = intent_id
        await db.commit()
    return await verify_intent(db, funding, intent)


async def funding_status(db, task_id, identity):
    from app.api.v1.endpoints.human_tasks import accessible

    task = await accessible(db, task_id, identity)
    funding = await billing.latest_funding(db, task.job_id)
    return view(funding) if funding else {"status": "not_started", "action_required": False}


async def find_intent(db, funding):
    auth = await db.get(
        PaymentAuthorization, uuid.UUID(funding.checkout_request["authorization_id"])
    )
    if not auth:
        raise HTTPException(409, "The payment account needs reconciliation")
    expected = billing.metadata(funding)
    await db.commit()
    rows = []
    cursor = None
    seen = set()
    for _ in range(100):
        query = {"customer": auth.customer_id, "limit": 100}
        if cursor:
            query["starting_after"] = cursor
        page = await get_gateway().request("GET", "/payment_intents", data=query)
        items = page.get("data")
        if not isinstance(items, list) or any(not isinstance(row, dict) for row in items):
            raise HTTPException(409, "Payment reconciliation returned invalid data")
        rows.extend(items)
        if page.get("has_more") is False:
            break
        cursor = items[-1].get("id") if items else None
        if not cursor or cursor in seen:
            raise HTTPException(409, "Payment reconciliation could not finish")
        seen.add(cursor)
    else:
        raise HTTPException(409, "Payment reconciliation exceeded its page limit")
    matches = [row for row in rows if matched(row, expected)]
    if len(matches) != 1:
        raise HTTPException(409, "The earlier payment outcome needs review before another payment")
    return matches[0].get("id")


async def recover_payment(db, task_id, user, payment_intent_id=None, *, expired_attempt=None):
    """Cancel a proven unpaid attempt before permitting the human payment flow."""
    task = await db.get(Task, task_id, options=[lazyload("*")])
    if not task or not task.human_contract_json:
        raise HTTPException(404, "Human Task not found")
    await owned_principal(db, uuid.UUID(task.human_contract_json["principal_id"]), user, lock=True)
    job = await billing.locked_job(db, task.job_id)
    if job.client_user_id != user.id:
        raise HTTPException(403, "Only the responsible account may recover this payment")
    funding = await billing.latest_funding(db, job.id)
    if expired_attempt:
        if not funding or (funding.id, funding.generation) != expired_attempt:
            return
        if funding.charge_id or funding.first_project_slot is None:
            return
        deadline = await db.scalar(select(Quote.valid_until).where(Quote.id == funding.quote_id))
        if not deadline or deadline > billing.now():
            return
    if not funding or (funding.checkout_request or {}).get("method") != "off_session":
        raise HTTPException(409, "No agent payment is waiting for attention")
    if funding.status == "paid":
        return view(funding)
    if funding.status not in ("creating", "requires_review"):
        raise HTTPException(409, "This payment cannot be replaced")
    op = await db.scalar(
        select(BillingOperation)
        .where(
            BillingOperation.kind == "fund_human_job", BillingOperation.entity_id == str(funding.id)
        )
        .with_for_update()
    )
    if not op or op.status == "processing":
        raise HTTPException(409, "The payment is still being processed; refresh its status first")
    identifier = payment_intent_id or funding.payment_intent_id
    if not identifier and op.external_started_at:
        identifier = await find_intent(db, funding)
        if not isinstance(identifier, str) or not identifier.startswith("pi_"):
            raise HTTPException(409, "Payment reconciliation returned an invalid reference")
    generation = funding.generation
    if identifier:
        auth = await db.get(
            PaymentAuthorization, uuid.UUID(funding.checkout_request["authorization_id"])
        )
        await db.commit()
        intent = await get_gateway().request("GET", f"/payment_intents/{identifier}")
        if (
            intent.get("id") != identifier
            or not matched(intent, billing.metadata(funding))
            or intent.get("amount") != funding.amount_minor
            or intent.get("currency") != funding.currency
            or intent.get("livemode") is not funding.livemode
            or not auth
            or intent.get("customer") != auth.customer_id
            or intent.get("payment_method") != auth.payment_method_id
        ):
            raise HTTPException(409, "The payment reference does not match this mission")
        if intent.get("status") == "succeeded":
            funding.payment_intent_id = identifier
            await db.commit()
            await verify_intent(db, funding, intent)
            return view(funding)
        if intent.get("status") not in (
            "requires_action",
            "requires_payment_method",
            "requires_confirmation",
            "canceled",
        ):
            raise HTTPException(409, "The bank has not resolved this payment yet")
        if intent["status"] != "canceled":
            intent = await get_gateway().request(
                "POST",
                f"/payment_intents/{identifier}/cancel",
                data={},
                idempotency_key=f"taskmatch:cancel-agent-payment:{funding.id}:{generation}",
            )
        if (
            intent.get("id") != identifier
            or intent.get("status") != "canceled"
            or not matched(intent, billing.metadata(funding))
        ):
            raise HTTPException(409, "The earlier payment has not been cancelled")
    await owned_principal(db, uuid.UUID(task.human_contract_json["principal_id"]), user, lock=True)
    await billing.locked_job(db, job.id)
    funding = await db.get(JobFunding, funding.id, populate_existing=True)
    op = await db.get(BillingOperation, op.id, populate_existing=True)
    if funding.generation != generation or funding.status == "paid":
        raise HTTPException(409, "Payment changed during recovery; refresh its status")
    op.payload = {**(op.payload or {}), "cancelled_payment_intent_id": identifier}
    op.status = "cancelled"
    op.locked_until = None
    funding.status = "cancelled"
    await first_project_offer.release(db, funding)
    funding.payment_intent_id = None
    funding.checkout_url = None
    funding.last_error = None
    await log_audit(
        db,
        actor_type="system" if expired_attempt else "user",
        actor_id="billing-worker" if expired_attempt else str(user.id),
        action="human_task.funding_expired" if expired_attempt else "human_task.funding_recovered",
        entity_type="task",
        entity_id=str(task.id),
        payload={"funding_id": str(funding.id), "generation": generation},
    )
    return view(funding)
