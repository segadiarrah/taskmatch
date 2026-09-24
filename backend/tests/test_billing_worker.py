"""Durable worker claims and crash recovery against isolated PostgreSQL."""

import asyncio
import uuid
from datetime import timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy import event, select
from sqlalchemy.orm import lazyload

from app.models.billing import BillingOperation, BillingWorkerHeartbeat
from app.models.job import Job
from app.models.payment import PaymentRecord
from app.services import billing_processors as processors
from app.services import billing_service as billing
from app.services import billing_worker as worker
from app.services.stripe_gateway import StripeGatewayError
from tests.test_lifecycle_integration import market as _market_fixture

market = _market_fixture


async def enqueue(market, **values):
    async with market.db() as db:
        item = BillingOperation(
            id=uuid.uuid4(),
            key=f"worker:{uuid.uuid4()}",
            kind="stripe_event",
            entity_id=f"evt_{uuid.uuid4().hex}",
            **values,
        )
        db.add(item)
        await db.commit()
        return item


async def test_concurrent_workers_claim_operation_once(market, monkeypatch):
    item = await enqueue(market)
    entered, finish = asyncio.Event(), asyncio.Event()
    calls = []

    async def process(operation_id, factory):
        calls.append(operation_id)
        entered.set()
        await finish.wait()

    monkeypatch.setattr(processors, "process_event", process)
    first = asyncio.create_task(worker.run_once(market.db))
    try:
        await asyncio.wait_for(entered.wait(), timeout=3)
        assert await worker.run_once(market.db) is False
    finally:
        finish.set()
        await first
    assert calls == [item.id]
    async with market.db() as db:
        stored = await db.get(BillingOperation, item.id)
        assert (stored.status, stored.attempts, stored.locked_until) == ("done", 1, None)
        assert await db.get(BillingWorkerHeartbeat, "billing") is not None


async def test_worker_skips_locked_row_and_processes_next(market, monkeypatch):
    locked = await enqueue(market, available_at=billing.now() - timedelta(minutes=2))
    ready = await enqueue(market, available_at=billing.now() - timedelta(minutes=1))
    calls = []

    async def process(operation_id, factory):
        calls.append(operation_id)

    monkeypatch.setattr(processors, "process_event", process)
    async with market.db() as lock:
        await lock.scalar(
            select(BillingOperation).where(BillingOperation.id == locked.id).with_for_update()
        )
        assert await asyncio.wait_for(worker.run_once(market.db), timeout=3) is True
        await lock.rollback()
    assert calls == [ready.id]
    async with market.db() as db:
        assert (await db.get(BillingOperation, locked.id)).status == "pending"


async def test_financial_lane_progresses_during_job_execution(market, monkeypatch):
    from app.api.v1.endpoints import jobs

    financial = await enqueue(market, available_at=billing.now() - timedelta(minutes=1))
    async with market.db() as db:
        execution = BillingOperation(
            key=f"execute:{uuid.uuid4()}", kind="execute", entity_id=str(uuid.uuid4())
        )
        db.add(execution)
        await db.commit()
    entered, finish = asyncio.Event(), asyncio.Event()
    financial_calls = []

    async def execute(job_id):
        assert str(job_id) == execution.entity_id
        entered.set()
        await finish.wait()

    async def process(operation_id, factory):
        financial_calls.append(operation_id)

    monkeypatch.setattr(jobs, "_execute_job", execute)
    monkeypatch.setattr(processors, "process_event", process)
    task = asyncio.create_task(worker.run_once(market.db, execution=True))
    try:
        await asyncio.wait_for(entered.wait(), timeout=3)
        assert await worker.run_once(market.db, execution=False) is True
        async with market.db() as db:
            assert (await db.get(BillingOperation, financial.id)).status == "done"
            assert (await db.get(BillingOperation, execution.id)).status == "processing"
        assert financial_calls == [financial.id]
    finally:
        finish.set()
        await task
    async with market.db() as db:
        db.add(
            BillingOperation(
                key=f"execute:{uuid.uuid4()}", kind="execute", entity_id=str(uuid.uuid4())
            )
        )
        await db.commit()
    assert await worker.run_once(market.db, execution=False) is False


async def test_crashed_claim_is_recovered_after_expiry(market, monkeypatch):
    item = await enqueue(
        market, status="processing", attempts=2, locked_until=billing.now() - timedelta(seconds=1)
    )
    calls = []

    async def process(operation_id, factory):
        calls.append(operation_id)

    monkeypatch.setattr(processors, "process_event", process)
    assert await worker.run_once(market.db) is True
    assert calls == [item.id]
    async with market.db() as db:
        stored = await db.get(BillingOperation, item.id)
        assert (stored.status, stored.attempts) == ("done", 3)


async def test_expired_worker_cannot_overwrite_new_claim_result(market, monkeypatch):
    item = await enqueue(market)
    entered, finish = asyncio.Event(), asyncio.Event()
    calls = 0

    async def process(operation_id, factory):
        nonlocal calls
        calls += 1
        if calls == 1:
            entered.set()
            await finish.wait()
        else:
            raise processors.BillingBlocked("Provider evidence needs review")

    monkeypatch.setattr(processors, "process_event", process)
    first = asyncio.create_task(worker.run_once(market.db))
    try:
        await asyncio.wait_for(entered.wait(), timeout=3)
        async with market.db() as db:
            stored = await db.get(BillingOperation, item.id)
            stored.locked_until = billing.now() - timedelta(seconds=1)
            await db.commit()
        assert await worker.run_once(market.db) is True
    finally:
        finish.set()
        await first
    async with market.db() as db:
        stored = await db.get(BillingOperation, item.id)
        assert (stored.status, stored.attempts) == ("blocked", 2)
        assert stored.last_error == "Provider evidence needs review"


async def test_old_claim_cannot_renew_new_workers_lease(market):
    expiry = billing.now() + timedelta(minutes=3)
    item = await enqueue(market, status="processing", attempts=2, locked_until=expiry)
    assert await worker.renew_lease(market.db, item.id, 1) is False
    async with market.db() as db:
        assert (await db.get(BillingOperation, item.id)).locked_until == expiry
    assert await worker.renew_lease(market.db, item.id, 2) is True
    async with market.db() as db:
        assert (await db.get(BillingOperation, item.id)).locked_until > expiry


@pytest.mark.parametrize(
    "error,status",
    [
        (StripeGatewayError("Temporary provider failure", retryable=True), "pending"),
        (StripeGatewayError("Rejected request"), "failed"),
        (processors.BillingBlocked("Review required"), "blocked"),
        (HTTPException(409, "Funding frozen"), "blocked"),
        (RuntimeError("private connection information"), "pending"),
    ],
)
async def test_outcome_classification_and_retry_backoff(market, monkeypatch, error, status):
    item = await enqueue(market)

    async def process(operation_id, factory):
        raise error

    monkeypatch.setattr(processors, "process_event", process)
    before = billing.now()
    assert await worker.run_once(market.db) is True
    async with market.db() as db:
        stored = await db.get(BillingOperation, item.id)
        assert stored.status == status
        assert stored.attempts == 1 and stored.locked_until is None
        assert stored.last_error and "private connection information" not in stored.last_error
        if status == "pending":
            assert stored.available_at >= before + timedelta(seconds=2)
    assert await worker.run_once(market.db) is False


async def test_retry_limit_preserves_visible_failed_operation(market, monkeypatch):
    item = await enqueue(market, attempts=11)

    async def process(operation_id, factory):
        raise StripeGatewayError("Temporary provider failure", retryable=True)

    monkeypatch.setattr(processors, "process_event", process)
    await worker.run_once(market.db)
    async with market.db() as db:
        stored = await db.get(BillingOperation, item.id)
        assert (stored.status, stored.attempts) == ("failed", 12)


@pytest.mark.parametrize(
    "external_started,attempts,error,expected",
    [
        (True, 0, StripeGatewayError(retryable=True), "processing"),
        (True, 11, StripeGatewayError(retryable=True), "processing"),
        (True, 0, processors.BillingBlocked("Uncertain remote outcome"), "processing"),
        (False, 0, processors.BillingBlocked("Onboarding required"), "blocked"),
    ],
)
async def test_unknown_transfer_stays_processing_until_reconciled(
    market, monkeypatch, external_started, attempts, error, expected
):
    async with market.db() as db:
        job = Job(
            client_user_id=market.users["owner"].id,
            title="Worker test",
            raw_description="Report",
            budget_min=100,
            budget_max=100,
        )
        db.add(job)
        await db.flush()
        payment = PaymentRecord(
            job_id=job.id,
            client_user_id=job.client_user_id,
            gross_amount=100,
            platform_fee=10,
            net_amount=90,
            currency="EUR",
            provider="stripe_connect",
            payment_status="releasable",
        )
        db.add(payment)
        await db.flush()
        item = BillingOperation(
            key=f"transfer:{payment.id}",
            kind="transfer",
            entity_id=str(payment.id),
            attempts=attempts,
            external_started_at=billing.now() if external_started else None,
        )
        db.add(item)
        await db.commit()

    async def transfer(operation_id, factory):
        raise error

    monkeypatch.setattr(processors, "transfer", transfer)
    await worker.run_once(market.db)
    async with market.db() as db:
        stored = await db.get(PaymentRecord, payment.id, options=[lazyload("*")])
        assert stored.payment_status == expected
        assert stored.transfer_id is None and stored.payout_error


async def test_cancelled_worker_leaves_recoverable_claim(market, monkeypatch):
    item = await enqueue(market)
    entered = asyncio.Event()

    async def process(operation_id, factory):
        entered.set()
        await asyncio.Event().wait()

    monkeypatch.setattr(processors, "process_event", process)
    task = asyncio.create_task(worker.run_once(market.db))
    await asyncio.wait_for(entered.wait(), timeout=3)
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task
    async with market.db() as db:
        stored = await db.get(BillingOperation, item.id)
        assert stored.status == "processing" and stored.locked_until is not None


async def test_transfer_failure_does_not_invert_job_and_outbox_locks(market, monkeypatch):
    async with market.db() as db:
        job = Job(
            client_user_id=market.users["owner"].id,
            title="Lock order",
            raw_description="Report",
            budget_min=100,
            budget_max=100,
        )
        db.add(job)
        await db.flush()
        payment = PaymentRecord(
            job_id=job.id,
            client_user_id=job.client_user_id,
            gross_amount=100,
            platform_fee=10,
            net_amount=90,
            provider="stripe_connect",
            payment_status="releasable",
        )
        db.add(payment)
        await db.flush()
        item = BillingOperation(
            key=f"transfer:{payment.id}", kind="transfer", entity_id=str(payment.id)
        )
        db.add(item)
        await db.commit()
    entered, fail, finalizing = asyncio.Event(), asyncio.Event(), asyncio.Event()

    async def transfer(operation_id, factory):
        entered.set()
        await fail.wait()
        raise processors.BillingBlocked("Onboarding required")

    def query_started(conn, cursor, statement, parameters, context, executemany):
        if fail.is_set() and "FOR UPDATE" in statement and "FROM jobs" in statement:
            finalizing.set()

    def query_finished(conn, cursor, statement, parameters, context, executemany):
        if fail.is_set() and "FOR UPDATE" in statement and "FROM billing_operations" in statement:
            finalizing.set()

    monkeypatch.setattr(processors, "transfer", transfer)
    engine = market.db.kw["bind"].sync_engine
    event.listen(engine, "before_cursor_execute", query_started)
    event.listen(engine, "after_cursor_execute", query_finished)
    task = asyncio.create_task(worker.run_once(market.db))
    try:
        await asyncio.wait_for(entered.wait(), timeout=3)
        async with market.db() as other:
            # Refund/retry handlers own the job before touching the ledger and
            # outbox. Error finalization must use the same order.
            await other.scalar(
                select(Job).options(lazyload("*")).where(Job.id == job.id).with_for_update()
            )
            await other.scalar(
                select(PaymentRecord)
                .options(lazyload("*"))
                .where(PaymentRecord.id == payment.id)
                .with_for_update()
            )
            fail.set()
            await asyncio.wait_for(finalizing.wait(), timeout=3)
            await asyncio.wait_for(
                other.scalar(
                    select(BillingOperation).where(BillingOperation.id == item.id).with_for_update()
                ),
                timeout=2,
            )
            await other.rollback()
    finally:
        fail.set()
        await task
        event.remove(engine, "before_cursor_execute", query_started)
        event.remove(engine, "after_cursor_execute", query_finished)
