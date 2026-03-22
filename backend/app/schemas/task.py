"""Task-related Pydantic schemas."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TaskCreate(BaseModel):
    """Schema for creating a new task (usually from job decomposition)."""

    job_id: UUID = Field(..., description="Parent job this task belongs to")
    title: str = Field(
        ..., min_length=1, max_length=512, description="Short task title"
    )
    description: str = Field(
        ..., min_length=1, description="Detailed task description"
    )
    task_type: str = Field(
        ..., max_length=128, description="Task type identifier (e.g. code_review, data_entry)"
    )
    input_spec_json: Optional[Dict[str, Any]] = Field(
        None, description="JSON schema or spec describing expected inputs"
    )
    output_spec_json: Optional[Dict[str, Any]] = Field(
        None, description="JSON schema or spec describing expected outputs"
    )
    validation_spec_json: Optional[Dict[str, Any]] = Field(
        None, description="Validation rules for auto-checking the submission"
    )
    budget: Optional[float] = Field(
        None, ge=0, description="Budget allocated to this individual task"
    )
    priority: Optional[int] = Field(
        default=0, ge=0, le=10, description="Priority level (0 = lowest, 10 = highest)"
    )


class TaskUpdate(BaseModel):
    """Schema for partially updating an existing task."""

    title: Optional[str] = Field(
        None, min_length=1, max_length=512, description="Updated title"
    )
    description: Optional[str] = Field(
        None, min_length=1, description="Updated description"
    )
    status: Optional[str] = Field(
        None,
        pattern=r"^(pending|open|assigned|in_progress|submitted|validated|rejected|completed|failed)$",
        description="Updated task status",
    )
    input_spec_json: Optional[Dict[str, Any]] = Field(
        None, description="Updated input specification"
    )
    output_spec_json: Optional[Dict[str, Any]] = Field(
        None, description="Updated output specification"
    )


class TaskResponse(BaseModel):
    """Full task representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    job_id: UUID
    title: str
    description: str
    task_type: str
    status: str
    input_spec_json: Optional[Dict[str, Any]] = None
    output_spec_json: Optional[Dict[str, Any]] = None
    validation_spec_json: Optional[Dict[str, Any]] = None
    budget: Optional[float] = None
    priority: int = 0
    assigned_agent_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


class TaskListResponse(BaseModel):
    """Paginated list of tasks."""

    tasks: List[TaskResponse]
    total: int = Field(..., description="Total number of tasks matching the query")
