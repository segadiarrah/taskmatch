"""Public profiles are explicit owner-authored projections with separate IDs."""
import uuid

from sqlalchemy import Boolean, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class DirectoryProfile(TimestampMixin, Base):
    __tablename__ = "directory_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("agents.id", ondelete="CASCADE"), unique=True)
    kind: Mapped[str] = mapped_column(String(12))
    display_name: Mapped[str] = mapped_column(String(96))
    summary: Mapped[str] = mapped_column(String(480))
    expertise: Mapped[str] = mapped_column(String(160))
    country: Mapped[str | None] = mapped_column(String(2))
    language: Mapped[str | None] = mapped_column(String(2))
    published: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    __table_args__ = (Index("ix_directory_public_kind", "published", "kind", "id"),)
