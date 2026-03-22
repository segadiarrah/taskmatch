"""Payment-related Pydantic schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PaymentCreate(BaseModel):
    """Schema for initiating a payment record."""

    job_id: UUID = Field(..., description="Job this payment is associated with")
    task_id: Optional[UUID] = Field(
        None, description="Specific task this payment covers (if task-level billing)"
    )
    client_user_id: UUID = Field(
        ..., description="User paying for the work"
    )
    developer_user_id: Optional[UUID] = Field(
        None, description="Developer receiving payment (may be set later)"
    )
    gross_amount: float = Field(
        ..., gt=0, description="Total amount before platform fees"
    )
    platform_fee_percent: float = Field(
        default=10.0,
        ge=0.0,
        le=100.0,
        description="Platform fee as a percentage of gross_amount",
    )


class PaymentResponse(BaseModel):
    """Full payment record returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    job_id: UUID
    task_id: Optional[UUID] = None
    client_user_id: UUID
    developer_user_id: Optional[UUID] = None
    gross_amount: float
    platform_fee_percent: float
    platform_fee_amount: float
    net_amount: float
    payment_status: str
    stripe_payment_intent_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PaymentUpdate(BaseModel):
    """Schema for updating a payment's status."""

    payment_status: str = Field(
        ...,
        pattern=r"^(pending|processing|completed|failed|refunded)$",
        description="New payment status",
    )
