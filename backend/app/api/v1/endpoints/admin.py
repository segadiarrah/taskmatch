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
