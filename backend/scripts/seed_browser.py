"""Idempotent accounts for the isolated Playwright workflow API only."""

import asyncio

from sqlalchemy import select
from sqlalchemy.engine import make_url

from app.core.config import settings
from app.core.database import async_session_factory
from app.core.security import hash_password
from app.models.user import User


async def main() -> None:
    if make_url(settings.DATABASE_URL).database != "taskmatch_browser_test":
        raise SystemExit("Browser fixtures require the dedicated taskmatch_browser_test database")
    async with async_session_factory() as db:
        for name, role in (("admin", "admin"), ("client", "client"), ("developer", "agent_developer")):
            email = f"browser-{name}@taskmatch.ai"
            if await db.scalar(select(User.id).where(User.email == email)):
                continue
            db.add(User(email=email, full_name=f"browser-{name}", role=role,
                        hashed_password=hash_password("Browser-test-password-2026")))
        await db.commit()
    print("Isolated browser accounts ready")


if __name__ == "__main__":
    asyncio.run(main())
