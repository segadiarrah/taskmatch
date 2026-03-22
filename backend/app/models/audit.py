"""AuditLog, MCPDecision, and FeedbackNote models."""

import enum
import uuid
from typing import TYPE_CHECKING, Any, Dict, Optional

from sqlalchemy import Float, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .agent import Agent
    from .user import User


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class ActorType(str, enum.Enum):
    """Who or what performed an auditable action."""

    user = "user"
    agent = "agent"
    system = "system"
    mcp = "mcp"


class MCPDecisionType(str, enum.Enum):
    """Category of decision made by the MCP orchestrator."""

    formatting = "formatting"
    decomposition = "decomposition"
    matching = "matching"
    ranking = "ranking"
    validation = "validation"


class FeedbackCategory(str, enum.Enum):
    """Category of feedback provided."""

    quality = "quality"
    speed = "speed"
    reliability = "reliability"
    formatting = "formatting"
    communication = "communication"


# ---------------------------------------------------------------------------
# AuditLog
# ---------------------------------------------------------------------------


class AuditLog(TimestampMixin, Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    actor_type: Mapped[ActorType] = mapped_column(
        String(32),
        nullable=False,
    )
    actor_id: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    action: Mapped[str] = mapped_column(String(256), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(128), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(256), nullable=False)
    payload_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )

    __table_args__ = (
        Index("ix_audit_logs_actor_type", "actor_type"),
        Index("ix_audit_logs_entity_type_entity_id", "entity_type", "entity_id"),
        Index("ix_audit_logs_action", "action"),
        Index("ix_audit_logs_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<AuditLog {self.action} on {self.entity_type}:{self.entity_id}>"


# ---------------------------------------------------------------------------
# MCPDecision
# ---------------------------------------------------------------------------


class MCPDecision(TimestampMixin, Base):
    __tablename__ = "mcp_decisions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    entity_type: Mapped[str] = mapped_column(String(128), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(256), nullable=False)
    decision_type: Mapped[MCPDecisionType] = mapped_column(
        String(32),
        nullable=False,
    )
    input_snapshot_json: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    output_snapshot_json: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    reasoning_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    __table_args__ = (
        Index("ix_mcp_decisions_entity_type_entity_id", "entity_type", "entity_id"),
        Index("ix_mcp_decisions_decision_type", "decision_type"),
    )

    def __repr__(self) -> str:
        return f"<MCPDecision {self.decision_type} on {self.entity_type}:{self.entity_id}>"


# ---------------------------------------------------------------------------
# FeedbackNote
# ---------------------------------------------------------------------------


class FeedbackNote(TimestampMixin, Base):
    __tablename__ = "feedback_notes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    task_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="SET NULL"),
        nullable=True,
    )
    agent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    category: Mapped[FeedbackCategory] = mapped_column(
        String(32),
        nullable=False,
    )
    note: Mapped[str] = mapped_column(Text, nullable=False)

    # -- relationships ---------------------------------------------------------

    agent: Mapped[Optional["Agent"]] = relationship(
        "Agent",
        back_populates="feedback_notes",
        foreign_keys=[agent_id],
        lazy="selectin",
    )

    created_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="feedback_notes",
        foreign_keys=[created_by_user_id],
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_feedback_notes_task_id", "task_id"),
        Index("ix_feedback_notes_agent_id", "agent_id"),
        Index("ix_feedback_notes_created_by_user_id", "created_by_user_id"),
        Index("ix_feedback_notes_category", "category"),
    )

    def __repr__(self) -> str:
        return f"<FeedbackNote category={self.category}>"
