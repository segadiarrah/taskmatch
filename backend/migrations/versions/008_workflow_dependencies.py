"""Explicit task prerequisites; amendments reuse separately funded jobs."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
revision='008'
down_revision='007'
branch_labels=None
depends_on=None

def upgrade():
    op.execute("SET LOCAL lock_timeout='3s'")
    op.create_table('task_dependencies',
        sa.Column('task_id',postgresql.UUID(as_uuid=True),sa.ForeignKey('tasks.id',ondelete='RESTRICT'),primary_key=True),
        sa.Column('depends_on_task_id',postgresql.UUID(as_uuid=True),sa.ForeignKey('tasks.id',ondelete='RESTRICT'),primary_key=True),
        sa.Column('created_at',sa.DateTime(timezone=True),server_default=sa.func.now(),nullable=False),
        sa.Column('updated_at',sa.DateTime(timezone=True),server_default=sa.func.now(),nullable=False),
        sa.CheckConstraint('task_id <> depends_on_task_id',name='ck_dependency_not_self'))

def downgrade():
    if op.get_bind().execute(sa.text('SELECT EXISTS(SELECT 1 FROM task_dependencies)')).scalar():
        raise RuntimeError('Workflow history must be retained')
    op.drop_table('task_dependencies')
