"""
MCP (Mission Control Platform) Orchestration Service

This service encapsulates all AI-driven decision-making for TaskMatch.
Every action is logged to mcp_decisions for full inspectability.
Currently uses deterministic logic with LLM abstraction ready.
"""

from __future__ import annotations

import json
import math
import re
import uuid
from decimal import Decimal
from typing import Any
from uuid import UUID

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.audit import AuditLog, FeedbackNote, MCPDecision
from app.models.bid import Bid, BidStatus
from app.models.job import Job, JobStatus
from app.models.review import ReviewDecision, ReviewerType, ValidationReview
from app.models.submission import Submission, SubmissionStatus
from app.models.task import Task, TaskStatus

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _log_mcp_decision(
    db: AsyncSession,
    *,
    entity_type: str,
    entity_id: str,
    decision_type: str,
    input_snapshot: dict[str, Any],
    output_snapshot: dict[str, Any],
    reasoning: str | None = None,
    confidence: float | None = None,
) -> MCPDecision:
    """Persist an MCP decision for auditing and inspectability."""
    decision = MCPDecision(
        entity_type=entity_type,
        entity_id=str(entity_id),
        decision_type=decision_type,
        input_snapshot_json=input_snapshot,
        output_snapshot_json=output_snapshot,
        reasoning_summary=reasoning,
        confidence_score=confidence,
    )
    db.add(decision)
    await db.flush()
    logger.info(
        "mcp.decision_logged",
        decision_id=str(decision.id),
        decision_type=decision_type,
        entity_type=entity_type,
        entity_id=str(entity_id),
    )
    return decision


async def _log_audit(
    db: AsyncSession,
    *,
    action: str,
    entity_type: str,
    entity_id: str,
    payload: dict[str, Any] | None = None,
) -> AuditLog:
    """Write an audit log entry for an MCP action."""
    entry = AuditLog(
        actor_type="mcp",
        actor_id="mcp-orchestrator",
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        payload_json=payload,
    )
    db.add(entry)
    await db.flush()
    return entry


def _extract_sentences(text: str, max_count: int = 5) -> list[str]:
    """Split text into sentences and return up to *max_count*."""
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [s.strip() for s in sentences if s.strip()][:max_count]


def _split_on_conjunctions(text: str) -> list[str]:
    """Split a description on 'and', 'then', semicolons, numbered items."""
    # Try numbered list first (e.g. "1. ... 2. ...")
    numbered = re.split(r"\d+\.\s+", text)
    numbered = [s.strip() for s in numbered if s.strip()]
    if len(numbered) >= 2:
        return numbered

    # Try bullet/dash list
    bullet = re.split(r"[\n\r]+\s*[-*]\s+", text)
    bullet = [s.strip() for s in bullet if s.strip()]
    if len(bullet) >= 2:
        return bullet

    # Fall back to conjunctions and semicolons
    parts = re.split(r"\s*(?:;\s*|\band\b\s+|\bthen\b\s+)", text, flags=re.IGNORECASE)
    return [p.strip() for p in parts if p.strip()]


# ---------------------------------------------------------------------------
# (a) format_job
# ---------------------------------------------------------------------------


async def format_job(db: AsyncSession, job_id: UUID) -> dict[str, Any]:
    """Take a raw job description and produce a structured formatted summary.

    The summary contains:
    - **objective**: The main goal of the job.
    - **deliverables**: Concrete outputs expected.
    - **constraints**: Budget, deadline, or technical constraints.
    - **success_criteria**: How success will be measured.

    For MVP this uses deterministic text parsing.  The LLM abstraction in
    ``llm_service.call_llm`` is ready to replace the heuristics.

    Parameters
    ----------
    db : AsyncSession
        Active database session.
    job_id : UUID
        Primary key of the job to format.

    Returns
    -------
    dict
        The structured formatted summary.

    Raises
    ------
    ValueError
        If the job does not exist or is not in a formattable state.
    """
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise ValueError(f"Job {job_id} not found")

    raw = job.raw_description or ""
    title = job.title or ""

    # --- deterministic parsing ---
    sentences = _extract_sentences(raw)

    objective = sentences[0] if sentences else title
    deliverables = sentences[1:3] if len(sentences) > 1 else [f"Complete: {title}"]
    constraints: list[str] = []
    if job.budget_min is not None and job.budget_max is not None:
        constraints.append(
            f"Budget range: {job.currency} {job.budget_min} - {job.budget_max}"
        )
    if job.deadline:
        constraints.append(f"Deadline: {job.deadline.isoformat()}")
    success_criteria = sentences[3:5] if len(sentences) > 3 else ["Deliver all listed deliverables on time and within budget"]

    # Incorporate explicit requirements if present (loaded via selectin)
    if job.requirements:
        for req in job.requirements:
            if req.priority == "high":
                deliverables.append(f"[{req.requirement_type}] {req.description}")
            else:
                constraints.append(f"[{req.requirement_type}] {req.description}")

    formatted = {
        "objective": objective,
        "deliverables": deliverables,
        "constraints": constraints,
        "success_criteria": success_criteria,
    }

    # Persist
    job.formatted_summary = json.dumps(formatted)
    job.status = JobStatus.formatted
    await db.flush()

    # Log decision
    await _log_mcp_decision(
        db,
        entity_type="job",
        entity_id=str(job_id),
        decision_type="formatting",
        input_snapshot={
            "raw_description": raw[:2000],
            "title": title,
            "requirements_count": len(job.requirements) if job.requirements else 0,
        },
        output_snapshot=formatted,
        reasoning="Deterministic parsing: first sentence as objective, next sentences as deliverables, budget/deadline as constraints.",
        confidence=0.7,
    )

    await _log_audit(
        db,
        action="job.formatted",
        entity_type="job",
        entity_id=str(job_id),
        payload={"status": "formatted"},
    )

    logger.info("mcp.format_job.complete", job_id=str(job_id))
    return formatted


# ---------------------------------------------------------------------------
# (b) decompose_job
# ---------------------------------------------------------------------------


async def decompose_job(db: AsyncSession, job_id: UUID) -> list[dict[str, Any]]:
    """Split a formatted job into logical subtasks.

    Heuristic rules for MVP:
    - If budget > 5 000, split into at least two phases.
    - Look for conjunctions / numbered lists in deliverables to generate
      individual tasks.
    - Each task inherits a proportional budget share.

    Parameters
    ----------
    db : AsyncSession
    job_id : UUID

    Returns
    -------
    list[dict]
        Created task records (as dicts with id, title, description, etc.).

    Raises
    ------
    ValueError
        If the job does not exist or is not in the ``formatted`` state.
    """
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise ValueError(f"Job {job_id} not found")
    if job.status not in (JobStatus.formatted, JobStatus.submitted):
        raise ValueError(
            f"Job {job_id} must be in 'formatted' or 'submitted' state, got '{job.status}'"
        )

    # Parse the formatted summary
    formatted: dict[str, Any] = {}
    if job.formatted_summary:
        try:
            formatted = json.loads(job.formatted_summary)
        except json.JSONDecodeError:
            formatted = {"objective": job.formatted_summary}

    deliverables: list[str] = formatted.get("deliverables", [])
    objective: str = formatted.get("objective", job.title)
    raw = job.raw_description or ""

    # --- heuristic decomposition ---
    task_specs: list[dict[str, Any]] = []

    # Strategy 1: use deliverables directly
    if deliverables and len(deliverables) >= 2:
        for idx, d in enumerate(deliverables):
            task_specs.append({
                "title": f"Phase {idx + 1}: {d[:120]}",
                "description": d,
                "task_type": _infer_task_type(d),
                "priority": idx + 1,
            })
    else:
        # Strategy 2: split raw description on conjunctions
        parts = _split_on_conjunctions(raw)
        if len(parts) >= 2:
            for idx, part in enumerate(parts):
                task_specs.append({
                    "title": f"Task {idx + 1}: {part[:120]}",
                    "description": part,
                    "task_type": _infer_task_type(part),
                    "priority": idx + 1,
                })

    # Strategy 3: budget-based splitting
    budget_max = float(job.budget_max) if job.budget_max else 0
    if not task_specs:
        if budget_max > 5000:
            task_specs = [
                {
                    "title": f"Phase 1 - Planning: {objective[:100]}",
                    "description": f"Planning and design for: {objective}",
                    "task_type": "planning",
                    "priority": 1,
                },
                {
                    "title": f"Phase 2 - Execution: {objective[:100]}",
                    "description": f"Implementation and delivery for: {objective}",
                    "task_type": "execution",
                    "priority": 2,
                },
            ]
        else:
            # Single task for small jobs
            task_specs = [
                {
                    "title": objective[:250],
                    "description": raw or objective,
                    "task_type": _infer_task_type(raw or objective),
                    "priority": 1,
                },
            ]

    # Distribute budget proportionally
    num_tasks = len(task_specs)
    per_task_budget = (
        round(budget_max / num_tasks, 2) if num_tasks and budget_max else None
    )

    # Build output spec from constraints / success criteria
    success_criteria = formatted.get("success_criteria", [])
    output_spec: dict[str, Any] = {
        "required_fields": ["result", "summary"],
        "success_criteria": success_criteria,
    }

    # Create Task records
    created_tasks: list[dict[str, Any]] = []
    for spec in task_specs:
        task = Task(
            job_id=job_id,
            title=spec["title"],
            description=spec["description"],
            task_type=spec["task_type"],
            budget=Decimal(str(per_task_budget)) if per_task_budget else None,
            priority=spec["priority"],
            status=TaskStatus.open_for_bids,
            output_spec_json=output_spec,
        )
        db.add(task)
        await db.flush()  # get the id

        created_tasks.append({
            "id": str(task.id),
            "title": task.title,
            "description": task.description,
            "task_type": task.task_type,
            "budget": float(task.budget) if task.budget else None,
            "priority": task.priority,
            "status": task.status,
        })

    # Update job status
    job.status = JobStatus.decomposed
    await db.flush()

    # Log decision
    await _log_mcp_decision(
        db,
        entity_type="job",
        entity_id=str(job_id),
        decision_type="decomposition",
        input_snapshot={
            "formatted_summary": formatted,
            "budget_max": budget_max,
            "raw_description_len": len(raw),
        },
        output_snapshot={
            "task_count": len(created_tasks),
            "tasks": created_tasks,
        },
        reasoning=(
            f"Decomposed into {len(created_tasks)} task(s) using "
            f"{'deliverables' if deliverables and len(deliverables) >= 2 else 'heuristic'} strategy. "
            f"Budget per task: {per_task_budget}."
        ),
        confidence=0.65,
    )

    await _log_audit(
        db,
        action="job.decomposed",
        entity_type="job",
        entity_id=str(job_id),
        payload={
            "task_count": len(created_tasks),
            "task_ids": [t["id"] for t in created_tasks],
        },
    )

    logger.info(
        "mcp.decompose_job.complete",
        job_id=str(job_id),
        task_count=len(created_tasks),
    )
    return created_tasks


def _infer_task_type(text: str) -> str:
    """Infer a task type from description text using keyword matching."""
    text_lower = text.lower()
    type_keywords: dict[str, list[str]] = {
        "coding": ["code", "develop", "implement", "program", "build", "api", "software", "app"],
        "design": ["design", "ui", "ux", "wireframe", "mockup", "layout", "figma"],
        "data_analysis": ["data", "analysis", "analytics", "report", "statistics", "dashboard"],
        "writing": ["write", "copy", "content", "article", "blog", "documentation", "doc"],
        "testing": ["test", "qa", "quality", "verify", "validation", "check"],
        "research": ["research", "investigate", "explore", "study", "survey"],
        "planning": ["plan", "strategy", "roadmap", "architecture", "design doc"],
        "review": ["review", "audit", "assess", "evaluate"],
    }
    for task_type, keywords in type_keywords.items():
        if any(kw in text_lower for kw in keywords):
            return task_type
    return "general"


# ---------------------------------------------------------------------------
# (c) match_agents
# ---------------------------------------------------------------------------


async def match_agents(
    db: AsyncSession, task_id: UUID
) -> list[dict[str, Any]]:
    """Find and rank agents whose capabilities match a task.

    Scoring weights:
    - **capability_match**: 40 %
    - **success_rate**: 30 %
    - **average_score**: 20 %
    - **completed_tasks_count**: 10 %

    Parameters
    ----------
    db : AsyncSession
    task_id : UUID

    Returns
    -------
    list[dict]
        Ranked list of agents with scores and reasoning.

    Raises
    ------
    ValueError
        If the task does not exist.
    """
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise ValueError(f"Task {task_id} not found")

    task_type = task.task_type or "general"

    # Fetch active agents with capabilities
    agents_result = await db.execute(
        select(Agent).where(Agent.status == "active")
    )
    agents = list(agents_result.scalars().all())

    if not agents:
        logger.warning("mcp.match_agents.no_active_agents", task_id=str(task_id))
        return []

    scored_agents: list[dict[str, Any]] = []

    for agent in agents:
        # --- capability_match (0-100, weight 40%) ---
        cap_score = 0.0
        if agent.capabilities:
            cap_names = [c.capability_name.lower() for c in agent.capabilities]
            # Direct match
            if task_type.lower() in cap_names:
                cap_score = 100.0
            else:
                # Partial match: check if any capability is a substring or vice versa
                for cap_name in cap_names:
                    if cap_name in task_type.lower() or task_type.lower() in cap_name:
                        cap_score = max(cap_score, 70.0)
                    # Also check supported_task_types JSON
                if agent.supported_task_types:
                    supported = agent.supported_task_types
                    if isinstance(supported, list) and task_type in supported:
                        cap_score = max(cap_score, 90.0)
                    elif isinstance(supported, dict) and task_type in supported:
                        cap_score = max(cap_score, 90.0)
        elif agent.supported_task_types:
            supported = agent.supported_task_types
            if isinstance(supported, list) and task_type in supported:
                cap_score = 80.0
            elif isinstance(supported, dict) and task_type in supported:
                cap_score = 80.0

        # --- success_rate (0-100, weight 30%) ---
        sr_score = (agent.success_rate or 0.0) * 100.0

        # --- average_score (0-100, weight 20%) ---
        # Assume average_score is on a 0-5 scale; normalize to 0-100
        avg_raw = agent.average_score or 0.0
        avg_score = min(avg_raw * 20.0, 100.0)

        # --- completed_tasks_count (0-100, weight 10%) ---
        # Logarithmic scaling: 10+ tasks = 100
        completed = agent.completed_tasks_count or 0
        if completed > 0:
            count_score = min(math.log10(completed + 1) * 50.0, 100.0)
        else:
            count_score = 0.0

        # Weighted total
        total = (
            cap_score * 0.40
            + sr_score * 0.30
            + avg_score * 0.20
            + count_score * 0.10
        )

        reasoning_parts: list[str] = []
        if cap_score > 0:
            reasoning_parts.append(f"capability={cap_score:.0f}")
        reasoning_parts.append(f"success_rate={sr_score:.0f}")
        reasoning_parts.append(f"avg_score={avg_score:.0f}")
        reasoning_parts.append(f"experience={count_score:.0f}")

        scored_agents.append({
            "agent_id": str(agent.id),
            "agent_name": agent.name,
            "agent_slug": agent.slug,
            "total_score": round(total, 2),
            "breakdown": {
                "capability_match": round(cap_score, 2),
                "success_rate": round(sr_score, 2),
                "average_score": round(avg_score, 2),
                "completed_tasks_count": round(count_score, 2),
            },
            "reasoning": f"Score {total:.1f}/100: {', '.join(reasoning_parts)}",
        })

    # Sort descending by total score
    scored_agents.sort(key=lambda a: a["total_score"], reverse=True)

    # Log decision
    await _log_mcp_decision(
        db,
        entity_type="task",
        entity_id=str(task_id),
        decision_type="matching",
        input_snapshot={
            "task_type": task_type,
            "task_title": task.title,
            "candidate_count": len(agents),
        },
        output_snapshot={
            "ranked_agents": scored_agents[:20],  # cap for storage
            "match_count": len(scored_agents),
        },
        reasoning=(
            f"Matched {len(scored_agents)} agent(s) for task_type='{task_type}'. "
            f"Top agent: {scored_agents[0]['agent_slug'] if scored_agents else 'none'} "
            f"(score={scored_agents[0]['total_score'] if scored_agents else 0})."
        ),
        confidence=0.75,
    )

    await _log_audit(
        db,
        action="task.agents_matched",
        entity_type="task",
        entity_id=str(task_id),
        payload={
            "match_count": len(scored_agents),
            "top_3": [a["agent_id"] for a in scored_agents[:3]],
        },
    )

    logger.info(
        "mcp.match_agents.complete",
        task_id=str(task_id),
        match_count=len(scored_agents),
    )
    return scored_agents


# ---------------------------------------------------------------------------
# (d) rank_bids
# ---------------------------------------------------------------------------


async def rank_bids(
    db: AsyncSession, task_id: UUID
) -> list[dict[str, Any]]:
    """Rank all submitted bids for a task and shortlist the top one.

    Scoring weights (normalised to 0-100):
    - **price_competitiveness**: 30 % (lower is better, relative to task budget)
    - **confidence_score**: 25 %
    - **agent_success_rate**: 25 %
    - **eta_hours**: 20 % (lower is better)

    Parameters
    ----------
    db : AsyncSession
    task_id : UUID

    Returns
    -------
    list[dict]
        Ranked bids with normalised scores.

    Raises
    ------
    ValueError
        If the task does not exist or has no bids.
    """
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise ValueError(f"Task {task_id} not found")

    bids_result = await db.execute(
        select(Bid).where(
            Bid.task_id == task_id,
            Bid.status == BidStatus.submitted,
        )
    )
    bids = list(bids_result.scalars().all())

    if not bids:
        logger.warning("mcp.rank_bids.no_bids", task_id=str(task_id))
        return []

    # Collect raw values for normalisation
    prices = [float(b.price) for b in bids]
    etas = [float(b.eta_hours) for b in bids]

    price_min, price_max = min(prices), max(prices)
    eta_min, eta_max = min(etas), max(etas)

    price_range = price_max - price_min if price_max != price_min else 1.0
    eta_range = eta_max - eta_min if eta_max != eta_min else 1.0

    ranked: list[dict[str, Any]] = []

    for bid in bids:
        # Ensure agent is loaded
        agent = bid.agent

        # --- price_competitiveness (0-100, lower price = higher score) ---
        price_norm = 100.0 - ((float(bid.price) - price_min) / price_range * 100.0)

        # --- confidence_score (0-100) ---
        confidence_norm = min(float(bid.confidence_score) * 100.0, 100.0)

        # --- agent_success_rate (0-100) ---
        agent_sr = 0.0
        if agent:
            agent_sr = (agent.success_rate or 0.0) * 100.0

        # --- eta_hours (0-100, lower eta = higher score) ---
        eta_norm = 100.0 - ((float(bid.eta_hours) - eta_min) / eta_range * 100.0)

        total = (
            price_norm * 0.30
            + confidence_norm * 0.25
            + agent_sr * 0.25
            + eta_norm * 0.20
        )

        ranked.append({
            "bid_id": str(bid.id),
            "agent_id": str(bid.agent_id),
            "agent_name": agent.name if agent else "unknown",
            "price": float(bid.price),
            "eta_hours": float(bid.eta_hours),
            "confidence_score": float(bid.confidence_score),
            "total_score": round(total, 2),
            "breakdown": {
                "price_competitiveness": round(price_norm, 2),
                "confidence_score": round(confidence_norm, 2),
                "agent_success_rate": round(agent_sr, 2),
                "eta_hours": round(eta_norm, 2),
            },
            "status": bid.status.value if hasattr(bid.status, "value") else str(bid.status),
        })

    # Sort by total score descending
    ranked.sort(key=lambda r: r["total_score"], reverse=True)

    # Mark top bid as shortlisted
    if ranked:
        top_bid_id = uuid.UUID(ranked[0]["bid_id"])
        top_bid_result = await db.execute(
            select(Bid).where(Bid.id == top_bid_id)
        )
        top_bid = top_bid_result.scalar_one_or_none()
        if top_bid:
            top_bid.status = BidStatus.shortlisted
            ranked[0]["status"] = "shortlisted"
            await db.flush()

    # Log decision
    await _log_mcp_decision(
        db,
        entity_type="task",
        entity_id=str(task_id),
        decision_type="ranking",
        input_snapshot={
            "task_id": str(task_id),
            "bid_count": len(bids),
            "price_range": {"min": price_min, "max": price_max},
            "eta_range": {"min": eta_min, "max": eta_max},
        },
        output_snapshot={
            "ranked_bids": ranked,
            "shortlisted_bid_id": ranked[0]["bid_id"] if ranked else None,
        },
        reasoning=(
            f"Ranked {len(bids)} bid(s). Top bid: agent={ranked[0]['agent_name']} "
            f"score={ranked[0]['total_score']:.1f}, price={ranked[0]['price']}, "
            f"eta={ranked[0]['eta_hours']}h."
            if ranked
            else "No bids to rank."
        ),
        confidence=0.80,
    )

    await _log_audit(
        db,
        action="task.bids_ranked",
        entity_type="task",
        entity_id=str(task_id),
        payload={
            "bid_count": len(bids),
            "shortlisted_bid_id": ranked[0]["bid_id"] if ranked else None,
        },
    )

    logger.info(
        "mcp.rank_bids.complete",
        task_id=str(task_id),
        bid_count=len(bids),
        top_score=ranked[0]["total_score"] if ranked else None,
    )
    return ranked


# ---------------------------------------------------------------------------
# (e) validate_submission
# ---------------------------------------------------------------------------


async def validate_submission(
    db: AsyncSession, submission_id: UUID
) -> dict[str, Any]:
    """Validate a task submission and create a ValidationReview record.

    Validation checks:
    1. Submission has ``output_json`` populated.
    2. Submission has a ``summary``.
    3. If the related task has an ``output_spec_json`` with ``required_fields``,
       check that each required field is present in ``output_json``.

    The verdict is one of: ``approved``, ``rejected``, ``rework_requested``.

    Parameters
    ----------
    db : AsyncSession
    submission_id : UUID

    Returns
    -------
    dict
        Validation result including verdict, issues, and the review record id.

    Raises
    ------
    ValueError
        If the submission does not exist.
    """
    result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        raise ValueError(f"Submission {submission_id} not found")

    task_result = await db.execute(
        select(Task).where(Task.id == submission.task_id)
    )
    task = task_result.scalar_one_or_none()

    issues: list[str] = []
    checklist: dict[str, bool] = {}

    # Check 1: output_json present
    has_output = bool(submission.output_json)
    checklist["has_output_json"] = has_output
    if not has_output:
        issues.append("Missing output_json: submission contains no output data")

    # Check 2: summary present
    has_summary = bool(submission.summary and submission.summary.strip())
    checklist["has_summary"] = has_summary
    if not has_summary:
        issues.append("Missing summary: submission has no summary text")

    # Check 3: output_spec field presence
    if task and task.output_spec_json and has_output:
        spec = task.output_spec_json
        required_fields = spec.get("required_fields", [])
        output_data = submission.output_json or {}

        for field in required_fields:
            field_present = field in output_data
            checklist[f"output_field:{field}"] = field_present
            if not field_present:
                issues.append(
                    f"Missing required output field: '{field}' not found in output_json"
                )

    # Determine verdict
    critical_missing = not has_output
    field_issues = [i for i in issues if i.startswith("Missing required output field")]

    if critical_missing:
        verdict = "rejected"
        score = 0.0
    elif len(issues) > 2 or (not has_summary and field_issues):
        verdict = "rework_requested"
        score = 30.0
    elif issues:
        verdict = "rework_requested"
        score = 50.0
    else:
        verdict = "approved"
        score = 95.0

    # Create ValidationReview record
    review = ValidationReview(
        task_id=submission.task_id,
        submission_id=submission.id,
        reviewer_type=ReviewerType.mcp,
        reviewer_user_id=None,
        decision=ReviewDecision(verdict),
        notes=(
            f"MCP automated validation. Issues: {'; '.join(issues)}"
            if issues
            else "MCP automated validation passed all checks."
        ),
        score=score,
    )
    db.add(review)

    # Update submission status
    status_map = {
        "approved": SubmissionStatus.approved,
        "rejected": SubmissionStatus.rejected,
        "rework_requested": SubmissionStatus.rework_requested,
    }
    submission.status = status_map[verdict]

    # Update task status if approved
    if task and verdict == "approved":
        task.status = TaskStatus.approved
    elif task and verdict == "rejected":
        task.status = TaskStatus.validation_failed

    await db.flush()

    validation_result = {
        "submission_id": str(submission.id),
        "task_id": str(submission.task_id),
        "verdict": verdict,
        "score": score,
        "issues": issues,
        "checklist": checklist,
        "review_id": str(review.id),
    }

    # Log decision
    await _log_mcp_decision(
        db,
        entity_type="submission",
        entity_id=str(submission_id),
        decision_type="validation",
        input_snapshot={
            "submission_id": str(submission_id),
            "task_id": str(submission.task_id),
            "has_output_json": has_output,
            "has_summary": has_summary,
            "output_fields": list((submission.output_json or {}).keys()),
            "required_fields": (
                task.output_spec_json.get("required_fields", [])
                if task and task.output_spec_json
                else []
            ),
        },
        output_snapshot=validation_result,
        reasoning=(
            f"Verdict: {verdict}. "
            f"{len(issues)} issue(s) found. "
            f"Score: {score}/100."
        ),
        confidence=0.85,
    )

    await _log_audit(
        db,
        action="submission.validated",
        entity_type="submission",
        entity_id=str(submission_id),
        payload={
            "verdict": verdict,
            "score": score,
            "review_id": str(review.id),
        },
    )

    logger.info(
        "mcp.validate_submission.complete",
        submission_id=str(submission_id),
        verdict=verdict,
        score=score,
        issue_count=len(issues),
    )
    return validation_result


# ---------------------------------------------------------------------------
# (f) generate_learning_note
# ---------------------------------------------------------------------------


async def generate_learning_note(
    db: AsyncSession,
    task_id: UUID,
    category: str,
    note: str,
) -> dict[str, Any]:
    """Create a FeedbackNote record for learning and improvement tracking.

    Parameters
    ----------
    db : AsyncSession
    task_id : UUID
        Task this note relates to.
    category : str
        Category of feedback (e.g. ``"quality"``, ``"speed"``).
    note : str
        The learning note text.

    Returns
    -------
    dict
        Created feedback note details.
    """
    feedback = FeedbackNote(
        task_id=task_id,
        category=category,
        note=note,
    )
    db.add(feedback)
    await db.flush()

    result = {
        "id": str(feedback.id),
        "task_id": str(task_id),
        "category": category,
        "note": note,
        "created_at": feedback.created_at.isoformat() if feedback.created_at else None,
    }

    await _log_audit(
        db,
        action="feedback_note.created",
        entity_type="feedback_note",
        entity_id=str(feedback.id),
        payload={
            "task_id": str(task_id),
            "category": category,
        },
    )

    logger.info(
        "mcp.learning_note.created",
        note_id=str(feedback.id),
        task_id=str(task_id),
        category=category,
    )
    return result
