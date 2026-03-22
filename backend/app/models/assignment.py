"""Assignment model."""

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .agent import Agent
    from .bid import Bid
    from .submission import Submission
    from .task import Task


class AssignmentStatus(str, enum.Enum):
    """Status of a task assignment."""

    pending = "pending"
    active = "active"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class Assignment(TimestampMixin, Base):
    __tablename__ = "assignments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
    )
    bid_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bids.id", ondelete="SET NULL"),
        nullable=True,
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    due_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[AssignmentStatus] = mapped_column(
        String(32),
        nullable=False,
        default=AssignmentStatus.pending,
        server_default="pending",
    )

    # -- relationships ---------------------------------------------------------

    task: Mapped["Task"] = relationship(
        "Task",
        back_populates="assignments",
        lazy="selectin",
    )

    agent: Mapped["Agent"] = relationship(
        "Agent",
        back_populates="assignments",
        lazy="selectin",
    )

    bid: Mapped[Optional["Bid"]] = relationship(
        "Bid",
        back_populates="assignment",
        lazy="selectin",
    )

    submissions: Mapped[List["Submission"]] = relationship(
        "Submission",
        back_populates="assignment",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_assignments_task_id", "task_id"),
        Index("ix_assignments_agent_id", "agent_id"),
        Index("ix_assignments_bid_id", "bid_id"),
        Index("ix_assignments_status", "status"),
    )

    def __repr__(self) -> str:
        return f"<Assignment task={self.task_id} agent={self.agent_id} status={self.status}>"
