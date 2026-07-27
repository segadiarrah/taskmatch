"""Job management endpoints."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

import json

import structlog

from app.core.database import async_session_factory, get_db
from app.core.deps import get_current_active_user, require_role
from app.middleware.audit import log_audit
from app.models.audit import MCPDecision, MCPDecisionType
from app.models.job import Job, JobRequirement, JobStatus
from app.models.task import Task
from app.models.user import User
from app.schemas.job import JobCreate, JobListResponse, JobResponse, JobUpdate
from app.services import mcp_service

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)

router = APIRouter()


async def _generate_plan(job_id: uuid.UUID) -> None:
    """Background: format the brief, decompose into tasks, and match agents.

    Runs in its own DB session so it can execute after the submit response has
    been returned. Best-effort; failures are logged, not raised.
    """
    async with async_session_factory() as db:
        try:
            await mcp_service.format_job(db, job_id)
            created_tasks = await mcp_service.decompose_job(db, job_id)
            job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
            if job is not None:
                job.status = JobStatus.bidding
            await db.flush()
            for t in created_tasks:
                try:
                    await mcp_service.match_agents(db, uuid.UUID(t["id"]))
                except Exception as exc:  # noqa: BLE001
                    logger.warning("plan.match_failed", task_id=t["id"], error=str(exc))
            await db.commit()
            logger.info("plan.complete", job_id=str(job_id), task_count=len(created_tasks))
        except Exception as exc:  # noqa: BLE001
            await db.rollback()
            logger.warning("plan.failed", job_id=str(job_id), error=str(exc))


@router.post(
    "",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new job",
)
async def create_job(
    body: JobCreate,
    current_user: User = Depends(require_role("client")),
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    """Create a new job posting.

    The caller must have the ``client`` role.  The job starts in ``draft``
    status until explicitly submitted.
    """
    job = Job(
        id=uuid.uuid4(),
        client_user_id=current_user.id,
        title=body.title,
        raw_description=body.raw_description,
        budget_min=body.budget_min,
        budget_max=body.budget_max,
        currency=body.currency or "USD",
        deadline=body.deadline,
        preferred_agent_ids=(
            [str(aid) for aid in body.preferred_agent_ids]
            if body.preferred_agent_ids
            else None
        ),
        auto_select_enabled=body.auto_select_enabled if body.auto_select_enabled is not None else True,
        status=JobStatus.draft,
    )
    db.add(job)
    await db.flush()

    # Create structured requirements if provided.
    if body.requirements:
        for req in body.requirements:
            requirement = JobRequirement(
                id=uuid.uuid4(),
                job_id=job.id,
                requirement_type=req.requirement_type,
                description=req.description,
                priority=req.priority or "medium",
            )
            db.add(requirement)
        await db.flush()

    await db.refresh(job)

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="create_job",
        entity_type="job",
        entity_id=str(job.id),
        payload={"title": body.title},
    )

    resp = JobResponse.model_validate(job)
    resp.tasks_count = 0
    return resp


@router.get(
    "",
    response_model=JobListResponse,
    summary="List jobs",
)
async def list_jobs(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> JobListResponse:
    """Return a paginated list of jobs.

    - Clients see only their own jobs.
    - Admins see all jobs.
    - Agent developers see jobs in bidding or later stages.
    """
    query = select(Job)

    role = str(current_user.role)
    if role == "client":
        query = query.where(Job.client_user_id == current_user.id)
    elif role == "agent_developer":
        query = query.where(
            Job.status.notin_([JobStatus.draft.value])
        )

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Job.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    jobs = result.scalars().all()

    job_responses = []
    for job in jobs:
        resp = JobResponse.model_validate(job)
        resp.tasks_count = len(job.tasks) if job.tasks else 0
        job_responses.append(resp)

    return JobListResponse(jobs=job_responses, total=total)


@router.get(
    "/{job_id}",
    response_model=JobResponse,
    summary="Get job detail",
)
async def get_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    """Return full details for a single job, including task count."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    role = str(current_user.role)
    if role == "client" and job.client_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    resp = JobResponse.model_validate(job)
    resp.tasks_count = len(job.tasks) if job.tasks else 0
    return resp


@router.put(
    "/{job_id}",
    response_model=JobResponse,
    summary="Update job",
)
async def update_job(
    job_id: uuid.UUID,
    body: JobUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    """Update an existing job.

    Clients may update only their own jobs that are still in ``draft`` status.
    Admins may update any job.
    """
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    role = str(current_user.role)
    if role == "client":
        if job.client_user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own jobs",
            )
        if job.status != JobStatus.draft:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft jobs can be edited by the client",
            )
    elif role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)

    await db.flush()
    await db.refresh(job)

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="update_job",
        entity_type="job",
        entity_id=str(job.id),
        payload=update_data,
    )

    resp = JobResponse.model_validate(job)
    resp.tasks_count = len(job.tasks) if job.tasks else 0
    return resp


@router.post(
    "/{job_id}/submit",
    response_model=JobResponse,
    summary="Submit job for processing",
)
async def submit_job(
    job_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_role("client")),
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    """Submit a draft job for processing.

    Transitions the job to ``submitted`` and kicks off planning in the
    background (format → decompose → match agents) so the response returns
    immediately and the client can poll ``GET /jobs/{id}/plan`` for the result.
    """
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    if job.client_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit your own jobs",
        )

    if job.status != JobStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job is in '{job.status}' status; only draft jobs can be submitted",
        )

    job.status = JobStatus.submitted
    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="submit_job",
        entity_type="job",
        entity_id=str(job.id),
    )
    # Commit the transition explicitly so it persists regardless of background
    # task scheduling, then plan asynchronously.
    await db.commit()
    await db.refresh(job)

    # Kick off planning in the background so the client sees who will do what
    # and how the request was decomposed, without blocking this response.
    background_tasks.add_task(_generate_plan, job_id)

    resp = JobResponse.model_validate(job)
    resp.tasks_count = len(job.tasks) if job.tasks else 0
    return resp


@router.get(
    "/{job_id}/plan",
    summary="Execution plan for a job (spec, task breakdown, matched agents)",
)
async def get_job_plan(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return a client-facing execution plan: the structured spec, the task
    breakdown, and — for each task — the AI agents matched to do the work.

    Makes it clear, right after submission, *who will do what* and *how the
    request was decomposed*. Accessible to the job owner and to admins.
    """
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    role = getattr(current_user.role, "value", str(current_user.role))
    if job.client_user_id != current_user.id and role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your job")

    # Parse the structured spec.
    spec: dict = {}
    if job.formatted_summary:
        try:
            spec = json.loads(job.formatted_summary)
        except json.JSONDecodeError:
            spec = {"objective": job.formatted_summary}

    # Tasks for this job.
    tasks_result = await db.execute(
        select(Task).where(Task.job_id == job_id).order_by(Task.priority)
    )
    tasks = list(tasks_result.scalars().all())

    # Latest agent-matching decision per task (read-only, no side effects).
    matches_by_task: dict[str, list] = {}
    if tasks:
        dec_result = await db.execute(
            select(MCPDecision)
            .where(
                MCPDecision.decision_type == MCPDecisionType.matching,
                MCPDecision.entity_type == "task",
                MCPDecision.entity_id.in_([str(t.id) for t in tasks]),
            )
            .order_by(MCPDecision.created_at.desc())
        )
        for d in dec_result.scalars().all():
            if d.entity_id in matches_by_task:
                continue  # keep only the most recent per task
            ranked = (d.output_snapshot_json or {}).get("ranked_agents", [])
            matches_by_task[d.entity_id] = ranked[:3]

    stages = [
        {"key": "format", "label": "Format", "desc": "Your brief becomes a structured spec."},
        {"key": "decompose", "label": "Decompose", "desc": "The spec is split into assignable tasks."},
        {"key": "match", "label": "Match & rank", "desc": "AI agents are matched and ranked per task."},
        {"key": "assign", "label": "Assign", "desc": "The best-scored agent is assigned each task."},
        {"key": "validate", "label": "Validate", "desc": "Each result is checked against acceptance criteria."},
        {"key": "pay", "label": "Pay", "desc": "Escrow releases only on validated delivery."},
    ]

    return {
        "ready": len(tasks) > 0,
        "planning": len(tasks) == 0 and job.status == JobStatus.submitted,
        "job": {
            "id": str(job.id),
            "title": job.title,
            "status": job.status.value if hasattr(job.status, "value") else str(job.status),
            "currency": job.currency,
            "budget_min": float(job.budget_min) if job.budget_min is not None else None,
            "budget_max": float(job.budget_max) if job.budget_max is not None else None,
        },
        "spec": {
            "objective": spec.get("objective"),
            "deliverables": spec.get("deliverables", []),
            "constraints": spec.get("constraints", []),
            "success_criteria": spec.get("success_criteria", []),
        },
        "tasks": [
            {
                "id": str(t.id),
                "title": t.title,
                "description": t.description,
                "task_type": t.task_type,
                "budget": float(t.budget) if t.budget is not None else None,
                "priority": t.priority,
                "status": t.status.value if hasattr(t.status, "value") else str(t.status),
                "matched_agents": matches_by_task.get(str(t.id), []),
            }
            for t in tasks
        ],
        "stages": stages,
    }
