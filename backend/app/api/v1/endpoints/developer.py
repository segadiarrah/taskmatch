"""Developer/expert-scoped read endpoints ("my agents / bids / submissions /
assignments"). These power the developer dashboard's task workflow so a human
expert or an AI-agent builder can bid and then deliver work.

All routes are scoped to the current user's own agents.
"""

from __future__ import annotations

import uuid

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.agent import Agent, AgentStatus
from app.models.assignment import Assignment, AssignmentStatus
from app.models.bid import Bid
from app.models.job import Job, JobStatus
from app.models.payment import PaymentRecord, PaymentStatus
from app.models.review import ValidationReview
from app.models.submission import Submission
from app.models.task import Task, TaskStatus
from app.models.user import User

router = APIRouter()


@router.get("/developer/dashboard/stats", summary="My developer dashboard KPIs")
async def dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    my_agents = (
        await db.execute(select(func.count(Agent.id)).where(Agent.developer_user_id == current_user.id))
    ).scalar_one()
    agent_ids = await _my_agent_ids(db, current_user)
    active_assignments = 0
    completed_tasks = 0
    if agent_ids:
        active_assignments = (
            await db.execute(
                select(func.count(Assignment.id)).where(
                    Assignment.agent_id.in_(agent_ids), Assignment.status == AssignmentStatus.active
                )
            )
        ).scalar_one()
        completed_tasks = (
            await db.execute(
                select(func.count(Assignment.id)).where(
                    Assignment.agent_id.in_(agent_ids), Assignment.status == AssignmentStatus.completed
                )
            )
        ).scalar_one()
    earnings = (
        await db.execute(
            select(func.coalesce(func.sum(PaymentRecord.net_amount), 0)).where(
                PaymentRecord.developer_user_id == current_user.id,
                PaymentRecord.payment_status == PaymentStatus.paid,
            )
        )
    ).scalar_one()
    return {
        "my_agents": int(my_agents),
        "active_assignments": int(active_assignments),
        "completed_tasks": int(completed_tasks),
        "total_earnings": float(earnings or 0),
    }


@router.get("/developer/assignments", summary="My assignments (optionally filtered by status)")
async def developer_assignments(
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    agent_ids = await _my_agent_ids(db, current_user)
    if not agent_ids:
        return {"items": []}
    q = select(Assignment).where(Assignment.agent_id.in_(agent_ids))
    if status:
        q = q.where(Assignment.status == status)
    q = q.order_by(Assignment.created_at.desc()).limit(limit)
    rows = list((await db.execute(q)).scalars().all())

    items = []
    for a in rows:
        task = (await db.execute(select(Task).where(Task.id == a.task_id))).scalar_one_or_none()
        job = None
        if task is not None:
            job = (await db.execute(select(Job).where(Job.id == task.job_id))).scalar_one_or_none()
        # A revision after a client dispute adds a submission → count - 1.
        sub_count = (
            await db.execute(select(func.count(Submission.id)).where(Submission.task_id == a.task_id))
        ).scalar_one()
        items.append(
            {
                "id": str(a.id),
                "task_id": str(a.task_id),
                "task_title": task.title if task else "",
                "job_title": job.title if job else "",
                "agent_name": a.agent.name if a.agent else "",
                "status": a.status.value if hasattr(a.status, "value") else str(a.status),
                "revision_count": max(0, int(sub_count) - 1),
                "budget": float(task.budget) if task and task.budget is not None else 0.0,
                "currency": (job.currency if job else None) or "EUR",
                "deadline": task.deadline.isoformat() if task and getattr(task, "deadline", None) else None,
            }
        )
    return {"items": items}


async def _my_agent_ids(db: AsyncSession, user: User) -> list[uuid.UUID]:
    rows = await db.execute(select(Agent.id).where(Agent.developer_user_id == user.id))
    return [r[0] for r in rows.all()]


@router.get("/developer/agents", summary="My agents")
async def my_agents(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    agents = list(
        (await db.execute(select(Agent).where(Agent.developer_user_id == current_user.id).order_by(Agent.name))).scalars().all()
    )
    return {
        "items": [
            {
                "id": str(a.id),
                "name": a.name,
                "slug": a.slug,
                "description": a.description or "",
                "kind": "human" if "/experts/" in (a.endpoint_url or "") else "agent",
                "status": a.status.value if hasattr(a.status, "value") else str(a.status),
                # UI expects a 0-100 percentage.
                "success_rate": round((a.success_rate or 0.0) * 100),
                "average_score": a.average_score,
                "completed_tasks": a.completed_tasks_count or 0,
                "completed_tasks_count": a.completed_tasks_count or 0,
                "capabilities": [c.capability_name for c in (a.capabilities or [])] or (a.supported_task_types or []),
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in agents
        ]
    }


@router.get("/tasks/{task_id}/bids/mine", summary="My bids on a task")
async def my_bids(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    agent_ids = await _my_agent_ids(db, current_user)
    if not agent_ids:
        return {"items": []}
    task = (await db.execute(select(Task).where(Task.id == task_id))).scalar_one_or_none()
    currency = "EUR"
    if task is not None:
        job = (await db.execute(select(Job).where(Job.id == task.job_id))).scalar_one_or_none()
        if job is not None:
            currency = job.currency or "EUR"
    bids = list(
        (
            await db.execute(
                select(Bid).where(Bid.task_id == task_id, Bid.agent_id.in_(agent_ids)).order_by(Bid.created_at.desc())
            )
        ).scalars().all()
    )
    return {
        "items": [
            {
                "id": str(b.id),
                "agent_id": str(b.agent_id),
                "agent_name": b.agent.name if b.agent else "",
                "price": float(b.price),
                "currency": currency,
                "eta_hours": float(b.eta_hours),
                "confidence_score": float(b.confidence_score),
                "proposal": b.proposal_text or "",
                "status": b.status.value if hasattr(b.status, "value") else str(b.status),
                "created_at": b.created_at.isoformat() if b.created_at else None,
            }
            for b in bids
        ]
    }


@router.get("/tasks/{task_id}/assignments/mine", summary="My assignments on a task")
async def my_assignments(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    agent_ids = await _my_agent_ids(db, current_user)
    if not agent_ids:
        return {"items": []}
    rows = list(
        (
            await db.execute(
                select(Assignment).where(Assignment.task_id == task_id, Assignment.agent_id.in_(agent_ids))
            )
        ).scalars().all()
    )
    return {
        "items": [
            {
                "id": str(a.id),
                "agent_id": str(a.agent_id),
                "agent_name": a.agent.name if a.agent else "",
                "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            }
            for a in rows
        ]
    }


@router.get("/tasks/{task_id}/submissions/mine", summary="My submissions on a task")
async def my_submissions(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    agent_ids = await _my_agent_ids(db, current_user)
    if not agent_ids:
        return {"items": []}
    subs = list(
        (
            await db.execute(
                select(Submission)
                .where(Submission.task_id == task_id, Submission.agent_id.in_(agent_ids))
                .order_by(Submission.created_at.desc())
            )
        ).scalars().all()
    )
    items = []
    for s in subs:
        review = (
            await db.execute(
                select(ValidationReview)
                .where(ValidationReview.submission_id == s.id)
                .order_by(ValidationReview.created_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()
        items.append(
            {
                "id": str(s.id),
                "agent_id": str(s.agent_id),
                "agent_name": s.agent.name if s.agent else "",
                "status": s.status.value if hasattr(s.status, "value") else str(s.status),
                "summary": s.summary or "",
                "artifact_urls": s.artifact_urls_json or [],
                "submitted_at": s.submitted_at.isoformat() if s.submitted_at else (s.created_at.isoformat() if s.created_at else None),
                "score": review.score if review is not None else None,
            }
        )
    return {"items": items}


# ---------------------------------------------------------------------------
# Client dashboard KPIs + developer earnings. These back the two main
# post-login landing pages, so they must return real data (never 404 into a
# broken/placeholder dashboard during a demo).
# ---------------------------------------------------------------------------


@router.get("/client/dashboard/stats", summary="My client dashboard KPIs")
async def client_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    my_job_ids = [
        r[0]
        for r in (
            await db.execute(select(Job.id).where(Job.client_user_id == current_user.id))
        ).all()
    ]
    my_jobs = len(my_job_ids)

    active_tasks = 0
    if my_job_ids:
        active_tasks = int(
            (
                await db.execute(
                    select(func.count(Task.id)).where(
                        Task.job_id.in_(my_job_ids),
                        Task.status.in_(
                            [TaskStatus.assigned, TaskStatus.in_progress, TaskStatus.submitted]
                        ),
                    )
                )
            ).scalar_one()
        )

    # Jobs delivered and waiting on this client to review/release escrow.
    pending_reviews = int(
        (
            await db.execute(
                select(func.count(Job.id)).where(
                    Job.client_user_id == current_user.id,
                    Job.status == JobStatus.client_review,
                )
            )
        ).scalar_one()
    )

    total_spent = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(PaymentRecord.gross_amount), 0)).where(
                    PaymentRecord.client_user_id == current_user.id,
                    PaymentRecord.payment_status == PaymentStatus.paid,
                )
            )
        ).scalar()
        or 0
    )

    return {
        "my_jobs": my_jobs,
        "active_tasks": active_tasks,
        "pending_reviews": pending_reviews,
        "total_spent": round(total_spent, 2),
    }


@router.get("/developer/earnings/summary", summary="My earnings summary")
async def developer_earnings_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    total_earned = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(PaymentRecord.net_amount), 0)).where(
                    PaymentRecord.developer_user_id == current_user.id,
                    PaymentRecord.payment_status == PaymentStatus.paid,
                )
            )
        ).scalar()
        or 0
    )
    pending_payments = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(PaymentRecord.net_amount), 0)).where(
                    PaymentRecord.developer_user_id == current_user.id,
                    PaymentRecord.payment_status.in_(
                        [PaymentStatus.releasable, PaymentStatus.authorized, PaymentStatus.pending]
                    ),
                )
            )
        ).scalar()
        or 0
    )
    month_start = datetime.now(timezone.utc).replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )
    this_month = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(PaymentRecord.net_amount), 0)).where(
                    PaymentRecord.developer_user_id == current_user.id,
                    PaymentRecord.payment_status == PaymentStatus.paid,
                    PaymentRecord.created_at >= month_start,
                )
            )
        ).scalar()
        or 0
    )
    return {
        "total_earned": round(total_earned, 2),
        "pending_payments": round(pending_payments, 2),
        "this_month": round(this_month, 2),
        "currency": "EUR",
    }


@router.get("/developer/earnings/payments", summary="My payment records")
async def developer_earnings_payments(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    rows = list(
        (
            await db.execute(
                select(PaymentRecord)
                .where(PaymentRecord.developer_user_id == current_user.id)
                .order_by(PaymentRecord.created_at.desc())
                .limit(limit)
            )
        ).scalars().all()
    )
    # Resolve a representative task/agent per payment via its job's first task.
    items = []
    for p in rows:
        task = (
            await db.execute(
                select(Task).where(Task.job_id == p.job_id).order_by(Task.priority).limit(1)
            )
        ).scalar_one_or_none()
        agent_name = ""
        if task is not None:
            assignment = (
                await db.execute(
                    select(Assignment).where(Assignment.task_id == task.id).limit(1)
                )
            ).scalar_one_or_none()
            if assignment is not None and assignment.agent is not None:
                agent_name = assignment.agent.name
        items.append(
            {
                "id": str(p.id),
                "task_id": str(task.id) if task else "",
                "task_title": task.title if task else "",
                "agent_name": agent_name,
                "gross_amount": float(p.gross_amount),
                "platform_fee": float(p.platform_fee),
                "net_amount": float(p.net_amount),
                "currency": p.currency or "EUR",
                "status": p.payment_status.value if hasattr(p.payment_status, "value") else str(p.payment_status),
                "created_at": p.created_at.isoformat() if p.created_at else "",
            }
        )
    return {"items": items}
