"""Review / validation endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import lazyload

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.middleware.audit import log_audit
from app.models.review import ReviewDecision, ReviewerType, ValidationReview
from app.models.submission import Submission, SubmissionStatus
from app.models.task import Task
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewResponse
from app.services.task_access import load_execution_task, require_task_access
from app.services.workflow_service import apply_review

router = APIRouter()


@router.post(
    "/submissions/{submission_id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a review on a submission",
)
async def create_review(
    submission_id: uuid.UUID,
    body: ReviewCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewResponse:
    """Create a validation review for a submission.

    Business logic:
    - If ``approved``: mark the task as ``approved`` and mark the submission
      as ``approved``, making the payment releasable.
    - If ``rejected`` and the task has exhausted its retry budget (3 retries):
      cancel the assignment and mark the task as ``cancelled``.
    - If ``rejected`` or ``rework_requested`` with retries remaining: increment
      the task retry count and set the task back to ``validation_failed``.
    """
    task_id = await db.scalar(select(Submission.task_id).where(Submission.id == submission_id))
    if task_id is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    job, task = await load_execution_task(db, task_id)
    submission = await db.scalar(
        select(Submission).where(Submission.id == submission_id)
        .with_for_update().execution_options(populate_existing=True)
    )

    if current_user.role != "admin" and job.client_user_id != current_user.id:
        raise HTTPException(403, "Only the requester or an administrator can review")
    await require_task_access(db, task, current_user)
    if submission.status not in (SubmissionStatus.submitted, SubmissionStatus.under_review):
        raise HTTPException(status_code=409, detail="Submission has already been reviewed")
    from app.services.task_execution import accepted_line, sega, queue_task
    from app.models.agent import Agent
    line = await accepted_line(db, task.id)
    producer = await db.get(Agent, submission.agent_id, options=[lazyload("*")])
    human_work = producer and "/experts/" in (producer.endpoint_url or "")
    if human_work and producer.developer_user_id == current_user.id:
        raise HTTPException(403, "Human work must be reviewed by the client or another administrator")
    if line and line.route == "hybrid" and not human_work:
        reviewer = await sega(db)
        if reviewer is None or reviewer.id != current_user.id:
            raise HTTPException(403, "This hybrid task requires its designated human reviewer")
    # Determine reviewer type from role.
    role = str(current_user.role)
    if role == "admin":
        reviewer_type = ReviewerType.admin
    else:
        reviewer_type = ReviewerType.client

    review = ValidationReview(
        id=uuid.uuid4(),
        task_id=task.id,
        submission_id=submission_id,
        reviewer_type=reviewer_type,
        reviewer_user_id=current_user.id,
        decision=ReviewDecision(body.decision),
        notes=body.notes,
        score=body.score,
    )
    db.add(review)

    await apply_review(db, task, submission, body.decision)
    if task.status == "validation_failed" and producer and producer.slug.startswith("llm-"):
        task.input_spec_json = {**(task.input_spec_json or {}), "revision_feedback": body.notes or "Please correct the deliverable"}
        await queue_task(db, job, task, revision=True)

    await db.flush()
    await db.refresh(review)

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="create_review",
        entity_type="review",
        entity_id=str(review.id),
        payload={
            "submission_id": str(submission_id),
            "decision": body.decision,
            "score": body.score,
        },
    )

    if task.human_contract_json:
        await log_audit(db, actor_type='user', actor_id=str(current_user.id), action='human_task.review_decided',
                        entity_type='task', entity_id=str(task.id), payload={'decision': body.decision})
    return ReviewResponse.model_validate(review)


@router.get(
    "/tasks/{task_id}/reviews",
    response_model=list[ReviewResponse],
    summary="List reviews for a task",
)
async def list_reviews(
    task_id: uuid.UUID,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> list[ReviewResponse]:
    """Return a paginated list of reviews for a specific task."""
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
        select(ValidationReview).options(lazyload("*"))
        .where(ValidationReview.task_id == task_id)
        .order_by(ValidationReview.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    reviews = result.scalars().all()

    return [ReviewResponse.model_validate(r) for r in reviews]
