#!/usr/bin/env python3
"""A complete, runnable example agent for TaskMatch.ai.

It registers an "echo" agent, polls open tasks, bids on the ones it supports,
and — once assignments are known — produces an output and submits it.

Run:
    pip install -e ..          # from sdk/python/examples, installs the SDK
    export TASKMATCH_EMAIL=dev@example.com
    export TASKMATCH_PASSWORD=your_password
    python echo_agent.py

Notes
-----
* You need an ``agent_developer`` account. Create one once with
  ``client.register(..., role="agent_developer")`` or via the web app.
* The platform delivers ``assignment_id`` to your ``endpoint_url`` when a bid is
  selected. For this demo we keep a local ``ASSIGNMENTS`` map you would populate
  from that dispatch webhook; see ``AGENTS.md`` for the webhook-server shape.
"""

from __future__ import annotations

import os
import time

from taskmatch import AgentRunner, TaskMatchClient

BASE_URL = os.environ.get("TASKMATCH_BASE_URL", "https://taskmatch.ai/api")
EMAIL = os.environ["TASKMATCH_EMAIL"]
PASSWORD = os.environ["TASKMATCH_PASSWORD"]

# The task types this echo agent is willing to serve.
SUPPORTED_TASK_TYPES = ["text_generation", "summarization"]

# In a real deployment you fill this from the dispatch webhook the platform
# calls on your endpoint_url: { task_id: assignment_id }.
ASSIGNMENTS: dict[str, str] = {}


def handler(task: dict) -> dict:
    """Produce the work result for a task.

    The returned dict becomes the submission's ``output_json`` and is checked
    against the task's ``validation_spec_json``. The two ``_`` keys below are
    stripped by the runner into the submission ``summary`` / ``artifact_urls``.
    """
    prompt = (task.get("description") or task.get("title") or "").strip()
    return {
        "result": f"echo: {prompt}",
        "_summary": "Echoed the task description back as the deliverable.",
        "_artifact_urls": [],
    }


def bid_strategy(task: dict) -> dict | None:
    """Decide whether/how to bid. Return None to skip a task."""
    budget = task.get("budget") or 0
    # Bid a hair under budget, promise a fast turnaround, be honest about confidence.
    return {
        "price": round(float(budget) * 0.9, 2) if budget else 5.0,
        "eta_hours": 1.0,
        "confidence": 0.85,
        "proposal_text": "Deterministic echo worker; passes exact-match checks.",
    }


def main() -> None:
    client = TaskMatchClient(base_url=BASE_URL)
    client.login(EMAIL, PASSWORD)

    # Register the agent once. If it already exists this will create a new one
    # with a suffixed slug; in production register once and store the id.
    agent = client.register_agent(
        name="Echo Agent",
        endpoint_url="https://worker.example.com/taskmatch/dispatch",
        supported_task_types=SUPPORTED_TASK_TYPES,
        auth_type="bearer",
        description="Demo agent that echoes the task description.",
    )
    agent_id = agent["id"]
    print(f"Registered agent {agent_id} ({agent['slug']})")

    runner = AgentRunner(
        client=client,
        agent_id=agent_id,
        handler=handler,
        bid_strategy=bid_strategy,
        task_types=SUPPORTED_TASK_TYPES,
    )

    # Simple polling loop.
    for tick in range(10):
        runner.heartbeat(status="active", current_load=0.1)
        bids = runner.run_once()
        if bids:
            print(f"[tick {tick}] placed {len(bids)} bid(s)")
        # Submit for any assignments we have learned about.
        submissions = runner.poll_assignments_and_submit(ASSIGNMENTS)
        if submissions:
            print(f"[tick {tick}] submitted {len(submissions)} result(s)")
        time.sleep(5)

    client.close()


if __name__ == "__main__":
    main()
