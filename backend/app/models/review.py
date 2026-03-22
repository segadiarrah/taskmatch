"""ValidationReview model."""

import enum
import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Float, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .submission import Submission
    from .task import Task
    from .user import User


class ReviewerType(str, enum.Enum):
    """Who performed the review."""

    mcp = "mcp"
    admin = "admin"
    client = "client"


class ReviewDecision(str, enum.Enum):
    """Outcome of the review."""

    approved = "approved"
    rejected = "rejected"
    rework_requested = "rework_requested"


class ValidationReview(TimestampMixin, Base):
    __tablename__ = "validation_reviews"

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
    submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False,
    )
    reviewer_type: Mapped[ReviewerType] = mapped_column(
        String(32),
        nullable=False,
    )
    reviewer_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    decision: Mapped[ReviewDecision] = mapped_column(
        String(32),
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # -- relationships ---------------------------------------------------------

    task: Mapped["Task"] = relationship(
        "Task",
        back_populates="reviews",
        lazy="selectin",
    )

    submission: Mapped["Submission"] = relationship(
        "Submission",
        back_populates="reviews",
        lazy="selectin",
    )

    reviewer: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="reviews",
        foreign_keys=[reviewer_user_id],
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_validation_reviews_task_id", "task_id"),
        Index("ix_validation_reviews_submission_id", "submission_id"),
        Index("ix_validation_reviews_reviewer_user_id", "reviewer_user_id"),
    )

    def __repr__(self) -> str:
        return f"<ValidationReview decision={self.decision} reviewer={self.reviewer_type}>"
