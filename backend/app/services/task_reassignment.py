"""Explicit operator repair without resetting accepted prices or consumed spend."""
import uuid
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import lazyload

from app.middleware.audit import log_audit
from app.models.agent import Agent
from app.models.assignment import Assignment
from app.models.bid import Bid
from app.models.billing import BillingOperation
from app.models.payment import PaymentRecord
from app.models.submission import Submission
from app.models.user import User
from app.services import task_execution as execution
from app.services.task_access import load_execution_task


async def reassign_task(db, task_id, agent_id, reason, user):
    if user.role != 'admin':
        raise HTTPException(403, 'Administrator access required')
    if not reason.strip():
        raise HTTPException(422, 'A reassignment reason is required')
    job, task = await load_execution_task(db, task_id)
    if job.status not in ('bidding', 'in_progress') or task.status not in execution.EXECUTABLE:
        raise HTTPException(409, 'Only unfinished work in an active mission can be repaired')
    line = await execution.accepted_line(db, task.id)
    if line is None:
        raise HTTPException(409, 'An accepted quote is required before repair')
    # Delivery allocation is immutable. Replacing its producer here would leave
    # the old beneficiary payable when the revised mission is finally accepted.
    if await db.scalar(select(PaymentRecord.id).where(PaymentRecord.task_id == task.id).limit(1)):
        raise HTTPException(409, 'This task already has a settlement allocation; retry its executor or cancel and refund')
    meta = dict(task.input_spec_json or {})
    generation = int(meta.get('_execution_generation', 0))
    operations = list((await db.execute(select(BillingOperation).where(
        BillingOperation.kind == 'execute_task', BillingOperation.entity_id == str(task.id))
        .order_by(BillingOperation.created_at.desc()).with_for_update()
        .execution_options(populate_existing=True))).scalars())
    current = next((op for op in operations if (op.payload or {}).get('generation', 0) == generation
                    and (op.payload or {}).get('quote_id') == str(line.quote_id)), None)
    if current is None or current.status not in ('blocked', 'failed'):
        raise HTTPException(409, 'Reassignment requires a blocked or failed task operation')
    if await db.scalar(select(Submission.id).where(Submission.task_id == task.id,
            Submission.status.in_(('submitted', 'under_review'))).limit(1)):
        raise HTTPException(409, 'Review the pending submission before reassignment')
    assignments = list((await db.execute(select(Assignment).options(lazyload('*'))
        .where(Assignment.task_id == task.id).with_for_update())).scalars())
    if any(a.status == 'completed' for a in assignments):
        raise HTTPException(409, 'Completed ownership must be reopened through the revision workflow')
    agent = await db.scalar(select(Agent).options(lazyload('*')).where(Agent.id == agent_id)
                            .with_for_update().execution_options(populate_existing=True))
    owner = await db.get(User, agent.developer_user_id, options=[lazyload('*')]) if agent else None
    if agent is None or agent.status != 'active' or owner is None or not owner.is_active:
        raise HTTPException(409, 'Choose an active executor with an active owner')
    snapshot = (current.payload or {}).get('execution') or (line.breakdown_json or {}).get('execution')
    human = '/experts/' in (agent.endpoint_url or '')
    platform = owner.role == 'admin' and agent.slug.startswith('llm-') and not human
    bid = None
    if platform:
        if (line.route == 'human' or not snapshot or
                agent.slug != 'llm-' + str(snapshot.get('provider'))):
            raise HTTPException(409, 'Automated repair must use the accepted provider route')
        if not execution.remaining_budget(task, snapshot):
            raise HTTPException(409, 'The existing execution budget is exhausted; choose human repair or refund')
    elif owner.role == 'admin':
        if not human:
            raise HTTPException(409, 'Choose an internal human executor or the accepted platform route')
    else:
        # Never invent a payout for a replacement or spend money already reserved
        # by failed provider calls. The existing bid becomes the settlement basis.
        bid = await db.scalar(select(Bid).options(lazyload('*')).where(
            Bid.task_id == task.id, Bid.agent_id == agent.id,
            Bid.status.in_(('submitted', 'shortlisted', 'selected')))
            .order_by(Bid.created_at.desc()).with_for_update())
        spent = Decimal(str(meta.get('_execution_reserved_cost_eur', 0)))
        price = Decimal(str(bid.price)) if bid and bid.price is not None else None
        if (price is None or not price.is_finite() or price < 0 or
                not spent.is_finite() or spent < 0 or price + spent > Decimal(str(task.budget or 0))):
            raise HTTPException(409, 'External repair needs an agreed bid within the unspent task budget')

    cancelled = []
    for assignment in assignments:
        if assignment.status in ('active', 'pending'):
            assignment.status = 'cancelled'
            cancelled.append(str(assignment.id))
    for operation in operations:
        if operation.status in ('pending', 'processing', 'blocked', 'failed'):
            operation.status = 'cancelled'
            operation.locked_until = None
    if bid:
        bid.status = 'selected'
    assignment = Assignment(id=uuid.uuid4(), task_id=task.id, agent_id=agent.id,
                            bid_id=bid.id if bid else None, status='active')
    db.add(assignment)
    generation += 1
    meta['_execution_generation'] = generation
    task.input_spec_json = meta
    task.status = 'assigned'
    job.status = 'in_progress'
    await db.flush()
    if platform:
        await execution.queue_task(db, job, task)
        # Explicitly reviewed historical budgets may live only on the old operation.
        queued = await db.scalar(select(BillingOperation).where(
            BillingOperation.key == f'task:{task.id}:{line.quote_id}:{generation}').with_for_update())
        queued.payload = {**queued.payload, 'execution': snapshot}
    await log_audit(db, actor_type='user', actor_id=str(user.id), action='task.reassigned',
        entity_type='task', entity_id=str(task.id), payload={
            'reason': reason.strip(), 'agent_id': str(agent.id), 'assignment_id': str(assignment.id),
            'cancelled_assignment_ids': cancelled, 'generation': generation,
            'execution_queued': platform, 'quote_id': str(line.quote_id),
            'reserved_cost_eur': meta.get('_execution_reserved_cost_eur', 0)})
    return {'task_id': str(task.id), 'assignment_id': str(assignment.id), 'agent_id': str(agent.id),
            'status': 'assigned', 'generation': generation, 'execution_queued': platform}
