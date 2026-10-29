"""Persisted funding gates and settlement allocation regressions."""

import uuid
from datetime import timedelta
from unittest.mock import AsyncMock
from decimal import Decimal

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.api.v1.endpoints import jobs
from app.models.assignment import Assignment
from app.models.bid import Bid
from app.models.billing import BillingOperation, JobFunding
from app.models.job import Job
from app.models.payment import PaymentRecord
from app.models.quote import Quote, TaskQuote
from app.models.task import Task
from app.models.submission import Submission
from app.services import billing_worker, llm_service
from tests.test_lifecycle_integration import (
    assigned_task,
    planned_job,
    request,
    submitted_task,
)
from tests.test_lifecycle_integration import (
    market as _market_fixture,
)

market = _market_fixture


def test_job_billing_policy_defaults_to_stripe():
    column = Job.__table__.columns.get("billing_mode")
    assert column is not None, "Missing explicit persisted funding policy"
    assert column.default.arg == "stripe"
    assert column.server_default.arg == "stripe"


async def mark_stripe(market, job_id):
    async with market.db() as db:
        job = await db.get(Job, uuid.UUID(job_id))
        job.billing_mode = "stripe"
        await db.commit()


async def funding_for(market, job_id, status="paid"):
    async with market.db() as db:
        job = await db.get(Job, uuid.UUID(job_id))
        job.billing_mode = "stripe"
        quote = await db.scalar(select(Quote).where(Quote.job_id == job.id))
        funding = JobFunding(
            job_id=job.id,
            quote_id=quote.id,
            client_user_id=job.client_user_id,
            amount_minor=int(Decimal(quote.total) * 100),
            currency=quote.currency.lower(),
            livemode=False,
            status=status,
            checkout_session_id=f"cs_test_{uuid.uuid4().hex}",
            payment_intent_id=f"pi_{uuid.uuid4().hex}" if status == "paid" else None,
            charge_id=f"ch_{uuid.uuid4().hex}" if status == "paid" else None,
        )
        db.add(funding)
        await db.commit()
        return funding


async def test_new_job_uses_explicit_legacy_setting(market):
    plan = await planned_job(market)
    async with market.db() as db:
        job = await db.get(Job, uuid.UUID(plan["job"]["id"]))
        assert job.billing_mode == "legacy_manual"


@pytest.mark.parametrize(
    "action", ["bid", "select", "assign", "offer", "match", "rank", "match_service", "rank_service"]
)
async def test_unfunded_stripe_job_cannot_start_work(market, action):
    plan = await planned_job(market)
    job_id, task_id = plan["job"]["id"], plan["tasks"][0]["id"]
    await request(market, "POST", f"/jobs/{job_id}/quote/accept")
    async with market.db() as db:
        job = await db.get(Job, uuid.UUID(job_id))
        job.billing_mode = "stripe"
        line = await db.scalar(select(TaskQuote).where(TaskQuote.task_id == uuid.UUID(task_id)))
        line.route, line.human_price_low, line.human_price_high = "human", 1, 2
        bid = Bid(
            task_id=uuid.UUID(task_id),
            agent_id=market.agent.id,
            price=1,
            eta_hours=1,
            confidence_score=1,
            status="submitted",
        )
        db.add(bid)
        await db.commit()
        bid_id = bid.id
    if action.endswith("_service"):
        from app.services import mcp_service

        async with market.db() as db:
            with pytest.raises(HTTPException) as failure:
                await getattr(
                    mcp_service, "match_agents" if action == "match_service" else "rank_bids"
                )(db, uuid.UUID(task_id))
            assert failure.value.status_code == 402
        return
    routes = {
        "bid": (
            "POST",
            f"/tasks/{task_id}/bids",
            "developer",
            {
                "task_id": task_id,
                "agent_id": str(market.agent.id),
                "price": 1,
                "eta_hours": 1,
                "confidence_score": 1,
            },
        ),
        "select": ("PUT", f"/bids/{bid_id}/select", "admin", None),
        "assign": ("POST", f"/tasks/{task_id}/assign?agent_id={market.agent.id}", "admin", None),
        "offer": (
            "POST",
            f"/jobs/offers/{task_id}/accept",
            "developer",
            {"agent_id": str(market.agent.id), "price": 1},
        ),
        "match": ("POST", f"/mcp/match-agents/{task_id}", "admin", None),
        "rank": ("POST", f"/mcp/rank-bids/{task_id}", "admin", None),
    }
    method, path, role, payload = routes[action]
    await request(market, method, path, role=role, json=payload, expected=402)
    async with market.db() as db:
        assert (
            await db.scalar(select(Assignment.id).where(Assignment.task_id == uuid.UUID(task_id)))
            is None
        )


@pytest.mark.parametrize("action", ["submit", "review", "validate"])
async def test_unfunded_stripe_job_cannot_advance_existing_assignment(market, action):
    if action == "submit":
        job_id, task_id, assignment_id = await assigned_task(market)
        submission_id = None
    else:
        job_id, task_id, assignment_id, submission_id = await submitted_task(market)
    await mark_stripe(market, job_id)
    if action == "submit":
        await request(
            market,
            "POST",
            f"/tasks/{task_id}/submissions",
            role="developer",
            expected=402,
            json={
                "task_id": task_id,
                "agent_id": str(market.agent.id),
                "assignment_id": assignment_id,
                "output_json": {"result": "report"},
            },
        )
    elif action == "review":
        await request(
            market,
            "POST",
            f"/submissions/{submission_id}/reviews",
            expected=402,
            json={"submission_id": submission_id, "decision": "approved", "score": 95},
        )
    else:
        await request(
            market, "POST", f"/mcp/validate-submission/{submission_id}", role="admin", expected=402
        )


@pytest.mark.parametrize("worker", ["execute", "revision"])
async def test_workers_propagate_funding_failure_for_durable_retry(market, worker):
    plan = await planned_job(market)
    job_id = plan["job"]["id"]
    await mark_stripe(market, job_id)
    with pytest.raises(HTTPException) as failure:
        if worker == "execute":
            await jobs._execute_job(uuid.UUID(job_id))
        else:
            await jobs._run_revision(uuid.UUID(job_id), "revision")
    assert failure.value.status_code == 402


async def test_admin_task_update_cannot_bypass_workflow(market):
    plan = await planned_job(market)
    await request(
        market,
        "PUT",
        f"/tasks/{plan['tasks'][0]['id']}",
        role="admin",
        expected=409,
        json={"status": "assigned"},
    )


async def test_earnings_keep_currencies_separate_and_paginate_transfer_history(market):
    async with market.db() as db:
        for currency, amount, status in (
            ("USD", 20, "paid"),
            ("EUR", 10, "paid"),
            ("EUR", 7, "blocked"),
        ):
            job = Job(
                client_user_id=market.users["owner"].id,
                title="Delivered report",
                raw_description="Report",
                budget_min=1,
                budget_max=50,
                currency=currency,
                status="completed",
                billing_mode="stripe",
            )
            db.add(job)
            await db.flush()
            db.add(
                PaymentRecord(
                    job_id=job.id,
                    client_user_id=market.users["owner"].id,
                    developer_user_id=market.users["developer"].id,
                    gross_amount=amount,
                    platform_fee=0,
                    net_amount=amount,
                    currency=currency,
                    payment_status=status,
                    provider="stripe_connect",
                    transfer_id=f"tr_{currency}" if status == "paid" else None,
                    payout_error="Complete Stripe onboarding" if status == "blocked" else None,
                )
            )
        await db.commit()
    summary = await request(market, "GET", "/developer/earnings/summary", role="developer")
    assert summary["currency"] is None
    assert summary["total_earned"] is None
    totals = {row["currency"]: row for row in summary["by_currency"]}
    assert totals["USD"]["total_earned"] == 20
    assert totals["EUR"]["total_earned"] == 10
    assert totals["EUR"]["pending_payments"] == 7
    dashboard = await request(market, "GET", "/developer/dashboard/stats", role="developer")
    assert dashboard["total_earnings"] is None
    assert dashboard["earnings_by_currency"] == [
        {"currency": "EUR", "amount": 10}, {"currency": "USD", "amount": 20},
    ]
    history = await request(
        market, "GET", "/developer/earnings/payments?skip=1&limit=2", role="developer"
    )
    assert history["total"] == 3
    assert history["skip"] == 1
    assert len(history["items"]) == 2
    assert all(row["provider"] == "stripe_connect" for row in history["items"])
    assert all("transfer_id" in row and "payout_error" in row for row in history["items"])


@pytest.mark.parametrize("action", ["refresh", "reject", "delivery", "job", "task"])
async def test_pending_checkout_freezes_priced_work(market, action):
    plan = await planned_job(market)
    job_id, task_id = plan["job"]["id"], plan["tasks"][0]["id"]
    await funding_for(market, job_id, "checkout_pending")
    routes = {
        "refresh": ("POST", f"/jobs/{job_id}/quote/refresh", "owner", None),
        "reject": ("POST", f"/jobs/{job_id}/quote/reject", "owner", {"reason": "changed mind"}),
        "delivery": ("PUT", f"/jobs/{job_id}/delivery", "owner", {"mode": "installation"}),
        "job": ("PUT", f"/jobs/{job_id}", "admin", {"raw_description": "Different work"}),
        "task": ("PUT", f"/tasks/{task_id}", "admin", {"description": "Different work"}),
    }
    method, path, role, payload = routes[action]
    await request(market, method, path, role=role, json=payload, expected=409)


@pytest.mark.parametrize("platform", [False, True])
async def test_paid_funding_allocates_once_and_acceptance_queues_only_external_transfers(
    market, platform
):
    job_id, task_id, _, submission_id = await submitted_task(market)
    funding = await funding_for(market, job_id)
    if platform:
        from app.models.agent import Agent

        async with market.db() as db:
            agent = await db.get(Agent, market.agent.id)
            agent.developer_user_id = market.users["admin"].id
            await db.commit()
    await request(
        market,
        "POST",
        f"/submissions/{submission_id}/reviews",
        expected=201,
        json={"submission_id": submission_id, "decision": "approved", "score": 95},
    )
    async with market.db() as db:
        from app.services.workflow_service import finalize_job_if_done

        job = await db.get(Job, uuid.UUID(job_id))
        await finalize_job_if_done(db, job)
        await db.commit()
        payments = list(
            (
                await db.execute(select(PaymentRecord).where(PaymentRecord.job_id == job.id))
            ).scalars()
        )
        assert len(payments) == 1
        payment = payments[0]
        assert payment.funding_id == funding.id
        assert payment.provider == ("platform" if platform else "stripe_connect")
        assert payment.payment_status == "pending"
        assert int(Decimal(payment.gross_amount) * 100) == funding.amount_minor
        if platform:
            assert payment.net_amount == 0
            assert payment.platform_fee == payment.gross_amount
        assert (
            await db.scalar(select(BillingOperation.id).where(BillingOperation.kind == "transfer"))
            is None
        )
    accepted = await request(market, "POST", f"/jobs/{job_id}/accept")
    assert accepted["payment_settlement"] == "stripe"
    async with market.db() as db:
        payment = await db.get(PaymentRecord, payment.id)
        assert payment.payment_status == ("paid" if platform else "releasable")
        operations = list(
            (
                await db.execute(
                    select(BillingOperation).where(BillingOperation.kind == "transfer")
                )
            ).scalars()
        )
        assert len(operations) == (0 if platform else 1)


@pytest.mark.parametrize("action", ["create", "release", "complete"])
async def test_admin_cannot_fabricate_manual_settlement_for_stripe_job(market, action):
    job_id, _, _, submission_id = await submitted_task(market)
    await request(
        market,
        "POST",
        f"/submissions/{submission_id}/reviews",
        expected=201,
        json={"submission_id": submission_id, "decision": "approved", "score": 95},
    )
    await request(market, "POST", f"/jobs/{job_id}/accept")
    await mark_stripe(market, job_id)
    async with market.db() as db:
        payment_id = await db.scalar(
            select(PaymentRecord.id).where(PaymentRecord.job_id == uuid.UUID(job_id))
        )
    if action == "create":
        await request(
            market,
            "POST",
            "/payments",
            role="admin",
            expected=409,
            json={
                "job_id": job_id,
                "client_user_id": str(market.users["owner"].id),
                "gross_amount": 20,
            },
        )
    else:
        await request(market, "PUT", f"/payments/{payment_id}/{action}", role="admin", expected=409)


@pytest.mark.parametrize(
    "action,state",
    [
        ("create", "pending"),
        ("authorize", "pending"),
        ("release", "authorized"),
        ("complete", "releasable"),
    ],
)
async def test_manual_service_cannot_fabricate_stripe_settlement(market, action, state):
    from app.services import payment_service

    async with market.db() as db:
        job = Job(
            client_user_id=market.users["owner"].id,
            title="Report",
            raw_description="Report",
            budget_min=1,
            budget_max=10,
            status="completed",
            billing_mode="stripe",
        )
        db.add(job)
        await db.flush()
        task = Task(
            job_id=job.id, title="Report", description="Report", task_type="general", budget=10
        )
        db.add(task)
        await db.flush()
        payment = PaymentRecord(
            job_id=job.id,
            task_id=task.id,
            client_user_id=job.client_user_id,
            gross_amount=10,
            platform_fee=1,
            net_amount=9,
            provider="manual",
            payment_status=state,
        )
        db.add(payment)
        await db.commit()
        with pytest.raises(ValueError, match="legacy|manual|Stripe"):
            if action == "create":
                await payment_service.create_payment_for_task(db, task.id)
            else:
                await getattr(payment_service, f"{action}_payment")(db, payment.id)


async def platform_worker(market, job_id, auto_select=False):
    from app.models.agent import Agent

    async with market.db() as db:
        worker = Agent(
            developer_user_id=market.users["admin"].id,
            name="Platform worker",
            slug="llm-openai",
            description="Platform",
            endpoint_url="https://api.openai.com/v1",
            status="active",
        )
        db.add(worker)
        job = await db.get(Job, uuid.UUID(job_id))
        job.auto_select_enabled = auto_select
        await db.commit()
        return worker


async def test_execution_retry_does_not_duplicate_platform_bids(market, monkeypatch):
    plan = await planned_job(market)
    job_id, task_id = plan["job"]["id"], plan["tasks"][0]["id"]
    await request(market, "POST", f"/jobs/{job_id}/quote/accept")
    worker = await platform_worker(market, job_id)
    await funding_for(market, job_id)
    generate = AsyncMock(side_effect=AssertionError("Manual selection must not generate work"))
    monkeypatch.setattr(llm_service, "execute_task_output", generate)
    await jobs._execute_job(uuid.UUID(job_id))
    await jobs._execute_job(uuid.UUID(job_id))
    async with market.db() as db:
        operations = list((await db.execute(select(BillingOperation).where(
            BillingOperation.kind == "execute_task"))).scalars())
        assert len(operations) == 1
        assert operations[0].payload["execution"]["provider"] == "openai"
        assert operations[0].payload["execution"]["model"] == "gpt-6.1-sol"
    assert await billing_worker.run_once(market.db, execution=True)
    # Simulate delivery of the same durable operation after a worker restart.
    async with market.db() as db:
        operation = await db.get(BillingOperation, operations[0].id)
        assert operation.status == "done"
        operation.status = "pending"
        operation.available_at = operation.created_at - timedelta(seconds=1)
        await db.commit()
    assert await billing_worker.run_once(market.db, execution=True)
    async with market.db() as db:
        bids = list((await db.execute(select(Bid).where(
            Bid.task_id == uuid.UUID(task_id), Bid.agent_id == worker.id))).scalars())
        assert len(bids) == 1
        assert await db.scalar(select(Assignment.id).where(Assignment.task_id == uuid.UUID(task_id))) is None
    generate.assert_not_called()


async def test_execution_failure_is_retried_without_committing_fake_completion(market, monkeypatch):
    plan = await planned_job(market)
    job_id, task_id = plan["job"]["id"], plan["tasks"][0]["id"]
    await request(market, "POST", f"/jobs/{job_id}/quote/accept")
    worker = await platform_worker(market, job_id, auto_select=True)
    await funding_for(market, job_id)
    generate = AsyncMock(return_value=None)
    monkeypatch.setattr(llm_service, "execute_task_output", generate)
    await jobs._execute_job(uuid.UUID(job_id))
    generate.assert_not_called()  # The job dispatcher only enqueues work.
    assignment_id = None
    for attempt in (1, 2):
        assert await billing_worker.run_once(market.db, execution=True)
        async with market.db() as db:
            task = await db.get(Task, uuid.UUID(task_id))
            assert task.status == "assigned"
            assignments = list((await db.execute(select(Assignment).where(
                Assignment.task_id == task.id))).scalars())
            assert len(assignments) == 1 and assignments[0].status == "active"
            assert assignments[0].agent_id == worker.id
            if assignment_id is None:
                assignment_id = assignments[0].id
            assert assignments[0].id == assignment_id
            assert await db.scalar(select(Submission.id).where(Submission.task_id == task.id)) is None
            operation = await db.scalar(select(BillingOperation).where(
                BillingOperation.kind == "execute_task", BillingOperation.entity_id == str(task.id)))
            assert operation.status == "pending"
            assert operation.payload["calls"] == attempt
            assert operation.payload["attempt_log"][-1]["outcome"] == "unavailable"
            assert task.input_spec_json["_execution_calls"] == attempt
            assert operation.payload["reserved_cost_eur"] > 0
            assert (await db.get(Job, uuid.UUID(job_id))).status == "in_progress"
            operation.available_at = operation.created_at - timedelta(seconds=1)
            await db.commit()
    assert generate.await_count == 2
    assert generate.call_args.kwargs["execution"]["provider"] == "openai"


async def test_stripe_revision_is_queued_durably(market):
    job_id, _, _, submission_id = await submitted_task(market)
    await funding_for(market, job_id)
    await request(
        market,
        "POST",
        f"/submissions/{submission_id}/reviews",
        expected=201,
        json={"submission_id": submission_id, "decision": "approved", "score": 95},
    )
    await request(market, "POST", f"/jobs/{job_id}/dispute", json={"reason": "More details"})
    async with market.db() as db:
        operation = await db.scalar(
            select(BillingOperation).where(BillingOperation.kind == "execute")
        )
        assert operation is not None
        assert operation.payload == {"revision_reason": "More details"}


async def test_unfunded_open_work_is_not_advertised_to_developers(market):
    plan = await planned_job(market)
    job_id = plan["job"]["id"]
    await request(market, "POST", f"/jobs/{job_id}/quote/accept")
    await mark_stripe(market, job_id)
    tasks = await request(market, "GET", "/tasks/open", role="developer")
    assert tasks["total"] == 0
    jobs = await request(market, "GET", "/jobs", role="developer")
    assert jobs["total"] == 0
