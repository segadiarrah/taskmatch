"""Restricted commercial messaging and suppression history."""
from alembic import op
import sqlalchemy as sa

revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def times():
    return [sa.Column(name, sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now())
            for name in ("created_at", "updated_at")]


def upgrade():
    op.create_table("outreach_recipients", sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False, unique=True),
        sa.Column("permission_reference", sa.String(160), nullable=False),
        sa.Column("suppressed", sa.String(24)), *times())
    op.create_table("outreach_messages", sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("recipient_id", sa.Uuid(), sa.ForeignKey("outreach_recipients.id"), nullable=False),
        sa.Column("credential_id", sa.Uuid(), sa.ForeignKey("growth_credentials.id"), nullable=False),
        sa.Column("campaign", sa.String(80), nullable=False),
        sa.Column("state", sa.String(24), nullable=False),
        sa.UniqueConstraint("recipient_id", "campaign", name="uq_outreach_recipient_campaign"), *times())


def downgrade():
    if op.get_bind().scalar(sa.text("SELECT EXISTS(SELECT 1 FROM outreach_recipients)")):
        raise RuntimeError("Preserve opposition and messaging history")
    op.drop_table("outreach_messages")
    op.drop_table("outreach_recipients")
