"""Dashboard and analytics endpoints (admin only)."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.middleware.audit import AuditLog, log_audit
from app.models.agent import Agent, AgentCapability, AgentStatus
from app.models.audit import FeedbackNote, MCPDecision
from app.models.job import Job
from app.models.payment import PaymentRecord, PaymentStatus
from app.models.submission import Submission, SubmissionStatus
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.dashboard import AgentMatchResult, DashboardOverview

router = APIRouter()


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

    return [
        {
            "id": str(d.id),
            "decision_type": d.decision_type,
            "related_resource_type": d.related_resource_type,
            "related_resource_id": d.related_resource_id,
            "input_data": d.input_data,
            "output_data": d.output_data,
            "reasoning": d.reasoning,
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
            "actor_type": log.actor_type,
            "actor_id": log.actor_id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "payload": log.payload,
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
        query = query.where(FeedbackNote.note_type == note_type)

    query = query.order_by(FeedbackNote.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    notes = result.scalars().all()

    return [
        {
            "id": str(n.id),
            "created_by_user_id": str(n.created_by_user_id),
            "agent_id": str(n.agent_id) if n.agent_id else None,
            "note_type": n.note_type,
            "content": n.content,
            "metadata_json": n.metadata_json,
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
    content: str = Query(..., description="Note content"),
    note_type: str = Query("general", description="Note type"),
    agent_id: Optional[uuid.UUID] = Query(None, description="Related agent ID"),
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create a new feedback/learning note.  Restricted to administrators."""
    note = FeedbackNote(
        id=uuid.uuid4(),
        created_by_user_id=current_user.id,
        agent_id=agent_id,
        note_type=note_type,
        content=content,
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
        "created_by_user_id": str(note.created_by_user_id),
        "agent_id": str(note.agent_id) if note.agent_id else None,
        "note_type": note.note_type,
        "content": note.content,
        "created_at": note.created_at.isoformat() if note.created_at else None,
    }
