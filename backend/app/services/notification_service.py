"""Agent notification service.

Responsible for notifying agents about new tasks, assignments, and other
events.  For the MVP this logs notifications and would POST to agent
endpoints in production.
"""

from __future__ import annotations

from uuid import UUID

import httpx
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.assignment import Assignment
from app.models.audit import AuditLog
from app.models.task import Task

logger: structlog.stdlib.BoundLogger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_HTTP_TIMEOUT_SECONDS = 10.0
_MAX_RETRIES = 2


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _log_audit(
    db: AsyncSession,
    *,
    action: str,
    entity_type: str,
    entity_id: str,
    payload: dict | None = None,
) -> AuditLog:
    """Write an audit log entry for a notification action."""
    entry = AuditLog(
        actor_type="system",
        actor_id="notification-service",
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        payload_json=payload,
    )
    db.add(entry)
    await db.flush()
    return entry


async def _post_to_agent(
    endpoint_url: str,
    payload: dict,
    *,
    auth_type: str = "none",
    auth_credentials: str | None = None,
) -> dict:
    """POST a JSON payload to an agent's endpoint.

    Returns a dict with ``success``, ``status_code``, and ``body`` keys.
    On failure, ``success`` is ``False`` and ``error`` contains the reason.
    """
    headers: dict[str, str] = {"Content-Type": "application/json"}

    if auth_type == "bearer" and auth_credentials:
        headers["Authorization"] = f"Bearer {auth_credentials}"
    elif auth_type == "api_key" and auth_credentials:
        headers["X-API-Key"] = auth_credentials

    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT_SECONDS) as client:
            response = await client.post(
                endpoint_url,
                json=payload,
                headers=headers,
            )
            return {
                "success": 200 <= response.status_code < 300,
                "status_code": response.status_code,
                "body": response.text[:2000],
            }
    except httpx.TimeoutException:
        logger.warning(
            "notification.timeout",
            endpoint_url=endpoint_url,
        )
        return {
            "success": False,
            "status_code": None,
            "error": "Request timed out",
        }
    except httpx.HTTPError as exc:
        logger.warning(
            "notification.http_error",
            endpoint_url=endpoint_url,
            error=str(exc),
        )
        return {
            "success": False,
            "status_code": None,
            "error": str(exc),
        }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def notify_agents_of_task(
    db: AsyncSession,
    task_id: UUID,
    agent_ids: list[UUID],
) -> list[dict]:
    """Notify a list of agents about a new task available for bidding.

    For MVP this logs the notification.  In production it would POST to
    each agent's registered endpoint with task details.

    Parameters
    ----------
    db : AsyncSession
        Active database session.
    task_id : UUID
        The task agents should be notified about.
    agent_ids : list[UUID]
        IDs of agents to notify.

    Returns
    -------
    list[dict]
        Notification results per agent (agent_id, notified, channel, error).
    """
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if task is None:
        raise ValueError(f"Task {task_id} not found")

    results: list[dict] = []

    for agent_id in agent_ids:
        agent_result = await db.execute(select(Agent).where(Agent.id == agent_id))
        agent = agent_result.scalar_one_or_none()

        if agent is None:
            results.append({
                "agent_id": str(agent_id),
                "notified": False,
                "channel": None,
                "error": "Agent not found",
            })
            continue

        notification_payload = {
            "event": "task_available",
            "task_id": str(task_id),
            "task_title": task.title,
            "task_type": task.task_type,
            "task_description": task.description[:500],
            "budget": float(task.budget) if task.budget else None,
            "priority": task.priority,
        }

        # MVP: log the notification rather than making real HTTP calls
        logger.info(
            "notification.agent_task_available",
            agent_id=str(agent_id),
            agent_slug=agent.slug,
            task_id=str(task_id),
            endpoint_url=agent.endpoint_url,
        )

        # In production, uncomment the following block:
        # post_result = await _post_to_agent(
        #     agent.endpoint_url,
        #     notification_payload,
        #     auth_type=agent.auth_type.value if hasattr(agent.auth_type, 'value') else str(agent.auth_type),
        #     auth_credentials=agent.auth_credentials_encrypted,
        # )

        results.append({
            "agent_id": str(agent_id),
            "agent_slug": agent.slug,
            "notified": True,
            "channel": "log",  # Would be "http" in production
            "endpoint_url": agent.endpoint_url,
        })

    # Audit log
    await _log_audit(
        db,
        action="task.agents_notified",
        entity_type="task",
        entity_id=str(task_id),
        payload={
            "agent_count": len(agent_ids),
            "notified_count": sum(1 for r in results if r.get("notified")),
            "agent_ids": [str(aid) for aid in agent_ids],
        },
    )

    logger.info(
        "notification.agents_notified",
        task_id=str(task_id),
        total=len(agent_ids),
        notified=sum(1 for r in results if r.get("notified")),
    )
    return results


async def notify_assignment(
    db: AsyncSession,
    assignment_id: UUID,
) -> dict:
    """Notify an agent that they have been assigned to a task.

    For MVP this logs the assignment notification.  In production it would
    POST to the agent's endpoint with full assignment details.

    Parameters
    ----------
    db : AsyncSession
    assignment_id : UUID

    Returns
    -------
    dict
        Notification result with keys: assignment_id, agent_id, notified,
        channel, error (if any).

    Raises
    ------
    ValueError
        If the assignment does not exist.
    """
    result = await db.execute(
        select(Assignment).where(Assignment.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()
    if assignment is None:
        raise ValueError(f"Assignment {assignment_id} not found")

    # Load related task and agent
    task_result = await db.execute(
        select(Task).where(Task.id == assignment.task_id)
    )
    task = task_result.scalar_one_or_none()

    agent_result = await db.execute(
        select(Agent).where(Agent.id == assignment.agent_id)
    )
    agent = agent_result.scalar_one_or_none()

    if agent is None:
        raise ValueError(
            f"Agent {assignment.agent_id} not found for assignment {assignment_id}"
        )

    notification_payload = {
        "event": "task_assigned",
        "assignment_id": str(assignment_id),
        "task_id": str(assignment.task_id),
        "task_title": task.title if task else "Unknown",
        "task_description": (task.description[:500] if task else ""),
        "task_type": task.task_type if task else "unknown",
        "input_spec": task.input_spec_json if task else None,
        "output_spec": task.output_spec_json if task else None,
        "due_at": assignment.due_at.isoformat() if assignment.due_at else None,
        "budget": float(task.budget) if task and task.budget else None,
    }

    # MVP: log instead of real HTTP call
    logger.info(
        "notification.assignment",
        assignment_id=str(assignment_id),
        agent_id=str(agent.id),
        agent_slug=agent.slug,
        task_id=str(assignment.task_id),
        endpoint_url=agent.endpoint_url,
    )

    # In production, uncomment:
    # post_result = await _post_to_agent(
    #     agent.endpoint_url,
    #     notification_payload,
    #     auth_type=agent.auth_type.value if hasattr(agent.auth_type, 'value') else str(agent.auth_type),
    #     auth_credentials=agent.auth_credentials_encrypted,
    # )

    notification_result = {
        "assignment_id": str(assignment_id),
        "agent_id": str(agent.id),
        "agent_slug": agent.slug,
        "notified": True,
        "channel": "log",  # Would be "http" in production
        "endpoint_url": agent.endpoint_url,
    }

    # Audit log
    await _log_audit(
        db,
        action="assignment.agent_notified",
        entity_type="assignment",
        entity_id=str(assignment_id),
        payload={
            "agent_id": str(agent.id),
            "task_id": str(assignment.task_id),
        },
    )

    logger.info(
        "notification.assignment_sent",
        assignment_id=str(assignment_id),
        agent_slug=agent.slug,
    )
    return notification_result
