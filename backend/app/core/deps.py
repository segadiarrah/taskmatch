"""Reusable FastAPI dependencies for authentication and authorisation."""

from __future__ import annotations

from collections.abc import Callable, Coroutine
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_token

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login",
)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Extract and return the current user from a valid JWT.

    Raises :class:`HTTPException` 401 when the token is invalid or the
    referenced user does not exist.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = verify_token(token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Late import to avoid circular dependency with models package.
    from app.models.user import User  # noqa: WPS433

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: Any = Depends(get_current_user),
) -> Any:
    """Return the current user only if their account is active.

    Raises :class:`HTTPException` 403 for deactivated accounts.
    """
    if getattr(current_user, "is_active", True) is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    return current_user


def require_role(
    *roles: str,
) -> Callable[..., Coroutine[Any, Any, Any]]:
    """Return a dependency that checks the current user has one of the given roles.

    Usage::

        @router.get("/admin", dependencies=[Depends(require_role("admin"))])
        async def admin_only(): ...
    """

    async def _role_checker(
        current_user: Any = Depends(get_current_active_user),
    ) -> Any:
        user_role: str | None = getattr(current_user, "role", None)
        if user_role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user_role}' is not authorised. Required: {', '.join(roles)}",
            )
        return current_user

    return _role_checker
