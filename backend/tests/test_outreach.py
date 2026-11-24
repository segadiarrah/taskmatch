from uuid import uuid4
from sqlalchemy import select

from app.core.config import settings
from app.models.mail import MailOutbox
from app.services.mail_worker import process_one
from test_lifecycle_integration import market


async def test_approved_individual_outreach_deduplicates_and_honors_suppression(market, monkeypatch):
    monkeypatch.setattr(settings, "TASKMATCH_MAIL_ENABLED", True)
    monkeypatch.setattr(settings, "SMTP_HOST", "localhost")
    monkeypatch.setattr(settings, "SMTP_FROM", "fixture@taskmatch.ai")
    headers = market.headers["admin"]
    credential = await market.http.post("/admin/growth/credentials", headers=headers,
                       json={"label":"isolated", "scope":"communications:send"})
    agent = {"Authorization": "Bearer " + credential.json()["token"]}
    recipient = {"email": "consented@example.com", "permission_reference": "fixture-consent-1"}
    assert (await market.http.post("/admin/communications/recipients", headers=agent, json=recipient)).status_code == 401
    address = (await market.http.post("/admin/communications/recipients", headers=headers, json=recipient)).json()
    body = {"recipient_id":address["id"], "campaign":"sample", "subject":"Follow-up", "text":"Requested details"}
    assert (await market.http.post("/communications/messages", headers=agent, json={**body,"recipient_id":str(uuid4())})).status_code == 409
    sent = await market.http.post("/communications/messages", headers=agent, json=body)
    assert sent.status_code == 202
    duplicate = await market.http.post("/communications/messages", headers=agent, json=body)
    assert duplicate.json() == sent.json()
    assert (await market.http.post("/communications/messages", headers=agent, json={**body,"campaign":"other"})).status_code == 429
    await market.http.post("/admin/communications/recipients/" + address["id"] + "/suppress", headers=headers, json={"reason":"opt_out"})
    calls = []
    assert await process_one(market.db, lambda *args: calls.append(args))
    assert not calls
    status = await market.http.get("/communications/messages/" + sent.json()["id"], headers=agent)
    assert status.json()["status"] == "suppressed"
