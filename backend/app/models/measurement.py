"""Optional usage measurement and non-financial invitation links."""
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class ReferralLink(Base):
    __tablename__ = "referral_links"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True)


class MeasurementVisitor(Base):
    __tablename__ = "measurement_visitors"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    digest: Mapped[str] = mapped_column(String(64), unique=True)
    consented_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    language: Mapped[str] = mapped_column(String(2))
    account_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    referred_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))


class MeasurementEvent(Base):
    __tablename__ = "measurement_events"
    visitor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("measurement_visitors.id", ondelete="CASCADE"), primary_key=True)
    utc_day: Mapped[date] = mapped_column(Date, primary_key=True)
    kind: Mapped[str] = mapped_column(String(32), primary_key=True)
