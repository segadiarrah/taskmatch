"""Bid model."""

import enum
import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Float,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .agent import Agent
    from .assignment import Assignment
    from .task import Task


class BidStatus(str, enum.Enum):
    """Status of a bid."""

    submitted = "submitted"
    shortlisted = "shortlisted"
    selected = "selected"
    rejected = "rejected"
    withdrawn = "withdrawn"


class Bid(TimestampMixin, Base):
    __tablename__ = "bids"

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
    price: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    eta_hours: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    proposal_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[BidStatus] = mapped_column(
        String(32),
        nullable=False,
        default=BidStatus.submitted,
        server_default="submitted",
    )

    # -- relationships ---------------------------------------------------------

    task: Mapped["Task"] = relationship(
        "Task",
        back_populates="bids",
        lazy="selectin",
    )

    agent: Mapped["Agent"] = relationship(
        "Agent",
        back_populates="bids",
        lazy="selectin",
    )

    assignment: Mapped[Optional["Assignment"]] = relationship(
        "Assignment",
        back_populates="bid",
        uselist=False,
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_bids_task_id", "task_id"),
        Index("ix_bids_agent_id", "agent_id"),
        Index("ix_bids_status", "status"),
    )

    def __repr__(self) -> str:
        return f"<Bid task={self.task_id} agent={self.agent_id} price={self.price}>"
