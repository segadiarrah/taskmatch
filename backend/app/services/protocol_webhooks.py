"""Lossless audit outbox and pinned HTTPS delivery with no redirect or proxy support."""
import asyncio
import hashlib
import hmac
import http.client
import ipaddress
import json
import secrets
import socket
import ssl
import threading
import time
import uuid
from datetime import UTC, datetime, timedelta
from urllib.parse import urlsplit, urlunsplit

from fastapi import HTTPException
from sqlalchemy import String, and_, cast, exists, or_, select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import lazyload

from app.models import Agent, AuditLog, Task, User
from app.models.human import Delegation, Principal
from app.models.protocol import ProtocolEvent, WebhookDelivery, WebhookSubscription
from app.services import vault_service

MAX_ATTEMPTS = 6
REQUEST_TIMEOUT_SECONDS = 5.0
TASK_ACTIONS = ('offer.accepted', 'assign_task', 'update_task', 'task.human_assigned',
                'task.execution_reserved', 'task.execution_unavailable', 'task.reassigned')
JOB_ACTIONS = ('accept_job', 'dispute_job', 'delivery.signed_off', 'human_task.funded',
               'human_task.funding_requested', 'human_task.funding_action_required')


def public_address(value):
    try:
        address = ipaddress.ip_address(value)
    except ValueError:
        return False
    if (not address.is_global or address.is_multicast or address.is_reserved
            or address.is_unspecified or address.is_loopback or address.is_link_local):
        return False
    return not (isinstance(address, ipaddress.IPv6Address) and (address.ipv4_mapped or address.sixtofour or address.teredo))


def parse_url(url):
    if (not isinstance(url, str) or len(url) > 2048 or '\\' in url
            or any(ord(c) <= 32 or ord(c) > 126 for c in url)):
        raise HTTPException(422, 'A valid public HTTPS webhook URL is required')
    try:
        parsed = urlsplit(url)
        if (parsed.scheme != 'https' or not parsed.hostname or parsed.username is not None
                or parsed.password is not None or parsed.fragment or parsed.port not in (None, 443)):
            raise ValueError('Invalid webhook URL')
        host = parsed.hostname.lower()
        if '%' in host or host.endswith('.') or host in ('localhost', 'localhost.localdomain'):
            raise ValueError('Invalid webhook hostname')
        try:
            ipaddress.ip_address(host)
        except ValueError:
            labels = host.split('.')
            if len(labels) < 2 or any(not part or len(part) > 63 or part.startswith('-') or part.endswith('-')
                    or any(not (c.isalnum() or c == '-') for c in part) for part in labels):
                raise ValueError('Invalid webhook hostname') from None
        else:
            if not public_address(host):
                raise ValueError('Webhook address is not public')
    except ValueError:
        raise HTTPException(422, 'A public HTTPS URL on port 443 without credentials or fragment is required') from None
    authority = '['+host+']' if ':' in host else host
    return urlunsplit(('https', authority, parsed.path or '/', parsed.query, '')), host


async def resolve_host(host):
    records = await asyncio.wait_for(asyncio.get_running_loop().getaddrinfo(
        host, 443, type=socket.SOCK_STREAM), timeout=5)
    return list(dict.fromkeys(record[4][0] for record in records))


async def validate_destination(url):
    normalized, host = parse_url(url)
    try:
        addresses = [host] if public_address(host) else await resolve_host(host)
    except (OSError, TimeoutError):
        raise HTTPException(422, 'Webhook hostname could not be validated') from None
    if not addresses or any(not public_address(address) for address in addresses):
        raise HTTPException(422, 'Webhook DNS must resolve exclusively to public addresses')
    return normalized, addresses[0]


def subscription_view(subscription):
    return {'id': str(subscription.id), 'principal_id': str(subscription.principal_id),
            'delegation_id': str(subscription.delegation_id) if subscription.delegation_id else None,
            'url': subscription.url, 'active': subscription.active, 'created_at': subscription.created_at}


async def create_subscription(db, principal, user, url, delegation_id=None):
    if delegation_id:
        delegation = await db.get(Delegation, delegation_id)
        if (not delegation or delegation.principal_id != principal.id or delegation.revoked_at
                or delegation.expires_at <= datetime.now(UTC)):
            raise HTTPException(403, 'An active delegation of this principal is required')
    # Bound storage and outbound work per principal; callers cannot submit arbitrary headers.
    count = len((await db.scalars(select(WebhookSubscription.id).where(
        WebhookSubscription.principal_id == principal.id, WebhookSubscription.active.is_(True)))).all())
    if count >= 10:
        raise HTTPException(409, 'At most ten active webhooks are allowed per principal')
    normalized, _ = await validate_destination(url)
    secret = secrets.token_urlsafe(32)
    try:
        ciphertext = vault_service.encrypt(secret)
    except vault_service.VaultUnavailableError:
        raise HTTPException(503, 'Secure webhook storage is unavailable') from None
    subscription = WebhookSubscription(principal_id=principal.id, owner_user_id=user.id,
        delegation_id=delegation_id, url=normalized, secret_ciphertext=ciphertext)
    db.add(subscription)
    await db.flush()
    return {**subscription_view(subscription), 'secret': secret}


async def collect_events(db, *, limit=100):
    """Anti-join, not a timestamp/UUID cursor: late commits can never fall behind it.

    Each snapshot is an observation at collection time, not a fabricated reconstruction
    of historical state. Audit payloads (including notes and credentials) never leave.
    """
    if not await db.scalar(text('SELECT pg_try_advisory_xact_lock(74301007)')):
        return 0
    task_source = and_(AuditLog.entity_type == 'task', cast(Task.id, String) == AuditLog.entity_id,
        or_(AuditLog.action.like('human_task.%'), AuditLog.action.in_(TASK_ACTIONS)))
    job_source = and_(AuditLog.entity_type == 'job', cast(Task.job_id, String) == AuditLog.entity_id,
        or_(AuditLog.action.in_(JOB_ACTIONS), AuditLog.action.like('human_task.%')))
    seen = exists(select(ProtocolEvent.id).where(ProtocolEvent.source_audit_id == AuditLog.id,
                                               ProtocolEvent.task_id == Task.id))
    rows = (await db.execute(select(AuditLog, Task).join(Task, or_(task_source, job_source))
        .options(lazyload('*')).where(Task.human_contract_json.is_not(None), ~seen)
        .order_by(AuditLog.created_at, AuditLog.id, Task.id).limit(limit))).all()
    count = 0
    for audit, task in rows:
        contract = task.human_contract_json
        principal_id = uuid.UUID(contract['principal_id'])
        delegation_id = uuid.UUID(contract['delegation_id']) if contract.get('delegation_id') else None
        event_id = uuid.uuid4()
        observed_at = datetime.now(UTC)
        # Provider-specific names are internal implementation details.
        event_type = audit.action if 'stripe' not in audit.action.lower() else 'human_task.payment_updated'
        payload = {'schema_version': 'tm.event.v1', 'event_id': str(event_id), 'event_type': event_type,
            'task_id': str(task.id), 'occurred_at': audit.created_at.isoformat(),
            'snapshot_observed_at': observed_at.isoformat(), 'snapshot': {
                'task_id': str(task.id), 'job_id': str(task.job_id), 'status': str(task.status),
                'policy_status': task.human_policy_status, 'principal_id': str(principal_id),
                'delegation_id': str(delegation_id) if delegation_id else None}}
        created = await db.scalar(insert(ProtocolEvent).values(id=event_id, source_audit_id=audit.id,
            task_id=task.id, principal_id=principal_id, delegation_id=delegation_id, payload=payload)
            .on_conflict_do_nothing(constraint='uq_protocol_event_source_task').returning(ProtocolEvent.id))
        if not created:
            continue
        count += 1
        subscriptions = (await db.scalars(select(WebhookSubscription).where(
            WebhookSubscription.principal_id == principal_id, WebhookSubscription.active.is_(True),
            WebhookSubscription.created_at <= audit.created_at,
            or_(WebhookSubscription.delegation_id.is_(None), WebhookSubscription.delegation_id == delegation_id)))).all()
        for subscription in subscriptions:
            await db.execute(insert(WebhookDelivery).values(subscription_id=subscription.id, event_id=event_id)
                .on_conflict_do_nothing(constraint='uq_webhook_delivery_subscription_event'))
    await db.flush()
    return count


def _post_pinned(url, address, payload, headers):
    """Pin TCP and enforce one deadline across connect, TLS, write and headers.

    A per-read socket timeout alone permits an indefinitely trickling receiver.
    The watchdog shuts down the actual socket, including during TLS handshake;
    it never merely cancels an await while a network thread keeps running.
    """
    parsed = urlsplit(url)
    deadline = time.monotonic()+REQUEST_TIMEOUT_SECONDS
    expired = threading.Event()
    guard = threading.Lock()
    active_socket = [None]
    connection = None

    def close_socket(sock):
        if sock is not None:
            try:
                # close alone can leave a makefile() reader holding the fd.
                sock.shutdown(socket.SHUT_RDWR)
            except (OSError, AttributeError):
                pass
            try:
                sock.close()
            except OSError:
                pass

    def abort():
        with guard:
            expired.set()
            sock = active_socket[0]
        close_socket(sock)

    def remaining():
        seconds = deadline-time.monotonic()
        if expired.is_set() or seconds <= 0:
            expired.set()
            raise TimeoutError('Webhook request deadline exceeded')
        return seconds

    def track(sock):
        with guard:
            reject = expired.is_set()
            if not reject:
                active_socket[0] = sock
        if reject:
            close_socket(sock)
            raise TimeoutError('Webhook request deadline exceeded')
        return sock

    def pinned_socket(ignored_address, timeout=None, source_address=None, **kwargs):
        remaining()
        family = socket.AF_INET6 if ':' in address else socket.AF_INET
        sock = track(socket.socket(family, socket.SOCK_STREAM))
        try:
            sock.settimeout(remaining())
            sock.connect((address, 443))
            remaining()
            return sock
        except BaseException:
            close_socket(sock)
            raise

    class PinnedHTTPSConnection(http.client.HTTPSConnection):
        def connect(self):
            self.sock = pinned_socket(None)
            # wrap_socket normally handshakes before returning, leaving the
            # watchdog tracking a detached raw fd. Register TLS before its I/O.
            self.sock = track(self._context.wrap_socket(self.sock,
                server_hostname=parsed.hostname, do_handshake_on_connect=False))
            self.sock.settimeout(remaining())
            self.sock.do_handshake()
            remaining()

    timer = threading.Timer(REQUEST_TIMEOUT_SECONDS, abort)
    timer.daemon = True
    timer.start()
    try:
        connection = PinnedHTTPSConnection(parsed.hostname, 443, timeout=remaining(),
                                           context=ssl.create_default_context())
        connection._create_connection = pinned_socket
        connection.request('POST', parsed.path+('?' + parsed.query if parsed.query else ''),
                           body=payload, headers=headers)
        response = connection.getresponse()
        remaining()
        # Do not consume unbounded or sensitive response bodies.
        return response.status
    except Exception:
        if expired.is_set() or time.monotonic() >= deadline:
            raise TimeoutError('Webhook request deadline exceeded') from None
        raise
    finally:
        timer.cancel()
        try:
            if connection is not None:
                connection.close()
        finally:
            with guard:
                sock = active_socket[0]
            close_socket(sock)
            timer.join()


async def send_pinned(url, address, payload, headers):
    return await asyncio.to_thread(_post_pinned, url, address, payload, headers)


async def scope_active(db, subscription, event):
    if subscription is None or event is None:
        return False
    # The same principal -> delegation order as mandate mutation. Shared locks
    # keep the authorization valid throughout the outbound request; revocation
    # waits for an in-flight authorized send to finish before it can commit.
    principal = await db.scalar(select(Principal).where(Principal.id == subscription.principal_id)
        .with_for_update(read=True).execution_options(populate_existing=True))
    delegation = None
    if subscription.delegation_id:
        delegation = await db.scalar(select(Delegation).where(Delegation.id == subscription.delegation_id)
            .with_for_update(read=True).execution_options(populate_existing=True))
    subscription = await db.scalar(select(WebhookSubscription).where(WebhookSubscription.id == subscription.id)
        .with_for_update(read=True).execution_options(populate_existing=True))
    owner = await db.scalar(select(User).options(lazyload('*')).where(User.id == subscription.owner_user_id)
        .with_for_update(read=True).execution_options(populate_existing=True))
    if (not subscription.active or not principal or not owner or not owner.is_active
            or principal.owner_user_id != subscription.owner_user_id
            or event.principal_id != principal.id
            or (subscription.delegation_id and subscription.delegation_id != event.delegation_id)):
        return False
    if subscription.delegation_id:
        agent = await db.scalar(select(Agent).options(lazyload('*')).where(Agent.id == delegation.agent_id)
            .with_for_update(read=True).execution_options(populate_existing=True)) if delegation else None
        if (not delegation or delegation.revoked_at or delegation.principal_id != principal.id
                or delegation.expires_at <= datetime.now(UTC)
                or not agent or agent.status != 'active' or agent.developer_user_id != owner.id):
            return False
    return True


async def dispatch_pending(db, *, transport=None, limit=20):
    """Commit a bounded attempt and lease before external I/O, then lock its scope.

    A worker crash preserves the attempt count. Expired processing leases can be
    reclaimed, while an active sender's row lock prevents overlapping delivery.
    The caller commits each final delivery outcome; every claim is committed here.
    """
    transport = transport or send_pinned
    processed = 0
    for _ in range(limit):
        delivery = await db.scalar(select(WebhookDelivery).where(
            WebhookDelivery.status.in_(('pending', 'processing')),
            WebhookDelivery.next_attempt_at <= datetime.now(UTC))
            .order_by(WebhookDelivery.next_attempt_at, WebhookDelivery.id).limit(1)
            .with_for_update(skip_locked=True).execution_options(populate_existing=True))
        if delivery is None:
            break
        processed += 1
        if delivery.attempts >= MAX_ATTEMPTS:
            delivery.status = 'failed'
            delivery.last_error = 'attempt_limit_reached'
            await db.commit()
            continue
        delivery.attempts += 1
        delivery.status = 'processing'
        delivery.next_attempt_at = datetime.now(UTC)+timedelta(seconds=60)
        delivery_id, attempt = delivery.id, delivery.attempts
        await db.commit()
        delivery = await db.scalar(select(WebhookDelivery).where(WebhookDelivery.id == delivery_id,
            WebhookDelivery.status == 'processing', WebhookDelivery.attempts == attempt)
            .with_for_update(skip_locked=True).execution_options(populate_existing=True))
        if delivery is None:
            continue
        # This pending status is not committed until the outcome is known. On
        # interruption the committed processing lease remains intact.
        delivery.status = 'pending'
        subscription = await db.get(WebhookSubscription, delivery.subscription_id)
        event = await db.get(ProtocolEvent, delivery.event_id)
        if not await scope_active(db, subscription, event):
            delivery.status = 'suppressed'
            delivery.last_error = 'scope_inactive'
            continue
        try:
            # Validate again on every attempt, then pin the actual TCP connection.
            url, address = await validate_destination(subscription.url)
            if not await scope_active(db, subscription, event):
                delivery.status = 'suppressed'
                delivery.last_error = 'scope_inactive'
                continue
            secret = vault_service.decrypt(subscription.secret_ciphertext)
            payload = json.dumps(event.payload, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()
            timestamp = str(int(datetime.now(UTC).timestamp()))
            signature = hmac.new(secret.encode(), timestamp.encode()+b'.'+payload, hashlib.sha256).hexdigest()
            headers = {'Content-Type': 'application/json', 'User-Agent': 'TaskMatch-Webhooks/1.0',
                'X-TaskMatch-Timestamp': timestamp, 'X-TaskMatch-Signature': 'v1='+signature,
                'X-TaskMatch-Event-Id': str(event.id), 'Idempotency-Key': str(delivery.id)}
            status = await transport(url, address, payload, headers)
            delivery.last_http_status = status
            if 200 <= status < 300:
                delivery.status = 'delivered'
                delivery.delivered_at = datetime.now(UTC)
                delivery.last_error = None
                continue
            # Redirects and permanent client errors never trigger another URL request.
            if 300 <= status < 500 and status not in (408, 425, 429):
                delivery.status = 'failed'
            delivery.last_error = 'http_error'
        except HTTPException:
            delivery.status = 'failed'
            delivery.last_error = 'destination_rejected'
        except vault_service.VaultUnavailableError:
            delivery.last_error = 'secure_storage_unavailable'
        except (OSError, TimeoutError, http.client.HTTPException):
            delivery.last_error = 'transport_error'
        if delivery.attempts >= MAX_ATTEMPTS:
            delivery.status = 'failed'
        if delivery.status == 'pending':
            delivery.next_attempt_at = datetime.now(UTC)+timedelta(seconds=min(3600, 30*2**(delivery.attempts-1)))
    await db.flush()
    return processed


async def run_once(factory, *, max_deliveries=20):
    """Worker entry point: commit the outbox before any outbound network request."""
    async with factory() as db:
        events = await collect_events(db)
        await db.commit()
    dispatched = 0
    for _ in range(max_deliveries):
        async with factory() as db:
            count = await dispatch_pending(db, limit=1)
            await db.commit()
        dispatched += count
        if not count:
            break
    return {'events': events, 'deliveries': dispatched}
