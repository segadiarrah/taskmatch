"""Initial schema — all tables.

Revision ID: 001
Revises: None
Create Date: 2026-03-22
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------ users
    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("email", sa.String(320), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(1024), nullable=False),
        sa.Column("role", sa.String(32), nullable=False),
        sa.Column("full_name", sa.String(256), nullable=False),
        sa.Column(
            "is_active", sa.Boolean, nullable=False, server_default=sa.text("true")
        ),
        sa.Column("organization_name", sa.String(256), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_role", "users", ["role"])

    # ----------------------------------------------------------------- agents
    op.create_table(
        "agents",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "developer_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("slug", sa.String(256), unique=True, nullable=False),
        sa.Column("description", sa.Text, nullable=False, server_default=""),
        sa.Column("endpoint_url", sa.String(2048), nullable=False),
        sa.Column(
            "auth_type", sa.String(32), nullable=False, server_default="none"
        ),
        sa.Column("auth_credentials_encrypted", sa.Text, nullable=True),
        sa.Column(
            "status", sa.String(32), nullable=False, server_default="active"
        ),
        sa.Column("supported_task_types", postgresql.JSON, nullable=True),
        sa.Column(
            "average_score", sa.Float, nullable=False, server_default=sa.text("0")
        ),
        sa.Column(
            "success_rate", sa.Float, nullable=False, server_default=sa.text("0")
        ),
        sa.Column(
            "completed_tasks_count",
            sa.Integer,
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "last_heartbeat_at", sa.DateTime(timezone=True), nullable=True
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_agents_developer_user_id", "agents", ["developer_user_id"])
    op.create_index("ix_agents_slug", "agents", ["slug"])
    op.create_index("ix_agents_status", "agents", ["status"])

    # ------------------------------------------------------ agent_capabilities
    op.create_table(
        "agent_capabilities",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("capability_name", sa.String(256), nullable=False),
        sa.Column(
            "version", sa.String(64), nullable=False, server_default="1.0"
        ),
        sa.Column("metadata_json", postgresql.JSON, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_agent_capabilities_agent_id", "agent_capabilities", ["agent_id"]
    )
    op.create_index(
        "ix_agent_capabilities_name", "agent_capabilities", ["capability_name"]
    )

    # ------------------------------------------------------------------- jobs
    op.create_table(
        "jobs",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "client_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(512), nullable=False),
        sa.Column("raw_description", sa.Text, nullable=False),
        sa.Column("formatted_summary", sa.Text, nullable=True),
        sa.Column("budget_min", sa.Numeric(14, 2), nullable=False),
        sa.Column("budget_max", sa.Numeric(14, 2), nullable=False),
        sa.Column(
            "currency", sa.String(8), nullable=False, server_default="USD"
        ),
        sa.Column("deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "status", sa.String(32), nullable=False, server_default="draft"
        ),
        sa.Column("preferred_agent_ids", postgresql.JSON, nullable=True),
        sa.Column(
            "auto_select_enabled",
            sa.Boolean,
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("metadata_json", postgresql.JSON, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_jobs_client_user_id", "jobs", ["client_user_id"])
    op.create_index("ix_jobs_status", "jobs", ["status"])

    # -------------------------------------------------------- job_requirements
    op.create_table(
        "job_requirements",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "job_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("requirement_type", sa.String(128), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column(
            "priority", sa.String(32), nullable=False, server_default="medium"
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_job_requirements_job_id", "job_requirements", ["job_id"]
    )

    # ------------------------------------------------------------------ tasks
    op.create_table(
        "tasks",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "job_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "parent_task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("title", sa.String(512), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("task_type", sa.String(128), nullable=False),
        sa.Column("input_spec_json", postgresql.JSON, nullable=True),
        sa.Column("output_spec_json", postgresql.JSON, nullable=True),
        sa.Column("validation_spec_json", postgresql.JSON, nullable=True),
        sa.Column("budget", sa.Numeric(14, 2), nullable=True),
        sa.Column(
            "priority", sa.Integer, nullable=False, server_default=sa.text("1")
        ),
        sa.Column(
            "status", sa.String(32), nullable=False, server_default="pending"
        ),
        sa.Column(
            "max_retries",
            sa.Integer,
            nullable=False,
            server_default=sa.text("3"),
        ),
        sa.Column(
            "retry_count",
            sa.Integer,
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_tasks_job_id", "tasks", ["job_id"])
    op.create_index("ix_tasks_parent_task_id", "tasks", ["parent_task_id"])
    op.create_index("ix_tasks_status", "tasks", ["status"])
    op.create_index("ix_tasks_task_type", "tasks", ["task_type"])

    # ------------------------------------------------------------------- bids
    op.create_table(
        "bids",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("price", sa.Numeric(14, 2), nullable=False),
        sa.Column("eta_hours", sa.Float, nullable=False),
        sa.Column("confidence_score", sa.Float, nullable=False),
        sa.Column("proposal_text", sa.Text, nullable=True),
        sa.Column(
            "status", sa.String(32), nullable=False, server_default="submitted"
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_bids_task_id", "bids", ["task_id"])
    op.create_index("ix_bids_agent_id", "bids", ["agent_id"])
    op.create_index("ix_bids_status", "bids", ["status"])

    # ------------------------------------------------------------- assignments
    op.create_table(
        "assignments",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "bid_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("bids.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "assigned_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "status", sa.String(32), nullable=False, server_default="pending"
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_assignments_task_id", "assignments", ["task_id"])
    op.create_index("ix_assignments_agent_id", "assignments", ["agent_id"])
    op.create_index("ix_assignments_bid_id", "assignments", ["bid_id"])
    op.create_index("ix_assignments_status", "assignments", ["status"])

    # ------------------------------------------------------------ submissions
    op.create_table(
        "submissions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "assignment_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("assignments.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("output_json", postgresql.JSON, nullable=False),
        sa.Column("artifact_urls_json", postgresql.JSON, nullable=True),
        sa.Column("summary", sa.Text, nullable=True),
        sa.Column(
            "status", sa.String(32), nullable=False, server_default="submitted"
        ),
        sa.Column(
            "submitted_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_submissions_task_id", "submissions", ["task_id"])
    op.create_index("ix_submissions_agent_id", "submissions", ["agent_id"])
    op.create_index(
        "ix_submissions_assignment_id", "submissions", ["assignment_id"]
    )
    op.create_index("ix_submissions_status", "submissions", ["status"])

    # ------------------------------------------------------- validation_reviews
    op.create_table(
        "validation_reviews",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "submission_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("submissions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("reviewer_type", sa.String(32), nullable=False),
        sa.Column(
            "reviewer_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("decision", sa.String(32), nullable=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("score", sa.Float, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_validation_reviews_task_id", "validation_reviews", ["task_id"]
    )
    op.create_index(
        "ix_validation_reviews_submission_id",
        "validation_reviews",
        ["submission_id"],
    )
    op.create_index(
        "ix_validation_reviews_reviewer_user_id",
        "validation_reviews",
        ["reviewer_user_id"],
    )

    # --------------------------------------------------------- payment_records
    op.create_table(
        "payment_records",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "job_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "client_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "developer_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("gross_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("platform_fee", sa.Numeric(14, 2), nullable=False),
        sa.Column("net_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column(
            "currency", sa.String(8), nullable=False, server_default="USD"
        ),
        sa.Column(
            "payment_status", sa.String(32), nullable=False, server_default="pending"
        ),
        sa.Column("provider", sa.String(64), nullable=False, server_default="stripe"),
        sa.Column("provider_ref", sa.String(256), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_payment_records_job_id", "payment_records", ["job_id"]
    )
    op.create_index(
        "ix_payment_records_client_user_id",
        "payment_records",
        ["client_user_id"],
    )
    op.create_index(
        "ix_payment_records_payment_status", "payment_records", ["payment_status"]
    )

    # ---------------------------------------------------------- mcp_decisions
    op.create_table(
        "mcp_decisions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("entity_type", sa.String(128), nullable=False),
        sa.Column("entity_id", sa.String(256), nullable=False),
        sa.Column("decision_type", sa.String(32), nullable=False),
        sa.Column("input_snapshot_json", postgresql.JSON, nullable=False),
        sa.Column("output_snapshot_json", postgresql.JSON, nullable=False),
        sa.Column("reasoning_summary", sa.Text, nullable=True),
        sa.Column("confidence_score", sa.Float, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_mcp_decisions_entity_type_entity_id",
        "mcp_decisions",
        ["entity_type", "entity_id"],
    )
    op.create_index(
        "ix_mcp_decisions_decision_type", "mcp_decisions", ["decision_type"]
    )

    # ------------------------------------------------------------ audit_logs
    op.create_table(
        "audit_logs",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("actor_type", sa.String(32), nullable=False),
        sa.Column("actor_id", sa.String(256), nullable=True),
        sa.Column("action", sa.String(256), nullable=False),
        sa.Column("entity_type", sa.String(128), nullable=False),
        sa.Column("entity_id", sa.String(256), nullable=False),
        sa.Column("payload_json", postgresql.JSON, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_audit_logs_actor_type", "audit_logs", ["actor_type"])
    op.create_index(
        "ix_audit_logs_entity_type_entity_id",
        "audit_logs",
        ["entity_type", "entity_id"],
    )
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])

    # --------------------------------------------------------- feedback_notes
    op.create_table(
        "feedback_notes",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("category", sa.String(32), nullable=False),
        sa.Column("note", sa.Text, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_feedback_notes_task_id", "feedback_notes", ["task_id"]
    )
    op.create_index(
        "ix_feedback_notes_agent_id", "feedback_notes", ["agent_id"]
    )
    op.create_index(
        "ix_feedback_notes_created_by_user_id",
        "feedback_notes",
        ["created_by_user_id"],
    )
    op.create_index(
        "ix_feedback_notes_category", "feedback_notes", ["category"]
    )


def downgrade() -> None:
    op.drop_table("feedback_notes")
    op.drop_table("audit_logs")
    op.drop_table("mcp_decisions")
    op.drop_table("payment_records")
    op.drop_table("validation_reviews")
    op.drop_table("submissions")
    op.drop_table("assignments")
    op.drop_table("bids")
    op.drop_table("tasks")
    op.drop_table("job_requirements")
    op.drop_table("jobs")
    op.drop_table("agent_capabilities")
    op.drop_table("agents")
    op.drop_table("users")
