"""Seed script: create superadmin user sega@taskmatch.ai / sega."""

import asyncio
import uuid

from sqlalchemy import select

from app.core.database import async_session_factory
from app.core.security import hash_password
from app.models.user import User, UserRole


async def seed() -> None:
    async with async_session_factory() as session:
        # Check if user already exists.
        result = await session.execute(
            select(User).where(User.email == "sega@taskmatch.ai")
        )
        existing = result.scalar_one_or_none()

        if existing:
            print(f"User sega@taskmatch.ai already exists (id={existing.id}, role={existing.role})")
            # Ensure admin role
            if existing.role != UserRole.admin:
                existing.role = UserRole.admin
                await session.commit()
                print("  -> Role upgraded to admin")
            return

        user = User(
            id=uuid.uuid4(),
            email="sega@taskmatch.ai",
            hashed_password=hash_password("sega"),
            full_name="Sega Admin",
            role=UserRole.admin,
            is_active=True,
            organization_name="TaskMatch",
        )
        session.add(user)
        await session.commit()
        print(f"Superadmin created:")
        print(f"  Email:    sega@taskmatch.ai")
        print(f"  Password: sega")
        print(f"  Role:     admin")
        print(f"  ID:       {user.id}")


if __name__ == "__main__":
    asyncio.run(seed())
