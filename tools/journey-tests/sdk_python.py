"""Real HTTP SDK smoke. Creates only disposable users, agents and unfunded drafts.

Run: python3 tools/journey-tests/sdk_python.py --api http://127.0.0.1:3172 --human
The API must be one of the two explicitly provisioned local journey stacks.
"""
from __future__ import annotations

import argparse
from contextlib import ExitStack
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import sys
from urllib.parse import urlsplit
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "sdk/python"))

import httpx
from taskmatch import TaskMatchClient, TaskMatchError

checks: list[str] = []
stage = "local API guard"


def check(condition, description):
    if not condition:
        raise AssertionError(description)
    checks.append(description)


def error_status(invoke, status, description):
    try:
        invoke()
    except TaskMatchError as error:
        check(error.status_code == status, description)
        check(error.response.status_code == status, description + " response status")
        check(error.detail is not None, description + " detail preserved")
    else:
        raise AssertionError(description)


def main():
    global stage
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api", required=True, help="Disposable API origin, no /api suffix")
    parser.add_argument("--human", action="store_true", help="Also exercise Human Tasks drafts")
    args = parser.parse_args()
    origin = args.api.rstrip("/")
    url = urlsplit(origin)
    if (url.scheme != "http" or url.hostname not in {"127.0.0.1", "localhost"}
            or url.port not in {3171, 3172} or url.username or url.password
            or url.path or url.query or url.fragment):
        raise ValueError("Only explicitly provisioned loopback journey APIs are allowed")
    if args.human and url.port != 3172:
        raise ValueError("Human mode requires the paid-mode isolated API on port 3172")
    base = origin + "/api"
    run = uuid4().hex
    password = "SDK-journey+password&2026-" + run
    with ExitStack() as stack:
        raw = stack.enter_context(httpx.Client(base_url=base + "/v1/", timeout=15,
                                              follow_redirects=False, trust_env=False))
        # These SDK clients retain their normal HTTP transport. No mocks are installed.
        developer = stack.enter_context(TaskMatchClient(base_url=base))
        owner = stack.enter_context(TaskMatchClient(base_url=base))
        anonymous = stack.enter_context(TaskMatchClient(base_url=base))

        def setup(method, path, client, body=None):
            response = raw.request(method, path, json=body,
                                   headers={"Authorization": "Bearer " + client.token})
            if not response.is_success:
                raise AssertionError("Direct HTTP setup returned an unexpected status")
            return response.json()

        stage = "new developer registration and login"
        email = "sdk-python-dev-" + run + "@example.com"
        user = developer.register(email, password, "SDK Python Developer", "agent_developer")
        check(user["role"] == "agent_developer", "fresh developer registration")
        check(bool(developer.login(email, password)), "developer form login")
        check(developer.me()["id"] == user["id"], "developer bearer identity")
        error_status(lambda: developer.register(email, password, "Duplicate", "agent_developer"),
                     409, "duplicate account conflict")
        error_status(anonymous.me, 401, "anonymous session denial")

        stage = "owned executor and list envelopes"
        agent = developer.register_agent("SDK Python " + run, "https://example.test/worker",
                                         ["writing", "research"])
        check(agent["developer_user_id"] == user["id"], "owned agent registration")
        check(developer.heartbeat(agent["id"], status="paused")["status"] == "paused",
              "heartbeat pause")
        check(developer.get_agent(agent["id"])["status"] == "paused", "pause persisted")
        developer.heartbeat(agent["id"], status="active", current_load=0.1)
        stored = developer.get_agent(agent["id"])
        check(stored["status"] == "active" and bool(stored["last_heartbeat_at"]),
              "active heartbeat timestamp persisted")
        for response, key, description in (
            (developer.list_agents(limit=100), "agents", "agent list envelope"),
            (developer.list_open_tasks(limit=1), "tasks", "open task list envelope"),
            (developer.list_tasks(limit=1), "tasks", "task list envelope"),
            (developer.list_jobs(limit=1), "jobs", "developer job list envelope"),
        ):
            check(isinstance(response[key], list) and isinstance(response["total"], int), description)
        assignments = developer.list_assignments(status="active", limit=100)
        check(assignments == {"items": []}, "fresh developer assignment envelope")
        check(isinstance(developer.get_agent_stats(agent["id"]), dict), "agent statistics response")

        stage = "new client and default currency draft"
        owner_email = "sdk-python-client-" + run + "@example.com"
        client_user = owner.register(owner_email, password, "SDK Python Client", "client")
        owner.login(owner_email, password)
        check(owner.me()["id"] == client_user["id"], "fresh client registration and login")
        draft = owner.create_job("SDK default currency " + run,
                                 "Review a report in an unfunded SDK draft.", 10, 20)
        check(draft["currency"] == "EUR" and draft["status"] == "draft", "default EUR draft created")
        check(owner.get_job(draft["id"])["currency"] == "EUR", "default EUR draft persisted")
        check(any(job["id"] == draft["id"] for job in owner.list_jobs()["jobs"]), "owner job list")
        error_status(lambda: developer.get_job(draft["id"]), 403, "private draft denied to developer")
        error_status(lambda: owner.create_job("Unsupported currency", "Unfunded draft.", 10, 20,
                                              currency="USD"), 422, "unsupported currency validation")

        if args.human:
            stage = "human schema and direct draft"
            schema = setup("GET", "human-tasks/schema", developer)
            taxonomy = setup("GET", "human-tasks/taxonomy", developer)
            check(schema["properties"]["schema_version"]["const"] == "tm.human-task.v1",
                  "human schema contract")
            check(taxonomy["version"] == "tm.taxonomy.v1", "human taxonomy version")
            principal = setup("POST", "principals", developer,
                              {"kind": "individual", "display_name": "SDK Python Principal"})
            contract = {
                "schema_version": "tm.human-task.v1", "principal_id": principal["id"],
                "requester_type": "HUMAN_REQUESTER", "title": "SDK Python translation review",
                "objective": "Find translation errors", "instructions": "Read the supplied text.",
                "task_category": "translation_review", "execution_mode": "remote",
                "required_capabilities": ["translation"], "language": "fr",
                "deadline": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
                "expected_duration": 30, "budget": {"amount_minor": 1100, "currency": "EUR"},
                "evidence_requirements": ["report"], "authorizations": ["data_owner_consent"],
            }
            key = "python-direct-" + run
            task = developer.create_human_task(contract, idempotency_key=key)
            check(developer.create_human_task(contract, idempotency_key=key)["task_id"] == task["task_id"],
                  "direct task identical-content replay")
            check(developer.get_human_task(task["task_id"])["policy_status"] == "pending",
                  "direct human draft remains unreviewed")
            check(developer.get_human_result(task["task_id"])["ready"] is False,
                  "unreviewed result not ready")
            check(isinstance(developer.list_human_tasks()["items"], list), "human list envelope")
            check(isinstance(developer.human_task_events(task["task_id"])["items"], list), "events envelope")
            check(isinstance(developer.get_human_task_dependencies(task["task_id"]), dict),
                  "dependency read contract")
            check(isinstance(developer.list_job_steps(task["parent_job_id"])["items"], list),
                  "job steps envelope")
            error_status(lambda: developer.create_human_task({**contract, "title": "Changed content"},
                                                             idempotency_key=key),
                         409, "changed-content replay rejected")
            error_status(lambda: owner.get_human_task(task["task_id"]), 403, "human tenant privacy")

            stage = "delegated draft and scoped denials"
            delegation = setup("POST", "principals/" + principal["id"] + "/delegations", developer,
                               {"agent_id": agent["id"], "max_amount_minor": 1100,
                                "categories": ["translation_review"],
                                "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()})
            scoped = stack.enter_context(TaskMatchClient(base_url=base, token=delegation["access_token"]))
            delegated_contract = {**contract, "requester_type": "AGENT_REQUESTER",
                                  "requesting_agent_id": agent["id"], "delegation_id": delegation["id"]}
            delegated_key = "python-delegated-" + run
            delegated = scoped.create_human_task(delegated_contract, idempotency_key=delegated_key)
            check(scoped.create_human_task(delegated_contract, idempotency_key=delegated_key)["task_id"]
                  == delegated["task_id"], "delegated task replay")
            check(scoped.get_human_task(delegated["task_id"])["delegation_id"] == delegation["id"],
                  "delegated task read")
            error_status(scoped.me, 401, "scoped session denial")
            error_status(lambda: scoped.get_principal_payment_method(principal["id"]), 401,
                         "scoped owner payment read denial")
            error_status(lambda: scoped.get_human_task(task["task_id"]), 403,
                         "scoped unrelated task denial")
            error_status(lambda: scoped.create_human_task(delegated_contract,
                                                          idempotency_key="python-over-budget-" + run),
                         409, "delegation spending cap")
            check(scoped.token == delegation["access_token"], "scoped token unchanged after denials")
            setup("DELETE", "principals/" + principal["id"] + "/delegations/" + delegation["id"], developer)
            error_status(lambda: scoped.get_human_task(delegated["task_id"]), 403, "revoked mandate denial")

    print(json.dumps({"suite": "python-sdk-real-http", "api": origin, "human": args.human,
                      "passed": len(checks), "checks": checks, "financial_operations": 0}))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # API exception text can contain sensitive data. Report only bounded metadata.
        print(json.dumps({"suite": "python-sdk-real-http", "failed_stage": stage,
                          "error_type": type(error).__name__,
                          "status": error.status_code if isinstance(error, TaskMatchError) else None,
                          "checks_passed": len(checks)}), file=sys.stderr)
        raise SystemExit(1)
