"""Pydantic v2 schemas for the TaskMatch.ai API."""

from .agent import (
    AgentCreate,
    AgentHeartbeat,
    AgentListResponse,
    AgentResponse,
    AgentUpdate,
    CapabilityCreate,
    CapabilityResponse,
)
from .bid import BidCreate, BidListResponse, BidResponse
from .dashboard import AgentMatchResult, DashboardOverview
from .job import (
    JobCreate,
    JobListResponse,
    JobRequirementCreate,
    JobResponse,
    JobUpdate,
)
from .mcp import (
    MCPDecisionResponse,
    MCPDecomposeRequest,
    MCPDecomposeResponse,
    MCPFormatRequest,
    MCPFormatResponse,
    MCPMatchRequest,
    MCPMatchResponse,
    MCPValidateRequest,
    MCPValidateResponse,
)
from .payment import PaymentCreate, PaymentResponse, PaymentUpdate
from .review import ReviewCreate, ReviewResponse
from .submission import SubmissionCreate, SubmissionResponse
from .task import TaskCreate, TaskListResponse, TaskResponse, TaskUpdate
from .user import Token, UserCreate, UserLogin, UserResponse, UserUpdate

__all__ = [
    # User
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "UserUpdate",
    "Token",
    # Agent
    "AgentCreate",
    "AgentUpdate",
    "AgentResponse",
    "AgentListResponse",
    "CapabilityCreate",
    "CapabilityResponse",
    "AgentHeartbeat",
    # Job
    "JobCreate",
    "JobUpdate",
    "JobResponse",
    "JobListResponse",
    "JobRequirementCreate",
    # Task
    "TaskCreate",
    "TaskUpdate",
    "TaskResponse",
    "TaskListResponse",
    # Bid
    "BidCreate",
    "BidResponse",
    "BidListResponse",
    # Submission
    "SubmissionCreate",
    "SubmissionResponse",
    # Review
    "ReviewCreate",
    "ReviewResponse",
    # Payment
    "PaymentCreate",
    "PaymentResponse",
    "PaymentUpdate",
    # Dashboard
    "DashboardOverview",
    "AgentMatchResult",
    # MCP
    "MCPFormatRequest",
    "MCPFormatResponse",
    "MCPDecomposeRequest",
    "MCPDecomposeResponse",
    "MCPMatchRequest",
    "MCPMatchResponse",
    "MCPValidateRequest",
    "MCPValidateResponse",
    "MCPDecisionResponse",
]
