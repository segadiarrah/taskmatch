"""Directory entries require a deliberate owner action; only public copy leaves the DB."""
from sqlalchemy import select

from app.models.agent import Agent
from test_lifecycle_integration import market  # noqa: F401


def listing(**extra):
    return {
        "display_name": "Field Studio", "summary": "Local reporting and remote document review.",
        "expertise": "Research, editing", "country": "FR", "language": "fr", **extra,
    }


async def test_publish_edit_unpublish_and_republish_keep_stable_url(market):
    owner_path = f"/directory/mine/{market.agent.id}"
    assert (await market.http.get("/directory")).json() == {"items": [], "has_more": False}
    assert (await market.http.put(owner_path, headers=market.headers["owner"], json=listing())).status_code == 404
    assert (await market.http.put(owner_path, headers=market.headers["developer"], json=listing(endpoint_url="private"))).status_code == 422
    published = await market.http.put(owner_path, headers=market.headers["developer"], json=listing())
    assert published.status_code == 200, published.text
    profile = published.json()
    assert set(profile) == {"id", "kind", "display_name", "summary", "expertise", "country", "language"}
    path = f"/directory/{profile['id']}"
    assert (await market.http.get(path)).json() == profile
    assert (await market.http.get("/directory?q=editing&country=FR&language=fr&kind=agent")).json()["items"] == [profile]
    assert (await market.http.get("/directory?kind=human")).json()["items"] == []
    assert (await market.http.delete(owner_path, headers=market.headers["outsider"])).status_code == 404
    assert (await market.http.delete(owner_path, headers=market.headers["developer"])).status_code == 204
    assert (await market.http.get(path)).status_code == 404
    again = await market.http.put(owner_path, headers=market.headers["developer"], json=listing(display_name="New public name"))
    assert again.json()["id"] == profile["id"]
    async with market.db() as db:
        agent = await db.scalar(select(Agent).where(Agent.id == market.agent.id))
        agent.status = "inactive"
        await db.commit()
    assert (await market.http.get(path)).status_code == 404


async def test_worker_publishes_public_alias_without_exporting_worker_data(market, monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "HUMAN_TASKS_ENABLED", True)
    private = {"country": "FR", "languages": ["fr"], "timezone": "Europe/Paris", "skills": ["research"],
               "available": True, "desired_rate_minor": 1000, "data_consent": True, "service_area": "private-street"}
    profile = await market.http.put("/workers/me", headers=market.headers["owner"], json=private)
    assert profile.status_code == 200, profile.text
    path = f"/directory/mine/{profile.json()['agent_id']}"
    public = await market.http.put(path, headers=market.headers["owner"], json=listing(display_name="Working alias"))
    assert public.status_code == 200, public.text
    assert public.json()["kind"] == "human"
    res = await market.http.get("/directory?kind=human")
    assert len(res.json()["items"]) == 1
    assert "private-street" not in res.text and "desired_rate_minor" not in res.text and "user_id" not in res.text


async def test_anonymous_planning_preview_has_no_private_matches(market):
    result = await market.http.post("/demo/plan", json={"description": "Translate a sample summary for the project."})
    assert result.status_code == 200, result.text
    assert result.json()["tasks"] and all(not task["matched"] for task in result.json()["tasks"])
