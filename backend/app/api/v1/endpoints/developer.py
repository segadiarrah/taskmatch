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
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import lazyload, selectinload

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.agent import Agent
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
    db: AsyncSession = Depends(get_db, scope="function"),
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
    earnings = await developer_earnings_summary(current_user=current_user, db=db)
    return {
        "my_agents": int(my_agents),
        "active_assignments": int(active_assignments),
        "completed_tasks": int(completed_tasks),
        "total_earnings": earnings["total_earned"],
        "earnings_by_currency": [{"currency": row["currency"], "amount": row["total_earned"]}
                                 for row in earnings["by_currency"]],
    }


@router.get("/developer/assignments", summary="My assignments (optionally filtered by status)")
async def developer_assignments(
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db, scope="function"),
) -> dict:
    agent_ids = await _my_agent_ids(db, current_user)
    if not agent_ids:
        return {"items": []}
    q = select(Assignment).options(lazyload("*"), selectinload(Assignment.agent)).where(Assignment.agent_id.in_(agent_ids))
    if status:
        q = q.where(Assignment.status == status)
    q = q.order_by(Assignment.created_at.desc()).limit(limit)
    rows = list((await db.execute(q)).scalars().all())

    items = []
    for a in rows:
        task = (await db.execute(select(Task).options(lazyload("*")).where(Task.id == a.task_id))).scalar_one_or_none()
        job = None
        if task is not None:
            job = (await db.execute(select(Job).options(lazyload("*")).where(Job.id == task.job_id))).scalar_one_or_none()
        # A revision after a client dispute adds a submission → count - 1.
        sub_count = (
            await db.execute(select(func.count(Submission.id)).where(Submission.task_id == a.task_id))
        ).scalar_one()
        items.append(
            {
                "id": str(a.id),
                "task_id": str(a.task_id),
                "agent_id": str(a.agent_id),
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
    db: AsyncSession = Depends(get_db, scope="function"),
) -> dict:
    agents = list(
        (await db.execute(select(Agent).options(lazyload("*"), selectinload(Agent.capabilities)).where(Agent.developer_user_id == current_user.id).order_by(Agent.name))).scalars().all()
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
    db: AsyncSession = Depends(get_db, scope="function"),
) -> dict:
    agent_ids = await _my_agent_ids(db, current_user)
    if not agent_ids:
        return {"items": []}
    task = (await db.execute(select(Task).options(lazyload("*")).where(Task.id == task_id))).scalar_one_or_none()
    currency = "EUR"
    if task is not None:
        job = (await db.execute(select(Job).options(lazyload("*")).where(Job.id == task.job_id))).scalar_one_or_none()
        if job is not None:
            currency = job.currency or "EUR"
    bids = list(
        (
            await db.execute(
                select(Bid).options(lazyload("*"), selectinload(Bid.agent)).where(Bid.task_id == task_id, Bid.agent_id.in_(agent_ids)).order_by(Bid.created_at.desc())
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
    db: AsyncSession = Depends(get_db, scope="function"),
) -> dict:
    agent_ids = await _my_agent_ids(db, current_user)
    if not agent_ids:
        return {"items": []}
    rows = list(
        (
            await db.execute(
                select(Assignment).options(lazyload("*"), selectinload(Assignment.agent)).where(Assignment.task_id == task_id, Assignment.agent_id.in_(agent_ids))
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
    db: AsyncSession = Depends(get_db, scope="function"),
) -> dict:
    agent_ids = await _my_agent_ids(db, current_user)
    if not agent_ids:
        return {"items": []}
    subs = list(
        (
            await db.execute(
                select(Submission).options(lazyload("*"), selectinload(Submission.agent))
                .where(Submission.task_id == task_id, Submission.agent_id.in_(agent_ids))
                .order_by(Submission.created_at.desc())
            )
        ).scalars().all()
    )
    items = []
    for s in subs:
        review = (
            await db.execute(
                select(ValidationReview).options(lazyload("*"))
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
    db: AsyncSession = Depends(get_db, scope="function"),
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
    db: AsyncSession = Depends(get_db, scope="function"),
) -> dict:
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    paid = PaymentRecord.payment_status == PaymentStatus.paid
    pending = PaymentRecord.payment_status.in_([
        PaymentStatus.pending, PaymentStatus.authorized, PaymentStatus.releasable,
        PaymentStatus.processing, PaymentStatus.blocked, PaymentStatus.failed,
    ])
    rows = (await db.execute(
        select(
            PaymentRecord.currency,
            func.sum(case((paid, PaymentRecord.net_amount), else_=0)),
            func.sum(case((pending, PaymentRecord.net_amount), else_=0)),
            func.sum(case((paid & (PaymentRecord.updated_at >= month_start), PaymentRecord.net_amount), else_=0)),
        ).where(PaymentRecord.developer_user_id == current_user.id, PaymentRecord.provider != "platform")
        .group_by(PaymentRecord.currency).order_by(PaymentRecord.currency)
    )).all()
    by_currency = [
        {"currency": currency, "total_earned": float(earned or 0),
         "pending_payments": float(waiting or 0), "this_month": float(month or 0)}
        for currency, earned, waiting, month in rows
    ]
    single = by_currency[0] if len(by_currency) == 1 else None
    return {
        "by_currency": by_currency,
        "currency": single["currency"] if single else None,
        "total_earned": single["total_earned"] if single else (0 if not rows else None),
        "pending_payments": single["pending_payments"] if single else (0 if not rows else None),
        "this_month": single["this_month"] if single else (0 if not rows else None),
    }


@router.get("/developer/earnings/payments", summary="My payment records")
async def developer_earnings_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db, scope="function"),
) -> dict:
    scope = (PaymentRecord.developer_user_id == current_user.id) & (PaymentRecord.provider != "platform")
    total = await db.scalar(select(func.count(PaymentRecord.id)).where(scope))
    rows = (await db.execute(
        select(PaymentRecord, Task.title, Job.title).options(lazyload("*"))
        .join(Job, Job.id == PaymentRecord.job_id)
        .outerjoin(Task, Task.id == PaymentRecord.task_id).where(scope)
        .order_by(PaymentRecord.created_at.desc(), PaymentRecord.id.desc()).offset(skip).limit(limit)
    )).all()
    task_ids = [payment.task_id for payment, _, _ in rows if payment.task_id]
    names = {}
    if task_ids:
        assignments = (await db.execute(
            select(Assignment.task_id, Agent.name).join(Agent, Agent.id == Assignment.agent_id)
            .where(Assignment.task_id.in_(task_ids), Agent.developer_user_id == current_user.id)
            .order_by(Assignment.created_at.desc())
        )).all()
        for task_id, agent_name in assignments:
            names.setdefault(task_id, agent_name)
    return {
        "items": [
            {
                "id": str(payment.id),
                "task_id": str(payment.task_id) if payment.task_id else "",
                "task_title": task_title or job_title,
                "agent_name": names.get(payment.task_id, ""),
                "gross_amount": float(payment.gross_amount),
                "platform_fee": float(payment.platform_fee),
                "net_amount": float(payment.net_amount),
                "currency": payment.currency,
                "status": str(payment.payment_status),
                "payment_status": str(payment.payment_status),
                "provider": payment.provider,
                "funding_id": str(payment.funding_id) if payment.funding_id else None,
                "transfer_id": payment.transfer_id,
                "payout_error": payment.payout_error,
                "created_at": payment.created_at.isoformat(),
            }
            for payment, task_title, job_title in rows
        ],
        "total": total or 0, "skip": skip, "limit": limit,
    }
