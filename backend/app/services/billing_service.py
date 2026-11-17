"""Server-authoritative funding contracts and durable billing operations."""

import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import lazyload

from app.core.config import settings
from app.models.billing import BillingOperation, JobFunding
from app.models.job import Job, JobStatus
from app.models.payment import PaymentRecord
from app.models.quote import Quote, QuoteStatus
from app.models.user import User
from app.models.task import Task
from app.services import quote_service
from app.services.stripe_gateway import get_gateway, to_minor

ACTIVE_FUNDING = (
    "creating",
    "checkout_pending",
    "paid",
    "refund_pending",
    "refunded",
    "partially_refunded",
    "disputed",
    "requires_review",
)


def now():
    return datetime.now(UTC)


def live_mode():
    return settings.STRIPE_MODE == "live"


def billing_enabled():
    prefix = "sk_live_" if live_mode() else "sk_test_"
    restricted = "rk_live_" if live_mode() else "rk_test_"
    return bool(
        settings.STRIPE_SECRET_KEY
        and settings.STRIPE_SECRET_KEY.startswith((prefix, restricted))
        and settings.STRIPE_WEBHOOK_SECRET
    )


def ensure_configured():
    if not billing_enabled():
        raise HTTPException(503, "Stripe payments are not configured. No payment was created.")


async def locked_job(db, job_id):
    job = await db.scalar(
        select(Job)
        .options(lazyload("*"))
        .where(Job.id == job_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if not job:
        raise HTTPException(404, "Job not found")
    return job


async def latest_funding(db, job_id):
    return await db.scalar(
        select(JobFunding)
        .where(JobFunding.job_id == job_id)
        .order_by(JobFunding.created_at.desc(), JobFunding.id.desc())
        .limit(1)
    )


async def enqueue_operation(db, kind, entity_id, key, payload=None):
    await db.execute(
        insert(BillingOperation)
        .values(
            id=uuid.uuid4(),
            key=key,
            kind=kind,
            entity_id=str(entity_id),
            status="pending",
            attempts=0,
            payload=payload,
        )
        .on_conflict_do_nothing(index_elements=["key"])
    )


async def require_execution_funding(db, job):
    from app.services.human_tasks import require_approved_job
    await require_approved_job(db, job)
    if job.billing_mode == "legacy_manual":
        return None
    funding = await db.scalar(
        select(JobFunding)
        .where(JobFunding.job_id == job.id, JobFunding.status == "paid")
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if not funding or funding.refunded_minor or funding.livemode != live_mode():
        raise HTTPException(402, "A verified Stripe payment is required before work can proceed")
    quote = await db.scalar(
        select(Quote).options(lazyload("*")).where(Quote.id == funding.quote_id)
    )
    if (
        not quote
        or quote.status != QuoteStatus.accepted
        or funding.client_user_id != job.client_user_id
        or funding.currency != quote.currency.lower()
        or funding.currency != job.currency.lower()
        or funding.amount_minor != to_minor(quote.total, quote.currency)
    ):
        raise HTTPException(402, "The confirmed payment does not match the accepted quote")
    return funding


async def assert_quote_editable(db, job):
    if await db.scalar(
        select(JobFunding.id)
        .where(JobFunding.job_id == job.id, JobFunding.status.in_(ACTIVE_FUNDING))
        .limit(1)
    ):
        raise HTTPException(409, "Cancel the active Checkout before changing this quote")


async def queue_payouts(db, job):
    if job.billing_mode == "legacy_manual":
        return
    await require_execution_funding(db, job)
    payments = (
        await db.execute(
            select(PaymentRecord)
            .options(lazyload("*"))
            .where(
                PaymentRecord.job_id == job.id,
                PaymentRecord.provider == "stripe_connect",
                PaymentRecord.payment_status.in_(["releasable", "blocked", "failed"]),
            )
        )
    ).scalars()
    for payment in payments:
        await enqueue_operation(db, "transfer", payment.id, f"transfer:{payment.id}")


async def queue_user_payouts(db, user_id):
    rows = (
        await db.execute(
            select(PaymentRecord)
            .options(lazyload("*"))
            .where(
                PaymentRecord.developer_user_id == user_id,
                PaymentRecord.provider == "stripe_connect",
                PaymentRecord.payment_status.in_(["releasable", "blocked", "failed"]),
            )
        )
    ).scalars()
    for payment in rows:
        await enqueue_operation(db, "transfer", payment.id, f"transfer:{payment.id}")
        operation = await db.scalar(
            select(BillingOperation)
            .where(BillingOperation.key == f"transfer:{payment.id}")
            .with_for_update()
        )
        if operation.status in ("failed", "blocked"):
            operation.status = "pending"
            operation.available_at = now()
            operation.last_error = None


async def funding_view(db, job):
    funding = await latest_funding(db, job.id)
    rows = (
        await db.execute(
            select(PaymentRecord, User.full_name)
            .options(lazyload("*"))
            .outerjoin(User, User.id == PaymentRecord.developer_user_id)
            .where(PaymentRecord.job_id == job.id)
            .order_by(PaymentRecord.created_at)
        )
    ).all()
    return {
        "billing_mode": job.billing_mode,
        "status": funding.status
        if funding
        else ("legacy_manual" if job.billing_mode == "legacy_manual" else "unpaid"),
        "amount_minor": funding.amount_minor if funding else 0,
        "currency": funding.currency if funding else job.currency.lower(),
        "refunded_minor": funding.refunded_minor if funding else 0,
        "receipt_url": funding.receipt_url if funding else None,
        "checkout_url": funding.checkout_url
        if funding and funding.status == "checkout_pending"
        else None,
        "can_checkout": job.billing_mode == "stripe"
        and job.status == JobStatus.quoted
        and (
            not funding
            or funding.status in ("creating", "checkout_pending", "cancelled", "expired")
        ),
        "can_cancel": bool(funding and funding.status in ("creating", "checkout_pending")),
        "error": funding.last_error if funding else None,
        "payouts": [
            {
                "id": str(p.id),
                "status": getattr(p.payment_status, "value", p.payment_status),
                "amount_minor": to_minor(p.net_amount, p.currency),
                "currency": p.currency.lower(),
                "recipient_name": name or "Platform",
                "provider": p.provider,
                "error": p.payout_error,
            }
            for p, name in rows
        ],
    }


def checkout_view(funding):
    return {
        "checkout_url": funding.checkout_url if funding.status == "checkout_pending" else None,
        "session_id": funding.checkout_session_id,
        "status": funding.status,
        "amount_minor": funding.amount_minor,
        "currency": funding.currency,
    }


def metadata(funding):
    return {
        "app": "taskmatch",
        "taskmatch_funding_id": str(funding.id),
        "taskmatch_job_id": str(funding.job_id),
        "taskmatch_quote_id": str(funding.quote_id),
        "taskmatch_user_id": str(funding.client_user_id),
        "taskmatch_generation": str(funding.generation),
    }


async def create_checkout(db, job, user):
    from app.services.human_tasks import require_approved_job
    from app.services.human_authorization import enabled
    if await db.scalar(select(Task.id).where(Task.job_id==job.id,Task.human_contract_json.is_not(None)).limit(1)):
        enabled()
    await require_approved_job(db, job)
    ensure_configured()
    job = await locked_job(db, job.id)
    if job.client_user_id != user.id:
        raise HTTPException(403, "Only the job owner can pay this quote")
    if job.billing_mode != "stripe":
        raise HTTPException(409, "This job uses the legacy settlement process")
    funding = await latest_funding(db, job.id)
    if funding and funding.status == "paid":
        return checkout_view(funding)
    if job.status != JobStatus.quoted:
        raise HTTPException(409, "The job is not awaiting a quote payment")
    quote = await db.scalar(
        select(Quote)
        .options(lazyload("*"))
        .where(Quote.job_id == job.id)
        .order_by(Quote.created_at.desc())
        .limit(1)
    )
    if (
        funding
        and funding.status in ("creating", "checkout_pending")
        and funding.checkout_session_id
    ):
        session_id, generation = funding.checkout_session_id, funding.generation
        await db.commit()
        session = await get_gateway().request(
            "GET",
            f"/checkout/sessions/{session_id}",
            data={"expand[0]": "payment_intent.latest_charge"},
        )
        if session.get("payment_status") == "paid":
            await confirm_checkout(db, session)
            return checkout_view(await latest_funding(db, job.id))
        job = await locked_job(db, job.id)
        funding = await db.get(JobFunding, funding.id, populate_existing=True)
        if funding.generation != generation or funding.checkout_session_id != session_id:
            raise HTTPException(409, "A newer payment attempt exists. Refresh payment status.")
        if (
            funding.status not in ("creating", "checkout_pending")
            or session.get("status") != "expired"
        ):
            return checkout_view(funding)
        funding.status = "expired"
        funding.checkout_url = None
    if funding and funding.status not in ("creating", "checkout_pending", "cancelled", "expired"):
        raise HTTPException(409, "This payment requires review before another checkout")
    if funding and (funding.checkout_request or {}).get('method') == 'off_session' and funding.status not in ('cancelled', 'expired'):
        raise HTTPException(409, 'An agent payment is being reconciled. Refresh its status before starting another payment.')
    # An unknown outcome is retried with the exact persisted request, including
    # expiry, return URLs and email. Never change the key while it is unknown.
    recovering = bool(funding and funding.status == "creating" and funding.checkout_request)
    if recovering:
        if not funding.checkout_started_at or now() - funding.checkout_started_at > timedelta(
            hours=20
        ):
            raise HTTPException(
                409, "The payment attempt needs administrator reconciliation before another payment"
            )
    else:
        if (
            job.status != JobStatus.quoted
            or not quote
            or not quote.is_actionable
            or (quote.valid_until and quote.valid_until <= now() + timedelta(minutes=30))
        ):
            raise HTTPException(409, "Refresh the expired quote before paying")
        amount = to_minor(quote.total, quote.currency)
        if amount < 50:
            raise HTTPException(409, "The quote is below the supported card payment minimum")
        if not funding or funding.quote_id != quote.id:
            funding = JobFunding(
                id=uuid.uuid4(),
                job_id=job.id,
                quote_id=quote.id,
                client_user_id=job.client_user_id,
                amount_minor=amount,
                currency=quote.currency.lower(),
                livemode=live_mode(),
                status="creating",
                generation=1,
            )
            db.add(funding)
        elif funding.status in ("cancelled", "expired"):
            funding.generation += 1
            funding.status = "creating"
            funding.checkout_session_id = None
            funding.checkout_url = None
        funding.checkout_started_at = now()
        funding.checkout_expires_at = (
            min(quote.valid_until, now() + timedelta(hours=1))
            if quote.valid_until
            else now() + timedelta(hours=1)
        )
        data = {
            "mode": "payment",
            "adaptive_pricing[enabled]": "false",
            "payment_method_types[0]": "card",
            "client_reference_id": f"taskmatch:{funding.id}",
            "customer_email": user.email,
            "success_url": f"{settings.BILLING_SITE_URL}/client/jobs/{job.id}?checkout=success&session_id={{CHECKOUT_SESSION_ID}}",
            "cancel_url": f"{settings.BILLING_SITE_URL}/client/jobs/{job.id}?checkout=cancel",
            "expires_at": int(funding.checkout_expires_at.timestamp()),
            "line_items[0][quantity]": 1,
            "line_items[0][price_data][currency]": funding.currency,
            "line_items[0][price_data][unit_amount]": funding.amount_minor,
            "line_items[0][price_data][product_data][name]": "TaskMatch quoted services",
            "payment_intent_data[transfer_group]": f"taskmatch:{job.id}",
        }
        for key, value in metadata(funding).items():
            data[f"metadata[{key}]"] = value
            data[f"payment_intent_data[metadata][{key}]"] = value
        funding.checkout_request = data
    generation, funding_id, job_id = funding.generation, funding.id, job.id
    data = funding.checkout_request
    await db.commit()
    remote = await get_gateway().request(
        "POST",
        "/checkout/sessions",
        data=data,
        idempotency_key=f"taskmatch:checkout:{funding_id}:{generation}",
    )
    if recovering:
        remote = await get_gateway().request(
            "GET",
            f"/checkout/sessions/{remote['id']}",
            data={"expand[0]": "payment_intent.latest_charge"},
        )
    await locked_job(db, job_id)
    current = await db.get(JobFunding, funding_id, populate_existing=True)
    if current.generation != generation:
        raise HTTPException(409, "A newer payment attempt exists")
    if current.status == "creating":
        current.checkout_session_id = remote["id"]
        current.checkout_url = remote.get("url")
        current.status = "checkout_pending"
    await db.flush()
    if remote.get("payment_status") == "paid":
        await confirm_checkout(db, remote)
    elif remote.get("status") == "expired" and current.status == "checkout_pending":
        current.status = "expired"
        current.checkout_url = None
    return checkout_view(current)


async def confirm_checkout(db, session):
    meta = session.get("metadata") or {}
    if meta.get("app") != "taskmatch":
        return False
    try:
        funding_id = uuid.UUID(meta["taskmatch_funding_id"])
    except (ValueError, KeyError, TypeError):
        raise HTTPException(409, "Unknown payment contract") from None
    funding = await db.get(JobFunding, funding_id)
    if not funding:
        raise HTTPException(409, "Unknown payment contract")
    intent = session.get("payment_intent")
    if isinstance(intent, str):
        intent = await get_gateway().request(
            "GET", f"/payment_intents/{intent}", data={"expand[0]": "latest_charge"}
        )
    if (
        session.get("payment_status") != "paid"
        or not isinstance(intent, dict)
        or intent.get("status") != "succeeded"
    ):
        return False
    charge = intent.get("latest_charge")
    charge_id = charge.get("id") if isinstance(charge, dict) else charge
    if not isinstance(charge_id, str) or not charge_id.startswith("ch_"):
        raise HTTPException(409, "Stripe has not confirmed a captured charge")
    job_id = funding.job_id
    await db.commit()
    charge = await get_gateway().request("GET", f"/charges/{charge_id}")
    job = await locked_job(db, job_id)
    funding = await db.get(JobFunding, funding_id, populate_existing=True)
    expected = metadata(funding)
    valid = (
        all(str(meta.get(k)) == str(v) for k, v in expected.items())
        and all(str((intent.get("metadata") or {}).get(k)) == str(v) for k, v in expected.items())
        and session.get("client_reference_id") == f"taskmatch:{funding.id}"
        and session.get("amount_total") == funding.amount_minor
        and intent.get("amount_received") == funding.amount_minor
        and session.get("currency") == funding.currency
        and intent.get("currency") == funding.currency
        and session.get("livemode") is funding.livemode
        and intent.get("livemode") is funding.livemode
        and funding.livemode == live_mode()
        and (not funding.checkout_session_id or funding.checkout_session_id == session.get("id"))
        and (not funding.payment_intent_id or funding.payment_intent_id == intent.get("id"))
    )
    valid = valid and (
        charge.get("id") == charge_id
        and charge.get("payment_intent") == intent.get("id")
        and charge.get("amount") == funding.amount_minor
        and charge.get("currency") == funding.currency
        and charge.get("livemode") is funding.livemode
        and charge.get("paid") is True
        and charge.get("captured") is True
        and all(str((charge.get("metadata") or {}).get(k)) == str(v) for k, v in expected.items())
        and isinstance(charge.get("amount_refunded"), int)
        and 0 <= charge["amount_refunded"] <= funding.amount_minor
    )
    if not valid:
        raise HTTPException(409, "Stripe payment does not match the immutable quote contract")
    if funding.status in (
        "paid",
        "refund_pending",
        "refunded",
        "partially_refunded",
        "disputed",
        "requires_review",
    ):
        return funding.status == "paid"
    funding.checkout_session_id = session["id"]
    funding.checkout_url = None
    funding.payment_intent_id = intent["id"]
    funding.charge_id = charge["id"] if isinstance(charge, dict) else charge
    funding.receipt_url = charge.get("receipt_url") if isinstance(charge, dict) else None
    funding.status = "paid"
    funding.last_error = None
    if charge["amount_refunded"] or charge.get("disputed"):
        funding.refunded_minor = charge["amount_refunded"]
        funding.status = (
            ("refunded" if funding.refunded_minor == funding.amount_minor else "partially_refunded")
            if funding.refunded_minor
            else "disputed"
        )
        funding.last_error = "Stripe reports a refund or dispute. Work and transfers are blocked."
        await db.flush()
        return False
    quote = await db.get(Quote, funding.quote_id, options=[lazyload("*")])
    latest = await db.scalar(
        select(Quote.id).where(Quote.job_id == job.id).order_by(Quote.created_at.desc()).limit(1)
    )
    if (
        latest != funding.quote_id
        or job.status != JobStatus.quoted
        or quote.status not in ("pending_client", "draft", "expired")
    ):
        funding.status = "requires_review"
        funding.last_error = (
            "Payment received but the job changed. Review or refund it before work."
        )
        return False
    await quote_service.accept_quote(db, quote)
    await enqueue_operation(db, "execute", job.id, f"execute:{funding.id}")
    await db.flush()
    return True


async def sync_funding(db, job):
    funding = await latest_funding(db, job.id)
    if (
        funding
        and funding.checkout_session_id
        and funding.status in ("creating", "checkout_pending", "expired", "cancelled")
    ):
        session_id, generation = funding.checkout_session_id, funding.generation
        await db.commit()
        session = await get_gateway().request(
            "GET",
            f"/checkout/sessions/{session_id}",
            data={"expand[0]": "payment_intent.latest_charge"},
        )
        if session.get("payment_status") == "paid":
            await confirm_checkout(db, session)
        elif session.get("status") == "expired":
            await locked_job(db, job.id)
            funding = await db.get(JobFunding, funding.id, populate_existing=True)
            if (
                funding.generation == generation
                and funding.checkout_session_id == session_id
                and funding.status in ("creating", "checkout_pending")
            ):
                funding.status = "expired"
                funding.checkout_url = None
    return await funding_view(db, job)


async def cancel_checkout(db, job):
    job = await locked_job(db, job.id)
    funding = await latest_funding(db, job.id)
    if not funding or funding.status not in ("creating", "checkout_pending"):
        raise HTTPException(409, "No unpaid checkout can be cancelled")
    if not funding.checkout_session_id:
        raise HTTPException(
            409, "Checkout creation is still being reconciled. Retry payment status first."
        )
    session_id, generation = funding.checkout_session_id, funding.generation
    await db.commit()
    session = await get_gateway().request(
        "GET",
        f"/checkout/sessions/{session_id}",
        data={"expand[0]": "payment_intent.latest_charge"},
    )
    if session.get("payment_status") == "paid":
        await confirm_checkout(db, session)
        return await funding_view(db, job)
    if session.get("status") != "expired":
        await get_gateway().request(
            "POST",
            f"/checkout/sessions/{session_id}/expire",
            data={},
            idempotency_key=f"taskmatch:expire:{session_id}",
        )
    await locked_job(db, job.id)
    funding = await db.get(JobFunding, funding.id, populate_existing=True)
    if (
        funding.generation == generation
        and funding.checkout_session_id == session_id
        and funding.status in ("creating", "checkout_pending")
    ):
        funding.status = "cancelled"
        funding.checkout_url = None
    return await funding_view(db, job)


async def reconcile_checkout(db, job, session_id):
    """Bind a lost Checkout result using current Stripe proof, never an assertion."""
    remote = await get_gateway().request(
        "GET",
        f"/checkout/sessions/{session_id}",
        data={"expand[0]": "payment_intent.latest_charge"},
    )
    job = await locked_job(db, job.id)
    funding = await latest_funding(db, job.id)
    if not funding or funding.status not in (
        "creating",
        "checkout_pending",
        "expired",
        "cancelled",
    ):
        raise HTTPException(409, "No unresolved Checkout attempt exists")
    if (
        remote.get("id") != session_id
        or remote.get("livemode") is not funding.livemode
        or remote.get("amount_total") != funding.amount_minor
        or remote.get("currency") != funding.currency
        or remote.get("client_reference_id") != f"taskmatch:{funding.id}"
        or any(
            str((remote.get("metadata") or {}).get(k)) != str(v)
            for k, v in metadata(funding).items()
        )
        or (funding.checkout_session_id and funding.checkout_session_id != session_id)
    ):
        raise HTTPException(409, "The Stripe session does not match this payment attempt")
    funding.checkout_session_id = session_id
    if remote.get("payment_status") == "paid":
        await confirm_checkout(db, remote)
    elif remote.get("status") == "expired":
        funding.status = "expired"
        funding.checkout_url = None
    elif remote.get("status") == "open":
        funding.status = "checkout_pending"
        funding.checkout_url = remote.get("url")
    else:
        raise HTTPException(409, "Stripe has not resolved this payment attempt")
    await db.flush()
    return await funding_view(db, job)
