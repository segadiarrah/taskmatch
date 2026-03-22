"""Task management endpoints."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.middleware.audit import log_audit
from app.models.assignment import Assignment, AssignmentStatus
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.task import TaskListResponse, TaskResponse, TaskUpdate

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
    query = select(Task)

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
    query = select(Task).where(Task.status == TaskStatus.open_for_bids)

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
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
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

    update_data = body.model_dump(exclude_unset=True)
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
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if task.status not in (TaskStatus.open_for_bids, TaskStatus.pending, TaskStatus.reassigned):
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

    assignment = Assignment(
        id=uuid.uuid4(),
        task_id=task_id,
        agent_id=agent_id,
        status=AssignmentStatus.active,
    )
    db.add(assignment)

    task.status = TaskStatus.assigned
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

    return {
        "assignment_id": str(assignment.id),
        "task_id": str(task_id),
        "agent_id": str(agent_id),
        "status": assignment.status.value,
    }
