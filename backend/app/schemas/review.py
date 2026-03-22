"""Review / validation Pydantic schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    """Schema for creating a validation review on a submission."""

    submission_id: UUID = Field(
        ..., description="Submission being reviewed"
    )
    decision: str = Field(
        ...,
        pattern=r"^(approved|rejected|needs_revision)$",
        description="Review verdict",
    )
    notes: Optional[str] = Field(
        None, max_length=4096, description="Reviewer notes or feedback"
    )
    score: Optional[float] = Field(
        None, ge=0.0, le=1.0, description="Quality score assigned by the reviewer (0-1)"
    )


class ReviewResponse(BaseModel):
    """Full review representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    submission_id: UUID
    reviewer_user_id: Optional[UUID] = None
    decision: str
    notes: Optional[str] = None
    score: Optional[float] = None
    created_at: datetime
    updated_at: datetime
