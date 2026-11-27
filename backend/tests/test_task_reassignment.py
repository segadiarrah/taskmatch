"""Operator repair preserves funding, ownership and consumed execution budgets."""
import uuid

import pytest
from sqlalchemy import select

from app.api.v1.endpoints import jobs
from app.models.agent import Agent
from app.models.assignment import Assignment
from app.models.audit import AuditLog
from app.models.billing import BillingOperation, JobFunding
from app.models.job import Job
from app.models.quote import Quote
from app.models.submission import Submission
from app.models.task import Task
from app.services import billing_worker, task_execution
from tests.test_lifecycle_integration import market as _market_fixture, request
from tests.test_task_execution import setup_job

market = _market_fixture


async def blocked_task(market, route='llm', exhausted=True):
    job_id, tasks = await setup_job(market, (route,))
    await jobs._execute_job(job_id)
    async with market.db() as db:
        task = await db.get(Task, tasks[0])
        task.status = 'assigned'
        task.input_spec_json = {'_execution_calls': 3 if exhausted else 1,
                                '_execution_reserved_cost_eur': .3 if exhausted else .1}
        old_agent = await db.scalar(select(Agent).where(Agent.slug == 'llm-openai'))
        old = Assignment(id=uuid.uuid4(), task_id=task.id, agent_id=old_agent.id, status='active')
        pending = Assignment(id=uuid.uuid4(), task_id=task.id,
                             agent_id=market.agent.id, status='pending')
        db.add_all([old, pending])
        op = await db.scalar(select(BillingOperation).where(BillingOperation.entity_id == str(task.id)))
        op.status = 'blocked'
        op.last_error = 'Provider execution needs repair'
        op.payload = {**op.payload, 'reserved_cost_eur': .3 if exhausted else .1,
                      'calls': 3 if exhausted else 1}
        human = await task_execution.human_agent(db)
        await db.commit()
        return job_id, task.id, human.id, old_agent.id, op.id, [old.id, pending.id]


@pytest.mark.parametrize('route', ['llm', 'hybrid'])
async def test_human_repair_preserves_budget_fences_work_and_requires_review(market, route):
    job_id, task_id, human_id, _, op_id, previous_ids = await blocked_task(market, route)
    response = await request(market, 'POST', f'/tasks/{task_id}/reassign', role='admin',
                             json={'agent_id': str(human_id), 'reason': 'Complete the work manually'})
    assert response['execution_queued'] is False
    assert response['generation'] == 1
    async with market.db() as db:
        task = await db.get(Task, task_id)
        assert task.input_spec_json['_execution_calls'] == 3
        assert task.input_spec_json['_execution_reserved_cost_eur'] == .3
        assert (await db.get(BillingOperation, op_id)).status == 'cancelled'
        for previous_id in previous_ids:
            assert (await db.get(Assignment, previous_id)).status == 'cancelled'
        assert len(list((await db.execute(select(Assignment).where(
            Assignment.task_id == task_id, Assignment.status == 'active'))).scalars())) == 1
        quote = await db.scalar(select(Quote).where(Quote.job_id == job_id))
        assert quote.status == 'accepted' and float(quote.total) == 33
        assert await db.scalar(select(AuditLog.id).where(AuditLog.action == 'task.reassigned'))
    assert await billing_worker.run_once(market.db, execution=True) is False
    submission = await request(market, 'POST', f'/tasks/{task_id}/submissions', role='admin', expected=201,
        json={'task_id': str(task_id), 'agent_id': str(human_id),
              'assignment_id': response['assignment_id'], 'output_json': {'result': 'Finished by hand'},
              'summary': 'Completed'})
    validation = await request(market, 'POST', f"/mcp/validate-submission/{submission['id']}", role='admin')
    assert validation['decision'] == 'human_review_required'
    await request(market, 'POST', f"/submissions/{submission['id']}/reviews", role='admin', expected=403,
        json={'submission_id': submission['id'], 'decision': 'approved'})
    await request(market, 'POST', f"/submissions/{submission['id']}/reviews", role='owner', expected=201,
        json={'submission_id': submission['id'], 'decision': 'approved'})
    async with market.db() as db:
        assert (await db.get(Job, job_id)).status == 'client_review'


async def test_reassignment_cannot_reset_exhausted_platform_budget(market):
    _, task_id, _, platform_id, _, _ = await blocked_task(market)
    await request(market, 'POST', f'/tasks/{task_id}/reassign', role='admin', expected=409,
                  json={'agent_id': str(platform_id), 'reason': 'Retry model'})
    async with market.db() as db:
        task = await db.get(Task, task_id)
        assert task.input_spec_json['_execution_calls'] == 3
        assert task.input_spec_json.get('_execution_generation', 0) == 0


async def test_platform_repair_queues_new_generation_with_old_spend(market):
    _, task_id, _, platform_id, op_id, _ = await blocked_task(market, exhausted=False)
    response = await request(market, 'POST', f'/tasks/{task_id}/reassign', role='admin',
                             json={'agent_id': str(platform_id), 'reason': 'Credentials repaired'})
    assert response['execution_queued'] is True
    async with market.db() as db:
        task = await db.get(Task, task_id)
        assert task.input_spec_json['_execution_calls'] == 1
        assert task.input_spec_json['_execution_reserved_cost_eur'] == .1
        assert (await db.get(BillingOperation, op_id)).status == 'cancelled'
        queued = await db.scalar(select(BillingOperation).where(
            BillingOperation.entity_id == str(task_id), BillingOperation.status == 'pending'))
        assert queued.payload['generation'] == 1


@pytest.mark.parametrize('price, expected', [(9.7, 200), (9.8, 409)])
async def test_external_repair_requires_priced_work_within_unspent_budget(market, price, expected):
    from app.models.bid import Bid
    _, task_id, _, _, _, _ = await blocked_task(market)
    async with market.db() as db:
        bid = Bid(id=uuid.uuid4(), task_id=task_id, agent_id=market.agent.id,
                  price=price, eta_hours=1, confidence_score=1, status='submitted')
        db.add(bid)
        await db.commit()
    response = await request(market, 'POST', f'/tasks/{task_id}/reassign', role='admin', expected=expected,
        json={'agent_id': str(market.agent.id), 'reason': 'Use agreed external executor'})
    if expected == 200:
        assert response['execution_queued'] is False
        async with market.db() as db:
            assignment = await db.get(Assignment, uuid.UUID(response['assignment_id']))
            assert assignment.bid_id == bid.id


@pytest.mark.parametrize('case, expected', [('non_admin', 403), ('frozen', 402),
    ('inactive_agent', 409), ('inactive_owner', 409), ('submitted', 409),
    ('approved', 409), ('running', 409), ('unpriced_external', 409), ('settlement', 409)])
async def test_repair_rejects_unsafe_state_without_mutation(market, case, expected):
    job_id, task_id, human_id, _, op_id, _ = await blocked_task(market)
    async with market.db() as db:
        if case == 'frozen':
            funding = await db.scalar(select(JobFunding).where(JobFunding.job_id == job_id))
            funding.status = 'refund_pending'
        elif case == 'inactive_agent':
            (await db.get(Agent, human_id)).status = 'inactive'
        elif case == 'inactive_owner':
            from app.models.user import User
            (await db.get(User, market.users['admin'].id)).is_active = False
        elif case in ('submitted', 'approved'):
            (await db.get(Task, task_id)).status = case
        elif case == 'running':
            (await db.get(BillingOperation, op_id)).status = 'processing'
        elif case == 'settlement':
            from app.models.payment import PaymentRecord
            db.add(PaymentRecord(job_id=job_id, task_id=task_id,
                client_user_id=market.users['owner'].id, developer_user_id=market.users['developer'].id,
                gross_amount=11, net_amount=10, platform_fee=1, currency='EUR',
                payment_status='pending', provider='stripe_connect'))
        await db.commit()
    # Inactive-owner case uses a second active admin caller so target validation is exercised.
    if case == 'inactive_owner':
        async with market.db() as db:
            from app.models.user import User
            (await db.get(User, market.users['stranger'].id)).role = 'admin'
            await db.commit()
    role = 'owner' if case == 'non_admin' else 'stranger' if case == 'inactive_owner' else 'admin'
    target = market.agent.id if case == 'unpriced_external' else human_id
    await request(market, 'POST', f'/tasks/{task_id}/reassign', role=role, expected=expected,
                  json={'agent_id': str(target), 'reason': 'Repair'})
    async with market.db() as db:
        task = await db.get(Task, task_id)
        assert task.input_spec_json['_execution_calls'] == 3
        assert task.input_spec_json.get('_execution_generation', 0) == 0
