"""Quotes, delivery plans and access grants.

Adds the pricing gate (TaskMatch sets a price the client approves before any work
runs) and the delivery/handover layer, including the encrypted credential vault.

Revision ID: 002
Revises: 001
Create Date: 2026-08-10
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _timestamps() -> list[sa.Column]:
    return [
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
    ]


def upgrade() -> None:
    # ----------------------------------------------------------------- quotes
    op.create_table(
        "quotes",
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
            "status", sa.String(32), nullable=False, server_default="draft"
        ),
        sa.Column("currency", sa.String(8), nullable=False, server_default="EUR"),
        sa.Column("subtotal", sa.Numeric(14, 2), nullable=False),
        sa.Column("platform_fee", sa.Numeric(14, 2), nullable=False),
        sa.Column("total", sa.Numeric(14, 2), nullable=False),
        sa.Column("human_equivalent_low", sa.Numeric(14, 2), nullable=True),
        sa.Column("human_equivalent_high", sa.Numeric(14, 2), nullable=True),
        sa.Column("savings_vs_human", sa.Float, nullable=True),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("pricing_version", sa.String(32), nullable=False),
        sa.Column("breakdown_json", postgresql.JSON, nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text, nullable=True),
        *_timestamps(),
    )
    op.create_index("ix_quotes_job_id", "quotes", ["job_id"])
    op.create_index("ix_quotes_status", "quotes", ["status"])

    # ------------------------------------------------------------ task_quotes
    op.create_table(
        "task_quotes",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "quote_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("quotes.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("route", sa.String(16), nullable=False, server_default="llm"),
        sa.Column("complexity", sa.String(4), nullable=False),
        sa.Column("task_type", sa.String(128), nullable=False),
        sa.Column("model_slug", sa.String(128), nullable=True),
        sa.Column(
            "est_input_tokens", sa.Numeric(14, 0), nullable=False, server_default="0"
        ),
        sa.Column(
            "est_output_tokens", sa.Numeric(14, 0), nullable=False, server_default="0"
        ),
        sa.Column("token_cost", sa.Numeric(14, 4), nullable=False, server_default="0"),
        sa.Column(
            "compute_cost", sa.Numeric(14, 2), nullable=False, server_default="0"
        ),
        sa.Column(
            "orchestration_fee", sa.Numeric(14, 2), nullable=False, server_default="0"
        ),
        sa.Column(
            "validation_cost", sa.Numeric(14, 2), nullable=False, server_default="0"
        ),
        sa.Column("price", sa.Numeric(14, 2), nullable=False),
        sa.Column("human_hours", sa.Float, nullable=True),
        sa.Column("human_price_low", sa.Numeric(14, 2), nullable=True),
        sa.Column("human_price_high", sa.Numeric(14, 2), nullable=True),
        sa.Column("discipline", sa.String(64), nullable=True),
        sa.Column("seniority", sa.String(32), nullable=True),
        sa.Column("accepted_offer", sa.Numeric(14, 2), nullable=True),
        sa.Column(
            "accepted_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("rationale", sa.Text, nullable=True),
        sa.Column("breakdown_json", postgresql.JSON, nullable=True),
        *_timestamps(),
    )
    op.create_index("ix_task_quotes_quote_id", "task_quotes", ["quote_id"])
    op.create_index("ix_task_quotes_task_id", "task_quotes", ["task_id"])
    op.create_index("ix_task_quotes_route", "task_quotes", ["route"])

    # --------------------------------------------------------- delivery_plans
    op.create_table(
        "delivery_plans",
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
        sa.Column("mode", sa.String(32), nullable=False, server_default="document"),
        sa.Column("status", sa.String(32), nullable=False, server_default="planned"),
        sa.Column("target", sa.String(512), nullable=True),
        sa.Column("requirements", postgresql.JSON, nullable=True),
        sa.Column("runbook", sa.Text, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("signed_off_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("accesses_revoked_at", sa.DateTime(timezone=True), nullable=True),
        *_timestamps(),
        sa.UniqueConstraint("job_id", name="uq_delivery_plans_job_id"),
    )
    op.create_index("ix_delivery_plans_job_id", "delivery_plans", ["job_id"])
    op.create_index("ix_delivery_plans_status", "delivery_plans", ["status"])

    # ---------------------------------------------------------- access_grants
    op.create_table(
        "access_grants",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "delivery_plan_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("delivery_plans.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "job_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("label", sa.String(256), nullable=False),
        sa.Column("kind", sa.String(32), nullable=False, server_default="other"),
        sa.Column(
            "direction",
            sa.String(32),
            nullable=False,
            server_default="client_to_platform",
        ),
        # Fernet ciphertext. Nullable because revocation clears it in place.
        sa.Column("secret_ciphertext", sa.Text, nullable=True),
        sa.Column("hint", sa.String(128), nullable=True),
        sa.Column(
            "created_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_accessed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("access_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("max_accesses", sa.Integer, nullable=False, server_default="5"),
        *_timestamps(),
    )
    op.create_index(
        "ix_access_grants_delivery_plan_id", "access_grants", ["delivery_plan_id"]
    )
    op.create_index("ix_access_grants_job_id", "access_grants", ["job_id"])


def downgrade() -> None:
    op.drop_index("ix_access_grants_job_id", table_name="access_grants")
    op.drop_index("ix_access_grants_delivery_plan_id", table_name="access_grants")
    op.drop_table("access_grants")

    op.drop_index("ix_delivery_plans_status", table_name="delivery_plans")
    op.drop_index("ix_delivery_plans_job_id", table_name="delivery_plans")
    op.drop_table("delivery_plans")

    op.drop_index("ix_task_quotes_route", table_name="task_quotes")
    op.drop_index("ix_task_quotes_task_id", table_name="task_quotes")
    op.drop_index("ix_task_quotes_quote_id", table_name="task_quotes")
    op.drop_table("task_quotes")

    op.drop_index("ix_quotes_status", table_name="quotes")
    op.drop_index("ix_quotes_job_id", table_name="quotes")
    op.drop_table("quotes")
