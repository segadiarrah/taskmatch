"""Agent management endpoints."""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.middleware.audit import log_audit
from app.models.agent import Agent, AgentCapability, AgentStatus
from app.models.submission import Submission, SubmissionStatus
from app.models.user import User
from app.schemas.agent import (
    AgentCreate,
    AgentHeartbeat,
    AgentListResponse,
    AgentResponse,
    AgentUpdate,
)

router = APIRouter()


def _slugify(name: str) -> str:
    """Generate a URL-friendly slug from a name."""
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug


@router.post(
    "/register",
    response_model=AgentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new agent",
)
async def register_agent(
    body: AgentCreate,
    current_user: User = Depends(require_role("agent_developer")),
    db: AsyncSession = Depends(get_db),
) -> AgentResponse:
    """Register a new AI agent on the platform.

    The caller must have the ``agent_developer`` role.  A unique slug is
    generated from the agent name automatically.
    """
    base_slug = _slugify(body.name)
    slug = base_slug
    counter = 1
    while True:
        existing = await db.execute(select(Agent).where(Agent.slug == slug))
        if existing.scalar_one_or_none() is None:
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    agent = Agent(
        id=uuid.uuid4(),
        developer_user_id=current_user.id,
        name=body.name,
        slug=slug,
        description=body.description,
        endpoint_url=str(body.endpoint_url),
        auth_type=body.auth_type,
        supported_task_types=body.supported_task_types or [],
        status=AgentStatus.active,
    )
    db.add(agent)
    await db.flush()

    # Register initial capabilities if provided.
    if body.capabilities:
        for cap in body.capabilities:
            capability = AgentCapability(
                id=uuid.uuid4(),
                agent_id=agent.id,
                capability_name=cap.capability_name,
                version=cap.version,
                metadata_json=cap.metadata_json,
            )
            db.add(capability)
        await db.flush()

    await db.refresh(agent)

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="register_agent",
        entity_type="agent",
        entity_id=str(agent.id),
        payload={"name": body.name, "slug": slug},
    )

    return AgentResponse.model_validate(agent)


@router.get(
    "",
    response_model=AgentListResponse,
    summary="List all agents",
)
async def list_agents(
    status_filter: Optional[str] = Query(
        None, alias="status", description="Filter by agent status"
    ),
    capability: Optional[str] = Query(
        None, description="Filter by capability name"
    ),
    task_type: Optional[str] = Query(
        None, description="Filter by supported task type"
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> AgentListResponse:
    """Return a paginated list of agents with optional filters."""
    query = select(Agent)

    if status_filter:
        query = query.where(Agent.status == status_filter)

    if capability:
        query = query.join(Agent.capabilities).where(
            AgentCapability.capability_name == capability
        )

    if task_type:
        # supported_task_types is stored as JSON; use contains for PostgreSQL.
        query = query.where(
            Agent.supported_task_types.op("@>")(f'["{task_type}"]')
        )

    # Count total before pagination.
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Agent.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    agents = result.scalars().all()

    return AgentListResponse(
        agents=[AgentResponse.model_validate(a) for a in agents],
        total=total,
    )


@router.get(
    "/{agent_id}",
    response_model=AgentResponse,
    summary="Get agent detail with capabilities",
)
async def get_agent(
    agent_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> AgentResponse:
    """Return full details for a single agent, including its capabilities."""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )
    return AgentResponse.model_validate(agent)


@router.put(
    "/{agent_id}",
    response_model=AgentResponse,
    summary="Update agent",
)
async def update_agent(
    agent_id: uuid.UUID,
    body: AgentUpdate,
    current_user: User = Depends(require_role("agent_developer", "admin")),
    db: AsyncSession = Depends(get_db),
) -> AgentResponse:
    """Update an existing agent's metadata.

    Agent developers may update only their own agents.  Admins may update any
    agent.
    """
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    if (
        str(current_user.role) != "admin"
        and agent.developer_user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own agents",
        )

    update_data = body.model_dump(exclude_unset=True)
    if "endpoint_url" in update_data and update_data["endpoint_url"] is not None:
        update_data["endpoint_url"] = str(update_data["endpoint_url"])

    for field, value in update_data.items():
        setattr(agent, field, value)

    await db.flush()
    await db.refresh(agent)

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(current_user.id),
        action="update_agent",
        entity_type="agent",
        entity_id=str(agent.id),
        payload=update_data,
    )

    return AgentResponse.model_validate(agent)


@router.post(
    "/{agent_id}/heartbeat",
    response_model=AgentResponse,
    summary="Agent heartbeat",
)
async def agent_heartbeat(
    agent_id: uuid.UUID,
    body: AgentHeartbeat,
    current_user: User = Depends(require_role("agent_developer")),
    db: AsyncSession = Depends(get_db),
) -> AgentResponse:
    """Record a heartbeat from an agent, updating its status and timestamp."""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    if agent.developer_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only send heartbeats for your own agents",
        )

    agent.status = AgentStatus(body.status)
    agent.last_heartbeat_at = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(agent)

    return AgentResponse.model_validate(agent)


@router.get(
    "/{agent_id}/stats",
    summary="Agent performance stats",
)
async def get_agent_stats(
    agent_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return performance statistics for a specific agent."""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Count approved submissions for this agent.
    approved_count_result = await db.execute(
        select(func.count())
        .select_from(Submission)
        .where(
            Submission.agent_id == agent_id,
            Submission.status == SubmissionStatus.approved,
        )
    )
    approved_count = approved_count_result.scalar() or 0

    # Count total submissions for this agent.
    total_submissions_result = await db.execute(
        select(func.count())
        .select_from(Submission)
        .where(Submission.agent_id == agent_id)
    )
    total_submissions = total_submissions_result.scalar() or 0

    return {
        "agent_id": str(agent.id),
        "agent_name": agent.name,
        "status": str(agent.status),
        "completed_tasks_count": agent.completed_tasks_count,
        "average_score": agent.average_score,
        "success_rate": agent.success_rate,
        "total_submissions": total_submissions,
        "approved_submissions": approved_count,
        "last_heartbeat_at": (
            agent.last_heartbeat_at.isoformat() if agent.last_heartbeat_at else None
        ),
    }
