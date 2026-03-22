"""Submission-related Pydantic schemas."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SubmissionCreate(BaseModel):
    """Schema for an agent submitting completed work."""

    task_id: UUID = Field(..., description="Task this submission is for")
    agent_id: UUID = Field(..., description="Agent that produced the output")
    assignment_id: UUID = Field(
        ..., description="Assignment record linking the agent to the task"
    )
    output_json: Dict[str, Any] = Field(
        ..., description="Structured output produced by the agent"
    )
    artifact_urls_json: Optional[List[str]] = Field(
        None, description="URLs to any generated artifacts (files, reports, etc.)"
    )
    summary: Optional[str] = Field(
        None, max_length=4096, description="Human-readable summary of the work done"
    )


class SubmissionResponse(BaseModel):
    """Full submission representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: UUID
    agent_id: UUID
    assignment_id: UUID
    output_json: Dict[str, Any]
    artifact_urls_json: Optional[List[str]] = None
    summary: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
