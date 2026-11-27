"""Isolate first-project reservations and redemptions by Stripe mode."""
import sqlalchemy as sa
from alembic import op

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("SET LOCAL lock_timeout='3s'")
    op.add_column("job_fundings", sa.Column("first_project_slot", sa.Integer(), nullable=True))
    op.create_check_constraint("ck_first_project_slot", "job_fundings", "first_project_slot BETWEEN 1 AND 20")
    for name, column in (("slot", "first_project_slot"), ("customer", "client_user_id")):
        op.create_index(f"uq_first_project_{name}", "job_fundings", ["livemode", column],
                        unique=True, postgresql_where=sa.text("first_project_slot IS NOT NULL"))


def downgrade():
    if op.get_bind().scalar(sa.text("SELECT EXISTS (SELECT 1 FROM job_fundings WHERE first_project_slot IS NOT NULL)")):
        raise RuntimeError("First-project reservations and redemption history must be retained")
    op.drop_index("uq_first_project_customer", table_name="job_fundings")
    op.drop_index("uq_first_project_slot", table_name="job_fundings")
    op.drop_constraint("ck_first_project_slot", "job_fundings", type_="check")
    op.drop_column("job_fundings", "first_project_slot")
