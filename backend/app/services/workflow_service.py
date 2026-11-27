"""Shared persisted review and delivery transitions.

Stripe funding and client acceptance govern durable payout allocations. Legacy
jobs retain their explicit manual ledger; no transition claims a bank payout.
"""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import lazyload

from app.models.agent import Agent
from app.models.assignment import Assignment, AssignmentStatus
from app.models.bid import Bid
from app.models.delivery import DeliveryPlan, DeliveryStatus
from app.models.job import Job, JobStatus
from app.models.payment import PaymentRecord, PaymentStatus
from app.models.quote import Quote, QuoteStatus
from app.models.submission import Submission, SubmissionStatus
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.services.task_access import lock_job


async def apply_review(db: AsyncSession, task: Task, submission: Submission, decision: str) -> None:
    """Apply one review; callers lock/check the currently pending submission."""
    from app.services.billing_service import require_execution_funding

    if decision == "approved":
        from app.services.workflow_extensions import require_dependencies
        await require_dependencies(db, task)
    job = await lock_job(db, task.job_id)
    await require_execution_funding(db, job)
    assignment = await db.get(Assignment, submission.assignment_id)
    if decision == "approved":
        previously_completed = await db.scalar(
            select(Submission.id)
            .where(
                Submission.task_id == task.id,
                Submission.agent_id == submission.agent_id,
                Submission.status == SubmissionStatus.approved,
            )
            .limit(1)
        )
        submission.status = SubmissionStatus.approved
        task.status = TaskStatus.approved
        if assignment and assignment.status != AssignmentStatus.completed:
            assignment.status = AssignmentStatus.completed
            assignment.completed_at = datetime.now(timezone.utc)
            agent = await db.get(Agent, assignment.agent_id)
            if agent and previously_completed is None:
                agent.completed_tasks_count += 1
    else:
        task.retry_count += 1
        if task.retry_count >= task.max_retries:
            submission.status = SubmissionStatus.rejected
            task.status = TaskStatus.cancelled
            if assignment:
                assignment.status = AssignmentStatus.cancelled
        else:
            submission.status = SubmissionStatus.rework_requested
            task.status = TaskStatus.validation_failed
    await db.flush()
    if decision == "approved":
        await finalize_job_if_done(db, job)
        from app.services.workflow_extensions import release_dependents
        await release_dependents(db, task)


async def finalize_job_if_done(db: AsyncSession, job: Job) -> None:
    """Prepare delivery and immutable task allocations against the exact funding."""
    from app.services.billing_service import require_execution_funding

    job = await lock_job(db, job.id)
    if job.status in (JobStatus.completed, JobStatus.cancelled):
        return
    funding = await require_execution_funding(db, job)
    tasks = list(
        (
            await db.execute(
                select(Task)
                .options(lazyload("*"))
                .where(Task.job_id == job.id)
                .order_by(Task.id)
                .execution_options(populate_existing=True)
            )
        ).scalars()
    )
    if not tasks or any(task.status != TaskStatus.approved for task in tasks):
        return
    if funding is None:
        existing = await db.scalar(
            select(PaymentRecord.id).where(PaymentRecord.job_id == job.id).limit(1)
        )
        quote = await db.scalar(
            select(Quote)
            .options(lazyload("*"))
            .where(Quote.job_id == job.id, Quote.status == QuoteStatus.accepted)
            .order_by(Quote.created_at.desc())
            .limit(1)
        )
        existing_tasks = {task.id for task in tasks} if existing else set()
    else:
        quote = await db.get(Quote, funding.quote_id, options=[lazyload("*")])
        existing_tasks = set(
            (
                await db.execute(
                    select(PaymentRecord.task_id).where(PaymentRecord.funding_id == funding.id)
                )
            ).scalars()
        )
    subtotal = sum((Decimal(str(task.budget or 0)) for task in tasks), Decimal("0"))
    total = (
        Decimal(funding.amount_minor) / 100
        if funding
        else Decimal(str(quote.total))
        if quote
        else subtotal
    )
    remaining = total
    for index, task in enumerate(tasks):
        weight = Decimal(str(task.budget or 0)) / subtotal if subtotal else Decimal(1) / len(tasks)
        gross = remaining if index == len(tasks) - 1 else (total * weight).quantize(Decimal("0.01"))
        remaining -= gross
        if task.id in existing_tasks:
            continue
        assignment = await db.scalar(
            select(Assignment)
            .options(lazyload("*"))
            .where(Assignment.task_id == task.id, Assignment.status == AssignmentStatus.completed)
            .order_by(Assignment.created_at.desc())
            .limit(1)
        )
        agent = (
            await db.get(Agent, assignment.agent_id, options=[lazyload("*")])
            if assignment
            else None
        )
        bid = (
            await db.get(Bid, assignment.bid_id, options=[lazyload("*")])
            if assignment and assignment.bid_id
            else None
        )
        owner = (
            await db.get(User, agent.developer_user_id, options=[lazyload("*")]) if agent else None
        )
        if funding and owner is None:
            raise ValueError("Funded work must have an identified completed assignment")
        platform = funding is not None and owner.role == "admin" and not task.human_contract_json
        net = (
            Decimal("0")
            if platform
            else min(gross, Decimal(str(bid.price if bid else task.budget or 0)))
        )
        db.add(
            PaymentRecord(
                job_id=job.id,
                task_id=task.id,
                client_user_id=job.client_user_id,
                developer_user_id=None if platform else agent.developer_user_id if agent else None,
                gross_amount=gross,
                platform_fee=gross - net,
                net_amount=net,
                currency=quote.currency if funding else job.currency,
                funding_id=funding.id if funding else None,
                payment_status=PaymentStatus.pending,
                provider="platform" if platform else "stripe_connect" if funding else "manual",
                provider_ref=None,
            )
        )
    job.status = JobStatus.client_review
    plan = await db.scalar(
        select(DeliveryPlan).options(lazyload("*")).where(DeliveryPlan.job_id == job.id)
    )
    if plan and plan.status != DeliveryStatus.signed_off:
        plan.status = DeliveryStatus.delivered
        plan.delivered_at = datetime.now(timezone.utc)
    await db.flush()


async def accept_delivery(db: AsyncSession, job: Job) -> int:
    """Accept work and atomically enqueue eligible transfers; no bank payout claim."""
    from app.services.billing_service import queue_payouts, require_execution_funding

    job = await lock_job(db, job.id)
    if job.status != JobStatus.client_review:
        raise ValueError("Only delivered work awaiting review can be accepted")
    funding = await require_execution_funding(db, job)
    tasks = list(
        (
            await db.execute(select(Task).options(lazyload("*")).where(Task.job_id == job.id))
        ).scalars()
    )
    if not tasks or any(task.status != TaskStatus.approved for task in tasks):
        raise ValueError("Every task must be approved before acceptance")
    query = select(PaymentRecord).options(lazyload("*")).where(PaymentRecord.job_id == job.id)
    if funding:
        query = query.where(PaymentRecord.funding_id == funding.id)
    payments = list((await db.execute(query)).scalars())
    if funding and {payment.task_id for payment in payments} != {task.id for task in tasks}:
        raise ValueError("Every funded task must have its settlement allocation")
    ready = 0
    for payment in payments:
        if payment.payment_status in (PaymentStatus.pending, PaymentStatus.authorized):
            if funding and payment.provider == "platform":
                payment.payment_status = PaymentStatus.paid
            else:
                payment.payment_status = PaymentStatus.releasable
                ready += 1
    job.status = JobStatus.completed
    await db.flush()
    await queue_payouts(db, job)
    return ready
