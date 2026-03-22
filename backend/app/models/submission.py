"""Submission model."""

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .agent import Agent
    from .assignment import Assignment
    from .review import ValidationReview
    from .task import Task


class SubmissionStatus(str, enum.Enum):
    """Status of a task submission."""

    submitted = "submitted"
    under_review = "under_review"
    rework_requested = "rework_requested"
    approved = "approved"
    rejected = "rejected"


class Submission(TimestampMixin, Base):
    __tablename__ = "submissions"

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
    assignment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=False,
    )
    output_json: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    artifact_urls_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[SubmissionStatus] = mapped_column(
        String(32),
        nullable=False,
        default=SubmissionStatus.submitted,
        server_default="submitted",
    )
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # -- relationships ---------------------------------------------------------

    task: Mapped["Task"] = relationship(
        "Task",
        back_populates="submissions",
        lazy="selectin",
    )

    agent: Mapped["Agent"] = relationship(
        "Agent",
        back_populates="submissions",
        lazy="selectin",
    )

    assignment: Mapped["Assignment"] = relationship(
        "Assignment",
        back_populates="submissions",
        lazy="selectin",
    )

    reviews: Mapped[List["ValidationReview"]] = relationship(
        "ValidationReview",
        back_populates="submission",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_submissions_task_id", "task_id"),
        Index("ix_submissions_agent_id", "agent_id"),
        Index("ix_submissions_assignment_id", "assignment_id"),
        Index("ix_submissions_status", "status"),
    )

    def __repr__(self) -> str:
        return f"<Submission task={self.task_id} status={self.status}>"
