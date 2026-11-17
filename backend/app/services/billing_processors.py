"""Idempotent billing processors. Reserve locally, call Stripe, then persist proof."""

import uuid
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import lazyload

from app.middleware.audit import log_audit
from app.models.assignment import Assignment
from app.models.billing import BillingOperation, JobFunding, StripeConnectAccount, StripeEvent
from app.models.payment import PaymentRecord
from app.models.task import Task
from app.models.user import User
from app.services import billing_service as billing
from app.services.stripe_gateway import get_gateway, to_minor


class BillingBlocked(Exception):  # noqa: N818 - public worker exception contract.
    pass


async def request_refund(db, job, user):
    job = await billing.locked_job(db, job.id)
    funding = await billing.latest_funding(db, job.id)
    if (
        not funding
        or job.billing_mode != "stripe"
        or funding.status
        not in ("paid", "partially_refunded", "requires_review", "refund_pending", "refunded")
    ):
        raise HTTPException(409, "No captured Stripe payment is refundable")
    if funding.status == "refunded":
        return funding
    busy = await db.scalar(
        select(PaymentRecord.id)
        .where(PaymentRecord.funding_id == funding.id, PaymentRecord.payment_status == "processing")
        .limit(1)
    )
    if busy:
        raise HTTPException(
            409, "A transfer is being reconciled. Retry the refund after it settles."
        )
    funding.status = "refund_pending"
    funding.last_error = None
    if job.status != "completed":
        job.status = "cancelled"
        task_ids = select(Task.id).where(Task.job_id == job.id)
        await db.execute(
            update(Assignment)
            .where(Assignment.task_id.in_(task_ids), Assignment.status == "active")
            .values(status="cancelled")
        )
        await db.execute(
            update(Task)
            .where(Task.job_id == job.id, Task.status != "approved")
            .values(status="cancelled")
        )
    await billing.enqueue_operation(db, "refund", funding.id, f"refund:{funding.id}")
    await log_audit(
        db,
        actor_type="user",
        actor_id=str(user.id),
        action="stripe.refund.request",
        entity_type="job",
        entity_id=str(job.id),
        payload={
            "funding_id": str(funding.id),
            "amount_minor": funding.amount_minor - funding.refunded_minor,
            "currency": funding.currency,
        },
    )
    return funding


async def _external_reservation(db, operation):
    if operation.external_started_at and billing.now() - operation.external_started_at > timedelta(
        hours=20
    ):
        raise BillingBlocked(
            "An earlier Stripe outcome is uncertain. Reconcile its Stripe reference before retrying; automatic replay is stopped to prevent duplicates."
        )
    if not operation.external_started_at:
        operation.external_started_at = billing.now()
    await db.commit()


def _metadata_matches(value, expected):
    metadata = value.get("metadata") or {}
    return isinstance(metadata, dict) and all(
        str(metadata.get(key)) == str(item) for key, item in expected.items()
    )


def _validate_charge(charge, funding):
    refunded = charge.get("amount_refunded")
    if (
        funding.livemode != billing.live_mode()
        or charge.get("id") != funding.charge_id
        or charge.get("payment_intent") != funding.payment_intent_id
        or charge.get("currency") != funding.currency
        or charge.get("amount") != funding.amount_minor
        or charge.get("livemode") is not funding.livemode
        or charge.get("paid") is not True
        or charge.get("captured") is not True
        or not _metadata_matches(charge, billing.metadata(funding))
        or type(refunded) is not int
        or not 0 <= refunded <= funding.amount_minor
    ):
        raise BillingBlocked("Captured charge does not match the immutable funding contract")
    return refunded


async def _list_all(path, data):
    # Exhaust the list before deciding that a possibly successful POST is absent.
    values = []
    query = dict(data, limit=100)
    seen = set()
    for _ in range(100):
        page = await get_gateway().request("GET", path, data=query)
        rows = page.get("data")
        if not isinstance(rows, list) or any(not isinstance(row, dict) for row in rows):
            raise BillingBlocked("Stripe reconciliation returned an invalid list")
        values.extend(rows)
        if page.get("has_more") is False:
            return values
        cursor = rows[-1].get("id") if rows else None
        if not cursor or cursor in seen:
            raise BillingBlocked("Stripe reconciliation could not exhaust the list safely")
        seen.add(cursor)
        query["starting_after"] = cursor
    raise BillingBlocked("Stripe reconciliation exceeded its page limit; manual review is required")


async def _transfer_contract(db, funding, payment):
    account = await db.get(StripeConnectAccount, payment.developer_user_id)
    if (
        not account
        or not account.account_id
        or account.livemode != funding.livemode
        or funding.livemode != billing.live_mode()
        or not funding.charge_id
        or payment.funding_id != funding.id
        or payment.job_id != funding.job_id
        or payment.currency.lower() != funding.currency
    ):
        raise BillingBlocked(
            "No matching Stripe account and funding contract exists for this allocation"
        )
    amount = to_minor(payment.net_amount, payment.currency)
    if amount <= 0:
        raise BillingBlocked("The transfer allocation must be positive")
    return {
        "amount": amount,
        "currency": funding.currency,
        "destination": account.account_id,
        "source_transaction": funding.charge_id,
        "transfer_group": f"taskmatch:{funding.job_id}",
        "metadata[app]": "taskmatch",
        "metadata[taskmatch_payment_id]": str(payment.id),
        "metadata[taskmatch_funding_id]": str(funding.id),
    }


def _validate_transfer(remote, funding, payment, data, *, expected_id=None):
    metadata = {
        "app": "taskmatch",
        "taskmatch_payment_id": str(payment.id),
        "taskmatch_funding_id": str(funding.id),
    }
    reversed_amount = remote.get("amount_reversed")
    if (
        not str(remote.get("id", "")).startswith("tr_")
        or (expected_id and remote.get("id") != expected_id)
        or any(
            remote.get(key) != data[key]
            for key in ("amount", "currency", "destination", "source_transaction", "transfer_group")
        )
        or remote.get("livemode") is not funding.livemode
        or not _metadata_matches(remote, metadata)
        or type(reversed_amount) is not int
        or not 0 <= reversed_amount <= data["amount"]
        or remote.get("reversed") is not (reversed_amount == data["amount"])
    ):
        raise BillingBlocked("Stripe transfer does not match its reserved contract")


async def _record_transfer(db, funding, payment, remote):
    await billing.locked_job(db, funding.job_id)
    funding = await db.get(JobFunding, funding.id, populate_existing=True)
    payment = await db.get(PaymentRecord, payment.id, populate_existing=True)
    if payment.transfer_id and payment.transfer_id != remote["id"]:
        raise BillingBlocked("More than one transfer exists for this allocation")
    payment.transfer_id = remote["id"]
    payment.provider_ref = remote["id"]
    payment.payment_status = "reversed" if remote["reversed"] else "paid"
    payment.payout_error = None
    if funding.status == "refunded":
        await billing.enqueue_operation(
            db, "reverse_refund", funding.id, f"reverse_refund:{funding.id}"
        )
        # A running reversal may already have read its allocation list. A new
        # durable pass keyed to this proof must survive that worker finishing.
        await billing.enqueue_operation(
            db, "reverse_refund", funding.id, f"reverse_refund:{funding.id}:{remote['id']}"
        )
        # A previous reversal pass may have finished before this lost transfer was found.
        await db.execute(
            update(BillingOperation)
            .where(
                BillingOperation.key == f"reverse_refund:{funding.id}",
                BillingOperation.status.in_(("done", "blocked", "failed")),
            )
            .values(status="pending", available_at=billing.now(), last_error=None)
        )
    await db.commit()


async def transfer(operation_id, factory):
    async with factory() as db:
        operation = await db.get(BillingOperation, operation_id)
        payment = await db.get(
            PaymentRecord, uuid.UUID(operation.entity_id), options=[lazyload("*")]
        )
        if not payment or payment.provider != "stripe_connect" or not payment.funding_id:
            raise BillingBlocked("No Stripe developer allocation exists")
        job = await billing.locked_job(db, payment.job_id)
        funding = await db.get(JobFunding, payment.funding_id)
        if not funding:
            raise BillingBlocked("No matching Stripe funding exists")
        data = await _transfer_contract(db, funding, payment)
        if operation.payload and operation.payload != data:
            raise BillingBlocked(
                "The reserved transfer contract changed; reconciliation is required"
            )
        await db.commit()
        # Reconciliation remains possible after refunds/disputes or key retention expires.
        # These reads never authorize a new transfer from frozen funding.
        if payment.transfer_id:
            remote = await get_gateway().request("GET", f"/transfers/{payment.transfer_id}")
            _validate_transfer(remote, funding, payment, data, expected_id=payment.transfer_id)
            await _record_transfer(db, funding, payment, remote)
            return
        if operation.external_started_at:
            rows = await _list_all("/transfers", {"transfer_group": data["transfer_group"]})
            matches = [
                row
                for row in rows
                if (row.get("metadata") or {}).get("taskmatch_payment_id") == str(payment.id)
            ]
            if len(matches) > 1:
                raise BillingBlocked("More than one Stripe transfer matches this allocation")
            if matches:
                _validate_transfer(matches[0], funding, payment, data)
                await _record_transfer(db, funding, payment, matches[0])
                return
            if billing.now() - operation.external_started_at > timedelta(hours=20):
                raise BillingBlocked(
                    "No transfer proof was found before the replay safety deadline; manual reconciliation is required"
                )
        remote_account = await get_gateway().request("GET", f"/accounts/{data['destination']}")
        if (
            remote_account.get("id") != data["destination"]
            or not _metadata_matches(
                remote_account,
                {"app": "taskmatch", "taskmatch_user_id": str(payment.developer_user_id)},
            )
            or (remote_account.get("capabilities") or {}).get("transfers") != "active"
            or remote_account.get("payouts_enabled") is not True
        ):
            raise BillingBlocked("Stripe onboarding or payouts are not enabled for this account")
        charge = await get_gateway().request("GET", f"/charges/{funding.charge_id}")
        if _validate_charge(charge, funding) or charge.get("disputed"):
            raise BillingBlocked("Refunded or disputed funding cannot create new transfers")
        job = await billing.locked_job(db, payment.job_id)
        funding = await billing.require_execution_funding(db, job)
        payment = await db.scalar(
            select(PaymentRecord)
            .options(lazyload("*"))
            .where(PaymentRecord.id == payment.id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        if job.status != "completed" or not funding or funding.id != payment.funding_id:
            raise BillingBlocked("Client acceptance and matching paid funding are required")
        if payment.transfer_id:
            raise BillingBlocked("A transfer was already recorded; retry reconciliation")
        user = await db.get(User, payment.developer_user_id, options=[lazyload("*")])
        human_task = await db.get(Task, payment.task_id, options=[lazyload('*')]) if payment.task_id else None
        if not user or not user.is_active or (user.role != 'agent_developer' and not (human_task and human_task.human_contract_json)):
            raise BillingBlocked("Only an external developer can receive a Connect transfer")
        if data != await _transfer_contract(db, funding, payment):
            raise BillingBlocked("The transfer contract changed during reservation")
        allocations = (
            await db.execute(
                select(PaymentRecord.net_amount, PaymentRecord.currency).where(
                    PaymentRecord.funding_id == funding.id,
                    PaymentRecord.provider == "stripe_connect",
                )
            )
        ).all()
        if (
            any(currency.lower() != funding.currency for _, currency in allocations)
            or sum(to_minor(value, currency) for value, currency in allocations)
            > funding.amount_minor
        ):
            raise BillingBlocked("Payout allocations exceed confirmed funding")
        if human_task and human_task.human_contract_json:
            from app.services.human_workers import eligibility
            if await eligibility(db, payment.developer_user_id, human_task, accepting=False):
                raise BillingBlocked('Human worker verification, consent or payment eligibility needs review')
        operation.payload = data
        payment.payment_status = "processing"
        payment.payout_error = None
        await _external_reservation(db, operation)
        remote = await get_gateway().request(
            "POST", "/transfers", data=data, idempotency_key=f"taskmatch:transfer:{payment.id}"
        )
        _validate_transfer(remote, funding, payment, data)
        await _record_transfer(db, funding, payment, remote)


def _validate_reversal(value, payment, currency):
    if (
        not str(value.get("id", "")).startswith("trr_")
        or value.get("transfer") != payment.transfer_id
        or value.get("currency") != currency
        or type(value.get("amount")) is not int
        or value["amount"] <= 0
    ):
        raise BillingBlocked("Stripe reversal does not match its transfer")


async def _reverse_transfers(db, funding, operation):
    rows = list(
        (
            await db.execute(
                select(PaymentRecord)
                .options(lazyload("*"))
                .where(
                    PaymentRecord.funding_id == funding.id, PaymentRecord.transfer_id.is_not(None)
                )
            )
        ).scalars()
    )
    for payment in rows:
        data = await _transfer_contract(db, funding, payment)
        remote = await get_gateway().request("GET", f"/transfers/{payment.transfer_id}")
        _validate_transfer(remote, funding, payment, data, expected_id=payment.transfer_id)
        reversed_amount = remote["amount_reversed"]
        reversals = await _list_all(f"/transfers/{payment.transfer_id}/reversals", {})
        for value in reversals:
            _validate_reversal(value, payment, funding.currency)
        if sum(value["amount"] for value in reversals) != reversed_amount:
            raise BillingBlocked("Stripe reversal references do not reconcile to the transfer")
        if remote["reversed"]:
            payment.reversal_id = reversals[0]["id"]
        else:
            payload = dict(operation.payload or {})
            reservations = dict(payload.get("reversals") or {})
            reserved = reservations.get(str(payment.id))
            if not reserved:
                reserved = {
                    "amount": data["amount"] - reversed_amount,
                    "already_reversed": reversed_amount,
                    "started_at": billing.now().isoformat(),
                    "transfer_id": payment.transfer_id,
                }
                reservations[str(payment.id)] = reserved
                operation.payload = dict(payload, reversals=reservations)
                await db.commit()
            if (
                reserved["transfer_id"] != payment.transfer_id
                or reserved["already_reversed"] != reversed_amount
                or reserved["amount"] != data["amount"] - reversed_amount
            ):
                raise BillingBlocked(
                    "A partial reversal changed after reservation; reconcile before another reversal"
                )
            if billing.now() - datetime.fromisoformat(reserved["started_at"]) > timedelta(hours=20):
                raise BillingBlocked(
                    "Reversal outcome is still uncertain after its replay deadline"
                )
            reverse = await get_gateway().request(
                "POST",
                f"/transfers/{payment.transfer_id}/reversals",
                data={
                    "amount": reserved["amount"],
                    "metadata[app]": "taskmatch",
                    "metadata[taskmatch_payment_id]": str(payment.id),
                },
                idempotency_key=f"taskmatch:reverse:{payment.id}:{reserved['already_reversed']}",
            )
            _validate_reversal(reverse, payment, funding.currency)
            if reverse["amount"] != reserved["amount"]:
                raise BillingBlocked("Stripe reversal amount differs from its reservation")
            proof = await get_gateway().request("GET", f"/transfers/{payment.transfer_id}")
            _validate_transfer(proof, funding, payment, data, expected_id=payment.transfer_id)
            if not proof["reversed"]:
                raise BillingBlocked("Stripe has not confirmed the complete transfer reversal")
            payment.reversal_id = reverse["id"]
        payment.payment_status = "reversed"
        payment.payout_error = None
        await db.commit()


def _validate_refund(remote, funding, *, amount=None):
    if (
        not str(remote.get("id", "")).startswith("re_")
        or remote.get("charge") != funding.charge_id
        or remote.get("payment_intent") != funding.payment_intent_id
        or remote.get("currency") != funding.currency
        or not _metadata_matches(
            remote, {"app": "taskmatch", "taskmatch_funding_id": str(funding.id)}
        )
        or type(remote.get("amount")) is not int
        or not 0 < remote["amount"] <= funding.amount_minor
        or (amount is not None and remote["amount"] != amount)
    ):
        raise BillingBlocked("Stripe refund does not match its funding contract")


async def _refund_attempt(db, funding, operation, charge):
    payload = dict(operation.payload or {})
    generation = payload.get("refund_generation", 1)
    refund_id = payload.get("refund_id") or funding.refund_id
    remote = None
    if refund_id:
        remote = await get_gateway().request("GET", f"/refunds/{refund_id}")
        if remote.get("id") != refund_id:
            raise BillingBlocked("Stripe returned a different refund reference")
        _validate_refund(remote, funding, amount=payload.get("refund_amount"))
    elif operation.external_started_at:
        candidates = await _list_all("/refunds", {"payment_intent": funding.payment_intent_id})
        matches = [
            value
            for value in candidates
            if _metadata_matches(
                value, {"app": "taskmatch", "taskmatch_funding_id": str(funding.id)}
            )
            and str((value.get("metadata") or {}).get("taskmatch_refund_generation", "1"))
            == str(generation)
        ]
        if len(matches) > 1:
            raise BillingBlocked("Several refunds match one reserved refund attempt")
        if matches:
            remote = matches[0]
            _validate_refund(remote, funding, amount=payload.get("refund_amount"))
            funding.refund_id = remote["id"]
            payload["refund_id"] = remote["id"]
            operation.payload = payload
            await db.commit()
    if remote:
        if remote.get("status") == "failed":
            # Only canonical proof of a terminal failure permits a different key.
            generation += 1
            payload = dict(
                payload,
                refund_generation=generation,
                refund_id=None,
                failed_refund_ids=[*(payload.get("failed_refund_ids") or []), remote["id"]],
            )
            payload.pop("refund_amount", None)
            funding.refund_id = None
            operation.external_started_at = None
            operation.payload = payload
            await db.commit()
        elif remote.get("status") == "succeeded":
            return
        else:
            raise BillingBlocked(
                "Stripe refund is pending or requires attention; retrieve it again before another attempt"
            )
    amount = funding.amount_minor - charge["amount_refunded"]
    if "refund_amount" in payload and payload["refund_amount"] != amount:
        raise BillingBlocked("The remaining refund amount changed after reservation")
    operation.payload = dict(payload, refund_generation=generation, refund_amount=amount)
    await _external_reservation(db, operation)
    remote = await get_gateway().request(
        "POST",
        "/refunds",
        data={
            "payment_intent": funding.payment_intent_id,
            "amount": amount,
            "reason": "requested_by_customer",
            "metadata[app]": "taskmatch",
            "metadata[taskmatch_funding_id]": str(funding.id),
            "metadata[taskmatch_refund_generation]": str(generation),
        },
        idempotency_key=f"taskmatch:refund:{funding.id}:{generation}",
    )
    _validate_refund(remote, funding, amount=amount)
    funding.refund_id = remote["id"]
    operation.payload = dict(operation.payload, refund_id=remote["id"])
    await db.commit()
    if remote.get("status") != "succeeded":
        raise BillingBlocked(
            "Stripe refund is pending or failed; retrieve its canonical state before retrying"
        )


async def refund(operation_id, factory, *, reversal_only=False):
    async with factory() as db:
        operation = await db.get(BillingOperation, operation_id)
        funding = await db.get(JobFunding, uuid.UUID(operation.entity_id))
        if not funding:
            raise BillingBlocked("No matching funding exists")
        job = await billing.locked_job(db, funding.job_id)
        funding = await db.get(JobFunding, funding.id, populate_existing=True)
        if funding.status not in ("refund_pending", "refunded", "partially_refunded"):
            raise BillingBlocked("Funding is not reserved for a refund")
        if await db.scalar(
            select(PaymentRecord.id)
            .where(
                PaymentRecord.funding_id == funding.id, PaymentRecord.payment_status == "processing"
            )
            .limit(1)
        ):
            raise BillingBlocked("An earlier transfer needs reconciliation before refund")
        if funding.livemode != billing.live_mode() or not funding.charge_id:
            raise BillingBlocked("No matching Stripe captured charge exists")
        await db.commit()
        charge = await get_gateway().request("GET", f"/charges/{funding.charge_id}")
        refunded = _validate_charge(charge, funding)
        if charge.get("disputed"):
            raise BillingBlocked("Resolve the Stripe dispute before refunding this charge")
        await _reverse_transfers(db, funding, operation)
        if refunded < funding.amount_minor and not reversal_only:
            await _refund_attempt(db, funding, operation, charge)
            charge = await get_gateway().request("GET", f"/charges/{funding.charge_id}")
            refunded = _validate_charge(charge, funding)
            if refunded < funding.amount_minor:
                raise BillingBlocked("Stripe has not confirmed the complete refund yet")
        await billing.locked_job(db, job.id)
        funding = await db.get(JobFunding, funding.id, populate_existing=True)
        funding.refunded_minor = max(funding.refunded_minor, refunded)
        if funding.refunded_minor:
            funding.status = (
                "refunded"
                if funding.refunded_minor == funding.amount_minor
                else "partially_refunded"
            )
            funding.last_error = None
            await db.execute(
                update(PaymentRecord)
                .where(PaymentRecord.funding_id == funding.id)
                .values(payment_status="refunded" if funding.status == "refunded" else "blocked")
            )
        await db.commit()


async def _funding_for_charge(db, charge):
    funding = await db.scalar(select(JobFunding).where(JobFunding.charge_id == charge.get("id")))
    if funding:
        return funding
    metadata = charge.get("metadata") or {}
    if metadata.get("app") != "taskmatch":
        return None
    try:
        funding_id = uuid.UUID(metadata["taskmatch_funding_id"])
    except (ValueError, KeyError, TypeError):
        raise BillingBlocked(
            "Charge metadata does not identify a TaskMatch funding contract"
        ) from None
    funding = await db.get(JobFunding, funding_id)
    if not funding:
        return None
    if funding.charge_id:
        raise BillingBlocked("Charge differs from the captured charge of this funding")
    if funding.checkout_session_id:
        session = await get_gateway().request(
            "GET",
            f"/checkout/sessions/{funding.checkout_session_id}",
            data={"expand[0]": "payment_intent.latest_charge"},
        )
        await billing.confirm_checkout(db, session)
    else:
        sessions = await _list_all(
            "/checkout/sessions",
            {
                "payment_intent": charge.get("payment_intent"),
                "expand[0]": "data.payment_intent.latest_charge",
            },
        )
        matches = [
            session for session in sessions if _metadata_matches(session, billing.metadata(funding))
        ]
        if len(matches) != 1:
            raise BillingBlocked("No unique Checkout session proves this captured funding")
        await billing.confirm_checkout(db, matches[0])
    await db.flush()
    funding = await db.get(JobFunding, funding.id, populate_existing=True)
    if funding.charge_id != charge.get("id"):
        raise BillingBlocked("Checkout has not bound this charge to its funding contract")
    return funding


def _validate_dispute(dispute, funding, expected_id):
    if (
        dispute.get("id") != expected_id
        or dispute.get("charge") != funding.charge_id
        or dispute.get("payment_intent") != funding.payment_intent_id
        or dispute.get("currency") != funding.currency
        or dispute.get("livemode") is not funding.livemode
        or type(dispute.get("amount")) is not int
        or not 0 < dispute["amount"] <= funding.amount_minor
    ):
        raise BillingBlocked("Stripe dispute does not match its funding contract")


async def process_event(operation_id, factory):
    async with factory() as db:
        operation = await db.get(BillingOperation, operation_id)
        event = await db.get(StripeEvent, operation.entity_id)
        if event.processed_at:
            return
        if event.livemode != billing.live_mode():
            raise BillingBlocked("Stripe event mode does not match the configured account")
        kind = event.event_type
        obj = event.payload["data"]["object"]
        if kind.startswith("checkout.session."):
            remote = await get_gateway().request(
                "GET",
                f"/checkout/sessions/{obj['id']}",
                data={"expand[0]": "payment_intent.latest_charge"},
            )
            if remote.get("id") != obj["id"]:
                raise BillingBlocked("Stripe returned a different Checkout session")
            if remote.get("payment_status") == "paid":
                await billing.confirm_checkout(db, remote)
            elif remote.get("status") == "expired":
                funding = await db.scalar(
                    select(JobFunding).where(JobFunding.checkout_session_id == remote["id"])
                )
                if funding:
                    await billing.locked_job(db, funding.job_id)
                    funding = await db.get(JobFunding, funding.id, populate_existing=True)
                    if (
                        funding.checkout_session_id == remote["id"]
                        and _metadata_matches(remote, billing.metadata(funding))
                        and remote.get("livemode") is funding.livemode
                        and funding.status in ("creating", "checkout_pending")
                    ):
                        funding.status = "expired"
                        funding.checkout_url = None
        elif kind == "payment_intent.succeeded":
            sessions = await _list_all(
                "/checkout/sessions",
                {"payment_intent": obj["id"], "expand[0]": "data.payment_intent.latest_charge"},
            )
            for session in sessions:
                if (session.get("metadata") or {}).get("app") == "taskmatch":
                    await billing.confirm_checkout(db, session)
        elif kind == "account.updated":
            from app.services.stripe_connect import apply_account_update

            remote = await get_gateway().request("GET", f"/accounts/{obj['id']}")
            if remote.get("id") != obj["id"]:
                raise BillingBlocked("Stripe returned a different connected account")
            await apply_account_update(db, remote)
        elif kind.startswith(("charge.", "refund.")):
            charge_id = (
                obj.get("charge")
                if kind.startswith(("charge.dispute.", "refund."))
                else obj.get("id")
            )
            if not isinstance(charge_id, str) or not charge_id.startswith("ch_"):
                raise BillingBlocked("Stripe event has no captured charge reference")
            charge = await get_gateway().request("GET", f"/charges/{charge_id}")
            if charge.get("id") != charge_id:
                raise BillingBlocked("Stripe returned a different captured charge")
            funding = await _funding_for_charge(db, charge)
            if funding:
                amount = _validate_charge(charge, funding)
                dispute = None
                if kind.startswith("charge.dispute."):
                    dispute = await get_gateway().request("GET", f"/disputes/{obj['id']}")
                    _validate_dispute(dispute, funding, obj["id"])
                job = await billing.locked_job(db, funding.job_id)
                funding = await db.get(JobFunding, funding.id, populate_existing=True)
                _validate_charge(charge, funding)
                funding.refunded_minor = max(funding.refunded_minor, amount)
                if amount:
                    funding.status = (
                        "refunded"
                        if funding.refunded_minor == funding.amount_minor
                        else "partially_refunded"
                    )
                    funding.last_error = (
                        None
                        if funding.status == "refunded"
                        else "A partial refund was made in Stripe. Work and transfers are blocked for review."
                    )
                    if job.status != "completed":
                        job.status = "cancelled"
                    if funding.status == "refunded":
                        await billing.enqueue_operation(
                            db, "reverse_refund", funding.id, f"reverse_refund:{funding.id}"
                        )
                if dispute:
                    if dispute.get("status") == "won":
                        refund_reserved = await db.scalar(
                            select(BillingOperation.id)
                            .where(
                                BillingOperation.kind == "refund",
                                BillingOperation.entity_id == str(funding.id),
                            )
                            .limit(1)
                        )
                        if (
                            funding.status == "disputed"
                            and not funding.refunded_minor
                            and not charge.get("disputed")
                            and not refund_reserved
                        ):
                            funding.status = "paid"
                            funding.last_error = None
                            if job.status == "completed":
                                await billing.queue_payouts(db, job)
                    elif funding.status not in (
                        "refund_pending",
                        "refunded",
                        "partially_refunded",
                        "requires_review",
                    ):
                        funding.status = "disputed"
                        funding.last_error = "Stripe reports a payment dispute. Work and new transfers are blocked; review the dispute in Stripe."
                elif charge.get("disputed") and funding.status == "paid":
                    funding.status = "disputed"
                    funding.last_error = (
                        "Stripe reports a payment dispute. Work and new transfers are blocked."
                    )
        event.processed_at = billing.now()
        await db.commit()
