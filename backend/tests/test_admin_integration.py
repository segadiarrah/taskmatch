"""Admin projections and public auth against an isolated PostgreSQL database."""

from test_lifecycle_integration import market, request, submitted_task  # noqa: F401
from app.models.job import Job
from app.models.payment import PaymentRecord
import asyncio


async def test_admin_payments_include_real_parties_currency_and_state(market):
    job_id, task_id, _, submission_id = await submitted_task(market)
    await request(market, "POST", f"/submissions/{submission_id}/reviews", expected=201,
                  json={"submission_id": submission_id, "decision": "approved", "score": 95})
    await request(market, "POST", f"/jobs/{job_id}/accept")
    payments = await request(market, "GET", "/admin/payments", role="admin")
    assert len(payments) == 1
    assert payments[0]["task_id"] == task_id
    assert payments[0]["job_title"] == "Write report"
    assert payments[0]["client_name"] == "owner"
    assert payments[0]["developer_name"] == "developer"
    assert payments[0]["status"] == "releasable"
    assert payments[0]["currency"]
    await request(market, "GET", "/admin/payments", role="owner", expected=403)


async def test_admin_review_projection_preserves_persisted_decision(market):
    _, _, _, submission_id = await submitted_task(market)
    records = await request(market, "GET", "/admin/submissions", role="admin")
    assert records[0]["status"] == "submitted"
    await request(market, "POST", f"/submissions/{submission_id}/reviews", expected=201,
                  json={"submission_id": submission_id, "decision": "approved", "score": 95})
    records = await request(market, "GET", "/admin/submissions", role="admin")
    assert records[0]["review_result"] == "approved"
    assert records[0]["reviewer"] == "client"


async def test_real_registration_login_and_admin_role_boundary(market):
    payload = {"email": "New.Person@example.com", "password": "a-long-enough-password", "full_name": "New Person", "role": "admin"}
    response = await market.http.post("/auth/register", json=payload)
    assert response.status_code == 422
    payload["role"] = "client"
    response = await market.http.post("/auth/register", json=payload)
    assert response.status_code == 201, response.text
    assert response.json()["email"] == "new.person@example.com"
    response = await market.http.post("/auth/login", data={"username": " NEW.PERSON@example.com ", "password": payload["password"]})
    assert response.status_code == 200, response.text
    headers = {"Authorization": "Bearer " + response.json()["access_token"]}
    response = await market.http.get("/admin/providers", headers=headers)
    assert response.status_code == 403
    response = await market.http.post("/auth/register", json=payload)
    assert response.status_code == 409


async def test_dashboard_never_adds_different_currencies_together(market):
    async with market.db() as db:
        for currency, amount in [("EUR", 50), ("EUR", 0), ("USD", 9000)]:
            job = Job(client_user_id=market.users["owner"].id, title="Currency test", raw_description="Report", currency=currency, budget_min=0, budget_max=max(amount, 100))
            db.add(job)
            await db.flush()
            if amount:
                db.add(PaymentRecord(job_id=job.id, client_user_id=market.users["owner"].id, currency=currency,
                                     gross_amount=amount, platform_fee=amount / 10, net_amount=amount * .9,
                                     payment_status="paid", provider="manual"))
        await db.commit()
    overview = await request(market, "GET", "/dashboard/overview", role="admin")
    assert overview["currency"] == "EUR"
    assert overview["gmv"] == 50
    assert overview["platform_revenue"] == 5
    assert overview["total_payments_completed"] == 50


async def test_developer_cannot_reserve_a_platform_worker_identity(market):
    await request(market, "POST", "/agents/register", role="developer", expected=422,
                  json={"name": "LLM attacker", "endpoint_url": "https://example.test/worker", "supported_task_types": ["general"]})


async def test_concurrent_registration_returns_conflict_instead_of_server_error(market):
    payload = {"email": "concurrent@example.com", "password": "a-long-enough-password", "full_name": "Concurrent", "role": "client"}
    results = await asyncio.gather(
        market.http.post("/auth/register", json=payload),
        market.http.post("/auth/register", json=payload),
    )
    assert sorted(response.status_code for response in results) == [201, 409]
