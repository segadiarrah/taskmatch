"""Quote endpoints — the gate between planning and execution.

TaskMatch prices every job itself and presents that price *before* any agent runs
or any expert is engaged. Nothing executes until the client accepts.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Optional

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.middleware.audit import log_audit
from app.models.job import Job, JobStatus
from app.models.quote import ExecutionRoute, Quote, QuoteStatus, TaskQuote
from app.models.task import Task
from app.models.user import User
from app.schemas.quote import OfferAcceptRequest, QuoteRejectRequest
from app.services import pricing_service, quote_service

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)

router = APIRouter()


# --------------------------------------------------------------------------- #
#  Access control                                                              #
# --------------------------------------------------------------------------- #


async def _load_owned_job(
    db: AsyncSession, job_id: uuid.UUID, user: User
) -> Job:
    """Fetch a job the caller is allowed to see, or raise."""
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


# --------------------------------------------------------------------------- #
#  Serialisation                                                               #
# --------------------------------------------------------------------------- #


def _serialise_task_quote(tq: TaskQuote, task: Optional[Task]) -> dict[str, Any]:
    """Client-facing view of one priced line, breakdown included.

    The breakdown is deliberately not hidden: a client who can see the token
    cost, the orchestration fee and the human-equivalent range can judge whether
    the price is fair, which is the whole argument for TaskMatch setting it.
    """
    route = tq.route.value if hasattr(tq.route, "value") else str(tq.route)
    return {
        "id": str(tq.id),
        "task_id": str(tq.task_id) if tq.task_id else None,
        "title": task.title if task else None,
        "task_type": tq.task_type,
        "route": route,
        "complexity": tq.complexity,
        "price": float(tq.price),
        "rationale": tq.rationale,
        "breakdown": {
            "model": tq.model_slug,
            "est_input_tokens": int(tq.est_input_tokens or 0),
            "est_output_tokens": int(tq.est_output_tokens or 0),
            "token_cost": float(tq.token_cost or 0),
            "compute_cost": float(tq.compute_cost or 0),
            "orchestration_fee": float(tq.orchestration_fee or 0),
            "validation_cost": float(tq.validation_cost or 0),
        },
        "human": {
            "hours": tq.human_hours,
            "price_low": float(tq.human_price_low) if tq.human_price_low else None,
            "price_high": float(tq.human_price_high) if tq.human_price_high else None,
            "discipline": tq.discipline,
            "seniority": tq.seniority,
            "accepted_offer": (
                float(tq.accepted_offer) if tq.accepted_offer is not None else None
            ),
        },
    }


async def _serialise_quote(db: AsyncSession, quote: Quote) -> dict[str, Any]:
    """Full quote payload: totals, comparison, and every priced line."""
    task_quotes = list(
        (
            await db.execute(
                select(TaskQuote).where(TaskQuote.quote_id == quote.id)
            )
        )
        .scalars()
        .all()
    )
    task_ids = [tq.task_id for tq in task_quotes if tq.task_id]
    tasks_by_id: dict[uuid.UUID, Task] = {}
    if task_ids:
        tasks_by_id = {
            t.id: t
            for t in (
                await db.execute(select(Task).where(Task.id.in_(task_ids)))
            )
            .scalars()
            .all()
        }

    lines = [
        _serialise_task_quote(tq, tasks_by_id.get(tq.task_id) if tq.task_id else None)
        for tq in task_quotes
    ]

    return {
        "id": str(quote.id),
        "job_id": str(quote.job_id),
        "status": quote.status.value
        if hasattr(quote.status, "value")
        else str(quote.status),
        "currency": quote.currency,
        "subtotal": float(quote.subtotal),
        "platform_fee": float(quote.platform_fee),
        "total": float(quote.total),
        "human_equivalent": {
            "low": float(quote.human_equivalent_low)
            if quote.human_equivalent_low is not None
            else None,
            "high": float(quote.human_equivalent_high)
            if quote.human_equivalent_high is not None
            else None,
        },
        "savings_vs_human": quote.savings_vs_human,
        "valid_until": quote.valid_until.isoformat() if quote.valid_until else None,
        "pricing_version": quote.pricing_version,
        "decided_at": quote.decided_at.isoformat() if quote.decided_at else None,
        "rejection_reason": quote.rejection_reason,
        "actionable": quote.is_actionable,
        "requires_human": any(line["route"] != "llm" for line in lines),
        "tasks": lines,
    }


# --------------------------------------------------------------------------- #
#  Client-facing quote endpoints                                               #
# --------------------------------------------------------------------------- #


@router.get("/{job_id}/quote", summary="Current quote for a job")
async def get_quote(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return the price TaskMatch has set for this job, with the full breakdown.

    ``pending`` is true while the job is still being planned and priced — the
    client polls until a quote exists.
    """
    job = await _load_owned_job(db, job_id, current_user)
    quote = await quote_service.current_quote(db, job_id)

    if quote is None:
        return {
            "pending": job.status
            in (JobStatus.submitted, JobStatus.formatted, JobStatus.decomposed),
            "quote": None,
            "job_status": job.status.value
            if hasattr(job.status, "value")
            else str(job.status),
        }

    if quote_service.expire_if_due(quote):
        await db.commit()
        await db.refresh(quote)

    return {
        "pending": False,
        "quote": await _serialise_quote(db, quote),
        "job_status": job.status.value
        if hasattr(job.status, "value")
        else str(job.status),
    }


@router.post("/{job_id}/quote/accept", summary="Accept the quote and start execution")
async def accept_quote(
    job_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Accept the price. This is what releases the job into execution.

    Everything downstream — agent matching, bidding, LLM execution, escrow — is
    gated on this call, so a client is never billed for work they did not price.
    """
    job = await _load_owned_job(db, job_id, current_user)
    quote = await quote_service.current_quote(db, job_id)
    if quote is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No quote for this job"
        )

    if quote_service.expire_if_due(quote):
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Quote has expired; request a new one before accepting",
        )

    if not quote.is_actionable:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Quote is already {quote.status.value if hasattr(quote.status, 'value') else quote.status}"
            ),
        )

    await quote_service.accept_quote(db, quote)
    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="quote.accepted",
        entity_type="quote",
        entity_id=str(quote.id),
        payload={"job_id": str(job_id), "total": float(quote.total)},
    )
    await db.commit()

    # Execution is deferred: accepting a quote must return immediately, and the
    # pipeline it kicks off is the same one the plan endpoint already polls.
    from app.api.v1.endpoints.jobs import _execute_job  # circular at import time

    background_tasks.add_task(_execute_job, job_id)

    logger.info("quote.accepted", job_id=str(job_id), quote_id=str(quote.id))
    return {
        "job_id": str(job_id),
        "quote_id": str(quote.id),
        "status": "accepted",
        "total": float(quote.total),
        "currency": quote.currency,
    }


@router.post("/{job_id}/quote/reject", summary="Decline the quoted price")
async def reject_quote(
    job_id: uuid.UUID,
    body: QuoteRejectRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Decline the price. Nothing executes and nothing is billed."""
    await _load_owned_job(db, job_id, current_user)
    quote = await quote_service.current_quote(db, job_id)
    if quote is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No quote for this job"
        )
    if not quote.is_actionable:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Quote is no longer actionable",
        )

    await quote_service.reject_quote(db, quote, reason=body.reason)
    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="quote.rejected",
        entity_type="quote",
        entity_id=str(quote.id),
        payload={"job_id": str(job_id), "reason": body.reason[:500]},
    )
    await db.commit()

    return {"job_id": str(job_id), "quote_id": str(quote.id), "status": "rejected"}


@router.post("/{job_id}/quote/refresh", summary="Re-price the job")
async def refresh_quote(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Issue a new quote, superseding the current one.

    Used after a rejected or expired quote, or when the client changed the
    delivery mode — an installation costs more than a document.
    """
    job = await _load_owned_job(db, job_id, current_user)
    if job.status in (
        JobStatus.in_progress,
        JobStatus.under_review,
        JobStatus.client_review,
        JobStatus.completed,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot re-price a job that is already executing",
        )

    try:
        quote = await quote_service.create_quote_for_job(db, job_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="quote.refreshed",
        entity_type="quote",
        entity_id=str(quote.id),
        payload={"job_id": str(job_id), "total": float(quote.total)},
    )
    await db.commit()
    await db.refresh(quote)
    return {"quote": await _serialise_quote(db, quote)}


# --------------------------------------------------------------------------- #
#  Expert-facing offer endpoints                                               #
# --------------------------------------------------------------------------- #


@router.get("/offers/{task_id}", summary="Price range offered to a human expert")
async def get_offer(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """What a human expert is offered for a task, and on what basis.

    The expert sees a band, not an auction: TaskMatch has already arbitrated what
    the work is worth, and the expert decides whether to take it.
    """
    task = (
        await db.execute(select(Task).where(Task.id == task_id))
    ).scalar_one_or_none()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    tq = (
        await db.execute(
            select(TaskQuote)
            .where(TaskQuote.task_id == task_id)
            .order_by(TaskQuote.created_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    if tq is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This task has not been priced yet",
        )

    route = tq.route.value if hasattr(tq.route, "value") else str(tq.route)
    if route == ExecutionRoute.llm.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This task is routed to an AI agent, not a human expert",
        )

    return {
        "task_id": str(task_id),
        "title": task.title,
        "description": task.description,
        "task_type": tq.task_type,
        "complexity": tq.complexity,
        "route": route,
        "estimated_hours": tq.human_hours,
        "discipline": tq.discipline,
        "seniority": tq.seniority,
        "range": {
            "low": float(tq.human_price_low) if tq.human_price_low else None,
            "high": float(tq.human_price_high) if tq.human_price_high else None,
            "currency": pricing_service.BASE_CURRENCY,
        },
        "rationale": tq.rationale,
        "taken": tq.accepted_offer is not None,
    }


@router.post("/offers/{task_id}/accept", summary="Expert accepts a task at a price")
async def accept_offer(
    task_id: uuid.UUID,
    body: OfferAcceptRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Accept a human-routed task at a price inside the quoted range."""
    tq = (
        await db.execute(
            select(TaskQuote)
            .where(TaskQuote.task_id == task_id)
            .order_by(TaskQuote.created_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    if tq is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This task has not been priced yet",
        )
    if tq.accepted_offer is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Offer already taken"
        )

    low = float(tq.human_price_low or 0)
    high = float(tq.human_price_high or 0)
    if low <= 0 or not (low - 0.01 <= body.price <= high + 0.01):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Price must be between {low} and {high} {pricing_service.BASE_CURRENCY}",
        )

    tq.accepted_offer = Decimal(str(round(body.price, 2)))
    tq.accepted_by_user_id = current_user.id
    await db.flush()

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="offer.accepted",
        entity_type="task",
        entity_id=str(task_id),
        payload={"price": body.price, "range": [low, high]},
    )
    await db.commit()

    logger.info(
        "offer.accepted",
        task_id=str(task_id),
        user_id=str(current_user.id),
        price=body.price,
    )
    return {
        "task_id": str(task_id),
        "accepted_price": body.price,
        "currency": pricing_service.BASE_CURRENCY,
    }
