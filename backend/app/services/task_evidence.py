"""Private, bounded photo evidence attached to the existing task contract."""
import asyncio
import hashlib
import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import lazyload

from app.middleware.audit import log_audit
from app.models import Agent, Assignment, Job, Task
from app.models.human import WorkerProfile
from app.services.human_workers import require_eligible_executor
from app.services.task_access import load_execution_task

MAX_PHOTO_BYTES = 10 * 1024 * 1024
MAX_TASK_PHOTOS = 10
PHOTO_TYPES = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'}


def photo_type(data: bytes) -> str:
    """Recognize allowed binary signatures; a client MIME/filename is never proof."""
    if len(data) >= 4 and data.startswith(b'\xff\xd8\xff'):
        return 'image/jpeg'
    if len(data) >= 24 and data.startswith(b'\x89PNG\r\n\x1a\n') and data[12:16] == b'IHDR':
        return 'image/png'
    if (len(data) >= 16 and data[:4] == b'RIFF' and data[8:12] == b'WEBP'
            and data[12:16] in (b'VP8 ', b'VP8L', b'VP8X')
            and int.from_bytes(data[4:8], 'little') == len(data) - 8):
        return 'image/webp'
    raise HTTPException(415, 'Use a JPEG, PNG or WebP photo')


def records(task):
    value = (task.input_spec_json or {}).get('_evidence_files', [])
    if not isinstance(value, list) or len(value) > MAX_TASK_PHOTOS or any(not isinstance(row, dict) for row in value):
        raise HTTPException(409, 'Photo evidence records need review')
    return value


def storage_path(task_id: uuid.UUID, file_id: uuid.UUID, media_type: str, *, create=False) -> Path:
    root = Path(os.environ.get('UPLOAD_DIR', '/app/uploads')).resolve()
    human = root / 'human'
    folder = human / str(task_id)
    target = folder / f'{file_id}.{PHOTO_TYPES[media_type]}'
    # All path segments are server-issued UUIDs; refuse filesystem symlinks too.
    if any(path.is_symlink() for path in (human, folder, target)):
        raise HTTPException(503, 'Private photo storage is unavailable')
    if create:
        root.mkdir(parents=True, exist_ok=True, mode=0o700)
        human.mkdir(exist_ok=True, mode=0o700)
        folder.mkdir(exist_ok=True, mode=0o700)
    return target


async def assigned_worker(db, task_id, user):
    profile = await db.get(WorkerProfile, user.id, populate_existing=True)
    assignment = await db.scalar(select(Assignment).options(lazyload('*')).join(Agent, Agent.id == Assignment.agent_id)
        .where(Assignment.task_id == task_id, Assignment.status == 'active',
               Assignment.agent_id == profile.agent_id, Agent.developer_user_id == user.id)) if profile else None
    if not assignment:
        raise HTTPException(403, 'No active assignment owned by this worker')
    return assignment


def write_private(path, data):
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, 'O_NOFOLLOW', 0)
    descriptor = os.open(path, flags, 0o600)
    try:
        with os.fdopen(descriptor, 'wb') as output:
            output.write(data)
            output.flush()
            os.fsync(output.fileno())
    except BaseException:
        path.unlink(missing_ok=True)
        raise


async def upload_photo(db, task_id, user, upload: UploadFile):
    task = await db.get(Task, task_id, options=[lazyload('*')])
    if not task or not task.human_contract_json:
        raise HTTPException(404, 'Human Task not found')
    # Reject unrelated users before reading a potentially large file.
    await assigned_worker(db, task_id, user)
    data = bytearray()
    while chunk := await upload.read(64 * 1024):
        data.extend(chunk)
        if len(data) > MAX_PHOTO_BYTES:
            raise HTTPException(413, 'Each photo must be at most 10 MB')
    media_type = photo_type(data)
    # Serialize the final assignment/funding/dependency check and the file limit.
    _, task = await load_execution_task(db, task_id)
    if not task.human_contract_json:
        raise HTTPException(404, 'Human Task not found')
    if task.status not in ('assigned', 'in_progress', 'validation_failed'):
        raise HTTPException(409, 'This task is not accepting evidence')
    assignment = await assigned_worker(db, task_id, user)
    await require_eligible_executor(db, task, assignment.agent_id, accepting=False)
    existing = records(task)
    if len(existing) >= MAX_TASK_PHOTOS:
        raise HTTPException(409, 'This task already has 10 photos')
    file_id = uuid.uuid4()
    path = None
    created = False
    try:
        path = storage_path(task.id, file_id, media_type, create=True)
        await asyncio.to_thread(write_private, path, data)
        created = True
        record = {'id': str(file_id), 'type': media_type, 'size': len(data),
                  'sha256': hashlib.sha256(data).hexdigest(), 'author_user_id': str(user.id)}
        task.input_spec_json = {**(task.input_spec_json or {}), '_evidence_files': [*existing, record]}
        await log_audit(db, actor_type='user', actor_id=str(user.id), action='human_task.evidence_uploaded',
            entity_type='task', entity_id=str(task.id), payload={'file_id': str(file_id), 'type': media_type,
                                                               'size': len(data), 'sha256': record['sha256']})
        await db.commit()
    except BaseException:
        if created:
            path.unlink(missing_ok=True)
        raise
    return {'reference': f'/api/v1/human-tasks/{task.id}/evidence/{file_id}'}


async def download_photo(db, task_id, file_id, identity):
    task = await db.get(Task, task_id, options=[lazyload('*')])
    if not task or not task.human_contract_json:
        raise HTTPException(404, 'Human Task not found')
    user, delegation = identity
    record = next((row for row in records(task) if row.get('id') == str(file_id)), None)
    job = await db.get(Job, task.job_id, options=[lazyload('*')])
    if delegation:
        if (task.human_contract_json.get('delegation_id') != str(delegation.id)
                or task.human_contract_json.get('principal_id') != str(delegation.principal_id)
                or job.client_user_id != user.id):
            raise HTTPException(403, 'Photo evidence is outside this mandate')
    elif job.client_user_id != user.id and user.role != 'admin':
        assignments = (await db.scalars(select(Assignment).options(lazyload('*')).join(Agent, Agent.id == Assignment.agent_id)
            .where(Assignment.task_id == task.id, Agent.developer_user_id == user.id))).all()
        # Reassigned workers keep their own photos, but cannot read a successor's.
        if not any(a.status == 'active' for a in assignments) and not (
                assignments and record and record.get('author_user_id') == str(user.id)):
            raise HTTPException(403, 'Photo evidence is not accessible to this account')
    if not record or record.get('type') not in PHOTO_TYPES:
        raise HTTPException(404, 'Photo evidence not found')
    path = storage_path(task.id, file_id, record['type'])
    if not path.is_file() or path.stat().st_size != record.get('size'):
        raise HTTPException(404, 'Photo evidence is unavailable')
    return path, record['type']
