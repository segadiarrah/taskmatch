"""A private feed projected from existing account, marketplace and delivery records."""
from datetime import UTC, datetime
from typing import Literal, get_args

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import lazyload

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models import Agent, AgentCapability, Assignment, Bid, Job, PaymentRecord, Submission, Task, ValidationReview
from app.models.activity import ActivityPreferences
from app.models.audit import AuditLog
from app.models.human import Delegation, Principal, WorkerProfile
from app.models.protocol import WebhookDelivery, WebhookSubscription
from app.services.human_workers import eligibility
from app.services.task_access import task_visibility

router = APIRouter()
Category = Literal["signup", "profile", "mission", "agent_task", "application", "assignment",
                   "delivery", "validation", "payment", "connection"]


class Preferences(BaseModel):
    model_config = ConfigDict(extra="forbid")
    muted: set[Category]


@router.put("/preferences")
async def preferences(body: Preferences, user=Depends(get_current_active_user), db=Depends(get_db, scope="function")):
    values = sorted(body.muted)
    await db.execute(insert(ActivityPreferences).values(user_id=user.id, muted=values).on_conflict_do_update(
        index_elements=[ActivityPreferences.user_id], set_={"muted": values}))
    return {"muted": values}


@router.get("")
async def account_activity(response: Response, user=Depends(get_current_active_user), db=Depends(get_db, scope="function")):
    response.headers["Cache-Control"] = "private, no-store"
    saved = await db.get(ActivityPreferences, user.id)
    muted = set(saved.muted) if saved else set()
    intent = (user.registration_attribution or {}).get("intent")
    track = intent or ("executor" if user.role == "agent_developer" else "project")
    worker = await db.get(WorkerProfile, user.id)
    ai = (await db.scalars(select(Agent).options(lazyload("*")).where(Agent.developer_user_id == user.id,
          ~Agent.endpoint_url.contains("/experts/"), ~Agent.slug.startswith("llm-")).order_by(Agent.created_at.desc()).limit(30))).all()
    agent_ids = select(Agent.id).where(Agent.developer_user_id == user.id)
    ai_ids = [a.id for a in ai]
    owner_projects = select(Job.id).where(Job.client_user_id == user.id)
    principals = select(Principal.id).where(Principal.owner_user_id == user.id)
    mandates = select(Delegation.id).where(Delegation.principal_id.in_(principals),
            Delegation.revoked_at.is_(None), Delegation.expires_at > func.now(), Delegation.max_amount_minor > 0)
    async def exists(query):
        return bool(await db.scalar(select(query.exists())))
    job_events = select(AuditLog.id).where(AuditLog.actor_id == str(user.id), AuditLog.entity_type == "job")
    steps = {
        "brief": await exists(job_events.where(AuditLog.action == "create_job")),
        "project": await exists(job_events.where(AuditLog.action == "submit_job")),
        "profile": bool(worker and worker.data_consent), "skills": bool(worker and worker.profile.get("skills")),
        "preferences": bool(worker and worker.profile.get("languages")),
        "agent": bool(ai), "connect": any(a.connection_verified_at for a in ai),
        "capabilities": await exists(select(AgentCapability.id).where(AgentCapability.agent_id.in_(ai_ids))),
        "identity": await exists(principals), "mandate": await exists(mandates),
        "budget": await exists(mandates), "inbox_preferences": bool(saved),
    }
    events = []
    def add(category, key, when, href, title="", state=""):
        if category not in muted:
            events.append({"category": category, "id": f"{category}-{key}", "at": when,
                           "href": href, "title": title or "", "state": state or ""})
    if user.registration_attribution is not None:
        add("signup", user.id, user.created_at, "/activity")
    if track == "work" and (not steps["profile"] or not steps["skills"] or not steps["preferences"]):
        add("profile", user.id, worker.updated_at if worker else user.created_at, "/human-tasks?view=work")

    task_link = "/developer/tasks" if user.role == "agent_developer" else "/human-tasks?view=work"
    for category, model, status in [("application", Bid, Bid.status), ("assignment", Assignment, Assignment.status),
                                   ("delivery", Submission, Submission.status), ("validation", ValidationReview, ValidationReview.decision)]:
        if category in muted:
            continue
        query = select(model.id, model.updated_at, status, Task.title, Job.id, Job.client_user_id).select_from(model).join(
            Task, Task.id == model.task_id).join(Job, Job.id == Task.job_id)
        if model is ValidationReview:
            query = query.join(Submission, Submission.id == model.submission_id)
            executor = Submission.agent_id
        else:
            executor = model.agent_id
        query = query.where(or_(Job.client_user_id == user.id, executor.in_(agent_ids)))
        if model is Bid:
            query = query.where(Bid.status.in_(("rejected", "shortlisted", "selected")))
        for key, when, state, title, job, client in await db.execute(query.order_by(model.updated_at.desc()).limit(8)):
            href = f"/client/jobs/{job}" if client == user.id and user.role == "client" else task_link
            add(category, key, when, href, title, state)

    if "payment" not in muted:
        rows = await db.execute(select(PaymentRecord.id, PaymentRecord.updated_at, PaymentRecord.payment_status,
            Job.title, Job.id, Job.client_user_id).join(Job, Job.id == PaymentRecord.job_id).where(or_(
                PaymentRecord.client_user_id == user.id, PaymentRecord.developer_user_id == user.id)).order_by(PaymentRecord.updated_at.desc()).limit(8))
        for key, when, state, title, job, client in rows:
            href = f"/client/jobs/{job}" if client == user.id and user.role == "client" else (
                "/developer/earnings" if user.role == "agent_developer" else "/human-tasks?view=work")
            add("payment", key, when, href, title, state)
    if "connection" not in muted:
        for key, when in await db.execute(select(WebhookDelivery.id, WebhookDelivery.updated_at)
                .join(WebhookSubscription).where(WebhookSubscription.owner_user_id == user.id, WebhookDelivery.status == "failed")
                .order_by(WebhookDelivery.updated_at.desc()).limit(8)):
            add("connection", key, when, "/human-tasks?view=agents")
        for agent in ai:
            if agent.connection_challenge_until and agent.connection_challenge_until < datetime.now(UTC) and not agent.connection_verified_at:
                add("connection", agent.id, agent.connection_challenge_until, f"/developer/agents/{agent.id}", agent.name, "expired")
    opportunities = select(Task).options(lazyload("*")).where(Task.status == "open_for_bids",
            task_visibility(user), Task.job_id.not_in(owner_projects)).order_by(Task.created_at.desc()).limit(24)
    if worker and settings.HUMAN_TASKS_ENABLED and "mission" not in muted and not await eligibility(db, user.id):
        for task in await db.scalars(opportunities.where(Task.human_policy_status == "approved")):
            contract = task.human_contract_json or {}
            if contract.get("deadline") and datetime.fromisoformat(contract["deadline"]) > datetime.now(UTC) and not await eligibility(db, user.id, task):
                add("mission", task.id, task.created_at, "/human-tasks?view=work", task.title)
    types = {kind for agent in ai if agent.status == "active" and isinstance(agent.supported_task_types, list)
             for kind in agent.supported_task_types if isinstance(kind, str)}
    if types and "agent_task" not in muted:
        for task in await db.scalars(opportunities.where(Task.task_type.in_(types), Task.human_contract_json.is_(None))):
            add("agent_task", task.id, task.created_at, "/developer/tasks", task.title)
    events.sort(key=lambda item: (item["at"], item["id"]), reverse=True)
    return {"track": track, "categories": get_args(Category), "steps": steps, "agent_id": ai[0].id if ai else None, "muted": sorted(muted), "events": events[:32]}
