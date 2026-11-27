"""Consent is required for deduplicated, first-party aggregate measurement."""
from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.models import User
from tests.test_lifecycle_integration import market, request  # noqa: F401


async def test_measurement_requires_optin_and_revocation_removes_cohort(market):
    event = {"kind":"landing_page_view","language":"fr"}
    assert (await market.http.post("/measurement/events", json=event)).status_code == 403
    assert (await market.http.post("/measurement/referral", json={"code":"A"*22})).status_code == 403
    r = await market.http.post("/measurement/consent", json={"allow":True, "language":"fr"})
    assert r.status_code == 201
    assert "httponly" in r.headers["set-cookie"].lower()
    for _ in range(3):
        assert (await market.http.post("/measurement/events", json=event)).status_code == 204
    data = await request(market, "GET", "/admin/growth/funnel", role="admin")
    assert data["cohort_visitors"] == 1
    assert data["events"]["landing_page_view"] == 1
    assert data["events"]["registration_completed"] == 0
    assert data["events"]["agent_connection_verified"] == 0
    assert data["retention"]["D1"] == {"eligible":0,"returned":0,"rate":None}
    assert (await market.http.delete("/measurement/consent")).status_code == 204
    assert (await request(market, "GET", "/admin/growth/funnel", role="admin"))["cohort_visitors"] == 0


async def test_referral_is_unique_and_signup_has_server_evidence(market):
    async with market.db() as db:
        owner = await db.get(User, market.users['owner'].id)
        owner.registration_origin = 'public'
        await db.commit()
    invite = await request(market, "POST", "/referrals/me")
    assert (await request(market, "POST", "/referrals/me")) == invite
    r = await market.http.post("/measurement/consent", json={"allow":True,"language":"fr","referral":invite["code"]})
    assert r.status_code == 201
    for kind in ('landing_page_view','cta_clicked','registration_started'):
        assert (await market.http.post('/measurement/events', json={'kind':kind,'language':'fr'})).status_code == 204
    for forbidden in ('registration_completed','first_payment_completed','email_verified'):
        assert (await market.http.post('/measurement/events', json={'kind':forbidden,'language':'fr'})).status_code == 422
    email='new-visitor@real-customer.fr'
    r = await market.http.post('/auth/register', headers={'X-TaskMatch-Measurement':'allow'}, json={
        'email':email, 'role':'client','password':'SyntheticPassword-2026!', 'full_name':'Customer',
        'attribution':{'intent':'project','language':'fr','country':'FR'},
    })
    assert r.status_code == 201, r.text
    result = await request(market, 'GET','/admin/growth/funnel?country=FR&language=fr',role='admin')
    assert result['events']['registration_completed'] == result['events']['referral_registration'] == 1
    assert result['events']['first_payment_completed'] == 0
    assert result['rates']['signup']['denominator'] == 1
    personal = await request(market, 'GET', '/referrals/me')
    assert personal['stats'] == {'visits':1,'verified_signups':0,'activations':0,'first_captures':0}
    async with market.db() as db:
        from app.models import AuditLog
        visitor = await db.scalar(select(User).where(User.email==email))
        visitor.email_verified_at = datetime.now(UTC)
        db.add(AuditLog(actor_type='user',actor_id=str(visitor.id),action='submit_job',entity_type='job',entity_id='test'))
        stranger = await db.get(User,market.users['stranger'].id)
        stranger.registration_origin = 'public'
        await db.commit()
    assert (await request(market, 'GET', '/referrals/me'))['stats'] == {
        'visits':1,'verified_signups':1,'activations':1,'first_captures':0}
    assert (await request(market, 'GET', '/referrals/me',role='stranger'))['stats'] == {
        'visits':0,'verified_signups':0,'activations':0,'first_captures':0}
    async with market.db() as db:
        visitor = await db.scalar(select(User).where(User.email==email))
        visitor.registration_origin = 'test'
        await db.commit()
    assert all(n==0 for n in (await request(market, 'GET','/referrals/me'))['stats'].values())
    await request(market, 'GET','/referrals/me',role='admin',expected=403)
    assert email not in str(personal)
    assert not (await request(market,'GET','/admin/growth/funnel?country=IT',role='admin'))['cohort_visitors']


async def test_mature_cohort_retention_and_captured_eur_exclude_test_money(market):
    import hashlib
    import uuid
    from decimal import Decimal

    from app.models import Job, Quote
    from app.models.billing import JobFunding
    from app.models.measurement import MeasurementEvent, MeasurementVisitor

    now = datetime.now(UTC)
    signup = now-timedelta(days=8)
    async with market.db() as db:
        owner = await db.get(User, market.users["owner"].id)
        owner.registration_origin = "public"
        owner.created_at = signup
        sponsor = await db.get(User, market.users['stranger'].id)
        sponsor.registration_origin = 'public'
        visitor = MeasurementVisitor(id=uuid.uuid4(), consented_at=signup-timedelta(minutes=1),
            language='fr', account_id=owner.id, referred_by=sponsor.id, digest=hashlib.sha256(b"local-fixture").hexdigest())
        db.add(visitor)
        await db.flush()
        for day in (0,1,7):
            db.add(MeasurementEvent(visitor_id=visitor.id,utc_day=(signup+timedelta(days=day)).date(),kind='activity'))
        for live, captured, amount, refunded in ((False,True,9000,0),(True,True,1000,200),(True,False,3000,0)):
            job=Job(id=uuid.uuid4(),client_user_id=owner.id,title='Fixture',raw_description='Historical',
                    status='quoted',currency='EUR',budget_min=1,budget_max=100)
            db.add(job)
            await db.flush()
            q=Quote(id=uuid.uuid4(),job_id=job.id,status='accepted' if captured else 'pending_client',
                    currency='EUR',subtotal=Decimal(amount)/100,platform_fee=0,total=Decimal(amount)/100,pricing_version='test')
            db.add(q)
            await db.flush()
            db.add(JobFunding(job_id=job.id,client_user_id=owner.id,quote_id=q.id,livemode=live,
                    status='partially_refunded' if refunded else 'paid' if captured else 'checkout_pending',
                    captured_at=now if captured else None,charge_id=f'ch_{q.id}' if captured else None,
                    amount_minor=amount,refunded_minor=refunded,currency='eur'))
        await db.commit()
    result = await request(market,'GET','/admin/growth/funnel?days=30',role='admin')
    assert result['retention']['D1'] == result['retention']['D7'] == {'eligible':1,'returned':1,'rate':1}
    assert result['retention']['D30'] == {'eligible':0,'returned':0,'rate':None}
    assert result['events']['first_payment_completed'] == 1
    assert result['events']['user_returned'] == 1
    assert result['money'] == {'currency':'EUR','gross_captured_minor':1000,'refunded_minor':200,
                              'net_collected_minor':800,'quoted_platform_fee_minor':0}
    assert (await request(market,'GET','/referrals/me',role='stranger'))['stats']['first_captures'] == 1
    # Explicitly seeded self referral must not be counted even if a broken import wrote it.
    from sqlalchemy import update
    async with market.db() as db:
        await db.execute(update(MeasurementVisitor).values(referred_by=MeasurementVisitor.account_id))
        await db.commit()
    assert all(n == 0 for n in (await request(market,'GET','/referrals/me'))['stats'].values())
