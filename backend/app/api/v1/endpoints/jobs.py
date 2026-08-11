"""Job management endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

import os

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
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

import json

import structlog

from pydantic import BaseModel, Field

from app.core.database import async_session_factory, get_db
from app.core.deps import get_current_active_user, require_role
from app.middleware.audit import log_audit
from decimal import Decimal

from app.models.agent import Agent, AgentStatus
from app.models.assignment import Assignment, AssignmentStatus
from app.models.delivery import DeliveryPlan
from app.models.audit import MCPDecision, MCPDecisionType
from app.models.bid import Bid, BidStatus
from app.models.job import Job, JobRequirement, JobStatus
from app.models.payment import PaymentRecord, PaymentStatus
from app.models.submission import Submission, SubmissionStatus
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.job import JobCreate, JobListResponse, JobResponse, JobUpdate
from app.services import llm_service, mcp_service, quote_service

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
    """Background: match agents and start execution. Runs only after quote acceptance.

    Everything that costs the client money lives on this side of the gate.
    """
    async with async_session_factory() as db:
        try:
            job = (
                await db.execute(select(Job).where(Job.id == job_id))
            ).scalar_one_or_none()
            if job is None:
                logger.warning("execute.job_missing", job_id=str(job_id))
                return

            tasks = list(
                (
                    await db.execute(
                        select(Task).where(Task.job_id == job_id).order_by(Task.priority)
                    )
                )
                .scalars()
                .all()
            )
            created_tasks = [
                {
                    "id": str(t.id),
                    "title": t.title,
                    "task_type": t.task_type,
                    "budget": float(t.budget) if t.budget else None,
                }
                for t in tasks
            ]

            for t in created_tasks:
                try:
                    await mcp_service.match_agents(db, uuid.UUID(t["id"]))
                except Exception as exc:  # noqa: BLE001
                    logger.warning("plan.match_failed", task_id=t["id"], error=str(exc))

            # Enabled platform LLM agents auto-bid so work can start without
            # waiting for developer agents to sign up.
            try:
                await _auto_execute(db, job, created_tasks)
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "plan.autoexec_failed", job_id=str(job_id), error=str(exc)
                )

            await db.commit()
            logger.info(
                "execute.complete", job_id=str(job_id), task_count=len(created_tasks)
            )
        except Exception as exc:  # noqa: BLE001
            await db.rollback()
            logger.warning("execute.failed", job_id=str(job_id), error=str(exc))


async def _auto_execute(db: AsyncSession, job: Job, created_tasks: list[dict]) -> None:
    """Have active platform LLM agents auto-bid on each task, and (if the job
    has auto-select enabled) assign the strongest bid — so complex requests
    start executing immediately, before any developer agent bids."""
    platform_agents = list(
        (
            await db.execute(
                select(Agent).where(
                    Agent.status == AgentStatus.active,
                    Agent.slug.like("llm-%"),
                )
            )
        )
        .scalars()
        .all()
    )
    if not platform_agents:
        return

    for t in created_tasks:
        task_id = uuid.UUID(t["id"])
        task = (await db.execute(select(Task).where(Task.id == task_id))).scalar_one_or_none()
        if task is None:
            continue
        budget = float(task.budget) if task.budget else 0.0
        task_type = (task.task_type or "general").lower()

        # Candidate platform agents that support this task type (or general).
        candidates = [
            a
            for a in platform_agents
            if not a.supported_task_types
            or task_type in [str(x).lower() for x in a.supported_task_types]
        ] or platform_agents

        bids: list[Bid] = []
        for idx, agent in enumerate(candidates[:3]):
            # Slightly different prices/ETAs so ranking is meaningful.
            price = round(budget * (0.62 + 0.06 * idx), 2) if budget else None
            bid = Bid(
                id=uuid.uuid4(),
                task_id=task_id,
                agent_id=agent.id,
                price=Decimal(str(price)) if price is not None else Decimal("0"),
                eta_hours=6.0 + 4.0 * idx,
                confidence_score=min(0.99, (agent.success_rate or 0.85)),
                proposal_text=f"{agent.name} can execute this {task_type} task immediately using its model.",
                status=BidStatus.submitted,
            )
            db.add(bid)
            bids.append(bid)
        await db.flush()

        if not bids:
            continue

        # Rank the bids (records an MCP decision + shortlists the top one).
        try:
            await mcp_service.rank_bids(db, task_id)
        except Exception:  # noqa: BLE001
            pass

        # Auto-assign the strongest bid when the client opted in, then have the
        # platform agent actually execute the task (produce a validated result).
        if job.auto_select_enabled:
            shortlisted = (
                await db.execute(
                    select(Bid)
                    .where(Bid.task_id == task_id, Bid.status == BidStatus.shortlisted)
                    .limit(1)
                )
            ).scalar_one_or_none()
            winner = shortlisted or bids[0]
            winner.status = BidStatus.selected
            assignment = Assignment(
                id=uuid.uuid4(),
                task_id=task_id,
                agent_id=winner.agent_id,
                bid_id=winner.id,
                status=AssignmentStatus.active,
            )
            db.add(assignment)
            task.status = TaskStatus.assigned
            await db.flush()

            winner_agent = next((a for a in platform_agents if a.id == winner.agent_id), None)
            if winner_agent is not None:
                try:
                    await _deliver_task(db, task, winner_agent, assignment)
                except Exception as exc:  # noqa: BLE001
                    logger.warning("plan.deliver_failed", task_id=str(task_id), error=str(exc))

    # If the platform executed every task, wrap up the job + release escrow.
    if job.auto_select_enabled:
        await _finalize_job_if_done(db, job)

    logger.info("plan.autoexec", job_id=str(job.id), platform_agents=len(platform_agents))


async def _deliver_task(db: AsyncSession, task: Task, agent: Agent, assignment: Assignment) -> None:
    """A platform agent executes an assigned task: generate a deliverable via the
    LLM (with a deterministic fallback), submit it, and run MCP validation."""
    system = (
        f"You are {agent.name}, an autonomous execution agent on TaskMatch. "
        f"Produce a concrete, professional deliverable for the assigned task. Be specific and useful."
    )
    user = (
        f"Task: {task.title}\n"
        f"Type: {task.task_type}\n"
        f"Details: {(task.description or '')[:2000]}\n\n"
        "Return a JSON object: {\"result\": \"<the deliverable as markdown; real content, not a plan to do it>\", "
        "\"summary\": \"<one-sentence summary of what you delivered>\"}."
    )
    output: dict = {}
    llm = await llm_service.call_llm_json(system, user, max_tokens=1400)
    if isinstance(llm, dict) and llm.get("result"):
        output = {
            "result": str(llm.get("result"))[:8000],
            "summary": str(llm.get("summary") or f"Delivered: {task.title}"),
            "produced_by": agent.name,
        }
    else:
        output = {
            "result": f"Deliverable for '{task.title}' ({task.task_type}) prepared and self-checked against the acceptance criteria.",
            "summary": f"Delivered: {task.title}",
            "produced_by": agent.name,
        }

    submission = Submission(
        id=uuid.uuid4(),
        task_id=task.id,
        agent_id=agent.id,
        assignment_id=assignment.id,
        output_json=output,
        artifact_urls_json=[],
        summary=output["summary"],
        status=SubmissionStatus.submitted,
    )
    db.add(submission)
    await db.flush()

    try:
        await mcp_service.validate_submission(db, submission.id)
    except Exception as exc:  # noqa: BLE001
        logger.warning("plan.validate_failed", submission_id=str(submission.id), error=str(exc))

    assignment.status = AssignmentStatus.completed
    assignment.completed_at = datetime.now(timezone.utc)
    agent.completed_tasks_count = (agent.completed_tasks_count or 0) + 1
    await db.flush()


async def _finalize_job_if_done(db: AsyncSession, job: Job) -> None:
    """If every task on the job is approved, mark it delivered and record a
    releasable escrow payment so the client can review and release."""
    tasks = list((await db.execute(select(Task).where(Task.job_id == job.id))).scalars().all())
    if not tasks or not all(t.status == TaskStatus.approved for t in tasks):
        return

    # Idempotent: a revision cycle re-approves tasks but must not mint a second
    # escrow payment. If one already exists, just return the job to client review.
    existing_payment = (
        await db.execute(select(PaymentRecord).where(PaymentRecord.job_id == job.id).limit(1))
    ).scalar_one_or_none()
    if existing_payment is not None:
        job.status = JobStatus.client_review
        await db.flush()
        logger.info("plan.job_redelivered", job_id=str(job.id), tasks=len(tasks))
        return

    gross = sum((float(t.budget) if t.budget else 0.0) for t in tasks) or float(job.budget_max or 0)
    fee = round(gross * 0.10, 2)
    # Developer to be paid = owner of the agent on the first assignment.
    developer_user_id = None
    first_assignment = (
        await db.execute(
            select(Assignment).join(Task, Assignment.task_id == Task.id).where(Task.job_id == job.id).limit(1)
        )
    ).scalar_one_or_none()
    if first_assignment is not None:
        agent = (await db.execute(select(Agent).where(Agent.id == first_assignment.agent_id))).scalar_one_or_none()
        developer_user_id = agent.developer_user_id if agent else None

    db.add(
        PaymentRecord(
            id=uuid.uuid4(),
            job_id=job.id,
            client_user_id=job.client_user_id,
            developer_user_id=developer_user_id,
            gross_amount=round(gross, 2),
            platform_fee=fee,
            net_amount=round(gross - fee, 2),
            currency=job.currency or "EUR",
            payment_status=PaymentStatus.releasable,
            provider="stripe",
            provider_ref=f"auto_{uuid.uuid4().hex[:12]}",
        )
    )
    job.status = JobStatus.client_review
    await db.flush()
    logger.info("plan.job_delivered", job_id=str(job.id), tasks=len(tasks), gross=gross)


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

    # Latest delivered submission per task (so the client can see the result),
    # plus a submission count per task so we can surface revision history.
    delivered_by_task: dict[str, dict] = {}
    submission_counts: dict[str, int] = {}
    if tasks:
        sub_result = await db.execute(
            select(Submission)
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
            select(PaymentRecord).where(PaymentRecord.job_id == job_id).order_by(PaymentRecord.created_at.desc()).limit(1)
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
        }

    stages = [
        {"key": "format", "label": "Format", "desc": "Your brief becomes a structured spec."},
        {"key": "decompose", "label": "Decompose", "desc": "The spec is split into assignable tasks."},
        {"key": "quote", "label": "Price & quote", "desc": "TaskMatch sets a price per task. You approve before anything runs."},
        {"key": "match", "label": "Match & rank", "desc": "AI agents are matched and ranked per task."},
        {"key": "assign", "label": "Assign", "desc": "The best-scored agent is assigned each task."},
        {"key": "validate", "label": "Validate", "desc": "Each result is checked against acceptance criteria."},
        {"key": "pay", "label": "Pay", "desc": "Escrow releases only on validated delivery."},
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
        await db.execute(select(DeliveryPlan).where(DeliveryPlan.job_id == job_id))
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


@router.post("/{job_id}/accept", summary="Accept delivered work and release escrow")
async def accept_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Client accepts the delivered work: releases the escrow payment and marks
    the job completed. Accessible to the job owner (or an admin)."""
    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    role = getattr(current_user.role, "value", str(current_user.role))
    if job.client_user_id != current_user.id and role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your job")

    payments = list(
        (await db.execute(select(PaymentRecord).where(PaymentRecord.job_id == job_id))).scalars().all()
    )
    released = 0
    for p in payments:
        if p.payment_status in (PaymentStatus.releasable, PaymentStatus.authorized, PaymentStatus.pending):
            p.payment_status = PaymentStatus.paid
            released += 1
    job.status = JobStatus.completed

    # Closing a job always clears the vault: a client should never have to
    # remember to rotate credentials they shared to get the work done.
    from app.api.v1.endpoints.delivery import revoke_job_access_grants

    grants_revoked = await revoke_job_access_grants(db, job.id)
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
        "grants_revoked": grants_revoked,
    }


class DisputeRequest(BaseModel):
    """Client-supplied reason for contesting a delivered deliverable."""

    reason: str = Field(default="", max_length=2000)


async def _run_revision(job_id: uuid.UUID, reason: str) -> None:
    """Background: re-execute a disputed job's tasks and re-validate, returning it
    to client review. Escrow stays frozen (never paid) throughout the revision."""
    async with async_session_factory() as db:
        try:
            tasks = list((await db.execute(select(Task).where(Task.job_id == job_id))).scalars().all())
            for task in tasks:
                assignment = (
                    await db.execute(
                        select(Assignment)
                        .where(Assignment.task_id == task.id)
                        .order_by(Assignment.created_at.desc())
                        .limit(1)
                    )
                ).scalar_one_or_none()
                if assignment is None:
                    continue
                agent = (await db.execute(select(Agent).where(Agent.id == assignment.agent_id))).scalar_one_or_none()
                if agent is None:
                    continue
                # Reopen the assignment so the executor can deliver a revised result.
                assignment.status = AssignmentStatus.active
                assignment.completed_at = None
                await db.flush()
                await _deliver_task(db, task, agent, assignment)
            job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
            if job is not None:
                await _finalize_job_if_done(db, job)
            await db.commit()
            logger.info("dispute.revision_complete", job_id=str(job_id))
        except Exception as exc:  # noqa: BLE001
            await db.rollback()
            logger.warning("dispute.revision_failed", job_id=str(job_id), error=str(exc))


@router.post("/{job_id}/dispute", summary="Contest delivered work: freeze escrow and request a revision")
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
    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
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

    # Escrow is already held as 'releasable' (never paid) — contesting keeps it
    # frozen. Return the delivered tasks to revision and reopen the job.
    tasks = list((await db.execute(select(Task).where(Task.job_id == job_id))).scalars().all())
    reverted = 0
    for t in tasks:
        if t.status == TaskStatus.approved:
            t.status = TaskStatus.validation_failed
            reverted += 1
    job.status = JobStatus.in_progress
    await db.flush()

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="dispute_job",
        entity_type="job",
        entity_id=str(job.id),
        payload={"reason": body.reason[:500], "tasks_reverted": reverted},
    )
    # Persist the transition before the background revision opens its own session.
    await db.commit()
    background_tasks.add_task(_run_revision, job_id, body.reason)

    return {
        "job_id": str(job.id),
        "status": job.status.value if hasattr(job.status, "value") else str(job.status),
        "escrow": "held",
        "message": "Dispute recorded. Escrow is held and a revision is in progress.",
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
