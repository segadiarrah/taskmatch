"""Operator visibility and bounded recovery of individual tasks."""
import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import lazyload

from app.core.config import settings
from app.models.agent import Agent
from app.models.billing import BillingOperation
from app.models.job import Job
from app.models.payment import PaymentRecord
from app.models.task import Task
from app.models.user import User
from app.services import billing_service as billing
from app.services import task_execution as execution
from app.services.task_access import load_execution_task, require_task_access


async def task_state(db, task, user):
    await require_task_access(db, task, user)
    assignment = await execution.active_assignment(db, task.id)
    agent = await db.get(Agent, assignment.agent_id, options=[lazyload('*')]) if assignment else None
    line = await execution.accepted_line(db, task.id)
    job = await db.get(Job, task.job_id, options=[lazyload('*')])
    operations = list((await db.execute(select(BillingOperation).where(
        BillingOperation.kind == 'execute_task', BillingOperation.entity_id == str(task.id))
        .order_by(BillingOperation.created_at.desc()))).scalars())
    human = agent is not None and '/experts/' in (agent.endpoint_url or '')
    reviewer = await execution.sega(db) if line and line.route == 'hybrid' and not human else None
    eligible = job.status in ('bidding', 'in_progress') and task.status in execution.EXECUTABLE
    budget = (line.breakdown_json or {}).get('execution') if line else None
    current = next((op for op in operations if (op.payload or {}).get('generation', 0) ==
                    int((task.input_spec_json or {}).get('_execution_generation', 0))), None)
    if current:
        budget = (current.payload or {}).get('execution') or budget
    funding_error = None
    if eligible:
        try:
            await billing.require_execution_funding(db, job)
        except HTTPException as exc:
            eligible = False
            funding_error = str(exc.detail)
    can_retry = bool(user.role == 'admin' and eligible and line and
                     (line.route == 'human' or (budget and execution.remaining_budget(task, budget))) and
                     (not current or current.status in ('blocked', 'failed', 'done')))
    can_review = bool(task.status == 'submitted' and
        ((reviewer and reviewer.id == user.id and (not human or agent.developer_user_id != user.id))
         if line and line.route == 'hybrid' and not human else
         ((user.role == 'admin' or job.client_user_id == user.id) and (not human or agent.developer_user_id != user.id))))
    recovery = None
    if job.billing_mode == 'legacy_manual' and not budget and (not line or line.route != 'human'):
        recovery = {'eligible': bool(eligible and line and job.currency.upper() == 'EUR'),
                    'reason': funding_error or ('Review a provider and cost budget before resuming this historical task.'
                        if line else 'This historical task needs an accepted, reviewed quote before execution.')}
    has_settlement = await db.scalar(select(PaymentRecord.id).where(PaymentRecord.task_id == task.id).limit(1))
    return {'assignment': {'id': str(assignment.id), 'agent_id': str(agent.id),
               'agent_name': agent.name, 'owner_user_id': str(agent.developer_user_id),
               'kind': 'human' if human else 'agent', 'status': assignment.status,
               'can_submit': bool(eligible and human and agent.developer_user_id == user.id and
                                  task.status in ('assigned', 'in_progress', 'validation_failed'))}
            if assignment and agent else None,
            'review_required': bool(human or (line and line.route in ('human', 'hybrid'))),
            'reviewer_name': reviewer.full_name if reviewer else None, 'can_review': can_review,
            'operations': [{'id': str(op.id), 'status': op.status, 'attempts': op.attempts,
                            'last_error': op.last_error, 'available_at': op.available_at.isoformat(),
                            'attempt_log': (op.payload or {}).get('attempt_log', [])}
                           for op in operations],
            'can_retry': can_retry, 'can_reassign': bool(user.role == 'admin' and eligible and current and not has_settlement and current.status in ('blocked', 'failed')), 'recovery': recovery,
            'funding_error': funding_error}


async def retry_task(db, task_id, user):
    job, task = await load_execution_task(db, task_id)
    if user.role != 'admin':
        raise HTTPException(403, 'Administrator access required')
    state = await task_state(db, task, user)
    if not state['can_retry']:
        raise HTTPException(409, 'Task cannot be retried. Check assignment, funding and execution budget; repair/reassign or refund.')
    generation = int((task.input_spec_json or {}).get('_execution_generation', 0))
    operations = list((await db.execute(select(BillingOperation).where(
        BillingOperation.entity_id == str(task.id), BillingOperation.kind == 'execute_task')
        .with_for_update())).scalars())
    current = next((op for op in operations if (op.payload or {}).get('generation', 0) == generation), None)
    if current:
        current.status = 'pending'
        current.available_at = billing.now()
        current.last_error = None
        current.locked_until = None
    else:
        await execution.queue_task(db, job, task)
    execution.audit(db, 'task.retry_requested', task, {'user_id': str(user.id)})
    await db.flush()
    return {'status': 'pending', 'task_id': str(task.id)}


async def recovery_preview(db, task, user, provider, model):
    """Read-only proposal: never rewrite a historical accepted quote."""
    from app.services import providers, pricing_service
    from app.models.assignment import Assignment
    if user.role != 'admin':
        raise HTTPException(403, 'Administrator access required')
    job = await db.get(Job, task.job_id, options=[lazyload('*')])
    line = await execution.accepted_line(db, task.id)
    if (job.billing_mode != 'legacy_manual' or job.status not in ('bidding', 'in_progress')
            or task.status not in execution.EXECUTABLE or not line
            or line.route == 'human' or (line.breakdown_json or {}).get('execution')):
        raise HTTPException(409, 'This task is not eligible for historical provider recovery')
    await billing.require_execution_funding(db, job)
    if job.currency.upper() != 'EUR':
        raise HTTPException(409, 'Historical non-EUR work needs a reviewed replacement quote or manual human repair')
    reservations = await db.scalar(select(Assignment.id).where(
        Assignment.task_id == task.id, Assignment.status.in_(['pending', 'completed'])).limit(1))
    if reservations:
        raise HTTPException(409, 'Existing reserved or completed work must be reviewed before recovery')
    cfg = providers.get_provider(provider)
    if (not cfg or not cfg.get('enabled') or not cfg.get('api_key')
            or cfg.get('refresh_status') in ('error', 'unverified') or model not in cfg.get('models', [])):
        raise HTTPException(409, 'Select an enabled, configured provider and an available priced model')
    assignment = await execution.active_assignment(db, task.id)
    if assignment:
        agent = await db.get(Agent, assignment.agent_id, options=[lazyload('*')])
        if agent.slug != 'llm-' + provider:
            raise HTTPException(409, 'Existing ownership must be explicitly reassigned before provider recovery')
    operations = list((await db.execute(select(BillingOperation).where(
        BillingOperation.kind == 'execute_task', BillingOperation.entity_id == str(task.id)))).scalars())
    if any(op.status in ('pending', 'processing') or (op.payload or {}).get('execution') for op in operations):
        raise HTTPException(409, 'This task already has a frozen execution budget; use its retry or repair action')
    try:
        snapshot = pricing_service.execution_snapshot(provider=provider, model=model,
            base_url=cfg.get('base_url'), max_input_tokens=64000, max_output_tokens=8000,
            fx_usd_to_eur=settings.PRICING_USD_TO_EUR)
    except ValueError as exc:
        raise HTTPException(409, str(exc)) from None
    if not execution.remaining_budget(task, snapshot):
        raise HTTPException(409, 'The proposed worst-case provider cost exceeds the remaining accepted task budget')
    return {'eligible': True, 'quote_id': str(line.quote_id), 'execution': snapshot}


async def recover_task(db, task_id, user, body):
    from decimal import Decimal
    job, task = await load_execution_task(db, task_id)
    preview = await recovery_preview(db, task, user, body.provider, body.model)
    if str(body.quote_id) != preview['quote_id'] or Decimal(str(body.approved_max_cost_eur)) != Decimal(str(preview['execution']['max_cost_eur'])):
        raise HTTPException(409, 'The quote or proposed cost changed; review a new recovery preview')
    # A new generation fences any abandoned historical dispatcher. Global spend
    # and call counters remain on the task and cannot be reset by this approval.
    await execution.queue_task(db, job, task, revision=True)
    generation = int((task.input_spec_json or {}).get('_execution_generation', 0))
    operation = await db.scalar(select(BillingOperation).where(
        BillingOperation.kind == 'execute_task', BillingOperation.entity_id == str(task.id),
        BillingOperation.key == f'task:{task.id}:{preview["quote_id"]}:{generation}').with_for_update())
    operation.payload = {**operation.payload, 'execution': preview['execution'],
                         'recovery_approved_by': str(user.id), 'recovery_approved_at': billing.now().isoformat()}
    execution.audit(db, 'task.historical_recovery_approved', task, {
        'user_id': str(user.id), 'quote_id': preview['quote_id'], 'execution': preview['execution']})
    await db.flush()
    return {'status': 'pending', 'task_id': str(task.id)}
