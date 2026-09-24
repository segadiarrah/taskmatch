"""Shared persisted review and delivery transitions.

Payment records are a manual ledger. Creating or releasing a ledger entry does
not charge a client, hold escrow, or transfer money to a developer.
"""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.assignment import Assignment, AssignmentStatus
from app.models.bid import Bid
from app.models.delivery import DeliveryPlan, DeliveryStatus
from app.models.job import Job, JobStatus
from app.models.payment import PaymentRecord, PaymentStatus
from app.models.quote import Quote, QuoteStatus
from app.models.submission import Submission, SubmissionStatus
from app.models.task import Task, TaskStatus


async def apply_review(db: AsyncSession, task: Task, submission: Submission, decision: str) -> None:
    """Apply one review; callers lock/check the currently pending submission."""
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
        job = (
            await db.execute(
                select(Job)
                .where(Job.id == task.job_id)
                .with_for_update()
                .execution_options(populate_existing=True)
            )
        ).scalar_one()
        await finalize_job_if_done(db, job)


async def finalize_job_if_done(db: AsyncSession, job: Job) -> None:
    """Offer all approved work for client review and create its manual ledger."""
    if job.status in (JobStatus.completed, JobStatus.cancelled):
        return
    tasks = list(
        (
            await db.execute(
                select(Task)
                .where(Task.job_id == job.id)
                .order_by(Task.id)
                .execution_options(populate_existing=True)
            )
        ).scalars()
    )
    if not tasks or any(task.status != TaskStatus.approved for task in tasks):
        return
    existing = await db.scalar(
        select(PaymentRecord.id).where(PaymentRecord.job_id == job.id).limit(1)
    )
    if existing is None:
        quote = await db.scalar(
            select(Quote)
            .where(Quote.job_id == job.id, Quote.status == QuoteStatus.accepted)
            .order_by(Quote.created_at.desc())
            .limit(1)
        )
        subtotal = sum((Decimal(str(task.budget or 0)) for task in tasks), Decimal("0"))
        total = Decimal(str(quote.total)) if quote else subtotal
        remaining = total
        for index, task in enumerate(tasks):
            assignment = await db.scalar(
                select(Assignment)
                .where(
                    Assignment.task_id == task.id, Assignment.status == AssignmentStatus.completed
                )
                .order_by(Assignment.created_at.desc())
                .limit(1)
            )
            agent = await db.get(Agent, assignment.agent_id) if assignment else None
            bid = await db.get(Bid, assignment.bid_id) if assignment and assignment.bid_id else None
            weight = (
                Decimal(str(task.budget or 0)) / subtotal if subtotal else Decimal(1) / len(tasks)
            )
            gross = (
                remaining if index == len(tasks) - 1 else (total * weight).quantize(Decimal("0.01"))
            )
            remaining -= gross
            net = min(gross, Decimal(str(bid.price if bid else task.budget or 0)))
            db.add(
                PaymentRecord(
                    job_id=job.id,
                    task_id=task.id,
                    client_user_id=job.client_user_id,
                    developer_user_id=agent.developer_user_id if agent else None,
                    gross_amount=gross,
                    platform_fee=gross - net,
                    net_amount=net,
                    currency=job.currency,
                    payment_status=PaymentStatus.pending,
                    provider="manual",
                    provider_ref=None,
                )
            )
    job.status = JobStatus.client_review
    plan = await db.scalar(select(DeliveryPlan).where(DeliveryPlan.job_id == job.id))
    if plan and plan.status != DeliveryStatus.signed_off:
        plan.status = DeliveryStatus.delivered
        plan.delivered_at = datetime.now(timezone.utc)
    await db.flush()


async def accept_delivery(db: AsyncSession, job: Job) -> int:
    """Close client-approved work and make its ledger ready for manual settlement."""
    job = await db.scalar(
        select(Job)
        .where(Job.id == job.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if job.status != JobStatus.client_review:
        raise ValueError("Only delivered work awaiting review can be accepted")
    tasks = list((await db.execute(select(Task).where(Task.job_id == job.id))).scalars())
    if not tasks or any(task.status != TaskStatus.approved for task in tasks):
        raise ValueError("Every task must be approved before acceptance")
    payments = (
        await db.execute(select(PaymentRecord).where(PaymentRecord.job_id == job.id))
    ).scalars()
    ready = 0
    for payment in payments:
        if payment.payment_status in (PaymentStatus.pending, PaymentStatus.authorized):
            payment.payment_status = PaymentStatus.releasable
            ready += 1
    job.status = JobStatus.completed
    await db.flush()
    return ready
