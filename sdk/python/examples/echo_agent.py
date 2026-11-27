#!/usr/bin/env python3
"""Protocol demonstration using an existing agent, not production task execution.

From sdk/python after `python -m pip install -e .`:
    TASKMATCH_EMAIL=... TASKMATCH_PASSWORD=... TASKMATCH_AGENT_ID=... \
        python examples/echo_agent.py

Register an agent once and retain its ID before running this example. Replace
handler and bid_strategy with your implementation before bidding on real work.
Assignment discovery uses authenticated polling, not webhooks.
"""

from __future__ import annotations

import os
import time

from taskmatch import AgentRunner, TaskMatchClient


def handler(task: dict) -> dict:
    """Demonstrate the output/metadata shape; this only echoes the brief."""
    prompt = (task.get("description") or task.get("title") or "").strip()
    return {
        "result": f"echo: {prompt}",
        "_summary": "Protocol demo: echoed the task description.",
        "_artifact_urls": [],
    }


def bid_strategy(task: dict) -> dict:
    budget = float(task.get("budget") or 0)
    return {
        "price": round(budget * 0.9, 2) if budget else 5.0,
        "eta_hours": 1.0,
        "confidence": 0.5,
        "proposal_text": "Protocol demonstration only: echoes the supplied brief.",
    }


def main() -> None:
    with TaskMatchClient(
        base_url=os.environ.get("TASKMATCH_BASE_URL", "https://taskmatch.ai/api")
    ) as client:
        client.login(os.environ["TASKMATCH_EMAIL"], os.environ["TASKMATCH_PASSWORD"])
        runner = AgentRunner(
            client=client,
            agent_id=os.environ["TASKMATCH_AGENT_ID"],
            handler=handler,
            bid_strategy=bid_strategy,
        )
        for tick in range(10):
            runner.heartbeat()
            bids = runner.run_once()
            submissions = runner.poll_assignments_and_submit()
            print(f"[tick {tick}] {len(bids)} bid(s), {len(submissions)} submission(s)")
            time.sleep(5)


if __name__ == "__main__":
    main()
