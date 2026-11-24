"""First-project pricing through real PostgreSQL and Stripe's local transport fixture."""
import asyncio
import uuid
from decimal import Decimal

from sqlalchemy import select

from app.models import AuditLog, Job, PaymentRecord, Quote, User
from app.models.billing import JobFunding
from tests.test_billing import market, stripe  # noqa: F401 -- shared fixtures
from tests.test_lifecycle_integration import request


async def project(market, role="owner"):
    job = await request(market, "POST", "/jobs", expected=201, role=role, json={
        "title": "Write report", "raw_description": "Write a concise report on team process.",
        "budget_min": 1, "budget_max": 100, "auto_select_enabled": False,
    })
    await request(market, "POST", f"/jobs/{job['id']}/submit", role=role)
    return job["id"], (await request(market, "GET", f"/jobs/{job['id']}/quote", role=role))["quote"]


async def pay(market, stripe, job_id, role="owner"):
    cs = await request(market, "POST", f"/billing/jobs/{job_id}/checkout", role=role)
    stripe.pay(cs["session_id"])
    return await request(market, "POST", f"/billing/jobs/{job_id}/sync", role=role)


async def test_first_quote_waives_only_fee_and_capture_consumes_once(market, stripe):
    job_id, quote = await project(market)
    assert quote["platform_fee"] == 0
    assert quote["total"] == quote["subtotal"]
    assert quote["platform_fee_waived"] == round(quote["subtotal"] * .1, 2)
    assert quote["subtotal"] == sum(t["price"] for t in quote["tasks"])
    first = await pay(market, stripe, job_id)
    assert first["amount_minor"] == round(quote["total"] * 100)
    await request(market, "POST", f"/billing/jobs/{job_id}/sync")
    second_id, second = await project(market)
    assert second["platform_fee_waived"] == 0
    assert second["platform_fee"] == quote["platform_fee_waived"]
    assert (await pay(market, stripe, second_id))["amount_minor"] == round(second["total"] * 100)
    async with market.db() as db:
        events = (await db.scalars(select(AuditLog.action).where(AuditLog.action.like("first_project.%")))).all()
        assert events.count("first_project.reserved") == events.count("first_project.redeemed") == 1


async def test_concurrent_projects_of_one_account_reserve_once_and_release_on_cancel(market, stripe):
    first, _ = await project(market)
    other, _ = await project(market)
    results = await asyncio.gather(*(market.http.post(f"/billing/jobs/{job_id}/checkout", headers=market.headers['owner']) for job_id in (first, other)))
    assert sorted(r.status_code for r in results) == [200, 409]
    winner, loser = (first, other) if results[0].status_code == 200 else (other, first)
    assert len(stripe.sessions) == 1
    await request(market, "POST", f"/billing/jobs/{winner}/cancel")
    assert (await pay(market, stripe, loser))["status"] == "paid"
    await request(market, "POST", f"/billing/jobs/{winner}/checkout", expected=409)
    assert len(stripe.sessions) == 2
    updated = (await request(market, "POST", f"/jobs/{winner}/quote/refresh"))["quote"]
    assert updated['platform_fee'] > 0


async def test_capture_already_refunded_consumes_once_and_preserves_charge_amount(market, stripe):
    job_id, quote = await project(market)
    cs = await request(market, "POST", f"/billing/jobs/{job_id}/checkout")
    charge = stripe.pay(cs['session_id'])['payment_intent']['latest_charge']
    charge.update(refunded=True, amount_refunded=charge['amount'])
    result = await request(market, "POST", f"/billing/jobs/{job_id}/sync")
    assert result['status'] == 'refunded'
    assert result['refunded_minor'] == result['amount_minor'] == round(quote['subtotal'] * 100)
    _, second = await project(market)
    assert second['platform_fee'] > 0


async def test_last_seat_serialized_and_twenty_first_requires_new_quote(market, stripe):
    first, q1 = await project(market)
    other, q2 = await project(market, 'stranger')
    assert q1['platform_fee'] == q2['platform_fee'] == 0
    async with market.db() as db:
        for seat in range(1, 20):
            user = User(id=uuid.uuid4(), role='client', full_name='Prior customer', email=f'prior{seat}@example.test', hashed_password='unused')
            db.add(user)
            await db.flush()
            job = Job(id=uuid.uuid4(), client_user_id=user.id, title='Prior project', raw_description='History', status='completed', budget_min=1, budget_max=10, currency='EUR')
            db.add(job)
            await db.flush()
            quote = Quote(id=uuid.uuid4(), job_id=job.id, status='accepted', subtotal=10, platform_fee=0, total=10, pricing_version='test')
            db.add(quote)
            await db.flush()
            db.add(JobFunding(job_id=job.id, client_user_id=user.id, quote_id=quote.id, amount_minor=1000, currency='eur', status='paid', livemode=False, charge_id=f'ch_prior{seat}', first_project_slot=seat))
        await db.commit()
    callers = [(first, 'owner'), (other, 'stranger')]
    responses = await asyncio.gather(*(market.http.post(f'/billing/jobs/{job}/checkout', headers=market.headers[role]) for job, role in callers))
    assert sorted(r.status_code for r in responses) == [200, 409]
    accepted = next(i for i, r in enumerate(responses) if r.status_code == 200)
    job, role = callers[accepted]
    stripe.pay(responses[accepted].json()['session_id'])
    await request(market, 'POST', f'/billing/jobs/{job}/sync', role=role)
    job, role = callers[1-accepted]
    await request(market, 'POST', f'/billing/jobs/{job}/checkout', role=role, expected=409)
    assert len(stripe.sessions) == 1
    q = (await request(market, 'POST', f'/jobs/{job}/quote/refresh', role=role))['quote']
    assert q['platform_fee'] > 0 and q['platform_fee_waived'] == 0
    assert (await pay(market, stripe, job, role))['amount_minor'] == round(q['total'] * 100)


async def test_only_verified_unpaid_expiry_releases_an_abandoned_seat(market, stripe, monkeypatch):
    from datetime import timedelta
    from app.services import billing_service as billing, billing_worker

    job, _ = await project(market)
    session = await request(market, 'POST', f'/billing/jobs/{job}/checkout')
    remote = stripe.sessions[session['session_id']]
    _, other = await project(market)
    async with market.db() as db:
        funding = await billing.latest_funding(db, uuid.UUID(job))
        check_time = funding.checkout_expires_at + timedelta(minutes=2)
    monkeypatch.setattr(billing, 'now', lambda: check_time)
    # The calendar alone is insufficient proof; an externally open session holds its place.
    await billing_worker.run_once(market.db, execution=False)
    async with market.db() as db:
        assert (await billing.latest_funding(db, uuid.UUID(job))).first_project_slot is not None
    remote['status'] = 'expired'
    remote['metadata']['taskmatch_quote_id'] = 'invalid'
    await request(market, 'POST', f'/billing/jobs/{job}/sync', expected=409)
    async with market.db() as db:
        funding = await billing.latest_funding(db, uuid.UUID(job))
        assert funding.first_project_slot is not None
        remote['metadata']['taskmatch_quote_id'] = str(funding.quote_id)
    monkeypatch.setattr(billing, 'now', lambda: check_time + timedelta(minutes=5))
    await billing_worker.run_once(market.db, execution=False)
    async with market.db() as db:
        funding = await billing.latest_funding(db, uuid.UUID(job))
        assert funding.status == 'expired' and funding.first_project_slot is None
    assert other['platform_fee'] == 0


async def test_historical_full_price_and_manual_records_remain_unchanged(market, stripe):
    from app.services import billing_service as billing

    job_id, _ = await project(market)
    async with market.db() as db:
        # A real pre-campaign quote has no offer metadata. Checkout must honor it.
        q = await db.scalar(select(Quote).where(Quote.job_id == uuid.UUID(job_id)))
        q.platform_fee = Decimal('0.62')
        q.total = q.subtotal + q.platform_fee
        q.breakdown_json = None
        await db.commit()
        historical_total = q.total
    amount = (await pay(market, stripe, job_id))['amount_minor']
    assert amount == int(historical_total * 100)
    async with market.db() as db:
        assert (await billing.latest_funding(db, uuid.UUID(job_id))).first_project_slot is None
    _, q = await project(market)
    assert q['platform_fee'] > 0
    async with market.db() as db:
        job = Job(id=uuid.uuid4(), client_user_id=market.users['stranger'].id, title='Legacy payment', raw_description='Historical', budget_min=1, budget_max=20, status='completed', currency='EUR', billing_mode='legacy_manual')
        db.add(job)
        await db.flush()
        record = PaymentRecord(id=uuid.uuid4(), client_user_id=job.client_user_id, job_id=job.id, platform_fee=1, net_amount=9, gross_amount=10, provider='manual', payment_status='paid', currency='EUR')
        db.add(record)
        await db.commit()
    _, q = await project(market, 'stranger')
    assert q['platform_fee_waived'] == 0
    async with market.db() as db:
        assert (await db.get(PaymentRecord, record.id)).platform_fee == 1


async def test_live_eligibility_ignores_test_captures_and_filters_known_fixtures(market, stripe):
    from app.services import first_project_offer

    job, _ = await project(market)
    await pay(market, stripe, job)
    async with market.db() as db:
        customer = await db.get(User, market.users['owner'].id)
        customer.email = 'customer@real-customer.fr'
        customer.registration_origin = 'unknown'
        await db.flush()
        assert await first_project_offer.eligible_customer(db, customer.id, True)
        assert not await first_project_offer.eligible_customer(db, customer.id, False)
        for origin in ('admin', 'demo', 'seed', 'test'):
            customer.registration_origin = origin
            await db.flush()
            assert not await first_project_offer.eligible_customer(db, customer.id, True)
        assert not await first_project_offer.eligible_customer(db, market.users['admin'].id, True)


async def test_old_quote_tab_cannot_start_checkout_for_a_replacement(market, stripe):
    job, quote = await project(market)
    updated = (await request(market, 'POST', f'/jobs/{job}/quote/refresh'))['quote']
    assert updated['id'] != quote['id']
    for path in (f'/jobs/{job}/quote/accept', f'/billing/jobs/{job}/checkout'):
        result = await market.http.post(path, headers={**market.headers['owner'], 'X-TaskMatch-Quote-Id': quote['id']})
        assert result.status_code == 409
    assert not stripe.sessions


async def test_old_manual_settlement_audit_counts_even_with_historical_provider_label(market, stripe):
    from app.services import first_project_offer
    async with market.db() as db:
        owner=market.users['owner']
        job=Job(id=uuid.uuid4(),client_user_id=owner.id,title='Old manual project',raw_description='Settled',
            status='completed',billing_mode='legacy_manual',currency='EUR',budget_min=1,budget_max=10)
        db.add(job)
        await db.flush()
        record=PaymentRecord(id=uuid.uuid4(),client_user_id=owner.id,job_id=job.id,platform_fee=1,net_amount=9,
            gross_amount=10,provider='stripe',payment_status='paid',currency='EUR',provider_ref='demo_seed')
        db.add(record)
        await db.flush()
        assert await first_project_offer.eligible_customer(db,owner.id,False)
        record.provider_ref=None
        db.add(AuditLog(actor_type='user',actor_id=str(market.users['admin'].id),entity_type='payment',
                        entity_id=str(record.id),action='complete_payment'))
        await db.flush()
        assert not await first_project_offer.eligible_customer(db,owner.id,False)


async def test_payment_mode_change_rejects_old_session_before_gateway_request(market, stripe, monkeypatch):
    from app.core.config import settings

    job, _ = await project(market)
    await request(market, 'POST', f'/billing/jobs/{job}/checkout')
    await request(market, 'POST', f'/billing/jobs/{job}/cancel')
    calls = len(stripe.calls)
    # Credentials below are fixture strings; the local transport is still the only gateway.
    monkeypatch.setattr(settings, 'STRIPE_MODE', 'live')
    monkeypatch.setattr(settings, 'STRIPE_SECRET_KEY', 'sk_live_fixture_only')
    await request(market, 'POST', f'/billing/jobs/{job}/checkout', expected=409)
    assert len(stripe.calls) == calls
