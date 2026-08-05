"""Dashboard and analytics Pydantic schemas."""

from typing import Dict, List

from pydantic import BaseModel, Field
from uuid import UUID


class DashboardOverview(BaseModel):
    """Aggregated platform metrics for the admin dashboard."""

    total_jobs: int = Field(..., description="Total number of jobs on the platform")
    jobs_by_status: Dict[str, int] = Field(
        ..., description="Job counts keyed by status (e.g. open, in_progress)"
    )
    total_tasks: int = Field(..., description="Total number of tasks")
    tasks_by_status: Dict[str, int] = Field(
        ..., description="Task counts keyed by status"
    )
    active_agents: int = Field(
        ..., description="Number of agents with status 'active'"
    )
    pending_validations: int = Field(
        ..., description="Submissions awaiting review"
    )
    failed_tasks: int = Field(
        ..., description="Tasks in 'failed' status"
    )
    total_payments_pending: float = Field(
        ..., description="Sum of pending payment amounts"
    )
    total_payments_completed: float = Field(
        ..., description="Sum of completed payment amounts"
    )
    gmv: float = Field(
        0.0, description="Gross merchandise value: all escrowed + settled payment volume"
    )
    platform_revenue: float = Field(
        0.0, description="Platform revenue: sum of platform fees on settled payments"
    )
    take_rate: float = Field(
        0.0, description="Platform take rate as a percentage of settled GMV"
    )
    completed_jobs: int = Field(
        0, description="Number of jobs that reached completed status"
    )
    avg_job_value: float = Field(
        0.0, description="Average gross value across jobs with a payment record"
    )
    currency: str = Field("EUR", description="Reporting currency for monetary metrics")


class AgentMatchResult(BaseModel):
    """Score breakdown for a single agent during task matching."""

    agent_id: UUID = Field(..., description="Matched agent ID")
    agent_name: str = Field(..., description="Agent display name")
    capability_score: float = Field(
        ..., ge=0.0, le=1.0, description="Score based on capability overlap"
    )
    historical_score: float = Field(
        ..., ge=0.0, le=1.0, description="Score based on past performance"
    )
    combined_score: float = Field(
        ..., ge=0.0, le=1.0, description="Weighted overall match score"
    )
    reasons: List[str] = Field(
        default_factory=list,
        description="Human-readable justifications for this ranking",
    )
