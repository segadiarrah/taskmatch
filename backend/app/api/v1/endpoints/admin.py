"""Admin endpoints: manage the market-LLM providers that compete as agents."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.middleware.audit import log_audit
from app.models.agent import Agent, AgentStatus
from app.models.assignment import Assignment, AssignmentStatus
from app.models.bid import Bid
from app.models.job import Job
from app.models.review import ValidationReview
from app.models.submission import Submission, SubmissionStatus
from app.models.task import Task
from app.models.user import User
from app.services import providers

router = APIRouter()


@router.get("/agents", summary="All executors (AI agents + human experts) for the admin marketplace view")
async def admin_list_agents(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Return every executor with the developer name, live workload and derived
    kind. Powers the admin agents grid, which contrasts AI agents against human
    experts competing on the same explainable score.
    """
    agents = list(
        (await db.execute(select(Agent).order_by(Agent.created_at.desc()))).scalars().all()
    )

    # Batch the owner names and active-assignment counts to avoid N+1 queries.
    owner_ids = {a.developer_user_id for a in agents}
    owners: dict = {}
    if owner_ids:
        rows = (await db.execute(select(User).where(User.id.in_(owner_ids)))).scalars().all()
        owners = {u.id: u for u in rows}

    active_counts: dict = {}
    if agents:
        rows = (
            await db.execute(
                select(Assignment.agent_id, func.count(Assignment.id))
                .where(
                    Assignment.agent_id.in_([a.id for a in agents]),
                    Assignment.status == AssignmentStatus.active,
                )
                .group_by(Assignment.agent_id)
            )
        ).all()
        active_counts = {aid: cnt for aid, cnt in rows}

    items = []
    for a in agents:
        owner = owners.get(a.developer_user_id)
        items.append(
            {
                "id": str(a.id),
                "name": a.name,
                "developer_name": (owner.full_name if owner else None) or (owner.email if owner else "—"),
                "kind": "human" if "/experts/" in (a.endpoint_url or "") else "agent",
                "status": a.status.value if hasattr(a.status, "value") else str(a.status),
                "capabilities": [c.capability_name for c in (a.capabilities or [])] or (a.supported_task_types or []),
                # 0-1 fraction (UI multiplies by 100); avg_score is a 0-5 rating.
                "success_rate": a.success_rate or 0.0,
                "avg_score": a.average_score or 0.0,
                "completed_tasks": a.completed_tasks_count or 0,
                "active_tasks": int(active_counts.get(a.id, 0)),
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
        )
    return items


class ProviderUpdate(BaseModel):
    api_key: str | None = Field(None, description="Provider API key (write-only; never returned)")
    enabled: bool | None = None
    selected_model: str | None = None
    base_url: str | None = None


async def _sync_platform_agent(db: AsyncSession, provider: str, enabled: bool) -> None:
    """Activate/pause the platform agent backing a provider (slug llm-<provider>)."""
    slug = f"llm-{provider}"
    agent = (await db.execute(select(Agent).where(Agent.slug == slug))).scalar_one_or_none()
    if agent is not None:
        agent.status = AgentStatus.active if enabled else AgentStatus.paused
        await db.flush()


@router.get("/providers", summary="List market-LLM providers and their status")
async def list_providers(
    current_user: User = Depends(require_role("admin")),
) -> dict:
    return {"providers": providers.list_providers()}


@router.put("/providers/{provider}", summary="Configure a market-LLM provider (key, enable, model)")
async def update_provider(
    provider: str,
    payload: ProviderUpdate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    updated = providers.update_provider(
        provider,
        api_key=payload.api_key,
        enabled=payload.enabled,
        selected_model=payload.selected_model,
        base_url=payload.base_url,
    )
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown provider")

    # A provider only competes when it is enabled AND has a key.
    competing = bool(updated["enabled"]) and bool(updated["api_key"])
    await _sync_platform_agent(db, provider, competing)

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="configure_provider",
        entity_type="provider",
        entity_id=provider,
        payload={"enabled": updated["enabled"], "key_set": bool(updated["api_key"]), "competing": competing},
    )

    # Return the masked/public view.
    public = next((p for p in providers.list_providers() if p["provider"] == provider), None)
    return {"provider": public, "competing": competing}


# ---------------------------------------------------------------------------
# Admin marketplace views: jobs, tasks, validations — real data in the exact
# shapes the admin UI expects (mirrors the /admin/agents pattern), so those
# pages never fall back to placeholder rows in front of a reviewer.
# ---------------------------------------------------------------------------


async def _user_names(db: AsyncSession, user_ids: set) -> dict:
    if not user_ids:
        return {}
    rows = (await db.execute(select(User).where(User.id.in_(user_ids)))).scalars().all()
    return {u.id: (u.full_name or u.email) for u in rows}


@router.get("/jobs", summary="All jobs for the admin jobs view")
async def admin_list_jobs(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    jobs = list((await db.execute(select(Job).order_by(Job.created_at.desc()))).scalars().all())
    names = await _user_names(db, {j.client_user_id for j in jobs})
    task_counts = {}
    if jobs:
        rows = (
            await db.execute(
                select(Task.job_id, func.count(Task.id)).where(
                    Task.job_id.in_([j.id for j in jobs])
                ).group_by(Task.job_id)
            )
        ).all()
        task_counts = {jid: cnt for jid, cnt in rows}
    return [
        {
            "id": str(j.id),
            "title": j.title,
            "client_name": names.get(j.client_user_id, "—"),
            "status": j.status.value if hasattr(j.status, "value") else str(j.status),
            "budget_min": float(j.budget_min) if j.budget_min is not None else 0,
            "budget_max": float(j.budget_max) if j.budget_max is not None else 0,
            "deadline": j.deadline.isoformat() if getattr(j, "deadline", None) else "",
            "created_at": j.created_at.isoformat() if j.created_at else "",
            "task_count": int(task_counts.get(j.id, 0)),
        }
        for j in jobs
    ]


@router.get("/tasks", summary="All tasks for the admin tasks view")
async def admin_list_tasks(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    tasks = list((await db.execute(select(Task).order_by(Task.created_at.desc()))).scalars().all())
    job_titles: dict = {}
    bid_counts: dict = {}
    assigned: dict = {}
    if tasks:
        jrows = (
            await db.execute(select(Job.id, Job.title).where(Job.id.in_([t.job_id for t in tasks])))
        ).all()
        job_titles = {jid: title for jid, title in jrows}
        brows = (
            await db.execute(
                select(Bid.task_id, func.count(Bid.id)).where(
                    Bid.task_id.in_([t.id for t in tasks])
                ).group_by(Bid.task_id)
            )
        ).all()
        bid_counts = {tid: cnt for tid, cnt in brows}
        arows = list(
            (
                await db.execute(
                    select(Assignment).where(Assignment.task_id.in_([t.id for t in tasks]))
                )
            ).scalars().all()
        )
        for a in arows:
            assigned[a.task_id] = a.agent.name if a.agent else None
    return [
        {
            "id": str(t.id),
            "title": t.title,
            "job_id": str(t.job_id),
            "job_title": job_titles.get(t.job_id, ""),
            "task_type": t.task_type,
            "status": t.status.value if hasattr(t.status, "value") else str(t.status),
            "budget": float(t.budget) if t.budget is not None else 0,
            "priority": t.priority,
            "assigned_agent_name": assigned.get(t.id),
            "bids_count": int(bid_counts.get(t.id, 0)),
        }
        for t in tasks
    ]


@router.get("/submissions", summary="Submissions for the admin validations view")
async def admin_list_submissions(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    subs = list(
        (await db.execute(select(Submission).order_by(Submission.created_at.desc()))).scalars().all()
    )
    # Resolve task titles, job titles, agent + developer names, latest review.
    task_ids = {s.task_id for s in subs}
    agent_ids = {s.agent_id for s in subs}
    tasks = {t.id: t for t in (await db.execute(select(Task).where(Task.id.in_(task_ids)))).scalars().all()} if task_ids else {}
    job_ids = {t.job_id for t in tasks.values()}
    job_titles = dict(
        (await db.execute(select(Job.id, Job.title).where(Job.id.in_(job_ids)))).all()
    ) if job_ids else {}
    agents = {a.id: a for a in (await db.execute(select(Agent).where(Agent.id.in_(agent_ids)))).scalars().all()} if agent_ids else {}
    dev_names = await _user_names(db, {a.developer_user_id for a in agents.values()})

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
        task = tasks.get(s.task_id)
        agent = agents.get(s.agent_id)
        arts = s.artifact_urls_json or []
        items.append(
            {
                "id": str(s.id),
                "task_id": str(s.task_id),
                "task_title": task.title if task else "",
                "job_title": job_titles.get(task.job_id, "") if task else "",
                "agent_id": str(s.agent_id),
                "agent_name": agent.name if agent else "",
                "developer_name": dev_names.get(agent.developer_user_id, "") if agent else "",
                "summary": s.summary or "",
                "deliverable_url": (arts[0] if isinstance(arts, list) and arts else None),
                "submitted_at": s.submitted_at.isoformat() if s.submitted_at else (s.created_at.isoformat() if s.created_at else ""),
                "status": s.status.value if hasattr(s.status, "value") else str(s.status),
                "review_result": (review.decision.value if review and hasattr(review.decision, "value") else None),
                "review_notes": (review.notes if review else None),
                "reviewed_at": (review.created_at.isoformat() if review and review.created_at else None),
                "reviewer": (review.reviewer_type.value if review and hasattr(review.reviewer_type, "value") else None),
                "mcp_auto_validation": None,
            }
        )
    return items
