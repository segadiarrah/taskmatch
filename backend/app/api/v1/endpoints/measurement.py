"""First-party, opt-in usage measurement and aggregate commercial reporting."""
import secrets
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.api.v1.endpoints.growth import admin, database, export, reporting_scope
from app.core.config import settings
from app.core.deps import get_current_active_user
from app.models.measurement import ReferralLink
from app.services import funnel, measurement

router = APIRouter()
Language = Literal["en", "fr", "zh", "es", "pt"]


class Consent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    allow: Literal[True]
    language: Language
    referral: str | None = Field(default=None, pattern=r"^[A-Za-z0-9_-]{22}$")


class ReferralVisit(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str = Field(pattern=r"^[A-Za-z0-9_-]{22}$")


@router.post("/measurement/referral", status_code=204)
async def referral_visit(body: ReferralVisit, request: Request, db=database):
    visitor = await measurement.lookup(db, request, lock=True)
    if not visitor:
        raise HTTPException(403, "Measurement consent required")
    if not visitor.account_id and not visitor.referred_by:
        visitor.referred_by = await measurement.referrer(db, body.code)


class PublicEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: Literal["landing_page_view", "cta_clicked", "registration_started"]
    language: Language


class AccountEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: Literal["onboarding_started", "activity"]


@router.post("/measurement/consent", status_code=201)
async def consent(body: Consent, request: Request, response: Response, db=database):
    visitor = await measurement.lookup(db, request, lock=True)
    if visitor:
        if body.referral and not visitor.account_id and not visitor.referred_by:
            visitor.referred_by = await measurement.referrer(db, body.referral)
    else:
        token = await measurement.issue(db, body.language, body.referral)
        response.set_cookie(measurement.COOKIE, token, max_age=measurement.DAYS * 86400,
                            httponly=True, secure=settings.ENV == "production", samesite="strict", path="/api/v1")
    response.headers["Cache-Control"] = "no-store"
    return {"allowed": True}


@router.delete("/measurement/consent", status_code=204)
async def revoke(request: Request, response: Response, db=database):
    visitor = await measurement.lookup(db, request, lock=True)
    if visitor:
        await db.delete(visitor)
    response.delete_cookie(measurement.COOKIE, path="/api/v1", httponly=True,
                           secure=settings.ENV == "production", samesite="strict")


@router.post("/measurement/events", status_code=204)
async def observe(body: PublicEvent, request: Request, db=database):
    visitor = await measurement.lookup(db, request, lock=True)
    if not visitor:
        raise HTTPException(403, "Measurement consent required")
    await measurement.event(db, visitor, body.kind)


@router.post("/measurement/activity", status_code=204)
async def activity(body: AccountEvent, request: Request, user=Depends(get_current_active_user), db=database):
    visitor = await measurement.lookup(db, request, lock=True)
    if not visitor:
        raise HTTPException(403, "Measurement consent required")
    if visitor.account_id == user.id:
        await measurement.event(db, visitor, body.kind)


async def public_referrer(user=Depends(get_current_active_user)):
    if user.role == "admin" or user.registration_origin != "public":
        raise HTTPException(403, "A public customer or developer account is required")
    return user


@router.get("/referrals/me")
async def referral_dashboard(response: Response, user=Depends(public_referrer), db=database):
    response.headers["Cache-Control"] = "private, no-store"
    code = await db.scalar(select(ReferralLink.code).where(ReferralLink.user_id == user.id))
    return {"path": "/?ref=" + code if code else None, "stats": await funnel.referral_stats(db, user.id)}


@router.post("/referrals/me")
async def my_referral(user=Depends(public_referrer), db=database):
    await db.execute(insert(ReferralLink).values(user_id=user.id, code=secrets.token_urlsafe(16))
                     .on_conflict_do_nothing(index_elements=["user_id"]))
    code = await db.scalar(select(ReferralLink.code).where(ReferralLink.user_id == user.id))
    return {"code": code, "path": "/?ref=" + code}


@router.get("/growth/funnel", dependencies=[Depends(reporting_scope("growth:read"))])
@router.get("/admin/growth/funnel", dependencies=[admin])
async def report(days: int = Query(7, ge=1, le=366), language: Language | None = None,
                 country: str | None = Query(None, pattern=r"^[A-Z]{2}$"),
                 role: Literal["client", "agent_developer"] | None = None,
                 intent: Literal["project", "mission", "work", "executor", "agent"] | None = None,
                 source: str | None = Query(None, max_length=100),
                 campaign: str | None = Query(None, max_length=100),
                 output: Literal["csv", "json"] = "json", db=database):
    data = await funnel.report(db, days, language=language, country=country, role=role,
                               intent=intent, source=source, campaign=campaign)
    if output == "json":
        return data
    rows = [{"metric":key,"count":value,"denominator":None,"rate":None} for key,value in data["events"].items()]
    rows += [{"metric":key,"count":v["returned"],"denominator":v["eligible"],"rate":v["rate"]} for key,v in data["retention"].items()]
    rows += [{"metric":key+"_rate","count":v["numerator"],"denominator":v["denominator"],"rate":v["rate"]} for key,v in data["rates"].items()]
    rows += [{"metric":key,"count":value,"denominator":None,"rate":None} for key,value in data["money"].items() if key!="currency"]
    return export(rows, output)
