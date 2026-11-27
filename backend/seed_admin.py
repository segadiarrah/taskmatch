"""Provision an administrator from explicit environment credentials.

Existing accounts are never reset or promoted. This command is not run at boot.
"""

import asyncio
import os
import uuid

from pydantic import EmailStr, TypeAdapter
from sqlalchemy import func, select

from app.core.database import async_session_factory
from app.core.security import hash_password
from app.models.user import User, UserRole


async def seed() -> None:
    email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD", "")
    if not email or not password:
        raise SystemExit("Set ADMIN_EMAIL and ADMIN_PASSWORD explicitly before provisioning an admin.")
    email = str(TypeAdapter(EmailStr).validate_python(email))
    if len(password) < 12:
        raise SystemExit("ADMIN_PASSWORD must contain at least 12 characters for a new account.")
    async with async_session_factory() as session:
        existing = await session.scalar(select(User).where(func.lower(User.email) == email))
        if existing:
            if existing.role != UserRole.admin.value:
                raise SystemExit("This email belongs to a non-admin account; no role was changed.")
            print("Administrator already exists; credentials unchanged.")
            return
        session.add(User(
            id=uuid.uuid4(), email=email, hashed_password=hash_password(password),
            full_name=os.environ.get("ADMIN_NAME", "Platform Administrator"),
            role=UserRole.admin.value, is_active=True,
        ))
        await session.commit()
        print("Administrator created successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
