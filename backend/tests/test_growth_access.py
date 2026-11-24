"""Commercial agents can read scoped aggregates; they cannot use user/admin endpoints."""
import uuid

from app.models.user import User
from test_lifecycle_integration import market


async def test_commercial_token_scope_revocation_and_provenance(market):
    async with market.db() as db:
        db.add(User(id=uuid.uuid4(), email="report@example.test", full_name="Example", role="client",
                    hashed_password="unused", registration_origin="public",
                    registration_attribution={"utm_campaign": "november"}))
        await db.commit()
    payload = {"label": "acquisition reader", "scope": "campaigns:read", "days": 5}
    assert (await market.http.post("/admin/growth/credentials", headers=market.headers["owner"], json=payload)).status_code == 403
    issued = await market.http.post("/admin/growth/credentials", headers=market.headers["admin"], json=payload)
    assert issued.status_code == 201
    token = issued.json()
    header = {"Authorization": "Bearer " + token["token"]}
    response = await market.http.get("/growth/campaigns", headers=header)
    assert response.json() == [{"campaign": "november", "registrations": 1}]
    csv = await market.http.get("/growth/campaigns?output=csv", headers=header)
    assert "november,1" in csv.text and "@example" not in csv.text
    assert (await market.http.get("/growth/summary", headers=header)).status_code == 403
    assert (await market.http.get("/admin/release", headers=header)).status_code == 401
    assert (await market.http.delete("/admin/growth/credentials/" + token["id"], headers=market.headers["admin"])).status_code == 204
    assert (await market.http.get("/growth/campaigns", headers=header)).status_code == 401
