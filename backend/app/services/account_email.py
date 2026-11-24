"""One-time account links. The outbox stores no reusable password-reset secret."""
from datetime import UTC, datetime, timedelta
import hashlib
import hmac
from uuid import uuid4

from sqlalchemy import select

from app.core.config import settings
from app.models.account_email import AccountEmail
from app.models.mail import MailOutbox


# A link's MAC covers its purpose, expiration, mailbox and database identifier.
# Only the mailer constructs it. The browser receives it in the URL fragment.
def link_token(data):
    signed = "|".join(str(data[key]) for key in ("id", "purpose", "email", "expires"))
    sig = hmac.new(settings.SECRET_KEY.encode(), ("account-email/v1|" + signed).encode(), hashlib.sha256)
    return f"{data['id']}.{sig.hexdigest()}"


async def queue_account_email(db, user, purpose):
    now = datetime.now(UTC)
    recent = await db.scalar(select(AccountEmail.id).where(
        AccountEmail.user_id == user.id, AccountEmail.purpose == purpose,
        AccountEmail.created_at > now - timedelta(minutes=5)).limit(1))
    if recent:
        return
    exp = now + (timedelta(hours=24) if purpose == "verify" else timedelta(minutes=30))
    row = AccountEmail(id=uuid4(), purpose=purpose, email=user.email, user_id=user.id, expires_at=exp)
    db.add(row)
    db.add(MailOutbox(kind=purpose, payload={
        "id": str(row.id), "purpose": purpose, "email": user.email, "expires": int(exp.timestamp()),
        "language": (user.registration_attribution or {}).get("language", "en"),
    }))


MAIL_TEXT = {
    "en": ("Verify your email address", "Reset your password", "Open this single-use link to continue."),
    "fr": ("Vérifiez votre adresse e-mail", "Réinitialisez votre mot de passe", "Ouvrez ce lien à usage unique pour continuer."),
    "es": ("Verifica tu correo electrónico", "Restablece tu contraseña", "Abre este enlace de un solo uso para continuar."),
    "pt": ("Verifique seu e-mail", "Redefina sua senha", "Abra este link de uso único para continuar."),
    "zh": ("验证您的电子邮箱", "重置您的密码", "请打开此一次性链接以继续。"),
}


def render_account_email(message, kind, data):
    lang = data["language"] if data.get("language") in MAIL_TEXT else "en"
    verify, reset, body = MAIL_TEXT[lang]
    message["To"] = data["email"]
    message["Subject"] = "TaskMatch | " + (verify if kind == "verify" else reset)
    address = settings.BILLING_SITE_URL.rstrip("/") + f"/account-access?lang={lang}&action={kind}#" + link_token(data)
    message.set_content(body + "\n\n" + address)
