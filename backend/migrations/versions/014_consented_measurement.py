"""Consent-based pseudonymous daily usage, invite codes and verified capture time."""
import sqlalchemy as sa
from alembic import op

revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("SET LOCAL lock_timeout='3s'")
    op.add_column("job_fundings", sa.Column("captured_at", sa.DateTime(timezone=True)))
    op.create_table("referral_links",
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("code", sa.String(32), nullable=False, unique=True))
    op.create_table("measurement_visitors",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("digest", sa.String(64), nullable=False, unique=True),
        sa.Column("consented_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("language", sa.String(2), nullable=False),
        sa.Column("account_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True),
        sa.Column("referred_by", sa.Uuid(), sa.ForeignKey("users.id", ondelete="SET NULL")))
    op.create_index("ix_measurement_visitors_consented_at", "measurement_visitors", ["consented_at"])
    op.create_table("measurement_events",
        sa.Column("visitor_id", sa.Uuid(), sa.ForeignKey("measurement_visitors.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("utc_day", sa.Date(), primary_key=True),
        sa.Column("kind", sa.String(32), primary_key=True))


def downgrade():
    if op.get_bind().scalar(sa.text("""SELECT EXISTS(SELECT 1 FROM measurement_visitors)
        OR EXISTS(SELECT 1 FROM referral_links) OR EXISTS(SELECT 1 FROM job_fundings WHERE captured_at IS NOT NULL)""")):
        raise RuntimeError("Retain measured cohorts, referral links and capture history before downgrade")
    op.drop_table("measurement_events")
    op.drop_table("measurement_visitors")
    op.drop_table("referral_links")
    op.drop_column("job_fundings", "captured_at")
