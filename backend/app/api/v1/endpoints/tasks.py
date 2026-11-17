"""Task management endpoints."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import lazyload, selectinload

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.middleware.audit import log_audit
from app.models.assignment import Assignment, AssignmentStatus
from app.models.job import JobStatus
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.task import TaskListResponse, TaskResponse, TaskUpdate
from app.services.task_access import (
    load_execution_task,
    lock_job,
    require_task_access,
    task_visibility,
)

router = APIRouter()


@router.get(
    "",
    response_model=TaskListResponse,
    summary="List tasks",
)
async def list_tasks(
    status_filter: Optional[str] = Query(
        None, alias="status", description="Filter by task status"
    ),
    job_id: Optional[uuid.UUID] = Query(
        None, description="Filter by parent job ID"
    ),
    task_type: Optional[str] = Query(
        None, description="Filter by task type"
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> TaskListResponse:
    """Return a paginated list of tasks with optional filters."""
    query = select(Task).options(lazyload("*"), selectinload(Task.assignments)).where(task_visibility(current_user))

    if status_filter:
        query = query.where(Task.status == status_filter)
    if job_id:
        query = query.where(Task.job_id == job_id)
    if task_type:
        query = query.where(Task.task_type == task_type)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Task.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    tasks = result.scalars().all()

    return TaskListResponse(
        tasks=[TaskResponse.model_validate(t) for t in tasks],
        total=total,
    )


@router.get(
    "/open",
    response_model=TaskListResponse,
    summary="List tasks open for bidding",
)
async def list_open_tasks(
    task_type: Optional[str] = Query(
        None, description="Filter by task type"
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> TaskListResponse:
    """Return tasks currently open for bidding.

    Useful for agent developers to discover work opportunities.
    """
    query = select(Task).options(lazyload("*"), selectinload(Task.assignments)).where(Task.status == TaskStatus.open_for_bids, task_visibility(current_user))

    if task_type:
        query = query.where(Task.task_type == task_type)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Task.priority.desc(), Task.created_at.asc()).offset(skip).limit(limit)
    result = await db.execute(query)
    tasks = result.scalars().all()

    return TaskListResponse(
        tasks=[TaskResponse.model_validate(t) for t in tasks],
        total=total,
    )


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get task detail",
)
async def get_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> TaskResponse:
    """Return full details for a single task."""
    result = await db.execute(select(Task).options(lazyload("*"), selectinload(Task.assignments)).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    await require_task_access(db, task, current_user, include_open=True)
    return TaskResponse.model_validate(task)


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update task (admin)",
    dependencies=[Depends(require_role("admin"))],
)
async def update_task(
    task_id: uuid.UUID,
    body: TaskUpdate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> TaskResponse:
    """Update an existing task.  Restricted to administrators."""
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if task.human_contract_json:
        raise HTTPException(409, 'Human Task contracts are immutable; create a replacement draft')
    from app.services.billing_service import assert_quote_editable
    job = await lock_job(db, task.job_id)
    await assert_quote_editable(db, job)
    task = await db.scalar(select(Task).options(lazyload('*')).where(Task.id == task_id)
                           .with_for_update().execution_options(populate_existing=True))
    update_data = body.model_dump(exclude_unset=True)
    if 'input_spec_json' in update_data:
        protected = {key: value for key, value in (task.input_spec_json or {}).items()
                     if key.startswith('_execution_') or key == '_human_reviewer_id'}
        supplied = update_data['input_spec_json'] or {}
        if any((key.startswith('_execution_') or key == '_human_reviewer_id')
               and (key not in protected or value != protected[key]) for key, value in supplied.items()):
            raise HTTPException(409, 'Execution counters and ownership are managed by workflow actions')
        update_data['input_spec_json'] = {**supplied, **protected}
    if "status" in update_data and update_data["status"] != task.status:
        raise HTTPException(status_code=409, detail="Use task workflow actions to change status")
    for field, value in update_data.items():
        setattr(task, field, value)

    await db.flush()
    await db.refresh(task)

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="update_task",
        entity_type="task",
        entity_id=str(task.id),
        payload=update_data,
    )

    return TaskResponse.model_validate(task)


@router.post(
    "/{task_id}/assign",
    response_model=dict,
    summary="Assign task to agent",
)
async def assign_task(
    task_id: uuid.UUID,
    agent_id: uuid.UUID = Query(..., description="Agent to assign the task to"),
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Assign a task to a specific agent.

    Creates an assignment record and transitions the task to ``assigned`` status.
    Restricted to administrators.
    """
    job, task = await load_execution_task(db, task_id)
    if job.status not in (JobStatus.bidding, JobStatus.in_progress):
        raise HTTPException(status_code=409, detail="Accept the job quote before assigning work")
    if task.status not in (TaskStatus.open_for_bids, TaskStatus.reassigned):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task is in '{task.status}' status and cannot be assigned",
        )

    # Verify agent exists.
    from app.models.agent import Agent

    agent_result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = agent_result.scalar_one_or_none()
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    from app.services.human_workers import require_eligible_executor
    await require_eligible_executor(db, task, agent.id)

    assignment = Assignment(
        id=uuid.uuid4(),
        task_id=task_id,
        agent_id=agent_id,
        status=AssignmentStatus.active,
    )
    db.add(assignment)

    task.status = TaskStatus.assigned
    job.status = JobStatus.in_progress
    await db.flush()
    await db.refresh(assignment)

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="assign_task",
        entity_type="task",
        entity_id=str(task.id),
        payload={"agent_id": str(agent_id), "assignment_id": str(assignment.id)},
    )

    from app.services.task_execution import queue_task
    await queue_task(db, job, task, revision=True)

    return {
        "assignment_id": str(assignment.id),
        "task_id": str(task_id),
        "agent_id": str(agent_id),
        "status": getattr(assignment.status, "value", assignment.status),
    }


@router.get('/{task_id}/execution', summary='Task execution, human ownership and recovery preview')
async def execution_state(task_id: uuid.UUID,
                          current_user: User = Depends(get_current_active_user),
                          db: AsyncSession = Depends(get_db)) -> dict:
    from app.services.execution_state import task_state
    task = await db.get(Task, task_id, options=[lazyload('*')])
    if task is None:
        raise HTTPException(404, 'Task not found')
    return await task_state(db, task, current_user)


@router.post('/{task_id}/retry', summary='Retry one task within its existing funding and cost budget')
async def retry_execution(task_id: uuid.UUID,
                          current_user: User = Depends(require_role('admin')),
                          db: AsyncSession = Depends(get_db)) -> dict:
    from app.services.execution_state import retry_task
    return await retry_task(db, task_id, current_user)


from pydantic import BaseModel, Field


class HistoricalRecoveryRequest(BaseModel):
    provider: str = Field(min_length=1, max_length=64)
    model: str = Field(min_length=1, max_length=128)
    quote_id: uuid.UUID
    approved_max_cost_eur: float = Field(ge=0, allow_inf_nan=False)


@router.get('/{task_id}/recovery-preview', summary='Preview historical task recovery without changing it')
async def preview_recovery(task_id: uuid.UUID, provider: str, model: str,
                           current_user: User = Depends(require_role('admin')),
                           db: AsyncSession = Depends(get_db)) -> dict:
    from app.services.execution_state import recovery_preview
    task = await db.get(Task, task_id, options=[lazyload('*')])
    if task is None:
        raise HTTPException(404, 'Task not found')
    return await recovery_preview(db, task, current_user, provider, model)


@router.post('/{task_id}/recover', summary='Approve the previewed historical execution budget')
async def approve_recovery(task_id: uuid.UUID, body: HistoricalRecoveryRequest,
                           current_user: User = Depends(require_role('admin')),
                           db: AsyncSession = Depends(get_db)) -> dict:
    from app.services.execution_state import recover_task
    return await recover_task(db, task_id, current_user, body)


class TaskReassignmentRequest(BaseModel):
    agent_id: uuid.UUID
    reason: str = Field(min_length=1, max_length=2000)


@router.post('/{task_id}/reassign', summary='Repair blocked work without resetting its price or spent budget')
async def reassign_task(task_id: uuid.UUID, body: TaskReassignmentRequest,
                        current_user: User = Depends(require_role('admin')),
                        db: AsyncSession = Depends(get_db)) -> dict:
    from app.services.task_reassignment import reassign_task as repair
    return await repair(db, task_id, body.agent_id, body.reason, current_user)
