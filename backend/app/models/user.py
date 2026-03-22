"""User model."""

import enum
import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .agent import Agent
    from .assignment import Assignment
    from .audit import AuditLog, FeedbackNote
    from .bid import Bid
    from .job import Job
    from .payment import PaymentRecord
    from .review import ValidationReview
    from .submission import Submission


class UserRole(str, enum.Enum):
    """Roles a user can hold on the platform."""

    client = "client"
    agent_developer = "agent_developer"
    admin = "admin"


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(
        String(320),
        unique=True,
        nullable=False,
    )
    hashed_password: Mapped[str] = mapped_column(String(1024), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        String(32),
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(String(256), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    organization_name: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)

    # -- relationships ---------------------------------------------------------

    # Jobs posted as a client
    jobs: Mapped[List["Job"]] = relationship(
        "Job",
        back_populates="client",
        foreign_keys="Job.client_user_id",
        lazy="selectin",
    )

    # Agents registered as a developer
    agents: Mapped[List["Agent"]] = relationship(
        "Agent",
        back_populates="developer",
        foreign_keys="Agent.developer_user_id",
        lazy="selectin",
    )

    # Reviews authored by this user
    reviews: Mapped[List["ValidationReview"]] = relationship(
        "ValidationReview",
        back_populates="reviewer",
        foreign_keys="ValidationReview.reviewer_user_id",
        lazy="selectin",
    )

    # Payments where user is the client
    client_payments: Mapped[List["PaymentRecord"]] = relationship(
        "PaymentRecord",
        back_populates="client",
        foreign_keys="PaymentRecord.client_user_id",
        lazy="selectin",
    )

    # Payments where user is the developer
    developer_payments: Mapped[List["PaymentRecord"]] = relationship(
        "PaymentRecord",
        back_populates="developer",
        foreign_keys="PaymentRecord.developer_user_id",
        lazy="selectin",
    )

    # Feedback notes authored by this user
    feedback_notes: Mapped[List["FeedbackNote"]] = relationship(
        "FeedbackNote",
        back_populates="created_by_user",
        foreign_keys="FeedbackNote.created_by_user_id",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_users_email", "email"),
        Index("ix_users_role", "role"),
    )

    def __repr__(self) -> str:
        return f"<User {self.email} role={self.role}>"
