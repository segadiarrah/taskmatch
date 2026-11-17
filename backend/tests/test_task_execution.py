"""Durable task isolation and human ownership on a disposable PostgreSQL DB."""
import asyncio
import uuid
from datetime import timedelta
from decimal import Decimal

import pytest
from sqlalchemy import select

from app.api.v1.endpoints import jobs
from app.models.agent import Agent
from app.models.assignment import Assignment
from app.models.billing import BillingOperation, JobFunding
from app.models.job import Job
from app.models.quote import Quote, TaskQuote
from app.models.submission import Submission
from app.models.task import Task
from app.services import billing_worker, llm_service
from tests.test_lifecycle_integration import market as _market_fixture, request

market = _market_fixture

SNAPSHOT = dict(provider="openai", model="gpt-6-luna", max_input_tokens=6000,
                max_output_tokens=2000, max_attempts=3, max_cost_eur=0.30,
                per_attempt_cost_eur=0.10, fx_usd_to_eur=0.92,
                rates={"input_usd_per_million": .1, "output_usd_per_million": .5})

async def setup_job(market, routes=("llm", "llm", "llm"), *, funded=True):
    async with market.db() as db:
        sega = await db.get(type(market.users['admin']), market.users['admin'].id)
        sega.email = 'sega@taskmatch.ai'
        agent = Agent(developer_user_id=sega.id, name="OpenAI", slug="llm-openai",
                      endpoint_url="https://api.openai.com/v1", status="active")
        job = Job(client_user_id=market.users['owner'].id, title="Independent work",
                  raw_description="Three independent reports", budget_min=1, budget_max=100,
                  currency="EUR", status="in_progress", billing_mode="stripe",
                  auto_select_enabled=True)
        db.add_all([agent, job]); await db.flush()
        quote = Quote(job_id=job.id, status="accepted", currency="EUR", subtotal=30,
                      platform_fee=3, total=33, pricing_version="test")
        db.add(quote); await db.flush()
        tasks=[]
        for i, route in enumerate(routes):
            task=Task(job_id=job.id,title=f"Report {i}", description=f"Write report {i}",
                      task_type="writing",status="open_for_bids",priority=i,budget=10)
            db.add(task);await db.flush();tasks.append(task.id)
            db.add(TaskQuote(quote_id=quote.id,task_id=task.id,route=route,complexity="S",
                            task_type="writing",price=10,model_slug=SNAPSHOT['model'],
                            breakdown_json={"execution":dict(SNAPSHOT)}))
        if funded:
            db.add(JobFunding(job_id=job.id,quote_id=quote.id,client_user_id=job.client_user_id,
                              amount_minor=3300,currency="eur",livemode=False,status="paid"))
        await db.commit()
        return job.id,tasks

async def good_output(*args, **kwargs):
    return {"result":"A concrete complete report with conclusions.","summary":"Delivered"}

async def test_task_failure_keeps_siblings_and_retries_only_failed_task(market, monkeypatch):
    job_id,tasks=await setup_job(market)
    calls=[]
    async def output(system,user,**kwargs):
        calls.append(user)
        if "Report 1" in user:return None
        return await good_output()
    monkeypatch.setattr(llm_service,'execute_task_output',output,raising=False)
    await jobs._execute_job(job_id)
    async with market.db() as db:
        ops=list((await db.execute(select(BillingOperation).where(BillingOperation.kind=='execute_task'))).scalars())
        assert len(ops)==3, 'job must queue independent durable tasks'
    for _ in range(3): assert await billing_worker.run_once(market.db,execution=True)
    async with market.db() as db:
        statuses=[(await db.get(Task,t)).status for t in tasks]
        assert statuses==['approved','assigned','approved']
        assert (await db.get(Job,job_id)).status=='in_progress'
        failed=await db.scalar(select(BillingOperation).where(BillingOperation.entity_id==str(tasks[1])))
        assert failed.status=='pending'
        failed.available_at=failed.created_at-timedelta(seconds=1)
        await db.commit()
    monkeypatch.setattr(llm_service,'execute_task_output',good_output)
    assert await billing_worker.run_once(market.db,execution=True)
    async with market.db() as db:
        assert len(list((await db.execute(select(Submission))).scalars()))==3
        assert (await db.get(Job,job_id)).status=='client_review'
    assert len(calls)==3

async def test_human_assignment_works_without_llm_and_is_idempotent(market):
    job_id,tasks=await setup_job(market,('human',))
    await jobs._execute_job(job_id);await jobs._execute_job(job_id)
    assert await billing_worker.run_once(market.db,execution=True)
    async with market.db() as db:
        assignments=list((await db.execute(select(Assignment))).scalars())
        assert len(assignments)==1
        agent=await db.get(Agent,assignments[0].agent_id)
        assert agent.developer_user_id==market.users['admin'].id
        assert '/experts/' in agent.endpoint_url
        assert (await db.get(Task,tasks[0])).status=='assigned'
        assert list((await db.execute(select(Submission))).scalars())==[]
    state=await request(market,'GET',f'/tasks/{tasks[0]}/execution',role='admin')
    assert state['assignment']['can_submit'] is True
    submission=await request(market,'POST',f'/tasks/{tasks[0]}/submissions',role='admin',expected=201,json={
        'task_id':str(tasks[0]),'agent_id':str(agent.id),'assignment_id':str(assignments[0].id),
        'output_json':{'result':'The actual human work'},'summary':'Human delivery'})
    assert submission['status']=='submitted'
    # Structural checks cannot claim the human work was actually validated.
    await request(market,'POST',f"/mcp/validate-submission/{submission['id']}",role='admin')
    async with market.db() as db: assert (await db.get(Task,tasks[0])).status=='submitted'
    await request(market,'POST',f"/submissions/{submission['id']}/reviews",role='owner',expected=201,
                  json={'submission_id':submission['id'],'decision':'approved'})
    async with market.db() as db: assert (await db.get(Job,job_id)).status=='client_review'

async def test_hybrid_requires_separate_sega_review(market,monkeypatch):
    job_id,tasks=await setup_job(market,('hybrid',))
    monkeypatch.setattr(llm_service,'execute_task_output',good_output,raising=False)
    await jobs._execute_job(job_id);await billing_worker.run_once(market.db,execution=True)
    async with market.db() as db:
        task=await db.get(Task,tasks[0]);assert task.status=='submitted'
        submission=await db.scalar(select(Submission).where(Submission.task_id==task.id))
        assert submission.status=='under_review'
        assert (await db.get(Job,job_id)).status=='in_progress'
    state=await request(market,'GET',f'/tasks/{tasks[0]}/execution',role='admin')
    assert state['review_required'] is True
    assert state['reviewer_name']
    await request(market,'POST',f'/submissions/{submission.id}/reviews',role='admin',expected=201,
                  json={'submission_id':str(submission.id),'decision':'approved'})
    async with market.db() as db: assert (await db.get(Job,job_id)).status=='client_review'

async def test_funding_freeze_during_generation_discards_result(market,monkeypatch):
    job_id,tasks=await setup_job(market,('llm',))
    async def freeze(*args,**kwargs):
        async with market.db() as db:
            funding=await db.scalar(select(JobFunding).where(JobFunding.job_id==job_id))
            funding.status='refund_pending';await db.commit()
        return await good_output()
    monkeypatch.setattr(llm_service,'execute_task_output',freeze,raising=False)
    await jobs._execute_job(job_id)
    await asyncio.wait_for(billing_worker.run_once(market.db,execution=True),timeout=10)
    async with market.db() as db:
        assert list((await db.execute(select(Submission))).scalars())==[]
        op=await db.scalar(select(BillingOperation).where(BillingOperation.kind=='execute_task'))
        assert op.status=='blocked'
        assert op.payload['reserved_cost_eur']>=.1

async def test_task_lane_does_not_run_in_financial_consumer(market):
    job_id,_=await setup_job(market,('llm',))
    await jobs._execute_job(job_id)
    assert await billing_worker.run_once(market.db,execution=False) is False

async def test_exhausted_provider_budget_cannot_be_reset_by_admin_retry(market,monkeypatch):
    job_id,tasks=await setup_job(market,('llm',))
    async def unavailable(*args,**kwargs):return None
    monkeypatch.setattr(llm_service,'execute_task_output',unavailable,raising=False)
    await jobs._execute_job(job_id)
    for _ in range(3):
        assert await billing_worker.run_once(market.db,execution=True)
        async with market.db() as db:
            op=await db.scalar(select(BillingOperation).where(BillingOperation.entity_id==str(tasks[0])))
            op.available_at=op.created_at-timedelta(seconds=1);await db.commit()
    assert await billing_worker.run_once(market.db,execution=True) is False
    await request(market,'POST',f'/tasks/{tasks[0]}/retry',role='admin',expected=409)
    async with market.db() as db:
        op=await db.scalar(select(BillingOperation).where(BillingOperation.entity_id==str(tasks[0])))
        assert op.payload['reserved_cost_eur']==pytest.approx(.3)
        assert op.status=='blocked'

async def test_unfunded_human_task_is_not_assigned(market):
    job_id,_=await setup_job(market,('human',),funded=False)
    from fastapi import HTTPException
    with pytest.raises(HTTPException):await jobs._execute_job(job_id)
    async with market.db() as db:assert list((await db.execute(select(Assignment))).scalars())==[]

async def test_worker_fencing_discards_late_result(market, monkeypatch):
    job_id,tasks=await setup_job(market,('llm',))
    async def supersede(*args, **kwargs):
        async with market.db() as db:
            op=await db.scalar(select(BillingOperation).where(BillingOperation.kind=='execute_task'))
            op.attempts+=1
            await db.commit()
        return await good_output()
    monkeypatch.setattr(llm_service,'execute_task_output',supersede)
    await jobs._execute_job(job_id)
    await billing_worker.run_once(market.db,execution=True)
    async with market.db() as db:
        assert list((await db.execute(select(Submission))).scalars())==[]
        op=await db.scalar(select(BillingOperation).where(BillingOperation.kind=='execute_task'))
        assert op.attempts==2 and op.status=='processing'
        assert op.payload['reserved_cost_eur']==pytest.approx(.1)

async def test_restart_reserves_uncertain_call_before_retry(market,monkeypatch):
    from app.services import task_execution
    from app.services import billing_service as billing
    job_id,tasks=await setup_job(market,('llm',))
    async def crash(*args,**kwargs):raise asyncio.CancelledError()
    monkeypatch.setattr(llm_service,'execute_task_output',crash)
    await jobs._execute_job(job_id)
    with pytest.raises(asyncio.CancelledError):
        await billing_worker.run_once(market.db,execution=True)
    async with market.db() as db:
        op=await db.scalar(select(BillingOperation).where(BillingOperation.kind=='execute_task'))
        assert op.payload['reserved_cost_eur']==pytest.approx(.1)
        op.locked_until=billing.now()-timedelta(seconds=1);await db.commit()
    monkeypatch.setattr(llm_service,'execute_task_output',good_output)
    await billing_worker.run_once(market.db,execution=True)
    async with market.db() as db:
        op=await db.get(BillingOperation,op.id)
        assert op.status=='done'
        assert op.payload['reserved_cost_eur']==pytest.approx(.2)
        assert len(list((await db.execute(select(Submission))).scalars()))==1

async def test_concurrent_human_jobs_create_one_sega_profile(market):
    from app.services import billing_service as billing
    job_id,tasks=await setup_job(market,('human','human'))
    await jobs._execute_job(job_id)
    await asyncio.gather(billing_worker.run_once(market.db,execution=True),
                         billing_worker.run_once(market.db,execution=True))
    async with market.db() as db:
        agents=list((await db.execute(select(Agent).where(Agent.slug=='human-sega'))).scalars())
        assert len(agents)==1
        assignments=list((await db.execute(select(Assignment))).scalars())
        assert len(assignments)==2
        assert all(a.agent_id==agents[0].id for a in assignments)

async def test_human_cannot_review_own_work_or_submit_other_executors(market):
    job_id,tasks=await setup_job(market,('human',))
    await jobs._execute_job(job_id);await billing_worker.run_once(market.db,execution=True)
    state=await request(market,'GET',f'/tasks/{tasks[0]}/execution',role='admin')
    a=state['assignment']
    body={'task_id':str(tasks[0]),'agent_id':a['agent_id'],'assignment_id':a['id'],
          'output_json':{'result':'Completed human work'},'summary':'Done'}
    await request(market,'POST',f'/tasks/{tasks[0]}/submissions',role='outsider',expected=403,json=body)
    s=await request(market,'POST',f'/tasks/{tasks[0]}/submissions',role='admin',expected=201,json=body)
    await request(market,'POST',f"/submissions/{s['id']}/reviews",role='admin',expected=403,
                  json={'submission_id':s['id'],'decision':'approved'})

async def test_human_fallback_preserves_pending_reservation(market):
    job_id,tasks=await setup_job(market,('human',))
    async with market.db() as db:
        reserved=Assignment(task_id=tasks[0],agent_id=market.agent.id,status='pending')
        db.add(reserved);await db.commit()
    await jobs._execute_job(job_id);await billing_worker.run_once(market.db,execution=True)
    async with market.db() as db:
        assignments=list((await db.execute(select(Assignment))).scalars())
        assert len(assignments)==1
        assert assignments[0].status=='pending'

async def test_per_attempt_evidence_retains_failed_and_successful_outcomes(market,monkeypatch):
    job_id,tasks=await setup_job(market,('llm',))
    count=0
    async def output(*args,**kwargs):
        nonlocal count
        count+=1
        return None if count==1 else await good_output()
    monkeypatch.setattr(llm_service,'execute_task_output',output)
    await jobs._execute_job(job_id);await billing_worker.run_once(market.db,execution=True)
    async with market.db() as db:
        op=await db.scalar(select(BillingOperation).where(BillingOperation.kind=='execute_task'))
        op.available_at=op.created_at-timedelta(seconds=1);await db.commit()
    await billing_worker.run_once(market.db,execution=True)
    async with market.db() as db:
        op=await db.get(BillingOperation,op.id)
        assert [a['outcome'] for a in op.payload['attempt_log']]==['unavailable','delivered']
        assert all(a['provider']=='openai' for a in op.payload['attempt_log'])

async def test_historical_recovery_preview_is_readonly_and_requires_exact_budget_consent(market,monkeypatch):
    from app.services import providers
    job_id,tasks=await setup_job(market,('llm',))
    async with market.db() as db:
        job=await db.get(Job,job_id);job.billing_mode='legacy_manual'
        line=await db.scalar(select(TaskQuote).where(TaskQuote.task_id==tasks[0]))
        line.breakdown_json={};await db.commit()
    cfg={'provider':'openai','enabled':True,'api_key':'test','selected_model':'gpt-6-luna',
         'selected_model_available':True,'models':['gpt-6-luna'],'available_models':['gpt-6-luna'],
         'base_url':'https://api.openai.com/v1'}
    monkeypatch.setattr(providers,'get_provider',lambda provider:cfg)
    path=f'/tasks/{tasks[0]}/recovery-preview?provider=openai&model=gpt-6-luna'
    preview=await request(market,'GET',path,role='admin')
    assert preview['eligible'] is True
    async with market.db() as db:assert list((await db.execute(select(BillingOperation))).scalars())==[]
    body={'provider':'openai','model':'gpt-6-luna','quote_id':preview['quote_id'],
          'approved_max_cost_eur':0}
    await request(market,'POST',f'/tasks/{tasks[0]}/recover',role='admin',expected=409,json=body)
    body['approved_max_cost_eur']=preview['execution']['max_cost_eur']
    await request(market,'POST',f'/tasks/{tasks[0]}/recover',role='admin',json=body)
    async with market.db() as db:
        stored=await db.get(TaskQuote,line.id)
        assert stored.breakdown_json=={}, 'accepted quote must remain unchanged'
        op=await db.scalar(select(BillingOperation).where(BillingOperation.kind=='execute_task'))
        assert op.payload['execution']['model']=='gpt-6-luna'
        assert op.payload['recovery_approved_by']==str(market.users['admin'].id)

@pytest.mark.parametrize('retryable,expected', [(False,'blocked'),(True,'pending')])
async def test_provider_errors_are_classified_and_recorded_without_fake_completion(market,monkeypatch,retryable,expected):
    job_id,tasks=await setup_job(market,('llm',))
    async def failure(*args,**kwargs):
        raise llm_service.ProviderExecutionError('Provider request unavailable',retryable=retryable)
    monkeypatch.setattr(llm_service,'execute_task_output',failure)
    await jobs._execute_job(job_id);await billing_worker.run_once(market.db,execution=True)
    async with market.db() as db:
        op=await db.scalar(select(BillingOperation).where(BillingOperation.kind=='execute_task'))
        assert op.status==expected
        assert op.payload['attempt_log'][0]['outcome']==('transient_error' if retryable else 'permanent_error')
        assert list((await db.execute(select(Submission))).scalars())==[]

async def test_recovery_refuses_non_admin_non_eur_and_duplicate_approval(market,monkeypatch):
    from app.services import providers
    job_id,tasks=await setup_job(market,('llm',))
    cfg={'enabled':True,'api_key':'test','models':['gpt-6-luna'],'base_url':'https://api.openai.com/v1'}
    monkeypatch.setattr(providers,'get_provider',lambda provider:cfg)
    async with market.db() as db:
        job=await db.get(Job,job_id);job.billing_mode='legacy_manual';job.currency='USD'
        line=await db.scalar(select(TaskQuote).where(TaskQuote.task_id==tasks[0]));line.breakdown_json={}
        await db.commit()
    path=f'/tasks/{tasks[0]}/recovery-preview?provider=openai&model=gpt-6-luna'
    await request(market,'GET',path,role='owner',expected=403)
    await request(market,'GET',path,role='admin',expected=409)
    async with market.db() as db:
        job=await db.get(Job,job_id);job.currency='EUR';await db.commit()
    preview=await request(market,'GET',path,role='admin')
    body={'provider':'openai','model':'gpt-6-luna','quote_id':preview['quote_id'],
          'approved_max_cost_eur':preview['execution']['max_cost_eur']}
    await request(market,'POST',f'/tasks/{tasks[0]}/recover',role='admin',json=body)
    await request(market,'POST',f'/tasks/{tasks[0]}/recover',role='admin',expected=409,json=body)

async def test_historical_rework_inherits_approved_snapshot_without_resetting_spend(market,monkeypatch):
    from app.services import providers,task_execution
    job_id,tasks=await setup_job(market,('hybrid',))
    monkeypatch.setattr(providers,'get_provider',lambda p:{'enabled':True,'api_key':'test',
        'models':['gpt-6-luna'],'base_url':'https://api.openai.com/v1'})
    monkeypatch.setattr(llm_service,'execute_task_output',good_output)
    async with market.db() as db:
        job=await db.get(Job,job_id);job.billing_mode='legacy_manual'
        line=await db.scalar(select(TaskQuote).where(TaskQuote.task_id==tasks[0]));line.breakdown_json={}
        await db.commit()
    preview=await request(market,'GET',f'/tasks/{tasks[0]}/recovery-preview?provider=openai&model=gpt-6-luna',role='admin')
    await request(market,'POST',f'/tasks/{tasks[0]}/recover',role='admin',json={
        'provider':'openai','model':'gpt-6-luna','quote_id':preview['quote_id'],
        'approved_max_cost_eur':preview['execution']['max_cost_eur']})
    await billing_worker.run_once(market.db,execution=True)
    async with market.db() as db:
        submission=await db.scalar(select(Submission).where(Submission.task_id==tasks[0]))
    await request(market,'POST',f'/submissions/{submission.id}/reviews',role='admin',expected=201,
                  json={'submission_id':str(submission.id),'decision':'rework_requested','notes':'Please clarify the conclusion.'})
    async with market.db() as db:
        op=await db.scalar(select(BillingOperation).where(BillingOperation.kind=='execute_task')
                           .order_by(BillingOperation.created_at.desc()).limit(1))
        task=await db.get(Task,tasks[0])
        assert op.payload['execution']==preview['execution']
        assert op.payload['recovery_approved_by']==str(market.users['admin'].id)
        assert task.input_spec_json['_execution_calls']==1
        assert task.input_spec_json['_execution_reserved_cost_eur']>0
    await billing_worker.run_once(market.db,execution=True)
    async with market.db() as db:
        assert (await db.get(Task,tasks[0])).input_spec_json['_execution_calls']==2
        assert len(list((await db.execute(select(Submission))).scalars()))==2

async def test_admin_input_edit_cannot_reset_historical_execution_budget(market):
    job_id,tasks=await setup_job(market,('llm',))
    async with market.db() as db:
        job=await db.get(Job,job_id);job.billing_mode='legacy_manual'
        funding=await db.scalar(select(JobFunding).where(JobFunding.job_id==job_id));await db.delete(funding)
        task=await db.get(Task,tasks[0]);task.input_spec_json={'_execution_calls':3,
            '_execution_reserved_cost_eur':0.30,'_execution_generation':2,'customer_note':'old'}
        await db.commit()
    await request(market,'PUT',f'/tasks/{tasks[0]}',role='admin',json={'input_spec_json':{'customer_note':'new'}})
    async with market.db() as db:
        task=await db.get(Task,tasks[0])
        assert task.input_spec_json['_execution_calls']==3
        assert task.input_spec_json['_execution_reserved_cost_eur']==0.30
        assert task.input_spec_json['_execution_generation']==2
        assert task.input_spec_json['customer_note']=='new'


@pytest.mark.parametrize('oversized',[False,True])
async def test_ai_receives_approved_prerequisite_evidence_within_frozen_input_budget(market,monkeypatch,oversized):
    from app.models.workflow_extension import TaskDependency
    from app.services import task_execution
    job_id,tasks=await setup_job(market,routes=('llm','llm'))
    async with market.db() as db:
        parent=await db.get(Task,tasks[0]);parent.status='approved'
        agent=await db.scalar(select(Agent).where(Agent.slug=='llm-openai'))
        assignment=Assignment(id=uuid.uuid4(),task_id=parent.id,agent_id=agent.id,status='completed')
        db.add(assignment);await db.flush()
        db.add(Submission(task_id=parent.id,agent_id=agent.id,assignment_id=assignment.id,
            output_json={'result':'Verified field report 987'*(1000 if oversized else 1)},summary='Validated report',status='approved'))
        db.add(TaskDependency(task_id=tasks[1],depends_on_task_id=tasks[0]));await db.commit()
    calls=[]
    async def output(system,user,**kwargs):calls.append(user);return await good_output()
    monkeypatch.setattr(llm_service,'execute_task_output',output)
    await task_execution.schedule_job(job_id,market.db)
    await billing_worker.run_once(market.db,execution=True)
    if oversized:
        assert not calls
        async with market.db() as db:
            child=await db.get(Task,tasks[1])
            assert (child.input_spec_json or {}).get('_execution_calls',0)==0
    else:
        assert len(calls)==1 and 'Verified field report 987' in calls[0]
