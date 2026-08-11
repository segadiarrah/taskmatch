"""Quote persistence — turns the pure pricing engine into a durable commitment.

:mod:`app.services.pricing_service` decides the numbers; this module writes them
down, supersedes the previous quote, and enforces the gate that stops a job from
executing before the client has accepted a price.
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Optional

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.delivery import DeliveryMode, DeliveryPlan, DeliveryStatus
from app.models.job import Job, JobStatus
from app.models.quote import ExecutionRoute, Quote, QuoteStatus, TaskQuote
from app.models.task import Task
from app.services import pricing_service, providers

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)


# --------------------------------------------------------------------------- #
#  Helpers                                                                     #
# --------------------------------------------------------------------------- #


def _parse_spec(job: Job) -> dict[str, Any]:
    """Read the structured spec produced by ``mcp_service.format_job``."""
    if not job.formatted_summary:
        return {}
    try:
        parsed = json.loads(job.formatted_summary)
    except json.JSONDecodeError:
        return {"objective": job.formatted_summary}
    return parsed if isinstance(parsed, dict) else {}


def pricing_model() -> str:
    """Which model's rates to price against.

    Prefers a provider the admin has actually enabled, so the quote reflects what
    will really execute the work; falls back to the configured default.
    """
    for provider in providers.enabled_providers():
        cfg = providers.get_provider(provider)
        if cfg and cfg.get("selected_model"):
            return str(cfg["selected_model"])
    return settings.PRICING_DEFAULT_MODEL


#: Words in a brief that mean the client expects the thing to be *running*, not
#: merely described. These change the delivery mode, which changes the price.
_INSTALLATION_SIGNALS = re.compile(
    r"\b("
    # See the matching note in pricing_service: "déployer" needs the -y- stem too.
    r"install\w*|d[ée]plo[iy]\w*|deploy\w*|mise en production|"
    r"sur site|on[- ]premise|infrastructure|serveur|"
    r"h[ée]berg\w*|hosting|mettre en ligne|go[- ]live"
    r")\b",
    re.IGNORECASE,
)

_REPOSITORY_SIGNALS = re.compile(
    r"\b(code source|source code|repo\w*|d[ée]p[ôo]t git|pull request|github|gitlab)\b",
    re.IGNORECASE,
)

_DATASET_SIGNALS = re.compile(
    r"\b(dataset|jeu de donn[ée]es|export csv|extraction de donn[ée]es|base de donn[ée]es)\b",
    re.IGNORECASE,
)


def infer_delivery_mode(job: Job, spec: dict[str, Any]) -> DeliveryMode:
    """Propose a delivery mode from the brief. The client can override it."""
    haystack = " ".join(
        [
            job.raw_description or "",
            str(spec.get("objective") or ""),
            " ".join(str(d) for d in (spec.get("deliverables") or [])),
        ]
    )
    if _INSTALLATION_SIGNALS.search(haystack):
        return DeliveryMode.installation
    if _REPOSITORY_SIGNALS.search(haystack):
        return DeliveryMode.repository
    if _DATASET_SIGNALS.search(haystack):
        return DeliveryMode.dataset
    return DeliveryMode.document


# --------------------------------------------------------------------------- #
#  Quote creation                                                              #
# --------------------------------------------------------------------------- #


async def create_quote_for_job(
    db: AsyncSession, job_id: uuid.UUID, *, now: Optional[datetime] = None
) -> Quote:
    """Price every task of a job and persist the quote.

    Supersedes any quote still awaiting a decision — a job has at most one
    actionable quote at a time. Leaves the job in :attr:`JobStatus.quoted`.
    """
    now = now or datetime.now(timezone.utc)

    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if job is None:
        raise ValueError(f"Job {job_id} not found")

    tasks = list(
        (
            await db.execute(
                select(Task).where(Task.job_id == job_id).order_by(Task.priority)
            )
        )
        .scalars()
        .all()
    )
    if not tasks:
        raise ValueError(f"Job {job_id} has no tasks to price")

    spec = _parse_spec(job)
    model = pricing_model()

    quote_result = pricing_service.price_job(
        tasks=[
            {
                "title": t.title,
                "description": t.description,
                "task_type": t.task_type,
                "requires_human": bool(
                    (t.input_spec_json or {}).get("requires_human")
                ),
            }
            for t in tasks
        ],
        model=model,
        spec=spec,
        currency=job.currency or pricing_service.BASE_CURRENCY,
    )

    # Retire whatever the client was previously looking at.
    for previous in list(
        (
            await db.execute(
                select(Quote).where(
                    Quote.job_id == job_id,
                    Quote.status.in_([QuoteStatus.draft, QuoteStatus.pending_client]),
                )
            )
        )
        .scalars()
        .all()
    ):
        previous.status = QuoteStatus.superseded

    quote = Quote(
        id=uuid.uuid4(),
        job_id=job_id,
        status=QuoteStatus.pending_client,
        currency=quote_result.currency,
        subtotal=Decimal(str(quote_result.subtotal)),
        platform_fee=Decimal(str(quote_result.platform_fee)),
        total=Decimal(str(quote_result.total)),
        human_equivalent_low=Decimal(str(quote_result.human_equivalent_low)),
        human_equivalent_high=Decimal(str(quote_result.human_equivalent_high)),
        savings_vs_human=quote_result.savings_vs_human,
        valid_until=now + timedelta(days=settings.QUOTE_VALIDITY_DAYS),
        pricing_version=quote_result.pricing_version,
        breakdown_json=quote_result.to_dict(),
    )
    db.add(quote)
    await db.flush()

    for task, task_price in zip(tasks, quote_result.task_prices):
        db.add(
            TaskQuote(
                id=uuid.uuid4(),
                quote_id=quote.id,
                task_id=task.id,
                route=ExecutionRoute(task_price.route.value),
                complexity=task_price.complexity.value,
                task_type=task_price.task_type,
                model_slug=task_price.model,
                est_input_tokens=task_price.est_input_tokens,
                est_output_tokens=task_price.est_output_tokens,
                token_cost=Decimal(str(task_price.token_cost)),
                compute_cost=Decimal(str(task_price.compute_cost)),
                orchestration_fee=Decimal(str(task_price.orchestration_fee)),
                validation_cost=Decimal(str(task_price.validation_cost)),
                price=Decimal(str(pricing_service.billed_amount(task_price))),
                human_hours=task_price.human_hours,
                human_price_low=Decimal(str(task_price.human_price_low)),
                human_price_high=Decimal(str(task_price.human_price_high)),
                discipline=task_price.discipline,
                seniority=task_price.seniority,
                rationale=task_price.rationale,
                breakdown_json=task_price.to_dict(),
            )
        )

        # Keep Task.budget in step with the quote so every downstream consumer
        # (bid ranking, escrow, dashboards) sees the price TaskMatch decided
        # rather than the client's original budget guess.
        task.budget = Decimal(str(pricing_service.billed_amount(task_price)))

    await ensure_delivery_plan(db, job, spec)

    job.status = JobStatus.quoted
    await db.flush()

    logger.info(
        "quote.created",
        job_id=str(job_id),
        quote_id=str(quote.id),
        total=float(quote.total),
        tasks=len(tasks),
        model=model,
        requires_human=quote_result.requires_human,
    )
    return quote


async def ensure_delivery_plan(
    db: AsyncSession, job: Job, spec: dict[str, Any]
) -> DeliveryPlan:
    """Create the job's delivery plan if it does not have one yet.

    Never overwrites an existing plan: once the client has chosen how they want
    the work delivered, a re-quote must not silently change it back.
    """
    existing = (
        await db.execute(
            select(DeliveryPlan).where(DeliveryPlan.job_id == job.id)
        )
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    mode = infer_delivery_mode(job, spec)
    plan = DeliveryPlan(
        id=uuid.uuid4(),
        job_id=job.id,
        mode=mode,
        status=(
            DeliveryStatus.awaiting_access
            if mode in (DeliveryMode.installation, DeliveryMode.hosted)
            else DeliveryStatus.planned
        ),
        requirements=_requirements_for(mode),
    )
    db.add(plan)
    await db.flush()
    return plan


def _requirements_for(mode: DeliveryMode) -> dict[str, Any]:
    """What the client must supply before this delivery mode can complete."""
    if mode is DeliveryMode.installation:
        return {
            "needs_access": True,
            "items": [
                "Host or cluster endpoint",
                "Deploy credentials (SSH key or console login)",
                "Target environment name",
            ],
        }
    if mode is DeliveryMode.hosted:
        return {
            "needs_access": True,
            "items": ["Domain name (optional)", "Any third-party API keys to configure"],
        }
    if mode is DeliveryMode.repository:
        return {"needs_access": False, "items": ["Repository URL and write access"]}
    return {"needs_access": False, "items": []}


# --------------------------------------------------------------------------- #
#  Decisions                                                                   #
# --------------------------------------------------------------------------- #


async def current_quote(db: AsyncSession, job_id: uuid.UUID) -> Optional[Quote]:
    """The quote the client should be looking at, newest first."""
    return (
        await db.execute(
            select(Quote)
            .where(Quote.job_id == job_id)
            .order_by(Quote.created_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()


def expire_if_due(quote: Quote, now: Optional[datetime] = None) -> bool:
    """Mark an actionable quote expired if its validity window has passed.

    Returns whether the status changed, so the caller knows to flush.
    """
    now = now or datetime.now(timezone.utc)
    if not quote.is_actionable or quote.valid_until is None:
        return False
    valid_until = quote.valid_until
    if valid_until.tzinfo is None:
        valid_until = valid_until.replace(tzinfo=timezone.utc)
    if now >= valid_until:
        quote.status = QuoteStatus.expired
        return True
    return False


async def accept_quote(
    db: AsyncSession, quote: Quote, *, now: Optional[datetime] = None
) -> None:
    """Record the client's acceptance and open the job for execution."""
    now = now or datetime.now(timezone.utc)
    quote.status = QuoteStatus.accepted
    quote.decided_at = now

    job = (
        await db.execute(select(Job).where(Job.id == quote.job_id))
    ).scalar_one_or_none()
    if job is not None:
        job.status = JobStatus.bidding
    await db.flush()


async def reject_quote(
    db: AsyncSession,
    quote: Quote,
    *,
    reason: str = "",
    now: Optional[datetime] = None,
) -> None:
    """Record the client's refusal. The job stops here until it is re-quoted."""
    now = now or datetime.now(timezone.utc)
    quote.status = QuoteStatus.rejected
    quote.decided_at = now
    quote.rejection_reason = reason or None

    job = (
        await db.execute(select(Job).where(Job.id == quote.job_id))
    ).scalar_one_or_none()
    if job is not None:
        job.status = JobStatus.quote_rejected
    await db.flush()
