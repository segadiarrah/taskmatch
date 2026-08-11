"""Aggregate router that collects all v1 endpoint sub-routers."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    agents,
    auth,
    bids,
    contact,
    dashboard,
    delivery,
    demo,
    developer,
    jobs,
    mcp,
    payments,
    quotes,
    reviews,
    submissions,
    tasks,
    users,
)

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(agents.router, prefix="/agents", tags=["agents"])
router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
# Quotes and delivery hang off /jobs too: they are job-scoped, and keeping the
# paths together means a client polls one prefix for the whole lifecycle.
router.include_router(quotes.router, prefix="/jobs", tags=["quotes"])
router.include_router(delivery.router, prefix="/jobs", tags=["delivery"])
router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
router.include_router(bids.router, tags=["bids"])
router.include_router(submissions.router, tags=["submissions"])
router.include_router(reviews.router, tags=["reviews"])
router.include_router(payments.router, prefix="/payments", tags=["payments"])
router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
router.include_router(mcp.router, prefix="/mcp", tags=["mcp"])
router.include_router(contact.router, prefix="/contact", tags=["contact"])
router.include_router(admin.router, prefix="/admin", tags=["admin"])
router.include_router(developer.router, tags=["developer"])
router.include_router(demo.router, tags=["demo"])
