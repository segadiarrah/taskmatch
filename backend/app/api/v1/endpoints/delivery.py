"""Delivery and credential-exchange endpoints.

A validated deliverable still has to reach the client. When that means installing
on their own infrastructure, credentials have to travel — so this module also
owns the audited, expiring, revocable vault those credentials live in.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.middleware.audit import log_audit
from app.models.delivery import (
    AccessGrant,
    DeliveryMode,
    DeliveryPlan,
    DeliveryStatus,
)
from app.models.job import Job
from app.models.user import User
from app.schemas.delivery import (
    AccessGrantCreate,
    DeliveryPlanUpdate,
    HandoverSignOff,
)
from app.services import vault_service

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)

router = APIRouter()


# --------------------------------------------------------------------------- #
#  Helpers                                                                     #
# --------------------------------------------------------------------------- #


async def _load_owned_job(db: AsyncSession, job_id: uuid.UUID, user: User) -> Job:
    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    role = getattr(user.role, "value", str(user.role))
    if job.client_user_id != user.id and role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not your job"
        )
    return job


async def _load_plan(db: AsyncSession, job_id: uuid.UUID) -> DeliveryPlan:
    plan = (
        await db.execute(select(DeliveryPlan).where(DeliveryPlan.job_id == job_id))
    ).scalar_one_or_none()
    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This job has no delivery plan yet",
        )
    return plan


def _serialise_grant(grant: AccessGrant, now: datetime) -> dict[str, Any]:
    """Grant metadata. Never includes the secret — only the reveal returns that."""
    return {
        "id": str(grant.id),
        "label": grant.label,
        "kind": grant.kind.value if hasattr(grant.kind, "value") else str(grant.kind),
        "direction": grant.direction.value
        if hasattr(grant.direction, "value")
        else str(grant.direction),
        "hint": grant.hint,
        "created_at": grant.created_at.isoformat() if grant.created_at else None,
        "expires_at": grant.expires_at.isoformat() if grant.expires_at else None,
        "revoked_at": grant.revoked_at.isoformat() if grant.revoked_at else None,
        "last_accessed_at": grant.last_accessed_at.isoformat()
        if grant.last_accessed_at
        else None,
        "access_count": grant.access_count,
        "max_accesses": grant.max_accesses,
        "revoked": grant.is_revoked,
        "expired": grant.is_expired(now),
        "exhausted": grant.is_exhausted(),
    }


def _serialise_plan(plan: DeliveryPlan, now: datetime) -> dict[str, Any]:
    return {
        "id": str(plan.id),
        "job_id": str(plan.job_id),
        "mode": plan.mode.value if hasattr(plan.mode, "value") else str(plan.mode),
        "status": plan.status.value
        if hasattr(plan.status, "value")
        else str(plan.status),
        "target": plan.target,
        "requirements": plan.requirements or {},
        "runbook": plan.runbook,
        "notes": plan.notes,
        "needs_access_exchange": plan.needs_access_exchange,
        "delivered_at": plan.delivered_at.isoformat() if plan.delivered_at else None,
        "signed_off_at": plan.signed_off_at.isoformat() if plan.signed_off_at else None,
        "accesses_revoked_at": plan.accesses_revoked_at.isoformat()
        if plan.accesses_revoked_at
        else None,
        "vault_available": vault_service.vault_available(),
        "access_grants": [
            _serialise_grant(g, now) for g in sorted(
                plan.access_grants or [], key=lambda g: g.created_at or now
            )
        ],
    }


# --------------------------------------------------------------------------- #
#  Delivery plan                                                               #
# --------------------------------------------------------------------------- #


@router.get("/{job_id}/delivery", summary="How this job will be delivered")
async def get_delivery_plan(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return the delivery plan and the state of any credentials exchanged."""
    await _load_owned_job(db, job_id, current_user)
    plan = await _load_plan(db, job_id)
    return _serialise_plan(plan, datetime.now(timezone.utc))


@router.put("/{job_id}/delivery", summary="Choose how the work is delivered")
async def update_delivery_plan(
    job_id: uuid.UUID,
    body: DeliveryPlanUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Set the delivery mode and target.

    Changing the mode after the quote was accepted is refused: an installation
    involves human work a document delivery does not, so the price would no
    longer match the work. Re-quote first.
    """
    job = await _load_owned_job(db, job_id, current_user)
    plan = await _load_plan(db, job_id)

    mode_changing = body.mode is not None and body.mode != plan.mode
    if mode_changing and plan.status not in (
        DeliveryStatus.planned,
        DeliveryStatus.awaiting_access,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Delivery is already under way; the mode can no longer change",
        )

    if body.mode is not None:
        plan.mode = body.mode
        plan.status = (
            DeliveryStatus.awaiting_access
            if body.mode in (DeliveryMode.installation, DeliveryMode.hosted)
            else DeliveryStatus.planned
        )
    if body.target is not None:
        plan.target = body.target or None
    if body.notes is not None:
        plan.notes = body.notes or None

    await db.flush()
    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="delivery.updated",
        entity_type="delivery_plan",
        entity_id=str(plan.id),
        payload={
            "job_id": str(job_id),
            "mode": plan.mode.value if hasattr(plan.mode, "value") else str(plan.mode),
        },
    )
    await db.commit()
    await db.refresh(plan)

    return {
        **_serialise_plan(plan, datetime.now(timezone.utc)),
        # The client needs to know the price is now stale.
        "requote_recommended": mode_changing,
    }


# --------------------------------------------------------------------------- #
#  Access grants                                                               #
# --------------------------------------------------------------------------- #


@router.post("/{job_id}/access-grants", summary="Share a credential for this job")
async def create_access_grant(
    job_id: uuid.UUID,
    body: AccessGrantCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Store a credential, encrypted, scoped to this job.

    The plaintext is encrypted before it reaches the database and is never
    written to a log. Only a masked hint is kept in the clear.
    """
    await _load_owned_job(db, job_id, current_user)
    plan = await _load_plan(db, job_id)

    if not plan.needs_access_exchange:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This job is delivered as "
                f"{plan.mode.value if hasattr(plan.mode, 'value') else plan.mode}; "
                "no credentials are needed"
            ),
        )

    try:
        ciphertext = vault_service.encrypt(body.secret)
    except vault_service.VaultUnavailableError as exc:
        # Refusing is the correct behaviour: storing the secret unencrypted would
        # be worse than not storing it at all.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc

    now = datetime.now(timezone.utc)
    ttl = body.ttl_hours or settings.ACCESS_GRANT_TTL_HOURS
    grant = AccessGrant(
        id=uuid.uuid4(),
        delivery_plan_id=plan.id,
        job_id=job_id,
        label=body.label,
        kind=body.kind,
        direction=body.direction,
        secret_ciphertext=ciphertext,
        hint=vault_service.hint_for(body.secret, body.kind.value),
        created_by_user_id=current_user.id,
        expires_at=now + timedelta(hours=ttl),
        max_accesses=body.max_accesses or settings.ACCESS_GRANT_MAX_REVEALS,
    )
    db.add(grant)
    await db.flush()

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="access_grant.created",
        entity_type="access_grant",
        entity_id=str(grant.id),
        # Deliberately records only metadata — never the secret or its hint.
        payload={
            "job_id": str(job_id),
            "kind": body.kind.value,
            "direction": body.direction.value,
            "expires_at": grant.expires_at.isoformat(),
        },
    )
    await db.commit()
    await db.refresh(grant)

    logger.info(
        "access_grant.created",
        job_id=str(job_id),
        grant_id=str(grant.id),
        kind=body.kind.value,
    )
    return _serialise_grant(grant, now)


@router.get("/{job_id}/access-grants", summary="List credentials shared for this job")
async def list_access_grants(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Metadata only — secrets are never returned by a listing."""
    await _load_owned_job(db, job_id, current_user)
    now = datetime.now(timezone.utc)
    grants = list(
        (
            await db.execute(
                select(AccessGrant)
                .where(AccessGrant.job_id == job_id)
                .order_by(AccessGrant.created_at)
            )
        )
        .scalars()
        .all()
    )
    return {"grants": [_serialise_grant(g, now) for g in grants]}


@router.post(
    "/{job_id}/access-grants/{grant_id}/reveal",
    summary="Reveal a credential once (audited)",
)
async def reveal_access_grant(
    job_id: uuid.UUID,
    grant_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Decrypt and return a credential, counting the access against its budget.

    Every reveal is audited, and a grant that is revoked, expired, or has hit its
    reveal ceiling is refused rather than silently re-issued.
    """
    await _load_owned_job(db, job_id, current_user)
    now = datetime.now(timezone.utc)

    grant = (
        await db.execute(
            select(AccessGrant).where(
                AccessGrant.id == grant_id, AccessGrant.job_id == job_id
            )
        )
    ).scalar_one_or_none()
    if grant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Access grant not found"
        )

    if grant.is_revoked:
        raise HTTPException(
            status_code=status.HTTP_410_GONE, detail="This credential has been revoked"
        )
    if grant.is_expired(now):
        raise HTTPException(
            status_code=status.HTTP_410_GONE, detail="This credential has expired"
        )
    # Consume one reveal *before* decrypting. Checking `access_count` and then
    # incrementing it lets concurrent requests both pass the ceiling test and
    # both receive the secret; the conditional UPDATE makes the database the
    # arbiter, so the budget can never be overspent. Claiming first also means a
    # decryption failure costs a reveal rather than handing out a free retry
    # loop against the ciphertext.
    consumed = await db.execute(
        update(AccessGrant)
        .where(
            AccessGrant.id == grant.id,
            AccessGrant.revoked_at.is_(None),
            AccessGrant.access_count < AccessGrant.max_accesses,
        )
        .values(access_count=AccessGrant.access_count + 1, last_accessed_at=now)
    )
    if consumed.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"This credential has already been revealed {grant.max_accesses} "
                "times and must be re-issued"
            ),
        )
    await db.refresh(grant)

    try:
        secret = vault_service.decrypt(grant.secret_ciphertext or "")
    except vault_service.VaultUnavailableError as exc:
        # The reveal is already spent; committing keeps that record honest.
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="access_grant.revealed",
        entity_type="access_grant",
        entity_id=str(grant.id),
        payload={"job_id": str(job_id), "access_count": grant.access_count},
    )
    await db.commit()

    logger.info(
        "access_grant.revealed",
        grant_id=str(grant.id),
        job_id=str(job_id),
        access_count=grant.access_count,
    )
    return {
        "id": str(grant.id),
        "label": grant.label,
        "secret": secret,
        "access_count": grant.access_count,
        "max_accesses": grant.max_accesses,
    }


@router.post(
    "/{job_id}/access-grants/{grant_id}/revoke", summary="Revoke a credential"
)
async def revoke_access_grant(
    job_id: uuid.UUID,
    grant_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Destroy the stored ciphertext. Irreversible."""
    await _load_owned_job(db, job_id, current_user)
    grant = (
        await db.execute(
            select(AccessGrant).where(
                AccessGrant.id == grant_id, AccessGrant.job_id == job_id
            )
        )
    ).scalar_one_or_none()
    if grant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Access grant not found"
        )

    now = datetime.now(timezone.utc)
    grant.revoked_at = grant.revoked_at or now
    grant.secret_ciphertext = None
    await db.flush()

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="access_grant.revoked",
        entity_type="access_grant",
        entity_id=str(grant.id),
        payload={"job_id": str(job_id)},
    )
    await db.commit()
    return {"id": str(grant.id), "revoked": True}


# --------------------------------------------------------------------------- #
#  Handover                                                                    #
# --------------------------------------------------------------------------- #


@router.post("/{job_id}/delivery/sign-off", summary="Confirm the delivery landed")
async def sign_off_delivery(
    job_id: uuid.UUID,
    body: HandoverSignOff,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Client confirms receipt, and every credential they shared is revoked.

    Automatic revocation is the point: a client should not have to remember to
    rotate the access they handed over to get the job done.
    """
    await _load_owned_job(db, job_id, current_user)
    plan = await _load_plan(db, job_id)

    now = datetime.now(timezone.utc)
    plan.status = DeliveryStatus.signed_off
    plan.signed_off_at = now
    plan.delivered_at = plan.delivered_at or now
    if body.notes:
        plan.notes = (plan.notes + "\n\n" if plan.notes else "") + body.notes

    revoked = await revoke_job_access_grants(db, job_id, now=now)
    plan.accesses_revoked_at = now
    await db.flush()

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="delivery.signed_off",
        entity_type="delivery_plan",
        entity_id=str(plan.id),
        payload={"job_id": str(job_id), "grants_revoked": revoked},
    )
    await db.commit()
    await db.refresh(plan)

    logger.info("delivery.signed_off", job_id=str(job_id), grants_revoked=revoked)
    return {
        **_serialise_plan(plan, now),
        "grants_revoked": revoked,
    }


async def revoke_job_access_grants(
    db: AsyncSession, job_id: uuid.UUID, *, now: Optional[datetime] = None
) -> int:
    """Revoke every live credential on a job. Returns how many were destroyed.

    Shared with the job-acceptance flow so closing a job always clears the vault,
    whichever route the client took to close it.
    """
    now = now or datetime.now(timezone.utc)
    grants = list(
        (
            await db.execute(
                select(AccessGrant).where(AccessGrant.job_id == job_id)
            )
        )
        .scalars()
        .all()
    )
    revoked = 0
    for grant in grants:
        if grant.is_revoked:
            continue
        grant.revoked_at = now
        grant.secret_ciphertext = None
        revoked += 1
    if revoked:
        await db.flush()
    return revoked
