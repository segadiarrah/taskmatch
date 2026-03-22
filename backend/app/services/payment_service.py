"""Payment state machine service.

Manages the lifecycle of ``PaymentRecord`` objects through their valid
state transitions::

    pending -> authorized -> releasable -> paid -> (completed)
                   |
                   +-> cancelled
                   +-> refunded

Every state transition is validated and audit-logged.
"""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
from typing import Any
from uuid import UUID

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog
from app.models.job import Job
from app.models.payment import PaymentRecord, PaymentStatus
from app.models.task import Task

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PLATFORM_FEE_RATE = Decimal("0.10")  # 10 %

# Valid state transitions: current_state -> set of allowed next states
_VALID_TRANSITIONS: dict[PaymentStatus, set[PaymentStatus]] = {
    PaymentStatus.pending: {PaymentStatus.authorized, PaymentStatus.cancelled},
    PaymentStatus.authorized: {
        PaymentStatus.releasable,
        PaymentStatus.cancelled,
        PaymentStatus.refunded,
    },
    PaymentStatus.releasable: {
        PaymentStatus.paid,
        PaymentStatus.cancelled,
        PaymentStatus.refunded,
    },
    PaymentStatus.paid: {PaymentStatus.completed, PaymentStatus.refunded},
    PaymentStatus.completed: set(),  # terminal
    PaymentStatus.failed: set(),  # terminal
    PaymentStatus.refunded: set(),  # terminal
    PaymentStatus.cancelled: set(),  # terminal (using string comparison below)
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _log_audit(
    db: AsyncSession,
    *,
    action: str,
    entity_type: str,
    entity_id: str,
    payload: dict[str, Any] | None = None,
) -> AuditLog:
    """Write an audit log entry for a payment action."""
    entry = AuditLog(
        actor_type="system",
        actor_id="payment-service",
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        payload_json=payload,
    )
    db.add(entry)
    await db.flush()
    return entry


def _assert_transition(
    current: PaymentStatus,
    target: PaymentStatus,
    payment_id: UUID,
) -> None:
    """Raise ``ValueError`` if the transition is not allowed."""
    allowed = _VALID_TRANSITIONS.get(current, set())
    if target not in allowed:
        raise ValueError(
            f"Invalid payment transition for {payment_id}: "
            f"{current.value} -> {target.value}. "
            f"Allowed transitions from '{current.value}': "
            f"{', '.join(s.value for s in allowed) if allowed else 'none (terminal state)'}."
        )


async def _transition(
    db: AsyncSession,
    payment: PaymentRecord,
    target: PaymentStatus,
) -> PaymentRecord:
    """Perform a validated state transition and log it."""
    previous = payment.payment_status
    _assert_transition(previous, target, payment.id)

    payment.payment_status = target
    await db.flush()

    await _log_audit(
        db,
        action=f"payment.{target.value}",
        entity_type="payment_record",
        entity_id=str(payment.id),
        payload={
            "previous_status": previous.value,
            "new_status": target.value,
            "gross_amount": str(payment.gross_amount),
            "net_amount": str(payment.net_amount),
        },
    )

    logger.info(
        "payment.transition",
        payment_id=str(payment.id),
        from_status=previous.value,
        to_status=target.value,
    )
    return payment


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def create_payment_for_task(
    db: AsyncSession,
    task_id: UUID,
) -> PaymentRecord:
    """Create a new PaymentRecord for a task.

    Calculates the platform fee (10 % of gross) and net amount.

    Parameters
    ----------
    db : AsyncSession
    task_id : UUID
        The task to create a payment for.  The task must belong to a job
        with a ``client_user_id`` and have a budget set.

    Returns
    -------
    PaymentRecord
        The newly created payment record in ``pending`` status.

    Raises
    ------
    ValueError
        If the task or its parent job is not found, or if no budget is set.
    """
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if task is None:
        raise ValueError(f"Task {task_id} not found")

    job_result = await db.execute(select(Job).where(Job.id == task.job_id))
    job = job_result.scalar_one_or_none()
    if job is None:
        raise ValueError(f"Job {task.job_id} not found for task {task_id}")

    if task.budget is None or task.budget <= 0:
        raise ValueError(
            f"Task {task_id} has no budget set; cannot create payment"
        )

    gross = Decimal(str(task.budget)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    fee = (gross * PLATFORM_FEE_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    net = gross - fee

    payment = PaymentRecord(
        job_id=job.id,
        task_id=task_id,
        client_user_id=job.client_user_id,
        developer_user_id=None,  # set later when agent is assigned
        gross_amount=gross,
        platform_fee=fee,
        net_amount=net,
        currency=job.currency or "USD",
        payment_status=PaymentStatus.pending,
    )
    db.add(payment)
    await db.flush()

    await _log_audit(
        db,
        action="payment.created",
        entity_type="payment_record",
        entity_id=str(payment.id),
        payload={
            "task_id": str(task_id),
            "job_id": str(job.id),
            "gross_amount": str(gross),
            "platform_fee": str(fee),
            "net_amount": str(net),
            "currency": payment.currency,
        },
    )

    logger.info(
        "payment.created",
        payment_id=str(payment.id),
        task_id=str(task_id),
        gross=str(gross),
        fee=str(fee),
        net=str(net),
    )
    return payment


async def authorize_payment(
    db: AsyncSession,
    payment_id: UUID,
) -> PaymentRecord:
    """Move a payment from ``pending`` to ``authorized``.

    In production this would call Stripe to place a hold on the client's
    payment method.

    Parameters
    ----------
    db : AsyncSession
    payment_id : UUID

    Returns
    -------
    PaymentRecord
        Updated payment record.

    Raises
    ------
    ValueError
        If the payment is not found or the transition is invalid.
    """
    result = await db.execute(
        select(PaymentRecord).where(PaymentRecord.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    if payment is None:
        raise ValueError(f"Payment {payment_id} not found")

    # In production: call stripe.PaymentIntent.confirm() or similar
    logger.info(
        "payment.authorizing",
        payment_id=str(payment_id),
        provider=payment.provider,
    )

    return await _transition(db, payment, PaymentStatus.authorized)


async def release_payment(
    db: AsyncSession,
    payment_id: UUID,
) -> PaymentRecord:
    """Move a payment from ``authorized`` to ``releasable``.

    Marks the payment as ready to be disbursed to the developer/agent.
    Typically triggered after submission approval.

    Parameters
    ----------
    db : AsyncSession
    payment_id : UUID

    Returns
    -------
    PaymentRecord

    Raises
    ------
    ValueError
        If the payment is not found or the transition is invalid.
    """
    result = await db.execute(
        select(PaymentRecord).where(PaymentRecord.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    if payment is None:
        raise ValueError(f"Payment {payment_id} not found")

    logger.info(
        "payment.releasing",
        payment_id=str(payment_id),
    )

    return await _transition(db, payment, PaymentStatus.releasable)


async def complete_payment(
    db: AsyncSession,
    payment_id: UUID,
) -> PaymentRecord:
    """Move a payment through to ``paid`` and then ``completed``.

    For MVP this transitions ``releasable -> paid -> completed`` in one call.
    In production the ``releasable -> paid`` step would trigger an actual
    transfer via the payment provider, and ``paid -> completed`` would be
    confirmed asynchronously via webhook.

    Parameters
    ----------
    db : AsyncSession
    payment_id : UUID

    Returns
    -------
    PaymentRecord

    Raises
    ------
    ValueError
        If the payment is not found or a transition is invalid.
    """
    result = await db.execute(
        select(PaymentRecord).where(PaymentRecord.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    if payment is None:
        raise ValueError(f"Payment {payment_id} not found")

    logger.info(
        "payment.completing",
        payment_id=str(payment_id),
        current_status=payment.payment_status.value
        if hasattr(payment.payment_status, "value")
        else str(payment.payment_status),
    )

    # If still releasable, first move to paid
    if payment.payment_status == PaymentStatus.releasable:
        payment = await _transition(db, payment, PaymentStatus.paid)

    # Now move from paid to completed
    return await _transition(db, payment, PaymentStatus.completed)
