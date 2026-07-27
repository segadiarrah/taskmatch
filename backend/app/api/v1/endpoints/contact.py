"""Public contact-form endpoint.

Accepts a contact message from the marketing site and delivers it by email
to ``settings.CONTACT_TO`` (sega@tauraco.ai) via the configured SMTP relay
(Brevo). Falls back to a clear error if SMTP is not configured so the frontend
can degrade gracefully.
"""

from __future__ import annotations

import asyncio
import smtplib
import ssl
from email.mime.text import MIMEText
from email.utils import formataddr

import structlog
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.core.config import settings

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)

router = APIRouter()


class ContactMessage(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    subject: str = Field(default="", max_length=300)
    message: str = Field(..., min_length=1, max_length=8000)


def _send_email(payload: ContactMessage) -> None:
    """Blocking SMTP send (run in a worker thread)."""
    subject = f"[TaskMatch Contact] {payload.subject or 'New message'}"
    body = (
        f"New contact-form submission on taskmatch.ai\n\n"
        f"Name:    {payload.name}\n"
        f"Email:   {payload.email}\n"
        f"Subject: {payload.subject or '(none)'}\n\n"
        f"Message:\n{payload.message}\n"
    )
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = formataddr(("TaskMatch.ai", settings.SMTP_FROM))
    msg["To"] = settings.CONTACT_TO
    msg["Reply-To"] = formataddr((payload.name, str(payload.email)))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
        server.ehlo()
        if settings.SMTP_STARTTLS:
            server.starttls(context=ssl.create_default_context())
            server.ehlo()
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM, [settings.CONTACT_TO], msg.as_string())


@router.post("", summary="Send a contact-form message", status_code=status.HTTP_202_ACCEPTED)
async def submit_contact(payload: ContactMessage) -> dict:
    if not settings.SMTP_HOST:
        logger.error("contact.smtp_not_configured")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Contact email is not configured.",
        )
    try:
        await asyncio.to_thread(_send_email, payload)
    except Exception as exc:  # noqa: BLE001
        logger.exception("contact.send_failed", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not send your message right now. Please email sega@tauraco.ai directly.",
        )
    logger.info("contact.sent", to=settings.CONTACT_TO, from_email=str(payload.email))
    return {"status": "sent", "to": settings.CONTACT_TO}
