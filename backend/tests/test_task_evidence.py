"""Private photo proof is bounded and remains within assignment/mandate scope."""
import asyncio
import base64
import hashlib
import uuid
from datetime import UTC

import pytest
from sqlalchemy import select
from test_human_tasks import funded_human, verified_worker
from test_human_tasks import human_enabled as human_enabled
from test_lifecycle_integration import market as market

from app.main import app
from app.models import Assignment, Job, Task

PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF1sAAAAASUVORK5CYII=')


@pytest.fixture(autouse=True)
def evidence_storage(tmp_path, monkeypatch):
    monkeypatch.setenv('UPLOAD_DIR', str(tmp_path))
    # Keep this feature independently testable before the application mounts it.
    from app.api.v1.endpoints.task_evidence import router
    previous = list(app.router.routes)
    added = not any(getattr(route, 'path', '') == '/api/v1/human-tasks/{task_id}/evidence' for route in previous)
    if added:
        app.include_router(router, prefix='/api/v1')
    yield tmp_path
    if added:
        app.router.routes[:] = previous


async def assigned(m):
    task = await funded_human(m)
    await verified_worker(m)
    response = await m.http.post(f"/human-tasks/{task['task_id']}/claim", headers=m.headers['developer'])
    assert response.status_code == 200, response.text
    return task


async def upload(m, task, data=PNG, role='developer', filename='private-photo.png', content_type='image/png'):
    return await m.http.post(f"/human-tasks/{task['task_id']}/evidence", headers=m.headers[role],
                             files={'file': (filename, data, content_type)})


async def test_photo_is_private_bound_to_task_and_ignores_original_filename(market, evidence_storage):
    task = await assigned(market)
    response = await upload(market, task, filename='../../Name-GPS-personal.png')
    assert response.status_code == 201, response.text
    reference = response.json()['reference']
    assert reference.startswith(f"/api/v1/human-tasks/{task['task_id']}/evidence/")
    file_id = uuid.UUID(reference.rsplit('/', 1)[-1])
    async with market.db() as db:
        persisted = await db.get(Task, uuid.UUID(task['task_id']))
        records = persisted.input_spec_json['_evidence_files']
        assert len(records) == 1
        record = records[0]
        assert record['id'] == str(file_id) and record['type'] == 'image/png'
        assert record['sha256'] == hashlib.sha256(PNG).hexdigest()
        assert record['author_user_id'] == str(market.users['developer'].id)
        assert 'Name-GPS' not in str(record) and 'filename' not in record
    target = evidence_storage / 'human' / task['task_id'] / f'{file_id}.png'
    assert target.read_bytes() == PNG
    assert target.stat().st_mode & 0o777 == 0o600
    for who in ('owner', 'developer', 'admin'):
        result = await market.http.get(reference.removeprefix('/api/v1'), headers=market.headers[who])
        assert result.status_code == 200 and result.content == PNG
        assert result.headers['content-type'] == 'image/png'
        assert result.headers['content-disposition'].startswith('attachment;')
        assert result.headers['x-content-type-options'] == 'nosniff'
        assert 'sandbox' in result.headers['content-security-policy']
        assert result.headers['cache-control'] == 'no-store'
    denied = await market.http.get(reference.removeprefix('/api/v1'), headers=market.headers['stranger'])
    assert denied.status_code == 403
    missing = await market.http.get(reference.removeprefix('/api/v1').rsplit('/', 1)[0] + '/' + str(uuid.uuid4()), headers=market.headers['owner'])
    assert missing.status_code == 404


@pytest.mark.parametrize('payload', [b'<svg xmlns="http://www.w3.org/2000/svg"/>', b'GIF89a', b'<script>alert(1)</script>', b'', b'RIFFxxxxNOTPxxxx'])
async def test_declared_image_type_cannot_bypass_magic_validation(market, payload, evidence_storage):
    task = await assigned(market)
    response = await upload(market, task, payload)
    assert response.status_code == 415, response.text
    assert not list(evidence_storage.rglob('*.png'))


async def test_photo_size_is_bounded_before_storage(market, evidence_storage):
    from app.services.task_evidence import MAX_PHOTO_BYTES
    task = await assigned(market)
    response = await upload(market, task, PNG + b'0' * (MAX_PHOTO_BYTES - len(PNG) + 1))
    assert response.status_code == 413
    assert not list(evidence_storage.rglob('*.png'))


async def test_concurrent_tenth_photo_cannot_exceed_task_limit(market, evidence_storage):
    task = await assigned(market)
    for _ in range(9):
        assert (await upload(market, task)).status_code == 201
    results = await asyncio.gather(upload(market, task), upload(market, task))
    assert sorted(result.status_code for result in results) == [201, 409]
    async with market.db() as db:
        saved = await db.get(Task, uuid.UUID(task['task_id']))
        assert len(saved.input_spec_json['_evidence_files']) == 10
    assert len(list(evidence_storage.rglob('*.png'))) == 10


@pytest.mark.parametrize('role', ['owner', 'stranger', 'admin'])
async def test_only_assigned_worker_can_upload(market, role):
    task = await assigned(market)
    response = await upload(market, task, role=role)
    assert response.status_code == 403


@pytest.mark.parametrize('blocked', ['funding', 'assignment', 'qualification', 'prerequisite', 'state'])
async def test_evidence_upload_rechecks_execution_guards(market, blocked):
    from app.models.human import WorkerProfile
    from app.models.workflow_extension import TaskDependency
    task = await assigned(market)
    async with market.db() as db:
        saved = await db.get(Task, uuid.UUID(task['task_id']))
        if blocked == 'funding':
            job = await db.get(Job, saved.job_id)
            job.billing_mode = 'stripe'
        elif blocked == 'assignment':
            assignment = await db.scalar(select(Assignment).where(Assignment.task_id == saved.id))
            assignment.status = 'cancelled'
        elif blocked == 'qualification':
            profile = await db.get(WorkerProfile, market.users['developer'].id)
            profile.verification_status = 'rejected'
        elif blocked == 'state':
            saved.status = 'submitted'
        else:
            dependency = Task(job_id=saved.job_id, title='Unfinished prerequisite', description='Wait for a separate prerequisite.', task_type='research', status='pending')
            db.add(dependency)
            await db.flush()
            db.add(TaskDependency(task_id=saved.id, depends_on_task_id=dependency.id))
        await db.commit()
    result = await upload(market, task)
    assert result.status_code == (402 if blocked == 'funding' else 403 if blocked == 'assignment' else 409), result.text


async def test_stopping_new_work_does_not_block_evidence_for_existing_assignment(market):
    from app.models.human import WorkerProfile
    task = await assigned(market)
    async with market.db() as db:
        profile = await db.get(WorkerProfile, market.users['developer'].id)
        profile.profile = {**profile.profile, 'available': False}
        await db.commit()
    assert (await upload(market, task)).status_code == 201


@pytest.mark.parametrize(('data', 'expected_type', 'extension'), [
    (b'\xff\xd8\xff\xe0photo\xff\xd9', 'image/jpeg', 'jpg'),
    (b'RIFF' + (8).to_bytes(4, 'little') + b'WEBPVP8L', 'image/webp', 'webp'),
])
async def test_supported_magic_controls_storage_type_not_the_client_name_or_header(market, evidence_storage, data, expected_type, extension):
    task = await assigned(market)
    response = await upload(market, task, data, filename='untrusted.html', content_type='text/html')
    assert response.status_code == 201
    reference = response.json()['reference']
    identifier = reference.rsplit('/', 1)[-1]
    assert (evidence_storage / 'human' / task['task_id'] / f'{identifier}.{extension}').read_bytes() == data
    result = await market.http.get(reference.removeprefix('/api/v1'), headers=market.headers['owner'])
    assert result.headers['content-type'] == expected_type


async def test_failed_database_commit_does_not_leave_a_photo_on_disk(market, evidence_storage, monkeypatch):
    from app.services import task_evidence
    task = await assigned(market)
    async def reject_audit(*args, **kwargs):
        raise RuntimeError('Injected transaction failure')
    monkeypatch.setattr(task_evidence, 'log_audit', reject_audit)
    with pytest.raises(RuntimeError, match='Injected transaction failure'):
        await upload(market, task)
    assert not list(evidence_storage.rglob('*.png'))
    async with market.db() as db:
        saved = await db.get(Task, uuid.UUID(task['task_id']))
        assert not (saved.input_spec_json or {}).get('_evidence_files')


async def test_reassigned_worker_keeps_own_photo_but_not_a_successors_photo(market):
    task = await assigned(market)
    first = (await upload(market, task)).json()['reference']
    successor = await verified_worker(market, role='stranger')
    async with market.db() as db:
        current = await db.scalar(select(Assignment).where(Assignment.task_id == uuid.UUID(task['task_id'])))
        current.status = 'cancelled'
        db.add(Assignment(task_id=uuid.UUID(task['task_id']), agent_id=uuid.UUID(successor['agent_id']), status='active'))
        await db.commit()
    second = await upload(market, task, role='stranger')
    assert second.status_code == 201
    first_read = await market.http.get(first.removeprefix('/api/v1'), headers=market.headers['developer'])
    other_read = await market.http.get(second.json()['reference'].removeprefix('/api/v1'), headers=market.headers['developer'])
    assert first_read.status_code == 200 and other_read.status_code == 403


async def test_mandate_can_download_only_its_own_task_photos_and_cannot_upload(market):
    from datetime import datetime, timedelta

    from test_human_tasks import contract, principal
    from test_lifecycle_integration import request

    from app.models import Quote
    from app.services.quote_service import accept_quote
    p = await principal(market)
    agent = await request(market, 'POST', '/worker-portal/agents', expected=201,
        json={'name': 'Evidence requester', 'endpoint_url': 'https://example.test/evidence-agent'})
    mandates = []
    for _ in range(2):
        mandates.append(await request(market, 'POST', f"/principals/{p['id']}/delegations", expected=201,
            json={'agent_id': agent['id'], 'max_amount_minor': 2200, 'categories': ['translation_review'],
                  'expires_at': (datetime.now(UTC) + timedelta(hours=1)).isoformat()}))
    body = contract(p['id'], requester_type='AGENT_REQUESTER', requesting_agent_id=agent['id'], delegation_id=mandates[0]['id'])
    headers = {'Authorization': 'Bearer ' + mandates[0]['access_token'], 'Idempotency-Key': 'delegated-evidence'}
    created = await market.http.post('/human-tasks', headers=headers, json=body)
    assert created.status_code == 201
    task = created.json()
    await request(market, 'POST', f"/human-tasks/{task['task_id']}/publish", role='admin',
        json={'authorizations_verified': True, 'qualifications_verified': True, 'notes': 'Permissions independently reviewed'})
    async with market.db() as db:
        job = await db.get(Job, uuid.UUID(task['parent_job_id']))
        job.billing_mode = 'legacy_manual'
        quote = await db.scalar(select(Quote).where(Quote.job_id == job.id))
        await accept_quote(db, quote)
        await db.commit()
    await verified_worker(market)
    await request(market, 'POST', f"/human-tasks/{task['task_id']}/claim", role='developer')
    uploaded = await upload(market, task)
    assert uploaded.status_code == 201
    path = uploaded.json()['reference'].removeprefix('/api/v1')
    for index, expected in [(0, 200), (1, 403)]:
        result = await market.http.get(path, headers={'Authorization': 'Bearer ' + mandates[index]['access_token']})
        assert result.status_code == expected
    denied = await market.http.post(f"/human-tasks/{task['task_id']}/evidence", headers=headers,
                                   files={'file': ('photo.png', PNG, 'image/png')})
    assert denied.status_code == 401
