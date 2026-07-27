"""Admin endpoints: manage the market-LLM providers that compete as agents."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.middleware.audit import log_audit
from app.models.agent import Agent, AgentStatus
from app.models.user import User
from app.services import providers

router = APIRouter()


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
