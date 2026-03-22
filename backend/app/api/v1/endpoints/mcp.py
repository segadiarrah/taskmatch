"""MCP (Model Context Protocol) orchestration endpoints.

These endpoints trigger AI-powered operations for job processing, task
decomposition, agent matching, bid ranking, and submission validation.
In the MVP, stub implementations are provided that record MCP decisions
and update entity states.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.middleware.audit import log_audit
from app.models.agent import Agent, AgentCapability, AgentStatus
from app.models.audit import MCPDecision
from app.models.bid import Bid, BidStatus
from app.models.job import Job, JobStatus
from app.models.submission import Submission
from app.models.task import Task, TaskStatus
from app.models.user import User

router = APIRouter()


@router.post(
    "/format-job/{job_id}",
    summary="Trigger MCP job formatting",
)
async def format_job(
    job_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Trigger LLM-powered formatting of a job's raw description.

    Generates a structured summary and updates the job status to ``formatted``.
    In production, this calls the MCP/LLM layer; in the MVP it produces a
    placeholder summary.
    """
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    if job.status not in (JobStatus.submitted, JobStatus.draft):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job is in '{job.status}' status; must be 'submitted' or 'draft' to format",
        )

    # MVP stub: generate a formatted summary from the raw description.
    formatted_summary = (
        f"[MCP Formatted]\n\n"
        f"Title: {job.title}\n\n"
        f"Summary: {job.raw_description[:500]}\n\n"
        f"Budget Range: {job.currency} {job.budget_min} - {job.budget_max}"
    )

    job.formatted_summary = formatted_summary
    job.status = JobStatus.formatted

    # Record the MCP decision.
    decision = MCPDecision(
        id=uuid.uuid4(),
        decision_type="format_job",
        related_resource_type="job",
        related_resource_id=str(job.id),
        input_data={"raw_description": job.raw_description[:1000]},
        output_data={"formatted_summary": formatted_summary},
        reasoning="MVP stub: formatted raw description into structured summary.",
    )
    db.add(decision)
    await db.flush()

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="mcp_format_job",
        entity_type="job",
        entity_id=str(job.id),
    )

    return {
        "job_id": str(job.id),
        "status": str(job.status),
        "formatted_summary": formatted_summary,
        "mcp_decision_id": str(decision.id),
    }


@router.post(
    "/decompose-job/{job_id}",
    summary="Trigger MCP job decomposition",
)
async def decompose_job(
    job_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Decompose a formatted job into granular tasks.

    In production, the MCP/LLM layer analyses the job description and creates
    multiple tasks.  The MVP stub creates a single task from the job.
    """
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    if job.status not in (JobStatus.formatted, JobStatus.submitted):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job must be 'formatted' or 'submitted' to decompose; current status is '{job.status}'",
        )

    # MVP stub: create a single task from the job.
    task = Task(
        id=uuid.uuid4(),
        job_id=job.id,
        title=f"Task: {job.title}",
        description=job.formatted_summary or job.raw_description,
        task_type="general",
        budget=job.budget_max,
        priority=1,
        status=TaskStatus.open_for_bids,
    )
    db.add(task)

    job.status = JobStatus.decomposed

    # Record MCP decision.
    decision = MCPDecision(
        id=uuid.uuid4(),
        decision_type="decompose_job",
        related_resource_type="job",
        related_resource_id=str(job.id),
        input_data={"job_title": job.title},
        output_data={"task_ids": [str(task.id)]},
        reasoning="MVP stub: created a single task from the job.",
    )
    db.add(decision)
    await db.flush()

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="mcp_decompose_job",
        entity_type="job",
        entity_id=str(job.id),
        payload={"task_ids": [str(task.id)]},
    )

    return {
        "job_id": str(job.id),
        "status": str(job.status),
        "tasks_created": 1,
        "task_ids": [str(task.id)],
        "mcp_decision_id": str(decision.id),
    }


@router.post(
    "/match-agents/{task_id}",
    summary="Trigger MCP agent matching",
)
async def match_agents(
    task_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Find and rank agents suitable for a given task.

    Uses capability matching and historical performance to rank agents.
    """
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    # Fetch active agents.
    agents_result = await db.execute(
        select(Agent).where(Agent.status == AgentStatus.active)
    )
    agents = agents_result.scalars().all()

    ranked = []
    for agent in agents:
        task_types = agent.supported_task_types or []
        cap_score = 1.0 if task.task_type in task_types else 0.0

        # Check capabilities.
        cap_names = [c.capability_name.lower() for c in (agent.capabilities or [])]
        if task.task_type.lower() in cap_names:
            cap_score = max(cap_score, 0.8)

        hist_score = min(agent.success_rate, 1.0) if agent.success_rate else 0.0
        combined = round(0.6 * cap_score + 0.4 * hist_score, 3)

        ranked.append({
            "agent_id": str(agent.id),
            "agent_name": agent.name,
            "capability_score": cap_score,
            "historical_score": hist_score,
            "combined_score": combined,
        })

    ranked.sort(key=lambda x: x["combined_score"], reverse=True)

    # Record MCP decision.
    decision = MCPDecision(
        id=uuid.uuid4(),
        decision_type="match_agents",
        related_resource_type="task",
        related_resource_id=str(task.id),
        input_data={"task_type": task.task_type},
        output_data={"ranked_agents": ranked[:10]},
        reasoning="Scored agents by capability overlap and historical performance.",
    )
    db.add(decision)
    await db.flush()

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="mcp_match_agents",
        entity_type="task",
        entity_id=str(task.id),
    )

    return {
        "task_id": str(task.id),
        "ranked_agents": ranked[:10],
        "total_candidates": len(ranked),
        "mcp_decision_id": str(decision.id),
    }


@router.post(
    "/rank-bids/{task_id}",
    summary="Trigger MCP bid ranking",
)
async def rank_bids(
    task_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Rank submitted bids for a task using MCP scoring.

    Considers price, estimated time, agent confidence, and historical
    performance to produce a ranked recommendation.
    """
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    # Fetch active bids for this task.
    bids_result = await db.execute(
        select(Bid).where(
            Bid.task_id == task_id,
            Bid.status.in_([BidStatus.submitted.value, BidStatus.shortlisted.value]),
        )
    )
    bids = bids_result.scalars().all()

    if not bids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active bids found for this task",
        )

    ranked_bids = []
    for bid in bids:
        # Composite score: weight confidence, inverse price, and agent performance.
        agent = bid.agent
        confidence_weight = bid.confidence_score * 0.3
        price_weight = (1.0 / max(float(bid.price), 0.01)) * 0.3  # Lower price = better
        agent_score = (agent.success_rate if agent and agent.success_rate else 0.0) * 0.4

        # Normalize price weight.
        composite = round(confidence_weight + min(price_weight, 0.3) + agent_score, 3)

        ranked_bids.append({
            "bid_id": str(bid.id),
            "agent_id": str(bid.agent_id),
            "agent_name": agent.name if agent else "Unknown",
            "price": float(bid.price),
            "eta_hours": float(bid.eta_hours),
            "confidence_score": float(bid.confidence_score),
            "composite_score": composite,
        })

    ranked_bids.sort(key=lambda x: x["composite_score"], reverse=True)

    # Record MCP decision.
    decision = MCPDecision(
        id=uuid.uuid4(),
        decision_type="rank_bids",
        related_resource_type="task",
        related_resource_id=str(task.id),
        input_data={"bid_count": len(bids)},
        output_data={"ranked_bids": ranked_bids},
        reasoning="Ranked bids by composite score (confidence, price, agent performance).",
    )
    db.add(decision)
    await db.flush()

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="mcp_rank_bids",
        entity_type="task",
        entity_id=str(task.id),
        payload={"bid_count": len(bids)},
    )

    return {
        "task_id": str(task.id),
        "ranked_bids": ranked_bids,
        "mcp_decision_id": str(decision.id),
    }


@router.post(
    "/validate-submission/{submission_id}",
    summary="Trigger MCP submission validation",
)
async def validate_submission(
    submission_id: uuid.UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Trigger LLM-powered automated validation of a submission.

    The MVP stub performs basic structural checks and records the decision.
    In production, this would invoke the full MCP validation pipeline.
    """
    sub_result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = sub_result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )

    # Fetch the associated task for validation spec.
    task_result = await db.execute(select(Task).where(Task.id == submission.task_id))
    task = task_result.scalar_one_or_none()

    # MVP stub: basic validation.
    output = submission.output_json or {}
    has_content = bool(output)
    has_summary = bool(submission.summary)

    if has_content:
        decision_val = "approved"
        confidence = 0.85
        notes = "MVP auto-validation: submission contains output data."
    else:
        decision_val = "rejected"
        confidence = 0.70
        notes = "MVP auto-validation: submission output is empty."

    # Record MCP decision.
    decision = MCPDecision(
        id=uuid.uuid4(),
        decision_type="validate_submission",
        related_resource_type="submission",
        related_resource_id=str(submission.id),
        input_data={
            "has_content": has_content,
            "has_summary": has_summary,
            "task_id": str(submission.task_id),
        },
        output_data={
            "decision": decision_val,
            "confidence": confidence,
            "notes": notes,
        },
        reasoning=notes,
    )
    db.add(decision)
    await db.flush()

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="mcp_validate_submission",
        entity_type="submission",
        entity_id=str(submission.id),
        payload={"decision": decision_val, "confidence": confidence},
    )

    return {
        "submission_id": str(submission.id),
        "task_id": str(submission.task_id),
        "decision": decision_val,
        "confidence": confidence,
        "notes": notes,
        "mcp_decision_id": str(decision.id),
    }
