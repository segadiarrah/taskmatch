"""Pseudonymous browser consent expires after one year (366 days)."""
import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert

from app.models.measurement import MeasurementEvent, MeasurementVisitor, ReferralLink
from app.models.user import User

COOKIE = "tm_usage_consent"
DAYS = 366


async def remove_expired(db):
    await db.execute(delete(MeasurementVisitor).where(
        MeasurementVisitor.consented_at <= datetime.now(UTC) - timedelta(days=DAYS)))


async def lookup(db, request, *, lock=False):
    token = request.cookies.get(COOKIE)
    if not token or len(token) != 43:
        return None
    query = select(MeasurementVisitor).where(
        MeasurementVisitor.digest == hashlib.sha256(token.encode()).hexdigest(),
        MeasurementVisitor.consented_at > datetime.now(UTC) - timedelta(days=DAYS))
    return await db.scalar(query.with_for_update() if lock else query)


async def referrer(db, code):
    if not code:
        return None
    return await db.scalar(select(ReferralLink.user_id).join(User, User.id == ReferralLink.user_id).where(
        ReferralLink.code == code, User.registration_origin == "public", User.role != "admin", User.is_active))


async def issue(db, language, code):
    token = secrets.token_urlsafe(32)
    row = MeasurementVisitor(digest=hashlib.sha256(token.encode()).hexdigest(),
                             language=language, referred_by=await referrer(db, code))
    db.add(row)
    await db.flush()
    return token


async def register(db, request, user):
    if request is None or request.headers.get("X-TaskMatch-Measurement") != "allow":
        return
    visitor = await lookup(db, request, lock=True)
    if visitor and not visitor.account_id:
        visitor.account_id = user.id
        if visitor.referred_by == user.id:
            visitor.referred_by = None


async def event(db, visitor, kind):
    await db.execute(insert(MeasurementEvent).values(visitor_id=visitor.id,
        utc_day=datetime.now(UTC).date(), kind=kind).on_conflict_do_nothing())
