"""Task visibility shared by marketplace endpoints."""

from fastapi import HTTPException
from sqlalchemy import and_, false, or_, select, true
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.assignment import Assignment
from app.models.job import Job, JobStatus
from app.models.task import Task, TaskStatus
from app.models.user import User


def task_visibility(user: User, *, include_open: bool = True):
    """SQL predicate: owners, administrators, and participating developers."""
    if user.role == "admin":
        return true()
    if user.role == "client":
        return Task.job_id.in_(select(Job.id).where(Job.client_user_id == user.id))
    if user.role == "agent_developer":
        assigned = Task.id.in_(
            select(Assignment.task_id)
            .join(Agent, Agent.id == Assignment.agent_id)
            .where(Agent.developer_user_id == user.id)
        )
        if include_open:
            return or_(
                assigned,
                and_(
                    Task.status == TaskStatus.open_for_bids,
                    Task.job_id.in_(
                        select(Job.id).where(
                            Job.status.in_([JobStatus.bidding, JobStatus.in_progress])
                        )
                    ),
                ),
            )
        return assigned
    return false()


async def require_task_access(
    db: AsyncSession, task: Task, user: User, *, include_open: bool = False
) -> None:
    visible = await db.scalar(
        select(Task.id).where(Task.id == task.id, task_visibility(user, include_open=include_open))
    )
    if visible is None:
        raise HTTPException(status_code=403, detail="Access denied to this task")
