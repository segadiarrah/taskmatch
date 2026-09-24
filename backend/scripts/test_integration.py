"""Create/reuse a dedicated database and execute all backend tests safely.

Usage: docker compose exec -T backend python -m scripts.test_integration
Only the database named taskmatch_integration_test is recreated by fixtures.
"""

import asyncio
import os
import subprocess
import sys

import asyncpg
from sqlalchemy.engine import make_url

from app.core.config import settings

DATABASE_NAME = "taskmatch_integration_test"


async def main() -> int:
    current = make_url(settings.DATABASE_URL)
    if current.database == DATABASE_NAME:
        raise RuntimeError("The application itself must not use the test database")
    admin_url = current.set(drivername="postgresql", database="postgres")
    connection = await asyncpg.connect(admin_url.render_as_string(hide_password=False))
    try:
        exists = await connection.fetchval("SELECT 1 FROM pg_database WHERE datname=$1", DATABASE_NAME)
        if not exists:
            await connection.execute(f'CREATE DATABASE "{DATABASE_NAME}"')
    finally:
        await connection.close()
    test_url = current.set(database=DATABASE_NAME).render_as_string(hide_password=False)
    env = {**os.environ, "TEST_DATABASE_URL": test_url, "LLM_ENABLED": "false", "ENV": "development"}
    return subprocess.call([sys.executable, "-m", "pytest", "tests", "-q", "-p", "no:cacheprovider"], env=env)


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
