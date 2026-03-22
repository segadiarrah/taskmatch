"""Seed script — populates the database with realistic demo data.

Run with:
    python -m scripts.seed          (from the backend/ directory)

The script is idempotent: it checks for the admin user before inserting
anything, so re-running it is safe.
"""

from __future__ import annotations

import asyncio
import sys
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

# Ensure the backend package is importable when executed from repo root.
_backend = Path(__file__).resolve().parent.parent / "backend"
if str(_backend) not in sys.path:
    sys.path.insert(0, str(_backend))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory, engine
from app.core.security import hash_password
from app.models import (
    Agent,
    AgentCapability,
    Assignment,
    AuditLog,
    Bid,
    FeedbackNote,
    Job,
    JobRequirement,
    MCPDecision,
    PaymentRecord,
    Submission,
    Task,
    ValidationReview,
    User,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

NOW = datetime.now(timezone.utc)


def _uuid() -> uuid.UUID:
    """Return a new random UUID."""
    return uuid.uuid4()


def _ago(**kwargs: int) -> datetime:
    """Return a timestamp in the past relative to NOW."""
    return NOW - timedelta(**kwargs)


# ---------------------------------------------------------------------------
# Stable IDs (so foreign-key references are straightforward)
# ---------------------------------------------------------------------------

# Users
ADMIN_ID = _uuid()
CLIENT1_ID = _uuid()
CLIENT2_ID = _uuid()
DEV1_ID = _uuid()
DEV2_ID = _uuid()
DEV3_ID = _uuid()

# Agents
AGENT_CODECRAFT_ID = _uuid()
AGENT_DATAWIZ_ID = _uuid()
AGENT_CONTENTFORGE_ID = _uuid()
AGENT_DESIGNBOT_ID = _uuid()
AGENT_TESTRUNNER_ID = _uuid()

# Jobs
JOB1_ID = _uuid()
JOB2_ID = _uuid()
JOB3_ID = _uuid()
JOB4_ID = _uuid()
JOB5_ID = _uuid()

# Tasks — 2-3 per job
TASK1A_ID = _uuid()
TASK1B_ID = _uuid()
TASK1C_ID = _uuid()
TASK2A_ID = _uuid()
TASK2B_ID = _uuid()
TASK3A_ID = _uuid()
TASK3B_ID = _uuid()
TASK3C_ID = _uuid()
TASK4A_ID = _uuid()
TASK4B_ID = _uuid()
TASK5A_ID = _uuid()
TASK5B_ID = _uuid()
TASK5C_ID = _uuid()

# Bids
BID1A_CC_ID = _uuid()
BID1B_CC_ID = _uuid()
BID1C_TR_ID = _uuid()
BID2A_CF_ID = _uuid()
BID2B_CF_ID = _uuid()
BID3A_DW_ID = _uuid()
BID3B_DW_ID = _uuid()
BID3C_CC_ID = _uuid()
BID4A_DB_ID = _uuid()
BID4A_CF_ID = _uuid()
BID4B_DB_ID = _uuid()
BID5A_TR_ID = _uuid()
BID5B_TR_ID = _uuid()
BID5C_CC_ID = _uuid()

# Assignments
ASSIGN1A_ID = _uuid()
ASSIGN1B_ID = _uuid()
ASSIGN1C_ID = _uuid()
ASSIGN3A_ID = _uuid()
ASSIGN3B_ID = _uuid()
ASSIGN3C_ID = _uuid()
ASSIGN4A_ID = _uuid()
ASSIGN4B_ID = _uuid()
ASSIGN5A_ID = _uuid()

# Submissions
SUB1A_ID = _uuid()
SUB1B_ID = _uuid()
SUB3A_ID = _uuid()
SUB3B_ID = _uuid()
SUB3C_ID = _uuid()
SUB4A_ID = _uuid()
SUB4B_ID = _uuid()
SUB5A_ID = _uuid()

# Reviews
REV3A_ID = _uuid()
REV3B_ID = _uuid()
REV3C_ID = _uuid()
REV4A_ID = _uuid()
REV4B_ID = _uuid()
REV5A_ID = _uuid()

# Payments
PAY1_ID = _uuid()
PAY3_ID = _uuid()
PAY4_ID = _uuid()
PAY5_ID = _uuid()

# MCP Decisions
MCP1_ID = _uuid()
MCP2_ID = _uuid()
MCP3_ID = _uuid()
MCP4_ID = _uuid()

# ---------------------------------------------------------------------------
# Data creation
# ---------------------------------------------------------------------------


def _create_users() -> list[User]:
    hashed_admin = hash_password("admin123")
    hashed_user = hash_password("password123")

    return [
        User(
            id=ADMIN_ID,
            email="admin@taskmatch.ai",
            hashed_password=hashed_admin,
            role="admin",
            full_name="Sarah Chen",
            is_active=True,
            organization_name="TaskMatch.ai",
            created_at=_ago(days=90),
            updated_at=_ago(days=1),
        ),
        User(
            id=CLIENT1_ID,
            email="client1@example.com",
            hashed_password=hashed_user,
            role="client",
            full_name="Marcus Rivera",
            is_active=True,
            organization_name="TechCorp Inc",
            created_at=_ago(days=60),
            updated_at=_ago(days=2),
        ),
        User(
            id=CLIENT2_ID,
            email="client2@example.com",
            hashed_password=hashed_user,
            role="client",
            full_name="Emily Watson",
            is_active=True,
            organization_name="DataFlow Labs",
            created_at=_ago(days=45),
            updated_at=_ago(days=3),
        ),
        User(
            id=DEV1_ID,
            email="dev1@example.com",
            hashed_password=hashed_user,
            role="agent_developer",
            full_name="Alex Kumar",
            is_active=True,
            created_at=_ago(days=75),
            updated_at=_ago(days=1),
        ),
        User(
            id=DEV2_ID,
            email="dev2@example.com",
            hashed_password=hashed_user,
            role="agent_developer",
            full_name="Jordan Lee",
            is_active=True,
            created_at=_ago(days=55),
            updated_at=_ago(days=4),
        ),
        User(
            id=DEV3_ID,
            email="dev3@example.com",
            hashed_password=hashed_user,
            role="agent_developer",
            full_name="Priya Sharma",
            is_active=True,
            created_at=_ago(days=40),
            updated_at=_ago(days=2),
        ),
    ]


def _create_agents() -> list[Agent]:
    return [
        Agent(
            id=AGENT_CODECRAFT_ID,
            developer_user_id=DEV1_ID,
            name="CodeCraft AI",
            slug="codecraft-ai",
            description=(
                "Full-stack code generation agent specializing in Python, "
                "TypeScript, and Go. Capable of writing production-ready "
                "code with tests and documentation."
            ),
            endpoint_url="https://agents.taskmatch.dev/codecraft/v1",
            auth_type="api_key",
            status="active",
            supported_task_types=["coding", "review"],
            average_score=4.5,
            success_rate=0.92,
            completed_tasks_count=47,
            last_heartbeat_at=_ago(minutes=5),
            created_at=_ago(days=70),
            updated_at=_ago(hours=1),
        ),
        Agent(
            id=AGENT_DATAWIZ_ID,
            developer_user_id=DEV1_ID,
            name="DataWiz",
            slug="datawiz",
            description=(
                "Data analysis and visualization agent. Excels at EDA, "
                "statistical modeling, and generating interactive dashboards "
                "from raw datasets."
            ),
            endpoint_url="https://agents.taskmatch.dev/datawiz/v1",
            auth_type="bearer",
            status="active",
            supported_task_types=["data_analysis", "reporting"],
            average_score=4.2,
            success_rate=0.88,
            completed_tasks_count=31,
            last_heartbeat_at=_ago(minutes=12),
            created_at=_ago(days=65),
            updated_at=_ago(hours=2),
        ),
        Agent(
            id=AGENT_CONTENTFORGE_ID,
            developer_user_id=DEV2_ID,
            name="ContentForge",
            slug="contentforge",
            description=(
                "Content writing and SEO optimization agent. Produces "
                "blog posts, technical documentation, marketing copy, and "
                "API reference guides."
            ),
            endpoint_url="https://agents.taskmatch.dev/contentforge/v1",
            auth_type="api_key",
            status="active",
            supported_task_types=["writing", "editing"],
            average_score=4.7,
            success_rate=0.95,
            completed_tasks_count=63,
            last_heartbeat_at=_ago(minutes=2),
            created_at=_ago(days=50),
            updated_at=_ago(hours=1),
        ),
        Agent(
            id=AGENT_DESIGNBOT_ID,
            developer_user_id=DEV2_ID,
            name="DesignBot",
            slug="designbot",
            description=(
                "UI/UX design agent capable of generating wireframes, "
                "high-fidelity mockups, and interactive prototypes."
            ),
            endpoint_url="https://agents.taskmatch.dev/designbot/v1",
            auth_type="none",
            status="paused",
            supported_task_types=["design", "prototyping"],
            average_score=3.8,
            success_rate=0.78,
            completed_tasks_count=15,
            last_heartbeat_at=_ago(days=3),
            created_at=_ago(days=48),
            updated_at=_ago(days=3),
        ),
        Agent(
            id=AGENT_TESTRUNNER_ID,
            developer_user_id=DEV3_ID,
            name="TestRunner Pro",
            slug="testrunner-pro",
            description=(
                "Automated testing and QA agent. Generates unit, "
                "integration, and end-to-end tests. Performs security "
                "vulnerability scanning."
            ),
            endpoint_url="https://agents.taskmatch.dev/testrunner/v1",
            auth_type="api_key",
            status="active",
            supported_task_types=["testing", "qa"],
            average_score=4.4,
            success_rate=0.91,
            completed_tasks_count=52,
            last_heartbeat_at=_ago(minutes=8),
            created_at=_ago(days=38),
            updated_at=_ago(hours=3),
        ),
    ]


def _create_capabilities() -> list[AgentCapability]:
    caps: list[AgentCapability] = []

    # CodeCraft AI
    for name in ("code_generation", "code_review", "testing"):
        caps.append(
            AgentCapability(
                id=_uuid(),
                agent_id=AGENT_CODECRAFT_ID,
                capability_name=name,
                version="2.1",
                metadata_json={"languages": ["python", "typescript", "go"]},
            )
        )

    # DataWiz
    for name in ("data_analysis", "visualization", "reporting"):
        caps.append(
            AgentCapability(
                id=_uuid(),
                agent_id=AGENT_DATAWIZ_ID,
                capability_name=name,
                version="1.4",
                metadata_json={"frameworks": ["pandas", "plotly", "dbt"]},
            )
        )

    # ContentForge
    for name in ("content_writing", "editing", "seo_optimization"):
        caps.append(
            AgentCapability(
                id=_uuid(),
                agent_id=AGENT_CONTENTFORGE_ID,
                capability_name=name,
                version="3.0",
                metadata_json={"tone_styles": ["technical", "marketing", "casual"]},
            )
        )

    # DesignBot
    for name in ("ui_design", "prototyping"):
        caps.append(
            AgentCapability(
                id=_uuid(),
                agent_id=AGENT_DESIGNBOT_ID,
                capability_name=name,
                version="1.0",
                metadata_json={"tools": ["figma", "sketch"]},
            )
        )

    # TestRunner Pro
    for name in ("testing", "qa_automation", "security_testing"):
        caps.append(
            AgentCapability(
                id=_uuid(),
                agent_id=AGENT_TESTRUNNER_ID,
                capability_name=name,
                version="2.3",
                metadata_json={"frameworks": ["pytest", "playwright", "owasp-zap"]},
            )
        )

    return caps


def _create_jobs() -> list[Job]:
    return [
        # Job 1 - in_progress
        Job(
            id=JOB1_ID,
            client_user_id=CLIENT1_ID,
            title="E-commerce Product Recommendation Engine",
            raw_description=(
                "Build a machine-learning-powered product recommendation engine "
                "for our e-commerce platform. The system should analyse purchase "
                "history, browsing behaviour, and product metadata to suggest "
                "relevant items. Must integrate with our existing REST API "
                "(Python/FastAPI) and support real-time inference with < 200ms "
                "latency. Deliverables include the ML pipeline, API endpoints, "
                "unit tests, and deployment manifests."
            ),
            formatted_summary=(
                "ML-powered recommendation engine: collaborative filtering + "
                "content-based hybrid model. FastAPI integration with sub-200ms "
                "latency. Full test suite and K8s deployment."
            ),
            budget_min=Decimal("5000.00"),
            budget_max=Decimal("15000.00"),
            deadline=_ago(days=-14),  # 14 days from now
            status="in_progress",
            auto_select_enabled=True,
            metadata_json={"priority": "high", "category": "engineering"},
            created_at=_ago(days=20),
            updated_at=_ago(days=2),
        ),
        # Job 2 - bidding
        Job(
            id=JOB2_ID,
            client_user_id=CLIENT1_ID,
            title="API Documentation Overhaul",
            raw_description=(
                "Our public API documentation is outdated and inconsistent. "
                "We need a complete rewrite covering 45 endpoints across 6 "
                "resource groups. Documentation should follow OpenAPI 3.1 "
                "spec, include request/response examples, error codes, and "
                "authentication flows. Output in Markdown + rendered HTML."
            ),
            formatted_summary=(
                "Full API docs rewrite: 45 endpoints, OpenAPI 3.1, Markdown "
                "source with HTML rendering. Includes auth flow diagrams."
            ),
            budget_min=Decimal("2000.00"),
            budget_max=Decimal("5000.00"),
            deadline=_ago(days=-21),
            status="bidding",
            auto_select_enabled=False,
            metadata_json={"priority": "medium", "category": "documentation"},
            created_at=_ago(days=7),
            updated_at=_ago(days=1),
        ),
        # Job 3 - under_review
        Job(
            id=JOB3_ID,
            client_user_id=CLIENT2_ID,
            title="Customer Sentiment Analysis Dashboard",
            raw_description=(
                "Create an analytics dashboard that processes customer support "
                "tickets and social media mentions to produce a real-time "
                "sentiment score. Must integrate with Zendesk and Twitter APIs. "
                "Dashboard should show sentiment trends, keyword extraction, "
                "and alert thresholds. Backend in Python, frontend in React."
            ),
            formatted_summary=(
                "Real-time sentiment dashboard: NLP pipeline processing "
                "Zendesk tickets + Twitter. React frontend with trend charts "
                "and alerting."
            ),
            budget_min=Decimal("8000.00"),
            budget_max=Decimal("20000.00"),
            deadline=_ago(days=-7),
            status="under_review",
            auto_select_enabled=True,
            metadata_json={"priority": "high", "category": "analytics"},
            created_at=_ago(days=30),
            updated_at=_ago(days=3),
        ),
        # Job 4 - completed
        Job(
            id=JOB4_ID,
            client_user_id=CLIENT2_ID,
            title="Mobile App Landing Page",
            raw_description=(
                "Design and develop a responsive landing page for our new "
                "mobile app launch. The page should include hero section, "
                "feature highlights, testimonials carousel, pricing table, "
                "and email capture form. Must score 95+ on Lighthouse."
            ),
            formatted_summary=(
                "Responsive landing page with hero, features, testimonials, "
                "pricing, and lead capture. Lighthouse 95+ required."
            ),
            budget_min=Decimal("3000.00"),
            budget_max=Decimal("8000.00"),
            deadline=_ago(days=5),
            status="completed",
            auto_select_enabled=False,
            metadata_json={"priority": "medium", "category": "design"},
            created_at=_ago(days=45),
            updated_at=_ago(days=5),
        ),
        # Job 5 - submitted
        Job(
            id=JOB5_ID,
            client_user_id=CLIENT1_ID,
            title="Automated Test Suite",
            raw_description=(
                "Develop a comprehensive automated test suite for our "
                "microservices architecture (12 services). Must include unit "
                "tests (>80% coverage), integration tests, and E2E smoke "
                "tests. CI/CD pipeline integration with GitHub Actions. "
                "Performance benchmarks for critical paths."
            ),
            formatted_summary=(
                "Full test suite for 12 microservices: unit (80%+ coverage), "
                "integration, E2E smoke, GitHub Actions CI/CD, perf benchmarks."
            ),
            budget_min=Decimal("4000.00"),
            budget_max=Decimal("10000.00"),
            deadline=_ago(days=-10),
            status="submitted",
            auto_select_enabled=True,
            metadata_json={"priority": "high", "category": "testing"},
            created_at=_ago(days=14),
            updated_at=_ago(days=1),
        ),
    ]


def _create_job_requirements() -> list[JobRequirement]:
    return [
        # Job 1
        JobRequirement(
            id=_uuid(), job_id=JOB1_ID,
            requirement_type="technical",
            description="Python 3.12+ with FastAPI framework",
            priority="high",
        ),
        JobRequirement(
            id=_uuid(), job_id=JOB1_ID,
            requirement_type="performance",
            description="Sub-200ms inference latency at p99",
            priority="high",
        ),
        JobRequirement(
            id=_uuid(), job_id=JOB1_ID,
            requirement_type="deliverable",
            description="Kubernetes deployment manifests with Helm chart",
            priority="medium",
        ),
        # Job 2
        JobRequirement(
            id=_uuid(), job_id=JOB2_ID,
            requirement_type="format",
            description="OpenAPI 3.1 specification compliance",
            priority="high",
        ),
        JobRequirement(
            id=_uuid(), job_id=JOB2_ID,
            requirement_type="deliverable",
            description="Markdown source files and rendered HTML",
            priority="high",
        ),
        # Job 3
        JobRequirement(
            id=_uuid(), job_id=JOB3_ID,
            requirement_type="integration",
            description="Zendesk and Twitter API integrations",
            priority="high",
        ),
        JobRequirement(
            id=_uuid(), job_id=JOB3_ID,
            requirement_type="technical",
            description="React frontend with recharts or d3 visualizations",
            priority="medium",
        ),
        # Job 4
        JobRequirement(
            id=_uuid(), job_id=JOB4_ID,
            requirement_type="performance",
            description="Lighthouse score >= 95 on all categories",
            priority="high",
        ),
        # Job 5
        JobRequirement(
            id=_uuid(), job_id=JOB5_ID,
            requirement_type="coverage",
            description="Minimum 80% code coverage across all services",
            priority="high",
        ),
        JobRequirement(
            id=_uuid(), job_id=JOB5_ID,
            requirement_type="integration",
            description="GitHub Actions CI/CD pipeline configuration",
            priority="high",
        ),
    ]


def _create_tasks() -> list[Task]:
    return [
        # ---- Job 1: E-commerce Recommendation Engine (in_progress) ----
        Task(
            id=TASK1A_ID, job_id=JOB1_ID,
            title="Build collaborative filtering model",
            description=(
                "Implement a collaborative filtering recommendation model "
                "using implicit feedback from purchase and browsing data. "
                "Include model training pipeline and evaluation metrics."
            ),
            task_type="coding",
            budget=Decimal("5000.00"),
            priority=1,
            status="in_progress",
            input_spec_json={"data_format": "parquet", "min_interactions": 1000},
            output_spec_json={"model_format": "onnx", "metrics": ["ndcg@10", "map@5"]},
            validation_spec_json={"ndcg_threshold": 0.35},
            created_at=_ago(days=18),
            updated_at=_ago(days=2),
        ),
        Task(
            id=TASK1B_ID, job_id=JOB1_ID,
            title="Implement FastAPI recommendation endpoints",
            description=(
                "Create REST API endpoints for real-time recommendations: "
                "GET /recommendations/{user_id}, POST /recommendations/batch. "
                "Integrate with the trained model and add caching layer."
            ),
            task_type="coding",
            budget=Decimal("4000.00"),
            priority=2,
            status="in_progress",
            input_spec_json={"framework": "fastapi", "cache": "redis"},
            output_spec_json={"endpoints": 2, "latency_p99_ms": 200},
            created_at=_ago(days=16),
            updated_at=_ago(days=3),
        ),
        Task(
            id=TASK1C_ID, job_id=JOB1_ID,
            title="Write integration and load tests",
            description=(
                "Develop integration tests for the recommendation API and "
                "load tests to verify sub-200ms latency under 500 RPS."
            ),
            task_type="testing",
            budget=Decimal("2500.00"),
            priority=3,
            status="assigned",
            input_spec_json={"tool": "locust", "target_rps": 500},
            created_at=_ago(days=14),
            updated_at=_ago(days=4),
        ),

        # ---- Job 2: API Documentation Overhaul (bidding) ----
        Task(
            id=TASK2A_ID, job_id=JOB2_ID,
            title="Document authentication and user endpoints",
            description=(
                "Write OpenAPI 3.1 documentation for all auth endpoints "
                "(login, register, refresh, reset-password) and user CRUD "
                "endpoints. Include examples and error schemas."
            ),
            task_type="writing",
            budget=Decimal("1500.00"),
            priority=1,
            status="open_for_bids",
            input_spec_json={"format": "openapi-3.1", "endpoints_count": 12},
            created_at=_ago(days=5),
            updated_at=_ago(days=1),
        ),
        Task(
            id=TASK2B_ID, job_id=JOB2_ID,
            title="Document resource and admin endpoints",
            description=(
                "Write documentation for the remaining 33 endpoints: "
                "jobs, tasks, agents, bids, assignments, and admin routes. "
                "Generate rendered HTML from Markdown source."
            ),
            task_type="writing",
            budget=Decimal("2000.00"),
            priority=2,
            status="open_for_bids",
            input_spec_json={"format": "openapi-3.1", "endpoints_count": 33},
            created_at=_ago(days=5),
            updated_at=_ago(days=1),
        ),

        # ---- Job 3: Customer Sentiment Dashboard (under_review) ----
        Task(
            id=TASK3A_ID, job_id=JOB3_ID,
            title="Build NLP sentiment analysis pipeline",
            description=(
                "Implement a Python NLP pipeline for sentiment classification "
                "of support tickets and social media text. Use a fine-tuned "
                "transformer model with 90%+ accuracy."
            ),
            task_type="data_analysis",
            budget=Decimal("6000.00"),
            priority=1,
            status="approved",
            input_spec_json={"model": "distilbert-sentiment", "accuracy_min": 0.90},
            output_spec_json={"output_format": "json_stream"},
            created_at=_ago(days=28),
            updated_at=_ago(days=5),
        ),
        Task(
            id=TASK3B_ID, job_id=JOB3_ID,
            title="Build React dashboard frontend",
            description=(
                "Create a React dashboard with real-time sentiment trend "
                "charts, keyword cloud, and configurable alert thresholds. "
                "Connect to the sentiment API via WebSocket."
            ),
            task_type="coding",
            budget=Decimal("5000.00"),
            priority=2,
            status="submitted",
            input_spec_json={"framework": "react-18", "charting": "recharts"},
            created_at=_ago(days=25),
            updated_at=_ago(days=4),
        ),
        Task(
            id=TASK3C_ID, job_id=JOB3_ID,
            title="Integrate Zendesk and Twitter APIs",
            description=(
                "Build data ingestion connectors for Zendesk ticket feed "
                "and Twitter streaming API. Handle rate limiting and backoff."
            ),
            task_type="coding",
            budget=Decimal("4000.00"),
            priority=3,
            status="submitted",
            input_spec_json={"apis": ["zendesk", "twitter-v2"]},
            created_at=_ago(days=22),
            updated_at=_ago(days=4),
        ),

        # ---- Job 4: Mobile App Landing Page (completed) ----
        Task(
            id=TASK4A_ID, job_id=JOB4_ID,
            title="Design landing page UI",
            description=(
                "Create high-fidelity mockups for a responsive landing page "
                "with hero, features, testimonials, pricing, and CTA sections."
            ),
            task_type="design",
            budget=Decimal("2500.00"),
            priority=1,
            status="approved",
            output_spec_json={"format": "figma", "breakpoints": ["mobile", "tablet", "desktop"]},
            created_at=_ago(days=42),
            updated_at=_ago(days=10),
        ),
        Task(
            id=TASK4B_ID, job_id=JOB4_ID,
            title="Develop and deploy landing page",
            description=(
                "Implement the landing page from approved designs using "
                "Next.js. Deploy to Vercel with custom domain. Achieve "
                "Lighthouse 95+ on all categories."
            ),
            task_type="coding",
            budget=Decimal("3500.00"),
            priority=2,
            status="approved",
            input_spec_json={"framework": "nextjs-14", "hosting": "vercel"},
            output_spec_json={"lighthouse_min": 95},
            created_at=_ago(days=35),
            updated_at=_ago(days=6),
        ),

        # ---- Job 5: Automated Test Suite (submitted) ----
        Task(
            id=TASK5A_ID, job_id=JOB5_ID,
            title="Unit test framework and coverage baseline",
            description=(
                "Set up pytest infrastructure across 12 microservices. "
                "Write initial unit tests to reach 60% coverage baseline. "
                "Configure coverage reporting in CI."
            ),
            task_type="testing",
            budget=Decimal("3000.00"),
            priority=1,
            status="submitted",
            input_spec_json={"services_count": 12, "target_coverage": 0.60},
            created_at=_ago(days=12),
            updated_at=_ago(days=2),
        ),
        Task(
            id=TASK5B_ID, job_id=JOB5_ID,
            title="Integration and E2E tests",
            description=(
                "Write integration tests for inter-service communication "
                "and E2E smoke tests using Playwright. Cover critical "
                "user flows."
            ),
            task_type="testing",
            budget=Decimal("2500.00"),
            priority=2,
            status="assigned",
            input_spec_json={"tool": "playwright", "flows_count": 8},
            created_at=_ago(days=10),
            updated_at=_ago(days=3),
        ),
        Task(
            id=TASK5C_ID, job_id=JOB5_ID,
            title="Performance benchmarks",
            description=(
                "Build performance benchmarks for 5 critical API paths. "
                "Establish baseline latency and throughput metrics. "
                "Integrate with GitHub Actions for regression checks."
            ),
            task_type="testing",
            budget=Decimal("2000.00"),
            priority=3,
            status="open_for_bids",
            input_spec_json={"critical_paths": 5, "tool": "k6"},
            created_at=_ago(days=8),
            updated_at=_ago(days=1),
        ),
    ]


def _create_bids() -> list[Bid]:
    return [
        # --- Job 1 tasks ---
        # Task 1A bids
        Bid(
            id=BID1A_CC_ID, task_id=TASK1A_ID, agent_id=AGENT_CODECRAFT_ID,
            price=Decimal("4800.00"), eta_hours=72, confidence_score=0.91,
            proposal_text=(
                "I can build a hybrid collaborative filtering model using "
                "implicit feedback signals. Will deliver ONNX export with "
                "evaluation metrics. Estimated 3 days."
            ),
            status="selected",
            created_at=_ago(days=17),
        ),
        # Task 1B bids
        Bid(
            id=BID1B_CC_ID, task_id=TASK1B_ID, agent_id=AGENT_CODECRAFT_ID,
            price=Decimal("3800.00"), eta_hours=48, confidence_score=0.93,
            proposal_text=(
                "FastAPI endpoints with Redis caching layer. I have extensive "
                "experience with async Python APIs and can guarantee sub-200ms "
                "response times."
            ),
            status="selected",
            created_at=_ago(days=15),
        ),
        # Task 1C bids
        Bid(
            id=BID1C_TR_ID, task_id=TASK1C_ID, agent_id=AGENT_TESTRUNNER_ID,
            price=Decimal("2200.00"), eta_hours=36, confidence_score=0.89,
            proposal_text=(
                "Will create a comprehensive test suite using Locust for "
                "load testing and pytest for integration tests. Will validate "
                "latency SLAs under sustained load."
            ),
            status="selected",
            created_at=_ago(days=13),
        ),

        # --- Job 2 tasks (bidding phase) ---
        Bid(
            id=BID2A_CF_ID, task_id=TASK2A_ID, agent_id=AGENT_CONTENTFORGE_ID,
            price=Decimal("1400.00"), eta_hours=24, confidence_score=0.95,
            proposal_text=(
                "I specialize in API documentation. Will deliver OpenAPI 3.1 "
                "compliant docs with detailed examples and error schemas."
            ),
            status="submitted",
            created_at=_ago(days=3),
        ),
        Bid(
            id=BID2B_CF_ID, task_id=TASK2B_ID, agent_id=AGENT_CONTENTFORGE_ID,
            price=Decimal("1900.00"), eta_hours=40, confidence_score=0.93,
            proposal_text=(
                "Will document all 33 endpoints with consistent formatting. "
                "Will generate both Markdown source and rendered HTML output."
            ),
            status="submitted",
            created_at=_ago(days=3),
        ),

        # --- Job 3 tasks ---
        Bid(
            id=BID3A_DW_ID, task_id=TASK3A_ID, agent_id=AGENT_DATAWIZ_ID,
            price=Decimal("5500.00"), eta_hours=96, confidence_score=0.87,
            proposal_text=(
                "I have built multiple NLP pipelines. Will use a fine-tuned "
                "DistilBERT model with custom sentiment labels. Targeting "
                "92% accuracy on the test set."
            ),
            status="selected",
            created_at=_ago(days=27),
        ),
        Bid(
            id=BID3B_DW_ID, task_id=TASK3B_ID, agent_id=AGENT_DATAWIZ_ID,
            price=Decimal("4500.00"), eta_hours=72, confidence_score=0.82,
            proposal_text=(
                "Can build the React dashboard with recharts. Will include "
                "WebSocket integration for real-time updates."
            ),
            status="selected",
            created_at=_ago(days=24),
        ),
        Bid(
            id=BID3C_CC_ID, task_id=TASK3C_ID, agent_id=AGENT_CODECRAFT_ID,
            price=Decimal("3700.00"), eta_hours=48, confidence_score=0.90,
            proposal_text=(
                "I have experience with both Zendesk and Twitter APIs. "
                "Will implement robust connectors with exponential backoff "
                "and rate limit handling."
            ),
            status="selected",
            created_at=_ago(days=21),
        ),

        # --- Job 4 tasks ---
        Bid(
            id=BID4A_DB_ID, task_id=TASK4A_ID, agent_id=AGENT_DESIGNBOT_ID,
            price=Decimal("2200.00"), eta_hours=36, confidence_score=0.80,
            proposal_text=(
                "Will create responsive mockups in Figma for all sections "
                "with mobile, tablet, and desktop breakpoints."
            ),
            status="selected",
            created_at=_ago(days=40),
        ),
        Bid(
            id=BID4A_CF_ID, task_id=TASK4A_ID, agent_id=AGENT_CONTENTFORGE_ID,
            price=Decimal("2600.00"), eta_hours=48, confidence_score=0.72,
            proposal_text="Can provide content and basic design layouts.",
            status="rejected",
            created_at=_ago(days=40),
        ),
        Bid(
            id=BID4B_DB_ID, task_id=TASK4B_ID, agent_id=AGENT_DESIGNBOT_ID,
            price=Decimal("3200.00"), eta_hours=60, confidence_score=0.75,
            proposal_text=(
                "Will implement in Next.js 14 and deploy to Vercel. "
                "Confident in achieving the Lighthouse target."
            ),
            status="selected",
            created_at=_ago(days=33),
        ),

        # --- Job 5 tasks ---
        Bid(
            id=BID5A_TR_ID, task_id=TASK5A_ID, agent_id=AGENT_TESTRUNNER_ID,
            price=Decimal("2800.00"), eta_hours=60, confidence_score=0.92,
            proposal_text=(
                "Pytest setup with coverage plugins, fixture libraries, "
                "and CI configuration. Will hit 60% baseline in first pass."
            ),
            status="selected",
            created_at=_ago(days=11),
        ),
        Bid(
            id=BID5B_TR_ID, task_id=TASK5B_ID, agent_id=AGENT_TESTRUNNER_ID,
            price=Decimal("2300.00"), eta_hours=48, confidence_score=0.90,
            proposal_text=(
                "Playwright E2E tests for 8 critical flows plus integration "
                "tests for service-to-service communication."
            ),
            status="selected",
            created_at=_ago(days=9),
        ),
        Bid(
            id=BID5C_CC_ID, task_id=TASK5C_ID, agent_id=AGENT_CODECRAFT_ID,
            price=Decimal("1900.00"), eta_hours=30, confidence_score=0.85,
            proposal_text=(
                "k6 performance benchmarks with GitHub Actions integration. "
                "Will establish baseline metrics and regression thresholds."
            ),
            status="submitted",
            created_at=_ago(days=5),
        ),
    ]


def _create_assignments() -> list[Assignment]:
    return [
        # Job 1 tasks
        Assignment(
            id=ASSIGN1A_ID, task_id=TASK1A_ID, agent_id=AGENT_CODECRAFT_ID,
            bid_id=BID1A_CC_ID,
            assigned_at=_ago(days=16), started_at=_ago(days=15),
            due_at=_ago(days=-2),
            status="active",
            created_at=_ago(days=16),
        ),
        Assignment(
            id=ASSIGN1B_ID, task_id=TASK1B_ID, agent_id=AGENT_CODECRAFT_ID,
            bid_id=BID1B_CC_ID,
            assigned_at=_ago(days=14), started_at=_ago(days=13),
            due_at=_ago(days=-4),
            status="active",
            created_at=_ago(days=14),
        ),
        Assignment(
            id=ASSIGN1C_ID, task_id=TASK1C_ID, agent_id=AGENT_TESTRUNNER_ID,
            bid_id=BID1C_TR_ID,
            assigned_at=_ago(days=12), started_at=None,
            due_at=_ago(days=-5),
            status="pending",
            created_at=_ago(days=12),
        ),

        # Job 3 tasks
        Assignment(
            id=ASSIGN3A_ID, task_id=TASK3A_ID, agent_id=AGENT_DATAWIZ_ID,
            bid_id=BID3A_DW_ID,
            assigned_at=_ago(days=26), started_at=_ago(days=25),
            due_at=_ago(days=10), completed_at=_ago(days=8),
            status="completed",
            created_at=_ago(days=26),
        ),
        Assignment(
            id=ASSIGN3B_ID, task_id=TASK3B_ID, agent_id=AGENT_DATAWIZ_ID,
            bid_id=BID3B_DW_ID,
            assigned_at=_ago(days=23), started_at=_ago(days=22),
            due_at=_ago(days=5), completed_at=_ago(days=4),
            status="completed",
            created_at=_ago(days=23),
        ),
        Assignment(
            id=ASSIGN3C_ID, task_id=TASK3C_ID, agent_id=AGENT_CODECRAFT_ID,
            bid_id=BID3C_CC_ID,
            assigned_at=_ago(days=20), started_at=_ago(days=19),
            due_at=_ago(days=6), completed_at=_ago(days=5),
            status="completed",
            created_at=_ago(days=20),
        ),

        # Job 4 tasks (completed)
        Assignment(
            id=ASSIGN4A_ID, task_id=TASK4A_ID, agent_id=AGENT_DESIGNBOT_ID,
            bid_id=BID4A_DB_ID,
            assigned_at=_ago(days=38), started_at=_ago(days=37),
            due_at=_ago(days=20), completed_at=_ago(days=18),
            status="completed",
            created_at=_ago(days=38),
        ),
        Assignment(
            id=ASSIGN4B_ID, task_id=TASK4B_ID, agent_id=AGENT_DESIGNBOT_ID,
            bid_id=BID4B_DB_ID,
            assigned_at=_ago(days=30), started_at=_ago(days=29),
            due_at=_ago(days=10), completed_at=_ago(days=8),
            status="completed",
            created_at=_ago(days=30),
        ),

        # Job 5 task 5A
        Assignment(
            id=ASSIGN5A_ID, task_id=TASK5A_ID, agent_id=AGENT_TESTRUNNER_ID,
            bid_id=BID5A_TR_ID,
            assigned_at=_ago(days=10), started_at=_ago(days=9),
            due_at=_ago(days=-3),
            status="active",
            created_at=_ago(days=10),
        ),
    ]


def _create_submissions() -> list[Submission]:
    return [
        # Job 1 — partial submissions (in-progress work)
        Submission(
            id=SUB1A_ID, task_id=TASK1A_ID, agent_id=AGENT_CODECRAFT_ID,
            assignment_id=ASSIGN1A_ID,
            output_json={
                "model_type": "als_implicit",
                "ndcg_at_10": 0.412,
                "map_at_5": 0.287,
                "model_artifact": "s3://taskmatch-artifacts/models/recsys-v1.onnx",
            },
            artifact_urls_json={
                "model": "s3://taskmatch-artifacts/models/recsys-v1.onnx",
                "notebook": "s3://taskmatch-artifacts/notebooks/recsys-eval.ipynb",
            },
            summary="Collaborative filtering model trained on 50k interactions. NDCG@10=0.412 exceeds threshold.",
            status="under_review",
            submitted_at=_ago(days=3),
            created_at=_ago(days=3),
        ),
        Submission(
            id=SUB1B_ID, task_id=TASK1B_ID, agent_id=AGENT_CODECRAFT_ID,
            assignment_id=ASSIGN1B_ID,
            output_json={
                "endpoints_implemented": [
                    "GET /recommendations/{user_id}",
                    "POST /recommendations/batch",
                ],
                "avg_latency_ms": 142,
                "p99_latency_ms": 189,
            },
            artifact_urls_json={
                "source": "s3://taskmatch-artifacts/code/recsys-api-v1.tar.gz",
            },
            summary="FastAPI endpoints with Redis caching. P99 latency at 189ms, within target.",
            status="under_review",
            submitted_at=_ago(days=4),
            created_at=_ago(days=4),
        ),

        # Job 3 — all submitted (under_review phase)
        Submission(
            id=SUB3A_ID, task_id=TASK3A_ID, agent_id=AGENT_DATAWIZ_ID,
            assignment_id=ASSIGN3A_ID,
            output_json={
                "model": "distilbert-sentiment-fine-tuned",
                "accuracy": 0.934,
                "f1_score": 0.921,
                "processing_speed": "850 docs/sec",
            },
            artifact_urls_json={
                "model": "s3://taskmatch-artifacts/models/sentiment-v2.pt",
                "evaluation": "s3://taskmatch-artifacts/reports/sentiment-eval.pdf",
            },
            summary="DistilBERT model fine-tuned on 25k labeled samples. 93.4% accuracy exceeds 90% target.",
            status="approved",
            submitted_at=_ago(days=9),
            created_at=_ago(days=9),
        ),
        Submission(
            id=SUB3B_ID, task_id=TASK3B_ID, agent_id=AGENT_DATAWIZ_ID,
            assignment_id=ASSIGN3B_ID,
            output_json={
                "components": ["SentimentTrend", "KeywordCloud", "AlertConfig", "DashboardLayout"],
                "websocket_integration": True,
                "lighthouse_score": 88,
            },
            artifact_urls_json={
                "source": "s3://taskmatch-artifacts/code/sentiment-dashboard-v1.tar.gz",
                "demo_url": "https://demo.taskmatch.dev/sentiment",
            },
            summary="React dashboard with WebSocket real-time updates. Lighthouse score 88 (could be improved).",
            status="under_review",
            submitted_at=_ago(days=5),
            created_at=_ago(days=5),
        ),
        Submission(
            id=SUB3C_ID, task_id=TASK3C_ID, agent_id=AGENT_CODECRAFT_ID,
            assignment_id=ASSIGN3C_ID,
            output_json={
                "connectors": ["zendesk_ticket_stream", "twitter_v2_stream"],
                "rate_limit_handling": "exponential_backoff",
                "throughput": "200 events/sec",
            },
            artifact_urls_json={
                "source": "s3://taskmatch-artifacts/code/connectors-v1.tar.gz",
            },
            summary="Zendesk and Twitter connectors with robust rate limiting. Handles 200 events/sec sustained.",
            status="under_review",
            submitted_at=_ago(days=6),
            created_at=_ago(days=6),
        ),

        # Job 4 — completed
        Submission(
            id=SUB4A_ID, task_id=TASK4A_ID, agent_id=AGENT_DESIGNBOT_ID,
            assignment_id=ASSIGN4A_ID,
            output_json={
                "screens_count": 5,
                "breakpoints": ["mobile-375", "tablet-768", "desktop-1440"],
                "figma_link": "https://figma.com/file/taskmatch-landing-v2",
            },
            summary="5 responsive screen designs delivered in Figma covering all sections and breakpoints.",
            status="approved",
            submitted_at=_ago(days=19),
            created_at=_ago(days=19),
        ),
        Submission(
            id=SUB4B_ID, task_id=TASK4B_ID, agent_id=AGENT_DESIGNBOT_ID,
            assignment_id=ASSIGN4B_ID,
            output_json={
                "framework": "nextjs-14",
                "hosting": "vercel",
                "lighthouse": {"performance": 97, "accessibility": 96, "seo": 98, "best_practices": 95},
                "live_url": "https://landing.techcorp.example.com",
            },
            summary="Next.js 14 landing page deployed to Vercel. All Lighthouse scores 95+.",
            status="approved",
            submitted_at=_ago(days=9),
            created_at=_ago(days=9),
        ),

        # Job 5 — submitted
        Submission(
            id=SUB5A_ID, task_id=TASK5A_ID, agent_id=AGENT_TESTRUNNER_ID,
            assignment_id=ASSIGN5A_ID,
            output_json={
                "services_covered": 12,
                "total_tests": 347,
                "coverage_overall": 0.64,
                "ci_integration": "github-actions",
            },
            artifact_urls_json={
                "report": "s3://taskmatch-artifacts/reports/coverage-baseline.html",
            },
            summary="347 unit tests across 12 services. 64% overall coverage, exceeding 60% baseline target.",
            status="submitted",
            submitted_at=_ago(days=2),
            created_at=_ago(days=2),
        ),
    ]


def _create_reviews() -> list[ValidationReview]:
    return [
        # Job 3 — MCP auto-reviews
        ValidationReview(
            id=REV3A_ID, task_id=TASK3A_ID, submission_id=SUB3A_ID,
            reviewer_type="mcp", reviewer_user_id=None,
            decision="approved",
            notes="Accuracy 93.4% exceeds the 90% threshold. F1 score is strong. Model artifact verified.",
            score=4.6,
            created_at=_ago(days=8),
        ),
        ValidationReview(
            id=REV3B_ID, task_id=TASK3B_ID, submission_id=SUB3B_ID,
            reviewer_type="mcp", reviewer_user_id=None,
            decision="rework_requested",
            notes=(
                "Dashboard functional but Lighthouse score 88 is below typical quality bar. "
                "Recommend image optimization and code splitting to improve performance."
            ),
            score=3.5,
            created_at=_ago(days=4),
        ),
        ValidationReview(
            id=REV3C_ID, task_id=TASK3C_ID, submission_id=SUB3C_ID,
            reviewer_type="admin", reviewer_user_id=ADMIN_ID,
            decision="approved",
            notes="Connectors well-implemented. Rate limiting logic is solid. Approved for integration.",
            score=4.3,
            created_at=_ago(days=4),
        ),

        # Job 4 — completed reviews
        ValidationReview(
            id=REV4A_ID, task_id=TASK4A_ID, submission_id=SUB4A_ID,
            reviewer_type="client", reviewer_user_id=CLIENT2_ID,
            decision="approved",
            notes="Designs look great. Clean, modern aesthetic that matches our brand guidelines.",
            score=4.5,
            created_at=_ago(days=17),
        ),
        ValidationReview(
            id=REV4B_ID, task_id=TASK4B_ID, submission_id=SUB4B_ID,
            reviewer_type="client", reviewer_user_id=CLIENT2_ID,
            decision="approved",
            notes="Landing page is live and all Lighthouse scores exceed the 95 target. Excellent work.",
            score=4.8,
            created_at=_ago(days=7),
        ),

        # Job 5 — pending MCP review
        ValidationReview(
            id=REV5A_ID, task_id=TASK5A_ID, submission_id=SUB5A_ID,
            reviewer_type="mcp", reviewer_user_id=None,
            decision="approved",
            notes="Coverage exceeds baseline target. Test structure follows best practices. CI pipeline verified.",
            score=4.2,
            created_at=_ago(days=1),
        ),
    ]


def _create_payments() -> list[PaymentRecord]:
    return [
        # Job 1 — escrow pending
        PaymentRecord(
            id=PAY1_ID,
            job_id=JOB1_ID, task_id=None,
            client_user_id=CLIENT1_ID, developer_user_id=DEV1_ID,
            amount=Decimal("8600.00"),
            status="pending",
            description="Escrow for E-commerce Recommendation Engine",
            metadata_json={"escrow_type": "full_job", "milestone": "start"},
            created_at=_ago(days=18),
        ),
        # Job 3 — releasable (work submitted, under review)
        PaymentRecord(
            id=PAY3_ID,
            job_id=JOB3_ID, task_id=None,
            client_user_id=CLIENT2_ID, developer_user_id=DEV1_ID,
            amount=Decimal("13700.00"),
            status="releasable",
            description="Payment for Customer Sentiment Analysis Dashboard",
            metadata_json={"escrow_type": "full_job", "milestone": "delivery"},
            created_at=_ago(days=25),
        ),
        # Job 4 — completed
        PaymentRecord(
            id=PAY4_ID,
            job_id=JOB4_ID, task_id=None,
            client_user_id=CLIENT2_ID, developer_user_id=DEV2_ID,
            amount=Decimal("5400.00"),
            status="completed",
            description="Final payment for Mobile App Landing Page",
            metadata_json={"escrow_type": "full_job", "milestone": "completed", "paid_at": str(_ago(days=5))},
            created_at=_ago(days=35),
        ),
        # Job 5 — pending
        PaymentRecord(
            id=PAY5_ID,
            job_id=JOB5_ID, task_id=None,
            client_user_id=CLIENT1_ID, developer_user_id=DEV3_ID,
            amount=Decimal("5100.00"),
            status="pending",
            description="Escrow for Automated Test Suite",
            metadata_json={"escrow_type": "full_job", "milestone": "start"},
            created_at=_ago(days=10),
        ),
    ]


def _create_mcp_decisions() -> list[MCPDecision]:
    return [
        # Formatting decision for Job 1
        MCPDecision(
            id=MCP1_ID,
            entity_type="job",
            entity_id=str(JOB1_ID),
            decision_type="formatting",
            input_snapshot_json={
                "raw_description": "Build a machine-learning-powered product recommendation engine...",
                "title": "E-commerce Product Recommendation Engine",
            },
            output_snapshot_json={
                "formatted_summary": (
                    "ML-powered recommendation engine: collaborative filtering + "
                    "content-based hybrid model. FastAPI integration with sub-200ms "
                    "latency. Full test suite and K8s deployment."
                ),
                "extracted_requirements": ["python", "fastapi", "ml", "kubernetes"],
            },
            reasoning_summary=(
                "Identified core ML and infrastructure requirements. "
                "Summarized into a concise technical brief covering model type, "
                "API framework, latency SLA, and deployment target."
            ),
            confidence_score=0.94,
            created_at=_ago(days=19),
        ),
        # Decomposition decision for Job 1
        MCPDecision(
            id=MCP2_ID,
            entity_type="job",
            entity_id=str(JOB1_ID),
            decision_type="decomposition",
            input_snapshot_json={
                "formatted_summary": "ML-powered recommendation engine...",
                "budget_range": [5000, 15000],
            },
            output_snapshot_json={
                "tasks_count": 3,
                "tasks": [
                    {"title": "Build collaborative filtering model", "type": "coding", "budget": 5000},
                    {"title": "Implement FastAPI recommendation endpoints", "type": "coding", "budget": 4000},
                    {"title": "Write integration and load tests", "type": "testing", "budget": 2500},
                ],
            },
            reasoning_summary=(
                "Decomposed into 3 sequential tasks: ML model training, "
                "API integration, and quality assurance. Budget allocated "
                "proportionally to complexity."
            ),
            confidence_score=0.91,
            created_at=_ago(days=18),
        ),
        # Formatting decision for Job 3
        MCPDecision(
            id=MCP3_ID,
            entity_type="job",
            entity_id=str(JOB3_ID),
            decision_type="formatting",
            input_snapshot_json={
                "raw_description": "Create an analytics dashboard that processes...",
                "title": "Customer Sentiment Analysis Dashboard",
            },
            output_snapshot_json={
                "formatted_summary": (
                    "Real-time sentiment dashboard: NLP pipeline processing "
                    "Zendesk tickets + Twitter. React frontend with trend charts "
                    "and alerting."
                ),
                "extracted_requirements": ["nlp", "zendesk", "twitter", "react", "websocket"],
            },
            reasoning_summary=(
                "Multi-integration project requiring NLP backend and reactive "
                "frontend. Highlighted external API dependencies and real-time "
                "requirements."
            ),
            confidence_score=0.92,
            created_at=_ago(days=29),
        ),
        # Matching decision for Job 3 tasks
        MCPDecision(
            id=MCP4_ID,
            entity_type="job",
            entity_id=str(JOB3_ID),
            decision_type="matching",
            input_snapshot_json={
                "tasks": [
                    {"id": str(TASK3A_ID), "type": "data_analysis"},
                    {"id": str(TASK3B_ID), "type": "coding"},
                    {"id": str(TASK3C_ID), "type": "coding"},
                ],
                "available_agents": [
                    {"id": str(AGENT_DATAWIZ_ID), "capabilities": ["data_analysis", "visualization"]},
                    {"id": str(AGENT_CODECRAFT_ID), "capabilities": ["code_generation", "code_review"]},
                ],
            },
            output_snapshot_json={
                "matches": [
                    {"task_id": str(TASK3A_ID), "agent_id": str(AGENT_DATAWIZ_ID), "score": 0.94},
                    {"task_id": str(TASK3B_ID), "agent_id": str(AGENT_DATAWIZ_ID), "score": 0.78},
                    {"task_id": str(TASK3C_ID), "agent_id": str(AGENT_CODECRAFT_ID), "score": 0.91},
                ],
            },
            reasoning_summary=(
                "DataWiz best suited for NLP and dashboard tasks based on data "
                "analysis capability. CodeCraft matched to API integration task. "
                "Considered capability overlap and agent workload."
            ),
            confidence_score=0.88,
            created_at=_ago(days=26),
        ),
    ]


def _create_audit_logs() -> list[AuditLog]:
    return [
        AuditLog(
            id=_uuid(),
            actor_type="user",
            actor_id=str(ADMIN_ID),
            action="user.create",
            entity_type="user",
            entity_id=str(CLIENT1_ID),
            payload_json={"email": "client1@example.com", "role": "client"},
            created_at=_ago(days=60),
        ),
        AuditLog(
            id=_uuid(),
            actor_type="user",
            actor_id=str(CLIENT1_ID),
            action="job.create",
            entity_type="job",
            entity_id=str(JOB1_ID),
            payload_json={"title": "E-commerce Product Recommendation Engine", "budget_max": 15000},
            created_at=_ago(days=20),
        ),
        AuditLog(
            id=_uuid(),
            actor_type="mcp",
            actor_id=None,
            action="job.format",
            entity_type="job",
            entity_id=str(JOB1_ID),
            payload_json={"mcp_decision_id": str(MCP1_ID)},
            created_at=_ago(days=19),
        ),
        AuditLog(
            id=_uuid(),
            actor_type="mcp",
            actor_id=None,
            action="job.decompose",
            entity_type="job",
            entity_id=str(JOB1_ID),
            payload_json={"mcp_decision_id": str(MCP2_ID), "tasks_created": 3},
            created_at=_ago(days=18),
        ),
        AuditLog(
            id=_uuid(),
            actor_type="agent",
            actor_id=str(AGENT_CODECRAFT_ID),
            action="bid.submit",
            entity_type="bid",
            entity_id=str(BID1A_CC_ID),
            payload_json={"task_id": str(TASK1A_ID), "price": 4800},
            created_at=_ago(days=17),
        ),
        AuditLog(
            id=_uuid(),
            actor_type="system",
            actor_id=None,
            action="assignment.create",
            entity_type="assignment",
            entity_id=str(ASSIGN1A_ID),
            payload_json={"task_id": str(TASK1A_ID), "agent_id": str(AGENT_CODECRAFT_ID)},
            created_at=_ago(days=16),
        ),
        AuditLog(
            id=_uuid(),
            actor_type="user",
            actor_id=str(CLIENT2_ID),
            action="job.create",
            entity_type="job",
            entity_id=str(JOB3_ID),
            payload_json={"title": "Customer Sentiment Analysis Dashboard", "budget_max": 20000},
            created_at=_ago(days=30),
        ),
        AuditLog(
            id=_uuid(),
            actor_type="user",
            actor_id=str(CLIENT2_ID),
            action="review.approve",
            entity_type="submission",
            entity_id=str(SUB4B_ID),
            payload_json={"decision": "approved", "score": 4.8},
            created_at=_ago(days=7),
        ),
        AuditLog(
            id=_uuid(),
            actor_type="system",
            actor_id=None,
            action="payment.complete",
            entity_type="payment",
            entity_id=str(PAY4_ID),
            payload_json={"amount": 5400, "job_id": str(JOB4_ID)},
            created_at=_ago(days=5),
        ),
        AuditLog(
            id=_uuid(),
            actor_type="user",
            actor_id=str(ADMIN_ID),
            action="agent.status_change",
            entity_type="agent",
            entity_id=str(AGENT_DESIGNBOT_ID),
            payload_json={"old_status": "active", "new_status": "paused", "reason": "Low performance scores"},
            created_at=_ago(days=3),
        ),
    ]


def _create_feedback_notes() -> list[FeedbackNote]:
    return [
        FeedbackNote(
            id=_uuid(),
            task_id=TASK3A_ID,
            agent_id=AGENT_DATAWIZ_ID,
            created_by_user_id=CLIENT2_ID,
            category="quality",
            note=(
                "Excellent sentiment model accuracy. The DistilBERT fine-tuning "
                "approach was well-executed and the evaluation report was thorough."
            ),
            created_at=_ago(days=7),
        ),
        FeedbackNote(
            id=_uuid(),
            task_id=TASK4A_ID,
            agent_id=AGENT_DESIGNBOT_ID,
            created_by_user_id=CLIENT2_ID,
            category="quality",
            note=(
                "Design quality is acceptable but could be more polished. "
                "Some inconsistencies in spacing and typography between breakpoints."
            ),
            created_at=_ago(days=15),
        ),
        FeedbackNote(
            id=_uuid(),
            task_id=TASK4B_ID,
            agent_id=AGENT_DESIGNBOT_ID,
            created_by_user_id=CLIENT2_ID,
            category="speed",
            note="Delivery was slower than expected. Took 21 days instead of the estimated 10 days.",
            created_at=_ago(days=7),
        ),
        FeedbackNote(
            id=_uuid(),
            task_id=None,
            agent_id=AGENT_CODECRAFT_ID,
            created_by_user_id=ADMIN_ID,
            category="reliability",
            note=(
                "CodeCraft AI has been consistently reliable across 47 completed "
                "tasks. Heartbeat monitoring shows 99.8% uptime over the past 30 days."
            ),
            created_at=_ago(days=2),
        ),
        FeedbackNote(
            id=_uuid(),
            task_id=None,
            agent_id=AGENT_CONTENTFORGE_ID,
            created_by_user_id=ADMIN_ID,
            category="quality",
            note=(
                "ContentForge continues to deliver the highest average quality "
                "scores on the platform. Consider featuring as a recommended agent."
            ),
            created_at=_ago(days=1),
        ),
    ]


# ---------------------------------------------------------------------------
# Main seeding logic
# ---------------------------------------------------------------------------


async def seed(session: AsyncSession) -> None:
    """Insert all demo data. Idempotent — skips if admin user already exists."""

    # Check idempotency: if admin user already exists, skip.
    result = await session.execute(
        select(User).where(User.email == "admin@taskmatch.ai")
    )
    if result.scalars().first() is not None:
        print("[seed] Admin user already exists — skipping seed.")
        return

    print("[seed] Seeding database with demo data...")

    # Users
    users = _create_users()
    session.add_all(users)
    await session.flush()
    print(f"  Created {len(users)} users")

    # Agents
    agents = _create_agents()
    session.add_all(agents)
    await session.flush()
    print(f"  Created {len(agents)} agents")

    # Agent capabilities
    caps = _create_capabilities()
    session.add_all(caps)
    await session.flush()
    print(f"  Created {len(caps)} agent capabilities")

    # Jobs
    jobs = _create_jobs()
    session.add_all(jobs)
    await session.flush()
    print(f"  Created {len(jobs)} jobs")

    # Job requirements
    reqs = _create_job_requirements()
    session.add_all(reqs)
    await session.flush()
    print(f"  Created {len(reqs)} job requirements")

    # Tasks
    tasks = _create_tasks()
    session.add_all(tasks)
    await session.flush()
    print(f"  Created {len(tasks)} tasks")

    # Bids
    bids = _create_bids()
    session.add_all(bids)
    await session.flush()
    print(f"  Created {len(bids)} bids")

    # Assignments
    assignments = _create_assignments()
    session.add_all(assignments)
    await session.flush()
    print(f"  Created {len(assignments)} assignments")

    # Submissions
    submissions = _create_submissions()
    session.add_all(submissions)
    await session.flush()
    print(f"  Created {len(submissions)} submissions")

    # Validation reviews
    reviews = _create_reviews()
    session.add_all(reviews)
    await session.flush()
    print(f"  Created {len(reviews)} validation reviews")

    # Payment records
    payments = _create_payments()
    session.add_all(payments)
    await session.flush()
    print(f"  Created {len(payments)} payment records")

    # MCP decisions
    mcp_decisions = _create_mcp_decisions()
    session.add_all(mcp_decisions)
    await session.flush()
    print(f"  Created {len(mcp_decisions)} MCP decisions")

    # Audit logs
    audit_logs = _create_audit_logs()
    session.add_all(audit_logs)
    await session.flush()
    print(f"  Created {len(audit_logs)} audit log entries")

    # Feedback notes
    feedback_notes = _create_feedback_notes()
    session.add_all(feedback_notes)
    await session.flush()
    print(f"  Created {len(feedback_notes)} feedback notes")

    await session.commit()
    print("[seed] Done. Database seeded successfully.")


async def main() -> None:
    """Entry point for ``python -m scripts.seed``."""
    async with async_session_factory() as session:
        await seed(session)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
