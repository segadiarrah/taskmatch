"""Principal-controlled payment consent and bounded delegated funding."""

import uuid
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.services import autonomous_funding, payment_authorization
from app.services.human_authorization import caller, enabled

router = APIRouter(dependencies=[Depends(enabled)])


class SetupConsent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    allow_agent_payments: Literal[True]


@router.get("/principals/{principal_id}/payment-method")
async def payment_status(
    principal_id: uuid.UUID, user=Depends(get_current_active_user), db=Depends(get_db, scope="function")
):
    return await payment_authorization.status(db, principal_id, user)


@router.post("/principals/{principal_id}/payment-method/setup")
async def setup(
    principal_id: uuid.UUID,
    body: SetupConsent,
    user=Depends(get_current_active_user),
    db=Depends(get_db, scope="function"),
):
    return await payment_authorization.setup(db, principal_id, user)


@router.post("/principals/{principal_id}/payment-method/confirm")
async def confirm(
    principal_id: uuid.UUID, user=Depends(get_current_active_user), db=Depends(get_db, scope="function")
):
    return await payment_authorization.confirm(db, principal_id, user)


@router.delete("/principals/{principal_id}/payment-method")
async def revoke(
    principal_id: uuid.UUID, user=Depends(get_current_active_user), db=Depends(get_db, scope="function")
):
    return await payment_authorization.revoke(db, principal_id, user)


@router.post("/human-tasks/{task_id}/fund", status_code=202)
async def fund_task(task_id: uuid.UUID, identity=Depends(caller), db=Depends(get_db, scope="function")):
    user, delegation = identity
    return await autonomous_funding.request_funding(db, task_id, user, delegation)


class Recovery(BaseModel):
    model_config = ConfigDict(extra="forbid")
    payment_intent_id: str | None = Field(
        default=None, pattern=r"^pi_[A-Za-z0-9]+$", max_length=255
    )


@router.get("/human-tasks/{task_id}/fund")
async def funding_status(task_id: uuid.UUID, identity=Depends(caller), db=Depends(get_db, scope="function")):
    return await autonomous_funding.funding_status(db, task_id, identity)


@router.post("/human-tasks/{task_id}/fund/recover")
async def recover(
    task_id: uuid.UUID, body: Recovery, user=Depends(get_current_active_user), db=Depends(get_db, scope="function")
):
    return await autonomous_funding.recover_payment(db, task_id, user, body.payment_intent_id)
