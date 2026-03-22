"""Task model with self-referential hierarchy."""

import enum
import uuid
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import (
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .assignment import Assignment
    from .bid import Bid
    from .job import Job
    from .review import ValidationReview
    from .submission import Submission


class TaskStatus(str, enum.Enum):
    """Lifecycle status of a task."""

    pending = "pending"
    open_for_bids = "open_for_bids"
    assigned = "assigned"
    in_progress = "in_progress"
    submitted = "submitted"
    validation_failed = "validation_failed"
    approved = "approved"
    cancelled = "cancelled"
    reassigned = "reassigned"


class Task(TimestampMixin, Base):
    __tablename__ = "tasks"

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
    parent_task_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    task_type: Mapped[str] = mapped_column(String(128), nullable=False)
    input_spec_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )
    output_spec_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )
    validation_spec_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )
    budget: Mapped[Optional[float]] = mapped_column(Numeric(14, 2), nullable=True)
    priority: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default="1"
    )
    status: Mapped[TaskStatus] = mapped_column(
        String(32),
        nullable=False,
        default=TaskStatus.pending,
        server_default="pending",
    )
    max_retries: Mapped[int] = mapped_column(
        Integer, nullable=False, default=3, server_default="3"
    )
    retry_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )

    # -- relationships ---------------------------------------------------------

    job: Mapped["Job"] = relationship(
        "Job",
        back_populates="tasks",
        lazy="selectin",
    )

    # Self-referential: parent / children
    parent_task: Mapped[Optional["Task"]] = relationship(
        "Task",
        back_populates="subtasks",
        remote_side="Task.id",
        lazy="selectin",
    )
    subtasks: Mapped[List["Task"]] = relationship(
        "Task",
        back_populates="parent_task",
        lazy="selectin",
    )

    bids: Mapped[List["Bid"]] = relationship(
        "Bid",
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    assignments: Mapped[List["Assignment"]] = relationship(
        "Assignment",
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    submissions: Mapped[List["Submission"]] = relationship(
        "Submission",
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    reviews: Mapped[List["ValidationReview"]] = relationship(
        "ValidationReview",
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_tasks_job_id", "job_id"),
        Index("ix_tasks_parent_task_id", "parent_task_id"),
        Index("ix_tasks_status", "status"),
        Index("ix_tasks_task_type", "task_type"),
    )

    def __repr__(self) -> str:
        return f"<Task {self.title!r} status={self.status}>"
