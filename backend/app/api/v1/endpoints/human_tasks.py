"""Provider-independent Human Tasks API with polling and simplified worker actions."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import select, or_
from sqlalchemy.orm import lazyload

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.models import Agent, Assignment, AuditLog, Job, Submission, Task
from app.models.human import WorkerProfile
from app.schemas.human import HumanTaskContract, HumanResult, PublicationReview
from app.schemas.quote import OfferAcceptRequest
from app.schemas.submission import SubmissionCreate
from app.services.human_authorization import caller, enabled
from app.services import human_tasks as service
from app.services.human_workers import require_eligible_executor
from app.services.task_access import require_task_access

router = APIRouter()


def view(task):
    return {**task.human_contract_json, 'status': task.status, 'policy_status':task.human_policy_status}


@router.get('/schema')
async def schema():
    return {'$schema':'https://json-schema.org/draft/2020-12/schema',
            '$id':'https://taskmatch.ai/schemas/tm.human-task.v1.json', **HumanTaskContract.model_json_schema()}


@router.get('/taxonomy')
async def taxonomy():
    return service.TAXONOMY


@router.post('', status_code=201, dependencies=[Depends(enabled)])
async def create(body: HumanTaskContract, identity=Depends(caller), db=Depends(get_db),
                  idempotency_key: str = Header(min_length=1, max_length=128)):
    user, delegation = identity
    return view(await service.create_contract(db, body, user, delegation, idempotency_key))


async def accessible(db, task_id, identity):
    task = await db.get(Task, task_id, options=[lazyload('*')])
    if not task or not task.human_contract_json:
        raise HTTPException(404, 'Human Task not found')
    user, delegation = identity
    if delegation:
        if task.human_contract_json.get('delegation_id') != str(delegation.id):
            raise HTTPException(403, 'Task is outside this delegation')
    else:
        await require_task_access(db, task, user)
    return task


@router.get('')
async def list_contracts(identity=Depends(caller), db=Depends(get_db),
                         skip: int=Query(0, ge=0), limit: int=Query(30, ge=1, le=100)):
    user, delegation = identity
    query = select(Task).options(lazyload('*')).where(
        Task.human_contract_json['schema_version'].as_string() == 'tm.human-task.v1')
    if delegation:
        query = query.where(Task.human_contract_json['delegation_id'].as_string() == str(delegation.id))
    elif user.role != 'admin':
        query = query.where(or_(Task.job_id.in_(select(Job.id).where(Job.client_user_id == user.id)),
                     Task.id.in_(select(Assignment.task_id).join(Agent, Agent.id == Assignment.agent_id)
                                 .where(Agent.developer_user_id == user.id))))
    tasks = (await db.scalars(query.order_by(Task.created_at.desc(), Task.id).offset(skip).limit(limit))).all()
    return {'items':[view(t) for t in tasks], 'skip':skip, 'limit':limit}


@router.get('/opportunities', dependencies=[Depends(enabled)])
async def opportunities(user=Depends(get_current_active_user), db=Depends(get_db),
                         skip: int=Query(0, ge=0), limit: int=Query(30, ge=1, le=100)):
    from app.services.task_access import task_visibility
    tasks = (await db.scalars(select(Task).options(lazyload('*')).where(
        Task.human_contract_json.is_not(None), Task.human_policy_status == 'approved',
        Task.status == 'open_for_bids', task_visibility(user),
        Task.job_id.in_(select(Job.id).where(Job.client_user_id != user.id))).order_by(Task.created_at, Task.id)
        .offset(skip).limit(limit))).all()
    # Public opportunity summaries intentionally omit instructions, principal and exact location.
    now = datetime.now(timezone.utc)
    return {'items':[{'task_id':str(t.id), 'title':t.title, 'objective':t.description,
              'task_category':t.task_type, 'language':t.human_contract_json['language'],
              'execution_mode':t.human_contract_json['execution_mode'],
              'expected_duration':t.human_contract_json['expected_duration'],
              'worker_amount_minor':int(t.budget*100), 'currency':'EUR',
              'deadline':t.human_contract_json['deadline']} for t in tasks
              if datetime.fromisoformat(t.human_contract_json['deadline']) > now], 'skip':skip, 'limit':limit}


@router.get('/{task_id}')
async def get_contract(task_id: uuid.UUID, identity=Depends(caller), db=Depends(get_db)):
    task = await accessible(db, task_id, identity)
    user, delegation = identity
    job = await db.get(Job, task.job_id, options=[lazyload('*')])
    assignment = await db.scalar(select(Assignment).options(lazyload('*')).join(Agent, Agent.id==Assignment.agent_id)
        .where(Assignment.task_id==task.id, Agent.developer_user_id==user.id).limit(1))
    return {**view(task), 'actions': {
        'can_submit': not delegation and assignment is not None and assignment.status=='active' and task.status in ('assigned','in_progress','validation_failed'),
        'can_review': not delegation and not assignment and (job.client_user_id==user.id or user.role=='admin'),
        'can_fund': not delegation and job.client_user_id==user.id and job.status=='quoted',
        'can_accept': not delegation and job.client_user_id==user.id and job.status=='client_review',
        'can_edit_plan': not delegation and job.client_user_id==user.id and job.status=='draft',
        'can_amend': not delegation and job.client_user_id==user.id and job.status!='draft'}}


@router.get('/{task_id}/result')
async def result(task_id: uuid.UUID, identity=Depends(caller), db=Depends(get_db)):
    task = await accessible(db, task_id, identity)
    submission = await db.scalar(select(Submission).options(lazyload('*')).where(
        Submission.task_id == task.id, Submission.status == 'approved')
        .order_by(Submission.created_at.desc()).limit(1)) if task.status == 'approved' else None
    return {'task_id':str(task.id), 'status':task.status, 'ready':submission is not None,
            'result':{'summary':submission.summary, 'evidence':submission.output_json} if submission else None}


@router.get('/{task_id}/events')
async def events(task_id: uuid.UUID, identity=Depends(caller), db=Depends(get_db),
                  skip: int=Query(0, ge=0), limit: int=Query(30, ge=1, le=100)):
    await accessible(db, task_id, identity)
    rows = (await db.scalars(select(AuditLog).where(AuditLog.entity_type=='task',
            AuditLog.entity_id==str(task_id)).order_by(AuditLog.created_at, AuditLog.id)
            .offset(skip).limit(limit))).all()
    # Notes and third-party personal data never leave the administrative audit log.
    return {'items':[{'event_id':str(e.id), 'event_type':e.action, 'task_id':str(task_id),
                       'occurred_at':e.created_at, 'schema_version':'tm.event.v1'} for e in rows]}


@router.post('/{task_id}/publish', dependencies=[Depends(enabled)])
async def publish(task_id: uuid.UUID, body: PublicationReview,
                    user=Depends(require_role('admin')), db=Depends(get_db)):
    return view(await service.publish(db, task_id, user, body))


@router.post('/{task_id}/claim', dependencies=[Depends(enabled)])
async def claim(task_id: uuid.UUID, user=Depends(get_current_active_user), db=Depends(get_db)):
    from app.api.v1.endpoints.quotes import accept_offer
    task = await db.get(Task, task_id, options=[lazyload('*')])
    if not task or not task.human_contract_json:
        raise HTTPException(404, 'Human Task not found')
    p = await db.get(WorkerProfile, user.id)
    if not p:
        raise HTTPException(409, 'Create and verify a worker profile before claiming paid work')
    await require_eligible_executor(db, task, p.agent_id)
    return await accept_offer(task_id, OfferAcceptRequest(price=float(task.budget), agent_id=p.agent_id), user, db)


@router.post('/{task_id}/result', status_code=201, dependencies=[Depends(enabled)])
async def submit_result(task_id: uuid.UUID, body: HumanResult,
                          user=Depends(get_current_active_user), db=Depends(get_db)):
    from app.api.v1.endpoints.submissions import create_submission
    p = await db.get(WorkerProfile, user.id)
    assignment = await db.scalar(select(Assignment).options(lazyload('*')).where(
        Assignment.task_id==task_id, Assignment.agent_id==p.agent_id,
        Assignment.status=='active')) if p else None
    if not assignment:
        raise HTTPException(403, 'No active assignment owned by this worker')
    task = await db.get(Task, task_id, options=[lazyload('*')])
    if not task.human_contract_json:
        raise HTTPException(404, 'Human Task not found')
    if not set(task.human_contract_json['evidence_requirements']).issubset(body.evidence):
        raise HTTPException(422, 'Required evidence is missing')
    submission = await create_submission(task_id, SubmissionCreate(task_id=task_id, agent_id=p.agent_id,
                    assignment_id=assignment.id, summary=body.summary, output_json=body.evidence), user, db)
    from app.middleware.audit import log_audit
    await log_audit(db, actor_type='user', actor_id=str(user.id), action='human_task.result_submitted',
                    entity_type='task', entity_id=str(task.id), payload={'submission_id': str(submission.id)})
    return submission
