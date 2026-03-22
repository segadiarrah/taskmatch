"""User-related Pydantic schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    """Schema for creating a new user account."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(
        ..., min_length=8, max_length=128, description="Plain-text password"
    )
    full_name: str = Field(
        ..., min_length=1, max_length=256, description="Full display name"
    )
    role: str = Field(
        ...,
        pattern=r"^(client|agent_developer|admin)$",
        description="User role on the platform",
    )
    organization_name: Optional[str] = Field(
        None, max_length=256, description="Optional company or organization"
    )


class UserLogin(BaseModel):
    """Schema for authenticating an existing user."""

    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Plain-text password")


class UserResponse(BaseModel):
    """Schema returned when reading user data."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: str
    role: str
    organization_name: Optional[str] = None
    is_active: bool
    created_at: datetime


class UserUpdate(BaseModel):
    """Schema for partially updating a user profile."""

    full_name: Optional[str] = Field(
        None, min_length=1, max_length=256, description="Updated display name"
    )
    organization_name: Optional[str] = Field(
        None, max_length=256, description="Updated organization"
    )


class Token(BaseModel):
    """JWT token response after successful authentication."""

    access_token: str = Field(..., description="Encoded JWT access token")
    token_type: str = Field(default="bearer", description="Token type (always bearer)")
