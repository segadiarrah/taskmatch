"""Durable PostgreSQL billing worker. Run independently of the HTTP server."""

import asyncio
import logging
import uuid
from datetime import timedelta
from pathlib import Path

from sqlalchemy import or_, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import lazyload

from app.core.config import settings
from app.core.database import async_session_factory
from app.models.billing import BillingOperation, BillingWorkerHeartbeat, JobFunding
from app.models.payment import PaymentRecord
from app.services import billing_processors as processors
from app.services import billing_service as billing
from app.services.stripe_gateway import StripeGatewayError

logger = logging.getLogger(__name__)


async def heartbeat(factory):
    async with factory() as db:
        await db.execute(
            insert(BillingWorkerHeartbeat)
            .values(id="billing", updated_at=billing.now())
            .on_conflict_do_update(index_elements=["id"], set_={"updated_at": billing.now()})
        )
        await db.commit()
    Path("/tmp/taskmatch-billing-heartbeat").touch()


async def renew_lease(factory, operation_id, claim_attempt):
    """A superseded claim cannot extend another worker's lease."""
    async with factory() as db:
        result = await db.execute(
            update(BillingOperation)
            .where(
                BillingOperation.id == operation_id,
                BillingOperation.status == "processing",
                BillingOperation.attempts == claim_attempt,
            )
            .values(
                locked_until=billing.now()
                + timedelta(seconds=settings.BILLING_OPERATION_LEASE_SECONDS)
            )
        )
        await db.commit()
        return result.rowcount == 1


async def keep_lease(factory, operation_id, claim_attempt):
    while True:
        await asyncio.sleep(30)
        if not await renew_lease(factory, operation_id, claim_attempt):
            return
        await heartbeat(factory)


async def run_once(factory=async_session_factory, *, execution=None):
    await heartbeat(factory)
    async with factory() as db:
        ready = (
            select(BillingOperation)
            .where(
                or_(
                    (BillingOperation.status == "pending")
                    & (BillingOperation.available_at <= billing.now()),
                    (BillingOperation.status == "processing")
                    & (BillingOperation.locked_until < billing.now()),
                )
            )
            .order_by(BillingOperation.available_at, BillingOperation.created_at)
            .with_for_update(skip_locked=True)
            .limit(1)
        )
        if execution is not None:
            ready = ready.where(
                BillingOperation.kind.in_(("execute", "execute_task"))
                if execution
                else BillingOperation.kind.not_in(("execute", "execute_task"))
            )
        operation = await db.scalar(ready)
        if not operation:
            return False
        operation.status = "processing"
        operation.attempts += 1
        operation.locked_until = billing.now() + timedelta(
            seconds=settings.BILLING_OPERATION_LEASE_SECONDS
        )
        await db.commit()
        operation_id, kind, entity_id, payload = (
            operation.id,
            operation.kind,
            operation.entity_id,
            operation.payload,
        )
        claim_attempt = operation.attempts
    pulse = asyncio.create_task(keep_lease(factory, operation_id, claim_attempt))
    error = None
    status = "done"
    try:
        if kind == "check_offer_expiry":
            await processors.check_offer_expiry(entity_id, payload["generation"], factory)
        elif kind == "fund_human_job":
            from app.services.autonomous_funding import process_funding
            await process_funding(operation_id, factory)
        elif kind == "stripe_event":
            await processors.process_event(operation_id, factory)
        elif kind == "transfer":
            await processors.transfer(operation_id, factory)
        elif kind in ("refund", "reverse_refund"):
            await processors.refund(operation_id, factory, reversal_only=kind == "reverse_refund")
        elif kind == "execute_task":
            from app.services.task_execution import dispatch
            await dispatch(operation_id, claim_attempt, factory)
        elif kind == "execute":
            from app.api.v1.endpoints.jobs import _execute_job, _run_revision

            if payload and "revision_reason" in payload:
                await _run_revision(uuid.UUID(entity_id), payload["revision_reason"])
            else:
                await _execute_job(uuid.UUID(entity_id))
        else:
            raise processors.BillingBlocked("Unsupported billing operation")
    except Exception as exc:
        from fastapi import HTTPException

        if isinstance(exc, processors.BillingBlocked):
            status, error = "blocked", str(exc)
        elif isinstance(exc, HTTPException):
            status, error = "blocked", str(exc.detail)
        elif isinstance(exc, StripeGatewayError):
            status, error = ("pending" if exc.retryable else "failed"), str(exc)
        else:
            status, error = (
                "pending",
                "An internal processing error occurred; the operation will retry.",
            )
            logger.exception(
                "Billing operation failed", extra={"operation_id": str(operation_id), "kind": kind}
            )
    finally:
        pulse.cancel()
        try:
            await pulse
        except asyncio.CancelledError:
            pass
    async with factory() as db:
        # HTTP refund/retry paths take the parent job before the ledger and
        # outbox. Error projection must preserve that order too.
        funding = payment = None
        if error and kind in ("refund", "reverse_refund", "transfer", "fund_human_job"):
            entity_model = PaymentRecord if kind == "transfer" else JobFunding
            entity_uuid = uuid.UUID(entity_id)
            job_id = await db.scalar(
                select(entity_model.job_id).where(entity_model.id == entity_uuid)
            )
            if job_id:
                await billing.locked_job(db, job_id)
                entity = await db.scalar(
                    select(entity_model)
                    .options(lazyload("*"))
                    .where(entity_model.id == entity_uuid)
                    .with_for_update()
                )
                if kind == "transfer":
                    payment = entity
                else:
                    funding = entity
        operation = await db.scalar(
            select(BillingOperation)
            .where(
                BillingOperation.id == operation_id,
                BillingOperation.status == "processing",
                BillingOperation.attempts == claim_attempt,
            )
            .with_for_update()
        )
        if operation is None:
            # Another worker reclaimed the expired lease or an administrator
            # changed its state. Its result now owns this operation.
            return True
        if status == "pending" and operation.attempts >= 12:
            status = "failed"
        operation.status = status
        operation.last_error = error
        operation.locked_until = None
        operation.available_at = billing.now() + timedelta(
            seconds=min(3600, 2 ** min(operation.attempts, 11))
        )
        if error and kind == "fund_human_job" and funding and funding.status not in ("paid","cancelled","refund_pending","refunded","partially_refunded","disputed"):
            funding.status = "requires_review"
            funding.last_error = "This payment needs attention from the responsible account. Refresh or recover it before retrying."
        if error and kind in ("refund", "reverse_refund"):
            if funding:
                funding.last_error = error
        if error and kind == "transfer":
            if payment and not payment.transfer_id:
                # A transient remote failure may have moved funds: keep processing
                # until the same idempotent operation proves its outcome.
                payment.payment_status = (
                    "processing"
                    if operation.external_started_at and status in ("pending", "failed", "blocked")
                    else ("blocked" if status == "blocked" else "failed")
                )
                payment.payout_error = error
        await db.commit()
    return True


async def consume(*, execution):
    while True:
        try:
            worked = await run_once(execution=execution)
            if not worked:
                await asyncio.sleep(settings.BILLING_WORKER_POLL_SECONDS)
        except Exception:
            logger.exception("Billing worker loop failed")
            await asyncio.sleep(5)


async def consume_webhooks():
    from app.services.protocol_webhooks import run_once as deliver_once
    while True:
        try:
            if settings.HUMAN_TASKS_ENABLED:
                await deliver_once(async_session_factory)
        except Exception:
            logger.exception('Outbound event delivery failed')
        await asyncio.sleep(settings.BILLING_WORKER_POLL_SECONDS)


async def prune_measurement():
    from app.services.measurement import remove_expired
    while True:
        try:
            async with async_session_factory() as db:
                await remove_expired(db)
                await db.commit()
        except Exception:
            logger.exception("Usage-measurement retention cleanup failed")
        await asyncio.sleep(86400)


async def main():
    logging.basicConfig(level=logging.INFO)
    # Provider execution can await many slow model calls. Financial events and
    # refunds retain a dedicated consumer while bounded task attempts execute.
    await asyncio.gather(consume(execution=False), consume(execution=True), consume_webhooks(), prune_measurement())


if __name__ == "__main__":
    asyncio.run(main())
