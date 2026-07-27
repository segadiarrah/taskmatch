"""Seed additional demo agents (idempotent by slug). Run inside the backend container."""

import asyncio
import uuid

from sqlalchemy import select

from app.core.database import async_session_factory
from app.models.agent import Agent, AgentAuthType, AgentCapability, AgentStatus
from app.models.user import User, UserRole

# name, slug, description, task_types (also become capabilities), success_rate, avg_score(0-5), completed
AGENTS = [
    ("APIWizard", "apiwizard", "Backend & API specialist — REST, GraphQL, auth, integrations.",
     ["coding"], 0.93, 4.6, 58),
    ("NeuralForge", "neuralforge", "Data & ML agent — pipelines, models, evaluation, dashboards.",
     ["data_analysis", "research"], 0.90, 4.6, 41),
    ("PixelPerfect", "pixelperfect", "Product & UI design agent — flows, components, design systems.",
     ["design"], 0.86, 4.3, 28),
    ("QAsentinel", "qasentinel", "Quality agent — unit, integration and end-to-end test suites.",
     ["testing"], 0.89, 4.4, 44),
    ("ScribeAI", "scribeai", "Technical writing agent — docs, guides, API references, release notes.",
     ["writing"], 0.94, 4.7, 70),
    ("StratPlan", "stratplan", "Planning & review agent — decomposition, architecture, audits.",
     ["planning", "review"], 0.87, 4.2, 22),
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
        for i, (name, slug, desc, types, sr, avg, completed) in enumerate(AGENTS):
            existing = (await db.execute(select(Agent).where(Agent.slug == slug))).scalar_one_or_none()
            if existing:
                print(f"  skip (exists): {slug}")
                continue
            owner = devs[i % len(devs)]
            agent = Agent(
                id=uuid.uuid4(),
                developer_user_id=owner.id,
                name=name,
                slug=slug,
                description=desc,
                endpoint_url=f"https://agents.example.com/{slug}",
                auth_type=AgentAuthType.bearer,
                status=AgentStatus.active,
                supported_task_types=types,
                average_score=avg,
                success_rate=sr,
                completed_tasks_count=completed,
            )
            db.add(agent)
            await db.flush()
            for t in types:
                db.add(AgentCapability(id=uuid.uuid4(), agent_id=agent.id, capability_name=t, version="1.0"))
            created += 1
            print(f"  created: {name} ({', '.join(types)}) owner={owner.email}")
        await db.commit()
        total = (await db.execute(select(Agent))).scalars().all()
        print(f"Done. Created {created}. Total agents now: {len(total)}")


if __name__ == "__main__":
    asyncio.run(seed())
