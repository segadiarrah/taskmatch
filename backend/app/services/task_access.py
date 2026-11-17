"""Task visibility shared by marketplace endpoints."""

from fastapi import HTTPException
from sqlalchemy import and_, false, or_, select, true
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import lazyload

from app.core.config import settings
from app.models.agent import Agent
from app.models.assignment import Assignment
from app.models.billing import JobFunding
from app.models.job import Job, JobStatus
from app.models.task import Task, TaskStatus
from app.models.user import User


async def lock_job(db: AsyncSession, job_id) -> Job:
    """All work/funding transitions acquire the parent before child rows."""
    job = await db.scalar(
        select(Job)
        .options(lazyload("*"))
        .where(Job.id == job_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


async def load_execution_task(db: AsyncSession, task_id) -> tuple[Job, Task]:
    """Lock a task after its job and verify persisted funding, even for admins."""
    from app.services.billing_service import require_execution_funding

    job_id = await db.scalar(select(Task.job_id).where(Task.id == task_id))
    if job_id is None:
        raise HTTPException(status_code=404, detail="Task not found")
    job = await lock_job(db, job_id)
    await require_execution_funding(db, job)
    task = await db.scalar(
        select(Task)
        .options(lazyload("*"))
        .where(Task.id == task_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    return job, task


def task_visibility(user: User, *, include_open: bool = True):
    """SQL predicate: owners, administrators, and participating developers."""
    if user.role == "admin":
        return true()
    owned = Task.job_id.in_(select(Job.id).where(Job.client_user_id == user.id))
    assigned = Task.id.in_(select(Assignment.task_id).join(Agent, Agent.id == Assignment.agent_id)
                          .where(Agent.developer_user_id == user.id))
    if not include_open:
        return or_(owned, assigned)
    # Clients may also opt in as workers without changing role or account.
    from app.models.human import WorkerProfile
    has_worker = select(WorkerProfile.user_id).where(WorkerProfile.user_id == user.id).exists()
    allowed_open = and_(
        or_(true() if user.role == 'agent_developer' else false(), has_worker),
        Task.status == TaskStatus.open_for_bids,
        or_(Task.human_contract_json.is_(None), Task.human_policy_status == 'approved'),
        Task.job_id.in_(select(Job.id).where(
            Job.status.in_([JobStatus.bidding, JobStatus.in_progress]),
            or_(Job.billing_mode == 'legacy_manual', and_(
                Job.billing_mode == 'stripe', Job.id.in_(select(JobFunding.job_id).where(
                    JobFunding.status == 'paid', JobFunding.refunded_minor == 0,
                    JobFunding.livemode == (settings.STRIPE_MODE == 'live'))))))))
    return or_(owned, assigned, allowed_open)


async def require_task_access(
    db: AsyncSession, task: Task, user: User, *, include_open: bool = False
) -> None:
    visible = await db.scalar(
        select(Task.id).where(Task.id == task.id, task_visibility(user, include_open=include_open))
    )
    if visible is None:
        raise HTTPException(status_code=403, detail="Access denied to this task")
