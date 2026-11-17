"""Protocol adapters share the HTTP identity, domain model and idempotency rules."""
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from test_autonomous_payments import ready
from test_autonomous_payments import remote as remote
from test_human_tasks import contract, principal
from test_lifecycle_integration import market as market
from test_lifecycle_integration import request

from app.core.config import settings


@pytest.fixture(autouse=True)
def protocol_enabled(monkeypatch):
    monkeypatch.setattr(settings, 'HUMAN_TASKS_ENABLED', True)


async def mcp(market, method, params=None, role='owner', **kwargs):
    params = {**(params or {}), '_meta': {
        'io.modelcontextprotocol/protocolVersion': '2026-07-28',
        'io.modelcontextprotocol/clientCapabilities': {},
    }}
    headers = {**market.headers[role], 'Accept': 'application/json, text/event-stream',
               'MCP-Protocol-Version': '2026-07-28', 'Mcp-Method': method}
    if method == 'tools/call':
        headers['Mcp-Name'] = params['name']
    headers.update(kwargs.pop('headers', {}))
    return await market.http.post('/protocols/mcp', headers=headers,
        json={'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params}, **kwargs)


async def test_modern_mcp_discovery_tools_create_poll_and_content_bound_replay(market):
    discovery = await mcp(market, 'server/discover')
    assert discovery.status_code == 200, discovery.text
    assert discovery.json()['result']['resultType'] == 'complete'
    assert discovery.json()['result']['supportedVersions'] == ['2026-07-28']
    tools = (await mcp(market, 'tools/list')).json()['result']['tools']
    assert {t['name'] for t in tools} == {
        'human_task_create', 'human_task_get', 'human_task_result',
        'human_task_events', 'human_task_fund'}
    p = await principal(market)
    args = {'contract': contract(p['id']), 'idempotency_key': 'mcp-create'}
    first = await mcp(market, 'tools/call', {'name': 'human_task_create', 'arguments': args})
    assert first.status_code == 200, first.text
    task = first.json()['result']['structuredContent']
    replay = await mcp(market, 'tools/call', {'name': 'human_task_create', 'arguments': args})
    assert replay.json()['result']['structuredContent']['task_id'] == task['task_id']
    for name in ('human_task_get', 'human_task_result', 'human_task_events'):
        result = await mcp(market, 'tools/call', {'name': name, 'arguments': {'task_id': task['task_id']}})
        assert not result.json()['result'].get('isError'), result.text
    changed = {**args, 'contract': {**args['contract'], 'title': 'Different request'}}
    denied = await mcp(market, 'tools/call', {'name': 'human_task_create', 'arguments': changed})
    assert denied.json()['result']['isError'] is True
    denied = await mcp(market, 'tools/call', {'name': 'human_task_get', 'arguments': {'task_id': task['task_id']}}, role='stranger')
    assert denied.json()['result']['isError'] is True


async def test_modern_mcp_validates_metadata_origin_and_unknown_methods(market):
    for headers in ({'Mcp-Method': 'ping'}, {'MCP-Protocol-Version': ''}):
        response = await mcp(market, 'tools/list', headers=headers)
        assert response.status_code == 400, response.text
        assert response.json()['error']['code'] == -32020
    unsupported = await mcp(market, 'tools/list', headers={'MCP-Protocol-Version': '1900-01-01'})
    assert unsupported.status_code == 400
    assert unsupported.json()['error']['code'] == -32022
    assert (await mcp(market, 'tools/list', headers={'Origin': 'https://attacker.example'})).status_code == 403
    unknown = await mcp(market, 'resources/list')
    assert unknown.status_code == 404
    assert unknown.json()['error']['code'] == -32601
    malformed = await market.http.post('/protocols/mcp', headers=market.headers['owner'], content='{broken')
    assert malformed.status_code == 400
    assert malformed.json()['error']['code'] == -32700


async def test_mcp_scoped_tokens_cannot_access_another_delegation_or_setup_payment(market):
    p = await principal(market, role='developer')
    async def delegation():
        return await request(market, 'POST', f"/principals/{p['id']}/delegations", role='developer', expected=201,
            json={'agent_id': str(market.agent.id), 'max_amount_minor': 1100,
                  'categories': ['translation_review'],
                  'expires_at': (datetime.now(UTC)+timedelta(hours=1)).isoformat()})
    a, b = await delegation(), await delegation()
    body = contract(p['id'], requester_type='AGENT_REQUESTER', requesting_agent_id=str(market.agent.id), delegation_id=a['id'])
    headers = {'Authorization': 'Bearer '+a['access_token']}
    response = await mcp(market, 'tools/call', {'name': 'human_task_create', 'arguments': {
        'contract': body, 'idempotency_key': 'scoped-mcp'}}, headers=headers)
    task_id = response.json()['result']['structuredContent']['task_id']
    response = await mcp(market, 'tools/call', {'name': 'human_task_get', 'arguments': {'task_id': task_id}},
                         headers={'Authorization': 'Bearer '+b['access_token']})
    assert response.json()['result']['isError'] is True
    response = await mcp(market, 'tools/call', {'name': 'payment_setup', 'arguments': {}}, headers=headers)
    assert response.json()['error']['code'] == -32602
    await request(market, 'DELETE', f"/principals/{p['id']}/delegations/{a['id']}", role='developer')
    assert (await mcp(market, 'tools/list', headers=headers)).status_code == 403


async def test_a2a_03_card_create_get_idempotency_and_unsupported_cancellation(market):
    card = await market.http.get('/protocols/a2a/agent-card.json')
    assert card.status_code == 200, card.text
    assert card.json()['protocolVersion'] == '0.3.0'
    assert card.json()['capabilities']['streaming'] is False
    assert card.json()['capabilities']['pushNotifications'] is False
    p = await principal(market)
    params = {'message': {'kind': 'message', 'role': 'user', 'messageId': str(uuid.uuid4()),
        'parts': [{'kind': 'data', 'data': {'contract': contract(p['id'])}}]}}
    async def rpc(method, args, role='owner'):
        return await market.http.post('/protocols/a2a', headers=market.headers[role],
            json={'jsonrpc': '2.0', 'id': 'a2a-1', 'method': method, 'params': args})
    response = await rpc('message/send', params)
    assert response.status_code == 200, response.text
    task = response.json()['result']
    assert task['kind'] == 'task' and task['status']['state'] == 'submitted'
    assert (await rpc('message/send', params)).json()['result']['id'] == task['id']
    assert (await rpc('tasks/get', {'id': task['id']})).json()['result']['id'] == task['id']
    denied = await rpc('tasks/get', {'id': task['id']}, role='stranger')
    assert 'error' in denied.json()
    cancelled = await rpc('tasks/cancel', {'id': task['id']})
    assert cancelled.json()['error']['code'] == -32002
    assert (await rpc('message/stream', params)).json()['error']['code'] == -32601
    response = await rpc('message/send', {**params, 'configuration': {'pushNotificationConfig': {'url': 'https://example.com'}}})
    assert response.json()['error']['code'] == -32003


async def test_mcp_and_a2a_funding_share_one_durable_authorized_payment(market, remote):
    from sqlalchemy import select

    from app.models.billing import BillingOperation, JobFunding
    from app.services import autonomous_funding
    _p, _delegation, task, headers = await ready(market, remote)
    response = await mcp(market, 'tools/call', {'name': 'human_task_fund',
        'arguments': {'task_id': task['task_id']}}, headers=headers)
    assert response.status_code == 200, response.text
    funding = response.json()['result']['structuredContent']
    assert funding['status'] == 'creating' and funding['amount_minor'] == 1100
    # Enqueuing payment must not claim receipt or make an external charge.
    assert not [call for call in remote.calls if call[:2] == ('POST', '/payment_intents')]
    response = await market.http.post('/protocols/a2a', headers=headers, json={
        'jsonrpc': '2.0', 'id': 'a2a-fund', 'method': 'message/send', 'params': {
            'message': {'kind': 'message', 'role': 'user', 'messageId': str(uuid.uuid4()),
                        'parts': [{'kind': 'data', 'data': {'operation': 'fund', 'task_id': task['task_id']}}]}}})
    assert response.json()['result']['parts'][0]['data']['funding_id'] == funding['funding_id']
    async with market.db() as db:
        operations = (await db.scalars(select(BillingOperation).where(BillingOperation.kind == 'fund_human_job'))).all()
        assert len(operations) == 1
    await autonomous_funding.process_funding(operations[0].id, market.db)
    async with market.db() as db:
        assert (await db.get(JobFunding, uuid.UUID(funding['funding_id']))).status == 'paid'
    assert len([call for call in remote.calls if call[:2] == ('POST', '/payment_intents')]) == 1


async def test_failed_rpc_rolls_back_partial_delegation_budget_reservation(market):
    from app.models.human import Delegation
    p = await principal(market, role='developer')
    delegation = await request(market, 'POST', f"/principals/{p['id']}/delegations", role='developer', expected=201,
        json={'agent_id': str(market.agent.id), 'max_amount_minor': 1100,
              'categories': ['translation_review'], 'expires_at': (datetime.now(UTC)+timedelta(hours=1)).isoformat()})
    body = contract(p['id'], requester_type='AGENT_REQUESTER', requesting_agent_id=str(market.agent.id),
                    delegation_id=delegation['id'], parent_job_id=str(uuid.uuid4()))
    response = await mcp(market, 'tools/call', {'name': 'human_task_create', 'arguments': {
        'contract': body, 'idempotency_key': 'partial-failure'}},
        headers={'Authorization': 'Bearer '+delegation['access_token']})
    assert response.json()['result']['isError'] is True
    async with market.db() as db:
        stored = await db.get(Delegation, uuid.UUID(delegation['id']))
        assert stored.reserved_amount_minor == 0


async def test_mcp_notification_is_bodyless_and_invalid_json_or_ids_never_execute(market):
    headers = {**market.headers['owner'], 'Content-Type': 'application/json',
               'Accept': 'application/json, text/event-stream', 'MCP-Protocol-Version': '2026-07-28'}
    notification = await market.http.post('/protocols/mcp', headers=headers, json={
        'jsonrpc': '2.0', 'method': 'notifications/cancelled', 'params': {'requestId': 'finished-call'}})
    assert notification.status_code == 202, notification.text
    assert notification.content == b''
    unknown = await market.http.post('/protocols/mcp', headers=headers,
        json={'jsonrpc': '2.0', 'method': 'notifications/unknown', 'params': {}})
    assert unknown.status_code == 400
    for raw in ('{"jsonrpc":"2.0","id":NaN,"method":"ping"}',
                '{"jsonrpc":"2.0","id":1e999,"method":"ping"}'):
        response = await market.http.post('/protocols/mcp', headers=headers, content=raw)
        assert response.status_code == 400
        assert 'error' in response.json()


async def test_protocol_reader_stops_before_consuming_oversized_stream():
    from types import SimpleNamespace

    from app.api.v1.endpoints.protocol_mcp import read_rpc
    async def stream():
        yield b'x'*262145
        pytest.fail('Oversized body must not be read to completion')
    body, response = await read_rpc(SimpleNamespace(stream=stream))
    assert body is None and response.status_code == 413


async def test_mcp_checks_untrusted_origin_even_without_credentials(market):
    response = await market.http.post('/protocols/mcp', headers={'Origin': 'https://attacker.example'}, json={})
    assert response.status_code == 403


@pytest.mark.parametrize('other_work', ['ai_step', 'another_mandate'])
async def test_agent_cannot_fund_mixed_or_cross_mandate_work(market, remote, other_work):
    from sqlalchemy import select

    from app.models import Task
    from app.models.billing import BillingOperation, JobFunding
    _p, _delegation, task, headers = await ready(market, remote)
    extra_id = uuid.uuid4()
    human = {**task, 'task_id': str(extra_id), 'delegation_id': str(uuid.uuid4())} if other_work == 'another_mandate' else None
    async with market.db() as db:
        db.add(Task(id=extra_id, job_id=uuid.UUID(task['parent_job_id']), title='Other work',
            description='Outside the current mandate', task_type='translation_review', budget=10,
            status='pending', human_contract_json=human, human_policy_status='approved' if human else None))
        await db.commit()
    response = await mcp(market, 'tools/call', {'name': 'human_task_fund',
        'arguments': {'task_id': task['task_id']}}, headers=headers)
    assert response.json()['result']['isError'] is True
    assert response.json()['result']['structuredContent']['status'] == 403
    async with market.db() as db:
        assert (await db.scalars(select(JobFunding))).all() == []
        assert (await db.scalars(select(BillingOperation).where(BillingOperation.kind == 'fund_human_job'))).all() == []
    assert not [call for call in remote.calls if call[:2] == ('POST', '/payment_intents')]
