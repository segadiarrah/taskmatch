"""Password hashing, JWT creation / verification, and token schemas."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from app.core.config import settings

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Return a bcrypt hash for the given plaintext password."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Return ``True`` if *plain* matches the bcrypt *hashed* value."""
    return pwd_context.verify(plain, hashed)


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT containing *data* with an expiration claim.

    Parameters
    ----------
    data:
        Arbitrary claims to embed in the token.  A ``"sub"`` key is expected
        by convention but not enforced here.
    expires_delta:
        Custom lifetime.  Falls back to ``settings.ACCESS_TOKEN_EXPIRE_MINUTES``.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> dict:
    """Decode and verify a JWT, returning the payload dictionary.

    Raises
    ------
    JWTError
        If the token is expired, tampered with, or otherwise invalid.
    """
    try:
        payload: dict = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except JWTError:
        raise


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class Token(BaseModel):
    """Schema returned by login endpoints."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Decoded token payload used internally."""

    sub: str | None = None
    role: str | None = None
