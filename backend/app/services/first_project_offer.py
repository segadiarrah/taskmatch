"""Quote the fee waiver, reserve once before payment, and retain captured redemptions."""
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import String, cast, func, or_, select

from app.core.config import settings
from app.middleware.audit import log_audit
from app.models import AuditLog, Job, PaymentRecord, User
from app.models.billing import JobFunding
from app.services.registration import public_origin

LIMIT = 20
# A two-part PostgreSQL transaction lock (campaign, Stripe mode). All payment
# initiators take the job lock first and release both before any network call.
CAMPAIGN_LOCK = 1461782602
CAPTURED_STATES = ("paid", "refund_pending", "partially_refunded", "refunded", "disputed")
REQUOTE = "First-project eligibility changed. Refresh the quote and review the total before paying."
PENDING = "Another payment is pending for this account. Complete or cancel it, then retry."
CAPACITY_PENDING = "All remaining first-project places are reserved for payments in progress. Try again after they settle."


def captured():
    return or_(JobFunding.charge_id.is_not(None), JobFunding.status.in_(CAPTURED_STATES))


async def eligible_customer(db, user_id, live):
    account = (await db.execute(select(User.role, User.email, User.registration_origin)
                                .where(User.id == user_id))).one()
    if account.role == "admin":
        return False
    if live and (account.registration_origin in ("admin", "seed", "demo", "test")
                 or public_origin(account.email.lower()) == "test"):
        return False
    stripe_history = select(JobFunding.id).where(
        JobFunding.client_user_id == user_id, JobFunding.livemode == live, captured(),
        JobFunding.amount_minor > 0,
    )
    # Stripe Connect payouts have their own JobFunding and must not leak test
    # history into live. Demo lifecycle seeds have provider=stripe, ref=demo_*.
    confirmed_manual = select(AuditLog.id).where(
        AuditLog.entity_id == cast(PaymentRecord.id, String),
        or_((AuditLog.action == "complete_payment") & (AuditLog.entity_type == "payment"),
            (AuditLog.action == "payment.paid") & (AuditLog.entity_type == "payment_record")),
    ).correlate(PaymentRecord).exists()
    manual_history = select(PaymentRecord.id).join(Job, Job.id == PaymentRecord.job_id).where(
        PaymentRecord.client_user_id == user_id, PaymentRecord.funding_id.is_(None),
        PaymentRecord.gross_amount > 0, Job.billing_mode == "legacy_manual",
        or_(PaymentRecord.provider == "manual", confirmed_manual),
        or_(PaymentRecord.provider_ref.is_(None), ~PaymentRecord.provider_ref.startswith("demo_", autoescape=True)),
        PaymentRecord.payment_status.in_(("paid", "refunded", "reversed")),
    )
    return not await db.scalar(select(or_(stripe_history.exists(), manual_history.exists())))


async def price_new_quote(db, job, quote):
    """Apply only to new Stripe quotes. Displayed prices are immutable."""
    if job.billing_mode != "stripe" or quote.currency != "EUR" or quote.platform_fee <= 0:
        return
    live = settings.STRIPE_MODE == "live"
    if not await eligible_customer(db, job.client_user_id, live):
        return
    used = await db.scalar(select(func.count()).select_from(JobFunding).where(
        JobFunding.livemode == live, JobFunding.first_project_slot.is_not(None), captured()))
    if used >= LIMIT:
        return
    waived = quote.platform_fee
    quote.platform_fee = Decimal("0.00")
    quote.total = quote.subtotal
    if quote.human_equivalent_low:
        quote.savings_vs_human = round(max(0.0, 1.0 - float(quote.total / quote.human_equivalent_low)), 4)
    quote.breakdown_json = {
        **(quote.breakdown_json or {}), "platform_fee": 0, "total": float(quote.total),
        "platform_fee_waived": float(waived), "savings_vs_human": quote.savings_vs_human,
        "first_project_livemode": live,
    }


async def audit(db, funding, action):
    await log_audit(db, actor_type="system", actor_id="billing", action=f"first_project.{action}",
                    entity_type="funding", entity_id=str(funding.id),
                    payload={"slot": funding.first_project_slot, "client_user_id": str(funding.client_user_id),
                             "quote_id": str(funding.quote_id), "livemode": funding.livemode,
                             "generation": funding.generation, "amount_minor": funding.amount_minor})


async def lock_campaign(db, live):
    await db.execute(select(func.pg_advisory_xact_lock(CAMPAIGN_LOCK, int(live))))


async def reserve(db, funding, quote):
    """Serialize all first payments, including older full-price quotes racing a waiver."""
    live = funding.livemode
    await lock_campaign(db, live)
    offered = (quote.breakdown_json or {}).get("platform_fee_waived", 0) > 0
    other_payments = select(JobFunding.id).where(
        JobFunding.client_user_id == funding.client_user_id, JobFunding.livemode == live,
        JobFunding.id != funding.id, JobFunding.status.in_(("creating", "checkout_pending", "requires_review")),
    )
    if not offered:
        # Older/full-price quotes keep their original total. A concurrently held
        # waiver must settle first, preserving which project is paid first.
        if await db.scalar(select(other_payments.where(JobFunding.first_project_slot.is_not(None)).exists())):
            raise HTTPException(409, PENDING)
        return
    if (quote.breakdown_json["first_project_livemode"] != live or
            not await eligible_customer(db, funding.client_user_id, live)):
        raise HTTPException(409, REQUOTE)
    if await db.scalar(select(other_payments.exists())):
        raise HTTPException(409, PENDING)
    seats = (await db.execute(select(JobFunding.first_project_slot, captured()).where(
        JobFunding.livemode == live, JobFunding.first_project_slot.is_not(None)))).all()
    occupied = {slot for slot, _ in seats}
    available = next((slot for slot in range(1, LIMIT + 1) if slot not in occupied), None)
    if available is None:
        raise HTTPException(409, REQUOTE if all(paid for _, paid in seats) else CAPACITY_PENDING)
    funding.first_project_slot = available
    await audit(db, funding, "reserved")


async def release(db, funding):
    """Called only after existing billing reconciliation proves a terminal unpaid outcome."""
    if funding.first_project_slot is not None and not funding.charge_id:
        await audit(db, funding, "released")
        funding.first_project_slot = None


async def redeem(db, funding):
    """Both payment providers call this on the first independently verified capture."""
    await lock_campaign(db, funding.livemode)
    if funding.first_project_slot is not None:
        await audit(db, funding, "redeemed")
