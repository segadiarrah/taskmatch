"""Durable protocol events and owner-configured signed outgoing webhooks."""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql as pg

revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def stamps():
    return [sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)]


def upgrade():
    op.execute("SET LOCAL lock_timeout = '3s'")
    op.create_table('webhook_subscriptions',
        sa.Column('id', pg.UUID(as_uuid=True), primary_key=True),
        sa.Column('principal_id', pg.UUID(as_uuid=True), sa.ForeignKey('principals.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('delegation_id', pg.UUID(as_uuid=True), sa.ForeignKey('delegations.id', ondelete='RESTRICT'), nullable=True),
        sa.Column('owner_user_id', pg.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('url', sa.String(2048), nullable=False), sa.Column('secret_ciphertext', sa.Text(), nullable=False),
        sa.Column('active', sa.Boolean(), server_default=sa.true(), nullable=False), *stamps())
    op.create_index('ix_webhook_subscriptions_principal_id', 'webhook_subscriptions', ['principal_id'])
    op.create_table('protocol_events',
        sa.Column('id', pg.UUID(as_uuid=True), primary_key=True),
        sa.Column('source_audit_id', pg.UUID(as_uuid=True), sa.ForeignKey('audit_logs.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('task_id', pg.UUID(as_uuid=True), sa.ForeignKey('tasks.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('principal_id', pg.UUID(as_uuid=True), sa.ForeignKey('principals.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('delegation_id', pg.UUID(as_uuid=True), sa.ForeignKey('delegations.id', ondelete='RESTRICT'), nullable=True),
        sa.Column('payload', pg.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('source_audit_id', 'task_id', name='uq_protocol_event_source_task'))
    op.create_index('ix_protocol_events_task_id', 'protocol_events', ['task_id'])
    op.create_index('ix_protocol_events_principal_id', 'protocol_events', ['principal_id'])
    op.create_table('webhook_deliveries',
        sa.Column('id', pg.UUID(as_uuid=True), primary_key=True),
        sa.Column('subscription_id', pg.UUID(as_uuid=True), sa.ForeignKey('webhook_subscriptions.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('event_id', pg.UUID(as_uuid=True), sa.ForeignKey('protocol_events.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('status', sa.String(24), server_default='pending', nullable=False),
        sa.Column('attempts', sa.Integer(), server_default='0', nullable=False),
        sa.Column('next_attempt_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_http_status', sa.Integer(), nullable=True), sa.Column('last_error', sa.String(64), nullable=True), *stamps(),
        sa.UniqueConstraint('subscription_id', 'event_id', name='uq_webhook_delivery_subscription_event'),
        sa.CheckConstraint('attempts >= 0 AND attempts <= 6', name='ck_webhook_delivery_attempts'),
        sa.CheckConstraint("status IN ('pending','processing','delivered','failed','suppressed')", name='ck_webhook_delivery_status'))
    op.create_index('ix_webhook_deliveries_status', 'webhook_deliveries', ['status'])
    op.create_index('ix_webhook_deliveries_next_attempt_at', 'webhook_deliveries', ['next_attempt_at'])
    op.execute('''CREATE FUNCTION taskmatch_protocol_event_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'Protocol event snapshots are immutable'; END; $$''')
    op.execute('''CREATE TRIGGER protocol_event_immutable BEFORE UPDATE ON protocol_events
        FOR EACH ROW EXECUTE FUNCTION taskmatch_protocol_event_immutable()''')


def downgrade():
    for table in ('protocol_events', 'webhook_deliveries', 'webhook_subscriptions'):
        if op.get_bind().execute(sa.text(f'SELECT EXISTS (SELECT 1 FROM {table})')).scalar():
            raise RuntimeError('Retain webhook configuration and delivery history; roll back the application')
    op.execute('DROP TRIGGER protocol_event_immutable ON protocol_events')
    op.execute('DROP FUNCTION taskmatch_protocol_event_immutable()')
    for table in ('webhook_deliveries', 'protocol_events', 'webhook_subscriptions'):
        op.drop_table(table)
