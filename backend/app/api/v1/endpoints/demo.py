"""Public, no-auth "try it live" endpoint for the marketing homepage.

Takes a plain-language task description and returns — in real time — the same
structured spec, task decomposition, and best-matched executors the real
pipeline produces, WITHOUT persisting anything or requiring an account.
Reuses the actual MCP + LLM logic (with the deterministic fallback), so the
homepage demo is a genuine preview of the product, not a mockup.
"""

from __future__ import annotations

import math
from decimal import Decimal

import structlog
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.agent import Agent, AgentStatus
from app.models.job import Job
from app.services import mcp_service

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)

router = APIRouter()

_MAX_DESC = 2000


class DemoRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=_MAX_DESC)


def _score_agent(agent: Agent, task_type: str) -> float:
    """Compact version of the real weighted matching score (0-100)."""
    tt = (task_type or "general").lower()
    supported = [str(x).lower() for x in (agent.supported_task_types or [])]
    caps = [c.capability_name.lower() for c in (agent.capabilities or [])]
    cap = 0.0
    if tt in caps or tt in supported:
        cap = 100.0
    elif any(tt in c or c in tt for c in caps):
        cap = 70.0
    elif supported:
        cap = 40.0
    sr = (agent.success_rate or 0.0) * 100.0
    avg = min((agent.average_score or 0.0) * 20.0, 100.0)
    completed = agent.completed_tasks_count or 0
    exp = min(math.log10(completed + 1) * 50.0, 100.0) if completed else 0.0
    return round(cap * 0.40 + sr * 0.30 + avg * 0.20 + exp * 0.10, 1)


@router.post("/demo/plan", summary="Live homepage demo — structure & match a task (no auth, no persistence)")
async def demo_plan(payload: DemoRequest, db: AsyncSession = Depends(get_db)) -> dict:
    desc = payload.description.strip()[:_MAX_DESC]

    # Detached, in-memory job — never added to the session.
    job = Job(
        title=desc[:120],
        raw_description=desc,
        budget_min=Decimal("1000"),
        budget_max=Decimal("8000"),
        currency="EUR",
        deadline=None,
    )

    # 1) Format (LLM, deterministic fallback).
    spec = await mcp_service._llm_format_job(job)
    if not isinstance(spec, dict) or not spec.get("objective"):
        sentences = mcp_service._extract_sentences(desc)
        spec = {
            "objective": sentences[0] if sentences else desc[:160],
            "deliverables": sentences[1:3] if len(sentences) > 1 else ["Complete the requested work"],
            "constraints": [],
            "success_criteria": sentences[3:5] if len(sentences) > 3 else ["Meets the stated requirements"],
        }

    # 2) Decompose (LLM, deterministic fallback).
    specs = await mcp_service._llm_decompose_job(job, spec)
    if not specs:
        parts = mcp_service._split_on_conjunctions(desc)
        if len(parts) >= 2:
            specs = [
                {"title": p[:120], "description": p, "task_type": mcp_service._infer_task_type(p), "priority": i + 1}
                for i, p in enumerate(parts[:6])
            ]
        else:
            specs = [
                {
                    "title": (spec.get("objective") or desc)[:120],
                    "description": desc,
                    "task_type": mcp_service._infer_task_type(desc),
                    "priority": 1,
                }
            ]

    # 3) Match against real active agents (read-only).
    agents = list(
        (await db.execute(select(Agent).where(Agent.status == AgentStatus.active))).scalars().all()
    )
    tasks_out = []
    for spec_item in specs[:6]:
        tt = spec_item.get("task_type", "general")
        ranked = sorted(
            ({"name": a.name, "slug": a.slug, "score": _score_agent(a, tt)} for a in agents),
            key=lambda x: x["score"],
            reverse=True,
        )[:3]
        tasks_out.append(
            {
                "title": spec_item.get("title", ""),
                "task_type": tt,
                "description": spec_item.get("description", ""),
                "matched": ranked,
            }
        )

    logger.info("demo.plan", desc_len=len(desc), tasks=len(tasks_out), agents=len(agents))
    return {
        "spec": {
            "objective": spec.get("objective"),
            "deliverables": [str(d) for d in (spec.get("deliverables") or [])][:6],
            "success_criteria": [str(s) for s in (spec.get("success_criteria") or [])][:6],
        },
        "tasks": tasks_out,
    }
