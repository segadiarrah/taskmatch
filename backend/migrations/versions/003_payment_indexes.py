"""Align payment lookup indexes with the ORM metadata.

Revision ID: 003
Revises: 002
"""

from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Existing installations may already have these from metadata.create_all.
    op.execute("CREATE INDEX IF NOT EXISTS ix_payment_records_developer_user_id ON payment_records (developer_user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_payment_records_task_id ON payment_records (task_id)")


def downgrade() -> None:
    op.drop_index("ix_payment_records_task_id", table_name="payment_records")
    op.drop_index("ix_payment_records_developer_user_id", table_name="payment_records")
