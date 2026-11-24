"""Operator-approved recipients and one message per recipient per campaign."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class OutreachRecipient(TimestampMixin, Base):
    __tablename__ = "outreach_recipients"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True)
    permission_reference: Mapped[str] = mapped_column(String(160))
    suppressed: Mapped[str | None] = mapped_column(String(24))


class OutreachMessage(TimestampMixin, Base):
    __tablename__ = "outreach_messages"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    recipient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("outreach_recipients.id"))
    credential_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("growth_credentials.id"))
    campaign: Mapped[str] = mapped_column(String(80))
    state: Mapped[str] = mapped_column(String(24), default="queued")
    __table_args__ = (UniqueConstraint("recipient_id", "campaign", name="uq_outreach_recipient_campaign"),)
