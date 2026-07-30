"""Seed human-expert executors (idempotent by slug). Run inside the backend container.

Human experts have no callable endpoint; the platform stores a profile URL of the
form ``/experts/{slug}`` and dispatches matched tasks to their dashboard. This is
what makes the "AI agents AND human experts compete on the same explainable score"
story visible across the marketplace and the developer views.
"""

import asyncio
import uuid

from sqlalchemy import select

from app.core.database import async_session_factory
from app.models.agent import Agent, AgentAuthType, AgentCapability, AgentStatus
from app.models.user import User, UserRole

# name, slug, description, task_types (also become capabilities), success_rate, avg_score(0-5), completed
EXPERTS = [
    ("Amara — Security & Compliance Lead", "amara-security-lead",
     "Ex-fintech AppSec. Threat modelling, SOC 2 / ISO 27001 audits, secure code review.",
     ["review", "testing"], 0.97, 4.9, 63),
    ("Liang — Staff Data Scientist", "liang-data-scientist",
     "PhD in statistics. Experiment design, causal inference, model validation and explainability.",
     ["data_analysis", "research"], 0.95, 4.8, 47),
    ("Sofia — Principal Product Designer", "sofia-product-designer",
     "12 yrs product design. Complex B2B flows, design systems, accessibility (WCAG) audits.",
     ["design"], 0.93, 4.7, 38),
    ("Marcus — Legal & Contracts Counsel", "marcus-legal-counsel",
     "Technology & data-protection lawyer. GDPR/DPA reviews, SaaS contracts, IP due diligence.",
     ["review", "writing"], 0.96, 4.8, 51),
    ("Priya — Solutions Architect", "priya-solutions-architect",
     "Cloud-native architecture, migrations and audits. Turns fuzzy requirements into a build plan.",
     ["planning", "review"], 0.94, 4.7, 44),
]


async def seed() -> None:
    async with async_session_factory() as db:
        devs = list(
            (await db.execute(select(User).where(User.role == UserRole.agent_developer))).scalars().all()
        )
        if not devs:
            print("No agent_developer users found; aborting.")
            return
        created = 0
        for i, (name, slug, desc, types, sr, avg, completed) in enumerate(EXPERTS):
            existing = (await db.execute(select(Agent).where(Agent.slug == slug))).scalar_one_or_none()
            if existing:
                print(f"  skip (exists): {slug}")
                continue
            owner = devs[i % len(devs)]
            expert = Agent(
                id=uuid.uuid4(),
                developer_user_id=owner.id,
                name=name,
                slug=slug,
                description=desc,
                # Profile URL, not a callable endpoint — this is what marks a human expert.
                endpoint_url=f"https://taskmatch.ai/experts/{slug}",
                auth_type=AgentAuthType.none,
                status=AgentStatus.active,
                supported_task_types=types,
                average_score=avg,
                success_rate=sr,
                completed_tasks_count=completed,
            )
            db.add(expert)
            await db.flush()
            for t in types:
                db.add(AgentCapability(id=uuid.uuid4(), agent_id=expert.id, capability_name=t, version="1.0"))
            created += 1
            print(f"  created: {name} ({', '.join(types)}) owner={owner.email}")
        await db.commit()
        experts = (
            await db.execute(select(Agent).where(Agent.endpoint_url.like("%/experts/%")))
        ).scalars().all()
        print(f"Done. Created {created}. Total human experts now: {len(experts)}")


if __name__ == "__main__":
    asyncio.run(seed())
