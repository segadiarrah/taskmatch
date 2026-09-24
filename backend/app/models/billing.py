"""Stripe funding, connected accounts and a durable billing outbox.

These scalar-only models deliberately avoid implicit relationship graph loads.
Money is stored in integer minor units; payout allocations remain PaymentRecord.
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class JobFunding(TimestampMixin, Base):
    __tablename__ = "job_fundings"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    quote_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("quotes.id", ondelete="RESTRICT"),
        nullable=False,
        unique=True,
    )
    client_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    amount_minor: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    livemode: Mapped[bool] = mapped_column(Boolean, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="creating")
    generation: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    checkout_session_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    checkout_url: Mapped[str | None] = mapped_column(Text)
    checkout_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    checkout_request: Mapped[dict | None] = mapped_column(JSON)
    checkout_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    payment_intent_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    charge_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    receipt_url: Mapped[str | None] = mapped_column(Text)
    refunded_minor: Mapped[int] = mapped_column(
        BigInteger, nullable=False, default=0, server_default="0"
    )
    refund_id: Mapped[str | None] = mapped_column(String(255))
    last_error: Mapped[str | None] = mapped_column(Text)
    __table_args__ = (
        CheckConstraint("amount_minor >= 0", name="ck_job_fundings_amount_nonnegative"),
        CheckConstraint(
            "refunded_minor >= 0 AND refunded_minor <= amount_minor",
            name="ck_job_fundings_refund_bounds",
        ),
        CheckConstraint("generation > 0", name="ck_job_fundings_generation_positive"),
    )


class StripeConnectAccount(TimestampMixin, Base):
    __tablename__ = "stripe_connect_accounts"
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), primary_key=True
    )
    account_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    country: Mapped[str | None] = mapped_column(String(2))
    details_submitted: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    transfers_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    payouts_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    requirements_json: Mapped[Any] = mapped_column(JSON, nullable=False, default=list)
    livemode: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class StripeEvent(TimestampMixin, Base):
    __tablename__ = "stripe_events"
    id: Mapped[str] = mapped_column(String(255), primary_key=True)
    event_type: Mapped[str] = mapped_column(String(128), nullable=False)
    livemode: Mapped[bool] = mapped_column(Boolean, nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class BillingOperation(TimestampMixin, Base):
    __tablename__ = "billing_operations"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="pending", server_default="pending"
    )
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    available_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_error: Mapped[str | None] = mapped_column(Text)
    external_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    payload: Mapped[dict | None] = mapped_column(JSON)
    __table_args__ = (Index("ix_billing_operations_ready", "status", "available_at"),)


class BillingWorkerHeartbeat(Base):
    __tablename__ = "billing_worker_heartbeat"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
