"""Job management endpoints."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.middleware.audit import log_audit
from app.models.job import Job, JobRequirement, JobStatus
from app.models.user import User
from app.schemas.job import JobCreate, JobListResponse, JobResponse, JobUpdate

router = APIRouter()


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
    current_user: User = Depends(require_role("client")),
    db: AsyncSession = Depends(get_db),
) -> JobResponse:
    """Submit a draft job for processing.

    Transitions the job from ``draft`` to ``submitted`` status, making it
    eligible for MCP formatting and decomposition.
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
    await db.flush()
    await db.refresh(job)

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="submit_job",
        entity_type="job",
        entity_id=str(job.id),
    )

    resp = JobResponse.model_validate(job)
    resp.tasks_count = len(job.tasks) if job.tasks else 0
    return resp
