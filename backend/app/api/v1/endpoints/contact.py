"""Accept a contact message for private, asynchronous delivery."""
from datetime import UTC, datetime, timedelta
import hashlib
import hmac

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.mail import MailOutbox
from app.services.mail_worker import contact_transport_available

router = APIRouter()


class ContactMessage(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    subject: str = Field(min_length=1, max_length=300)
    message: str = Field(min_length=1, max_length=8000)
    website: str = Field(default="", max_length=0)  # Honeypot, hidden from people.

    @field_validator("name", "subject")
    @classmethod
    def single_line(cls, value: str) -> str:
        if not value.isprintable():
            raise ValueError("Enter a single line of text")
        return value


def _key(category: str, value: str) -> str:
    return hmac.new(settings.SECRET_KEY.encode(), f"{category}:{value}".encode(), hashlib.sha256).hexdigest()


@router.post("", summary="Queue a contact message", status_code=status.HTTP_202_ACCEPTED)
async def submit_contact(payload: ContactMessage, request: Request,
                         db: AsyncSession = Depends(get_db, scope="function")) -> dict:
    if not contact_transport_available():
        raise HTTPException(503, "Contact delivery is temporarily unavailable.")
    sender_key = _key("sender", payload.email.lower())
    peer_key = _key("peer", request.client.host if request.client else "unknown")
    # A brief transaction lock prevents simultaneous requests bypassing the
    # rolling limits. Use the actual connection peer, including shared proxies.
    await db.execute(text("SELECT pg_advisory_xact_lock(29816031)"))
    now = datetime.now(UTC)
    hour = now - timedelta(hours=1)
    counts = (await db.execute(select(
        func.count(),
        func.count().filter(MailOutbox.sender_key == sender_key),
        func.count().filter(MailOutbox.peer_key == peer_key, MailOutbox.created_at >= now - timedelta(minutes=1)),
    ).where(MailOutbox.kind == "contact", MailOutbox.created_at >= hour))).one()
    if counts[0] >= 300 or counts[1] >= 3 or counts[2] >= 20:
        raise HTTPException(429, "Too many contact messages. Please try again later.", headers={"Retry-After": "3600"})
    db.add(MailOutbox(kind="contact", payload=payload.model_dump(exclude={"website"}), sender_key=sender_key, peer_key=peer_key))
    return {"status": "queued"}
