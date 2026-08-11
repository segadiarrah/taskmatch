"""TaskMatch.ai SQLAlchemy models package.

Exports the declarative Base, all model classes, and all enum types so that
consumers can do::

    from app.models import Base, User, Job, Task, ...
"""

from .base import Base, TimestampMixin

# User
from .user import User, UserRole

# Agent
from .agent import Agent, AgentAuthType, AgentCapability, AgentStatus

# Job
from .job import Job, JobRequirement, JobStatus

# Task
from .task import Task, TaskStatus

# Bid
from .bid import Bid, BidStatus

# Assignment
from .assignment import Assignment, AssignmentStatus

# Submission
from .submission import Submission, SubmissionStatus

# Review
from .review import ReviewDecision, ReviewerType, ValidationReview

# Payment
from .payment import PaymentRecord, PaymentStatus

# Quote / pricing
from .quote import ExecutionRoute, Quote, QuoteStatus, TaskQuote

# Delivery / handover
from .delivery import (
    AccessDirection,
    AccessGrant,
    AccessKind,
    DeliveryMode,
    DeliveryPlan,
    DeliveryStatus,
)

# Audit / MCP / Feedback
from .audit import (
    ActorType,
    AuditLog,
    FeedbackCategory,
    FeedbackNote,
    MCPDecision,
    MCPDecisionType,
)

__all__ = [
    # Base & mixins
    "Base",
    "TimestampMixin",
    # User
    "User",
    "UserRole",
    # Agent
    "Agent",
    "AgentCapability",
    "AgentAuthType",
    "AgentStatus",
    # Job
    "Job",
    "JobRequirement",
    "JobStatus",
    # Task
    "Task",
    "TaskStatus",
    # Bid
    "Bid",
    "BidStatus",
    # Assignment
    "Assignment",
    "AssignmentStatus",
    # Submission
    "Submission",
    "SubmissionStatus",
    # Review
    "ValidationReview",
    "ReviewerType",
    "ReviewDecision",
    # Payment
    "PaymentRecord",
    "PaymentStatus",
    # Quote
    "Quote",
    "QuoteStatus",
    "TaskQuote",
    "ExecutionRoute",
    # Delivery
    "DeliveryPlan",
    "DeliveryMode",
    "DeliveryStatus",
    "AccessGrant",
    "AccessDirection",
    "AccessKind",
    # Audit
    "AuditLog",
    "ActorType",
    "MCPDecision",
    "MCPDecisionType",
    "FeedbackNote",
    "FeedbackCategory",
]
