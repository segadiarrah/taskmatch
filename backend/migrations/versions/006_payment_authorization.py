"""Reusable payment consent; no change to existing ledger or funded quotes."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
revision='006'
down_revision='005'
branch_labels=None
depends_on=None


def upgrade():
    op.execute("SET LOCAL lock_timeout='3s'")
    op.create_table('payment_authorizations',
        sa.Column('id',postgresql.UUID(as_uuid=True),primary_key=True),
        sa.Column('principal_id',postgresql.UUID(as_uuid=True),sa.ForeignKey('principals.id',ondelete='RESTRICT'),nullable=False),
        sa.Column('owner_user_id',postgresql.UUID(as_uuid=True),sa.ForeignKey('users.id',ondelete='RESTRICT'),nullable=False),
        sa.Column('status',sa.String(32),server_default='pending',nullable=False),
        sa.Column('livemode',sa.Boolean(),nullable=False),
        sa.Column('consent_version',sa.String(64),nullable=False),
        sa.Column('consent_at',sa.DateTime(timezone=True),nullable=False),
        sa.Column('customer_id',sa.String(255),unique=True,nullable=True),
        sa.Column('payment_method_id',sa.String(255),nullable=True),
        sa.Column('setup_session_id',sa.String(255),unique=True,nullable=True),
        sa.Column('setup_started_at',sa.DateTime(timezone=True),nullable=True),
        sa.Column('setup_url',sa.Text(),nullable=True),
        sa.Column('brand',sa.String(64),nullable=True),sa.Column('last4',sa.String(4),nullable=True),
        sa.Column('created_at',sa.DateTime(timezone=True),server_default=sa.func.now(),nullable=False),
        sa.Column('updated_at',sa.DateTime(timezone=True),server_default=sa.func.now(),nullable=False))
    op.create_index('ix_payment_authorizations_principal_id','payment_authorizations',['principal_id'])
    op.create_index('uq_payment_authorization_active','payment_authorizations',['principal_id'],unique=True,postgresql_where=sa.text("status='active'"))


def downgrade():
    if op.get_bind().execute(sa.text('SELECT EXISTS(SELECT 1 FROM payment_authorizations)')).scalar():
        raise RuntimeError('Payment authorization history must be retained')
    op.drop_table('payment_authorizations')
