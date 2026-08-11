"""Quote models — the price TaskMatch commits to before any work starts.

A quote is immutable once issued. Re-pricing a job creates a new quote and marks
the previous one ``superseded``, so the price history of a job is auditable.
"""

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import (
    DateTime,
    Float,
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
    from .job import Job
    from .task import Task


class QuoteStatus(str, enum.Enum):
    """Lifecycle of a quote."""

    draft = "draft"
    #: Presented to the client, awaiting their decision.
    pending_client = "pending_client"
    accepted = "accepted"
    rejected = "rejected"
    expired = "expired"
    #: Replaced by a newer quote (e.g. after the client changed the delivery mode).
    superseded = "superseded"


class ExecutionRoute(str, enum.Enum):
    """Who executes the task this quote line covers."""

    llm = "llm"
    human = "human"
    hybrid = "hybrid"


class Quote(TimestampMixin, Base):
    __tablename__ = "quotes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[QuoteStatus] = mapped_column(
        String(32), nullable=False, default=QuoteStatus.draft, server_default="draft"
    )
    currency: Mapped[str] = mapped_column(
        String(8), nullable=False, default="EUR", server_default="EUR"
    )
    subtotal: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    platform_fee: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    total: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)

    #: What the same work would cost with human experts only — the comparison the
    #: client is shown, and the anchor the competitive ceiling is derived from.
    human_equivalent_low: Mapped[Optional[float]] = mapped_column(
        Numeric(14, 2), nullable=True
    )
    human_equivalent_high: Mapped[Optional[float]] = mapped_column(
        Numeric(14, 2), nullable=True
    )
    savings_vs_human: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    valid_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    pricing_version: Mapped[str] = mapped_column(String(32), nullable=False)
    #: Full engine output, kept verbatim so a disputed price can be reconstructed.
    breakdown_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    decided_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # -- relationships ---------------------------------------------------------

    job: Mapped["Job"] = relationship("Job", back_populates="quotes", lazy="selectin")

    task_quotes: Mapped[List["TaskQuote"]] = relationship(
        "TaskQuote",
        back_populates="quote",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_quotes_job_id", "job_id"),
        Index("ix_quotes_status", "status"),
    )

    @property
    def is_actionable(self) -> bool:
        """Whether the client can still accept or reject this quote."""
        return self.status in (QuoteStatus.draft, QuoteStatus.pending_client)

    def __repr__(self) -> str:
        return f"<Quote job={self.job_id} total={self.total} status={self.status}>"


class TaskQuote(TimestampMixin, Base):
    """The priced line for one task, with the full cost-plus breakdown."""

    __tablename__ = "task_quotes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    quote_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("quotes.id", ondelete="CASCADE"), nullable=False
    )
    task_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True
    )

    route: Mapped[ExecutionRoute] = mapped_column(
        String(16), nullable=False, default=ExecutionRoute.llm, server_default="llm"
    )
    complexity: Mapped[str] = mapped_column(String(4), nullable=False)
    task_type: Mapped[str] = mapped_column(String(128), nullable=False)

    # -- cost-plus breakdown (LLM route) --------------------------------------
    model_slug: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    est_input_tokens: Mapped[int] = mapped_column(
        Numeric(14, 0), nullable=False, default=0, server_default="0"
    )
    est_output_tokens: Mapped[int] = mapped_column(
        Numeric(14, 0), nullable=False, default=0, server_default="0"
    )
    token_cost: Mapped[float] = mapped_column(
        Numeric(14, 4), nullable=False, default=0, server_default="0"
    )
    compute_cost: Mapped[float] = mapped_column(
        Numeric(14, 2), nullable=False, default=0, server_default="0"
    )
    orchestration_fee: Mapped[float] = mapped_column(
        Numeric(14, 2), nullable=False, default=0, server_default="0"
    )
    validation_cost: Mapped[float] = mapped_column(
        Numeric(14, 2), nullable=False, default=0, server_default="0"
    )

    #: What the client is billed for this line, whatever the route.
    price: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)

    # -- human range ----------------------------------------------------------
    human_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    human_price_low: Mapped[Optional[float]] = mapped_column(
        Numeric(14, 2), nullable=True
    )
    human_price_high: Mapped[Optional[float]] = mapped_column(
        Numeric(14, 2), nullable=True
    )
    discipline: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    seniority: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    #: Set once a human expert accepts a price inside the range.
    accepted_offer: Mapped[Optional[float]] = mapped_column(
        Numeric(14, 2), nullable=True
    )
    accepted_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    rationale: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    breakdown_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )

    # -- relationships ---------------------------------------------------------

    quote: Mapped["Quote"] = relationship(
        "Quote", back_populates="task_quotes", lazy="selectin"
    )
    task: Mapped[Optional["Task"]] = relationship("Task", lazy="selectin")

    __table_args__ = (
        Index("ix_task_quotes_quote_id", "quote_id"),
        Index("ix_task_quotes_task_id", "task_id"),
        Index("ix_task_quotes_route", "route"),
    )

    def __repr__(self) -> str:
        return f"<TaskQuote task={self.task_id} route={self.route} price={self.price}>"
