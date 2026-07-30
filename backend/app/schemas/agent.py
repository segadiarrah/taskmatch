"""Agent and capability Pydantic schemas."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, computed_field


# ---------------------------------------------------------------------------
# Capability schemas
# ---------------------------------------------------------------------------

class CapabilityCreate(BaseModel):
    """Schema for registering a new capability on an agent."""

    capability_name: str = Field(
        ..., min_length=1, max_length=256, description="Name of the capability"
    )
    version: str = Field(
        default="1.0", max_length=64, description="Semver-style version string"
    )
    metadata_json: Optional[Dict[str, Any]] = Field(
        None, description="Arbitrary key-value metadata for this capability"
    )


class CapabilityResponse(BaseModel):
    """Schema returned when reading a capability."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    agent_id: UUID
    capability_name: str
    version: str
    metadata_json: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Agent schemas
# ---------------------------------------------------------------------------

class AgentCreate(BaseModel):
    """Schema for registering a new AI agent on the platform."""

    name: str = Field(
        ..., min_length=1, max_length=256, description="Human-readable agent name"
    )
    description: str = Field(
        default="", max_length=4096, description="Markdown-friendly description"
    )
    executor_kind: str = Field(
        default="agent",
        pattern=r"^(agent|human)$",
        description="'agent' for an AI agent endpoint, 'human' for a human expert",
    )
    endpoint_url: Optional[HttpUrl] = Field(
        None,
        description="URL the platform calls to dispatch tasks (AI agents only; optional for human experts)",
    )
    auth_type: str = Field(
        default="none",
        pattern=r"^(none|api_key|bearer)$",
        description="Authentication scheme the endpoint expects",
    )
    supported_task_types: List[str] = Field(
        default_factory=list,
        description="Task type identifiers this agent can handle",
    )
    capabilities: Optional[List[CapabilityCreate]] = Field(
        None, description="Initial capabilities to register with the agent"
    )


class AgentUpdate(BaseModel):
    """Schema for partially updating an existing agent."""

    name: Optional[str] = Field(
        None, min_length=1, max_length=256, description="Updated agent name"
    )
    description: Optional[str] = Field(
        None, max_length=4096, description="Updated description"
    )
    endpoint_url: Optional[HttpUrl] = Field(
        None, description="Updated endpoint URL"
    )
    auth_type: Optional[str] = Field(
        None,
        pattern=r"^(none|api_key|bearer)$",
        description="Updated auth scheme",
    )
    status: Optional[str] = Field(
        None,
        pattern=r"^(active|paused|disabled)$",
        description="Updated operational status",
    )


class AgentResponse(BaseModel):
    """Full agent representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    developer_user_id: UUID
    name: str
    slug: str
    description: str
    endpoint_url: str
    auth_type: str
    status: str
    supported_task_types: Optional[List[str]] = None
    average_score: float = 0.0
    success_rate: float = 0.0
    completed_tasks_count: int = 0
    last_heartbeat_at: Optional[datetime] = None
    capabilities: List[CapabilityResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    @computed_field  # type: ignore[prop-decorator]
    @property
    def kind(self) -> str:
        """Whether this executor is a human expert or an AI agent.

        Human experts have no callable endpoint; the platform stores a profile
        URL of the form ``/experts/{slug}`` instead.
        """
        return "human" if "/experts/" in (self.endpoint_url or "") else "agent"


class AgentListResponse(BaseModel):
    """Paginated list of agents."""

    agents: List[AgentResponse]
    total: int = Field(..., description="Total number of agents matching the query")


class AgentHeartbeat(BaseModel):
    """Payload an agent sends to report its health status."""

    status: str = Field(
        ...,
        pattern=r"^(active|paused|disabled)$",
        description="Current operational status",
    )
    current_load: Optional[float] = Field(
        None, ge=0.0, le=1.0, description="Fraction of capacity in use (0-1)"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        None, description="Additional runtime metadata"
    )
