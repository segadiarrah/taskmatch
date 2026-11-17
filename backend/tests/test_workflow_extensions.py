"""Dependencies and amendments preserve funded contracts and tenant boundaries."""

import uuid
from datetime import UTC

import pytest
from sqlalchemy import select
from test_human_tasks import contract, create, principal, verified_worker
from test_lifecycle_integration import market as market
from test_lifecycle_integration import request

from app.core.config import settings
from app.models import Job


@pytest.fixture(autouse=True)
def enabled(monkeypatch):
    monkeypatch.setattr(settings, "HUMAN_TASKS_ENABLED", True)


async def test_dependencies_are_acyclic_and_gate_claims(market):
    from app.models import Quote
    from app.services.quote_service import accept_quote

    p = await principal(market)
    first = await create(market, contract(p["id"]))
    second = await create(
        market,
        contract(p["id"], parent_job_id=first["parent_job_id"], title="Review previous report"),
    )
    await request(
        market,
        "PUT",
        f"/human-tasks/{second['task_id']}/dependencies",
        json={"depends_on": [first["task_id"]]},
    )
    await request(
        market,
        "PUT",
        f"/human-tasks/{first['task_id']}/dependencies",
        expected=422,
        json={"depends_on": [second["task_id"]]},
    )
    await request(
        market,
        "PUT",
        f"/human-tasks/{first['task_id']}/dependencies",
        role="stranger",
        expected=403,
        json={"depends_on": []},
    )
    for t in [first, second]:
        await request(
            market,
            "POST",
            f"/human-tasks/{t['task_id']}/publish",
            role="admin",
            json={
                "authorizations_verified": True,
                "qualifications_verified": True,
                "notes": "Scope reviewed",
            },
        )
    async with market.db() as db:
        job = await db.get(Job, uuid.UUID(first["parent_job_id"]))
        job.billing_mode = "legacy_manual"
        q = await db.scalar(select(Quote).where(Quote.job_id == job.id))
        await accept_quote(db, q)
        await db.commit()
    await verified_worker(market)
    await request(
        market, "POST", f"/human-tasks/{second['task_id']}/claim", role="developer", expected=409
    )
    await request(market, "POST", f"/human-tasks/{first['task_id']}/claim", role="developer")


async def test_amendment_is_new_job_and_does_not_change_original(market):
    p = await principal(market)
    original = await create(market, contract(p["id"]))
    async with market.db() as db:
        old = await db.get(Job, uuid.UUID(original["parent_job_id"]))
        old.status = "in_progress"
        await db.commit()
    body = contract(p["id"], title="Additional review")
    response = await market.http.post(
        f"/jobs/{original['parent_job_id']}/amendments",
        headers={**market.headers["owner"], "Idempotency-Key": "amendment-1"},
        json=body,
    )
    assert response.status_code == 201, response.text
    amended = response.json()
    assert amended["parent_job_id"] != original["parent_job_id"]
    replay = await market.http.post(
        f"/jobs/{original['parent_job_id']}/amendments",
        headers={**market.headers["owner"], "Idempotency-Key": "amendment-1"},
        json=body,
    )
    assert replay.json()["task_id"] == amended["task_id"]
    async with market.db() as db:
        old = await db.get(Job, uuid.UUID(original["parent_job_id"]))
        new = await db.get(Job, uuid.UUID(amended["parent_job_id"]))
        assert old.status == "in_progress"
        assert new.status == "draft" and new.metadata_json["amends_job_id"] == str(old.id)


async def test_mixed_human_ai_job_has_one_reviewed_quote_and_bounded_human_line(
    market, monkeypatch
):
    from app.core.config import settings
    from app.models import Quote, TaskQuote
    from app.services import quote_service

    monkeypatch.setattr(
        quote_service,
        "pricing_provider",
        lambda: {
            "provider": "openai",
            "selected_model": settings.PRICING_DEFAULT_MODEL,
            "base_url": "https://api.openai.com/v1",
        },
    )
    p = await principal(market)
    human = await create(market, contract(p["id"]))
    step = await request(
        market,
        "POST",
        f"/jobs/{human['parent_job_id']}/steps",
        expected=201,
        json={
            "title": "Analyze the reviewed evidence",
            "instructions": "Summarize the verified report in five points.",
            "task_type": "research",
            "depends_on": [human["task_id"]],
        },
    )
    await request(
        market,
        "POST",
        f"/human-tasks/{human['task_id']}/publish",
        role="admin",
        json={
            "authorizations_verified": True,
            "qualifications_verified": True,
            "notes": "Scope reviewed",
        },
    )
    async with market.db() as db:
        q = await db.scalar(select(Quote).where(Quote.job_id == uuid.UUID(human["parent_job_id"])))
        lines = (await db.scalars(select(TaskQuote).where(TaskQuote.quote_id == q.id))).all()
        assert len(lines) == 2
        human_line = next(line for line in lines if str(line.task_id) == human["task_id"])
        ai_line = next(line for line in lines if str(line.task_id) == step["task_id"])
        assert (
            float(human_line.price) == 10
            and ai_line.route == "llm"
            and ai_line.breakdown_json["execution"]
        )
    # Funding in progress freezes the entire mixed quote, including human republication.
    from app.models.billing import JobFunding

    async with market.db() as db:
        db.add(
            JobFunding(
                id=uuid.uuid4(),
                job_id=q.job_id,
                quote_id=q.id,
                client_user_id=market.users["owner"].id,
                amount_minor=int(q.total * 100),
                currency="eur",
                livemode=False,
                status="creating",
            )
        )
        await db.commit()
    await request(
        market,
        "POST",
        f"/human-tasks/{human['task_id']}/publish",
        role="admin",
        expected=409,
        json={
            "authorizations_verified": True,
            "qualifications_verified": True,
            "notes": "Second review must not reprice",
        },
    )


async def test_scoped_amendment_cannot_link_another_mandates_job(market):
    from datetime import datetime, timedelta

    p = await principal(market, role="developer")
    original = await create(market, contract(p["id"]), role="developer")
    d = await request(
        market,
        "POST",
        f"/principals/{p['id']}/delegations",
        role="developer",
        expected=201,
        json={
            "agent_id": str(market.agent.id),
            "max_amount_minor": 1100,
            "categories": ["translation_review"],
            "expires_at": (datetime.now(UTC) + timedelta(hours=1)).isoformat(),
        },
    )
    body = contract(
        p["id"],
        requester_type="AGENT_REQUESTER",
        requesting_agent_id=str(market.agent.id),
        delegation_id=d["id"],
    )
    r = await market.http.post(
        f"/jobs/{original['parent_job_id']}/amendments",
        json=body,
        headers={"Authorization": "Bearer " + d["access_token"], "Idempotency-Key": "outside-job"},
    )
    assert r.status_code == 403, r.text
