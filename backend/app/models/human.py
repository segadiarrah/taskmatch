"""Human execution identity and authorization; marketplace entities stay shared."""
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import BigInteger, Boolean, CheckConstraint, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class Principal(TimestampMixin, Base):
    __tablename__ = 'principals'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id', ondelete='RESTRICT'), index=True)
    kind: Mapped[str] = mapped_column(String(32))
    display_name: Mapped[str] = mapped_column(String(256))
    __table_args__ = (UniqueConstraint('owner_user_id', 'kind', name='uq_principal_owner_kind'),)


class Delegation(TimestampMixin, Base):
    __tablename__ = 'delegations'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    principal_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('principals.id', ondelete='RESTRICT'), index=True)
    agent_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('agents.id', ondelete='RESTRICT'), index=True)
    max_amount_minor: Mapped[int] = mapped_column(BigInteger)
    reserved_amount_minor: Mapped[int] = mapped_column(BigInteger, default=0, server_default='0')
    categories: Mapped[list] = mapped_column(JSON)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    __table_args__ = (CheckConstraint('reserved_amount_minor >= 0 AND reserved_amount_minor <= max_amount_minor', name='ck_delegation_budget'),)


class WorkerProfile(TimestampMixin, Base):
    __tablename__ = 'human_workers'
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id', ondelete='RESTRICT'), primary_key=True)
    agent_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('agents.id', ondelete='RESTRICT'), unique=True)
    profile: Mapped[dict[str, Any]] = mapped_column(JSON)
    verification_status: Mapped[str] = mapped_column(String(32), default='pending', server_default='pending')
    attested_skills: Mapped[list] = mapped_column(JSON, default=list)
    data_consent: Mapped[bool] = mapped_column(Boolean, default=False)


class HumanTaskRequest(TimestampMixin, Base):
    """Idempotency binding; contains no second task lifecycle or payment ledger."""
    __tablename__ = 'human_task_requests'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    principal_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('principals.id', ondelete='RESTRICT'))
    idempotency_key: Mapped[str] = mapped_column(String(128))
    request_hash: Mapped[str] = mapped_column(String(64))
    task_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('tasks.id', ondelete='RESTRICT'), unique=True)
    __table_args__ = (UniqueConstraint('principal_id', 'idempotency_key', name='uq_human_request_key'),)
