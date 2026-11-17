"""Durable redacted protocol events and explicitly configured outgoing notifications."""
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class WebhookSubscription(TimestampMixin, Base):
    __tablename__ = 'webhook_subscriptions'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    principal_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('principals.id', ondelete='RESTRICT'), index=True)
    delegation_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey('delegations.id', ondelete='RESTRICT'), nullable=True)
    owner_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id', ondelete='RESTRICT'))
    url: Mapped[str] = mapped_column(String(2048))
    secret_ciphertext: Mapped[str] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean, default=True, server_default='true')


class ProtocolEvent(Base):
    __tablename__ = 'protocol_events'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_audit_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('audit_logs.id', ondelete='RESTRICT'))
    task_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('tasks.id', ondelete='RESTRICT'), index=True)
    principal_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('principals.id', ondelete='RESTRICT'), index=True)
    delegation_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey('delegations.id', ondelete='RESTRICT'), nullable=True)
    payload: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (UniqueConstraint('source_audit_id', 'task_id', name='uq_protocol_event_source_task'),)


class WebhookDelivery(TimestampMixin, Base):
    __tablename__ = 'webhook_deliveries'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscription_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('webhook_subscriptions.id', ondelete='RESTRICT'))
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('protocol_events.id', ondelete='RESTRICT'))
    status: Mapped[str] = mapped_column(String(24), default='pending', server_default='pending', index=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0, server_default='0')
    next_attempt_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_http_status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_error: Mapped[str | None] = mapped_column(String(64), nullable=True)
    __table_args__ = (
        UniqueConstraint('subscription_id', 'event_id', name='uq_webhook_delivery_subscription_event'),
        CheckConstraint('attempts >= 0 AND attempts <= 6', name='ck_webhook_delivery_attempts'),
        CheckConstraint("status IN ('pending','processing','delivered','failed','suppressed')", name='ck_webhook_delivery_status'))
