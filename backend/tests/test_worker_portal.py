"""Owner and reviewer portals preserve account identity and data boundaries."""
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.models import Job, PaymentRecord
from test_lifecycle_integration import market, request
from test_human_tasks import contract, create, human_enabled, principal


async def test_missions_separate_requester_and_worker_and_page_with_total(market):
    p = await principal(market)
    for title in ('First mission', 'Second mission'):
        await create(market, contract(p['id'], title=title))
    first = await request(market, 'GET', '/worker-portal/missions?view=request&limit=1')
    second = await request(market, 'GET', '/worker-portal/missions?view=request&limit=1&skip=1')
    assert first['total'] == 2 and len(first['items']) == 1
    assert first['items'][0]['task_id'] != second['items'][0]['task_id']
    assert (await request(market, 'GET', '/worker-portal/missions?view=work'))['items'] == []
    assert (await request(market, 'GET', '/worker-portal/missions?view=request', role='stranger'))['total'] == 0
    await request(market, 'GET', '/worker-portal/missions?view=review', expected=403)
    assert (await request(market, 'GET', '/worker-portal/missions?view=review', role='admin'))['total'] == 2


async def test_client_can_read_only_own_earnings_in_neutral_contract(market):
    async with market.db() as db:
        job = Job(id=uuid.uuid4(), client_user_id=market.users['stranger'].id,
                  title='Paid review', raw_description='A paid review', currency='EUR', budget_min=0, budget_max=11)
        db.add(job)
        await db.flush()
        for who in ('owner', 'developer'):
            db.add(PaymentRecord(job_id=job.id, client_user_id=market.users['stranger'].id,
                developer_user_id=market.users[who].id, gross_amount=Decimal('11'),
                platform_fee=Decimal('1'), net_amount=Decimal('10'), currency='EUR',
                payment_status='paid', provider='stripe', payout_error='internal secret'))
        await db.commit()
    result = await request(market, 'GET', '/worker-portal/earnings?limit=1')
    assert result['total'] == 1 and result['items'][0]['net_amount_minor'] == 1000
    assert result['by_currency'] == [{'currency': 'EUR', 'paid_minor': 1000, 'pending_minor': 0}]
    assert 'stripe' not in str(result) and 'internal secret' not in str(result)
    assert (await request(market, 'GET', '/worker-portal/earnings', role='stranger'))['total'] == 0


async def test_worker_review_list_is_admin_only_and_cannot_attest_self(market):
    profile = await request(market, 'PUT', '/workers/me', json={'country':'FR',
        'languages':['fr'], 'timezone':'Europe/Paris', 'skills':['translation'],
        'available':True, 'data_consent':True})
    await request(market, 'GET', '/worker-portal/workers', expected=403)
    rows = await request(market, 'GET', '/worker-portal/workers?limit=1', role='admin')
    assert rows['total'] == 1 and rows['items'][0]['user_id'] == profile['user_id']
    assert rows['items'][0]['full_name'] == 'owner'
    await request(market, 'POST', f"/workers/{profile['user_id']}/verify", expected=403,
        json={'verification_status':'verified','attested_skills':['translation'],'notes':'Self review denied'})


    admin_profile = await request(market, 'PUT', '/workers/me', role='admin', json={'country':'FR',
        'languages':['fr'], 'timezone':'Europe/Paris', 'skills':['translation'],
        'available':True, 'data_consent':True})
    await request(market, 'POST', f"/workers/{admin_profile['user_id']}/verify", role='admin', expected=403,
        json={'verification_status':'verified','attested_skills':['translation'],'notes':'Self review denied'})
    unchanged = await request(market, 'GET', '/workers/me', role='admin')
    assert unchanged['verification_status'] == 'pending' and unchanged['attested_skills'] == []


async def test_client_creates_agent_and_reads_only_own_mandates_without_changing_role(market):
    agent = await request(market, 'POST', '/worker-portal/agents', expected=201,
        json={'name':'My research assistant','endpoint_url':'https://example.test/agent'})
    assert agent['developer_user_id'] == str(market.users['owner'].id)
    assert (await request(market, 'GET', '/auth/me'))['role'] == 'client'
    p = await principal(market)
    d = await request(market, 'POST', f"/principals/{p['id']}/delegations", expected=201,
        json={'agent_id':agent['id'], 'max_amount_minor':2200, 'categories':['translation_review'],
              'expires_at':(datetime.now(timezone.utc)+timedelta(days=1)).isoformat()})
    rows = await request(market, 'GET', '/worker-portal/delegations')
    assert rows['items'][0]['id'] == d['id'] and 'access_token' not in str(rows)
    assert (await request(market, 'GET', '/worker-portal/delegations', role='stranger'))['items'] == []
    scoped = await market.http.get('/worker-portal/agents', headers={'Authorization': 'Bearer ' + d['access_token']})
    assert scoped.status_code == 401
    await request(market, 'POST', '/worker-portal/agents', expected=422,
        json={'name':'llm-untrusted','endpoint_url':'https://example.test/agent'})
    await request(market, 'POST', '/worker-portal/agents', expected=422,
        json={'name':'No second profile','executor_kind':'human'})


async def test_opportunities_count_excludes_expired_and_private_data_before_paging(market):
    from app.models import Task
    from test_human_tasks import funded_human, verified_worker
    # Client worker profiles use the same user account and can browse paid work.
    await verified_worker(market, role='stranger')
    first = await funded_human(market)
    second = await funded_human(market)
    async with market.db() as db:
        expired = await db.get(Task, uuid.UUID(first['task_id']))
        expired.human_contract_json = {**expired.human_contract_json,
            'deadline':'2000-01-01T00:00:00+00:00'}
        await db.commit()
    result = await request(market, 'GET', '/worker-portal/opportunities?limit=1', role='stranger')
    assert result['total'] == 1 and result['items'][0]['task_id'] == second['task_id']
    assert 'instructions' not in result['items'][0]
    assert 'location' not in result['items'][0]
    assert 'principal_id' not in result['items'][0]


async def test_admin_human_overview_is_protected_and_counts_only_human_work(market):
    from app.models import Task
    from app.models.human import WorkerProfile

    path = '/worker-portal/admin/overview'
    for role in ('owner', 'developer', 'stranger'):
        await request(market, 'GET', path, role=role, expected=403)
    anonymous = await market.http.get(path)
    assert anonymous.status_code == 401
    assert await request(market, 'GET', path, role='admin') == {
        'human_missions': 0, 'pending_publication': 0, 'active_human_missions': 0,
        'worker_profiles': 0, 'pending_worker_verification': 0,
    }
    p = await principal(market)
    created = [await create(market, contract(p['id'], title=f'Mission {i}')) for i in range(5)]
    for role in ('owner', 'stranger'):
        await request(market, 'PUT', '/workers/me', role=role, json={
            'country': 'FR', 'languages': ['fr'], 'timezone': 'Europe/Paris',
            'skills': ['translation'], 'available': True, 'data_consent': True,
        })
    async with market.db() as db:
        for mission, status, policy in zip(created,
                ['pending', 'assigned', 'in_progress', 'approved', 'cancelled'],
                ['pending', 'approved', 'approved', 'approved', 'pending']):
            task = await db.get(Task, uuid.UUID(mission['task_id']))
            task.status, task.human_policy_status = status, policy
        # A normal AI task with JSON null must never count as human work.
        ai_job = Job(client_user_id=market.users['owner'].id, title='AI project',
                     raw_description='Original AI project', currency='EUR', budget_min=0, budget_max=10)
        db.add(ai_job)
        await db.flush()
        db.add(Task(job_id=ai_job.id, title='AI task', description='AI task',
                    task_type='writing', human_contract_json=None, status='assigned'))
        worker = await db.get(WorkerProfile, market.users['stranger'].id)
        worker.verification_status = 'verified'
        await db.commit()
    overview = await request(market, 'GET', path, role='admin')
    assert overview == {
        'human_missions': 5, 'pending_publication': 1, 'active_human_missions': 2,
        'worker_profiles': 2, 'pending_worker_verification': 1,
    }
    assert 'principal_id' not in str(overview) and 'email' not in str(overview)
    review = await request(market, 'GET', '/worker-portal/missions?view=review', role='admin')
    assert review['total'] == overview['pending_publication']
    assert [row['task_id'] for row in review['items']] == [created[0]['task_id']]


async def test_human_mission_list_excludes_ai_tasks_with_json_null(market):
    from app.models import Task
    p = await principal(market)
    mission = await create(market, contract(p['id']))
    async with market.db() as db:
        job = Job(client_user_id=market.users['owner'].id, title='AI project',
                  raw_description='Original AI project', currency='EUR', budget_min=0, budget_max=10)
        db.add(job)
        await db.flush()
        db.add(Task(job_id=job.id, title='AI task', description='AI task',
                    task_type='writing', human_contract_json=None))
        await db.commit()
    contracts = await request(market, 'GET', '/human-tasks')
    assert [row['task_id'] for row in contracts['items']] == [mission['task_id']]
    result = await request(market, 'GET', '/worker-portal/missions?view=request')
    assert result['total'] == 1
    assert [row['task_id'] for row in result['items']] == [mission['task_id']]
