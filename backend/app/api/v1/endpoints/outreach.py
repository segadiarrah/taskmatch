"""Individual, audited messages for contacts with documented permission."""
from datetime import UTC, datetime, timedelta
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.growth import admin, database, reporting_scope
from app.middleware.audit import log_audit
from app.models.mail import MailOutbox
from app.models.outreach import OutreachMessage, OutreachRecipient
from app.services.mail_worker import contact_transport_available

router = APIRouter()
send_permission = Depends(reporting_scope("communications:send"))


class RecipientCreate(BaseModel):
    email: EmailStr
    permission_reference: str = Field(min_length=3, max_length=160)


class Suppression(BaseModel):
    reason: Literal["opt_out", "bounced"]


class Outgoing(BaseModel):
    language: Literal["en", "fr", "es", "pt", "zh"] = "en"
    recipient_id: UUID
    campaign: str = Field(pattern=r"^[a-zA-Z0-9_-]{1,80}$")
    subject: str = Field(min_length=1, max_length=160, pattern=r"^[^\r\n]+$")
    text: str = Field(min_length=1, max_length=4000)


@router.post("/admin/communications/recipients")
async def approve(body: RecipientCreate, user=admin, db: AsyncSession = database):
    # The same canonical mailbox has only one suppression history.
    email = body.email.lower()
    await db.execute(text("SELECT pg_advisory_xact_lock(55223017)"))
    row = await db.scalar(select(OutreachRecipient).where(OutreachRecipient.email == email))
    if not row:
        row = OutreachRecipient(email=email, permission_reference=body.permission_reference)
        db.add(row)
        await db.flush()
        await log_audit(db, actor_type="user", actor_id=str(user.id), action="approve_outreach_recipient",
                        entity_type="recipient", entity_id=str(row.id), payload={})
    return {"id": row.id, "suppressed": row.suppressed}


@router.post("/admin/communications/recipients/{recipient_id}/suppress")
async def suppress(recipient_id: UUID, body: Suppression, user=admin, db: AsyncSession = database):
    row = await db.get(OutreachRecipient, recipient_id, with_for_update=True)
    if not row:
        raise HTTPException(404, "Unknown recipient")
    row.suppressed = body.reason
    await log_audit(db, actor_type="user", actor_id=str(user.id), action="suppress_outreach",
                    entity_type="recipient", entity_id=str(row.id), payload={"reason": body.reason})
    return {"id": row.id, "suppressed": row.suppressed}


@router.post("/communications/messages", status_code=202)
async def enqueue(body: Outgoing, credential_id: UUID = send_permission, db: AsyncSession = database):
    if not contact_transport_available("outreach"):
        raise HTTPException(503, "Verified email transport unavailable")
    await db.execute(text("SELECT pg_advisory_xact_lock(55223017)"))
    recipient = await db.get(OutreachRecipient, body.recipient_id, with_for_update=True)
    if not recipient or recipient.suppressed:
        raise HTTPException(409, "Recipient unavailable")
    prior = await db.scalar(select(OutreachMessage).where(OutreachMessage.recipient_id == recipient.id,
                                                         OutreachMessage.campaign == body.campaign))
    if prior:
        if prior.credential_id != credential_id:
            raise HTTPException(409, "Recipient already contacted for this campaign")
        return {"id": prior.id, "status": prior.state}
    cutoff = datetime.now(UTC) - timedelta(days=1)
    daily = await db.scalar(select(func.count()).select_from(OutreachMessage).where(OutreachMessage.created_at >= cutoff))
    recent = await db.scalar(select(OutreachMessage.id).where(OutreachMessage.recipient_id == recipient.id,
                              OutreachMessage.created_at >= cutoff).limit(1))
    if daily >= 20 or recent:
        raise HTTPException(429, "Communications limit reached")
    row = OutreachMessage(recipient_id=recipient.id, credential_id=credential_id, campaign=body.campaign)
    db.add(row)
    await db.flush()
    db.add(MailOutbox(id=row.id, kind="outreach", payload={"email": recipient.email,
                    "subject": body.subject, "message": body.text, "language": body.language}))
    await log_audit(db, actor_type="agent", actor_id=str(credential_id), action="queue_outreach",
                    entity_type="outreach", entity_id=str(row.id), payload={})
    return {"id": row.id, "status": row.state}


@router.get("/communications/messages/{message_id}")
async def status(message_id: UUID, credential_id: UUID = send_permission, db: AsyncSession = database):
    row = await db.get(OutreachMessage, message_id)
    if not row or row.credential_id != credential_id:
        raise HTTPException(404, "Unknown message")
    return {"id": row.id, "status": row.state, "campaign": row.campaign}
