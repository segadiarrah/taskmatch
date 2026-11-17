"""Actual additive migrations enforce immutable snapshots and preserve delivery history."""
import os
import subprocess
import sys
import uuid

import asyncpg
import pytest
from sqlalchemy.engine import make_url


async def test_migrated_protocol_outbox_is_immutable_and_refuses_destructive_downgrade():
    source = os.environ.get('TEST_DATABASE_URL')
    if not source:
        pytest.skip('TEST_DATABASE_URL is required')
    url = make_url(source)
    if not (url.database or '').endswith('_test'):
        pytest.fail('Only a disposable *_test database may be recreated')
    connection = await asyncpg.connect(url.set(drivername='postgresql').render_as_string(hide_password=False))
    await connection.execute('SELECT pg_advisory_lock(742341)')
    env = {**os.environ, 'DATABASE_URL': source, 'ENV': 'development'}
    def migrate(*args):
        return subprocess.run([sys.executable, '-m', 'alembic', *args], env=env, text=True, capture_output=True)
    try:
        await connection.execute('DROP SCHEMA public CASCADE')
        await connection.execute('CREATE SCHEMA public')
        upgrade = migrate('upgrade', 'head')
        assert upgrade.returncode == 0, upgrade.stdout+upgrade.stderr
        check = migrate('check')
        assert check.returncode == 0, check.stdout+check.stderr
        owner, principal, job, task, audit, event, subscription, delivery = [uuid.uuid4() for _ in range(8)]
        await connection.execute("INSERT INTO users(id,email,hashed_password,role,full_name) VALUES($1,'webhook-migration@example.test','unused','client','Owner')", owner)
        await connection.execute("INSERT INTO principals(id,owner_user_id,kind,display_name) VALUES($1,$2,'individual','Owner')", principal, owner)
        await connection.execute("INSERT INTO jobs(id,client_user_id,title,raw_description,budget_min,budget_max,currency,status) VALUES($1,$2,'Task','Work',1,10,'EUR','draft')", job, owner)
        await connection.execute("INSERT INTO tasks(id,job_id,title,description,task_type) VALUES($1,$2,'Task','Work','translation_review')", task, job)
        await connection.execute("INSERT INTO audit_logs(id,actor_type,actor_id,action,entity_type,entity_id) VALUES($1,'system','test','human_task.created','task',$2)", audit, str(task))
        await connection.execute("INSERT INTO protocol_events(id,source_audit_id,task_id,principal_id,payload) VALUES($1,$2,$3,$4,'{}')", event, audit, task, principal)
        await connection.execute("INSERT INTO webhook_subscriptions(id,principal_id,owner_user_id,url,secret_ciphertext) VALUES($1,$2,$3,'https://example.com/','encrypted-test')", subscription, principal, owner)
        await connection.execute("INSERT INTO webhook_deliveries(id,subscription_id,event_id) VALUES($1,$2,$3)", delivery, subscription, event)
        with pytest.raises(asyncpg.RaiseError, match='immutable'):
            await connection.execute("UPDATE protocol_events SET payload='{}' WHERE id=$1", event)
        downgrade = migrate('downgrade', '006')
        assert downgrade.returncode != 0
        assert 'Retain webhook configuration and delivery history' in downgrade.stderr
        for table in ('protocol_events', 'webhook_subscriptions', 'webhook_deliveries'):
            assert await connection.fetchval(f'SELECT count(*) FROM {table}') == 1
    finally:
        await connection.execute('SELECT pg_advisory_unlock(742341)')
        await connection.close()
