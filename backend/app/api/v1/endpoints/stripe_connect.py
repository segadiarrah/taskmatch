"""Authenticated developer endpoints for Stripe-hosted Connect onboarding."""

from __future__ import annotations

from collections.abc import Awaitable
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role, get_current_active_user
from app.middleware.audit import log_audit
from app.models.user import User
from app.services import stripe_connect
from app.services.stripe_gateway import StripeGatewayError

router = APIRouter()
async def payment_user(user=Depends(get_current_active_user), db=Depends(get_db)):
    from app.models.human import WorkerProfile
    if user.role != 'agent_developer' and await db.get(WorkerProfile, user.id) is None:
        from fastapi import HTTPException
        raise HTTPException(403, 'Create a worker profile before configuring payments')
    return user


Developer = Annotated[User, Depends(payment_user)]
Administrator = Annotated[User, Depends(require_role("admin"))]
Database = Annotated[AsyncSession, Depends(get_db)]


class ConnectStatus(BaseModel):
    account_id: str | None
    country: str | None
    details_submitted: bool
    transfers_enabled: bool
    payouts_enabled: bool
    requirements: list[str]
    enabled: bool
    mode: str


class OnboardingRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    country: str | None = Field(default=None, pattern=r"^[A-Za-z]{2}$")


class RedirectResponse(BaseModel):
    url: str


class ReconcileRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    account_id: str = Field(pattern=r"^acct_[A-Za-z0-9]+$", max_length=255)


async def _respond(operation: Awaitable[dict[str, Any]]) -> dict[str, Any]:
    try:
        return await operation
    except stripe_connect.StripeConnectError as exc:
        raise HTTPException(exc.status_code, str(exc)) from None
    except StripeGatewayError as exc:
        raise HTTPException(
            503 if exc.status_code == 503 and not exc.retryable else 502, str(exc)
        ) from None


@router.get("/connect", response_model=ConnectStatus)
async def get_connect_status(
    user: Developer,
    db: Database,
) -> dict[str, Any]:
    return await _respond(stripe_connect.get_status(db, user.id))


@router.post("/connect/onboarding", response_model=RedirectResponse)
async def create_onboarding_link(
    body: OnboardingRequest,
    user: Developer,
    db: Database,
) -> dict[str, Any]:
    return await _respond(stripe_connect.onboarding(db, user.id, body.country))


@router.post("/connect/sync", response_model=ConnectStatus)
async def sync_connect_account(
    user: Developer,
    db: Database,
) -> dict[str, Any]:
    return await _respond(stripe_connect.sync_account(db, user.id))


@router.post("/connect/dashboard", response_model=RedirectResponse)
async def create_dashboard_link(
    user: Developer,
    db: Database,
) -> dict[str, Any]:
    return await _respond(stripe_connect.dashboard(db, user.id))


@router.post("/connect/{user_id}/reconcile", response_model=ConnectStatus)
async def reconcile_connect_account(
    user_id: UUID,
    body: ReconcileRequest,
    user: Administrator,
    db: Database,
) -> dict[str, Any]:
    result = await _respond(stripe_connect.reconcile_account(db, user_id, body.account_id))
    await log_audit(
        db,
        actor_type="user",
        actor_id=str(user.id),
        action="stripe.connect.reconcile",
        entity_type="stripe_connect_account",
        entity_id=str(user_id),
        payload={"account_id": body.account_id},
    )
    return result
