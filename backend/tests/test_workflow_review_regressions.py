"""Independent regressions for finalized DAG, frozen quotes and scoped amendments."""
import asyncio
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy import func, select, text
from test_human_tasks import contract, create, principal, verified_worker
from test_lifecycle_integration import market as market
from test_lifecycle_integration import request
from test_task_execution import setup_job

from app.core.config import settings
from app.models import Assignment, Job, Quote, Submission, Task
from app.models.billing import BillingOperation, JobFunding
from app.models.human import Delegation, HumanTaskRequest
from app.models.workflow_extension import TaskDependency


@pytest.fixture(autouse=True)
def workflow_enabled(monkeypatch):
    monkeypatch.setattr(settings, 'HUMAN_TASKS_ENABLED', True)


@pytest.mark.parametrize('ledger', ['stripe', 'legacy_manual'])
async def test_legacy_ai_assignment_cannot_bypass_unapproved_prerequisite(market, ledger):
    job_id, tasks = await setup_job(market, routes=('llm', 'llm'))
    async with market.db() as db:
        job = await db.get(Job, job_id)
        job.billing_mode = ledger
        db.add(TaskDependency(task_id=tasks[1], depends_on_task_id=tasks[0]))
        await db.commit()
    await request(market, 'POST', f'/tasks/{tasks[1]}/assign', role='admin', expected=409,
                  params={'agent_id': str(market.agent.id)})
    async with market.db() as db:
        assert (await db.get(Task, tasks[1])).status == 'open_for_bids'
        assert (await db.scalars(select(Assignment))).all() == []
        assert (await db.scalars(select(BillingOperation).where(BillingOperation.kind == 'execute_task'))).all() == []


@pytest.mark.parametrize('ledger', ['stripe', 'legacy_manual'])
async def test_assigned_ai_submission_and_review_recheck_reopened_prerequisite(market, ledger):
    job_id, tasks = await setup_job(market, routes=('llm', 'llm'))
    async with market.db() as db:
        (await db.get(Job, job_id)).billing_mode = ledger
        parent = await db.get(Task, tasks[0])
        parent.status = 'approved'
        db.add(TaskDependency(task_id=tasks[1], depends_on_task_id=tasks[0]))
        await db.commit()
    assignment = await request(market, 'POST', f'/tasks/{tasks[1]}/assign', role='admin',
                               params={'agent_id': str(market.agent.id)})
    body = {'task_id': str(tasks[1]), 'agent_id': str(market.agent.id),
            'assignment_id': assignment['assignment_id'], 'summary': 'Analysis',
            'output_json': {'result': 'Analysis of the approved report'}}
    async with market.db() as db:
        (await db.get(Task, tasks[0])).status = 'validation_failed'
        await db.commit()
    await request(market, 'POST', f'/tasks/{tasks[1]}/submissions', role='developer', expected=409, json=body)
    async with market.db() as db:
        assert (await db.scalars(select(Submission))).all() == []
        (await db.get(Task, tasks[0])).status = 'approved'
        await db.commit()
    submission = await request(market, 'POST', f'/tasks/{tasks[1]}/submissions', role='developer', expected=201, json=body)
    async with market.db() as db:
        (await db.get(Task, tasks[0])).status = 'validation_failed'
        await db.commit()
    await request(market, 'POST', f"/submissions/{submission['id']}/reviews", expected=409,
                  json={'submission_id': submission['id'], 'decision': 'approved'})
    async with market.db() as db:
        assert (await db.get(Task, tasks[1])).status == 'submitted'
        assert (await db.get(Submission, uuid.UUID(submission['id']))).status == 'submitted'
        assert (await db.get(Assignment, uuid.UUID(assignment['assignment_id']))).status == 'active'


@pytest.mark.parametrize('funding_status', ['creating', 'checkout_pending', 'paid'])
async def test_mixed_quote_stays_frozen_through_all_repricing_entrypoints(market, monkeypatch, funding_status):
    from app.services import quote_service
    monkeypatch.setattr(quote_service, 'pricing_provider', lambda: {
        'provider': 'openai', 'selected_model': settings.PRICING_DEFAULT_MODEL,
        'base_url': 'https://api.openai.com/v1'})
    p = await principal(market)
    human = await create(market, contract(p['id']))
    await request(market, 'POST', f"/jobs/{human['parent_job_id']}/steps", expected=201, json={
        'title': 'Analyze the verified report', 'instructions': 'Summarize the verified report.',
        'task_type': 'research', 'depends_on': [human['task_id']]})
    review = {'authorizations_verified': True, 'qualifications_verified': True, 'notes': 'Independent review'}
    await request(market, 'POST', f"/human-tasks/{human['task_id']}/publish", role='admin', json=review)
    job_id = uuid.UUID(human['parent_job_id'])
    async with market.db() as db:
        quote = await db.scalar(select(Quote).where(Quote.job_id == job_id))
        assert quote.valid_until <= datetime.fromisoformat(human['deadline'])
        original_quote = (quote.id, quote.status, quote.total, quote.valid_until)
        original_budgets = dict((await db.execute(select(Task.id, Task.budget).where(Task.job_id == job_id))).all())
        db.add(JobFunding(id=uuid.uuid4(), job_id=job_id, quote_id=quote.id,
            client_user_id=market.users['owner'].id, amount_minor=int(quote.total*100),
            currency='eur', livemode=False, status=funding_status))
        await db.commit()
    await request(market, 'POST', f"/human-tasks/{human['task_id']}/publish", role='admin', expected=409, json=review)
    await request(market, 'POST', f'/jobs/{job_id}/quote/refresh', expected=409)
    async with market.db() as db:
        with pytest.raises(HTTPException) as failure:
            await quote_service.create_quote_for_job(db, job_id)
        assert failure.value.status_code == 409
        await db.rollback()
    async with market.db() as db:
        quotes = (await db.scalars(select(Quote).where(Quote.job_id == job_id))).all()
        assert len(quotes) == 1
        quote = quotes[0]
        assert (quote.id, quote.status, quote.total, quote.valid_until) == original_quote
        budgets = dict((await db.execute(select(Task.id, Task.budget).where(Task.job_id == job_id))).all())
        assert budgets == original_budgets


@pytest.mark.parametrize('other_principal', [False, True])
async def test_scoped_amendment_binding_is_checked_before_budget_reservation(market, other_principal):
    p = await principal(market, role='developer')
    other = await request(market, 'POST', '/principals', role='developer', expected=201,
        json={'kind': 'organization', 'display_name': 'Another responsibility'}) if other_principal else p
    async def mandate(principal_id):
        return await request(market, 'POST', f'/principals/{principal_id}/delegations', role='developer', expected=201,
            json={'agent_id': str(market.agent.id), 'max_amount_minor': 2200,
                  'categories': ['translation_review'], 'expires_at': (datetime.now(UTC)+timedelta(hours=1)).isoformat()})
    a, b = await mandate(p['id']), await mandate(other['id'])
    def body(principal_id, delegation):
        return contract(principal_id, requester_type='AGENT_REQUESTER',
                        requesting_agent_id=str(market.agent.id), delegation_id=delegation['id'])
    headers_a = {'Authorization': 'Bearer '+a['access_token'], 'Idempotency-Key': 'original-bound'}
    original = await market.http.post('/human-tasks', headers=headers_a, json=body(p['id'], a))
    assert original.status_code == 201, original.text
    original = original.json()
    path = f"/jobs/{original['parent_job_id']}/amendments"
    denied = await market.http.post(path, json=body(other['id'], b), headers={
        'Authorization': 'Bearer '+b['access_token'], 'Idempotency-Key': 'wrong-original'})
    assert denied.status_code == 403, denied.text
    async with market.db() as db:
        assert (await db.get(Delegation, uuid.UUID(b['id']))).reserved_amount_minor == 0
        assert await db.scalar(select(func.count()).select_from(Job)) == 1
        assert await db.scalar(select(func.count()).select_from(HumanTaskRequest)) == 1
    headers = {**headers_a, 'Idempotency-Key': 'valid-amendment'}
    amendment_body = body(p['id'], a)
    first = await market.http.post(path, json=amendment_body, headers=headers)
    assert first.status_code == 201, first.text
    replay = await market.http.post(path, json=amendment_body, headers=headers)
    assert replay.status_code == 201 and replay.json()['task_id'] == first.json()['task_id']
    assert first.json()['parent_job_id'] != original['parent_job_id']
    async with market.db() as db:
        assert (await db.get(Delegation, uuid.UUID(a['id']))).reserved_amount_minor == 2200
        assert await db.scalar(select(func.count()).select_from(Job)) == 2
        assert (await db.get(Job, uuid.UUID(original['parent_job_id']))).metadata_json is None
        assert (await db.scalars(select(JobFunding))).all() == []


async def test_concurrent_opposing_dependency_edits_cannot_commit_a_cycle(market):
    p = await principal(market)
    first = await create(market, contract(p['id']))
    second = await create(market, contract(p['id'], parent_job_id=first['parent_job_id']))
    responses = await asyncio.gather(*[
        market.http.put(f"/human-tasks/{child}/dependencies", headers=market.headers['owner'],
                        json={'depends_on': [parent]})
        for child, parent in ((first['task_id'], second['task_id']), (second['task_id'], first['task_id']))])
    assert sorted(response.status_code for response in responses) == [200, 422]
    async with market.db() as db:
        assert await db.scalar(select(func.count()).select_from(TaskDependency)) == 1


@pytest.mark.parametrize('composition', ['human', 'mixed'])
async def test_current_quote_follows_serialized_creation_not_transaction_start_order(market, monkeypatch, composition):
    from app.services import quote_service
    p = await principal(market)
    human = await create(market, contract(p['id']))
    if composition == 'mixed':
        monkeypatch.setattr(quote_service, 'pricing_provider', lambda: {
            'provider': 'openai', 'selected_model': settings.PRICING_DEFAULT_MODEL,
            'base_url': 'https://api.openai.com/v1'})
        await request(market, 'POST', f"/jobs/{human['parent_job_id']}/steps", expected=201, json={
            'title': 'Analyze the verified report', 'instructions': 'Summarize the verified report.',
            'task_type': 'research', 'depends_on': [human['task_id']]})
    await request(market, 'POST', f"/human-tasks/{human['task_id']}/publish", role='admin', json={
        'authorizations_verified': True, 'qualifications_verified': True, 'notes': 'Independent review'})
    job_id = uuid.UUID(human['parent_job_id'])
    # Auth/database work can begin before another request obtains the job lock.
    # PostgreSQL now() keeps that earlier timestamp for the whole transaction.
    async with market.db() as earlier_transaction:
        await earlier_transaction.execute(text('SELECT 1'))
        async with market.db() as later_transaction:
            replaced = await quote_service.create_quote_for_job(later_transaction, job_id)
            await later_transaction.commit()
        expected = await quote_service.create_quote_for_job(earlier_transaction, job_id)
        await earlier_transaction.commit()
    async with market.db() as db:
        actual = await quote_service.current_quote(db, job_id)
        assert actual.id == expected.id, (
            f'Current quote selected retired {replaced.id} ({actual.status}) '
            f'instead of the last serialized quote {expected.id}')
        assert actual.status == 'pending_client'
        for terminal_status in ('rejected', 'expired'):
            actual.status = terminal_status
            await db.commit()
            current = await quote_service.current_quote(db, job_id)
            assert current.id == expected.id and current.status == terminal_status
        current.status = 'pending_client'
        db.add(JobFunding(id=uuid.uuid4(), job_id=job_id, quote_id=current.id,
            client_user_id=market.users['owner'].id, amount_minor=int(current.total*100),
            currency='eur', livemode=False, status='paid'))
        await quote_service.accept_quote(db, current)
        await db.commit()
    await verified_worker(market)
    await request(market, 'POST', f"/human-tasks/{human['task_id']}/claim", role='developer')
