"""Exercise the actual Stripe migration against disposable PostgreSQL only."""

import os
import subprocess
import sys
import uuid

import asyncpg
import pytest
from sqlalchemy.engine import make_url


async def test_stripe_migration_preserves_legacy_and_defaults_new_jobs_to_stripe():
    source = os.environ.get("TEST_DATABASE_URL")
    if not source:
        pytest.skip("TEST_DATABASE_URL required for migration verification")
    url = make_url(source)
    if not (url.database or "").endswith("_test"):
        pytest.fail("Refusing migration reset outside a disposable *_test database")
    connection = await asyncpg.connect(url.set(drivername="postgresql").render_as_string(hide_password=False))
    await connection.execute("SELECT pg_advisory_lock(742341)")
    env = {**os.environ, "DATABASE_URL": source, "ENV": "development", "LLM_ENABLED": "false"}

    def migrate(*args):
        result = subprocess.run([sys.executable, "-m", "alembic", *args], env=env, text=True, capture_output=True)
        assert result.returncode == 0, result.stdout + result.stderr

    try:
        await connection.execute("DROP SCHEMA public CASCADE")
        await connection.execute("CREATE SCHEMA public")
        migrate("upgrade", "003")
        owner = uuid.uuid4()
        await connection.execute(
            "INSERT INTO users(id,email,hashed_password,role,full_name) VALUES($1,$2,'unused','client','Migration owner')",
            owner, "stripe-migration@example.test",
        )
        for status in ("draft", "quoted", "bidding", "in_progress", "client_review", "completed"):
            await connection.execute(
                "INSERT INTO jobs(id,client_user_id,title,raw_description,budget_min,budget_max,currency,status) "
                "VALUES($1,$2,$3,'Historical work',1,100,'EUR',$3)", uuid.uuid4(), owner, status,
            )
        historical_job = await connection.fetchval("SELECT id FROM jobs WHERE status='completed'")
        await connection.execute(
            "INSERT INTO payment_records(job_id,client_user_id,gross_amount,platform_fee,net_amount,currency,payment_status) "
            "VALUES($1,$2,20,2,18,'EUR','paid')", historical_job, owner,
        )
        original_payment = dict(await connection.fetchrow("SELECT * FROM payment_records"))
        migrate("upgrade", "head")
        assert await connection.fetchval("SELECT count(*) FROM jobs WHERE billing_mode='legacy_manual'") == 6
        payment = dict(await connection.fetchrow("SELECT * FROM payment_records"))
        assert all(payment[key] == value for key, value in original_payment.items())
        new_job = uuid.uuid4()
        await connection.execute(
            "INSERT INTO jobs(id,client_user_id,title,raw_description,budget_min,budget_max,currency,status) "
            "VALUES($1,$2,'New job','New work',1,100,'EUR','draft')", new_job, owner,
        )
        assert await connection.fetchval("SELECT billing_mode FROM jobs WHERE id=$1", new_job) == "stripe"
        migrate("check")
        migrate("downgrade", "003")
        assert await connection.fetchval("SELECT count(*) FROM jobs") == 7
        assert dict(await connection.fetchrow("SELECT * FROM payment_records")) == original_payment
        assert await connection.fetchval("SELECT to_regclass('job_fundings')") is None
        migrate("upgrade", "head")
        migrate("check")
        assert await connection.fetchval("SELECT count(*) FROM jobs WHERE billing_mode='legacy_manual'") == 7
        await connection.execute(
            "INSERT INTO stripe_events(id,event_type,livemode,payload) VALUES('evt_migration','test',false,'{}')"
        )
        downgrade = subprocess.run([sys.executable, "-m", "alembic", "downgrade", "003"],
                                   env=env, text=True, capture_output=True)
        assert downgrade.returncode != 0, "Downgrade must not erase Stripe history"
        assert "Stripe" in downgrade.stderr
        assert await connection.fetchval("SELECT count(*) FROM stripe_events") == 1
        columns = await connection.fetch("SELECT column_name FROM information_schema.columns WHERE table_name='job_fundings'")
        assert {"checkout_request", "checkout_started_at"}.issubset({row[0] for row in columns})
        quote = uuid.uuid4()
        await connection.execute(
            "INSERT INTO quotes(id,job_id,subtotal,platform_fee,total,pricing_version) VALUES($1,$2,1,0,1,'test')",
            quote, new_job,
        )
        for amount, refunded, generation in ((-1, 0, 1), (100, -1, 1), (100, 101, 1), (100, 0, 0)):
            with pytest.raises(asyncpg.CheckViolationError):
                await connection.execute(
                    "INSERT INTO job_fundings(id,job_id,quote_id,client_user_id,amount_minor,currency,livemode,status,generation,refunded_minor) "
                    "VALUES($1,$2,$3,$4,$5,'eur',false,'creating',$6,$7)",
                    uuid.uuid4(), new_job, quote, owner, amount, generation, refunded,
                )
    finally:
        await connection.execute("SELECT pg_advisory_unlock(742341)")
        await connection.close()
