"""Public signup/contact regression checks using only a disposable PostgreSQL database."""
import asyncio
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, text

from test_lifecycle_integration import market  # noqa: F401


def account(email, **changes):
    return {
        "email": email, "password": "test-password-not-for-mail", "full_name": "Display name",
        "role": "client", **changes,
    }


async def test_attribution_and_single_outbox_record_survive_duplicate_registration(market):
    fields = dict(intent="work", language="fr", country="ML", utm_source="guide",
                  utm_medium="email", utm_campaign="launch", referral="partner")
    body = account("new-owner@real-business.fr", attribution=fields)
    first = await market.http.post("/auth/register", json=body)
    assert first.status_code == 201, first.text
    duplicate = await market.http.post("/auth/register", json=body)
    assert duplicate.status_code == 409
    async with market.db() as db:
        row = (await db.execute(text(
            "SELECT registration_origin, registration_attribution FROM users WHERE email=:email"
        ), {"email": body["email"]})).one()
        assert row.registration_origin == "public"
        assert row.registration_attribution == fields
        message = (await db.execute(text("SELECT kind, payload, attempts FROM mail_outbox"))).one()
        assert message.kind == "signup"
        assert message.attempts == 0
        assert body["password"] not in str(message.payload)
        assert body["full_name"] not in str(message.payload)
        assert "hashed_password" not in str(message.payload)
        from app.services.mail_worker import build_message
        mail = build_message(message.kind, message.payload, "team@real-business.fr", first.json()["id"])
        assert mail["To"] == "sega@tauraco.ai"
        assert mail["Subject"] == "[TaskMatch] Nouvelle inscription"
        for value in [body["email"], "client", "work", "fr", "ML", "guide", "email", "launch", "UTC"]:
            assert value in mail.get_content()


async def test_weekly_public_counts_exclude_seed_demo_test_admin_unknown(market):
    for email, role, intent in [
        ("worker@real-business.fr", "client", "work"),
        ("developer@real-business.fr", "agent_developer", "executor"),
        ("probe@example.com", "client", "project"),
    ]:
        res = await market.http.post("/auth/register", json=account(email, role=role, attribution={"intent": intent}))
        assert res.status_code == 201, res.text
    async with market.db() as db:
        await db.execute(text("UPDATE users SET registration_origin='demo' WHERE full_name='owner'"))
        await db.execute(text("UPDATE users SET registration_origin='seed' WHERE full_name='stranger'"))
        await db.commit()
    res = await market.http.get("/dashboard/overview", headers=market.headers["admin"])
    assert res.status_code == 200, res.text
    week = res.json()["weekly_registrations"]
    assert week["total"] == 2
    assert week["by_role"] == {"client": 1, "agent_developer": 1}
    assert week["by_intent"]["work"] == week["by_intent"]["executor"] == 1
    assert week["excluded"] == {"admin": 1, "test": 1, "seed": 1, "demo": 1, "unknown": 2}
    denied = await market.http.get("/dashboard/overview", headers=market.headers["owner"])
    assert denied.status_code == 403


async def test_contact_queue_rate_limit_and_private_receiver(market, monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "TASKMATCH_MAIL_ENABLED", True)
    monkeypatch.setattr(settings, "SMTP_HOST", "relay.test")
    monkeypatch.setattr(settings, "SMTP_FROM", "fixture@taskmatch.ai")
    payload = {"name": "A name", "email": "sender@example.com", "subject": "Help", "message": "Message."}
    for changed in [{"subject": "Bad\nBcc: injection@invalid.test"}, {"message": "  "}, {"website": "bot"}]:
        assert (await market.http.post("/contact", json={**payload, **changed})).status_code == 422
    responses = await asyncio.gather(*(market.http.post("/contact", json=payload) for _ in range(4)))
    assert sorted(r.status_code for r in responses) == [202, 202, 202, 429]
    for r in responses:
        if r.status_code == 202:
            assert r.json() == {"status": "queued"}


async def test_worker_retries_safely_and_releases_personal_content(market):
    body = account("worker@real-business.fr")
    assert (await market.http.post("/auth/register", json=body)).status_code == 201
    from app.models.mail import MailOutbox
    from app.services.mail_worker import process_one

    def temporary_failure(*args):
        raise RuntimeError("sensitive upstream error")

    assert await process_one(market.db, temporary_failure)
    async with market.db() as db:
        row = await db.scalar(select(MailOutbox))
        assert row.attempts == 1 and row.accepted_at is None
        assert row.next_attempt_at > datetime.now(UTC)
        assert "sensitive" not in row.last_error
        row.next_attempt_at = datetime.now(UTC) - timedelta(seconds=1)
        await db.commit()
    seen = []
    def collect(*args):
        seen.append(args)
    assert await process_one(market.db, collect)
    assert not await process_one(market.db, collect)
    assert len(seen) == 1
    async with market.db() as db:
        row = await db.scalar(select(MailOutbox))
        assert row.accepted_at and row.payload == {} and row.attempts == 2


def test_smtp_reuses_verified_sender_with_tls_and_stable_message_id(monkeypatch):
    import smtplib
    from app.core.config import settings
    from app.services.mail_worker import deliver, MailConfigurationError

    payload = {"name": "Jane", "email": "person@example.com", "subject": "Partnership", "message": "Contact us."}
    seen = []
    class LocalRelay:
        def __init__(self, *args, **kwargs):
            seen.append("connect")
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def starttls(self, *, context):
            assert context.check_hostname
            seen.append("tls")
        def login(self, *args):
            seen.append("auth")
        def send_message(self, mail):
            seen.append(mail)
    monkeypatch.setattr(smtplib, "SMTP", LocalRelay)
    for key, val in {"TASKMATCH_MAIL_ENABLED": True, "SMTP_HOST": "relay.test", "SMTP_PORT": 587,
                    "SMTP_SSL": False, "SMTP_STARTTLS": True, "SMTP_USER": "test", "SMTP_PASSWORD": "test",
                    "SMTP_SENDMAIL_PATH": None, "SMTP_FROM": "fixture@taskmatch.ai",
                    "CONTACT_TO": "contact@real-business.fr"}.items():
        monkeypatch.setattr(settings, key, val)
    deliver("contact", payload, "test-id")
    assert seen[:3] == ["connect", "tls", "auth"]
    mail = seen[3]
    assert mail["To"] == "contact@real-business.fr" and mail["Reply-To"] == payload["email"]
    assert mail["Message-ID"] == "<test-id@taskmatch.ai>" and "Partnership" in mail.get_content()
    monkeypatch.setattr(settings, "SMTP_STARTTLS", False)
    import pytest
    with pytest.raises(MailConfigurationError):
        deliver("contact", payload, "test-id")
    assert len(seen) == 4


async def test_concurrent_workers_deliver_one_signup_once(market):
    import time
    from app.services.mail_worker import process_one
    assert (await market.http.post("/auth/register", json=account("concurrent@real-business.fr"))).status_code == 201
    seen = []
    def collect(kind, payload, identifier):
        seen.append(identifier)
        time.sleep(0.1)
    result = await asyncio.gather(process_one(market.db, collect), process_one(market.db, collect))
    assert sorted(result) == [False, True]
    assert len(seen) == 1

async def test_contact_discloses_unavailable_transport_without_queuing(market, monkeypatch):
    from app.core.config import settings
    from app.models.mail import MailOutbox
    monkeypatch.setattr(settings, "TASKMATCH_MAIL_ENABLED", False)
    res = await market.http.post("/contact", json={"name": "Person", "email": "person@example.com", "subject": "Question", "message": "Hello"})
    assert res.status_code == 503
    async with market.db() as db:
        assert await db.scalar(select(MailOutbox.id)) is None

def test_operator_mailbox_cannot_be_used_for_external_messages(monkeypatch):
    from app.core.config import settings
    from app.services.mail_worker import contact_transport_available
    monkeypatch.setattr(settings, "TASKMATCH_MAIL_ENABLED", False)
    monkeypatch.setattr(settings, "SMTP_HOST", "localhost")
    monkeypatch.setattr(settings, "TASKMATCH_OPERATOR_FROM", "ops@example.com")
    monkeypatch.setattr(settings, "CONTACT_TO", "sega@tauraco.ai")
    assert contact_transport_available("contact") and contact_transport_available("signup")
    for kind in ("verify", "reset", "outreach"):
        assert not contact_transport_available(kind)
    monkeypatch.setattr(settings, "CONTACT_TO", "other@example.org")
    assert not contact_transport_available("contact")


async def test_production_fixture_sessions_are_disabled_without_affecting_public_owner(market, monkeypatch):
    from app.core.config import settings
    from app.models.user import User
    async with market.db() as db:
        demo = await db.get(User, market.users["developer"].id)
        demo.registration_origin = "demo"
        await db.commit()
    monkeypatch.setattr(settings, "ENV", "production")
    assert (await market.http.get("/auth/me", headers=market.headers["developer"])).status_code == 401
    assert (await market.http.get("/auth/me", headers=market.headers["owner"])).status_code == 200
