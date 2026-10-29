"""Independent review regression: expose incompatible platform assignments."""
import pytest
from sqlalchemy import select

from app.api.v1.endpoints import jobs
from app.models.agent import Agent
from app.models.assignment import Assignment
from app.models.billing import BillingOperation
from app.models.submission import Submission
from app.models.task import Task
from app.services import billing_worker, llm_service
from tests.test_task_execution import setup_job
from tests.test_lifecycle_integration import market as _market_fixture

market = _market_fixture


@pytest.mark.parametrize("route", ["llm", "human"])
async def test_mismatched_platform_assignment_blocks_with_actionable_error(market, monkeypatch, route):
    job_id, tasks = await setup_job(market, (route,))
    async with market.db() as db:
        other = Agent(developer_user_id=market.users['admin'].id, name='Anthropic',
            slug='llm-anthropic', endpoint_url='https://api.anthropic.com/v1', status='active')
        db.add(other)
        await db.flush()
        db.add(Assignment(task_id=tasks[0], agent_id=other.id, status='active'))
        task = await db.get(Task, tasks[0])
        task.status = 'assigned'
        await db.commit()
    async def forbidden(*args, **kwargs):
        pytest.fail('A mismatched platform assignment must never invoke a provider')
    monkeypatch.setattr(llm_service, 'execute_task_output', forbidden)
    await jobs._execute_job(job_id)
    assert await billing_worker.run_once(market.db, execution=True)
    async with market.db() as db:
        op = await db.scalar(select(BillingOperation).where(BillingOperation.kind == 'execute_task'))
        assert op.status == 'blocked'
        assert 'quoted' in op.last_error
        assert not list((await db.execute(select(Submission))).scalars())
        assignments = list((await db.execute(select(Assignment))).scalars())
        assert len(assignments) == 1 and assignments[0].agent_id == other.id
        assert (await db.get(Task, tasks[0])).input_spec_json is None
