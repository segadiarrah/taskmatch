"""Explicitly published human and agent profiles; never backfill a listing."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "013"
down_revision = "012"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("SET LOCAL lock_timeout='3s'")
    op.create_table("directory_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("agent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("agents.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("kind", sa.String(12), nullable=False),
        sa.Column("display_name", sa.String(96), nullable=False),
        sa.Column("summary", sa.String(480), nullable=False),
        sa.Column("expertise", sa.String(160), nullable=False),
        sa.Column("country", sa.String(2)), sa.Column("language", sa.String(2)),
        sa.Column("published", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_directory_public_kind", "directory_profiles", ["published", "kind", "id"])


def downgrade():
    if op.get_bind().scalar(sa.text("SELECT EXISTS(SELECT 1 FROM directory_profiles)")):
        raise RuntimeError("Retain owner-authored directory profiles before downgrade")
    op.drop_table("directory_profiles")
