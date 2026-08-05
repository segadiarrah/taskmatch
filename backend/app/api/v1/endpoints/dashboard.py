"""Dashboard and analytics endpoints (admin only)."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.middleware.audit import AuditLog, log_audit
from app.models.agent import Agent, AgentCapability, AgentStatus
from app.models.audit import FeedbackCategory, FeedbackNote, MCPDecision
from app.models.job import Job, JobStatus
from app.models.payment import PaymentRecord, PaymentStatus
from app.models.submission import Submission, SubmissionStatus
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.dashboard import AgentMatchResult, DashboardOverview

router = APIRouter()


class FeedbackNoteBody(BaseModel):
    """Request body for creating a feedback note (frontend sends category/note)."""

    category: Optional[str] = Field(None, description="Feedback category")
    note: Optional[str] = Field(None, description="Note text")
    # Backwards-compatible aliases.
    note_type: Optional[str] = None
    content: Optional[str] = None
    task_id: Optional[uuid.UUID] = None
    agent_id: Optional[uuid.UUID] = None


@router.get(
    "/overview",
    response_model=DashboardOverview,
    summary="Platform KPIs and summary stats",
    dependencies=[Depends(require_role("admin"))],
)
async def dashboard_overview(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> DashboardOverview:
    """Return aggregated platform metrics for the admin dashboard."""
    # Total jobs.
    total_jobs_result = await db.execute(select(func.count()).select_from(Job))
    total_jobs = total_jobs_result.scalar() or 0

    # Jobs by status.
    jobs_by_status_result = await db.execute(
        select(Job.status, func.count()).group_by(Job.status)
    )
    jobs_by_status = {str(row[0]): row[1] for row in jobs_by_status_result.all()}

    # Total tasks.
    total_tasks_result = await db.execute(select(func.count()).select_from(Task))
    total_tasks = total_tasks_result.scalar() or 0

    # Tasks by status.
    tasks_by_status_result = await db.execute(
        select(Task.status, func.count()).group_by(Task.status)
    )
    tasks_by_status = {str(row[0]): row[1] for row in tasks_by_status_result.all()}

    # Active agents.
    active_agents_result = await db.execute(
        select(func.count())
        .select_from(Agent)
        .where(Agent.status == AgentStatus.active)
    )
    active_agents = active_agents_result.scalar() or 0

    # Pending validations (submissions awaiting review).
    pending_validations_result = await db.execute(
        select(func.count())
        .select_from(Submission)
        .where(Submission.status == SubmissionStatus.submitted)
    )
    pending_validations = pending_validations_result.scalar() or 0

    # Failed tasks.
    failed_tasks = tasks_by_status.get(TaskStatus.cancelled.value, 0)

    # Total pending payments.
    pending_payments_result = await db.execute(
        select(func.coalesce(func.sum(PaymentRecord.gross_amount), 0))
        .where(PaymentRecord.payment_status == PaymentStatus.pending)
    )
    total_payments_pending = float(pending_payments_result.scalar() or 0)

    # Total completed payments.
    completed_payments_result = await db.execute(
        select(func.coalesce(func.sum(PaymentRecord.gross_amount), 0))
        .where(PaymentRecord.payment_status == PaymentStatus.paid)
    )
    total_payments_completed = float(completed_payments_result.scalar() or 0)

    # --- Marketplace economics (what investors probe first) ---
    # GMV = all payment volume that has cleared bidding into escrow or settled
    # (i.e. every non-cancelled payment record). Platform revenue = fees on the
    # settled (paid) portion; take rate is revenue over settled GMV.
    settled_states = (PaymentStatus.paid,)
    escrowed_or_settled = (
        PaymentStatus.paid,
        PaymentStatus.releasable,
        PaymentStatus.authorized,
        PaymentStatus.pending,
    )
    gmv = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(PaymentRecord.gross_amount), 0)).where(
                    PaymentRecord.payment_status.in_(escrowed_or_settled)
                )
            )
        ).scalar()
        or 0
    )
    platform_revenue = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(PaymentRecord.platform_fee), 0)).where(
                    PaymentRecord.payment_status.in_(settled_states)
                )
            )
        ).scalar()
        or 0
    )
    take_rate = round((platform_revenue / total_payments_completed) * 100, 1) if total_payments_completed else 0.0

    completed_jobs = jobs_by_status.get(JobStatus.completed.value, 0)

    payment_count = int(
        (await db.execute(select(func.count()).select_from(PaymentRecord))).scalar() or 0
    )
    total_gross_all = float(
        (
            await db.execute(select(func.coalesce(func.sum(PaymentRecord.gross_amount), 0)))
        ).scalar()
        or 0
    )
    avg_job_value = round(total_gross_all / payment_count, 2) if payment_count else 0.0

    # Reporting currency: the most common job currency, defaulting to EUR.
    currency_row = (
        await db.execute(
            select(Job.currency, func.count()).group_by(Job.currency).order_by(func.count().desc()).limit(1)
        )
    ).first()
    currency = (currency_row[0] if currency_row and currency_row[0] else "EUR")

    return DashboardOverview(
        total_jobs=total_jobs,
        jobs_by_status=jobs_by_status,
        total_tasks=total_tasks,
        tasks_by_status=tasks_by_status,
        active_agents=active_agents,
        pending_validations=pending_validations,
        failed_tasks=failed_tasks,
        total_payments_pending=total_payments_pending,
        total_payments_completed=total_payments_completed,
        gmv=round(gmv, 2),
        platform_revenue=round(platform_revenue, 2),
        take_rate=take_rate,
        completed_jobs=completed_jobs,
        avg_job_value=avg_job_value,
        currency=currency,
    )


@router.get(
    "/agent-matching/{task_id}",
    response_model=list[AgentMatchResult],
    summary="Agent match rankings for a task",
    dependencies=[Depends(require_role("admin"))],
)
async def agent_matching(
    task_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> list[AgentMatchResult]:
    """Return a ranked list of agents suitable for a given task.

    Uses a simple scoring algorithm based on capability overlap and historical
    performance.  In production, this would be delegated to the MCP layer.
    """
    # Verify task exists.
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    # Fetch active agents.
    agents_result = await db.execute(
        select(Agent).where(Agent.status == AgentStatus.active)
    )
    agents = agents_result.scalars().all()

    results: list[AgentMatchResult] = []
    for agent in agents:
        # Capability score: check if the agent supports this task type.
        task_types = agent.supported_task_types or []
        capability_score = 1.0 if task.task_type in task_types else 0.0

        # Check capability name overlap.
        cap_names = [c.capability_name for c in (agent.capabilities or [])]
        if task.task_type.lower() in [c.lower() for c in cap_names]:
            capability_score = max(capability_score, 0.8)

        # Historical score based on agent performance.
        historical_score = min(agent.success_rate, 1.0) if agent.success_rate else 0.0

        combined_score = round(0.6 * capability_score + 0.4 * historical_score, 3)

        reasons = []
        if capability_score > 0:
            reasons.append(f"Supports task type '{task.task_type}'")
        if agent.completed_tasks_count > 0:
            reasons.append(
                f"Completed {agent.completed_tasks_count} tasks with "
                f"{agent.success_rate:.0%} success rate"
            )
        if combined_score == 0:
            reasons.append("No matching capabilities or history")

        results.append(
            AgentMatchResult(
                agent_id=agent.id,
                agent_name=agent.name,
                capability_score=capability_score,
                historical_score=historical_score,
                combined_score=combined_score,
                reasons=reasons,
            )
        )

    # Sort by combined score descending.
    results.sort(key=lambda r: r.combined_score, reverse=True)
    return results


@router.get(
    "/mcp-decisions",
    summary="List MCP decisions",
    dependencies=[Depends(require_role("admin"))],
)
async def list_mcp_decisions(
    decision_type: Optional[str] = Query(None, description="Filter by decision type"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Return a paginated list of MCP (AI orchestration) decisions."""
    query = select(MCPDecision)

    if decision_type:
        query = query.where(MCPDecision.decision_type == decision_type)

    query = query.order_by(MCPDecision.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    decisions = result.scalars().all()

    def _summarize(snapshot: object) -> str:
        if not isinstance(snapshot, dict):
            return ""
        parts = []
        for k, v in snapshot.items():
            if isinstance(v, (str, int, float, bool)):
                parts.append(f"{k}={v}")
            elif isinstance(v, list):
                parts.append(f"{k}=[{len(v)} items]")
            if len(parts) >= 4:
                break
        return ", ".join(parts)

    return [
        {
            "id": str(d.id),
            "decision_type": d.decision_type.value if hasattr(d.decision_type, "value") else str(d.decision_type),
            "entity_type": (d.entity_type or "").capitalize(),
            "entity_id": d.entity_id,
            "entity_name": f"{(d.entity_type or 'entity').capitalize()} {str(d.entity_id)[:8]}",
            "input_snapshot": d.input_snapshot_json,
            "input_data_summary": _summarize(d.input_snapshot_json),
            "output_snapshot": d.output_snapshot_json,
            "reasoning": d.reasoning_summary,
            "confidence": d.confidence_score,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in decisions
    ]


@router.get(
    "/audit-logs",
    summary="List audit logs",
    dependencies=[Depends(require_role("admin"))],
)
async def list_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    actor_id: Optional[str] = Query(None, description="Filter by actor ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Return a paginated list of audit log entries with optional filters."""
    query = select(AuditLog)

    if action:
        query = query.where(AuditLog.action == action)
    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
    if actor_id:
        query = query.where(AuditLog.actor_id == actor_id)

    query = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()

    return [
        {
            "id": str(log.id),
            "actor_type": log.actor_type.value if hasattr(log.actor_type, "value") else str(log.actor_type),
            "actor_id": log.actor_id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "payload": log.payload_json,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]


@router.get(
    "/feedback-notes",
    summary="List feedback notes",
    dependencies=[Depends(require_role("admin"))],
)
async def list_feedback_notes(
    agent_id: Optional[uuid.UUID] = Query(None, description="Filter by agent ID"),
    note_type: Optional[str] = Query(None, description="Filter by note type"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Return a paginated list of feedback/learning notes."""
    query = select(FeedbackNote)

    if agent_id:
        query = query.where(FeedbackNote.agent_id == agent_id)
    if note_type:
        query = query.where(FeedbackNote.category == note_type)

    query = query.order_by(FeedbackNote.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    notes = result.scalars().all()

    return [
        {
            "id": str(n.id),
            "created_by_user_id": str(n.created_by_user_id) if n.created_by_user_id else None,
            "author": "Admin" if n.created_by_user_id else "MCP",
            "agent_id": str(n.agent_id) if n.agent_id else None,
            "agent_name": n.agent.name if getattr(n, "agent", None) else None,
            "task_id": str(n.task_id) if n.task_id else None,
            "task_title": None,
            "category": n.category.value if hasattr(n.category, "value") else str(n.category),
            "note": n.note,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notes
    ]


@router.post(
    "/feedback-notes",
    status_code=status.HTTP_201_CREATED,
    summary="Create a feedback note",
    dependencies=[Depends(require_role("admin"))],
)
async def create_feedback_note(
    payload: "FeedbackNoteBody" = Body(...),
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create a new feedback/learning note.  Restricted to administrators."""
    # Accept either "category" or legacy "note_type"; either "note" or "content".
    raw_category = payload.category or payload.note_type or "quality"
    try:
        category = FeedbackCategory(raw_category)
    except ValueError:
        category = FeedbackCategory.quality

    text = payload.note or payload.content or ""

    note = FeedbackNote(
        id=uuid.uuid4(),
        created_by_user_id=current_user.id,
        agent_id=payload.agent_id,
        task_id=payload.task_id,
        category=category,
        note=text,
    )
    db.add(note)
    await db.flush()
    await db.refresh(note)

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="create_feedback_note",
        entity_type="feedback_note",
        entity_id=str(note.id),
    )

    return {
        "id": str(note.id),
        "created_by_user_id": str(note.created_by_user_id) if note.created_by_user_id else None,
        "author": "Admin",
        "agent_id": str(note.agent_id) if note.agent_id else None,
        "agent_name": None,
        "task_id": str(note.task_id) if note.task_id else None,
        "task_title": None,
        "category": note.category.value if hasattr(note.category, "value") else str(note.category),
        "note": note.note,
        "created_at": note.created_at.isoformat() if note.created_at else None,
    }
