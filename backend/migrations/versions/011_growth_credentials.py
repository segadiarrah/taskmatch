"""Add separate credentials for aggregate commercial reports."""
from alembic import op
import sqlalchemy as sa

revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "growth_credentials",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("label", sa.String(80), nullable=False),
        sa.Column("digest", sa.String(64), nullable=False, unique=True),
        sa.Column("scope", sa.String(32), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade():
    if op.get_bind().execute(sa.text("SELECT EXISTS (SELECT 1 FROM growth_credentials)")).scalar():
        raise RuntimeError("Preserve commercial credential and revocation history")
    op.drop_table("growth_credentials")
