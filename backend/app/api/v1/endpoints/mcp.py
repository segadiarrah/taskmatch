"""MCP orchestration endpoints.

These admin-triggered endpoints run the AI-driven pipeline steps — job
formatting, task decomposition, agent matching, bid ranking, and submission
validation — by delegating to :mod:`app.services.mcp_service`.

The service layer uses an LLM (OpenAI-compatible, via OpenRouter) for the
generative steps (formatting & decomposition) and explainable deterministic
scoring for matching, ranking, and validation. Every step is recorded in the
``mcp_decisions`` table for full inspectability, and every LLM call falls back
to a deterministic path, so the pipeline works with or without a model.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.middleware.audit import log_audit
from app.models.job import Job, JobStatus
from app.models.submission import Submission
from app.models.task import Task
from app.models.user import User
from app.services import mcp_service

router = APIRouter()


@router.post("/format-job/{job_id}", summary="Trigger MCP job formatting")
async def format_job(
    job_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Structure a job's raw description into a formatted specification."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    if job.status not in (JobStatus.submitted, JobStatus.draft):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job is in '{job.status}' status; must be 'submitted' or 'draft' to format",
        )

    try:
        formatted = await mcp_service.format_job(db, job_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="mcp_format_job",
        entity_type="job",
        entity_id=str(job.id),
    )

    return {
        "job_id": str(job.id),
        "status": str(job.status),
        "formatted_summary": formatted,
    }


@router.post("/decompose-job/{job_id}", summary="Trigger MCP job decomposition")
async def decompose_job(
    job_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Decompose a formatted job into granular, biddable tasks."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    if job.status not in (JobStatus.formatted, JobStatus.submitted):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job must be 'formatted' or 'submitted' to decompose; current status is '{job.status}'",
        )

    try:
        created_tasks = await mcp_service.decompose_job(db, job_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    # Open the job for bidding now that biddable tasks exist.
    job.status = JobStatus.bidding
    await db.flush()

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="mcp_decompose_job",
        entity_type="job",
        entity_id=str(job.id),
        payload={"task_ids": [t["id"] for t in created_tasks]},
    )

    return {
        "job_id": str(job.id),
        "status": str(job.status),
        "tasks_created": len(created_tasks),
        "task_ids": [t["id"] for t in created_tasks],
        "tasks": created_tasks,
    }


@router.post("/match-agents/{task_id}", summary="Trigger MCP agent matching")
async def match_agents(
    task_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Find and rank active agents suitable for a task (explainable scoring)."""
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    try:
        ranked = await mcp_service.match_agents(db, task_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="mcp_match_agents",
        entity_type="task",
        entity_id=str(task.id),
    )

    return {
        "task_id": str(task.id),
        "ranked_agents": ranked[:10],
        "total_candidates": len(ranked),
    }


@router.post("/rank-bids/{task_id}", summary="Trigger MCP bid ranking")
async def rank_bids(
    task_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Rank submitted bids for a task and shortlist the top candidate."""
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    try:
        ranked = await mcp_service.rank_bids(db, task_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="mcp_rank_bids",
        entity_type="task",
        entity_id=str(task.id),
        payload={"bid_count": len(ranked)},
    )

    return {
        "task_id": str(task.id),
        "ranked_bids": ranked,
        "shortlisted_bid_id": ranked[0]["bid_id"] if ranked else None,
    }


@router.post("/validate-submission/{submission_id}", summary="Trigger MCP submission validation")
async def validate_submission(
    submission_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Validate a submission against its task's output spec and record a review."""
    sub_result = await db.execute(select(Submission).where(Submission.id == submission_id))
    submission = sub_result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    try:
        result = await mcp_service.validate_submission(db, submission_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="mcp_validate_submission",
        entity_type="submission",
        entity_id=str(submission.id),
        payload={"decision": result["verdict"], "score": result["score"]},
    )

    return {
        "submission_id": result["submission_id"],
        "task_id": result["task_id"],
        "decision": result["verdict"],
        "score": result["score"],
        "issues": result["issues"],
        "checklist": result["checklist"],
        "review_id": result["review_id"],
    }
