"""Explicit acyclic task prerequisites; existing tasks remain the lifecycle owner."""

import uuid

from sqlalchemy import CheckConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class TaskDependency(TimestampMixin, Base):
    __tablename__ = "task_dependencies"
    task_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tasks.id", ondelete="RESTRICT"), primary_key=True
    )
    depends_on_task_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tasks.id", ondelete="RESTRICT"), primary_key=True
    )
    __table_args__ = (
        CheckConstraint("task_id <> depends_on_task_id", name="ck_dependency_not_self"),
    )
