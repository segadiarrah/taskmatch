"""Human execution security and lifecycle against disposable PostgreSQL."""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from app.core.config import settings
from app.models import Job, Task
from test_lifecycle_integration import market, request


@pytest.fixture(autouse=True)
def human_enabled(monkeypatch):
    if 'HUMAN_TASKS_ENABLED' in type(settings).model_fields:
        monkeypatch.setattr(settings, 'HUMAN_TASKS_ENABLED', True)


def contract(principal_id, **changes):
    return {'schema_version': 'tm.human-task.v1', 'principal_id': principal_id,
            'requester_type': 'HUMAN_REQUESTER', 'title': 'Review a translation',
            'objective': 'Find translation errors', 'instructions': 'Read the supplied text.',
            'task_category': 'translation_review', 'execution_mode': 'remote',
            'required_capabilities': ['translation'], 'language': 'fr',
            'deadline': (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
            'expected_duration': 30, 'budget': {'amount_minor': 1100, 'currency': 'EUR'},
            'evidence_requirements': ['report'], 'authorizations': ['data_owner_consent'],
            **changes}


async def principal(m, role='owner'):
    return await request(m, 'POST', '/principals', role=role, expected=201,
                         json={'kind': 'individual', 'display_name': 'Responsible customer'})


async def create(m, body, key=None, role='owner', expected=201):
    response = await m.http.post('/human-tasks', json=body,
        headers={**m.headers[role], 'Idempotency-Key': key or str(uuid.uuid4())})
    assert response.status_code == expected, response.text
    return response.json()


async def test_schema_and_taxonomy_are_real_contracts(market):
    schema = await request(market, 'GET', '/human-tasks/schema')
    assert schema['properties']['schema_version']['const'] == 'tm.human-task.v1'
    taxonomy = await request(market, 'GET', '/human-tasks/taxonomy')
    assert taxonomy['version'] == 'tm.taxonomy.v1'
    assert any(x['execution_mode'] == 'physical' for x in taxonomy['categories'])


async def test_profile_is_free_idempotent_and_does_not_change_account_role(market):
    body = {'country': 'FR', 'languages': ['fr'], 'timezone': 'Europe/Paris',
            'skills': ['translation'], 'available': True, 'data_consent': True}
    first = await request(market, 'PUT', '/workers/me', json=body)
    second = await request(market, 'PUT', '/workers/me', json=body)
    assert first['agent_id'] == second['agent_id']
    assert first['verification_status'] == 'pending' and first['payment_eligible'] is False
    assert (await request(market, 'GET', '/auth/me'))['role'] == 'client'
    await request(market, 'PUT', '/workers/me', expected=422,
                  json={**body, 'verification_status': 'verified'})


async def test_creation_reuses_task_job_and_idempotency_is_content_bound(market):
    p = await principal(market)
    body = contract(p['id'])
    first = await create(market, body, key='replay-key')
    assert (await create(market, body, key='replay-key'))['task_id'] == first['task_id']
    await create(market, {**body, 'title': 'Changed'}, key='replay-key', expected=409)
    async with market.db() as db:
        task = await db.get(Task, uuid.UUID(first['task_id']))
        assert task.status == 'pending' and task.human_policy_status == 'pending'
        assert (await db.get(Job, task.job_id)).client_user_id == market.users['owner'].id
    await create(market, body, role='stranger', expected=403)
    await request(market, 'POST', f"/human-tasks/{first['task_id']}/publish", expected=403)


@pytest.mark.parametrize('changes', [
    {'task_category': 'surveillance'}, {'execution_mode': 'physical'},
    {'requester_type': 'AGENT_REQUESTER'}, {'budget': {'amount_minor': -1, 'currency': 'EUR'}},
    {'budget': {'amount_minor': 1100.5, 'currency': 'EUR'}},
    {'budget': {'amount_minor': 1100, 'currency': 'USD'}}, {'authorizations': []},
    {'required_capabilities': []}, {'deadline': '2000-01-01T00:00:00Z'},
])
async def test_invalid_or_unauthorized_contract_rejected(market, changes):
    p = await principal(market)
    await create(market, contract(p['id'], **changes), expected=422)


async def test_delegation_budget_concurrency_replay_and_revocation(market):
    p = await principal(market, role="developer")
    d = await request(market, 'POST', f"/principals/{p['id']}/delegations", expected=201, role="developer",
        json={'agent_id': str(market.agent.id), 'max_amount_minor': 1100,
              'categories': ['translation_review'],
              'expires_at': (datetime.now(timezone.utc)+timedelta(hours=1)).isoformat()})
    headers = {'Authorization': 'Bearer '+d['access_token'], 'Idempotency-Key': 'agent-1'}
    body = contract(p['id'], requester_type='AGENT_REQUESTER', requesting_agent_id=str(market.agent.id), delegation_id=d['id'])
    a, b = await asyncio.gather(*[market.http.post('/human-tasks', json=body, headers=headers) for _ in range(2)])
    assert a.status_code == b.status_code == 201
    assert a.json()['task_id'] == b.json()['task_id']
    denied = await market.http.get('/auth/me', headers=headers)
    assert denied.status_code == 401
    denied = await market.http.post('/human-tasks', json=body, headers={**headers, 'Idempotency-Key': 'agent-2'})
    assert denied.status_code == 409
    await request(market, 'DELETE', f"/principals/{p['id']}/delegations/{d['id']}", role="developer")
    assert (await market.http.get('/human-tasks/'+a.json()['task_id'], headers=headers)).status_code == 403


async def test_unfunded_and_unverified_workers_cannot_claim(market):
    p = await principal(market)
    t = await create(market, contract(p['id']))
    await request(market, 'POST', f"/human-tasks/{t['task_id']}/publish", role='admin',
                  json={'authorizations_verified': True, 'qualifications_verified': True, 'notes': 'Owner consent checked'})
    await request(market, 'POST', f"/human-tasks/{t['task_id']}/claim", role='developer', expected=409)
    # Legacy assign/bid endpoints must not bypass Human Tasks eligibility.
    async with market.db() as db:
        job = await db.get(Job, uuid.UUID(t['parent_job_id']))
        job.billing_mode = 'legacy_manual'
        await db.commit()
    await request(market, 'POST', f"/jobs/{t['parent_job_id']}/quote/accept")
    await request(market, 'POST', f"/tasks/{t['task_id']}/assign?agent_id={market.agent.id}", role='admin', expected=409)


async def test_flag_blocks_mutation(market, monkeypatch):
    monkeypatch.setattr(settings, 'HUMAN_TASKS_ENABLED', False)
    await request(market, 'POST', '/principals', expected=503,
                  json={'kind':'individual','display_name':'Customer'})


async def funded_human(m):
    from app.models import Quote
    from app.services.quote_service import accept_quote
    p = await principal(m)
    t = await create(m, contract(p['id']))
    await request(m, 'POST', f"/human-tasks/{t['task_id']}/publish", role='admin',
        json={'authorizations_verified': True, 'qualifications_verified': True, 'notes':'Consent and scope checked'})
    async with m.db() as db:
        job = await db.get(Job, uuid.UUID(t['parent_job_id']))
        job.billing_mode = 'legacy_manual'  # isolated lifecycle fixture; never a live payment
        q = await db.scalar(select(Quote).where(Quote.job_id == job.id))
        assert int(q.total*100) <= 1100 and q.subtotal == 10
        await accept_quote(db, q)
        await db.commit()
    return t


async def verified_worker(m, role='developer'):
    from app.models.billing import StripeConnectAccount
    profile = await request(m, 'PUT', '/workers/me', role=role,
        json={'country':'FR','languages':['fr'],'timezone':'Europe/Paris','skills':['translation'],
              'available':True, 'data_consent':True})
    await request(m, 'POST', f"/workers/{m.users[role].id}/verify", role='admin',
        json={'verification_status':'verified','attested_skills':['translation'], 'notes':'Identity verified independently'})
    async with m.db() as db:
        db.add(StripeConnectAccount(user_id=m.users[role].id, account_id='acct_'+role,
                                   transfers_enabled=True, payouts_enabled=True, livemode=False))
        await db.commit()
    return profile


async def test_human_cycle_concurrent_claim_evidence_review_and_result(market):
    t = await funded_human(market)
    await verified_worker(market)
    await verified_worker(market, 'outsider')
    a,b = await asyncio.gather(*[market.http.post(f"/human-tasks/{t['task_id']}/claim", headers=market.headers[r])
                                for r in ['developer','outsider']])
    assert sorted([a.status_code,b.status_code]) == [200,409]
    winner = 'developer' if a.status_code == 200 else 'outsider'
    await request(market, 'POST', f"/human-tasks/{t['task_id']}/result", role=winner, expected=422,
                  json={'summary':'Completed the review','evidence':{'wrong':'Missing report'}})
    sub = await request(market, 'POST', f"/human-tasks/{t['task_id']}/result", role=winner, expected=201,
                        json={'summary':'Completed the review','evidence':{'report':'Corrected translation'}})
    await request(market, 'POST', f"/submissions/{sub['id']}/reviews", role=winner, expected=403,
                  json={'submission_id':sub['id'], 'decision':'approved'})
    await request(market, 'POST', f"/submissions/{sub['id']}/reviews", expected=201,
                  json={'submission_id':sub['id'], 'decision':'approved'})
    result = await request(market, 'GET', f"/human-tasks/{t['task_id']}/result")
    assert result['ready'] is True and result['result']['evidence']['report'] == 'Corrected translation'
    await request(market, 'GET', f"/human-tasks/{t['task_id']}", role='stranger', expected=403)


async def test_unapproved_contract_cannot_be_funded_or_assigned_through_legacy_routes(market):
    from app.services.billing_service import require_execution_funding
    from fastapi import HTTPException
    p=await principal(market)
    t=await create(market,contract(p['id']))
    async with market.db() as db:
        job=await db.get(Job,uuid.UUID(t['parent_job_id']))
        job.billing_mode='legacy_manual'
        job.status='bidding'
        task=await db.get(Task,uuid.UUID(t['task_id']))
        task.status='open_for_bids'
        await db.commit()
        with pytest.raises(HTTPException) as error:
            await require_execution_funding(db,job)
        assert error.value.status_code==409
    await request(market,'POST',f"/tasks/{t['task_id']}/assign?agent_id={market.agent.id}",role='admin',expected=409)
    await request(market,'PUT',f"/tasks/{t['task_id']}",role='admin',expected=409,json={'title':'Changed'})


async def test_other_account_agent_cannot_be_mandated(market):
    p = await principal(market)
    await request(market, 'POST', f"/principals/{p['id']}/delegations", expected=403,
        json={'agent_id':str(market.agent.id), 'max_amount_minor':1100,
              'categories':['translation_review'], 'expires_at':(datetime.now(timezone.utc)+timedelta(hours=1)).isoformat()})


async def test_human_job_cannot_be_submitted_to_legacy_planner(market):
    p=await principal(market)
    t=await create(market,contract(p['id']))
    await request(market,'POST',f"/jobs/{t['parent_job_id']}/submit",expected=409)
    async with market.db() as db:
        assert (await db.get(Job,uuid.UUID(t['parent_job_id']))).status=='draft'


async def test_human_contract_cannot_attach_to_unfunded_legacy_job(market):
    p=await principal(market)
    async with market.db() as db:
        job=Job(id=uuid.uuid4(),client_user_id=market.users['owner'].id,title='Historical draft',
                raw_description='Legacy',budget_min=0,budget_max=20,currency='USD',billing_mode='legacy_manual')
        db.add(job);await db.commit()
    await create(market,contract(p['id'],parent_job_id=str(job.id)),expected=409)


async def test_declared_skills_never_replace_attested_skills(market):
    from app.models.human import WorkerProfile
    t=await funded_human(market)
    await verified_worker(market)
    async with market.db() as db:
        p=await db.get(WorkerProfile,market.users['developer'].id)
        p.attested_skills=[];await db.commit()
    await request(market,'POST',f"/human-tasks/{t['task_id']}/claim",role='developer',expected=409)


async def test_legacy_submission_rejects_null_human_evidence(market):
    t=await funded_human(market)
    p=await verified_worker(market)
    claim=await request(market,'POST',f"/human-tasks/{t['task_id']}/claim",role='developer')
    await request(market,'POST',f"/tasks/{t['task_id']}/submissions",role='developer',expected=422,
        json={'task_id':t['task_id'],'agent_id':p['agent_id'],'assignment_id':claim['assignment_id'],
              'output_json':{'report':None}})


async def test_distinct_agent_requests_share_one_concurrent_spending_cap(market):
    p=await principal(market, role='developer')
    d=await request(market,'POST',f"/principals/{p['id']}/delegations",role='developer',expected=201,
        json={'agent_id':str(market.agent.id),'max_amount_minor':1100,'categories':['translation_review'],
              'expires_at':(datetime.now(timezone.utc)+timedelta(hours=1)).isoformat()})
    body=contract(p['id'],requester_type='AGENT_REQUESTER',requesting_agent_id=str(market.agent.id),delegation_id=d['id'])
    responses=await asyncio.gather(*[market.http.post('/human-tasks',json=body,headers={
        'Authorization':'Bearer '+d['access_token'],'Idempotency-Key':f'distinct-{i}'}) for i in range(2)])
    assert sorted(r.status_code for r in responses)==[201,409]
    from app.models.human import Delegation
    async with market.db() as db:
        assert (await db.get(Delegation,uuid.UUID(d['id']))).reserved_amount_minor==1100


def test_exported_schema_matches_the_runtime_contract():
    import json
    from pathlib import Path
    from app.schemas.human import HumanTaskContract
    artifact=json.loads((Path(__file__).parents[1]/'app/contracts/tm.human-task.v1.schema.json').read_text())
    artifact.pop('$schema');artifact.pop('$id')
    assert artifact==HumanTaskContract.model_json_schema()


async def test_expired_task_cannot_be_claimed_by_direct_id(market):
    t=await funded_human(market);await verified_worker(market)
    async with market.db() as db:
        task=await db.get(Task,uuid.UUID(t['task_id']))
        task.human_contract_json={**task.human_contract_json,'deadline':'2000-01-01T00:00:00+00:00'}
        await db.commit()
    await request(market,'POST',f"/human-tasks/{t['task_id']}/claim",role='developer',expected=409)


async def test_revision_does_not_expose_previous_result_as_ready(market):
    from app.models import Submission
    t=await funded_human(market);p=await verified_worker(market)
    await request(market,'POST',f"/human-tasks/{t['task_id']}/claim",role='developer')
    sub=await request(market,'POST',f"/human-tasks/{t['task_id']}/result",role='developer',expected=201,
                      json={'summary':'Translation reviewed','evidence':{'report':'Old report'}})
    async with market.db() as db:
        (await db.get(Submission,uuid.UUID(sub['id']))).status='approved'
        (await db.get(Task,uuid.UUID(t['task_id']))).status='validation_failed'
        await db.commit()
    result=await request(market,'GET',f"/human-tasks/{t['task_id']}/result")
    assert result['ready'] is False and result['result'] is None


async def test_taxonomy_and_worker_preferences_support_all_five_site_languages(market):
    taxonomy = await request(market, 'GET', '/human-tasks/taxonomy')
    for category in taxonomy['categories']:
        for language in ('en', 'fr', 'zh', 'es', 'pt'):
            assert category['labels'].get(language), (category['id'], language)
    response = await request(market, 'PUT', '/workers/me', json={
        'country': 'BR', 'languages': ['pt'], 'timezone': 'America/Sao_Paulo',
        'skills': ['translation'], 'available': True, 'desired_rate_minor': 1500,
        'service_area': 'Remote', 'mission_preferences': ['translation_review'], 'data_consent': True,
    })
    assert response['languages'] == ['pt']
    assert response['verification_status'] == 'pending'
    assert response['payment_eligible'] is False
