"""Opt-in directory. Only an executor's owner may publish or withdraw their card."""
import re
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import lazyload

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.middleware.audit import log_audit
from app.models.agent import Agent
from app.models.directory import DirectoryProfile
from app.models.user import User

router = APIRouter()
Kind = Literal["agent", "human"]
Language = Literal["en", "fr", "es", "pt", "zh"]
EXCLUDED_ORIGINS = ("test", "seed", "demo", "admin")


class PublicCopy(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, from_attributes=True)
    display_name: str = Field(min_length=2, max_length=96)
    summary: str = Field(min_length=5, max_length=480)
    expertise: str = Field(min_length=2, max_length=160)
    country: str | None = Field(default=None, pattern="^[A-Z]{2}$")
    language: Language | None = None

    @field_validator("display_name", "summary", "expertise")
    @classmethod
    def public_text(cls, value):
        if (not value.isprintable() or re.search(r"@|https?://|www\.|(?:\d[(). +\-]*){8}", value, re.I)):
            raise ValueError("Enter public profile text without contact details or links")
        return value


class PublicCard(PublicCopy):
    id: UUID
    kind: Kind


class DirectoryResults(BaseModel):
    items: list[PublicCard]
    has_more: bool


class OwnerCard(PublicCard):
    published: bool


def visible_cards():
    query = select(DirectoryProfile).join(Agent, Agent.id == DirectoryProfile.agent_id).join(
        User, User.id == Agent.developer_user_id).where(
            DirectoryProfile.published.is_(True), Agent.status == "active", User.is_active.is_(True),
            User.role != "admin", User.registration_origin.not_in(EXCLUDED_ORIGINS),
        )
    if not settings.HUMAN_TASKS_ENABLED:
        query = query.where(DirectoryProfile.kind == "agent")
    return query


async def owned_executor(db, agent_id, user, *, lock=False):
    query = select(Agent).options(lazyload("*")).where(Agent.id == agent_id, Agent.developer_user_id == user.id)
    if lock:
        query = query.with_for_update()
    agent = await db.scalar(query)
    if not agent or user.role == "admin" or user.registration_origin in EXCLUDED_ORIGINS or agent.slug.startswith("llm-"):
        raise HTTPException(404, "Executor not found")
    return agent


@router.get("", response_model=DirectoryResults)
async def directory(response: Response, kind: Kind | None = None,
                    q: str = Query("", max_length=80), country: str | None = Query(None, pattern=r"^[A-Z]{2}$"),
                    language: Language | None = None, offset: int = Query(0, ge=0),
                    db: AsyncSession = Depends(get_db, scope="function")):
    response.headers["Cache-Control"] = "no-store"
    query = visible_cards()
    if kind:
        query = query.where(DirectoryProfile.kind == kind)
    if country:
        query = query.where(DirectoryProfile.country == country)
    if language:
        query = query.where(DirectoryProfile.language == language)
    if q.strip():
        query = query.where(or_(*(column.icontains(q.strip(), autoescape=True) for column in
                                  (DirectoryProfile.display_name, DirectoryProfile.expertise, DirectoryProfile.summary))))
    cards = (await db.scalars(query.order_by(DirectoryProfile.display_name, DirectoryProfile.id).offset(offset).limit(25))).all()
    return {"items": cards[:24], "has_more": len(cards) > 24}


@router.get("/mine/{agent_id}", response_model=OwnerCard | None)
async def own_card(agent_id: UUID, user=Depends(get_current_active_user), db=Depends(get_db, scope="function")):
    await owned_executor(db, agent_id, user)
    return await db.scalar(select(DirectoryProfile).where(DirectoryProfile.agent_id == agent_id))


@router.put("/mine/{agent_id}", response_model=PublicCard)
async def publish(agent_id: UUID, data: PublicCopy, user=Depends(get_current_active_user), db=Depends(get_db, scope="function")):
    agent = await owned_executor(db, agent_id, user, lock=True)
    kind = "human" if "/experts/" in agent.endpoint_url else "agent"
    if agent.status != "active" or kind == "human" and not settings.HUMAN_TASKS_ENABLED:
        raise HTTPException(409, "This executor is unavailable for publication")
    card = await db.scalar(select(DirectoryProfile).where(DirectoryProfile.agent_id == agent_id))
    if not card:
        card = DirectoryProfile(agent_id=agent_id)
        db.add(card)
    for field, value in data.model_dump().items():
        setattr(card, field, value)
    card.kind = kind
    card.published = True
    await db.flush()
    await log_audit(db, actor_type="user", actor_id=str(user.id), action="directory.published",
                    entity_type="directory_profile", entity_id=str(card.id))
    return card


@router.delete("/mine/{agent_id}", status_code=204)
async def withdraw(agent_id: UUID, user=Depends(get_current_active_user), db=Depends(get_db, scope="function")):
    await owned_executor(db, agent_id, user, lock=True)
    card = await db.scalar(select(DirectoryProfile).where(DirectoryProfile.agent_id == agent_id))
    if card and card.published:
        card.published = False
        await log_audit(db, actor_type="user", actor_id=str(user.id), action="directory.withdrawn",
                        entity_type="directory_profile", entity_id=str(card.id))


@router.get("/{public_id}", response_model=PublicCard)
async def public_card(public_id: UUID, response: Response, db=Depends(get_db, scope="function")):
    response.headers["Cache-Control"] = "no-store"
    card = await db.scalar(visible_cards().where(DirectoryProfile.id == public_id))
    if not card:
        raise HTTPException(404, "Public profile not found", headers={"Cache-Control": "no-store"})
    return card
