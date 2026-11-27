"""Real transaction cleanup must finish before any HTTP response is emitted."""

from contextlib import asynccontextmanager
from typing import Any
from uuid import UUID, uuid4

import httpx
import pytest
from fastapi import Depends, FastAPI
from fastapi.routing import APIRoute
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import database
from app.main import app as application
from app.models import User
from app.models.audit import AuditLog
from test_lifecycle_integration import market  # noqa: F401


class ValidatedResponse(BaseModel):
    id: UUID
    value: int


class EncodedResponse(BaseModel):
    id: UUID
    value: Any


async def write_rows(db, identifier):
    db.add(User(
        id=identifier, email=f"boundary-{identifier.hex}@example.test",
        full_name="Transaction boundary test", role="client", hashed_password="unused",
    ))
    db.add(AuditLog(
        actor_type="test", actor_id=str(identifier), action="boundary_written",
        entity_type="user", entity_id=str(identifier),
    ))
    await db.flush()


async def send_request(app, events):
    async def boundary(scope, receive, send):
        async def observe(message):
            if message["type"] == "http.response.start":
                events.append(f"response:{message['status']}")
            await send(message)
        await app(scope, receive, observe)

    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=boundary, raise_app_exceptions=False),
        base_url="http://test",
    ) as client:
        return await client.post("/write")


async def assert_rolled_back(factory, identifier):
    async with factory() as db:
        assert await db.get(User, identifier) is None
        assert await db.scalar(select(AuditLog.id).where(
            AuditLog.entity_id == str(identifier), AuditLog.action == "boundary_written",
        )) is None


async def test_commit_failure_rolls_back_before_any_success_response(market, monkeypatch):
    events = []
    identifier = uuid4()

    @asynccontextmanager
    async def observed_factory():
        async with market.db() as db:
            rollback = db.rollback

            async def fail_commit():
                events.append("commit")
                raise RuntimeError("Injected commit failure")

            async def record_rollback():
                await rollback()
                events.append("rollback")

            monkeypatch.setattr(db, "commit", fail_commit)
            monkeypatch.setattr(db, "rollback", record_rollback)
            yield db

    monkeypatch.setattr(database, "async_session_factory", observed_factory)
    app = FastAPI()

    @app.post("/write", status_code=201, response_model=ValidatedResponse)
    async def write(db: AsyncSession = Depends(database.get_db, scope="function")):
        await write_rows(db, identifier)
        return {"id": identifier, "value": 1}

    response = await send_request(app, events)
    assert response.status_code == 500
    assert events == ["commit", "rollback", "response:500"]
    await assert_rolled_back(market.db, identifier)


@pytest.mark.parametrize("failure", ["validation", "serialization"])
async def test_invalid_response_rolls_back_before_commit_or_send(market, monkeypatch, failure):
    events = []
    identifier = uuid4()

    @asynccontextmanager
    async def observed_factory():
        async with market.db() as db:
            commit, rollback = db.commit, db.rollback

            async def record_commit():
                events.append("commit")
                await commit()

            async def record_rollback():
                await rollback()
                events.append("rollback")

            monkeypatch.setattr(db, "commit", record_commit)
            monkeypatch.setattr(db, "rollback", record_rollback)
            yield db

    monkeypatch.setattr(database, "async_session_factory", observed_factory)
    app = FastAPI()
    response_type = ValidatedResponse if failure == "validation" else EncodedResponse

    @app.post("/write", status_code=201, response_model=response_type)
    async def write(db: AsyncSession = Depends(database.get_db, scope="function")):
        await write_rows(db, identifier)
        return {"id": identifier, "value": "invalid integer" if failure == "validation" else object()}

    response = await send_request(app, events)
    assert response.status_code == 500
    assert events == ["rollback", "response:500"]
    await assert_rolled_back(market.db, identifier)


def test_every_application_database_dependency_ends_before_response():
    database_nodes = []
    visited_routers = set()

    def inspect_dependencies(dependant, path):
        if dependant.call is database.get_db:
            database_nodes.append((path, dependant.scope))
        for child in dependant.dependencies:
            inspect_dependencies(child, path)

    def inspect_routes(router):
        if id(router) in visited_routers:
            return
        visited_routers.add(id(router))
        for route in router.routes:
            if isinstance(route, APIRoute):
                inspect_dependencies(route.dependant, route.path)
            # FastAPI 0.141 keeps included routers nested instead of flattening them.
            included = getattr(route, "original_router", None)
            if included is not None:
                inspect_routes(included)
            elif hasattr(route, "routes"):
                inspect_routes(route)

    inspect_routes(application)
    assert database_nodes, "The guard must inspect the application's real dependency graph"
    assert {scope for _path, scope in database_nodes} == {"function"}, database_nodes
