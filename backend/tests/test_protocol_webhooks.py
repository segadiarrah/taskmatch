"""Durable signed notifications, bounded delivery and SSRF protections; no external I/O."""
import asyncio
import hashlib
import hmac
import json
import uuid
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import pytest
from sqlalchemy import select
from test_human_tasks import contract, create, principal
from test_lifecycle_integration import market as market
from test_lifecycle_integration import request

from app.core.config import settings


@pytest.fixture(autouse=True)
def webhook_settings(monkeypatch):
    monkeypatch.setattr(settings, 'HUMAN_TASKS_ENABLED', True)
    monkeypatch.setattr(settings, 'VAULT_SECRET_KEY', 'protocol-tests-private-vault-key')


async def subscribe(market, p, **changes):
    return await request(market, 'POST', f"/principals/{p['id']}/webhooks", expected=201,
        json={'url': 'https://hooks.example.com/events', **changes})


async def test_events_snapshot_signed_delivery_retry_and_deduplication(market, monkeypatch):
    from app.models.protocol import ProtocolEvent, WebhookDelivery, WebhookSubscription
    from app.services import protocol_webhooks as service
    async def public_dns(host):
        return ['93.184.216.34']
    monkeypatch.setattr(service, 'resolve_host', public_dns)
    p = await principal(market)
    subscription = await subscribe(market, p)
    assert len(subscription['secret']) >= 32
    listings = await request(market, 'GET', f"/principals/{p['id']}/webhooks")
    assert 'secret' not in listings[0] and 'secret_ciphertext' not in listings[0]
    await create(market, contract(p['id']))
    async with market.db() as db:
        assert await service.collect_events(db) == 1
        await db.commit()
        assert await service.collect_events(db) == 0
        event = await db.scalar(select(ProtocolEvent))
        snapshot = dict(event.payload)
        assert snapshot['event_type'] == 'human_task.created'
        assert 'instructions' not in json.dumps(snapshot)
        delivery = await db.scalar(select(WebhookDelivery))
        assert delivery is not None
        stored = await db.get(WebhookSubscription, uuid.UUID(subscription['id']))
        assert subscription['secret'] not in stored.secret_ciphertext
        await db.commit()
    sent = []
    async def transport(url, address, payload, headers):
        sent.append((url, address, payload, headers))
        return 503 if len(sent) == 1 else 204
    async with market.db() as db:
        assert await service.dispatch_pending(db, transport=transport) == 1
        await db.commit()
        row = await db.scalar(select(WebhookDelivery))
        assert row.status == 'pending' and row.attempts == 1
        assert await service.dispatch_pending(db, transport=transport) == 0
        row.next_attempt_at = datetime.now(UTC)-timedelta(seconds=1)
        await db.commit()
        assert await service.dispatch_pending(db, transport=transport) == 1
        await db.commit()
        assert row.status == 'delivered' and row.attempts == 2
        assert await service.dispatch_pending(db, transport=transport) == 0
        assert (await db.scalar(select(ProtocolEvent))).payload == snapshot
    assert len(sent) == 2
    for _url, address, payload, headers in sent:
        assert address == '93.184.216.34'
        timestamp = headers['X-TaskMatch-Timestamp']
        signature = hmac.new(subscription['secret'].encode(), timestamp.encode()+b'.'+payload, hashlib.sha256).hexdigest()
        assert headers['X-TaskMatch-Signature'] == 'v1='+signature
        assert headers['X-TaskMatch-Event-Id'] == snapshot['event_id']
    assert sent[0][2] == sent[1][2]
    assert sent[0][3]['Idempotency-Key'] == sent[1][3]['Idempotency-Key']


@pytest.mark.parametrize('url', ['http://example.com', 'https://user:pass@example.com',
    'https://127.0.0.1', 'https://[::1]', 'https://169.254.169.254/latest',
    'https://example.com:8443', 'https://example.com/#fragment',
    'https://example.com\\@127.0.0.1', 'https://[::ffff:127.0.0.1]'])
async def test_webhook_rejects_unsafe_urls_without_network(market, monkeypatch, url):
    from app.services import protocol_webhooks as service
    async def unexpected_dns(host):
        raise AssertionError('Unsafe literal URL must be rejected before DNS')
    monkeypatch.setattr(service, 'resolve_host', unexpected_dns)
    p = await principal(market)
    await request(market, 'POST', f"/principals/{p['id']}/webhooks", expected=422, json={'url': url})


async def test_webhook_revalidates_dns_and_never_follows_redirects(market, monkeypatch):
    from app.models.protocol import WebhookDelivery
    from app.services import protocol_webhooks as service
    async def public_dns(host):
        return ['93.184.216.34']
    monkeypatch.setattr(service, 'resolve_host', public_dns)
    p = await principal(market)
    await subscribe(market, p)
    await create(market, contract(p['id']))
    async with market.db() as db:
        await service.collect_events(db)
        await db.commit()
    calls = []
    async def redirect(url, address, payload, headers):
        calls.append(url)
        return 302
    async with market.db() as db:
        await service.dispatch_pending(db, transport=redirect)
        await db.commit()
        row = await db.scalar(select(WebhookDelivery))
        assert row.status == 'failed' and len(calls) == 1
    # A new explicitly configured endpoint is vetted again at delivery time.
    await create(market, contract(p['id']))
    async def private_dns(host):
        return ['93.184.216.34', '10.0.0.1']
    monkeypatch.setattr(service, 'resolve_host', private_dns)
    async with market.db() as db:
        await service.collect_events(db)
        await service.dispatch_pending(db, transport=redirect)
        await db.commit()
        rows = (await db.scalars(select(WebhookDelivery))).all()
        assert all(r.status == 'failed' for r in rows)
    assert len(calls) == 1


@pytest.mark.parametrize('invalidation', ['revocation', 'disabled_agent'])
async def test_only_owner_configures_and_delegation_filter_prevents_cross_mandate_events(market, monkeypatch, invalidation):
    from app.models.protocol import WebhookDelivery
    from app.services import protocol_webhooks as service
    async def public_dns(host):
        return ['93.184.216.34']
    monkeypatch.setattr(service, 'resolve_host', public_dns)
    p = await principal(market, role='developer')
    async def delegation():
        return await request(market, 'POST', f"/principals/{p['id']}/delegations", role='developer', expected=201,
            json={'agent_id': str(market.agent.id), 'max_amount_minor': 2200,
                  'categories': ['translation_review'], 'expires_at': (datetime.now(UTC)+timedelta(hours=1)).isoformat()})
    a, b = await delegation(), await delegation()
    url = f"/principals/{p['id']}/webhooks"
    await request(market, 'POST', url, expected=403, json={'url': 'https://hooks.example.com'})
    denied = await market.http.post(url, headers={'Authorization': 'Bearer '+a['access_token']}, json={'url': 'https://hooks.example.com'})
    assert denied.status_code == 401
    sub = await request(market, 'POST', url, role='developer', expected=201,
        json={'url': 'https://hooks.example.com', 'delegation_id': a['id']})
    for d in (a, b):
        headers = {'Authorization': 'Bearer '+d['access_token'], 'Idempotency-Key': str(uuid.uuid4())}
        body = contract(p['id'], requester_type='AGENT_REQUESTER', requesting_agent_id=str(market.agent.id), delegation_id=d['id'])
        assert (await market.http.post('/human-tasks', headers=headers, json=body)).status_code == 201
    async with market.db() as db:
        await service.collect_events(db)
        await db.commit()
        assert len((await db.scalars(select(WebhookDelivery))).all()) == 1
    if invalidation == 'revocation':
        await request(market, 'DELETE', f"/principals/{p['id']}/delegations/{a['id']}", role='developer')
    else:
        from app.models import Agent
        async with market.db() as db:
            agent = await db.get(Agent, market.agent.id)
            agent.status = 'suspended'
            await db.commit()
    async def forbidden(*args):
        raise AssertionError('Revoked scope must never dispatch')
    async with market.db() as db:
        await service.dispatch_pending(db, transport=forbidden)
        await db.commit()
        assert (await db.scalar(select(WebhookDelivery))).status == 'suppressed'
    await request(market, 'DELETE', url+'/'+sub['id'], role='developer')


async def test_no_implicit_webhook_and_bounded_failures(market, monkeypatch):
    from app.models.protocol import WebhookDelivery
    from app.services import protocol_webhooks as service
    async def public_dns(host):
        return ['93.184.216.34']
    monkeypatch.setattr(service, 'resolve_host', public_dns)
    p = await principal(market)
    await create(market, contract(p['id']))
    async with market.db() as db:
        await service.collect_events(db)
        await db.commit()
        assert (await db.scalars(select(WebhookDelivery))).all() == []
    await subscribe(market, p)
    await create(market, contract(p['id']))
    calls = []
    async def unavailable(*args):
        calls.append(args)
        return 503
    async with market.db() as db:
        await service.collect_events(db)
        await db.commit()
        for _ in range(6):
            row = await db.scalar(select(WebhookDelivery))
            row.next_attempt_at = datetime.now(UTC)-timedelta(seconds=1)
            await db.commit()
            assert await service.dispatch_pending(db, transport=unavailable) == 1
            await db.commit()
        assert row.status == 'failed' and row.attempts == 6
        assert await service.dispatch_pending(db, transport=unavailable) == 0
    assert len(calls) == 6


def test_pinned_https_socket_preserves_hostname_tls_and_disables_redirects(monkeypatch):
    from app.services import protocol_webhooks as service
    calls = []
    class Socket:
        def settimeout(self, timeout):
            calls.append(('timeout', timeout))
        def connect(self, address):
            calls.append(('connect', address))
        def close(self):
            calls.append(('socket_closed',))
    class HTTPSConnection:
        def __init__(self, host, port, timeout, context):
            calls.append(('tls_host', host, port, context.check_hostname, context.verify_mode))
        def request(self, method, target, body, headers):
            calls.append(('request', method, target))
            self._create_connection(('hooks.example.com', 443))
        def getresponse(self):
            return SimpleNamespace(status=302)
        def close(self):
            calls.append(('connection_closed',))
    monkeypatch.setattr(service.http.client, 'HTTPSConnection', HTTPSConnection)
    monkeypatch.setattr(service.socket, 'socket', lambda *args: Socket())
    monkeypatch.setattr(service.socket, 'getaddrinfo', lambda *args: pytest.fail('Pinned connection must not resolve DNS'))
    assert service._post_pinned('https://hooks.example.com/events?q=one', '93.184.216.34', b'{}', {}) == 302
    assert ('connect', ('93.184.216.34', 443)) in calls
    assert ('tls_host', 'hooks.example.com', 443, True, service.ssl.CERT_REQUIRED) in calls
    assert [call for call in calls if call[0] == 'request'] == [('request', 'POST', '/events?q=one')]


async def test_revocation_serializes_with_authorized_delivery(market, monkeypatch):
    from app.services import protocol_webhooks as service
    async def public_dns(host):
        return ['93.184.216.34']
    monkeypatch.setattr(service, 'resolve_host', public_dns)
    p = await principal(market, role='developer')
    delegation = await request(market, 'POST', f"/principals/{p['id']}/delegations", role='developer', expected=201,
        json={'agent_id': str(market.agent.id), 'max_amount_minor': 1100,
              'categories': ['translation_review'], 'expires_at': (datetime.now(UTC)+timedelta(hours=1)).isoformat()})
    await request(market, 'POST', f"/principals/{p['id']}/webhooks", role='developer', expected=201,
        json={'url': 'https://hooks.example.com', 'delegation_id': delegation['id']})
    body = contract(p['id'], requester_type='AGENT_REQUESTER', requesting_agent_id=str(market.agent.id),
                    delegation_id=delegation['id'])
    headers = {'Authorization': 'Bearer '+delegation['access_token'], 'Idempotency-Key': 'race-task'}
    assert (await market.http.post('/human-tasks', headers=headers, json=body)).status_code == 201
    async with market.db() as db:
        await service.collect_events(db)
        await db.commit()
    sending, finish = asyncio.Event(), asyncio.Event()
    async def transport(*args):
        sending.set()
        await finish.wait()
        return 204
    async def dispatch():
        async with market.db() as db:
            await service.dispatch_pending(db, transport=transport)
            await db.commit()
    active = asyncio.create_task(dispatch())
    await asyncio.wait_for(sending.wait(), timeout=2)
    revoke = asyncio.create_task(request(market, 'DELETE',
        f"/principals/{p['id']}/delegations/{delegation['id']}", role='developer'))
    try:
        await asyncio.sleep(0.1)
        assert not revoke.done(), 'A committed revocation must not race with an outbound authorized send'
    finally:
        finish.set()
        await asyncio.gather(active, revoke)


async def test_late_committed_audit_is_collected_without_cursor_loss(market):
    from app.models import AuditLog, Task
    from app.models.protocol import ProtocolEvent
    from app.services import protocol_webhooks as service
    p = await principal(market)
    task = await create(market, contract(p['id']))
    async with market.db() as db:
        assert await service.collect_events(db) == 1
        await db.commit()
    async with market.db() as delayed:
        delayed.add(AuditLog(actor_type='system', actor_id='test', action='human_task.result_submitted',
            entity_type='task', entity_id=task['task_id'], created_at=datetime.now(UTC)-timedelta(hours=1)))
        await delayed.flush()
        async with market.db() as db:
            db.add(AuditLog(actor_type='system', actor_id='test', action='human_task.policy_approved',
                entity_type='task', entity_id=task['task_id']))
            await db.commit()
            assert await service.collect_events(db) == 1
            await db.commit()
        await delayed.commit()
    async with market.db() as db:
        assert await service.collect_events(db) == 1
        await db.commit()
        events = (await db.scalars(select(ProtocolEvent))).all()
        snapshots = [dict(event.payload) for event in events]
        assert len(events) == 3
        stored = await db.get(Task, uuid.UUID(task['task_id']))
        stored.status = 'assigned'
        await db.commit()
        assert await service.collect_events(db) == 0
        assert [event.payload for event in events] == snapshots


@pytest.mark.parametrize('initial_failures', [0, 5])
async def test_interrupted_delivery_keeps_durable_attempt_and_recovers_expired_lease(market, monkeypatch, initial_failures):
    from app.models.protocol import WebhookDelivery
    from app.services import protocol_webhooks as service
    async def public_dns(host):
        return ['93.184.216.34']
    monkeypatch.setattr(service, 'resolve_host', public_dns)
    p = await principal(market)
    await subscribe(market, p)
    await create(market, contract(p['id']))
    async with market.db() as db:
        await service.collect_events(db)
        await db.commit()
    async def unavailable(*args):
        return 503
    async with market.db() as db:
        for _ in range(initial_failures):
            row = await db.scalar(select(WebhookDelivery))
            row.next_attempt_at = datetime.now(UTC)-timedelta(seconds=1)
            await db.commit()
            await service.dispatch_pending(db, transport=unavailable)
            await db.commit()
        row = await db.scalar(select(WebhookDelivery))
        row.next_attempt_at = datetime.now(UTC)-timedelta(seconds=1)
        await db.commit()
    class Interrupted(BaseException):
        pass
    async def interrupted(*args):
        raise Interrupted()
    with pytest.raises(Interrupted):
        async with market.db() as db:
            await service.dispatch_pending(db, transport=interrupted)
    async with market.db() as db:
        row = await db.scalar(select(WebhookDelivery))
        assert row.attempts == initial_failures+1 and row.status == 'processing'
        assert await service.dispatch_pending(db, transport=unavailable) == 0
        for _ in range(5-initial_failures):
            row.next_attempt_at = datetime.now(UTC)-timedelta(seconds=1)
            await db.commit()
            assert await service.dispatch_pending(db, transport=unavailable) == 1
            await db.commit()
        if initial_failures == 5:
            async def forbidden(*args):
                pytest.fail('An interrupted sixth attempt must never produce a seventh send')
            row.next_attempt_at = datetime.now(UTC)-timedelta(seconds=1)
            await db.commit()
            assert await service.dispatch_pending(db, transport=forbidden) == 1
            await db.commit()
        assert row.attempts == 6 and row.status == 'failed'
        assert await service.dispatch_pending(db, transport=unavailable) == 0
