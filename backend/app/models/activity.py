from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from uuid import UUID
from .base import Base


class ActivityPreferences(Base):
    __tablename__ = "activity_preferences"
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    muted: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
