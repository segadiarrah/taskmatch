"""Authenticated private photo attachments; never served as static uploads."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models import User
from app.services import task_evidence as service
from app.services.human_authorization import caller, enabled

router = APIRouter(dependencies=[Depends(enabled)])


@router.post('/human-tasks/{task_id}/evidence', status_code=201)
async def upload_evidence(task_id: uuid.UUID, file: Annotated[UploadFile, File()],
                          user: Annotated[User, Depends(get_current_active_user)],
                          db: Annotated[AsyncSession, Depends(get_db, scope="function")]):
    try:
        return await service.upload_photo(db, task_id, user, file)
    finally:
        await file.close()


@router.get('/human-tasks/{task_id}/evidence/{file_id}')
async def download_evidence(task_id: uuid.UUID, file_id: uuid.UUID,
                            identity: Annotated[tuple, Depends(caller)],
                            db: Annotated[AsyncSession, Depends(get_db, scope="function")]):
    path, media_type = await service.download_photo(db, task_id, file_id, identity)
    return FileResponse(path, media_type=media_type, filename=path.name,
        headers={'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store',
                 'Content-Security-Policy': "default-src 'none'; sandbox",
                 'Cross-Origin-Resource-Policy': 'same-origin'}, content_disposition_type='attachment')
