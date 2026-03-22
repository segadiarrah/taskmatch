"""PaymentRecord model."""

import enum
import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Index, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .job import Job
    from .task import Task
    from .user import User


class PaymentStatus(str, enum.Enum):
    """Lifecycle status of a payment."""

    pending = "pending"
    authorized = "authorized"
    releasable = "releasable"
    paid = "paid"
    refunded = "refunded"
    cancelled = "cancelled"


class PaymentRecord(TimestampMixin, Base):
    __tablename__ = "payment_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
    )
    task_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="SET NULL"),
        nullable=True,
    )
    client_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    developer_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    gross_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    platform_fee: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    net_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(
        String(8), nullable=False, default="USD", server_default="USD"
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        String(32),
        nullable=False,
        default=PaymentStatus.pending,
        server_default="pending",
    )
    provider: Mapped[str] = mapped_column(
        String(64), nullable=False, default="stripe", server_default="stripe"
    )
    provider_ref: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)

    # -- relationships ---------------------------------------------------------

    job: Mapped["Job"] = relationship(
        "Job",
        back_populates="payments",
        foreign_keys=[job_id],
        lazy="selectin",
    )

    client: Mapped["User"] = relationship(
        "User",
        back_populates="client_payments",
        foreign_keys=[client_user_id],
        lazy="selectin",
    )

    developer: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="developer_payments",
        foreign_keys=[developer_user_id],
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_payment_records_job_id", "job_id"),
        Index("ix_payment_records_task_id", "task_id"),
        Index("ix_payment_records_client_user_id", "client_user_id"),
        Index("ix_payment_records_developer_user_id", "developer_user_id"),
        Index("ix_payment_records_payment_status", "payment_status"),
    )

    def __repr__(self) -> str:
        return f"<PaymentRecord job={self.job_id} status={self.payment_status} gross={self.gross_amount}>"
