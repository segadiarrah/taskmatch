"""Job management endpoints."""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import structlog
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import lazyload, selectinload

from app.core.config import settings
from app.core.database import async_session_factory, get_db
from app.core.deps import get_current_active_user, require_role
from app.middleware.audit import log_audit
from app.models.agent import Agent, AgentStatus
from app.models.assignment import Assignment, AssignmentStatus
from app.models.audit import MCPDecision, MCPDecisionType
from app.models.bid import Bid, BidStatus
from app.models.delivery import DeliveryPlan, DeliveryStatus
from app.models.job import Job, JobRequirement, JobStatus
from app.models.payment import PaymentRecord
from app.models.quote import ExecutionRoute, Quote, QuoteStatus, TaskQuote
from app.models.submission import Submission, SubmissionStatus
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.job import JobCreate, JobListResponse, JobResponse, JobUpdate
from app.services import llm_service, mcp_service, quote_service
from app.services.task_access import load_execution_task, lock_job, task_visibility
from app.services.workflow_service import accept_delivery, finalize_job_if_done

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)

router = APIRouter()


async def _generate_plan(job_id: uuid.UUID) -> None:
    """Background: format the brief, decompose it, and price it.

    Stops at a quote. Nothing is matched, assigned or executed here — that is
    deliberate: the client sees what the work costs before any of it happens, and
    :func:`_execute_job` only runs once they have accepted. Runs in its own DB
    session so it can execute after the submit response has been returned.
    Best-effort; failures are logged, not raised.
    """
    async with async_session_factory() as db:
        try:
            await mcp_service.format_job(db, job_id)
            created_tasks = await mcp_service.decompose_job(db, job_id)
            quote = await quote_service.create_quote_for_job(db, job_id)
            await db.commit()
            logger.info(
                "plan.quoted",
                job_id=str(job_id),
                task_count=len(created_tasks),
                quote_id=str(quote.id),
                total=float(quote.total),
            )
        except Exception as exc:  # noqa: BLE001
            await db.rollback()
            logger.warning("plan.failed", job_id=str(job_id), error=str(exc))


async def _execute_job(job_id: uuid.UUID) -> None:
    """Dispatch durable task operations; each result commits independently."""
    from app.services.task_execution import schedule_job
    await schedule_job(job_id, async_session_factory)


async def _deliver_task(db: AsyncSession, task: Task, agent: Agent, assignment: Assignment) -> None:
    """Compatibility dispatcher: provider calls belong to the durable worker."""
    from app.services.task_execution import queue_task
    job, task = await load_execution_task(db, task.id)
    owner = await db.get(User, agent.developer_user_id, options=[lazyload("*")])
    if agent.slug.startswith("llm-") and owner and owner.role == "admin":
        await queue_task(db, job, task)


# Kept as an internal alias for existing execution callers.
_finalize_job_if_done = finalize_job_if_done


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
        billing_mode=settings.PAYMENT_MODE,
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
    query = select(Job).options(lazyload("*"), selectinload(Job.tasks).load_only(Task.id))

    role = str(current_user.role)
    if role == "client":
        query = query.where(Job.client_user_id == current_user.id)
    elif role == "agent_developer":
        query = query.where(
            Job.id.in_(select(Task.job_id).where(task_visibility(current_user)))
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
    result = await db.execute(select(Job).options(lazyload("*"), selectinload(Job.tasks).load_only(Task.id)).where(Job.id == job_id))
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

    if role == "agent_developer":
        visible = await db.scalar(select(Task.id).where(Task.job_id == job.id, task_visibility(current_user)).limit(1))
        if visible is None:
            raise HTTPException(status_code=403, detail="Access denied")
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
    job = await lock_job(db, job_id)
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

    from app.services.billing_service import assert_quote_editable
    await assert_quote_editable(db, job)
    update_data = body.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] != job.status:
        raise HTTPException(status_code=409, detail="Use the job workflow actions to change its status")
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
    result = await db.execute(select(Job).options(lazyload("*")).where(Job.id == job_id))
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
        select(Task).options(lazyload("*")).where(Task.job_id == job_id).order_by(Task.priority)
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

    # Latest delivered submission per task (so the client can see the result),
    # plus a submission count per task so we can surface revision history.
    delivered_by_task: dict[str, dict] = {}
    submission_counts: dict[str, int] = {}
    if tasks:
        sub_result = await db.execute(
            select(Submission).options(lazyload("*"))
            .where(Submission.task_id.in_([t.id for t in tasks]))
            .order_by(Submission.created_at.desc())
        )
        for s in sub_result.scalars().all():
            key = str(s.task_id)
            submission_counts[key] = submission_counts.get(key, 0) + 1
            if key in delivered_by_task:
                continue
            out = s.output_json or {}
            result_text = str(out.get("result") or "")
            delivered_by_task[key] = {
                "submission_id": str(s.id),
                "summary": s.summary or out.get("summary"),
                "result_preview": result_text[:8000],
                "produced_by": out.get("produced_by"),
                "status": s.status.value if hasattr(s.status, "value") else str(s.status),
            }

    # Latest payment for the job (so the client can review + release escrow).
    payment = (
        await db.execute(
            select(PaymentRecord).options(lazyload("*")).where(PaymentRecord.job_id == job_id).order_by(PaymentRecord.created_at.desc()).limit(1)
        )
    ).scalar_one_or_none()
    payment_summary = None
    if payment is not None:
        payment_summary = {
            "id": str(payment.id),
            "status": payment.payment_status.value if hasattr(payment.payment_status, "value") else str(payment.payment_status),
            "gross_amount": float(payment.gross_amount),
            "platform_fee": float(payment.platform_fee),
            "net_amount": float(payment.net_amount),
            "currency": payment.currency,
            "provider": payment.provider,
            "provider_ref": payment.provider_ref,
        }

    stages = [
        {"key": "format", "label": "Format", "desc": "Your brief becomes a structured spec."},
        {"key": "decompose", "label": "Decompose", "desc": "The spec is split into assignable tasks."},
        {"key": "quote", "label": "Price & quote", "desc": "TaskMatch sets a price per task. You approve before anything runs."},
        {"key": "match", "label": "Match & rank", "desc": "AI agents are matched and ranked per task."},
        {"key": "assign", "label": "Assign", "desc": "The best-scored agent is assigned each task."},
        {"key": "validate", "label": "Validate", "desc": "Each result is checked against acceptance criteria."},
        {"key": "pay", "label": "Settlement", "desc": "Your acceptance makes the manual ledger ready for settlement."},
    ]

    # Quote summary — the plan and the price are one story for the client, so the
    # panel that renders the breakdown does not need a second round trip.
    quote = await quote_service.current_quote(db, job_id)
    quote_summary = None
    if quote is not None:
        quote_summary = {
            "id": str(quote.id),
            "status": quote.status.value
            if hasattr(quote.status, "value")
            else str(quote.status),
            "currency": quote.currency,
            "subtotal": float(quote.subtotal),
            "platform_fee": float(quote.platform_fee),
            "total": float(quote.total),
            "savings_vs_human": quote.savings_vs_human,
            "human_equivalent_low": float(quote.human_equivalent_low)
            if quote.human_equivalent_low is not None
            else None,
            "human_equivalent_high": float(quote.human_equivalent_high)
            if quote.human_equivalent_high is not None
            else None,
            "valid_until": quote.valid_until.isoformat() if quote.valid_until else None,
            "actionable": quote.is_actionable,
        }

    delivery_plan = (
        await db.execute(select(DeliveryPlan).options(lazyload("*")).where(DeliveryPlan.job_id == job_id))
    ).scalar_one_or_none()
    delivery_summary = None
    if delivery_plan is not None:
        delivery_summary = {
            "mode": delivery_plan.mode.value
            if hasattr(delivery_plan.mode, "value")
            else str(delivery_plan.mode),
            "status": delivery_plan.status.value
            if hasattr(delivery_plan.status, "value")
            else str(delivery_plan.status),
            "target": delivery_plan.target,
            "needs_access_exchange": delivery_plan.needs_access_exchange,
            "signed_off_at": delivery_plan.signed_off_at.isoformat()
            if delivery_plan.signed_off_at
            else None,
        }

    return {
        "ready": len(tasks) > 0,
        "planning": len(tasks) == 0 and job.status == JobStatus.submitted,
        "quote": quote_summary,
        "delivery": delivery_summary,
        "awaiting_quote_approval": job.status == JobStatus.quoted,
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
                "delivered": delivered_by_task.get(str(t.id)),
                # Each revision after a dispute adds a submission → count - 1.
                "revision_count": max(0, submission_counts.get(str(t.id), 0) - 1),
            }
            for t in tasks
        ],
        "revised": any(c > 1 for c in submission_counts.values()),
        "stages": stages,
        "payment": payment_summary,
    }


@router.post("/{job_id}/accept", summary="Accept delivered work for manual settlement")
async def accept_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Accept delivery and close the job; no financial transfer occurs here."""
    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    role = getattr(current_user.role, "value", str(current_user.role))
    if job.client_user_id != current_user.id and role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your job")

    try:
        ready = await accept_delivery(db, job)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    # Actual settlement is a separate, administrator-confirmed operation.
    released = 0

    # Closing a job always clears the vault: a client should never have to
    # remember to rotate credentials they shared to get the work done.
    from app.api.v1.endpoints.delivery import revoke_job_access_grants

    grants_revoked = await revoke_job_access_grants(db, job.id)
    plan = await db.scalar(select(DeliveryPlan).where(DeliveryPlan.job_id == job.id))
    if plan:
        now = datetime.now(timezone.utc)
        plan.status = DeliveryStatus.signed_off
        plan.signed_off_at = now
        plan.accesses_revoked_at = now
    await db.flush()

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="accept_job",
        entity_type="job",
        entity_id=str(job.id),
        payload={"payments_released": released, "grants_revoked": grants_revoked},
    )
    return {
        "job_id": str(job.id),
        "status": job.status.value if hasattr(job.status, "value") else str(job.status),
        "payments_released": released,
        "payments_ready": ready,
        "payment_settlement": "manual" if job.billing_mode == "legacy_manual" else "stripe",
        "grants_revoked": grants_revoked,
    }


class DisputeRequest(BaseModel):
    """Client-supplied reason for contesting a delivered deliverable."""

    reason: str = Field(default="", max_length=2000)


async def _run_revision(job_id: uuid.UUID, reason: str) -> None:
    """Resume the revised generation through the same durable task dispatcher."""
    from app.services.task_execution import schedule_job
    await schedule_job(job_id, async_session_factory, revision=True)


@router.post("/{job_id}/dispute", summary="Request a revision before settlement")
async def dispute_job(
    job_id: uuid.UUID,
    body: DisputeRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Client contests a delivered deliverable. Escrow stays held (unpaid), the
    tasks return to revision, and a fresh execution + validation pass runs before
    the job comes back for review. Accessible to the job owner (or an admin)."""
    job = (await db.execute(select(Job).where(Job.id == job_id).with_for_update().execution_options(populate_existing=True))).scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    role = getattr(current_user.role, "value", str(current_user.role))
    if job.client_user_id != current_user.id and role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your job")
    if job.status != JobStatus.client_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only delivered work awaiting your review can be disputed",
        )

    from app.services.billing_service import enqueue_operation, require_execution_funding
    await require_execution_funding(db, job)

    # Escrow is already held as 'releasable' (never paid) — contesting keeps it
    # frozen. Return the delivered tasks to revision and reopen the job.
    tasks = list((await db.execute(select(Task).where(Task.job_id == job_id))).scalars().all())
    reverted = 0
    for t in tasks:
        if t.status == TaskStatus.approved:
            t.status = TaskStatus.validation_failed
            t.input_spec_json = {**(t.input_spec_json or {}), "revision_feedback": body.reason,
                                 "_execution_generation": int((t.input_spec_json or {}).get("_execution_generation", 0)) + 1}
            assignments = (await db.execute(select(Assignment).where(
                Assignment.task_id == t.id, Assignment.status == AssignmentStatus.completed
            ))).scalars()
            for assignment in assignments:
                assignment.status = AssignmentStatus.active
                assignment.completed_at = None
            reverted += 1
    job.status = JobStatus.in_progress
    await db.flush()

    audit = await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="dispute_job",
        entity_type="job",
        entity_id=str(job.id),
        payload={"reason": body.reason[:500], "tasks_reverted": reverted},
    )
    if job.billing_mode == "legacy_manual":
        await db.commit()
        background_tasks.add_task(_run_revision, job_id, body.reason)
    else:
        await enqueue_operation(db, "execute", job.id, f"revision:{job.id}:{audit.id}",
                                payload={"revision_reason": body.reason})
        await db.commit()


    return {
        "job_id": str(job.id),
        "status": job.status.value if hasattr(job.status, "value") else str(job.status),
        "payment_status": "pending",
        "payment_settlement": "manual" if job.billing_mode == "legacy_manual" else "stripe",
        "message": "Revision requested. Payment remains pending until you accept delivery.",
    }


# ---------------------------------------------------------------------------
# Document upload + ingestion
# ---------------------------------------------------------------------------

_UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/app/uploads")
_MAX_INGEST_CHARS = 40_000


def _extract_text(filename: str, data: bytes) -> str:
    """Best-effort text extraction from an uploaded document."""
    name = (filename or "").lower()
    try:
        if name.endswith(".pdf"):
            import io

            import pypdf  # type: ignore

            reader = pypdf.PdfReader(io.BytesIO(data))
            return "\n".join((p.extract_text() or "") for p in reader.pages)
        if name.endswith(".docx"):
            import io

            import docx  # type: ignore

            document = docx.Document(io.BytesIO(data))
            return "\n".join(p.text for p in document.paragraphs)
        # txt / md / csv / json / anything decodable as text
        return data.decode("utf-8", errors="ignore")
    except Exception as exc:  # noqa: BLE001
        logger.warning("ingest.extract_failed", filename=filename, error=str(exc))
        return ""


@router.post("/{job_id}/documents", summary="Attach & ingest documents for a job")
async def upload_documents(
    job_id: uuid.UUID,
    files: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Upload one or more documents (specs, briefs, data, designs) for a job.

    The text is extracted and ingested into the job description so the MCP
    planning step understands the full context — not just a short summary.
    Complex requests are the whole point of the platform.
    """
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    role = getattr(current_user.role, "value", str(current_user.role))
    if job.client_user_id != current_user.id and role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your job")
    if job.status not in (JobStatus.draft, JobStatus.submitted):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Documents can only be attached before the job is planned.",
        )

    dest = os.path.join(_UPLOAD_DIR, str(job_id))
    os.makedirs(dest, exist_ok=True)

    ingested: list[dict] = []
    appended = ""
    for f in files:
        data = await f.read()
        # Persist the raw file.
        safe = os.path.basename(f.filename or "document")
        with open(os.path.join(dest, safe), "wb") as out:
            out.write(data)
        text = _extract_text(f.filename or "", data).strip()
        ingested.append({"name": safe, "size": len(data), "chars": len(text)})
        if text:
            appended += f"\n\n--- Attached document: {safe} ---\n{text}"

    # Ingest extracted text into the brief (bounded), so planning sees it.
    if appended:
        combined = (job.raw_description or "") + appended
        job.raw_description = combined[:_MAX_INGEST_CHARS]

    meta = dict(job.metadata_json or {})
    docs = list(meta.get("documents") or [])
    docs.extend(ingested)
    meta["documents"] = docs
    job.metadata_json = meta
    await db.flush()

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="upload_documents",
        entity_type="job",
        entity_id=str(job.id),
        payload={"count": len(ingested)},
    )

    return {
        "job_id": str(job.id),
        "documents": ingested,
        "ingested_chars": len(appended),
        "total_documents": len(docs),
    }
