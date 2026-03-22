"""Payment management endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.middleware.audit import log_audit
from app.models.payment import PaymentRecord, PaymentStatus
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentResponse

router = APIRouter()


@router.get(
    "",
    response_model=list[PaymentResponse],
    summary="List payments",
)
async def list_payments(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> list[PaymentResponse]:
    """Return a paginated list of payments filtered by the caller's role.

    - Admins see all payments.
    - Clients see payments where they are the payer.
    - Agent developers see payments where they are the recipient.
    """
    query = select(PaymentRecord)

    role = str(current_user.role)
    if role == "client":
        query = query.where(PaymentRecord.client_user_id == current_user.id)
    elif role == "agent_developer":
        query = query.where(PaymentRecord.developer_user_id == current_user.id)
    # Admin sees all.

    query = query.order_by(PaymentRecord.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    payments = result.scalars().all()

    return [_to_payment_response(p) for p in payments]


@router.post(
    "",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a payment record (admin)",
)
async def create_payment(
    body: PaymentCreate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> PaymentResponse:
    """Create a new payment record.

    The platform fee and net amount are calculated from the ``gross_amount``
    and ``platform_fee_percent``.  Restricted to administrators.
    """
    platform_fee_amount = round(body.gross_amount * (body.platform_fee_percent / 100.0), 2)
    net_amount = round(body.gross_amount - platform_fee_amount, 2)

    payment = PaymentRecord(
        id=uuid.uuid4(),
        job_id=body.job_id,
        task_id=body.task_id,
        client_user_id=body.client_user_id,
        developer_user_id=body.developer_user_id,
        gross_amount=body.gross_amount,
        platform_fee=platform_fee_amount,
        net_amount=net_amount,
        payment_status=PaymentStatus.pending,
    )
    db.add(payment)
    await db.flush()
    await db.refresh(payment)

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="create_payment",
        entity_type="payment",
        entity_id=str(payment.id),
        payload={
            "job_id": str(body.job_id),
            "gross_amount": float(body.gross_amount),
            "platform_fee_percent": body.platform_fee_percent,
        },
    )

    return _to_payment_response(payment)


@router.put(
    "/{payment_id}/release",
    response_model=PaymentResponse,
    summary="Mark payment as releasable (admin)",
)
async def release_payment(
    payment_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> PaymentResponse:
    """Mark a payment as releasable, indicating the work has been approved
    and funds can be released to the developer.
    """
    result = await db.execute(
        select(PaymentRecord).where(PaymentRecord.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    if payment.payment_status != PaymentStatus.pending and payment.payment_status != PaymentStatus.authorized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment is in '{payment.payment_status}' status and cannot be released",
        )

    payment.payment_status = PaymentStatus.releasable
    await db.flush()
    await db.refresh(payment)

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="release_payment",
        entity_type="payment",
        entity_id=str(payment.id),
    )

    return _to_payment_response(payment)


@router.put(
    "/{payment_id}/complete",
    response_model=PaymentResponse,
    summary="Mark payment as completed (admin)",
)
async def complete_payment(
    payment_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> PaymentResponse:
    """Mark a payment as completed after funds have been transferred."""
    result = await db.execute(
        select(PaymentRecord).where(PaymentRecord.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    if payment.payment_status != PaymentStatus.releasable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment must be in 'releasable' status to be completed; current status is '{payment.payment_status}'",
        )

    payment.payment_status = PaymentStatus.paid
    await db.flush()
    await db.refresh(payment)

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="complete_payment",
        entity_type="payment",
        entity_id=str(payment.id),
    )

    return _to_payment_response(payment)


def _to_payment_response(payment: PaymentRecord) -> PaymentResponse:
    """Convert a PaymentRecord model to the API response schema.

    The schema includes computed fields that map from model column names.
    """
    return PaymentResponse(
        id=payment.id,
        job_id=payment.job_id,
        task_id=payment.task_id,
        client_user_id=payment.client_user_id,
        developer_user_id=payment.developer_user_id,
        gross_amount=float(payment.gross_amount),
        platform_fee_percent=0.0,  # Percentage not stored on model; derive if needed.
        platform_fee_amount=float(payment.platform_fee),
        net_amount=float(payment.net_amount),
        payment_status=str(payment.payment_status),
        stripe_payment_intent_id=payment.provider_ref,
        created_at=payment.created_at,
        updated_at=payment.updated_at,
    )
