"""Collect explicit consent and verify a reusable method with authoritative proof."""

import uuid
from datetime import timedelta
from urllib.parse import urlparse

from fastapi import HTTPException
from sqlalchemy import select

from app.core.config import settings
from app.middleware.audit import log_audit
from app.models.payment_authorization import PaymentAuthorization
from app.services import billing_service as billing
from app.services.human_authorization import owned_principal
from app.services.stripe_gateway import get_gateway


def metadata(auth):
    return {
        "app": "taskmatch",
        "taskmatch_authorization_id": str(auth.id),
        "taskmatch_principal_id": str(auth.principal_id),
        "taskmatch_user_id": str(auth.owner_user_id),
    }


def matches(value, expected):
    return isinstance(value, dict) and all(
        str((value.get("metadata") or {}).get(k)) == str(v) for k, v in expected.items()
    )


def view(auth):
    return {
        "ready": bool(auth and auth.status == "active" and auth.livemode == billing.live_mode()),
        "status": auth.status if auth else "not_configured",
        "brand": auth.brand if auth else None,
        "last4": auth.last4 if auth else None,
        "consent_version": auth.consent_version if auth else None,
    }


async def status(db, principal_id, user):
    await owned_principal(db, principal_id, user)
    auth = await db.scalar(
        select(PaymentAuthorization)
        .where(PaymentAuthorization.principal_id == principal_id)
        .order_by(
            (PaymentAuthorization.status == "active").desc(), PaymentAuthorization.created_at.desc()
        )
        .limit(1)
    )
    return view(auth)


async def setup(db, principal_id, user):
    billing.ensure_configured()
    await owned_principal(db, principal_id, user, lock=True)
    auth = await db.scalar(
        select(PaymentAuthorization)
        .where(
            PaymentAuthorization.principal_id == principal_id,
            PaymentAuthorization.status == "pending",
            PaymentAuthorization.livemode == billing.live_mode(),
        )
        .order_by(PaymentAuthorization.created_at.desc())
        .limit(1)
    )
    if not auth:
        auth = PaymentAuthorization(
            id=uuid.uuid4(),
            principal_id=principal_id,
            owner_user_id=user.id,
            livemode=billing.live_mode(),
            consent_at=billing.now(),
            consent_version="tm.spend-consent.v1",
            setup_started_at=billing.now(),
        )
        db.add(auth)
        await db.flush()
        await log_audit(
            db,
            actor_type="user",
            actor_id=str(user.id),
            action="payment_authorization.consent",
            entity_type="principal",
            entity_id=str(principal_id),
            payload={"version": auth.consent_version},
        )
    if auth.setup_url:
        identifier = auth.id
        await db.commit()
        session = await get_gateway().request("GET", f"/checkout/sessions/{auth.setup_session_id}")
        if (
            session.get("id") != auth.setup_session_id
            or session.get("mode") != "setup"
            or session.get("customer") != auth.customer_id
            or session.get("livemode") is not auth.livemode
            or not matches(session, metadata(auth))
        ):
            raise HTTPException(409, "The earlier payment setup could not be verified")
        if session.get("status") == "complete":
            await confirm_session(db, session)
            return {
                "url": settings.BILLING_SITE_URL.rstrip("/") + "/human-tasks?view=agents",
                "status": "active",
            }
        if session.get("status") == "open":
            return {"url": auth.setup_url, "status": "pending"}
        if session.get("status") != "expired":
            raise HTTPException(409, "Payment setup is not ready")
        await owned_principal(db, principal_id, user, lock=True)
        auth = await db.get(PaymentAuthorization, identifier, populate_existing=True)
        if auth.status != "pending":
            raise HTTPException(409, "Payment setup changed; refresh its status")
        auth.status = "expired"
        auth.setup_url = None
        await db.commit()
        return await setup(db, principal_id, user)
    if not auth.setup_started_at or billing.now() - auth.setup_started_at > timedelta(hours=20):
        raise HTTPException(409, "An earlier payment setup needs reconciliation before retrying")
    identifier = auth.id
    expected = metadata(auth)
    await db.commit()
    if not auth.customer_id:
        customer = await get_gateway().request(
            "POST",
            "/customers",
            data={f"metadata[{k}]": v for k, v in expected.items()},
            idempotency_key=f"tm:customer:{identifier}",
        )
        if (
            not str(customer.get("id", "")).startswith("cus_")
            or not matches(customer, expected)
            or customer.get("livemode") is not auth.livemode
        ):
            raise HTTPException(409, "The payment account could not be verified")
        await owned_principal(db, principal_id, user, lock=True)
        auth = await db.get(PaymentAuthorization, identifier, populate_existing=True)
        if auth.status != "pending":
            raise HTTPException(409, "Payment setup was revoked")
        auth.customer_id = customer["id"]
        await db.commit()
    origin = settings.BILLING_SITE_URL.rstrip("/")
    if urlparse(origin).scheme != "https":
        raise HTTPException(503, "A secure return URL is required")
    data = {
        "mode": "setup",
        "customer": auth.customer_id,
        "payment_method_types[0]": "card",
        "client_reference_id": f"taskmatch:authorization:{identifier}",
        "success_url": origin + "/human-tasks?view=agents&payment_setup=complete",
        "cancel_url": origin + "/human-tasks?view=agents&payment_setup=cancelled",
        **{f"metadata[{k}]": v for k, v in expected.items()},
        **{f"setup_intent_data[metadata][{k}]": v for k, v in expected.items()},
    }
    session = await get_gateway().request(
        "POST", "/checkout/sessions", data=data, idempotency_key=f"tm:setup:{identifier}"
    )
    url = session.get("url", "")
    if (
        not str(session.get("id", "")).startswith("cs_")
        or session.get("mode") != "setup"
        or session.get("customer") != auth.customer_id
        or session.get("livemode") is not auth.livemode
        or not matches(session, expected)
        or session.get("client_reference_id") != data["client_reference_id"]
        or urlparse(url).scheme != "https"
        or urlparse(url).hostname != "checkout.stripe.com"
    ):
        raise HTTPException(409, "The secure payment setup could not be verified")
    await owned_principal(db, principal_id, user, lock=True)
    auth = await db.get(PaymentAuthorization, identifier, populate_existing=True)
    if auth.status != "pending":
        raise HTTPException(409, "Payment setup was revoked")
    auth.setup_session_id = session["id"]
    auth.setup_url = url
    return {"url": url, "status": "pending"}


async def confirm_session(db, session):
    try:
        identifier = uuid.UUID((session.get("metadata") or {})["taskmatch_authorization_id"])
    except (ValueError, KeyError, TypeError):
        raise HTTPException(409, "Unknown payment authorization") from None
    auth = await db.get(PaymentAuthorization, identifier)
    if not auth:
        raise HTTPException(409, "Unknown payment authorization")
    expected = metadata(auth)
    if (
        auth.status == "revoked"
        or session.get("mode") != "setup"
        or session.get("status") != "complete"
        or (auth.setup_session_id and session.get("id") != auth.setup_session_id)
        or not matches(session, expected)
        or session.get("livemode") is not auth.livemode
        or auth.livemode != billing.live_mode()
        or session.get("customer") != auth.customer_id
        or session.get("client_reference_id") != f"taskmatch:authorization:{auth.id}"
    ):
        raise HTTPException(409, "Payment setup is incomplete or does not match this account")
    intent = session.get("setup_intent")
    if isinstance(intent, str):
        intent = await get_gateway().request("GET", f"/setup_intents/{intent}")
    if (
        not isinstance(intent, dict)
        or intent.get("status") != "succeeded"
        or intent.get("usage") != "off_session"
        or intent.get("customer") != auth.customer_id
        or intent.get("livemode") is not auth.livemode
        or not matches(intent, expected)
        or not str(intent.get("payment_method", "")).startswith("pm_")
    ):
        raise HTTPException(409, "The reusable payment method has not been verified")
    method = await get_gateway().request("GET", f"/payment_methods/{intent['payment_method']}")
    if (
        method.get("id") != intent["payment_method"]
        or method.get("customer") != auth.customer_id
        or method.get("livemode") is not auth.livemode
        or method.get("type") != "card"
    ):
        raise HTTPException(409, "The payment method belongs to a different account")
    # Serialize activation/revocation with the principal, including repeated callbacks.
    from app.models.human import Principal

    await db.scalar(select(Principal).where(Principal.id == auth.principal_id).with_for_update())
    auth = await db.get(PaymentAuthorization, identifier, populate_existing=True)
    if auth.status == "revoked":
        raise HTTPException(409, "Payment authorization was revoked")
    for previous in (
        await db.scalars(
            select(PaymentAuthorization).where(
                PaymentAuthorization.principal_id == auth.principal_id,
                PaymentAuthorization.status == "active",
                PaymentAuthorization.id != auth.id,
            )
        )
    ).all():
        previous.status = "revoked"
    await db.flush()
    auth.setup_session_id = session["id"]
    auth.payment_method_id = method["id"]
    auth.status = "active"
    auth.setup_url = None
    auth.brand = (method.get("card") or {}).get("brand")
    auth.last4 = (method.get("card") or {}).get("last4")
    return view(auth)


async def confirm(db, principal_id, user):
    await owned_principal(db, principal_id, user)
    auth = await db.scalar(
        select(PaymentAuthorization)
        .where(
            PaymentAuthorization.principal_id == principal_id,
            PaymentAuthorization.status.in_(["pending", "active"]),
        )
        .order_by(PaymentAuthorization.created_at.desc())
        .limit(1)
    )
    if not auth or not auth.setup_session_id:
        raise HTTPException(409, "No payment setup is waiting for confirmation")
    session = await get_gateway().request("GET", f"/checkout/sessions/{auth.setup_session_id}")
    return await confirm_session(db, session)


async def revoke(db, principal_id, user):
    await owned_principal(db, principal_id, user, lock=True)
    for auth in (
        await db.scalars(
            select(PaymentAuthorization).where(
                PaymentAuthorization.principal_id == principal_id,
                PaymentAuthorization.status.in_(["active", "pending"]),
            )
        )
    ).all():
        auth.status = "revoked"
        auth.setup_url = None
    await log_audit(
        db,
        actor_type="user",
        actor_id=str(user.id),
        action="payment_authorization.revoked",
        entity_type="principal",
        entity_id=str(principal_id),
    )
    return {"ready": False, "status": "revoked"}
