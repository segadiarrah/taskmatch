"""Lightweight audit-logging utility.

Records who did what to which entity, persisted in the ``audit_logs`` table.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog


async def log_audit(
    db: AsyncSession,
    *,
    actor_type: str,
    actor_id: str,
    action: str,
    entity_type: str,
    entity_id: str,
    payload: dict[str, Any] | None = None,
) -> AuditLog:
    """Persist an audit record and flush it to the database."""
    entry = AuditLog(
        actor_type=actor_type,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        payload_json=payload,
    )
    db.add(entry)
    await db.flush()
    return entry
