"""Existing developer controls work on actual owned agents without profile bypasses."""
import uuid
from sqlalchemy import select
from app.models.agent import Agent, AgentCapability
from app.models.audit import AuditLog
from test_lifecycle_integration import market, request


async def test_owner_adds_removes_capability_and_audits_real_response(market):
    agent_id=str(market.agent.id)
    path=f'/agents/{agent_id}/capabilities'
    cap=await request(market,'POST',path,role='developer',expected=201,
        json={'capability_name':' Research ', 'version':'1.0','metadata_json':{'domain':'documents'}})
    assert cap['agent_id']==agent_id and cap['capability_name']=='Research'
    detail=await request(market,'GET',f'/agents/{agent_id}',role='developer')
    assert any(c['id']==cap['id'] for c in detail['capabilities'])
    await request(market,'POST',path,role='developer',expected=409,
        json={'capability_name':'research','version':'1.0'})
    await request(market,'POST',f"{path}/{cap['id']}/remove",role='developer')
    detail=await request(market,'GET',f'/agents/{agent_id}',role='developer')
    assert not any(c['id']==cap['id'] for c in detail['capabilities'])
    await request(market,'POST',f"{path}/{cap['id']}/remove",role='developer',expected=404)
    async with market.db() as db:
        actions=(await db.scalars(select(AuditLog.action).where(AuditLog.entity_id==agent_id))).all()
        assert 'add_agent_capability' in actions and 'remove_agent_capability' in actions


async def test_capability_owner_scope_role_validation_and_parent_binding(market):
    own=str(market.agent.id)
    path=f'/agents/{own}/capabilities'
    body={'capability_name':'Research'}
    await request(market,'POST',path,role='owner',expected=403,json=body)
    await request(market,'POST',path,role='outsider',expected=403,json=body)
    await request(market,'POST',path,role='developer',expected=422,json={'capability_name':'   '})
    cap=await request(market,'POST',path,role='admin',expected=201,json=body)
    other=await request(market,'POST','/agents/register',role='outsider',expected=201,
        json={'name':'Other owner executor','endpoint_url':'https://example.test/worker'})
    await request(market,'POST',f"/agents/{other['id']}/capabilities/{cap['id']}/remove",
                  role='outsider',expected=404)
    await request(market,'POST',f"{path}/{cap['id']}/remove",role='outsider',expected=403)
    assert len((await request(market,'GET',f'/agents/{own}',role='developer'))['capabilities'])==1
    await request(market,'POST',f'/agents/{uuid.uuid4()}/capabilities',role='admin',expected=404,json=body)


async def test_capabilities_cannot_bypass_human_attestation_or_platform_registry(market):
    for endpoint,slug in [('https://taskmatch.ai/experts/test','human-profile'),
                          ('https://example.test/platform','llm-platform-test')]:
        async with market.db() as db:
            agent=await db.get(Agent,market.agent.id)
            agent.endpoint_url=endpoint;agent.slug=slug
            await db.commit()
        for role in ['developer','admin']:
            await request(market,'POST',f'/agents/{market.agent.id}/capabilities',role=role,
                expected=409,json={'capability_name':'regulated-expertise'})
        async with market.db() as db:
            assert (await db.scalars(select(AgentCapability).where(AgentCapability.agent_id==market.agent.id))).all()==[]


async def test_concurrent_duplicate_capability_is_serialized(market):
    import asyncio
    path=f'/agents/{market.agent.id}/capabilities'
    anonymous=await market.http.post(path,json={'capability_name':'Analysis'})
    assert anonymous.status_code==401
    responses=await asyncio.gather(*[
        market.http.post(path,json={'capability_name':'Analysis'},headers=market.headers['developer'])
        for _ in range(2)])
    assert sorted(r.status_code for r in responses)==[201,409]
    detail=await request(market,'GET',f'/agents/{market.agent.id}',role='developer')
    assert [c['capability_name'] for c in detail['capabilities']]==['Analysis']


import pytest

@pytest.mark.parametrize('action',['status','capability_add','capability_remove'])
async def test_agent_edit_is_committed_before_success_response(market,action):
    import httpx
    from app.main import app
    path=f'/agents/{market.agent.id}'
    method='PUT';body={'status':'paused'};expected=200
    if action=='capability_add':
        path+='/capabilities';method='POST';body={'capability_name':'Durable'};expected=201
    if action=='capability_remove':
        cap=await request(market,'POST',path+'/capabilities',role='developer',expected=201,
                          json={'capability_name':'Durable'})
        path+=f"/capabilities/{cap['id']}/remove";method='POST';body=None
    visible=[]
    async def boundary(scope,receive,send):
        async def observe(message):
            if message['type']=='http.response.start' and message['status']==expected:
                async with market.db() as db:
                    if action=='status':
                        visible.append(await db.scalar(select(Agent.status).where(Agent.id==market.agent.id))=='paused')
                    else:
                        row=await db.scalar(select(AgentCapability.id).where(AgentCapability.agent_id==market.agent.id))
                        visible.append((row is not None) if action=='capability_add' else (row is None))
            await send(message)
        await app(scope,receive,observe)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=boundary),base_url='http://test/api/v1') as client:
        response=await client.request(method,path,json=body,headers=market.headers['developer'])
        assert response.status_code==expected
    assert visible==[True], 'A successful edit must be visible before its HTTP response'


@pytest.mark.parametrize('action',['register','heartbeat'])
async def test_agent_registration_and_heartbeat_are_durable(market,action):
    import httpx
    from app.main import app
    expected=201 if action=='register' else 200
    path='/agents/register' if action=='register' else f'/agents/{market.agent.id}/heartbeat'
    body={'name':'Durable executor','endpoint_url':'https://example.test/durable'} if action=='register' else {'status':'paused'}
    visible=[]
    async def boundary(scope,receive,send):
        async def observe(message):
            if message['type']=='http.response.start' and message['status']==expected:
                async with market.db() as db:
                    if action=='register':
                        visible.append(await db.scalar(select(Agent.id).where(Agent.name=='Durable executor')) is not None)
                    else:
                        visible.append(await db.scalar(select(Agent.status).where(Agent.id==market.agent.id))=='paused')
            await send(message)
        await app(scope,receive,observe)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=boundary),base_url='http://test/api/v1') as client:
        response=await client.post(path,json=body,headers=market.headers['developer'])
        assert response.status_code==expected
    assert visible==[True]
