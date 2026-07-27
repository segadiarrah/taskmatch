"""Seed platform LLM agents (one per provider) that compete with dev agents.

Idempotent by slug (llm-<provider>). Owned by an admin user. Active only when
their provider is enabled+keyed (managed from the admin Providers page). To make
the demo execute immediately, this also enables the OpenRouter provider using the
existing OPENAI_API_KEY (which is an OpenRouter key) if present.
"""

import asyncio
import os
import uuid

from sqlalchemy import select

from app.core.database import async_session_factory
from app.models.agent import Agent, AgentAuthType, AgentCapability, AgentStatus
from app.models.user import User, UserRole
from app.services import providers

BROAD = ["coding", "writing", "data_analysis", "research", "planning", "review", "general", "testing"]

PLATFORM = [
    ("openai", "OpenAI GPT-4o", "Platform model — OpenAI GPT-4o class.", 0.90, 4.6, 210),
    ("anthropic", "Anthropic Claude", "Platform model — Anthropic Claude class.", 0.92, 4.7, 240),
    ("google", "Google Gemini", "Platform model — Google Gemini class.", 0.88, 4.4, 180),
    ("mistral", "Mistral Large", "Platform model — Mistral Large.", 0.86, 4.3, 150),
    ("deepseek", "DeepSeek V3", "Platform model — DeepSeek V3.", 0.89, 4.5, 200),
    ("xai", "xAI Grok", "Platform model — xAI Grok.", 0.87, 4.3, 160),
    ("openrouter", "OpenRouter (multi-model)", "Platform gateway — routes to many models via OpenRouter.", 0.90, 4.6, 260),
]


async def seed() -> None:
    async with async_session_factory() as db:
        admin = (
            await db.execute(select(User).where(User.role == UserRole.admin).limit(1))
        ).scalar_one_or_none()
        if admin is None:
            print("No admin user; aborting.")
            return

        enabled = set(providers.enabled_providers())
        created = 0
        for provider, name, desc, sr, avg, completed in PLATFORM:
            slug = f"llm-{provider}"
            existing = (await db.execute(select(Agent).where(Agent.slug == slug))).scalar_one_or_none()
            is_on = provider in enabled
            if existing:
                existing.status = AgentStatus.active if is_on else AgentStatus.paused
                print(f"  exists: {slug} -> {existing.status.value}")
                continue
            agent = Agent(
                id=uuid.uuid4(),
                developer_user_id=admin.id,
                name=name,
                slug=slug,
                description=desc,
                endpoint_url=f"platform://{provider}",
                auth_type=AgentAuthType.none,
                status=AgentStatus.active if is_on else AgentStatus.paused,
                supported_task_types=BROAD,
                average_score=avg,
                success_rate=sr,
                completed_tasks_count=completed,
            )
            db.add(agent)
            await db.flush()
            for t in BROAD:
                db.add(AgentCapability(id=uuid.uuid4(), agent_id=agent.id, capability_name=t, version="1.0"))
            created += 1
            print(f"  created: {name} ({slug}) status={agent.status.value}")
        await db.commit()
        print(f"Done. Created {created} platform agents. Enabled providers: {sorted(enabled) or 'none'}")


if __name__ == "__main__":
    # Enable OpenRouter out of the box using the existing OpenRouter key so the
    # marketplace can execute requests immediately in the demo.
    or_key = os.environ.get("OPENAI_API_KEY", "")
    if or_key.startswith("sk-or-"):
        providers.update_provider("openrouter", api_key=or_key, enabled=True)
        print("Enabled OpenRouter provider from OPENAI_API_KEY.")
    asyncio.run(seed())
