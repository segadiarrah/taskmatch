"""Deliver a committed outbox row. The SMTP/MTA acknowledgement is recorded separately."""
from __future__ import annotations

import asyncio
import logging
import os
from datetime import UTC, datetime, timedelta
from email import policy
from email.headerregistry import Address
from email.message import EmailMessage
from pathlib import Path
import smtplib
import ssl
import subprocess

from sqlalchemy import delete, func, select

from app.core.config import settings
from app.core.database import async_session_factory
from app.models.mail import MailOutbox

log = logging.getLogger(__name__)
SIGNUP_TO = "sega@tauraco.ai"
OPT_OUT = {
    "en": "Reply STOP to opt out.",
    "fr": "Répondez STOP pour vous opposer aux prochains envois.",
    "es": "Responde STOP para dejar de recibir mensajes.",
    "pt": "Responda STOP para deixar de receber mensagens.",
    "zh": "回复 STOP 即可退订。",
}


class MailConfigurationError(Exception):
    pass


def _address(value: str | None) -> Address:
    try:
        address = Address(addr_spec=value or "")
        if not address.domain or not address.username:
            raise ValueError
        return address
    except (ValueError, IndexError) as exc:
        raise MailConfigurationError from exc


def build_message(kind: str, payload: dict, sender: str, identifier: str) -> EmailMessage:
    message = EmailMessage(policy=policy.SMTP)
    from_address = _address(sender)
    message["From"] = Address("TaskMatch", from_address.username, from_address.domain)
    message["Message-ID"] = f"<{identifier}@{from_address.domain}>"
    if kind == "signup":
        fields = payload["attribution"] or {}
        message["To"] = SIGNUP_TO
        message["Subject"] = "[TaskMatch] Nouvelle inscription"
        lines = [
            f"Date : {payload['created_at']}", f"Adresse du compte : {payload['email']}",
            f"Type de compte : {payload['role']}", f"Intention : {fields.get('intent', 'non renseignée')}",
            f"Langue : {fields.get('language', 'non renseignée')}",
        ]
        for key, label in (("country", "Pays"), ("utm_source", "utm_source"), ("utm_medium", "utm_medium"),
                           ("utm_campaign", "utm_campaign"), ("utm_content", "utm_content"),
                           ("utm_term", "utm_term"), ("referral", "Référence")):
            if fields.get(key):
                lines.append(f"{label} : {fields[key]}")
        message.set_content("\n".join(lines))
    elif kind in {"verify", "reset"}:
        from app.services.account_email import render_account_email
        render_account_email(message, kind, payload)
    elif kind == "outreach":
        message["To"] = _address(payload["email"])
        message["Subject"] = payload["subject"]
        message["Reply-To"] = _address(settings.CONTACT_TO)
        message["List-Unsubscribe"] = f"<mailto:{settings.CONTACT_TO}?subject=unsubscribe>"
        message.set_content(payload["message"] + "\n\nTaskMatch.ai | " + str(settings.CONTACT_TO)
                            + "\n" + OPT_OUT.get(payload.get("language"), OPT_OUT["en"]))
    elif kind == "contact":
        message["To"] = _address(settings.CONTACT_TO)
        message["Subject"] = "[TaskMatch] Contact"
        message["Reply-To"] = _address(payload["email"])
        message.set_content(f"Nom : {payload['name']}\nEmail : {payload['email']}\n"
                            f"Objet : {payload['subject']}\n\n{payload['message']}")
    else:
        raise ValueError("Unknown mail kind")
    return message


def check_transport(kind: str) -> str:
    operator_only = (kind in {"contact", "signup"} and settings.TASKMATCH_OPERATOR_FROM
                     and settings.CONTACT_TO == SIGNUP_TO)
    if settings.TASKMATCH_MAIL_ENABLED and _address(settings.SMTP_FROM).domain.lower() == "taskmatch.ai":
        sender = settings.SMTP_FROM
    elif operator_only:
        sender = str(_address(settings.TASKMATCH_OPERATOR_FROM))
    else:
        raise MailConfigurationError
    if settings.SMTP_SENDMAIL_PATH:
        executable = Path(settings.SMTP_SENDMAIL_PATH)
        if settings.SMTP_HOST or not executable.is_absolute() or not os.access(executable, os.X_OK):
            raise MailConfigurationError
    elif not settings.SMTP_HOST or bool(settings.SMTP_USER) != bool(settings.SMTP_PASSWORD):
        raise MailConfigurationError
    elif not (settings.SMTP_SSL or settings.SMTP_STARTTLS):
        if settings.SMTP_USER or settings.SMTP_HOST not in {"localhost", "127.0.0.1", "::1"}:
            raise MailConfigurationError
    return sender


def contact_transport_available(kind: str = "contact") -> bool:
    try:
        check_transport(kind)
        _address(settings.CONTACT_TO)
    except MailConfigurationError:
        return False
    return True


def deliver(kind: str, payload: dict, identifier: str) -> None:
    sender = check_transport(kind)
    message = build_message(kind, payload, sender, identifier)
    if settings.SMTP_SENDMAIL_PATH:
        subprocess.run([settings.SMTP_SENDMAIL_PATH, "-oi", "-f", sender, "--", str(message["To"])],
                       input=message.as_bytes(), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                       timeout=25, check=True)
        return

    if settings.SMTP_SSL:
        connection = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15,
                                      context=ssl.create_default_context())
    else:
        connection = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
    with connection as relay:
        if settings.SMTP_STARTTLS and not settings.SMTP_SSL:
            relay.starttls(context=ssl.create_default_context())
        if settings.SMTP_USER:
            relay.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        relay.send_message(message)


def _failure_code(exc: Exception) -> str:
    if isinstance(exc, MailConfigurationError):
        return "configuration"
    if isinstance(exc, smtplib.SMTPAuthenticationError):
        return "relay_authentication"
    if isinstance(exc, smtplib.SMTPRecipientsRefused):
        return "relay_recipient"
    if isinstance(exc, (TimeoutError, OSError, subprocess.SubprocessError, smtplib.SMTPException)):
        return "transport"
    return "internal"


async def process_one(factory=async_session_factory, transport=deliver) -> bool:
    # PostgreSQL releases this row lock if the worker dies. Multiple workers
    # never process the same row concurrently. An ambiguous SMTP handoff after
    # a crash may repeat the message with the same immutable Message-ID.
    async with factory.begin() as db:
        row = await db.scalar(select(MailOutbox).where(
            MailOutbox.accepted_at.is_(None), MailOutbox.next_attempt_at <= func.now(),
        ).order_by(MailOutbox.next_attempt_at, MailOutbox.id).limit(1).with_for_update(skip_locked=True))
        if row is None:
            return False
        outreach = None
        recipient = None
        if row.kind == "outreach":
            from app.models.growth import GrowthCredential
            from app.models.outreach import OutreachMessage, OutreachRecipient
            outreach = await db.get(OutreachMessage, row.id, with_for_update=True)
            recipient = await db.get(OutreachRecipient, outreach.recipient_id, with_for_update=True)
            credential = await db.get(GrowthCredential, outreach.credential_id, with_for_update=True)
            if recipient.suppressed or credential.revoked_at or credential.expires_at <= datetime.now(UTC):
                outreach.state = "suppressed"
                await db.delete(row)
                return True
        row.attempts += 1
        try:
            await asyncio.to_thread(transport, row.kind, row.payload, str(row.id))
        except Exception as exc:
            if outreach and isinstance(exc, smtplib.SMTPRecipientsRefused) and all(
                    500 <= code < 600 for code, _ in exc.recipients.values()):
                recipient.suppressed = "bounced"
                outreach.state = "bounced"
                await db.delete(row)
                return True
            row.last_error = _failure_code(exc)
            seconds = min(3600, 30 * 2 ** min(row.attempts - 1, 7))
            row.next_attempt_at = datetime.now(UTC) + timedelta(seconds=seconds)
            log.warning("mail_deferred id=%s kind=%s reason=%s", row.id, row.kind, row.last_error)
        else:
            if outreach:
                outreach.state = "relay_accepted"
            row.accepted_at = datetime.now(UTC)
            row.last_error = None
            row.payload = {}  # Keep the audit receipt, release the message content.
            log.info("mail_accepted id=%s kind=%s", row.id, row.kind)
        return True


async def run():
    heartbeat = Path("/tmp/taskmatch-mail-heartbeat")
    next_cleanup = datetime.min.replace(tzinfo=UTC)
    while True:
        try:
            now = datetime.now(UTC)
            if now >= next_cleanup:
                async with async_session_factory.begin() as db:
                    await db.execute(delete(MailOutbox).where(MailOutbox.accepted_at < now - timedelta(days=30)))
                next_cleanup = now + timedelta(hours=12)
            worked = await process_one()
            heartbeat.touch()
            if not worked:
                await asyncio.sleep(3)
        except Exception:
            # Never log payloads, SMTP errors or exception strings with DB parameters.
            log.error("mail_worker_database_unavailable")
            await asyncio.sleep(5)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run())
