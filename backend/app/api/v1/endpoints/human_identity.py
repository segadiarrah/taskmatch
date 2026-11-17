"""Human identity and scoped mandates; existing User accounts remain authoritative."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import lazyload

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.core.security import create_access_token
from app.middleware.audit import log_audit
from app.models import Agent, User
from app.models.human import Principal, Delegation, WorkerProfile
from app.schemas.human import PrincipalCreate, DelegationCreate, WorkerUpdate, WorkerVerification
from app.services.human_authorization import enabled, owned_principal
from app.services.human_tasks import CATEGORIES
from app.services.human_workers import eligibility

router = APIRouter(dependencies=[Depends(enabled)])


@router.get('/principals')
async def list_principals(user=Depends(get_current_active_user), db=Depends(get_db)):
    return [{'id': str(p.id), 'kind': p.kind, 'display_name': p.display_name} for p in
            (await db.scalars(select(Principal).where(Principal.owner_user_id == user.id))).all()]


@router.post('/principals', status_code=201)
async def create_principal(body: PrincipalCreate, user=Depends(get_current_active_user), db=Depends(get_db)):
    await db.scalar(select(User).options(lazyload('*')).where(User.id == user.id).with_for_update())
    p = await db.scalar(select(Principal).where(Principal.owner_user_id == user.id, Principal.kind == body.kind))
    if not p:
        p = Principal(owner_user_id=user.id, **body.model_dump())
        db.add(p)
        await db.flush()
    return {'id': str(p.id), 'kind': p.kind, 'display_name': p.display_name}


@router.post('/principals/{principal_id}/delegations', status_code=201)
async def create_delegation(principal_id: uuid.UUID, body: DelegationCreate,
                            user=Depends(get_current_active_user), db=Depends(get_db)):
    p = await owned_principal(db, principal_id, user, lock=True)
    agent = await db.get(Agent, body.agent_id, options=[lazyload('*')])
    if not agent or agent.developer_user_id != user.id or agent.status != 'active' or '/experts/' in agent.endpoint_url:
        raise HTTPException(403, 'An active AI agent owned by the principal account is required')
    if not set(body.categories).issubset(CATEGORIES):
        raise HTTPException(422, 'Unknown delegation category')
    d = Delegation(principal_id=p.id, **body.model_dump())
    db.add(d)
    await db.flush()
    token = create_access_token({'sub': str(user.id), 'scope':'human_tasks', 'delegation_id':str(d.id)},
                                expires_delta=d.expires_at-datetime.now(timezone.utc))
    await log_audit(db, actor_type='user', actor_id=str(user.id), action='delegation.created',
                    entity_type='delegation', entity_id=str(d.id), payload={'max_amount_minor':d.max_amount_minor})
    return {'id':str(d.id), 'access_token':token, 'token_type':'bearer',
            'expires_at':d.expires_at, 'max_amount_minor':d.max_amount_minor}


@router.delete('/principals/{principal_id}/delegations/{delegation_id}')
async def revoke(principal_id: uuid.UUID, delegation_id: uuid.UUID,
                 user=Depends(get_current_active_user), db=Depends(get_db)):
    await owned_principal(db, principal_id, user, lock=True)
    d = await db.scalar(select(Delegation).where(Delegation.id == delegation_id,
                    Delegation.principal_id == principal_id).with_for_update())
    if not d:
        raise HTTPException(404, 'Delegation not found')
    d.revoked_at = datetime.now(timezone.utc)
    await log_audit(db, actor_type='user', actor_id=str(user.id), action='delegation.revoked',
                    entity_type='delegation', entity_id=str(d.id))
    return {'status':'revoked'}


async def worker_view(db, p):
    if not p:
        return None
    reasons = await eligibility(db, p.user_id)
    return {**p.profile, 'user_id':str(p.user_id), 'agent_id':str(p.agent_id),
            'verification_status':p.verification_status, 'attested_skills':p.attested_skills,
            'data_consent':p.data_consent, 'payment_eligible':not reasons, 'eligibility_reasons':reasons}


@router.get('/workers/me')
async def get_worker(user=Depends(get_current_active_user), db=Depends(get_db)):
    return await worker_view(db, await db.get(WorkerProfile, user.id))


@router.put('/workers/me')
async def save_worker(body: WorkerUpdate, user=Depends(get_current_active_user), db=Depends(get_db)):
    await db.scalar(select(User).options(lazyload('*')).where(User.id == user.id).with_for_update())
    p = await db.get(WorkerProfile, user.id)
    if p is None:
        humans = list((await db.scalars(select(Agent).options(lazyload('*')).where(
            Agent.developer_user_id == user.id, Agent.endpoint_url.contains('/experts/')))).all())
        if len(humans) > 1:
            raise HTTPException(409, 'Multiple historical human profiles require administrator consolidation')
        agent = humans[0] if humans else Agent(id=uuid.uuid4(), developer_user_id=user.id,
                slug='human-'+str(user.id), name=user.full_name, description='Human worker',
                endpoint_url='/experts/'+str(user.id), status='active')
        if not humans:
            db.add(agent)
            await db.flush()
        p = WorkerProfile(user_id=user.id, agent_id=agent.id, attested_skills=[])
        db.add(p)
    old = p.profile or {}
    if old and old.get('country') != body.country:
        p.verification_status = 'pending'
        p.attested_skills = []
    p.profile = body.model_dump(exclude={'data_consent'})
    p.data_consent = body.data_consent
    await db.flush()
    await log_audit(db, actor_type='user', actor_id=str(user.id), action='worker.profile_updated',
                    entity_type='worker', entity_id=str(user.id), payload={'consent':p.data_consent})
    return await worker_view(db, p)


@router.post('/workers/{user_id}/verify')
async def verify_worker(user_id: uuid.UUID, body: WorkerVerification,
                        user=Depends(require_role('admin')), db=Depends(get_db)):
    if user.id == user_id:
        raise HTTPException(403, 'Independent verification required')
    p = await db.scalar(select(WorkerProfile).where(WorkerProfile.user_id == user_id).with_for_update())
    if not p:
        raise HTTPException(404, 'Worker profile not found')
    p.verification_status = body.verification_status
    p.attested_skills = body.attested_skills
    await log_audit(db, actor_type='user', actor_id=str(user.id), action='worker.verified',
                    entity_type='worker', entity_id=str(user_id), payload=body.model_dump())
    return await worker_view(db, p)
