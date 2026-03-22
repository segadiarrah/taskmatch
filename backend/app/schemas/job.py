"""Job-related Pydantic schemas."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Job requirement schemas
# ---------------------------------------------------------------------------

class JobRequirementCreate(BaseModel):
    """Schema for adding a requirement to a job."""

    requirement_type: str = Field(
        ..., max_length=128, description="Category of requirement (e.g. skill, tool, compliance)"
    )
    description: str = Field(
        ..., max_length=2048, description="Human-readable requirement description"
    )
    priority: Optional[str] = Field(
        "medium",
        pattern=r"^(low|medium|high|critical)$",
        description="Importance level of this requirement",
    )


# ---------------------------------------------------------------------------
# Job schemas
# ---------------------------------------------------------------------------

class JobCreate(BaseModel):
    """Schema for posting a new job."""

    title: str = Field(
        ..., min_length=1, max_length=512, description="Short job title"
    )
    raw_description: str = Field(
        ..., min_length=1, description="Free-form description of the job"
    )
    budget_min: float = Field(
        ..., ge=0, description="Minimum budget in the specified currency"
    )
    budget_max: float = Field(
        ..., ge=0, description="Maximum budget in the specified currency"
    )
    currency: Optional[str] = Field(
        "USD", max_length=8, description="ISO 4217 currency code"
    )
    deadline: Optional[datetime] = Field(
        None, description="Desired completion deadline (UTC)"
    )
    preferred_agent_ids: Optional[List[UUID]] = Field(
        None, description="Agent IDs the client prefers for this job"
    )
    auto_select_enabled: Optional[bool] = Field(
        True, description="Whether the platform should auto-select agents"
    )
    requirements: Optional[List[JobRequirementCreate]] = Field(
        None, description="Structured requirements for the job"
    )


class JobUpdate(BaseModel):
    """Schema for partially updating an existing job."""

    title: Optional[str] = Field(
        None, min_length=1, max_length=512, description="Updated title"
    )
    raw_description: Optional[str] = Field(
        None, min_length=1, description="Updated description"
    )
    budget_min: Optional[float] = Field(
        None, ge=0, description="Updated minimum budget"
    )
    budget_max: Optional[float] = Field(
        None, ge=0, description="Updated maximum budget"
    )
    deadline: Optional[datetime] = Field(
        None, description="Updated deadline"
    )
    status: Optional[str] = Field(
        None,
        pattern=r"^(draft|open|in_progress|completed|cancelled)$",
        description="Updated job status",
    )


class JobResponse(BaseModel):
    """Full job representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_user_id: UUID
    title: str
    raw_description: str
    formatted_summary: Optional[str] = None
    budget_min: float
    budget_max: float
    currency: str = "USD"
    deadline: Optional[datetime] = None
    status: str
    preferred_agent_ids: Optional[List[UUID]] = None
    auto_select_enabled: bool = True
    tasks_count: int = Field(
        default=0, description="Number of tasks decomposed from this job"
    )
    created_at: datetime
    updated_at: datetime


class JobListResponse(BaseModel):
    """Paginated list of jobs."""

    jobs: List[JobResponse]
    total: int = Field(..., description="Total number of jobs matching the query")
