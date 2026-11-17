"""Add human identity, delegation and immutable task contracts (expand only)."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def stamps():
    return [sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)]


def upgrade():
    op.execute("SET LOCAL lock_timeout = '3s'")
    op.add_column('tasks', sa.Column('human_contract_json', postgresql.JSON(), nullable=True))
    op.add_column('tasks', sa.Column('human_policy_status', sa.String(32), nullable=True))
    op.create_table('principals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('owner_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('kind', sa.String(32), nullable=False),
        sa.Column('display_name', sa.String(256), nullable=False), *stamps(),
        sa.UniqueConstraint('owner_user_id', 'kind', name='uq_principal_owner_kind'))
    op.create_index('ix_principals_owner_user_id', 'principals', ['owner_user_id'])
    op.create_table('delegations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('principal_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('principals.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('agent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agents.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('max_amount_minor', sa.BigInteger(), nullable=False),
        sa.Column('reserved_amount_minor', sa.BigInteger(), server_default='0', nullable=False),
        sa.Column('categories', postgresql.JSON(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True), *stamps(),
        sa.CheckConstraint('reserved_amount_minor >= 0 AND reserved_amount_minor <= max_amount_minor', name='ck_delegation_budget'))
    op.create_index('ix_delegations_principal_id', 'delegations', ['principal_id'])
    op.create_index('ix_delegations_agent_id', 'delegations', ['agent_id'])
    op.create_table('human_workers',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='RESTRICT'), primary_key=True),
        sa.Column('agent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agents.id', ondelete='RESTRICT'), unique=True, nullable=False),
        sa.Column('profile', postgresql.JSON(), nullable=False),
        sa.Column('verification_status', sa.String(32), server_default='pending', nullable=False),
        sa.Column('attested_skills', postgresql.JSON(), nullable=False),
        sa.Column('data_consent', sa.Boolean(), nullable=False), *stamps())
    op.create_table('human_task_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('principal_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('principals.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('idempotency_key', sa.String(128), nullable=False),
        sa.Column('request_hash', sa.String(64), nullable=False),
        sa.Column('task_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tasks.id', ondelete='RESTRICT'), unique=True, nullable=False), *stamps(),
        sa.UniqueConstraint('principal_id', 'idempotency_key', name='uq_human_request_key'))


def downgrade():
    for table in ('principals', 'delegations', 'human_workers', 'human_task_requests'):
        if op.get_bind().execute(sa.text(f'SELECT EXISTS (SELECT 1 FROM {table})')).scalar():
            raise RuntimeError('Human execution history must be retained; roll back the application')
    if op.get_bind().execute(sa.text('SELECT EXISTS (SELECT 1 FROM tasks WHERE human_contract_json IS NOT NULL)')).scalar():
        raise RuntimeError('Human task contracts must be retained')
    for table in ('human_task_requests', 'human_workers', 'delegations', 'principals'):
        op.drop_table(table)
    op.drop_column('tasks', 'human_policy_status')
    op.drop_column('tasks', 'human_contract_json')
