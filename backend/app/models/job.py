"""Job and JobRequirement models."""

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .payment import PaymentRecord
    from .task import Task
    from .user import User


class JobStatus(str, enum.Enum):
    """Lifecycle status of a job."""

    draft = "draft"
    submitted = "submitted"
    formatted = "formatted"
    decomposed = "decomposed"
    bidding = "bidding"
    in_progress = "in_progress"
    under_review = "under_review"
    client_review = "client_review"
    completed = "completed"
    cancelled = "cancelled"


class Job(TimestampMixin, Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    client_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    raw_description: Mapped[str] = mapped_column(Text, nullable=False)
    formatted_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    budget_min: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    budget_max: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(
        String(8), nullable=False, default="USD", server_default="USD"
    )
    deadline: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[JobStatus] = mapped_column(
        String(32),
        nullable=False,
        default=JobStatus.draft,
        server_default="draft",
    )
    preferred_agent_ids: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )
    auto_select_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )

    # -- relationships ---------------------------------------------------------

    client: Mapped["User"] = relationship(
        "User",
        back_populates="jobs",
        foreign_keys=[client_user_id],
        lazy="selectin",
    )

    requirements: Mapped[List["JobRequirement"]] = relationship(
        "JobRequirement",
        back_populates="job",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    tasks: Mapped[List["Task"]] = relationship(
        "Task",
        back_populates="job",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    payments: Mapped[List["PaymentRecord"]] = relationship(
        "PaymentRecord",
        back_populates="job",
        foreign_keys="PaymentRecord.job_id",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_jobs_client_user_id", "client_user_id"),
        Index("ix_jobs_status", "status"),
    )

    def __repr__(self) -> str:
        return f"<Job {self.title!r} status={self.status}>"


class JobRequirement(TimestampMixin, Base):
    __tablename__ = "job_requirements"

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
    requirement_type: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(32), nullable=False, default="medium")

    # -- relationships ---------------------------------------------------------

    job: Mapped["Job"] = relationship(
        "Job",
        back_populates="requirements",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_job_requirements_job_id", "job_id"),
    )

    def __repr__(self) -> str:
        return f"<JobRequirement {self.requirement_type} priority={self.priority}>"
