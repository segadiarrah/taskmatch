"""Stripe quote funding, connected accounts and durable billing operations.

Revision ID: 004
Revises: 003
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql as pg

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def stamps():
    return [
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    ]


def upgrade():
    op.add_column(
        "jobs",
        sa.Column("billing_mode", sa.String(32), server_default="legacy_manual", nullable=False),
    )
    op.alter_column("jobs", "billing_mode", server_default="stripe")
    op.create_table(
        "job_fundings",
        sa.Column("id", pg.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "job_id",
            pg.UUID(as_uuid=True),
            sa.ForeignKey("jobs.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "quote_id",
            pg.UUID(as_uuid=True),
            sa.ForeignKey("quotes.id", ondelete="RESTRICT"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "client_user_id",
            pg.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("amount_minor", sa.BigInteger(), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("livemode", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("generation", sa.Integer(), nullable=False),
        sa.Column("checkout_session_id", sa.String(255), unique=True),
        sa.Column("checkout_url", sa.Text()),
        sa.Column("checkout_expires_at", sa.DateTime(timezone=True)),
        sa.Column("checkout_request", pg.JSON()),
        sa.Column("checkout_started_at", sa.DateTime(timezone=True)),
        sa.Column("payment_intent_id", sa.String(255), unique=True),
        sa.Column("charge_id", sa.String(255), unique=True),
        sa.Column("receipt_url", sa.Text()),
        sa.Column("refunded_minor", sa.BigInteger(), server_default="0", nullable=False),
        sa.Column("refund_id", sa.String(255)),
        sa.Column("last_error", sa.Text()),
        sa.CheckConstraint("amount_minor >= 0", name="ck_job_fundings_amount_nonnegative"),
        sa.CheckConstraint(
            "refunded_minor >= 0 AND refunded_minor <= amount_minor",
            name="ck_job_fundings_refund_bounds",
        ),
        sa.CheckConstraint("generation > 0", name="ck_job_fundings_generation_positive"),
        *stamps(),
    )
    op.create_index("ix_job_fundings_job_id", "job_fundings", ["job_id"])
    op.create_table(
        "stripe_connect_accounts",
        sa.Column(
            "user_id",
            pg.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            primary_key=True,
        ),
        sa.Column("account_id", sa.String(255), unique=True),
        sa.Column("country", sa.String(2)),
        sa.Column("details_submitted", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("transfers_enabled", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("payouts_enabled", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("requirements_json", pg.JSON(), nullable=False),
        sa.Column("livemode", sa.Boolean(), nullable=False),
        *stamps(),
    )
    op.create_table(
        "stripe_events",
        sa.Column("id", sa.String(255), primary_key=True),
        sa.Column("event_type", sa.String(128), nullable=False),
        sa.Column("livemode", sa.Boolean(), nullable=False),
        sa.Column("payload", pg.JSON(), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True)),
        *stamps(),
    )
    op.create_table(
        "billing_operations",
        sa.Column("id", pg.UUID(as_uuid=True), primary_key=True),
        sa.Column("key", sa.String(255), nullable=False, unique=True),
        sa.Column("kind", sa.String(32), nullable=False),
        sa.Column("entity_id", sa.String(255), nullable=False),
        sa.Column("status", sa.String(32), server_default="pending", nullable=False),
        sa.Column("attempts", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "available_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("locked_until", sa.DateTime(timezone=True)),
        sa.Column("external_started_at", sa.DateTime(timezone=True)),
        sa.Column("last_error", sa.Text()),
        sa.Column("payload", pg.JSON()),
        *stamps(),
    )
    op.create_index("ix_billing_operations_ready", "billing_operations", ["status", "available_at"])
    op.create_table(
        "billing_worker_heartbeat",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.add_column(
        "payment_records",
        sa.Column(
            "funding_id",
            pg.UUID(as_uuid=True),
            sa.ForeignKey("job_fundings.id", ondelete="RESTRICT"),
        ),
    )
    op.add_column("payment_records", sa.Column("transfer_id", sa.String(255)))
    op.add_column("payment_records", sa.Column("reversal_id", sa.String(255)))
    op.add_column("payment_records", sa.Column("payout_error", sa.String(500)))
    op.create_index("ix_payment_records_funding_id", "payment_records", ["funding_id"])
    op.create_index(
        "uq_payment_funding_task", "payment_records", ["funding_id", "task_id"], unique=True
    )
    op.create_unique_constraint(
        "payment_records_transfer_id_key", "payment_records", ["transfer_id"]
    )


def downgrade():
    # A rollback must never discard evidence of charges, transfers or onboarding.
    tables = ("job_fundings", "stripe_connect_accounts", "stripe_events", "billing_operations")
    op.execute("LOCK TABLE " + ", ".join(tables) + " IN ACCESS EXCLUSIVE MODE")
    connection = op.get_bind()
    if any(
        connection.execute(sa.text(f"SELECT EXISTS (SELECT 1 FROM {table})")).scalar()
        for table in tables
    ):
        raise RuntimeError(
            "Refusing to downgrade Stripe billing with persisted history; retain the schema and reconcile or restore an approved backup"
        )
    op.drop_constraint("payment_records_transfer_id_key", "payment_records", type_="unique")
    op.drop_index("uq_payment_funding_task", table_name="payment_records")
    op.drop_index("ix_payment_records_funding_id", table_name="payment_records")
    for column in ("payout_error", "reversal_id", "transfer_id", "funding_id"):
        op.drop_column("payment_records", column)
    for table in (
        "billing_worker_heartbeat",
        "billing_operations",
        "stripe_events",
        "stripe_connect_accounts",
        "job_fundings",
    ):
        op.drop_table(table)
    op.drop_column("jobs", "billing_mode")
