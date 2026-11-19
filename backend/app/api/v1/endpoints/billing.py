"""Stripe funding and operator actions; no browser-supplied payment proof."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import lazyload

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.middleware.audit import log_audit
from app.models.billing import BillingOperation, JobFunding, StripeConnectAccount, StripeEvent
from app.models.job import Job
from app.models.payment import PaymentRecord
from app.models.user import User
from app.services import billing_service as billing
from app.services.stripe_gateway import verify_signature

router = APIRouter()


async def owner_job(db, job_id, user):
    job = await db.scalar(select(Job).options(lazyload("*")).where(Job.id == job_id))
    if not job:
        raise HTTPException(404, "Job not found")
    if user.role != "admin" and user.id != job.client_user_id:
        raise HTTPException(403, "Access denied")
    return job


@router.get("/config")
async def config(user=Depends(get_current_active_user)):
    enabled = billing.billing_enabled()
    return {
        "enabled": enabled,
        "mode": settings.STRIPE_MODE if enabled else "unconfigured",
        "currencies": ["EUR"],
        "connect_enabled": enabled and bool(settings.STRIPE_CONNECT_WEBHOOK_SECRET),
    }


@router.get("/jobs/{job_id}")
async def payment_status(
    job_id: uuid.UUID, user=Depends(get_current_active_user), db=Depends(get_db, scope="function")
):
    return await billing.funding_view(db, await owner_job(db, job_id, user))


@router.post("/jobs/{job_id}/checkout")
async def checkout(job_id: uuid.UUID, user=Depends(get_current_active_user), db=Depends(get_db, scope="function")):
    return await billing.create_checkout(db, await owner_job(db, job_id, user), user)


@router.post("/jobs/{job_id}/sync")
async def sync(job_id: uuid.UUID, user=Depends(get_current_active_user), db=Depends(get_db, scope="function")):
    return await billing.sync_funding(db, await owner_job(db, job_id, user))


@router.post("/jobs/{job_id}/cancel")
async def cancel(job_id: uuid.UUID, user=Depends(get_current_active_user), db=Depends(get_db, scope="function")):
    return await billing.cancel_checkout(db, await owner_job(db, job_id, user))


async def webhook(request, db, secret):
    if not secret:
        raise HTTPException(503, "Webhook is not configured")
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > 1024 * 1024:
            raise HTTPException(413, "Webhook payload too large")
    event = verify_signature(bytes(body), request.headers.get("stripe-signature", ""), secret)
    if (
        not isinstance(event.get("id"), str)
        or not event["id"].startswith("evt_")
        or not isinstance(event.get("type"), str)
    ):
        raise HTTPException(400, "Invalid Stripe event envelope")
    if event.get("livemode") is not billing.live_mode():
        raise HTTPException(400, "Stripe event mode mismatch")
    obj = (event.get("data") or {}).get("object") or {}
    if not isinstance(obj, dict):
        raise HTTPException(400, "Invalid Stripe event object")
    kind = event["type"]
    relevant = (obj.get("metadata") or {}).get("app") == "taskmatch"
    if kind == "account.updated":
        relevant = bool(
            await db.scalar(
                select(StripeConnectAccount.user_id).where(
                    StripeConnectAccount.account_id == obj.get("id")
                )
            )
        )
    elif kind.startswith(("charge.", "refund.")):
        charge = (
            obj.get("charge") if kind.startswith(("charge.dispute.", "refund.")) else obj.get("id")
        )
        intent = obj.get("payment_intent")
        relevant = relevant or bool(
            await db.scalar(
                select(JobFunding.id).where(
                    or_(
                        JobFunding.charge_id == charge,
                        JobFunding.payment_intent_id == intent if intent else False,
                    )
                )
            )
        )
    allowed = {
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.async_payment_failed",
        "checkout.session.expired",
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
        "charge.refunded",
        "charge.dispute.created",
        "charge.dispute.closed",
        "refund.updated",
        "refund.failed",
        "account.updated",
    }
    if not relevant or kind not in allowed:
        return {"received": True, "ignored": True}
    await db.execute(
        insert(StripeEvent)
        .values(id=event["id"], event_type=kind, livemode=event["livemode"], payload=event)
        .on_conflict_do_nothing(index_elements=["id"])
    )
    await billing.enqueue_operation(db, "stripe_event", event["id"], f"event:{event['id']}")
    return {"received": True}


@router.post("/webhook")
async def stripe_webhook(request: Request, db=Depends(get_db, scope="function")):
    return await webhook(request, db, settings.STRIPE_WEBHOOK_SECRET)


@router.post("/webhook/connect")
async def stripe_connect_webhook(request: Request, db=Depends(get_db, scope="function")):
    return await webhook(request, db, settings.STRIPE_CONNECT_WEBHOOK_SECRET)


@router.post("/jobs/{job_id}/refund")
async def refund(job_id: uuid.UUID, user=Depends(require_role("admin")), db=Depends(get_db, scope="function")):
    from app.services.billing_processors import request_refund

    job = await owner_job(db, job_id, user)
    funding = await request_refund(db, job, user)
    return {"status": funding.status}


@router.post("/payments/{payment_id}/retry")
async def retry_transfer(
    payment_id: uuid.UUID, user=Depends(require_role("admin")), db=Depends(get_db, scope="function")
):
    payment = await db.scalar(
        select(PaymentRecord).options(lazyload("*")).where(PaymentRecord.id == payment_id)
    )
    if not payment:
        raise HTTPException(404, "Payment not found")
    job = await billing.locked_job(db, payment.job_id)
    await billing.require_execution_funding(db, job)
    if (
        job.status != "completed"
        or payment.provider != "stripe_connect"
        or payment.payment_status not in ("releasable", "blocked", "failed")
    ):
        raise HTTPException(409, "This transfer cannot be retried")
    await billing.queue_user_payouts(db, payment.developer_user_id)
    await log_audit(
        db,
        actor_type="user",
        actor_id=str(user.id),
        action="stripe.transfer.retry",
        entity_type="payment",
        entity_id=str(payment.id),
    )
    return {"status": "pending"}


@router.get("/admin/fundings")
async def admin_fundings(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=200),
    user=Depends(require_role("admin")),
    db=Depends(get_db, scope="function"),
):
    rows = (
        await db.execute(
            select(JobFunding, Job.title, User.full_name)
            .join(Job, Job.id == JobFunding.job_id)
            .join(User, User.id == JobFunding.client_user_id)
            .options(lazyload("*"))
            .order_by(JobFunding.created_at.desc(), JobFunding.id)
            .offset(skip)
            .limit(limit)
        )
    ).all()
    return [
        {
            "id": str(f.id),
            "job_id": str(f.job_id),
            "job_title": title,
            "payer_name": payer,
            "amount_minor": f.amount_minor,
            "currency": f.currency,
            "refunded_minor": f.refunded_minor,
            "status": f.status,
            "error": f.last_error,
            "can_refund": f.status in ("paid", "partially_refunded", "requires_review"),
        }
        for f, title, payer in rows
    ]


@router.get("/admin/operations")
async def admin_operations(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=200),
    user=Depends(require_role("admin")),
    db=Depends(get_db, scope="function"),
):
    rows = (
        await db.execute(
            select(BillingOperation)
            .order_by(BillingOperation.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
    ).scalars()
    result = []
    for o in rows:
        item = {
            "id": str(o.id),
            "kind": o.kind,
            "entity_id": o.entity_id,
            "status": o.status,
            "attempts": o.attempts,
            "last_error": o.last_error,
            "available_at": o.available_at,
        }
        if o.kind in ("transfer", "refund", "reverse_refund"):
            model = PaymentRecord if o.kind == "transfer" else JobFunding
            entity = await db.get(model, uuid.UUID(o.entity_id), options=[lazyload("*")])
            if entity:
                from app.services.stripe_gateway import to_minor

                item.update(
                    amount_minor=to_minor(entity.net_amount, entity.currency)
                    if o.kind == "transfer"
                    else entity.amount_minor,
                    currency=entity.currency.lower(),
                    job_title=await db.scalar(select(Job.title).where(Job.id == entity.job_id)),
                )
        result.append(item)
    return result


@router.post("/admin/operations/{operation_id}/retry")
async def retry_operation(
    operation_id: uuid.UUID, user=Depends(require_role("admin")), db=Depends(get_db, scope="function")
):
    existing = await db.get(BillingOperation, operation_id)
    if existing and existing.kind == "execute_task":
        from app.services.execution_state import retry_task
        return await retry_task(db, uuid.UUID(existing.entity_id), user)
    operation = await db.scalar(
        select(BillingOperation).where(BillingOperation.id == operation_id).with_for_update()
    )
    if not operation:
        raise HTTPException(404, "Operation not found")
    if operation.status not in ("failed", "blocked"):
        raise HTTPException(409, "Only a failed or blocked operation can be retried")
    operation.status = "pending"
    operation.available_at = billing.now()
    operation.last_error = None
    await log_audit(
        db,
        actor_type="user",
        actor_id=str(user.id),
        action="stripe.operation.retry",
        entity_type="billing_operation",
        entity_id=str(operation.id),
    )
    return {"status": "pending"}


class CheckoutReconciliation(BaseModel):
    session_id: str = Field(pattern=r"^cs_(?:test_|live_)?[A-Za-z0-9]+$", max_length=255)


@router.post("/jobs/{job_id}/reconcile")
async def reconcile(
    job_id: uuid.UUID,
    body: CheckoutReconciliation,
    user=Depends(require_role("admin")),
    db=Depends(get_db, scope="function"),
):
    result = await billing.reconcile_checkout(
        db, await owner_job(db, job_id, user), body.session_id
    )
    await log_audit(
        db,
        actor_type="user",
        actor_id=str(user.id),
        action="stripe.checkout.reconcile",
        entity_type="job",
        entity_id=str(job_id),
    )
    return result
