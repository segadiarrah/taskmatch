"""Explicit confirmation and recovery. GET requests never consume email links."""
from datetime import UTC, datetime
import hmac
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select, update
from sqlalchemy.orm import lazyload

from app.services.mail_worker import contact_transport_available
from app.core.database import get_db
from app.core.security import hash_password
from app.middleware.audit import log_audit
from app.models.account_email import AccountEmail
from app.models.user import User
from app.services.account_email import link_token, queue_account_email

router = APIRouter()
database = Depends(get_db, scope="function")


class RequestLink(BaseModel):
    email: EmailStr
    purpose: Literal["verify", "reset"]


class ConfirmLink(BaseModel):
    token: str = Field(min_length=80, max_length=110, pattern=r"^[a-f0-9-]+\.[a-f0-9]{64}$")
    purpose: Literal["verify", "reset"]
    password: str | None = Field(default=None, min_length=8, max_length=128)


@router.post("/account-email/request", status_code=202)
async def request_link(body: RequestLink, db=database):
    if not contact_transport_available(body.purpose):
        raise HTTPException(503, "Account email delivery unavailable")
    user = await db.scalar(select(User).options(lazyload("*")).where(
        func.lower(User.email) == body.email.lower(), User.is_active.is_(True)).with_for_update())
    if user and (body.purpose == "reset" or not user.email_verified_at):
        await queue_account_email(db, user, body.purpose)
    return {"accepted": True}


@router.post("/account-email/confirm")
async def confirm(body: ConfirmLink, db=database):
    invalid = HTTPException(400, "Invalid or expired account link")
    try:
        identifier = UUID(body.token.split(".")[0])
    except ValueError:
        raise invalid from None
    # Lock the user before the link, serializing competing requests for the account.
    owner = await db.scalar(select(AccountEmail.user_id).where(AccountEmail.id == identifier))
    if owner is None:
        raise invalid
    user = await db.scalar(select(User).options(lazyload("*")).where(User.id == owner).with_for_update())
    link = await db.get(AccountEmail, identifier, with_for_update=True)
    now = datetime.now(UTC)
    if (not user or not user.is_active or link.email != user.email or link.used_at or link.expires_at <= now
            or link.purpose != body.purpose):
        raise invalid
    expected = link_token({"id": link.id, "purpose": link.purpose, "email": link.email,
                           "expires": int(link.expires_at.timestamp())})
    if not hmac.compare_digest(body.token, expected):
        raise invalid
    if body.purpose == "reset":
        if not body.password:
            raise HTTPException(422, "New password required")
        user.hashed_password = hash_password(body.password)
        user.session_version += 1
    user.email_verified_at = user.email_verified_at or now
    await db.execute(update(AccountEmail).where(AccountEmail.user_id == owner,
                     AccountEmail.purpose == body.purpose, AccountEmail.used_at.is_(None)).values(used_at=now))
    await log_audit(db, actor_type="user", actor_id=str(owner), entity_type="user", entity_id=str(owner),
                    action="password_reset" if body.purpose == "reset" else "email_verified", payload={})
    return {"completed": True}
