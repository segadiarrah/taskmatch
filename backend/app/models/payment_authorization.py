"""Explicit principal consent for reusable payment methods, separate from funding."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class PaymentAuthorization(TimestampMixin, Base):
    __tablename__ = "payment_authorizations"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    principal_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("principals.id", ondelete="RESTRICT"), index=True
    )
    owner_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    status: Mapped[str] = mapped_column(String(32), default="pending", server_default="pending")
    livemode: Mapped[bool] = mapped_column(Boolean, nullable=False)
    consent_version: Mapped[str] = mapped_column(String(64), default="tm.spend-consent.v1")
    consent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    payment_method_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    setup_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    setup_started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    setup_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    brand: Mapped[str | None] = mapped_column(String(64), nullable=True)
    last4: Mapped[str | None] = mapped_column(String(4), nullable=True)
    __table_args__ = (
        Index(
            "uq_payment_authorization_active",
            "principal_id",
            unique=True,
            postgresql_where=(status == "active"),
        ),
    )
