"""Scoped authorization and serialized, conservative spending reservations."""
import hashlib
import json
from datetime import datetime, timezone
from uuid import UUID

from fastapi import Depends, HTTPException
from jwt import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.orm import lazyload

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import oauth2_scheme
from app.core.security import verify_token
from app.services.registration import fixture_access_disabled
from app.models import Agent, User
from app.models.human import Delegation, Principal


def enabled():
    if not settings.HUMAN_TASKS_ENABLED:
        raise HTTPException(503, 'Human Tasks are not enabled')


async def caller(token=Depends(oauth2_scheme), db=Depends(get_db, scope="function")):
    try:
        payload = verify_token(token)
        user_id = UUID(payload['sub'])
    except (InvalidTokenError, KeyError, ValueError, TypeError):
        raise HTTPException(401, 'Invalid token') from None
    user = await db.get(User, user_id, options=[lazyload('*')])
    if not user or not user.is_active or fixture_access_disabled(user):
        raise HTTPException(403, 'Inactive account')
    if payload.get('scope') is None and payload.get('sv', 0) != user.session_version:
        raise HTTPException(401, 'Session expired')
    if payload.get('scope') not in (None, 'human_tasks'):
        raise HTTPException(403, 'Unsupported token scope')
    if payload.get('scope') == 'human_tasks':
        try:
            delegation_id = UUID(payload['delegation_id'])
        except (KeyError, ValueError, TypeError):
            raise HTTPException(401, 'Invalid delegation token') from None
        d = await db.get(Delegation, delegation_id)
        p = await db.get(Principal, d.principal_id) if d else None
        agent = await db.get(Agent, d.agent_id, options=[lazyload('*')]) if d else None
        if (not d or d.revoked_at or d.expires_at <= datetime.now(timezone.utc)
                or not p or p.owner_user_id != user.id or not agent or agent.status != 'active'
                or agent.developer_user_id != user.id):
            raise HTTPException(403, 'Delegation expired, revoked or unavailable')
        return user, d
    return user, None


async def owned_principal(db, principal_id, user, *, lock=False):
    query = select(Principal).where(Principal.id == principal_id)
    if lock:
        query = query.with_for_update().execution_options(populate_existing=True)
    p = await db.scalar(query)
    if not p or p.owner_user_id != user.id:
        raise HTTPException(403, 'Principal is not owned by this account')
    return p


def request_hash(body):
    return hashlib.sha256(json.dumps(body.model_dump(mode='json'), sort_keys=True,
                                    separators=(',', ':')).encode()).hexdigest()


async def bound_delegation(db, d, p, body):
    if not d:
        if body.requester_type == 'AGENT_REQUESTER':
            raise HTTPException(422, 'Agent requests require a scoped delegation token')
        return None
    d = await db.scalar(select(Delegation).where(Delegation.id == d.id)
                        .with_for_update().execution_options(populate_existing=True))
    if (d.revoked_at or d.expires_at <= datetime.now(timezone.utc) or d.principal_id != p.id
            or body.delegation_id != d.id or body.requesting_agent_id != d.agent_id
            or body.requester_type != 'AGENT_REQUESTER'):
        raise HTTPException(403, 'Contract does not match the active delegation')
    if body.task_category not in d.categories:
        raise HTTPException(403, 'Category is outside the delegation')
    return d
