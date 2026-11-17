"""Submission management endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import lazyload

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.middleware.audit import log_audit
from app.models.agent import Agent
from app.models.assignment import Assignment, AssignmentStatus
from app.models.submission import Submission, SubmissionStatus
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.submission import SubmissionCreate, SubmissionResponse
from app.services.task_access import load_execution_task, require_task_access

router = APIRouter()


@router.post(
    "/tasks/{task_id}/submissions",
    response_model=SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit work result",
)
async def create_submission(
    task_id: uuid.UUID,
    body: SubmissionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> SubmissionResponse:
    """Submit a work result for a task.

    The caller must own the agent referenced in the submission, and the
    assignment must exist and be active.
    """
    # Validate task exists.
    _, task = await load_execution_task(db, task_id)

    if task.status not in (TaskStatus.assigned, TaskStatus.in_progress, TaskStatus.validation_failed):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task is in '{task.status}' status and cannot accept submissions",
        )

    # Validate agent ownership.
    agent_result = await db.execute(select(Agent).where(Agent.id == body.agent_id))
    agent = agent_result.scalar_one_or_none()
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )
    if agent.developer_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit work from your own agents",
        )

    if current_user.role == "admin" and "/experts/" not in (agent.endpoint_url or ""):
        raise HTTPException(status_code=403, detail="Administrators may submit only their own human work")

    from app.services.human_workers import require_eligible_executor
    await require_eligible_executor(db, task, agent.id, accepting=False)
    if task.human_contract_json:
        from app.schemas.human import HumanResult
        from pydantic import ValidationError
        try:
            HumanResult(summary=body.summary, evidence=body.output_json)
        except ValidationError:
            raise HTTPException(422, 'Human delivery requires a summary and nonempty textual evidence') from None
    if task.human_contract_json and not set(task.human_contract_json['evidence_requirements']).issubset(body.output_json or {}):
        raise HTTPException(422, 'Required Human Task evidence is missing')

    # Validate assignment exists.
    assignment_result = await db.execute(
        select(Assignment).where(Assignment.id == body.assignment_id)
    )
    assignment = assignment_result.scalar_one_or_none()
    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )
    if assignment.task_id != task_id or assignment.agent_id != body.agent_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment does not match the task and agent",
        )

    if assignment.status != AssignmentStatus.active:
        raise HTTPException(status_code=409, detail="Assignment is no longer active")

    submission = Submission(
        id=uuid.uuid4(),
        task_id=task_id,
        agent_id=body.agent_id,
        assignment_id=body.assignment_id,
        output_json=body.output_json,
        artifact_urls_json=body.artifact_urls_json,
        summary=body.summary,
        status=SubmissionStatus.submitted,
    )
    db.add(submission)

    # Transition task to submitted status.
    task.status = TaskStatus.submitted
    await db.flush()
    await db.refresh(submission)

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="create_submission",
        entity_type="submission",
        entity_id=str(submission.id),
        payload={"task_id": str(task_id), "agent_id": str(body.agent_id)},
    )

    return SubmissionResponse.model_validate(submission)


@router.get(
    "/tasks/{task_id}/submissions",
    response_model=list[SubmissionResponse],
    summary="List submissions for a task",
)
async def list_submissions(
    task_id: uuid.UUID,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> list[SubmissionResponse]:
    """Return a paginated list of submissions for a specific task."""
    # Verify task exists.
    task_result = await db.execute(select(Task).options(lazyload("*")).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    await require_task_access(db, task, current_user)
    query = (
        select(Submission).options(lazyload("*"))
        .where(Submission.task_id == task_id)
        .order_by(Submission.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    submissions = result.scalars().all()

    return [SubmissionResponse.model_validate(s) for s in submissions]


@router.get(
    "/submissions/{submission_id}",
    response_model=SubmissionResponse,
    summary="Get submission detail",
)
async def get_submission(
    submission_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> SubmissionResponse:
    """Return full details for a single submission."""
    result = await db.execute(
        select(Submission).options(lazyload("*")).where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )
    task = await db.get(Task, submission.task_id, options=[lazyload("*")])
    await require_task_access(db, task, current_user)
    return SubmissionResponse.model_validate(submission)
