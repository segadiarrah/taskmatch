"""Registration provenance, campaign attribution and the private delivery queue."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("SET LOCAL lock_timeout='3s'")
    op.add_column("users", sa.Column("registration_origin", sa.String(16), nullable=False, server_default="unknown"))
    op.add_column("users", sa.Column("registration_attribution", postgresql.JSONB(), nullable=True))
    # Only classify known fixture identities. Other historical accounts keep
    # unknown provenance, even when a registration audit event happens to exist.
    op.execute("""UPDATE users SET registration_origin = CASE
        WHEN role = 'admin' THEN 'admin'
        WHEN lower(email) IN ('client1@example.com', 'client2@example.com', 'dev1@example.com',
                              'dev2@example.com', 'dev3@example.com') THEN 'demo'
        WHEN lower(email) IN ('browser-client@taskmatch.ai', 'browser-developer@taskmatch.ai') THEN 'seed'
        ELSE 'test' END
        WHERE role = 'admin' OR lower(email) IN ('browser-client@taskmatch.ai', 'browser-developer@taskmatch.ai')
        OR lower(split_part(email,'@',2)) IN ('example.com','example.net','example.org')
        OR lower(email) LIKE '%.test' OR lower(email) LIKE '%.invalid'""")
    op.create_table("mail_outbox",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.Column("sender_key", sa.String(64)), sa.Column("peer_key", sa.String(64)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.String(40)), sa.Column("accepted_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_mail_pending", "mail_outbox", ["next_attempt_at"], postgresql_where=sa.text("accepted_at IS NULL"))
    op.create_index("ix_mail_contact_time", "mail_outbox", ["created_at"], postgresql_where=sa.text("kind='contact'"))


def downgrade():
    if op.get_bind().scalar(sa.text("""SELECT EXISTS(SELECT 1 FROM mail_outbox)
        OR EXISTS(SELECT 1 FROM users WHERE registration_attribution IS NOT NULL)""")):
        raise RuntimeError("Preserve registration attribution and pending deliveries before downgrade")
    op.drop_table("mail_outbox")
    op.drop_column("users", "registration_attribution")
    op.drop_column("users", "registration_origin")
