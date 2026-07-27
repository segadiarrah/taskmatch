"""Smoke test: the ASGI app boots and the health endpoint responds (no DB)."""

from __future__ import annotations

import httpx
import pytest

from app.main import app


@pytest.mark.asyncio
async def test_health_ok():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "healthy"
    assert body["app"] == "TaskMatch.ai"
