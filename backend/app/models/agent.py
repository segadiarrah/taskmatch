"""Agent and AgentCapability models."""

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .assignment import Assignment
    from .audit import FeedbackNote
    from .bid import Bid
    from .submission import Submission
    from .user import User


class AgentAuthType(str, enum.Enum):
    """Authentication scheme the agent endpoint expects."""

    none = "none"
    api_key = "api_key"
    bearer = "bearer"


class AgentStatus(str, enum.Enum):
    """Operational status of an agent."""

    active = "active"
    paused = "paused"
    disabled = "disabled"


class Agent(TimestampMixin, Base):
    __tablename__ = "agents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    developer_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    slug: Mapped[str] = mapped_column(String(256), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    endpoint_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    auth_type: Mapped[AgentAuthType] = mapped_column(
        String(32),
        nullable=False,
        default=AgentAuthType.none,
    )
    auth_credentials_encrypted: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )
    status: Mapped[AgentStatus] = mapped_column(
        String(32),
        nullable=False,
        default=AgentStatus.active,
    )
    supported_task_types: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )
    average_score: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0, server_default="0"
    )
    success_rate: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0, server_default="0"
    )
    completed_tasks_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    last_heartbeat_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # -- relationships ---------------------------------------------------------

    developer: Mapped["User"] = relationship(
        "User",
        back_populates="agents",
        foreign_keys=[developer_user_id],
        lazy="selectin",
    )

    capabilities: Mapped[List["AgentCapability"]] = relationship(
        "AgentCapability",
        back_populates="agent",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    bids: Mapped[List["Bid"]] = relationship(
        "Bid",
        back_populates="agent",
        lazy="selectin",
    )

    assignments: Mapped[List["Assignment"]] = relationship(
        "Assignment",
        back_populates="agent",
        lazy="selectin",
    )

    submissions: Mapped[List["Submission"]] = relationship(
        "Submission",
        back_populates="agent",
        lazy="selectin",
    )

    feedback_notes: Mapped[List["FeedbackNote"]] = relationship(
        "FeedbackNote",
        back_populates="agent",
        foreign_keys="FeedbackNote.agent_id",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_agents_developer_user_id", "developer_user_id"),
        Index("ix_agents_slug", "slug"),
        Index("ix_agents_status", "status"),
    )

    def __repr__(self) -> str:
        return f"<Agent {self.slug} status={self.status}>"


class AgentCapability(TimestampMixin, Base):
    __tablename__ = "agent_capabilities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False,
    )
    capability_name: Mapped[str] = mapped_column(String(256), nullable=False)
    version: Mapped[str] = mapped_column(String(64), nullable=False, default="1.0")
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )

    # -- relationships ---------------------------------------------------------

    agent: Mapped["Agent"] = relationship(
        "Agent",
        back_populates="capabilities",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_agent_capabilities_agent_id", "agent_id"),
        Index("ix_agent_capabilities_name", "capability_name"),
    )

    def __repr__(self) -> str:
        return f"<AgentCapability {self.capability_name} v{self.version}>"
