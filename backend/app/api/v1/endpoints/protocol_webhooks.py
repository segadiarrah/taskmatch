"""Only a principal owner with a full session may opt in to signed webhooks."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.protocol import WebhookDelivery, WebhookSubscription
from app.models.user import User
from app.services import protocol_webhooks as service
from app.services.human_authorization import enabled, owned_principal

router = APIRouter(dependencies=[Depends(enabled)])


class WebhookCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    url: str = Field(min_length=1, max_length=2048)
    delegation_id: uuid.UUID | None = None


@router.post('/principals/{principal_id}/webhooks', status_code=201)
async def create_webhook(principal_id: uuid.UUID, body: WebhookCreate,
                         user: Annotated[User, Depends(get_current_active_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    principal = await owned_principal(db, principal_id, user, lock=True)
    return await service.create_subscription(db, principal, user, body.url, body.delegation_id)


@router.get('/principals/{principal_id}/webhooks')
async def list_webhooks(principal_id: uuid.UUID, user: Annotated[User, Depends(get_current_active_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    await owned_principal(db, principal_id, user)
    rows = (await db.scalars(select(WebhookSubscription).where(WebhookSubscription.principal_id == principal_id)
                            .order_by(WebhookSubscription.created_at, WebhookSubscription.id))).all()
    return [service.subscription_view(row) for row in rows]


@router.delete('/principals/{principal_id}/webhooks/{subscription_id}')
async def delete_webhook(principal_id: uuid.UUID, subscription_id: uuid.UUID,
                         user: Annotated[User, Depends(get_current_active_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    await owned_principal(db, principal_id, user, lock=True)
    subscription = await db.scalar(select(WebhookSubscription).where(
        WebhookSubscription.id == subscription_id, WebhookSubscription.principal_id == principal_id).with_for_update())
    if not subscription:
        raise HTTPException(404, 'Webhook not found')
    subscription.active = False
    return {'id': str(subscription.id), 'active': False}


@router.get('/principals/{principal_id}/webhooks/{subscription_id}/deliveries')
async def list_deliveries(principal_id: uuid.UUID, subscription_id: uuid.UUID,
                         user: Annotated[User, Depends(get_current_active_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    await owned_principal(db, principal_id, user)
    subscription = await db.get(WebhookSubscription, subscription_id)
    if not subscription or subscription.principal_id != principal_id:
        raise HTTPException(404, 'Webhook not found')
    rows = (await db.scalars(select(WebhookDelivery).where(WebhookDelivery.subscription_id == subscription_id)
        .order_by(WebhookDelivery.created_at.desc()).limit(100))).all()
    return [{'id': str(row.id), 'event_id': str(row.event_id), 'status': row.status, 'attempts': row.attempts,
             'next_attempt_at': row.next_attempt_at, 'delivered_at': row.delivered_at,
             'last_http_status': row.last_http_status, 'last_error': row.last_error} for row in rows]
