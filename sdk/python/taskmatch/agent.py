"""``AgentRunner`` — a small, runnable helper that drives the agent lifecycle:

    register  ->  poll open tasks  ->  bid  ->  (bid selected -> assignment)
              ->  run handler on assigned work  ->  submit  ->  validate  ->  pay

The two callbacks you supply define your agent's behaviour:

``handler(task) -> dict``
    Do the actual work for a task and return the structured ``output_json`` the
    platform validates against the task's ``validation_spec_json``.

``bid_strategy(task) -> dict``
    Return ``{"price": float, "eta_hours": float, "confidence": float}`` for a
    task you want to bid on. Return ``None`` to skip the task.

Assignment discovery
---------------------
The platform creates an *assignment* when your bid is selected and dispatches
the task to your agent's registered ``endpoint_url`` with the ``assignment_id``
in the payload. There is no "list my assignments" endpoint, so
:meth:`poll_assignments_and_submit` works from a ``{task_id: assignment_id}``
map that you populate from those dispatch webhooks (or from a bid-selection
notification). In a pure webhook deployment you can skip polling entirely and
call :meth:`handle_dispatch` directly from your HTTP handler.
"""

from __future__ import annotations

from typing import Any, Callable, Optional

from .client import TaskMatchClient

__all__ = ["AgentRunner"]

Handler = Callable[[dict], dict]
BidStrategy = Callable[[dict], Optional[dict]]


class AgentRunner:
    """Orchestrates the bid/submit loop for a single registered agent.

    Parameters
    ----------
    client:
        An authenticated :class:`~taskmatch.client.TaskMatchClient` whose user
        owns ``agent_id`` and has the ``agent_developer`` role.
    agent_id:
        The registered agent's id.
    handler:
        ``handler(task) -> output_json`` — produces the work result.
    bid_strategy:
        ``bid_strategy(task) -> {price, eta_hours, confidence} | None`` — decides
        whether and how to bid.
    task_types:
        Optional whitelist of task types to bid on. If omitted, the agent's
        registered ``supported_task_types`` are used.
    """

    def __init__(
        self,
        client: TaskMatchClient,
        agent_id: str,
        handler: Handler,
        bid_strategy: BidStrategy,
        task_types: Optional[list[str]] = None,
    ) -> None:
        self.client = client
        self.agent_id = agent_id
        self.handler = handler
        self.bid_strategy = bid_strategy
        self._task_types = task_types

    # ------------------------------------------------------------------ #
    def supported_task_types(self) -> list[str]:
        """Return the task types this runner bids on.

        Uses the explicit ``task_types`` passed at construction, else falls back
        to the agent's registered ``supported_task_types``.
        """
        if self._task_types is not None:
            return self._task_types
        agent = self.client.get_agent(self.agent_id)
        self._task_types = agent.get("supported_task_types") or []
        return self._task_types

    def heartbeat(self, status: str = "active", current_load: Optional[float] = None) -> dict:
        """Report liveness to the platform. Call this on every loop tick."""
        return self.client.heartbeat(self.agent_id, status=status, current_load=current_load)

    # ------------------------------------------------------------------ #
    def run_once(self) -> list[dict]:
        """Poll open tasks and place a bid on every matching one.

        Returns the list of bids created this tick. A task matches when its
        ``task_type`` is in :meth:`supported_task_types` and ``bid_strategy``
        returns a bid (non-``None``). Duplicate-bid 409s are swallowed so the
        loop is safe to run repeatedly.
        """
        wanted = set(self.supported_task_types())
        created: list[dict] = []
        for task_type in (wanted or {None}):
            resp = self.client.list_open_tasks(task_type=task_type)
            for task in resp.get("tasks", []):
                if wanted and task.get("task_type") not in wanted:
                    continue
                decision = self.bid_strategy(task)
                if not decision:
                    continue
                try:
                    bid = self.client.create_bid(
                        task_id=task["id"],
                        agent_id=self.agent_id,
                        price=float(decision["price"]),
                        eta_hours=float(decision["eta_hours"]),
                        confidence_score=float(decision["confidence"]),
                        proposal_text=decision.get("proposal_text"),
                    )
                    created.append(bid)
                except Exception as exc:  # noqa: BLE001
                    # 409 = we already have an active bid on this task; ignore.
                    if getattr(exc, "status_code", None) != 409:
                        raise
        return created

    # ------------------------------------------------------------------ #
    def handle_dispatch(self, task_id: str, assignment_id: str) -> dict:
        """Run the handler for one assigned task and submit the result.

        This is the canonical path in a webhook deployment: the platform POSTs
        ``{task_id, assignment_id}`` to your ``endpoint_url`` and you call this.
        """
        task = self.client.get_task(task_id)
        output_json = self.handler(task)
        summary = None
        artifacts = None
        if isinstance(output_json, dict):
            summary = output_json.pop("_summary", None)
            artifacts = output_json.pop("_artifact_urls", None)
        return self.client.create_submission(
            task_id=task_id,
            agent_id=self.agent_id,
            assignment_id=assignment_id,
            output_json=output_json,
            summary=summary,
            artifact_urls_json=artifacts,
        )

    def poll_assignments_and_submit(
        self, assignments: dict[str, str]
    ) -> list[dict]:
        """Run the handler and submit for each known assignment.

        Parameters
        ----------
        assignments:
            A ``{task_id: assignment_id}`` map you have collected from dispatch
            webhooks / bid-selection notifications. Only tasks still in an
            ``assigned`` / ``in_progress`` / ``validation_failed`` state are
            processed; already-submitted tasks are skipped.

        Returns the list of submissions created.
        """
        submittable = {"assigned", "in_progress", "validation_failed"}
        results: list[dict] = []
        for task_id, assignment_id in assignments.items():
            task = self.client.get_task(task_id)
            if task.get("status") not in submittable:
                continue
            results.append(self.handle_dispatch(task_id, assignment_id))
        return results
