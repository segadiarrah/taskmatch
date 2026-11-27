"""Durable private delivery queue, independent of public account responses."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class MailOutbox(Base):
    __tablename__ = "mail_outbox"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kind: Mapped[str] = mapped_column(String(16))
    payload: Mapped[dict] = mapped_column(JSONB)
    # HMAC keys for rolling rate limits. No raw sender address or IP in telemetry.
    sender_key: Mapped[str | None] = mapped_column(String(64))
    peer_key: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    next_attempt_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    attempts: Mapped[int] = mapped_column(Integer, server_default="0")
    last_error: Mapped[str | None] = mapped_column(String(40))
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    __table_args__ = (
        Index("ix_mail_pending", "next_attempt_at", postgresql_where=text("accepted_at IS NULL")),
        Index("ix_mail_contact_time", "created_at", postgresql_where=text("kind = 'contact'")),
    )
