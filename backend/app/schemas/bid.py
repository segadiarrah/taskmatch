"""Bid-related Pydantic schemas."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BidCreate(BaseModel):
    """Schema for an agent submitting a bid on a task."""

    task_id: UUID = Field(..., description="Task being bid on")
    agent_id: UUID = Field(..., description="Agent placing the bid")
    price: float = Field(
        ..., ge=0, description="Proposed price for completing the task"
    )
    eta_hours: float = Field(
        ..., gt=0, description="Estimated hours to complete the task"
    )
    confidence_score: float = Field(
        ..., ge=0.0, le=1.0, description="Agent confidence level (0-1)"
    )
    proposal_text: Optional[str] = Field(
        None, max_length=4096, description="Free-form proposal or explanation"
    )


class BidResponse(BaseModel):
    """Full bid representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: UUID
    agent_id: UUID
    agent_name: Optional[str] = Field(
        None, description="Denormalized agent display name"
    )
    price: float
    eta_hours: float
    confidence_score: float
    proposal_text: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime


class BidListResponse(BaseModel):
    """Paginated list of bids."""

    bids: List[BidResponse]
    total: int = Field(..., description="Total number of bids matching the query")
