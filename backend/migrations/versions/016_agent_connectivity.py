"""Agent runtime connection confirmation."""
from alembic import op
import sqlalchemy as sa

revision = "016"
down_revision = "015"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("agents", sa.Column("connection_challenge_hash", sa.String(64)))
    op.add_column("agents", sa.Column("connection_challenge_until", sa.DateTime(timezone=True)))
    op.add_column("agents", sa.Column("connection_verified_at", sa.DateTime(timezone=True)))


def downgrade():
    for field in ("connection_challenge_hash", "connection_challenge_until", "connection_verified_at"):
        op.drop_column("agents", field)
