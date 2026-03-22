"""Review / validation endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.middleware.audit import log_audit
from app.models.assignment import Assignment, AssignmentStatus
from app.models.review import ReviewDecision, ReviewerType, ValidationReview
from app.models.submission import Submission, SubmissionStatus
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewResponse

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
    current_user: User = Depends(require_role("admin", "client")),
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
    # Validate submission exists.
    sub_result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = sub_result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )

    # Validate the task.
    task_result = await db.execute(select(Task).where(Task.id == submission.task_id))
    task = task_result.scalar_one_or_none()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated task not found",
        )

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

    # Apply business logic based on the review decision.
    decision = ReviewDecision(body.decision)

    if decision == ReviewDecision.approved:
        # Approve the submission and task.
        submission.status = SubmissionStatus.approved
        task.status = TaskStatus.approved

        await log_audit(
            db,
            actor_type="user",
            actor_id=str(current_user.id),
            action="approve_submission",
            entity_type="submission",
            entity_id=str(submission.id),
            payload={"task_id": str(task.id)},
        )

    elif decision in (ReviewDecision.rejected, ReviewDecision.rework_requested):
        task.retry_count += 1

        if task.retry_count >= task.max_retries:
            # Exhausted retries: cancel the assignment and task.
            submission.status = SubmissionStatus.rejected
            task.status = TaskStatus.cancelled

            # Cancel active assignments for this task.
            assignments_result = await db.execute(
                select(Assignment).where(
                    Assignment.task_id == task.id,
                    Assignment.status == AssignmentStatus.active,
                )
            )
            for assignment in assignments_result.scalars().all():
                assignment.status = AssignmentStatus.cancelled

            await log_audit(
                db,
                actor_type="user",
                actor_id=str(current_user.id),
                action="cancel_task_max_retries",
                entity_type="task",
                entity_id=str(task.id),
                payload={
                    "retry_count": task.retry_count,
                    "max_retries": task.max_retries,
                },
            )
        else:
            # Retries remain: set submission to rework and task to validation_failed.
            submission.status = SubmissionStatus.rework_requested
            task.status = TaskStatus.validation_failed

            await log_audit(
                db,
                actor_type="user",
                actor_id=str(current_user.id),
                action="reject_submission",
                entity_type="submission",
                entity_id=str(submission.id),
                payload={
                    "task_id": str(task.id),
                    "retry_count": task.retry_count,
                    "max_retries": task.max_retries,
                },
            )

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
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    if task_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    query = (
        select(ValidationReview)
        .where(ValidationReview.task_id == task_id)
        .order_by(ValidationReview.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    reviews = result.scalars().all()

    return [ReviewResponse.model_validate(r) for r in reviews]
