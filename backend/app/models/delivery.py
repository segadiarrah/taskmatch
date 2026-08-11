"""Delivery models — how the work actually reaches the client.

A validated deliverable is not the end of the job. It has to be handed over: as a
document, a repository, a dataset, or an installation on the client's own
infrastructure. The last case needs credentials to travel between the client and
the platform, which is what :class:`AccessGrant` exists to make safe.
"""

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .job import Job
    from .user import User


class DeliveryMode(str, enum.Enum):
    """How the client receives the finished work."""

    #: Markdown / PDF / spec handed over as-is. The default.
    document = "document"
    #: Source code pushed to a repository the client owns.
    repository = "repository"
    #: Structured data file(s).
    dataset = "dataset"
    #: Deployed and configured on infrastructure the client controls.
    installation = "installation"
    #: Running on infrastructure TaskMatch operates on the client's behalf.
    hosted = "hosted"


class DeliveryStatus(str, enum.Enum):
    """Where the handover has got to."""

    planned = "planned"
    #: Waiting on the client to supply credentials (installation / hosted only).
    awaiting_access = "awaiting_access"
    in_progress = "in_progress"
    delivered = "delivered"
    #: Client has signed off; any credentials they shared have been revoked.
    signed_off = "signed_off"


class AccessDirection(str, enum.Enum):
    """Which way a credential travels."""

    #: Client hands TaskMatch an access it needs to do the work.
    client_to_platform = "client_to_platform"
    #: TaskMatch hands the client an access to the thing it built.
    platform_to_client = "platform_to_client"


class AccessKind(str, enum.Enum):
    """What sort of credential this is — drives the UI hints, not the crypto."""

    ssh_key = "ssh_key"
    api_key = "api_key"
    database_url = "database_url"
    console_login = "console_login"
    vpn_config = "vpn_config"
    other = "other"


class DeliveryPlan(TimestampMixin, Base):
    """One per job: the agreed shape of the handover."""

    __tablename__ = "delivery_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False
    )
    mode: Mapped[DeliveryMode] = mapped_column(
        String(32),
        nullable=False,
        default=DeliveryMode.document,
        server_default="document",
    )
    status: Mapped[DeliveryStatus] = mapped_column(
        String(32),
        nullable=False,
        default=DeliveryStatus.planned,
        server_default="planned",
    )
    #: Free-text target: repo URL, hostname, environment name.
    target: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    #: What the client must provide before delivery can proceed.
    requirements: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    #: Operator instructions produced alongside the deliverable.
    runbook: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    delivered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    signed_off_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    accesses_revoked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # -- relationships ---------------------------------------------------------

    job: Mapped["Job"] = relationship(
        "Job", back_populates="delivery_plan", lazy="selectin"
    )
    access_grants: Mapped[List["AccessGrant"]] = relationship(
        "AccessGrant",
        back_populates="delivery_plan",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        UniqueConstraint("job_id", name="uq_delivery_plans_job_id"),
        Index("ix_delivery_plans_job_id", "job_id"),
        Index("ix_delivery_plans_status", "status"),
    )

    @property
    def needs_access_exchange(self) -> bool:
        """Whether this mode requires credentials to change hands."""
        return self.mode in (DeliveryMode.installation, DeliveryMode.hosted)

    def __repr__(self) -> str:
        return f"<DeliveryPlan job={self.job_id} mode={self.mode} status={self.status}>"


class AccessGrant(TimestampMixin, Base):
    """A single credential, encrypted at rest, scoped to one job.

    The plaintext is never stored and never logged. It is written once, read
    through an audited endpoint a bounded number of times, and destroyed when the
    job closes or the grant is revoked.
    """

    __tablename__ = "access_grants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    delivery_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("delivery_plans.id", ondelete="CASCADE"),
        nullable=False,
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False
    )

    label: Mapped[str] = mapped_column(String(256), nullable=False)
    kind: Mapped[AccessKind] = mapped_column(
        String(32), nullable=False, default=AccessKind.other, server_default="other"
    )
    direction: Mapped[AccessDirection] = mapped_column(
        String(32),
        nullable=False,
        default=AccessDirection.client_to_platform,
        server_default="client_to_platform",
    )

    #: Fernet ciphertext. Cleared on revocation.
    secret_ciphertext: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    #: Non-secret hint shown in listings ("ssh://deploy@10.0.0.4", "sk-…7f2a").
    hint: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)

    created_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    revoked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_accessed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    access_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    #: Hard ceiling on reveals. Defence in depth against a leaked session.
    max_accesses: Mapped[int] = mapped_column(
        Integer, nullable=False, default=5, server_default="5"
    )

    # -- relationships ---------------------------------------------------------

    delivery_plan: Mapped["DeliveryPlan"] = relationship(
        "DeliveryPlan", back_populates="access_grants", lazy="selectin"
    )
    created_by: Mapped[Optional["User"]] = relationship("User", lazy="selectin")

    __table_args__ = (
        Index("ix_access_grants_delivery_plan_id", "delivery_plan_id"),
        Index("ix_access_grants_job_id", "job_id"),
    )

    @property
    def is_revoked(self) -> bool:
        return self.revoked_at is not None or self.secret_ciphertext is None

    def is_expired(self, now: datetime) -> bool:
        return self.expires_at is not None and now >= self.expires_at

    def is_exhausted(self) -> bool:
        return self.access_count >= self.max_accesses

    def __repr__(self) -> str:
        return f"<AccessGrant {self.label!r} kind={self.kind} job={self.job_id}>"
