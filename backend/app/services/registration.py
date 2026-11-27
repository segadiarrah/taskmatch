"""Record public signups and report the current UTC calendar week."""
from datetime import UTC, datetime, timedelta

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.mail import MailOutbox
from app.models.user import User


def public_origin(email: str) -> str:
    domain = email.rsplit("@", 1)[1]
    if (domain in {"example.com", "example.net", "example.org"} or domain.endswith((".test", ".invalid"))
            or email in {address.strip().lower() for address in settings.REGISTRATION_TEST_EMAILS}):
        return "test"
    return "public"


def fixture_access_disabled(user: User) -> bool:
    return settings.ENV == "production" and user.registration_origin in {"seed", "demo", "test"}


def signup_notification(user: User) -> MailOutbox:
    # Explicit allowlist. UserCreate also contains the plaintext password.
    return MailOutbox(id=user.id, kind="signup", payload={
        "email": user.email, "role": user.role, "attribution": user.registration_attribution,
        "created_at": user.created_at.astimezone(UTC).strftime("%Y-%m-%d %H:%M:%S UTC"),
    })


async def weekly_registrations(db: AsyncSession) -> dict:
    now = datetime.now(UTC)
    start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    origin = case((User.role == "admin", "admin"), else_=User.registration_origin)
    intent = User.registration_attribution["intent"].astext
    groups = await db.execute(select(origin, User.role, intent, func.count()).where(
        User.created_at >= start, User.created_at < start + timedelta(days=7),
    ).group_by(origin, User.role, intent))
    by_role = dict.fromkeys(("client", "agent_developer"), 0)
    by_intent = dict.fromkeys(("project", "work", "executor", "mission", "agent", "unknown"), 0)
    excluded = dict.fromkeys(("admin", "test", "seed", "demo", "unknown"), 0)
    for source, role, selected_intent, count in groups:
        if source == "public" and role in by_role:
            by_role[role] += count
            by_intent[selected_intent if selected_intent in by_intent else "unknown"] += count
        else:
            excluded[source if source in excluded else "unknown"] += count
    return {"start": start, "end": start + timedelta(days=7), "total": sum(by_role.values()),
            "by_role": by_role, "by_intent": by_intent, "excluded": excluded}
