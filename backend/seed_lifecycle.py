"""Drive several jobs through the full lifecycle so dashboards show completed
work and released payments: (ensure assignment) → submission → MCP validation →
completed escrow payment. Idempotent-ish: skips jobs already completed."""

import asyncio
import random
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select

from app.core.database import async_session_factory
from app.models.agent import Agent, AgentStatus
from app.models.assignment import Assignment, AssignmentStatus
from app.models.bid import Bid, BidStatus
from app.models.job import Job, JobStatus
from app.models.payment import PaymentRecord, PaymentStatus
from app.models.submission import Submission, SubmissionStatus
from app.models.task import Task, TaskStatus
from app.services import mcp_service

random.seed(7)
COMPLETE_N = 5  # complete this many jobs; leave the rest active for variety


async def _pick_agent(db, task, agents):
    """Prefer a developer (non-platform) agent that supports the task type."""
    tt = (task.task_type or "general").lower()
    def supports(a):
        return a.supported_task_types and tt in [str(x).lower() for x in a.supported_task_types]
    devs = [a for a in agents if not a.slug.startswith("llm-") and supports(a)]
    if devs:
        return max(devs, key=lambda a: (a.success_rate or 0))
    any_dev = [a for a in agents if not a.slug.startswith("llm-")]
    if any_dev:
        return max(any_dev, key=lambda a: (a.success_rate or 0))
    return agents[0] if agents else None


async def seed() -> None:
    async with async_session_factory() as db:
        agents = list((await db.execute(select(Agent).where(Agent.status == AgentStatus.active))).scalars().all())
        if not agents:
            print("No active agents; aborting.")
            return

        jobs = list(
            (
                await db.execute(
                    select(Job).where(Job.status.in_([JobStatus.bidding, JobStatus.decomposed])).order_by(Job.created_at)
                )
            ).scalars().all()
        )
        completed_jobs = 0
        for job in jobs:
            if completed_jobs >= COMPLETE_N:
                break
            tasks = list((await db.execute(select(Task).where(Task.job_id == job.id))).scalars().all())
            if not tasks:
                continue

            job_gross = Decimal("0")
            developer_user_id = None
            for task in tasks:
                # Ensure an assignment exists.
                assignment = (
                    await db.execute(select(Assignment).where(Assignment.task_id == task.id).limit(1))
                ).scalar_one_or_none()
                if assignment is None:
                    agent = await _pick_agent(db, task, agents)
                    if agent is None:
                        continue
                    price = task.budget or Decimal("500")
                    bid = Bid(
                        id=uuid.uuid4(), task_id=task.id, agent_id=agent.id,
                        price=Decimal(str(price)), eta_hours=float(random.randint(6, 48)),
                        confidence_score=min(0.99, agent.success_rate or 0.85),
                        proposal_text=f"{agent.name} delivering {task.task_type}.",
                        status=BidStatus.selected,
                    )
                    db.add(bid); await db.flush()
                    assignment = Assignment(
                        id=uuid.uuid4(), task_id=task.id, agent_id=agent.id, bid_id=bid.id,
                        status=AssignmentStatus.active,
                    )
                    db.add(assignment); await db.flush()

                agent = (await db.execute(select(Agent).where(Agent.id == assignment.agent_id))).scalar_one()
                developer_user_id = agent.developer_user_id

                # Submission (only if none yet).
                sub = (
                    await db.execute(select(Submission).where(Submission.task_id == task.id).limit(1))
                ).scalar_one_or_none()
                if sub is None:
                    sub = Submission(
                        id=uuid.uuid4(), task_id=task.id, agent_id=assignment.agent_id,
                        assignment_id=assignment.id,
                        output_json={
                            "result": f"Delivered: {task.title}. Implementation complete and self-checked.",
                            "summary": "All acceptance criteria met; artifacts attached.",
                            "artifact_url": "https://github.com/example/delivery",
                        },
                        summary=f"Completed {task.title}.",
                        artifact_urls_json=["https://github.com/example/delivery"],
                        status=SubmissionStatus.submitted,
                    )
                    db.add(sub); await db.flush()
                    try:
                        await mcp_service.validate_submission(db, sub.id)
                    except Exception as exc:  # noqa: BLE001
                        print(f"    validate failed: {exc}")

                assignment.status = AssignmentStatus.completed
                assignment.completed_at = datetime.now(timezone.utc)
                task.status = TaskStatus.approved
                agent.completed_tasks_count = (agent.completed_tasks_count or 0) + 1
                job_gross += Decimal(str(task.budget or 0))
                await db.flush()

            # Job-level completed payment.
            if job_gross <= 0:
                job_gross = Decimal(str(job.budget_max or 1000))
            fee = (job_gross * Decimal("0.10")).quantize(Decimal("0.01"))
            net = job_gross - fee
            db.add(PaymentRecord(
                id=uuid.uuid4(), job_id=job.id, client_user_id=job.client_user_id,
                developer_user_id=developer_user_id, gross_amount=job_gross,
                platform_fee=fee, net_amount=net, currency=job.currency or "EUR",
                payment_status=PaymentStatus.paid, provider="stripe",
                provider_ref=f"demo_{uuid.uuid4().hex[:12]}",
            ))
            job.status = JobStatus.completed
            await db.flush()
            completed_jobs += 1
            print(f"  completed job {str(job.id)[:8]} '{job.title[:40]}' tasks={len(tasks)} gross={job_gross} net={net} {job.currency}")

        await db.commit()
        print(f"Done. Completed {completed_jobs} jobs with payments.")


if __name__ == "__main__":
    asyncio.run(seed())
