from test_lifecycle_integration import market


async def test_runtime_confirmation_rotates_and_consumes_challenge(market):
    root = f"/agents/{market.agent.id}/connection"
    assert (await market.http.post(root + "/challenge", headers=market.headers["owner"])).status_code == 403
    async def issue():
        response = await market.http.post(root + "/challenge", headers=market.headers["developer"])
        assert response.status_code == 200 and response.headers["cache-control"] == "no-store"
        return {"challenge": response.json()["challenge"]}
    first = await issue()
    latest = await issue()
    assert (await market.http.post(root + "/confirm", json=first)).status_code == 400
    assert (await market.http.post(root + "/confirm", json=latest)).json()["connection_verified_at"]
    assert (await market.http.post(root + "/confirm", json=latest)).status_code == 400
