"""Operational configuration must work with internal probes and real failures."""

import os
import subprocess
import sys

import pytest
import httpx
from unittest.mock import AsyncMock

from app.core.database import get_db
from app.main import app


def test_production_accepts_internal_health_probes():
    code = """
import asyncio, httpx
from app.main import app
async def main():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://localhost:8000') as client:
        response = await client.get('/health')
        assert response.status_code == 200, response.text
        response = await client.get('/health', headers={'Host':'untrusted.example'})
        assert response.status_code == 400
asyncio.run(main())
"""
    result = subprocess.run([sys.executable, "-c", code], env={**os.environ, "ENV": "production", "SECRET_KEY": "test-only-secret-with-at-least-thirty-two-characters"}, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr


@pytest.mark.asyncio
async def test_readiness_reports_database_failure():
    db = AsyncMock()
    db.execute.side_effect = ConnectionError("database unavailable")
    async def unavailable_db():
        yield db
    app.dependency_overrides[get_db] = unavailable_db
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/health/ready")
        assert response.status_code == 503
        assert response.json()["status"] == "unavailable"
        assert "database unavailable" not in response.text
        db.rollback.assert_awaited_once()
    finally:
        app.dependency_overrides.pop(get_db, None)
