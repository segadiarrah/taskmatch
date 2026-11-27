"""Developer-owned Connect accounts; Stripe hosts all identity/bank collection."""

from __future__ import annotations

import re
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.parse import urlsplit

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.billing import StripeConnectAccount
from app.services.stripe_gateway import StripeGateway, StripeGatewayError, get_gateway

ISO_COUNTRIES = frozenset(
    """
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO
BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ
DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP
GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG
KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML
MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE
PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL
SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM
US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW
""".split()  # noqa: SIM905 - keep the ISO reference compact and reviewable.
)


class StripeConnectError(Exception):
    def __init__(self, message: str, status_code: int = 409) -> None:
        super().__init__(message)
        self.status_code = status_code


def connect_enabled() -> bool:
    key = settings.STRIPE_SECRET_KEY or ""
    return (
        settings.PAYMENT_MODE == "stripe"
        and bool(re.fullmatch(rf"[sr]k_{settings.STRIPE_MODE}_[A-Za-z0-9_]+", key))
        and bool((settings.STRIPE_CONNECT_WEBHOOK_SECRET or "").startswith("whsec_"))
    )


def _configured_gateway() -> StripeGateway:
    if not connect_enabled():
        raise StripeConnectError("Stripe Connect is not configured.", 503)
    gateway = get_gateway()
    if gateway.livemode != (settings.STRIPE_MODE == "live"):
        raise StripeConnectError("Stripe Connect configuration does not match its mode.", 503)
    return gateway


def _assert_mode(account: StripeConnectAccount) -> None:
    if account.livemode != (settings.STRIPE_MODE == "live"):
        raise StripeConnectError("This connected account belongs to a different Stripe mode.")


def _status(account: StripeConnectAccount | None) -> dict[str, Any]:
    enabled = connect_enabled()
    return {
        "account_id": account.account_id if account else None,
        "country": account.country if account else None,
        "details_submitted": bool(account and account.details_submitted),
        "transfers_enabled": bool(account and account.transfers_enabled),
        "payouts_enabled": bool(account and account.payouts_enabled),
        "requirements": list(account.requirements_json or []) if account else [],
        "enabled": enabled,
        "mode": settings.STRIPE_MODE if enabled else "unconfigured",
    }


async def get_status(db: AsyncSession, user_id: uuid.UUID) -> dict[str, Any]:
    return _status(await db.get(StripeConnectAccount, user_id))


def _validate_account(account: StripeConnectAccount, value: dict[str, Any]) -> None:
    metadata = value.get("metadata") or {}
    if (
        not isinstance(metadata, dict)
        or metadata.get("app") != "taskmatch"
        or metadata.get("taskmatch_user_id") != str(account.user_id)
        or not re.fullmatch(r"acct_[A-Za-z0-9]+", str(value.get("id") or ""))
        or (account.account_id and value["id"] != account.account_id)
        or value.get("country") != account.country
        or ("livemode" in value and value["livemode"] is not account.livemode)
        or value.get("deleted") is True
    ):
        raise StripeGatewayError("Stripe returned an account that does not match this developer.")


def _apply_snapshot(account: StripeConnectAccount, value: dict[str, Any]) -> None:
    _validate_account(account, value)
    account.account_id = value["id"]
    account.details_submitted = value.get("details_submitted") is True
    account.payouts_enabled = value.get("payouts_enabled") is True
    capabilities = value.get("capabilities") or {}
    account.transfers_enabled = capabilities.get("transfers") == "active"
    requirements = value.get("requirements") or {}
    names = []
    for category in ("currently_due", "past_due", "pending_verification"):
        for requirement in requirements.get(category) or []:
            if isinstance(requirement, str) and requirement not in names:
                names.append(requirement)
    account.requirements_json = names


def _stripe_url(value: Any) -> str:
    if not isinstance(value, str):
        raise StripeGatewayError("Stripe did not return a redirect URL.")
    try:
        parsed = urlsplit(value)
        port = parsed.port
    except ValueError:
        raise StripeGatewayError("Stripe returned an invalid redirect URL.") from None
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or not (parsed.hostname == "stripe.com" or parsed.hostname.endswith(".stripe.com"))
        or parsed.username
        or parsed.password
        or port not in (None, 443)
    ):
        raise StripeGatewayError("Stripe returned an invalid redirect URL.")
    return value


def _return_urls() -> tuple[str, str]:
    base = settings.BILLING_SITE_URL.rstrip("/")
    parsed = urlsplit(base)
    local_http = parsed.scheme == "http" and parsed.hostname in {"localhost", "127.0.0.1"}
    if (
        not parsed.hostname
        or parsed.username
        or parsed.password
        or parsed.query
        or parsed.fragment
        or (parsed.scheme != "https" and not (settings.ENV != "production" and local_http))
    ):
        raise StripeConnectError("The billing return URL is not configured safely.", 503)
    return f"{base}/developer/earnings?connect=return", f"{base}/developer/earnings?connect=refresh"


async def onboarding(db: AsyncSession, user_id: uuid.UUID, country: str | None) -> dict[str, str]:
    gateway = _configured_gateway()
    return_url, refresh_url = _return_urls()
    country = country.upper() if country else None
    if country and country not in ISO_COUNTRIES:
        raise StripeConnectError("Country must be a two-letter ISO country code.", 422)
    account = await db.get(StripeConnectAccount, user_id)
    if account is None:
        if country is None:
            raise StripeConnectError("Country is required to create a connected account.", 422)
        await db.execute(
            insert(StripeConnectAccount)
            .values(
                user_id=user_id, country=country, livemode=gateway.livemode, requirements_json=[]
            )
            .on_conflict_do_nothing(index_elements=[StripeConnectAccount.user_id])
        )
        # Persist the immutable creation attempt before any external side effect.
        await db.commit()
        account = await db.get(StripeConnectAccount, user_id)
    assert account is not None
    _assert_mode(account)
    if country and country != account.country:
        raise StripeConnectError("A connected account's country cannot be changed here.")
    account_id = account.account_id
    reserved_country = account.country
    if not account_id:
        created = account.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=UTC)
        if datetime.now(UTC) - created > timedelta(hours=20):
            raise StripeConnectError(
                "Account creation requires operator reconciliation before retrying."
            )
    await db.commit()  # Do not hold a database transaction during a Stripe request.
    if not account_id:
        value = await gateway.request(
            "POST",
            "/accounts",
            data={
                "country": reserved_country,
                "controller[stripe_dashboard][type]": "express",
                "controller[fees][payer]": "application",
                "controller[losses][payments]": "application",
                "controller[requirement_collection]": "stripe",
                "capabilities[transfers][requested]": "true",
                "metadata[app]": "taskmatch",
                "metadata[taskmatch_user_id]": str(user_id),
            },
            idempotency_key=f"taskmatch:connect-account:{settings.STRIPE_MODE}:{user_id}",
        )
        account = (
            await db.scalars(
                select(StripeConnectAccount)
                .where(StripeConnectAccount.user_id == user_id)
                .with_for_update()
                .execution_options(populate_existing=True)
            )
        ).one()
        _apply_snapshot(account, value)
        account_id = account.account_id
        await db.commit()
    link = await gateway.request(
        "POST",
        "/account_links",
        data={
            "account": account_id,
            "type": "account_onboarding",
            "return_url": return_url,
            "refresh_url": refresh_url,
        },
        idempotency_key=f"taskmatch:connect-link:{user_id}:{uuid.uuid4()}",
    )
    return {"url": _stripe_url(link.get("url"))}


async def _retrieve_account(
    db: AsyncSession, user_id: uuid.UUID
) -> tuple[StripeConnectAccount, dict[str, Any]]:
    gateway = _configured_gateway()
    account = await db.get(StripeConnectAccount, user_id)
    if account is None or not account.account_id:
        raise StripeConnectError("Complete connected account creation first.")
    _assert_mode(account)
    account_id = account.account_id
    await db.commit()
    value = await gateway.request("GET", f"/accounts/{account_id}")
    account = (
        await db.scalars(
            select(StripeConnectAccount)
            .where(StripeConnectAccount.user_id == user_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
    ).one()
    _apply_snapshot(account, value)
    await db.flush()
    return account, value


async def sync_account(db: AsyncSession, user_id: uuid.UUID) -> dict[str, Any]:
    account, _value = await _retrieve_account(db, user_id)
    from app.services.billing_service import queue_user_payouts

    await queue_user_payouts(db, user_id)
    return _status(account)


async def reconcile_account(
    db: AsyncSession, user_id: uuid.UUID, account_id: str
) -> dict[str, Any]:
    """Bind a lost creation response from an operator-supplied Stripe reference.

    The existing reservation is mandatory. This never creates an account or
    changes the original attempt's country, mode, or retention deadline.
    """
    gateway = _configured_gateway()
    if not re.fullmatch(r"acct_[A-Za-z0-9]+", account_id):
        raise StripeConnectError("A valid Stripe account reference is required.", 422)
    account = await db.get(StripeConnectAccount, user_id)
    if account is None:
        raise StripeConnectError("No connected account creation was reserved for this developer.")
    _assert_mode(account)
    if account.account_id and account.account_id != account_id:
        raise StripeConnectError("This developer already has a different connected account.")
    await db.commit()
    value = await gateway.request("GET", f"/accounts/{account_id}")
    if value.get("id") != account_id:
        raise StripeGatewayError("Stripe returned a different connected account reference.")
    account = (
        await db.scalars(
            select(StripeConnectAccount)
            .where(StripeConnectAccount.user_id == user_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
    ).one()
    _assert_mode(account)
    _apply_snapshot(account, value)
    await db.flush()
    from app.services.billing_service import queue_user_payouts

    await queue_user_payouts(db, user_id)
    return _status(account)


async def dashboard(db: AsyncSession, user_id: uuid.UUID) -> dict[str, str]:
    account, value = await _retrieve_account(db, user_id)
    controller = value.get("controller") or {}
    if (controller.get("stripe_dashboard") or {}).get("type") != "express":
        raise StripeConnectError("This connected account does not support the Express dashboard.")
    account_id = account.account_id
    await db.commit()
    link = await _configured_gateway().request(
        "POST",
        f"/accounts/{account_id}/login_links",
        idempotency_key=f"taskmatch:connect-dashboard:{user_id}:{uuid.uuid4()}",
    )
    return {"url": _stripe_url(link.get("url"))}


async def apply_account_update(db: AsyncSession, value: dict[str, Any]) -> bool:
    """Apply a verified current account snapshot; never create from webhook data.

    Caller must verify Connect webhook signature/mode and retrieve current Stripe
    state before this function, so delayed account.updated events cannot regress it.
    """
    account_id = value.get("id")
    if not isinstance(account_id, str) or not re.fullmatch(r"acct_[A-Za-z0-9]+", account_id):
        return False
    account = (
        await db.scalars(
            select(StripeConnectAccount)
            .where(StripeConnectAccount.account_id == value.get("id"))
            .with_for_update()
        )
    ).one_or_none()
    if account is None:
        return False
    _assert_mode(account)
    _apply_snapshot(account, value)
    await db.flush()
    from app.services.billing_service import queue_user_payouts

    await queue_user_payouts(db, account.user_id)
    return True
