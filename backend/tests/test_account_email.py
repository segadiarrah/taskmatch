"""Verified one-time reset and verification with the real account and outbox."""
import pytest
from sqlalchemy import select
from app.core.config import settings
from app.models.mail import MailOutbox
from app.services.account_email import link_token
from test_lifecycle_integration import market


@pytest.mark.parametrize("purpose", ["verify", "reset"])
async def test_account_email_one_time_and_session_revocation(market, monkeypatch, purpose):
    monkeypatch.setattr(settings, "TASKMATCH_MAIL_ENABLED", True)
    monkeypatch.setattr(settings, "SMTP_HOST", "localhost")
    monkeypatch.setattr(settings, "SMTP_FROM", "fixture@taskmatch.ai")
    identity = market.users["owner"]
    # The reserved fixture TLD is deliberately rejected by public EmailStr validation.
    async with market.db() as db:
        from app.models.user import User
        store = await db.get(User, identity.id)
        store.email = "account-email@example.com"
        await db.commit()
    body = {"email": "account-email@example.com", "purpose": purpose}
    reply = await market.http.post("/auth/account-email/request", json=body)
    assert reply.status_code == 202
    unknown = await market.http.post("/auth/account-email/request", json={**body, "email":"absent@example.com"})
    assert unknown.json() == reply.json()
    async with market.db() as db:
        row = await db.scalar(select(MailOutbox).where(MailOutbox.kind == purpose))
        token = link_token(row.payload)
    request = {"purpose": purpose, "token": token}
    if purpose == "reset":
        request["password"] = "Replacement-long-password-for-test"
    assert (await market.http.post("/auth/account-email/confirm", json=request)).status_code == 200
    assert (await market.http.post("/auth/account-email/confirm", json=request)).status_code == 400
    session = await market.http.get("/auth/me", headers=market.headers["owner"])
    assert session.status_code == (401 if purpose == "reset" else 200)
    if purpose == "reset":
        login = await market.http.post("/auth/login", data={"username":body["email"], "password":request["password"]})
        assert login.status_code == 200
        me = await market.http.get("/auth/me", headers={"Authorization": "Bearer " + login.json()["access_token"]})
        assert me.status_code == 200
