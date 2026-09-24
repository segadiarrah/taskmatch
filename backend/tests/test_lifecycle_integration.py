"""Real HTTP/PostgreSQL lifecycle regressions; never uses the application database.

Run with TEST_DATABASE_URL pointing at a dedicated database ending in `_test`.
The schema is recreated for each case. External LLM calls are disabled.
"""

import asyncio
import os
import uuid
from types import SimpleNamespace

import httpx
import pytest
import pytest_asyncio
from sqlalchemy import event, select, text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.api.v1.endpoints import jobs
from app.core.database import get_db
from app.core.security import create_access_token
from app.main import app
from app.models import Base
from app.models.agent import Agent
from app.models.assignment import Assignment
from app.models.job import Job
from app.models.payment import PaymentRecord
from app.models.quote import TaskQuote
from app.models.submission import Submission
from app.models.task import Task
from app.models.user import User


@pytest_asyncio.fixture
async def market(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "PAYMENT_MODE", "legacy_manual")
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.skip("TEST_DATABASE_URL is required for isolated PostgreSQL tests")
    if not (make_url(url).database or "").endswith("_test"):
        pytest.fail("Refusing schema recreation outside a database ending in _test")
    engine = create_async_engine(url, poolclass=NullPool)
    # Protect schema recreation if two local test commands target the same DB.
    async with engine.connect() as suite_lock:
        await suite_lock.execute(text("SELECT pg_advisory_lock(742341)"))
        try:
            factory = async_sessionmaker(engine, expire_on_commit=False)
            async with engine.begin() as connection:
                await connection.run_sync(Base.metadata.drop_all)
                await connection.run_sync(Base.metadata.create_all)

            async def database():
                async with factory() as session:
                    try:
                        yield session
                        await session.commit()
                    except Exception:
                        await session.rollback()
                        raise

            app.dependency_overrides[get_db] = database
            monkeypatch.setattr(jobs, "async_session_factory", factory)
            identities = {}
            async with factory() as session:
                for name, role in (
                    ("owner", "client"),
                    ("stranger", "client"),
                    ("developer", "agent_developer"),
                    ("outsider", "agent_developer"),
                    ("admin", "admin"),
                ):
                    user = User(
                        id=uuid.uuid4(),
                        email=f"{name}@example.test",
                        role=role,
                        full_name=name,
                        hashed_password="not-used-by-token-tests",
                    )
                    session.add(user)
                    identities[name] = user
                await session.flush()
                agent = Agent(
                    id=uuid.uuid4(),
                    developer_user_id=identities["developer"].id,
                    name="Test worker",
                    slug="test-worker",
                    endpoint_url="https://example.test",
                    description="Local test worker",
                    status="active",
                )
                session.add(agent)
                await session.commit()
            headers = {
                name: {"Authorization": "Bearer " + create_access_token({"sub": str(user.id)})}
                for name, user in identities.items()
            }
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app), base_url="http://test/api/v1"
            ) as client:
                yield SimpleNamespace(
                    http=client, db=factory, users=identities, headers=headers, agent=agent
                )
        finally:
            app.dependency_overrides.pop(get_db, None)
            await suite_lock.execute(text("SELECT pg_advisory_unlock(742341)"))
    await engine.dispose()


async def request(market, method, path, role="owner", expected=200, **kwargs):
    response = await market.http.request(method, path, headers=market.headers[role], **kwargs)
    assert response.status_code == expected, response.text
    return response.json()


async def planned_job(market):
    job = await request(
        market,
        "POST",
        "/jobs",
        expected=201,
        json={
            "title": "Write report",
            "raw_description": "Write a concise report on team process.",
            "budget_min": 1,
            "budget_max": 100,
            "auto_select_enabled": False,
        },
    )
    await request(market, "POST", f"/jobs/{job['id']}/submit")
    return await request(market, "GET", f"/jobs/{job['id']}/plan")


async def assigned_task(market):
    plan = await planned_job(market)
    job_id = plan["job"]["id"]
    await request(market, "POST", f"/jobs/{job_id}/quote/accept")
    task = plan["tasks"][0]
    bid = await request(
        market,
        "POST",
        f"/tasks/{task['id']}/bids",
        role="developer",
        expected=201,
        json={
            "task_id": task["id"],
            "agent_id": str(market.agent.id),
            "price": task["budget"],
            "eta_hours": 1,
            "confidence_score": 0.9,
        },
    )
    await request(market, "PUT", f"/bids/{bid['id']}/select", role="admin")
    async with market.db() as db:
        assignment = (
            await db.execute(select(Assignment).where(Assignment.task_id == uuid.UUID(task["id"])))
        ).scalar_one()
        assignment_id = str(assignment.id)
    return job_id, task["id"], assignment_id


async def submitted_task(market):
    job_id, task_id, assignment_id = await assigned_task(market)
    submission = await request(
        market,
        "POST",
        f"/tasks/{task_id}/submissions",
        role="developer",
        expected=201,
        json={
            "task_id": task_id,
            "agent_id": str(market.agent.id),
            "assignment_id": assignment_id,
            "output_json": {"result": "A real submitted report", "summary": "Report"},
            "summary": "Report",
        },
    )
    return job_id, task_id, assignment_id, submission["id"]


async def test_quote_gates_bids_and_assignment(market):
    plan = await planned_job(market)
    assert plan["job"]["status"] == "quoted"
    assert plan["tasks"][0]["status"] == "pending"
    task_id = plan["tasks"][0]["id"]
    await request(
        market,
        "POST",
        f"/tasks/{task_id}/assign?agent_id={market.agent.id}",
        role="admin",
        expected=409,
    )
    listed = await request(market, "GET", "/tasks/open", role="developer")
    assert listed["total"] == 0


async def test_manual_lifecycle_reaches_delivery_without_claiming_a_transfer(market):
    job_id, task_id, assignment_id, submission_id = await submitted_task(market)
    await request(
        market,
        "POST",
        f"/submissions/{submission_id}/reviews",
        expected=201,
        json={"submission_id": submission_id, "decision": "approved", "score": 95},
    )
    plan = await request(market, "GET", f"/jobs/{job_id}/plan")
    assert plan["job"]["status"] == "client_review"
    assert plan["delivery"]["status"] == "delivered"
    async with market.db() as db:
        assignment = await db.get(Assignment, uuid.UUID(assignment_id))
        assert assignment.status == "completed"
        assert assignment.completed_at is not None
        payments = list(
            (
                await db.execute(
                    select(PaymentRecord).where(PaymentRecord.job_id == uuid.UUID(job_id))
                )
            ).scalars()
        )
        assert len(payments) == 1
        assert payments[0].provider == "manual"
        assert payments[0].provider_ref is None
        assert payments[0].payment_status == "pending"
        payment_id = str(payments[0].id)
    await request(market, "PUT", f"/payments/{payment_id}/release", role="admin", expected=409)
    await request(market, "PUT", f"/payments/{payment_id}/complete", role="admin", expected=400)
    accepted = await request(market, "POST", f"/jobs/{job_id}/accept")
    assert accepted["status"] == "completed"
    assert accepted["payments_released"] == 0
    assert accepted["payments_ready"] == 1
    async with market.db() as db:
        payment = (
            await db.execute(select(PaymentRecord).where(PaymentRecord.job_id == uuid.UUID(job_id)))
        ).scalar_one()
        assert payment.payment_status == "releasable"
    await request(market, "POST", f"/jobs/{job_id}/accept", expected=409)


@pytest.mark.parametrize("route", ["accept", "delivery/sign-off"])
async def test_undelivered_job_cannot_be_accepted(market, route):
    plan = await planned_job(market)
    await request(market, "POST", f"/jobs/{plan['job']['id']}/{route}", expected=409, json={})


async def test_foreign_client_cannot_review_submission(market):
    _, _, _, submission_id = await submitted_task(market)
    await request(
        market,
        "POST",
        f"/submissions/{submission_id}/reviews",
        role="stranger",
        expected=403,
        json={"submission_id": submission_id, "decision": "approved"},
    )


@pytest.mark.parametrize("role", ["stranger", "outsider"])
async def test_private_task_results_are_scoped_to_owner_and_assigned_developer(market, role):
    _, task_id, _, submission_id = await submitted_task(market)
    for path in (
        f"/tasks/{task_id}",
        f"/tasks/{task_id}/bids",
        f"/tasks/{task_id}/submissions",
        f"/tasks/{task_id}/reviews",
        f"/submissions/{submission_id}",
    ):
        await request(market, "GET", path, role=role, expected=403)
    listed = await request(market, "GET", "/tasks", role=role)
    assert listed["total"] == 0


async def test_direct_assignment_serializes_persisted_status(market):
    plan = await planned_job(market)
    await request(market, "POST", f"/jobs/{plan['job']['id']}/quote/accept")
    assigned = await request(
        market,
        "POST",
        f"/tasks/{plan['tasks'][0]['id']}/assign?agent_id={market.agent.id}",
        role="admin",
    )
    assert assigned["status"] == "active"
    task = await request(market, "GET", f"/tasks/{plan['tasks'][0]['id']}")
    assert task["assigned_agent_id"] == str(market.agent.id)


async def test_cancelled_assignment_cannot_submit_work(market):
    _, task_id, assignment_id = await assigned_task(market)
    async with market.db() as db:
        assignment = await db.get(Assignment, uuid.UUID(assignment_id))
        assignment.status = "cancelled"
        await db.commit()
    await request(
        market,
        "POST",
        f"/tasks/{task_id}/submissions",
        role="developer",
        expected=409,
        json={
            "task_id": task_id,
            "agent_id": str(market.agent.id),
            "assignment_id": assignment_id,
            "output_json": {"result": "late result"},
        },
    )


async def test_review_retry_is_idempotent_and_rework_can_be_resubmitted(market):
    job_id, task_id, assignment_id, submission_id = await submitted_task(market)
    body = {"submission_id": submission_id, "decision": "rework_requested"}
    await request(market, "POST", f"/submissions/{submission_id}/reviews", expected=201, json=body)
    await request(market, "POST", f"/submissions/{submission_id}/reviews", expected=409, json=body)
    async with market.db() as db:
        task = await db.get(Task, uuid.UUID(task_id))
        assert task.retry_count == 1
    revised = await request(
        market,
        "POST",
        f"/tasks/{task_id}/submissions",
        role="developer",
        expected=201,
        json={
            "task_id": task_id,
            "agent_id": str(market.agent.id),
            "assignment_id": assignment_id,
            "output_json": {"result": "Revised report", "summary": "Revised"},
            "summary": "Revised",
        },
    )
    await request(
        market,
        "POST",
        f"/submissions/{revised['id']}/reviews",
        expected=201,
        json={"submission_id": revised["id"], "decision": "approved"},
    )
    plan = await request(market, "GET", f"/jobs/{job_id}/plan")
    assert plan["job"]["status"] == "client_review"


async def test_unavailable_llm_does_not_fabricate_completed_work(market):
    _, task_id, assignment_id = await assigned_task(market)
    async with market.db() as db:
        task = await db.get(Task, uuid.UUID(task_id))
        assignment = await db.get(Assignment, uuid.UUID(assignment_id))
        agent = await db.get(Agent, market.agent.id)
        await jobs._deliver_task(db, task, agent, assignment)
        await db.commit()
        assert assignment.status == "active"
        results = list(
            (await db.execute(select(Submission).where(Submission.task_id == task.id))).scalars()
        )
        assert results == []


async def test_admin_validation_completes_the_same_persisted_workflow(market):
    job_id, _, assignment_id, submission_id = await submitted_task(market)
    await request(market, "POST", f"/mcp/validate-submission/{submission_id}", role="admin")
    await request(
        market, "POST", f"/mcp/validate-submission/{submission_id}", role="admin", expected=409
    )
    plan = await request(market, "GET", f"/jobs/{job_id}/plan")
    assert plan["job"]["status"] == "client_review"
    async with market.db() as db:
        assert (await db.get(Assignment, uuid.UUID(assignment_id))).status == "completed"


async def test_admin_rework_reopens_submission_and_counts_retry(market):
    _, task_id, assignment_id = await assigned_task(market)
    submission = await request(
        market,
        "POST",
        f"/tasks/{task_id}/submissions",
        role="developer",
        expected=201,
        json={
            "task_id": task_id,
            "agent_id": str(market.agent.id),
            "assignment_id": assignment_id,
            "output_json": {"result": "Missing summary"},
        },
    )
    reviewed = await request(
        market, "POST", f"/mcp/validate-submission/{submission['id']}", role="admin"
    )
    assert reviewed["decision"] == "rework_requested"
    async with market.db() as db:
        task = await db.get(Task, uuid.UUID(task_id))
        assert task.status == "validation_failed"
        assert task.retry_count == 1


async def test_admin_decomposition_stops_at_quote(market):
    job = await request(
        market,
        "POST",
        "/jobs",
        expected=201,
        json={
            "title": "Report",
            "raw_description": "Write a report",
            "budget_min": 1,
            "budget_max": 50,
        },
    )
    formatted = await request(market, "POST", f"/mcp/format-job/{job['id']}", role="admin")
    assert formatted["status"] == "formatted"
    decomposed = await request(market, "POST", f"/mcp/decompose-job/{job['id']}", role="admin")
    assert decomposed["status"] == "quoted"
    plan = await request(market, "GET", f"/jobs/{job['id']}/plan")
    assert plan["quote"]["status"] == "pending_client"
    assert all(task["status"] == "pending" for task in plan["tasks"])


async def test_accepted_quote_cannot_be_refreshed_or_delivery_mode_changed(market):
    plan = await planned_job(market)
    job_id = plan["job"]["id"]
    await request(market, "POST", f"/jobs/{job_id}/quote/accept")
    await request(market, "POST", f"/jobs/{job_id}/quote/refresh", expected=409)
    await request(
        market, "PUT", f"/jobs/{job_id}/delivery", json={"mode": "installation"}, expected=409
    )


async def test_dispute_reopens_external_assignment_for_real_developer_revision(market):
    job_id, task_id, assignment_id, submission_id = await submitted_task(market)
    await request(
        market,
        "POST",
        f"/submissions/{submission_id}/reviews",
        expected=201,
        json={"submission_id": submission_id, "decision": "approved"},
    )
    await request(
        market, "POST", f"/jobs/{job_id}/dispute", json={"reason": "Please revise the report"}
    )
    async with market.db() as db:
        assignment = await db.get(Assignment, uuid.UUID(assignment_id))
        assert assignment.status == "active"
        task = await db.get(Task, uuid.UUID(task_id))
        assert "Please revise the report" in str(task.input_spec_json)
    revised = await request(
        market,
        "POST",
        f"/tasks/{task_id}/submissions",
        role="developer",
        expected=201,
        json={
            "task_id": task_id,
            "agent_id": str(market.agent.id),
            "assignment_id": assignment_id,
            "output_json": {"result": "Revised report", "summary": "Revised"},
            "summary": "Revised",
        },
    )
    await request(
        market,
        "POST",
        f"/submissions/{revised['id']}/reviews",
        expected=201,
        json={"submission_id": revised["id"], "decision": "approved"},
    )
    async with market.db() as db:
        assert len(list((await db.execute(select(PaymentRecord))).scalars())) == 1
        assert (await db.get(Agent, market.agent.id)).completed_tasks_count == 1


async def test_developer_cannot_read_private_draft_job(market):
    job = await request(
        market,
        "POST",
        "/jobs",
        expected=201,
        json={
            "title": "Private brief",
            "raw_description": "Not ready for sharing",
            "budget_min": 0,
            "budget_max": 50,
        },
    )
    await request(market, "GET", f"/jobs/{job['id']}", role="developer", expected=403)


async def test_developer_assignment_payload_identifies_agent(market):
    _, _, assignment_id = await assigned_task(market)
    assignments = await request(market, "GET", "/developer/assignments", role="developer")
    assert assignments["items"][0]["id"] == assignment_id
    assert assignments["items"][0]["agent_id"] == str(market.agent.id)


async def test_job_update_cannot_skip_workflow(market):
    job = await request(
        market,
        "POST",
        "/jobs",
        expected=201,
        json={
            "title": "Report",
            "raw_description": "Write a report",
            "budget_min": 1,
            "budget_max": 50,
        },
    )
    await request(market, "PUT", f"/jobs/{job['id']}", json={"status": "completed"}, expected=409)


async def test_expert_offer_requires_quote_acceptance_then_creates_assignment(market):
    plan = await planned_job(market)
    task_id = plan["tasks"][0]["id"]
    async with market.db() as db:
        line = await db.scalar(select(TaskQuote).where(TaskQuote.task_id == uuid.UUID(task_id)))
        line.route = "human"
        line.human_price_low = 1
        line.human_price_high = 2
        await db.commit()
    payload = {"price": 1, "agent_id": str(market.agent.id)}
    await request(
        market,
        "POST",
        f"/jobs/offers/{task_id}/accept",
        role="developer",
        expected=409,
        json=payload,
    )
    await request(market, "POST", f"/jobs/{plan['job']['id']}/quote/accept")
    await request(
        market,
        "POST",
        f"/jobs/offers/{task_id}/accept",
        role="developer",
        expected=422,
        json={**payload, "price": 2},
    )
    accepted = await request(
        market, "POST", f"/jobs/offers/{task_id}/accept", role="developer", json=payload
    )
    async with market.db() as db:
        assignment = await db.get(Assignment, uuid.UUID(accepted["assignment_id"]))
        assert assignment.agent_id == market.agent.id
        assert assignment.status == "active"
        assert (await db.get(Task, uuid.UUID(task_id))).status == "assigned"


async def test_concurrent_quote_acceptance_starts_once(market):
    plan = await planned_job(market)
    path = f"/jobs/{plan['job']['id']}/quote/accept"
    responses = await asyncio.gather(
        *(market.http.post(path, headers=market.headers["owner"]) for _ in range(2))
    )
    assert sorted(response.status_code for response in responses) == [200, 409]


async def test_concurrent_reviews_create_one_decision(market):
    _, task_id, _, submission_id = await submitted_task(market)
    path = f"/submissions/{submission_id}/reviews"
    responses = await asyncio.gather(
        *(
            market.http.post(
                path,
                headers=market.headers["owner"],
                json={"submission_id": submission_id, "decision": "rework_requested"},
            )
            for _ in range(2)
        )
    )
    assert sorted(response.status_code for response in responses) == [201, 409]
    async with market.db() as db:
        assert (await db.get(Task, uuid.UUID(task_id))).retry_count == 1


async def test_disabled_llm_leaves_platform_tasks_available_for_real_workers(market):
    async with market.db() as db:
        agent = await db.get(Agent, market.agent.id)
        agent.slug = "llm-test"
        agent.developer_user_id = market.users["admin"].id
        await db.commit()
    plan = await planned_job(market)
    async with market.db() as db:
        job = await db.get(Job, uuid.UUID(plan["job"]["id"]))
        job.auto_select_enabled = True
        await db.commit()
    await request(market, "POST", f"/jobs/{plan['job']['id']}/quote/accept")
    async with market.db() as db:
        assignments = list((await db.execute(select(Assignment))).scalars())
        assert assignments == []


async def test_bid_cannot_exceed_the_price_accepted_by_client(market):
    plan = await planned_job(market)
    await request(market, "POST", f"/jobs/{plan['job']['id']}/quote/accept")
    task = plan["tasks"][0]
    await request(
        market,
        "POST",
        f"/tasks/{task['id']}/bids",
        role="developer",
        expected=422,
        json={
            "task_id": task["id"],
            "agent_id": str(market.agent.id),
            "price": task["budget"] + 10,
            "eta_hours": 1,
            "confidence_score": 0.9,
        },
    )


async def test_delivery_mode_change_reprices_human_work_before_acceptance(market):
    plan = await planned_job(market)
    job_id = plan["job"]["id"]
    initial_price = plan["quote"]["total"]
    await request(market, "PUT", f"/jobs/{job_id}/delivery", json={"mode": "installation"})
    # The old quote must not remain actionable after the agreed work changed.
    await request(market, "POST", f"/jobs/{job_id}/quote/accept", expected=409)
    quote = await request(market, "POST", f"/jobs/{job_id}/quote/refresh")
    assert quote["quote"]["total"] > initial_price


async def test_payment_metadata_and_manual_settlement_are_consistent(market):
    job_id, _, _, submission_id = await submitted_task(market)
    await request(
        market,
        "POST",
        f"/submissions/{submission_id}/reviews",
        expected=201,
        json={"submission_id": submission_id, "decision": "approved"},
    )
    rows = await request(market, "GET", "/payments")
    assert rows[0]["currency"] == "USD"
    assert rows[0]["provider"] == "manual"
    assert rows[0]["provider_ref"] is None
    assert rows[0]["platform_fee_percent"] > 0
    await request(market, "POST", f"/jobs/{job_id}/accept")
    async with market.db() as db:
        from app.services.payment_service import complete_payment

        payment = await complete_payment(db, uuid.UUID(rows[0]["id"]))
        assert payment.payment_status == "paid"
        await db.commit()
        with pytest.raises(ValueError, match="Invalid payment transition"):
            await complete_payment(db, payment.id)


async def test_platform_llm_does_not_take_human_routed_work(market, monkeypatch):
    plan = await planned_job(market)
    async with market.db() as db:
        line = await db.scalar(
            select(TaskQuote).where(TaskQuote.task_id == uuid.UUID(plan["tasks"][0]["id"]))
        )
        line.route = "human"
        agent = await db.get(Agent, market.agent.id)
        agent.slug = "llm-test"
        agent.developer_user_id = market.users["admin"].id
        job = await db.get(Job, uuid.UUID(plan["job"]["id"]))
        job.auto_select_enabled = True
        await db.commit()

    async def forbid_delivery(*args, **kwargs):
        raise AssertionError("A human task must not be executed by the platform LLM")

    monkeypatch.setattr(jobs.llm_service, "llm_available", lambda: True)
    monkeypatch.setattr(jobs, "_deliver_task", forbid_delivery)
    await request(market, "POST", f"/jobs/{plan['job']['id']}/quote/accept")
    async with market.db() as db:
        assert list((await db.execute(select(Assignment))).scalars()) == []


async def test_concurrent_direct_assignment_creates_one_worker(market):
    plan = await planned_job(market)
    await request(market, "POST", f"/jobs/{plan['job']['id']}/quote/accept")
    path = f"/tasks/{plan['tasks'][0]['id']}/assign?agent_id={market.agent.id}"
    responses = await asyncio.gather(
        *(market.http.post(path, headers=market.headers["admin"]) for _ in range(2))
    )
    assert sorted(response.status_code for response in responses) == [200, 400]
    async with market.db() as db:
        assert len(list((await db.execute(select(Assignment))).scalars())) == 1


async def test_delivery_signoff_completes_job_and_makes_manual_ledger_releasable(market):
    job_id, _, _, submission_id = await submitted_task(market)
    await request(
        market,
        "POST",
        f"/submissions/{submission_id}/reviews",
        expected=201,
        json={"submission_id": submission_id, "decision": "approved"},
    )
    await request(market, "POST", f"/jobs/{job_id}/delivery/sign-off", json={"notes": "Received"})
    async with market.db() as db:
        job = await db.get(Job, uuid.UUID(job_id))
        assert job.status == "completed"
        payment = await db.scalar(select(PaymentRecord).where(PaymentRecord.job_id == job.id))
        assert payment.payment_status == "releasable"


async def test_developer_cannot_impersonate_platform_agent_with_slug(market, monkeypatch):
    plan = await planned_job(market)
    async with market.db() as db:
        agent = await db.get(Agent, market.agent.id)
        agent.slug = "llm-untrusted"
        job = await db.get(Job, uuid.UUID(plan["job"]["id"]))
        job.auto_select_enabled = True
        await db.commit()

    async def forbid_delivery(*args, **kwargs):
        raise AssertionError("Third-party agents must execute their own work")

    monkeypatch.setattr(jobs.llm_service, "llm_available", lambda: True)
    monkeypatch.setattr(jobs, "_deliver_task", forbid_delivery)
    await request(market, "POST", f"/jobs/{plan['job']['id']}/quote/accept")
    async with market.db() as db:
        assert list((await db.execute(select(Assignment))).scalars()) == []


async def test_concurrent_acceptance_and_dispute_cannot_both_succeed(market):
    job_id, _, _, submission_id = await submitted_task(market)
    await request(
        market,
        "POST",
        f"/submissions/{submission_id}/reviews",
        expected=201,
        json={"submission_id": submission_id, "decision": "approved"},
    )
    responses = await asyncio.gather(
        market.http.post(f"/jobs/{job_id}/accept", headers=market.headers["owner"]),
        market.http.post(
            f"/jobs/{job_id}/dispute", headers=market.headers["owner"], json={"reason": "Revise"}
        ),
    )
    assert sum(response.status_code == 200 for response in responses) == 1
    assert all(response.status_code in (200, 400, 409) for response in responses)


async def test_concurrent_quote_acceptance_and_mode_change_cannot_both_succeed(market):
    plan = await planned_job(market)
    job_id = plan["job"]["id"]
    responses = await asyncio.gather(
        market.http.post(f"/jobs/{job_id}/quote/accept", headers=market.headers["owner"]),
        market.http.put(
            f"/jobs/{job_id}/delivery",
            headers=market.headers["owner"],
            json={"mode": "installation"},
        ),
    )
    assert sorted(response.status_code for response in responses) == [200, 409]


async def test_legacy_releasable_ledger_requires_client_acceptance_before_payment(market):
    _, _, _, submission_id = await submitted_task(market)
    await request(
        market,
        "POST",
        f"/submissions/{submission_id}/reviews",
        expected=201,
        json={"submission_id": submission_id, "decision": "approved"},
    )
    async with market.db() as db:
        payment = await db.scalar(select(PaymentRecord))
        payment.payment_status = "releasable"
        await db.commit()
        payment_id = payment.id
    await request(market, "PUT", f"/payments/{payment_id}/complete", role="admin", expected=409)


async def test_admin_payment_creation_is_a_manual_ledger_in_job_currency(market):
    job = await request(market, "POST", "/jobs", expected=201, json={
        "title": "Report", "raw_description": "Write a report", "budget_min": 1,
        "budget_max": 50, "currency": "EUR",
    })
    payment = await request(market, "POST", "/payments", role="admin", expected=201, json={
        "job_id": job["id"], "client_user_id": str(market.users["owner"].id), "gross_amount": 20,
    })
    assert payment["provider"] == "manual"
    assert payment["currency"] == "EUR"


async def test_marketplace_reads_load_only_response_relationships(market):
    """A populated marketplace detail page must not traverse the whole ORM graph."""
    job_id, task_id, _, submission_id = await submitted_task(market)
    await request(
        market, "POST", f"/submissions/{submission_id}/reviews", expected=201,
        json={"submission_id": submission_id, "decision": "approved", "score": 95},
    )
    from app.models.agent import AgentCapability

    async with market.db() as db:
        db.add(AgentCapability(agent_id=market.agent.id, capability_name="report", version="1"))
        await db.commit()

    engine = market.db.kw["bind"].sync_engine
    statements = []

    def capture(_connection, _cursor, statement, _parameters, _context, _executemany):
        if statement.lstrip().upper().startswith("SELECT"):
            statements.append(statement)

    counts = {}
    event.listen(engine, "before_cursor_execute", capture)
    try:
        for path in (
            "/tasks", "/tasks/open", f"/tasks/{task_id}", f"/tasks/{task_id}/bids",
            f"/tasks/{task_id}/submissions", f"/tasks/{task_id}/reviews",
            f"/submissions/{submission_id}", "/jobs", f"/jobs/{job_id}",
            f"/jobs/{job_id}/plan", f"/jobs/{job_id}/quote", f"/jobs/{job_id}/delivery",
            f"/jobs/{job_id}/access-grants", "/agents", f"/agents/{market.agent.id}",
            f"/agents/{market.agent.id}/stats", "/payments",
        ):
            statements.clear()
            result = await request(market, "GET", path, role="admin")
            counts[path] = len(statements)
            if path == f"/tasks/{task_id}":
                assert result["assigned_agent_id"] == str(market.agent.id)
            elif path == f"/agents/{market.agent.id}":
                assert result["capabilities"][0]["capability_name"] == "report"
            elif path == f"/tasks/{task_id}/bids":
                assert result["bids"][0]["agent_name"] == market.agent.name
            elif path == f"/jobs/{job_id}":
                assert result["tasks_count"] == 1
        for path in (
            "/developer/agents", "/developer/assignments", "/developer/earnings/payments",
            f"/tasks/{task_id}/bids/mine", f"/tasks/{task_id}/assignments/mine",
            f"/tasks/{task_id}/submissions/mine",
        ):
            statements.clear()
            result = await request(market, "GET", path, role="developer")
            counts[path] = len(statements)
            assert result["items"], path
    finally:
        event.remove(engine, "before_cursor_execute", capture)
    assert all(count <= 12 for count in counts.values()), counts
