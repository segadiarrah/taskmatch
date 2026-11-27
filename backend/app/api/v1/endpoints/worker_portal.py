"""Account-scoped human marketplace views, with no financial mutations."""
from datetime import datetime, timezone
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import DateTime, func, select, true
from sqlalchemy.orm import lazyload

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.models import Agent, Assignment, Job, PaymentRecord, Task, User
from app.models.human import Delegation, Principal, WorkerProfile
from app.schemas.agent import AgentCreate, AgentResponse
from app.services.human_authorization import enabled

router = APIRouter(dependencies=[Depends(enabled)])


@router.get('/admin/overview')
async def admin_overview(user=Depends(require_role('admin')), db=Depends(get_db, scope="function")):
    """Actual human activity, separately from existing AI marketplace metrics."""
    missions = select(
        func.count().label('human_missions'),
        func.count().filter(
            Task.human_policy_status == 'pending',
            Task.status.not_in(('approved', 'cancelled')),
        ).label('pending_publication'),
        func.count().filter(Task.status.in_(
            ('assigned', 'in_progress', 'submitted', 'validation_failed', 'reassigned'),
        )).label('active_human_missions'),
    ).where(
        Task.human_contract_json['schema_version'].as_string() == 'tm.human-task.v1',
    ).subquery()
    workers = select(
        func.count().label('worker_profiles'),
        func.count().filter(WorkerProfile.verification_status == 'pending')
        .label('pending_worker_verification'),
    ).subquery()
    # Each aggregate produces exactly one row, including an empty marketplace.
    # One statement keeps the five counters on the same database snapshot.
    row = (await db.execute(select(*missions.c, *workers.c)
                            .select_from(missions).join(workers, true()))).mappings().one()
    return dict(row)


@router.get('/missions')
async def missions(view: Literal['request', 'work', 'review'] = 'request',
                   skip: int = Query(0, ge=0), limit: int = Query(12, ge=1, le=100),
                   user=Depends(get_current_active_user), db=Depends(get_db, scope="function")):
    query = select(Task).options(lazyload('*')).where(
        Task.human_contract_json['schema_version'].as_string() == 'tm.human-task.v1')
    if view == 'request':
        query = query.where(Task.job_id.in_(select(Job.id).where(Job.client_user_id == user.id)))
    elif view == 'work':
        query = query.where(Task.id.in_(select(Assignment.task_id).join(Agent, Agent.id == Assignment.agent_id)
                                       .where(Agent.developer_user_id == user.id)))
    else:
        if user.role != 'admin':
            raise HTTPException(403, 'Independent administrator review required')
        query = query.where(Task.human_policy_status == 'pending',
                            Task.status.not_in(('approved', 'cancelled')))
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    rows = (await db.scalars(query.order_by(Task.created_at.desc(), Task.id.desc()).offset(skip).limit(limit))).all()
    return {'items': [{**t.human_contract_json, 'status': t.status, 'policy_status': t.human_policy_status}
                      for t in rows], 'total': total, 'skip': skip, 'limit': limit}


@router.get('/earnings')
async def earnings(skip: int = Query(0, ge=0), limit: int = Query(12, ge=1, le=100),
                   user=Depends(get_current_active_user), db=Depends(get_db, scope="function")):
    scope = (PaymentRecord.developer_user_id == user.id) & (PaymentRecord.provider != 'platform')
    total = await db.scalar(select(func.count(PaymentRecord.id)).where(scope))
    rows = (await db.execute(select(PaymentRecord, Task.title, Job.title).options(lazyload('*'))
                            .join(Job, Job.id == PaymentRecord.job_id)
                            .outerjoin(Task, Task.id == PaymentRecord.task_id).where(scope)
                            .order_by(PaymentRecord.created_at.desc(), PaymentRecord.id.desc())
                            .offset(skip).limit(limit))).all()
    summaries = (await db.execute(select(PaymentRecord.currency, PaymentRecord.payment_status,
                                         func.sum(PaymentRecord.net_amount)).where(scope)
                                  .group_by(PaymentRecord.currency, PaymentRecord.payment_status))).all()
    by_currency = {}
    pending = {'pending', 'authorized', 'releasable', 'processing', 'blocked', 'failed'}
    for currency, status, amount in summaries:
        group = by_currency.setdefault(currency, {'currency': currency, 'paid_minor': 0, 'pending_minor': 0})
        if status == 'paid':
            group['paid_minor'] += int(Decimal(amount) * 100)
        elif status in pending:
            group['pending_minor'] += int(Decimal(amount) * 100)
    return {'items': [{'id': str(p.id), 'task_title': title or job_title,
                       'net_amount_minor': int(Decimal(p.net_amount) * 100), 'currency': p.currency,
                       'status': p.payment_status, 'created_at': p.created_at} for p, title, job_title in rows],
            'by_currency': [by_currency[c] for c in sorted(by_currency)], 'total': total, 'skip': skip, 'limit': limit}


@router.get('/workers')
async def workers(skip: int = Query(0, ge=0), limit: int = Query(12, ge=1, le=100),
                  user=Depends(require_role('admin')), db=Depends(get_db, scope="function")):
    from app.api.v1.endpoints.human_identity import worker_view
    total = await db.scalar(select(func.count(WorkerProfile.user_id)))
    rows = (await db.execute(select(WorkerProfile, User.full_name).join(User, User.id == WorkerProfile.user_id)
                            .order_by(WorkerProfile.created_at, WorkerProfile.user_id)
                            .offset(skip).limit(limit))).all()
    return {'items': [{**(await worker_view(db, p)), 'full_name': name} for p, name in rows],
            'total': total, 'skip': skip, 'limit': limit}


@router.get('/agents')
async def agents(user=Depends(get_current_active_user), db=Depends(get_db, scope="function")):
    rows = (await db.scalars(select(Agent).options(lazyload('*')).where(Agent.developer_user_id == user.id,
                              ~Agent.endpoint_url.contains('/experts/')).order_by(Agent.created_at, Agent.id))).all()
    return {'items': [{'id': str(a.id), 'name': a.name, 'status': a.status} for a in rows]}


@router.post('/agents', status_code=201, response_model=AgentResponse)
async def create_agent(body: AgentCreate, user=Depends(get_current_active_user), db=Depends(get_db, scope="function")):
    # Creating an owned executor never changes the account role or enables platform privileges.
    if body.executor_kind != 'agent' or not body.endpoint_url or '/experts/' in str(body.endpoint_url):
        raise HTTPException(422, 'An AI agent endpoint is required; use the worker profile for human work')
    from app.api.v1.endpoints.agents import register_agent
    return await register_agent(body, user, db)


@router.get('/delegations')
async def delegations(user=Depends(get_current_active_user), db=Depends(get_db, scope="function")):
    rows = (await db.execute(select(Delegation, Agent.name).join(Principal, Principal.id == Delegation.principal_id)
                            .join(Agent, Agent.id == Delegation.agent_id)
                            .where(Principal.owner_user_id == user.id)
                            .order_by(Delegation.created_at.desc(), Delegation.id.desc()))).all()
    now = datetime.now(timezone.utc)
    return {'items': [{'id': str(d.id), 'principal_id': str(d.principal_id), 'agent_id': str(d.agent_id),
                        'agent_name': name, 'max_amount_minor': d.max_amount_minor,
                        'reserved_amount_minor': d.reserved_amount_minor, 'categories': d.categories,
                        'expires_at': d.expires_at,
                        'status': 'revoked' if d.revoked_at else ('expired' if d.expires_at <= now else 'active')}
                      for d, name in rows]}


@router.get('/opportunities')
async def opportunities(skip: int = Query(0, ge=0), limit: int = Query(12, ge=1, le=100),
                        user=Depends(get_current_active_user), db=Depends(get_db, scope="function")):
    from app.services.task_access import task_visibility
    query = select(Task).options(lazyload('*')).where(
        Task.human_contract_json.is_not(None), Task.human_policy_status == 'approved',
        Task.status == 'open_for_bids', task_visibility(user),
        Task.job_id.in_(select(Job.id).where(Job.client_user_id != user.id)),
        Task.human_contract_json['deadline'].as_string().cast(DateTime(timezone=True)) > datetime.now(timezone.utc))
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    rows = (await db.scalars(query.order_by(Task.created_at, Task.id).offset(skip).limit(limit))).all()
    return {'items': [{'task_id': str(t.id), 'title': t.title, 'objective': t.description,
                       'task_category': t.task_type, 'language': t.human_contract_json['language'],
                       'execution_mode': t.human_contract_json['execution_mode'],
                       'expected_duration': t.human_contract_json['expected_duration'],
                       'worker_amount_minor': int(t.budget * 100), 'currency': 'EUR',
                       'deadline': t.human_contract_json['deadline']} for t in rows],
            'total': total, 'skip': skip, 'limit': limit}
