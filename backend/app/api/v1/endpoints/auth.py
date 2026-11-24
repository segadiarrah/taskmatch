"""Authentication endpoints: register, login, current-user profile."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import lazyload

from app.services.mail_worker import contact_transport_available
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.core.security import create_access_token, hash_password, verify_password
from app.middleware.audit import log_audit
from app.models.user import User, UserRole
from app.services.registration import fixture_access_disabled, public_origin, signup_notification
from app.schemas.user import Token, UserCreate, UserResponse

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user account",
)
async def register(
    body: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db, scope="function"),
) -> UserResponse:
    """Register a new user on the platform.

    Validates that the email is not already taken, hashes the password, and
    persists the new user record.
    """
    result = await db.execute(select(User).options(lazyload("*")).where(func.lower(User.email) == body.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    user = User(
        id=uuid.uuid4(),
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role=UserRole(body.role),
        organization_name=body.organization_name,
        registration_origin=public_origin(body.email),
        registration_attribution=body.attribution.model_dump(exclude_none=True),
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError as exc:
        await db.rollback()
        if getattr(exc.orig, "sqlstate", None) != "23505":
            raise
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        ) from None
    await db.refresh(user)
    from app.services import measurement
    await measurement.register(db, request, user)
    db.add(signup_notification(user))
    if contact_transport_available("verify"):
        from app.services.account_email import queue_account_email
        await queue_account_email(db, user, "verify")

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(user.id),
        action="register",
        entity_type="user",
        entity_id=str(user.id),
    )

    response = UserResponse.model_validate(user)
    return response


@router.post(
    "/login",
    response_model=Token,
    summary="Authenticate and obtain a JWT",
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db, scope="function"),
) -> Token:
    """Validate credentials and return a signed JWT access token.

    Uses the standard OAuth2 password flow form (``username`` + ``password``).
    Email matching is case-insensitive. Administrators on the platform domain
    can also use the local part of their email as a short login identifier.
    """
    identifier = form_data.username.strip().lower()
    query = select(User).options(lazyload("*"))
    if "@" not in identifier:
        query = query.where(
            func.lower(User.email) == f"{identifier}@taskmatch.ai",
            User.role == UserRole.admin.value,
        )
    else:
        query = query.where(func.lower(User.email) == identifier)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active or fixture_access_disabled(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "role": str(user.role), "sv": user.session_version},
    )

    await log_audit(
        db,
        actor_type="user",
        actor_id=str(user.id),
        action="login",
        entity_type="user",
        entity_id=str(user.id),
    )

    return Token(access_token=access_token, token_type="bearer")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
async def get_me(
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    """Return the authenticated user's profile."""
    return UserResponse.model_validate(current_user)
