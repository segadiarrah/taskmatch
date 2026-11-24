"""Aggregate reporting for commercial agents and administrators."""
import csv
import hashlib
import io
import secrets
from datetime import UTC, datetime, timedelta
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.middleware.audit import log_audit
from app.models.agent import Agent
from app.models.growth import GrowthCredential
from app.models.human import WorkerProfile
from app.models.job import Job
from app.models.user import User

router = APIRouter()
bearer = HTTPBearer(auto_error=False)
database = Depends(get_db, scope="function")
admin = Depends(require_role("admin"))


class CredentialRequest(BaseModel):
    label: str = Field(min_length=1, max_length=80)
    days: int = Field(default=30, ge=1, le=90)
    scope: Literal["growth:read", "campaigns:read", "communications:send"]


async def audit(db, actor_id, action, credential):
    await log_audit(db, actor_type="user", actor_id=str(actor_id), action=action,
                    entity_type="growth_credential", entity_id=str(credential.id),
                    payload={"scope": credential.scope})


@router.post("/admin/growth/credentials", status_code=201)
async def issue(body: CredentialRequest, response: Response, user: User = admin, db: AsyncSession = database):
    secret = "tmg_" + secrets.token_urlsafe(32)
    row = GrowthCredential(label=body.label, digest=hashlib.sha256(secret.encode()).hexdigest(),
                           scope=body.scope, expires_at=datetime.now(UTC) + timedelta(days=body.days))
    db.add(row)
    await db.flush()
    await audit(db, user.id, "issue_growth_credential", row)
    response.headers["Cache-Control"] = "no-store"
    return {"id": row.id, "token": secret, "scope": row.scope, "expires_at": row.expires_at}


@router.get("/admin/growth/credentials", dependencies=[admin])
async def list_credentials(db: AsyncSession = database):
    rows = (await db.execute(select(GrowthCredential.id, GrowthCredential.label, GrowthCredential.scope,
        GrowthCredential.created_at, GrowthCredential.expires_at, GrowthCredential.revoked_at)
        .order_by(GrowthCredential.created_at.desc()))).mappings()
    return [dict(row) for row in rows]


@router.delete("/admin/growth/credentials/{credential_id}", status_code=204)
async def revoke(credential_id: UUID, user: User = admin, db: AsyncSession = database):
    row = await db.get(GrowthCredential, credential_id, with_for_update=True)
    if not row:
        raise HTTPException(404, "Credential not found")
    if row.revoked_at is None:
        row.revoked_at = datetime.now(UTC)
        await audit(db, user.id, "revoke_growth_credential", row)


def reporting_scope(required: str):
    async def authorize(auth: HTTPAuthorizationCredentials | None = Depends(bearer), db: AsyncSession = database):
        if not auth or not auth.credentials.startswith("tmg_") or len(auth.credentials) > 100:
            raise HTTPException(401, "Commercial reporting credential required")
        digest = hashlib.sha256(auth.credentials.encode()).hexdigest()
        row = await db.scalar(select(GrowthCredential).where(
            GrowthCredential.digest == digest, GrowthCredential.revoked_at.is_(None),
            GrowthCredential.expires_at > datetime.now(UTC)))
        if row is None:
            raise HTTPException(401, "Invalid reporting credential")
        if row.scope != required:
            raise HTTPException(403, "Insufficient reporting scope")
        return row.id
    return authorize


def window(days):
    end = datetime.now(UTC)
    return end - timedelta(days=days), end


def export(rows, output):
    if output == "json":
        return rows
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(rows[0].keys() if rows else ("campaign", "registrations"))
    for row in rows:
        # Filter spreadsheet formulas in user-supplied campaign labels.
        writer.writerow("'" + v if isinstance(v, str) and v.lstrip().startswith(("=", "+", "-", "@")) else v
                        for v in row.values())
    return Response(buffer.getvalue(), media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=taskmatch-growth.csv", "Cache-Control": "no-store"})


@router.get("/growth/summary", dependencies=[Depends(reporting_scope("growth:read"))])
@router.get("/admin/growth/summary", dependencies=[admin])
async def summary(days: int = Query(7, ge=1, le=366), output: Literal["csv", "json"] = "json",
                  db: AsyncSession = database):
    start, end = window(days)
    eligible = select(User.id).where(User.registration_origin == "public", User.role != "admin")
    async def count(model, time, *conditions):
        return await db.scalar(select(func.count()).select_from(model).where(time >= start, time < end, *conditions))
    rows = [{
        "start_utc": start.isoformat(), "end_utc": end.isoformat(),
        "public_registrations": await count(User, User.created_at, User.id.in_(eligible)),
        "projects_created": await count(Job, Job.created_at, Job.client_user_id.in_(eligible)),
        "human_profiles_created": await count(WorkerProfile, WorkerProfile.created_at, WorkerProfile.user_id.in_(eligible)),
        "ai_agents_registered": await count(Agent, Agent.created_at, Agent.developer_user_id.in_(eligible),
                                           ~Agent.endpoint_url.contains("/experts/")),
    }]
    return export(rows, output)


@router.get("/growth/campaigns", dependencies=[Depends(reporting_scope("campaigns:read"))])
@router.get("/admin/growth/campaigns", dependencies=[admin])
async def campaigns(days: int = Query(7, ge=1, le=366), output: Literal["csv", "json"] = "json",
                    db: AsyncSession = database):
    start, end = window(days)
    campaign = User.registration_attribution["utm_campaign"].astext
    counts = await db.execute(select(campaign, func.count()).where(
        User.registration_origin == "public", User.role != "admin", User.created_at >= start,
        User.created_at < end).group_by(campaign).order_by(campaign))
    return export([{"campaign": label or "(unattributed)", "registrations": total} for label, total in counts], output)


@router.get("/growth/status", dependencies=[Depends(reporting_scope("growth:read"))])
async def service_status(db: AsyncSession = database):
    from app.main import readiness_check
    return await readiness_check(db)
