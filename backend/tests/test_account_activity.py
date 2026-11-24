from test_lifecycle_integration import market, submitted_task  # noqa: F401


async def test_account_activity_is_private_and_preferences_persist(market):
    assert (await market.http.get("/account/activity")).status_code == 401
    initial = await market.http.get("/account/activity", headers=market.headers["owner"])
    assert initial.status_code == 200, initial.text
    assert initial.json()["track"] == "project"
    assert initial.json()["events"] == []
    job, task, _, _ = await submitted_task(market)
    owner = (await market.http.get("/account/activity", headers=market.headers["owner"])).json()
    assert owner["steps"]["brief"] and owner["steps"]["project"]
    assert {"assignment", "delivery"}.issubset({event["category"] for event in owner["events"]})
    outsider = (await market.http.get("/account/activity", headers=market.headers["stranger"])).json()
    assert not any(str(task) in str(entry) or str(job) in str(entry) for entry in outsider["events"])
    saved = await market.http.put("/account/activity/preferences", headers=market.headers["owner"], json={"muted": ["delivery"]})
    assert saved.status_code == 200
    refreshed = (await market.http.get("/account/activity", headers=market.headers["owner"])).json()
    assert refreshed["muted"] == ["delivery"]
    assert not any(e["category"] == "delivery" for e in refreshed["events"])
    assert (await market.http.put("/account/activity/preferences", headers=market.headers["owner"], json={"muted":["other"]})).status_code == 422
