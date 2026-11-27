"""User-related Pydantic schemas."""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegistrationAttribution(BaseModel):
    """Only allow first-party campaign tags and voluntarily shared signup context."""

    intent: Literal["project", "work", "executor", "mission", "agent"] | None = None
    language: Literal["en", "fr", "es", "pt", "zh"] | None = None
    country: str | None = Field(default=None, pattern=r"^[A-Z]{2}$")
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None
    utm_content: str | None = None
    utm_term: str | None = None
    referral: str | None = None

    @field_validator("utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "referral")
    @classmethod
    def campaign_label(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value or len(value) > 100 or not all(c.isalnum() or c in " ._-" for c in value):
            return None
        return value


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
        pattern=r"^(client|agent_developer)$",
        description="Public account role; administrators are provisioned separately",
    )
    organization_name: Optional[str] = Field(
        None, max_length=256, description="Optional company or organization"
    )

    attribution: RegistrationAttribution = Field(default_factory=RegistrationAttribution)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Full name cannot be blank")
        return value


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
