"""Run pytest on a named disposable PostgreSQL database without touching app data."""

import argparse
import asyncio
import os
import subprocess
import sys

import asyncpg
from sqlalchemy.engine import make_url

from app.core.config import settings


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--database", required=True)
    args, tests = parser.parse_known_args()
    if not args.database.endswith("_test") or not args.database.replace("_", "").isalnum():
        raise SystemExit("A dedicated *_test database is required")
    url = make_url(settings.DATABASE_URL)
    if url.database == args.database:
        raise SystemExit("Refusing to use the application database")
    connection = await asyncpg.connect(
        url.set(drivername="postgresql", database="postgres").render_as_string(hide_password=False)
    )
    try:
        if not await connection.fetchval(
            "SELECT 1 FROM pg_database WHERE datname=$1", args.database
        ):
            await connection.execute(f'CREATE DATABASE "{args.database}"')
    finally:
        await connection.close()
    env = {
        **os.environ,
        "TEST_DATABASE_URL": url.set(database=args.database).render_as_string(hide_password=False),
        "DATABASE_URL": url.set(database=args.database).render_as_string(hide_password=False),
        "ENV": "development",
        "LLM_ENABLED": "false",
        "STRIPE_MODE": "test",
        "STRIPE_SECRET_KEY": "sk_test_local_unit_tests",
        "STRIPE_WEBHOOK_SECRET": "whsec_local_unit_tests",
        "STRIPE_CONNECT_WEBHOOK_SECRET": "whsec_local_connect_tests",
        "BILLING_SITE_URL": "https://taskmatch.ai",
    }
    return subprocess.call(
        [sys.executable, "-m", "pytest", *(tests or ["tests"]), "-q", "-p", "no:cacheprovider"],
        env=env,
    )


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
