"""Request schemas for delivery-plan and access-grant endpoints."""

from typing import Optional

from pydantic import BaseModel, Field

from app.models.delivery import AccessDirection, AccessKind, DeliveryMode


class DeliveryPlanUpdate(BaseModel):
    """Client-chosen shape of the handover.

    Changing the mode before quote acceptance re-prices the job — an installation
    adds human work that a document delivery does not need.
    """

    mode: Optional[DeliveryMode] = Field(
        default=None, description="How the finished work should be delivered"
    )
    target: Optional[str] = Field(
        default=None,
        max_length=512,
        description="Repository URL, hostname, or environment name",
    )
    notes: Optional[str] = Field(default=None, max_length=4000)


class AccessGrantCreate(BaseModel):
    """A credential handed over for an installation- or hosted-mode delivery.

    ``secret`` is encrypted before it touches the database and is never returned
    by any endpoint except the audited reveal.
    """

    label: str = Field(
        ..., min_length=1, max_length=256, description="What this credential is for"
    )
    secret: str = Field(
        ...,
        min_length=1,
        max_length=8192,
        description="The credential itself. Stored encrypted; never logged.",
    )
    kind: AccessKind = Field(default=AccessKind.other)
    direction: AccessDirection = Field(default=AccessDirection.client_to_platform)
    max_accesses: Optional[int] = Field(
        default=None,
        ge=1,
        le=100,
        description="How many times this credential may be revealed before re-issue",
    )
    ttl_hours: Optional[int] = Field(
        default=None,
        ge=1,
        le=8760,
        description="Lifetime in hours. Defaults to the platform setting.",
    )


class HandoverSignOff(BaseModel):
    """Client confirming the delivery landed."""

    notes: str = Field(default="", max_length=4000)
