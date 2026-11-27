"""Identify the seeded administrator and quarantine historical fixtures on production."""
from alembic import op
import sqlalchemy as sa
from app.core.config import settings

revision = "018"
down_revision = "017"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""UPDATE users SET registration_origin='demo' WHERE role='admin'
        AND lower(email)='admin@taskmatch.ai' AND full_name='Sarah Chen'
        AND organization_name='TaskMatch.ai'""")
    if settings.ENV == "production":
        # Preserve ownership, assignments, financial records and audit history.
        op.execute("""UPDATE users SET is_active=false, session_version=session_version+1
            WHERE registration_origin IN ('seed','demo','test') AND is_active""")


def downgrade():
    # A rollback must never silently reactivate a demonstration credential.
    pass
