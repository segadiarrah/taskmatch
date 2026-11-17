"""Contract and runner regressions; all HTTP requests stay in MockTransport."""

import json
from urllib.parse import parse_qs

import httpx
import pytest

from taskmatch import AgentRunner, TaskMatchClient, TaskMatchError


@pytest.fixture
def client_factory():
    clients = []

    def make(handler, token="token"):
        client = TaskMatchClient(base_url="https://example.test/api/", token=token)
        client._http.close()
        client._http = httpx.Client(
            base_url=f"{client.base_url}/v1", transport=httpx.MockTransport(handler)
        )
        clients.append(client)
        return client

    yield make
    for client in clients:
        client.close()


def runner(client, handler=lambda task: {"result": "ok"}, task_types=None):
    return AgentRunner(client, "mine", handler, lambda task: {
        "price": 5, "eta_hours": 1, "confidence": 0.8,
    }, task_types=task_types)


def test_auth_paths_form_encoding_and_bearer(client_factory):
    def respond(request):
        assert request.url.path.startswith("/api/v1/")
        if request.url.path.endswith("/login"):
            assert parse_qs(request.content.decode()) == {
                "username": ["dev+agent@example.com"], "password": ["a+b&c"],
            }
            assert request.headers["content-type"].startswith("application/x-www-form-urlencoded")
            return httpx.Response(200, json={"access_token": "new-token", "token_type": "bearer"})
        assert request.headers["authorization"] == "Bearer new-token"
        return httpx.Response(200, json={"id": "user"})

    client = client_factory(respond)
    assert client.login("dev+agent@example.com", "a+b&c") == "new-token"
    assert client.me() == {"id": "user"}


@pytest.mark.parametrize("status,body", [(302, "redirect"), (502, "bad gateway")])
def test_non_success_responses_raise_typed_error(client_factory, status, body):
    client = client_factory(lambda request: httpx.Response(status, text=body))
    with pytest.raises(TaskMatchError) as error:
        client.me()
    assert error.value.status_code == status
    assert error.value.detail == body


def test_json_error_keeps_validation_details(client_factory):
    details = [{"loc": ["body", "email"], "msg": "Invalid email"}]
    client = client_factory(lambda request: httpx.Response(422, json={"detail": details}))
    with pytest.raises(TaskMatchError) as error:
        client.me()
    assert error.value.detail == details


def test_assignment_clients_use_existing_envelopes_and_query(client_factory):
    def respond(request):
        if request.url.path == "/api/v1/developer/assignments":
            assert dict(request.url.params) == {"status": "active", "limit": "100"}
            return httpx.Response(200, json={"items": [{"id": "assignment", "task_id": "task"}]})
        assert request.url.path == "/api/v1/tasks/task/assignments/mine"
        return httpx.Response(200, json={"items": [{"id": "assignment", "agent_id": "mine", "status": "active"}]})

    client = client_factory(respond)
    assert client.list_assignments(status="active", limit=100)["items"][0]["task_id"] == "task"
    assert client.list_task_assignments("task")["items"][0]["agent_id"] == "mine"


def test_runner_discovers_only_own_active_assignments(client_factory):
    submitted = []

    def respond(request):
        path = request.url.path
        if path.endswith("/developer/assignments"):
            return httpx.Response(200, json={"items": [{"id": "foreign", "task_id": "task"}, {"id": "mine-active", "task_id": "task"}]})
        if path.endswith("/assignments/mine"):
            return httpx.Response(200, json={"items": [
                {"id": "foreign", "agent_id": "other", "status": "active"},
                {"id": "mine-old", "agent_id": "mine", "status": "completed"},
                {"id": "mine-active", "agent_id": "mine", "status": "active"},
            ]})
        if request.method == "GET":
            return httpx.Response(200, json={"id": "task", "status": "assigned"})
        submitted.append(json.loads(request.content))
        return httpx.Response(201, json={"id": "submission"})

    assert runner(client_factory(respond)).poll_assignments_and_submit() == [{"id": "submission"}]
    assert [submission["assignment_id"] for submission in submitted] == ["mine-active"]


def test_handler_output_is_not_mutated_on_submission_failure(client_factory):
    output = {"result": "ok", "_summary": "Keep for retry", "_artifact_urls": ["https://example.test/a"]}
    requests = []

    def respond(request):
        if request.method == "GET":
            return httpx.Response(200, json={"id": "task", "status": "assigned"})
        requests.append(json.loads(request.content))
        return httpx.Response(503, text="temporarily unavailable")

    with pytest.raises(TaskMatchError):
        runner(client_factory(respond), lambda task: output).handle_dispatch("task", "assignment")
    assert output["_summary"] == "Keep for retry"
    assert requests[0]["summary"] == output["_summary"]
    assert requests[0]["output_json"] == {"result": "ok"}
    assert len(requests) == 1  # No automatic replay of a potentially stored POST.


def test_empty_task_types_do_not_bid_on_every_task(client_factory):
    calls = []
    client = client_factory(lambda request: calls.append(request) or httpx.Response(200, json={"tasks": [{"id": "task"}], "total": 1}))
    assert runner(client, task_types=[]).run_once() == []
    assert calls == []


def test_runner_reads_all_open_task_pages_and_ignores_duplicate_bid(client_factory):
    pages, bids = [], []

    def respond(request):
        if request.method == "GET":
            skip = int(request.url.params.get("skip", 0))
            pages.append(skip)
            return httpx.Response(200, json={"tasks": [{"id": str(skip), "task_type": "writing"}], "total": 2})
        bid = json.loads(request.content)
        bids.append(bid)
        return httpx.Response(409, json={"detail": "Already bid"}) if bid["task_id"] == "0" else httpx.Response(201, json={"id": "new-bid"})

    assert runner(client_factory(respond), task_types=["writing"]).run_once() == [{"id": "new-bid"}]
    assert pages == [0, 1]
    assert all(bid["confidence_score"] == 0.8 for bid in bids)


def test_runner_preserves_explicit_empty_assignment_map(client_factory):
    calls = []
    client = client_factory(lambda request: calls.append(request) or httpx.Response(500))
    assert runner(client).poll_assignments_and_submit({}) == []
    assert calls == []


def test_heartbeat_and_submission_list_contract(client_factory):
    def respond(request):
        if request.method == "POST":
            assert request.url.path == "/api/v1/agents/mine/heartbeat"
            assert json.loads(request.content) == {"status": "paused", "current_load": 0}
            return httpx.Response(200, json={"id": "mine", "status": "paused"})
        assert request.url.path == "/api/v1/tasks/task/submissions"
        return httpx.Response(200, json=[])

    client = client_factory(respond)
    assert client.heartbeat("mine", status="paused", current_load=0)["status"] == "paused"
    assert client.list_submissions("task") == []


def test_human_contract_idempotency_and_result_paths(client_factory):
    seen = []
    def respond(request):
        seen.append(request)
        return httpx.Response(201 if request.method == "POST" else 200, json={"task_id":"human"})
    client = client_factory(respond)
    assert client.create_human_task({"schema_version":"tm.human-task.v1"}, idempotency_key="operation-1")["task_id"] == "human"
    assert seen[0].headers["idempotency-key"] == "operation-1"
    assert seen[0].url.path == "/api/v1/human-tasks"
    client.get_human_result("human")
    assert seen[1].url.path == "/api/v1/human-tasks/human/result"
