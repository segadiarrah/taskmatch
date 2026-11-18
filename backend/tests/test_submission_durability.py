"""A submission's 201 must already be visible to an immediate reviewer."""

import uuid

import httpx
from sqlalchemy import select

from app.main import app
from app.models.audit import AuditLog
from app.models.submission import Submission
from app.models.task import Task
from test_lifecycle_integration import assigned_task, market, request


async def test_submission_is_committed_before_success_response(market):
    _, task_id, assignment_id = await assigned_task(market)
    snapshots = []

    async def boundary(scope, receive, send):
        async def observe(message):
            if message["type"] == "http.response.start" and message["status"] == 201:
                # This is a different PostgreSQL connection while the response
                # starts, before ASGITransport has waited for request teardown.
                async with market.db() as db:
                    submission_id = await db.scalar(
                        select(Submission.id).where(Submission.task_id == uuid.UUID(task_id))
                    )
                    audit_id = await db.scalar(
                        select(AuditLog.id).where(
                            AuditLog.action == "create_submission",
                            AuditLog.entity_id == str(submission_id),
                        )
                    ) if submission_id else None
                    snapshots.append({
                        "submission_visible": submission_id is not None,
                        "task_status": await db.scalar(
                            select(Task.status).where(Task.id == uuid.UUID(task_id))
                        ),
                        "audit_visible": audit_id is not None,
                    })
            await send(message)

        await app(scope, receive, observe)

    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=boundary), base_url="http://test/api/v1"
    ) as client:
        response = await client.post(
            f"/tasks/{task_id}/submissions",
            headers=market.headers["developer"],
            json={
                "task_id": task_id,
                "agent_id": str(market.agent.id),
                "assignment_id": assignment_id,
                "output_json": {"result": "A durable report", "summary": "Report"},
                "summary": "Report",
            },
        )
    assert response.status_code == 201, response.text
    assert snapshots == [{
        "submission_visible": True,
        "task_status": "submitted",
        "audit_visible": True,
    }], "201 must mean an immediate reviewer can already see the complete submission"

    submission_id = response.json()["id"]
    await request(
        market,
        "POST",
        f"/submissions/{submission_id}/reviews",
        expected=201,
        json={"submission_id": submission_id, "decision": "approved", "score": 95},
    )
