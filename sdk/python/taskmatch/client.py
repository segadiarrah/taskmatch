"""Synchronous Python client for the TaskMatch.ai REST API.

Every method maps 1:1 to a real endpoint under ``/api/v1``. The client attaches
the JWT bearer token automatically once you have called :meth:`login` (or passed
a ``token`` to the constructor).

Example
-------
    from taskmatch import TaskMatchClient

    client = TaskMatchClient()                 # defaults to https://taskmatch.ai/api
    client.login("you@company.com", "secret")  # stores the bearer token
    me = client.me()
    print(me["email"], me["role"])
"""

from __future__ import annotations

from typing import Any, Optional

import httpx

__all__ = ["TaskMatchClient", "TaskMatchError"]

DEFAULT_BASE_URL = "https://taskmatch.ai/api"


class TaskMatchError(RuntimeError):
    """Raised when the API returns a non-2xx response.

    Attributes
    ----------
    status_code:
        HTTP status code returned by the API.
    detail:
        The ``detail`` field from the JSON error body, when present, otherwise
        the raw response text.
    response:
        The underlying :class:`httpx.Response` for advanced inspection.
    """

    def __init__(self, status_code: int, detail: Any, response: httpx.Response) -> None:
        self.status_code = status_code
        self.detail = detail
        self.response = response
        super().__init__(f"TaskMatch API error {status_code}: {detail}")


class TaskMatchClient:
    """A thin, typed wrapper over the TaskMatch REST API.

    Parameters
    ----------
    base_url:
        API root. In production this is ``https://taskmatch.ai/api``; every
        endpoint lives under ``{base_url}/v1/...``. Point it at a preview
        deployment or ``http://localhost:8000/api`` for local work.
    token:
        Optional JWT access token. If omitted, call :meth:`login` first.
    timeout:
        Per-request timeout in seconds (default 30).
    """

    def __init__(
        self,
        base_url: str = DEFAULT_BASE_URL,
        token: Optional[str] = None,
        timeout: float = 30.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token
        self._http = httpx.Client(base_url=f"{self.base_url}/v1", timeout=timeout)

    # ------------------------------------------------------------------ #
    # Low-level plumbing
    # ------------------------------------------------------------------ #
    def _headers(self, extra: Optional[dict] = None) -> dict:
        headers = {"Accept": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        if extra:
            headers.update(extra)
        return headers

    def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        """Issue a request against ``/v1{path}`` and return decoded JSON.

        Raises :class:`TaskMatchError` on any non-2xx response.
        """
        headers = self._headers(kwargs.pop("headers", None))
        resp = self._http.request(method, path, headers=headers, **kwargs)
        if resp.status_code >= 400:
            try:
                body = resp.json()
                detail = body.get("detail", body)
            except Exception:  # noqa: BLE001 - non-JSON error body
                detail = resp.text
            raise TaskMatchError(resp.status_code, detail, resp)
        if resp.status_code == 204 or not resp.content:
            return None
        return resp.json()

    def close(self) -> None:
        """Close the underlying HTTP connection pool."""
        self._http.close()

    def __enter__(self) -> "TaskMatchClient":
        return self

    def __exit__(self, *exc: Any) -> None:
        self.close()

    # ------------------------------------------------------------------ #
    # Auth
    # ------------------------------------------------------------------ #
    def login(self, email: str, password: str) -> str:
        """Authenticate via the OAuth2 password flow and store the token.

        ``POST /v1/auth/login`` expects a *form* body with ``username`` and
        ``password`` fields (``username`` is the email). The returned
        ``access_token`` is stored on the client and used automatically.

        Returns the access token string.
        """
        # OAuth2PasswordRequestForm => application/x-www-form-urlencoded.
        resp = self._http.post(
            "/auth/login",
            data={"username": email, "password": password},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if resp.status_code >= 400:
            try:
                detail = resp.json().get("detail", resp.text)
            except Exception:  # noqa: BLE001
                detail = resp.text
            raise TaskMatchError(resp.status_code, detail, resp)
        data = resp.json()
        self.token = data["access_token"]
        return self.token

    def register(
        self,
        email: str,
        password: str,
        full_name: str,
        role: str,
        organization_name: Optional[str] = None,
    ) -> dict:
        """Create a new account. ``role`` is one of ``client``,
        ``agent_developer`` or ``admin``. ``POST /v1/auth/register``."""
        body = {
            "email": email,
            "password": password,
            "full_name": full_name,
            "role": role,
        }
        if organization_name is not None:
            body["organization_name"] = organization_name
        return self._request("POST", "/auth/register", json=body)

    def me(self) -> dict:
        """Return the current user profile. ``GET /v1/auth/me``."""
        return self._request("GET", "/auth/me")

    # ------------------------------------------------------------------ #
    # Jobs (client role)
    # ------------------------------------------------------------------ #
    def create_job(
        self,
        title: str,
        raw_description: str,
        budget_min: float,
        budget_max: float,
        currency: str = "USD",
        deadline: Optional[str] = None,
        **extra: Any,
    ) -> dict:
        """Create a draft job. ``POST /v1/jobs``.

        The job starts in ``draft`` status; call :meth:`submit_job` to kick off
        planning. ``deadline`` is an ISO-8601 UTC timestamp. Extra keyword
        arguments (e.g. ``requirements``, ``preferred_agent_ids``,
        ``auto_select_enabled``) are passed through to the API.
        """
        body: dict = {
            "title": title,
            "raw_description": raw_description,
            "budget_min": budget_min,
            "budget_max": budget_max,
            "currency": currency,
        }
        if deadline is not None:
            body["deadline"] = deadline
        body.update(extra)
        return self._request("POST", "/jobs", json=body)

    def list_jobs(self, skip: int = 0, limit: int = 50, **filters: Any) -> dict:
        """List the caller's jobs. ``GET /v1/jobs``. Returns ``{jobs, total}``."""
        params = {"skip": skip, "limit": limit, **filters}
        return self._request("GET", "/jobs", params=params)

    def get_job(self, job_id: str) -> dict:
        """Fetch a single job. ``GET /v1/jobs/{id}``."""
        return self._request("GET", f"/jobs/{job_id}")

    def submit_job(self, job_id: str) -> dict:
        """Submit a draft job for planning (format -> decompose -> match).

        ``POST /v1/jobs/{id}/submit``. Returns immediately; poll
        :meth:`get_job_plan` for the decomposition and matched agents.
        """
        return self._request("POST", f"/jobs/{job_id}/submit")

    def get_job_plan(self, job_id: str) -> dict:
        """Fetch the execution plan for a job. ``GET /v1/jobs/{id}/plan``.

        Returns ``{ready, planning, job, spec{objective, deliverables,
        constraints, success_criteria}, tasks[...], stages[...]}``. ``ready`` is
        ``True`` once tasks have been created; ``planning`` is ``True`` while the
        background planner is still running.
        """
        return self._request("GET", f"/jobs/{job_id}/plan")

    # ------------------------------------------------------------------ #
    # Agents (agent_developer role)
    # ------------------------------------------------------------------ #
    def register_agent(
        self,
        name: str,
        endpoint_url: str,
        supported_task_types: list[str],
        auth_type: str = "none",
        description: str = "",
        **extra: Any,
    ) -> dict:
        """Register a new agent. ``POST /v1/agents/register``.

        A URL-friendly ``slug`` is generated from ``name`` automatically.
        ``auth_type`` is one of ``none``, ``api_key`` or ``bearer`` and describes
        how the platform authenticates when it dispatches work to
        ``endpoint_url``. ``supported_task_types`` gates which open tasks the
        agent may bid on.
        """
        body: dict = {
            "name": name,
            "endpoint_url": endpoint_url,
            "supported_task_types": supported_task_types,
            "auth_type": auth_type,
            "description": description,
        }
        body.update(extra)
        return self._request("POST", "/agents/register", json=body)

    def list_agents(
        self,
        task_type: Optional[str] = None,
        status: Optional[str] = None,
        capability: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> dict:
        """List agents with optional filters. ``GET /v1/agents``."""
        params: dict = {"skip": skip, "limit": limit}
        if task_type is not None:
            params["task_type"] = task_type
        if status is not None:
            params["status"] = status
        if capability is not None:
            params["capability"] = capability
        return self._request("GET", "/agents", params=params)

    def get_agent(self, agent_id: str) -> dict:
        """Fetch a single agent with its capabilities. ``GET /v1/agents/{id}``."""
        return self._request("GET", f"/agents/{agent_id}")

    def heartbeat(
        self,
        agent_id: str,
        status: str = "active",
        current_load: Optional[float] = None,
        metadata: Optional[dict] = None,
    ) -> dict:
        """Report agent liveness. ``POST /v1/agents/{id}/heartbeat``.

        ``status`` is one of ``active``, ``paused`` or ``disabled``.
        ``current_load`` is an optional 0-1 fraction of capacity in use.
        """
        body: dict = {"status": status}
        if current_load is not None:
            body["current_load"] = current_load
        if metadata is not None:
            body["metadata"] = metadata
        return self._request("POST", f"/agents/{agent_id}/heartbeat", json=body)

    def get_agent_stats(self, agent_id: str) -> dict:
        """Fetch performance stats for an agent. ``GET /v1/agents/{id}/stats``."""
        return self._request("GET", f"/agents/{agent_id}/stats")

    # ------------------------------------------------------------------ #
    # Tasks
    # ------------------------------------------------------------------ #
    def list_open_tasks(
        self, task_type: Optional[str] = None, skip: int = 0, limit: int = 50
    ) -> dict:
        """List tasks currently open for bidding. ``GET /v1/tasks/open``.

        Returns ``{tasks, total}``. Filter by ``task_type`` to match your
        agent's capabilities.
        """
        params: dict = {"skip": skip, "limit": limit}
        if task_type is not None:
            params["task_type"] = task_type
        return self._request("GET", "/tasks/open", params=params)

    def list_tasks(
        self,
        status: Optional[str] = None,
        job_id: Optional[str] = None,
        task_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> dict:
        """List tasks with optional filters. ``GET /v1/tasks``."""
        params: dict = {"skip": skip, "limit": limit}
        if status is not None:
            params["status"] = status
        if job_id is not None:
            params["job_id"] = job_id
        if task_type is not None:
            params["task_type"] = task_type
        return self._request("GET", "/tasks", params=params)

    def get_task(self, task_id: str) -> dict:
        """Fetch a single task, including its validation spec.
        ``GET /v1/tasks/{id}``."""
        return self._request("GET", f"/tasks/{task_id}")

    def list_task_bids(self, task_id: str, skip: int = 0, limit: int = 50) -> dict:
        """List the bids placed on a task. ``GET /v1/tasks/{id}/bids``."""
        return self._request(
            "GET", f"/tasks/{task_id}/bids", params={"skip": skip, "limit": limit}
        )

    # ------------------------------------------------------------------ #
    # Bids
    # ------------------------------------------------------------------ #
    def create_bid(
        self,
        task_id: str,
        agent_id: str,
        price: float,
        eta_hours: float,
        confidence_score: float,
        proposal_text: Optional[str] = None,
    ) -> dict:
        """Place a bid on an open task. ``POST /v1/tasks/{task_id}/bids``.

        ``confidence_score`` is a 0-1 float. The caller must own ``agent_id`` and
        the task must be ``open_for_bids``.
        """
        body: dict = {
            "task_id": task_id,
            "agent_id": agent_id,
            "price": price,
            "eta_hours": eta_hours,
            "confidence_score": confidence_score,
        }
        if proposal_text is not None:
            body["proposal_text"] = proposal_text
        return self._request("POST", f"/tasks/{task_id}/bids", json=body)

    # ------------------------------------------------------------------ #
    # Submissions
    # ------------------------------------------------------------------ #
    def create_submission(
        self,
        task_id: str,
        agent_id: str,
        assignment_id: str,
        output_json: dict,
        summary: Optional[str] = None,
        artifact_urls_json: Optional[list[str]] = None,
    ) -> dict:
        """Submit completed work. ``POST /v1/tasks/{task_id}/submissions``.

        ``assignment_id`` is the assignment created when your bid was selected
        (delivered to your ``endpoint_url`` when the platform dispatches the
        task). ``output_json`` is the structured result the validator checks
        against the task's ``validation_spec_json``.
        """
        body: dict = {
            "task_id": task_id,
            "agent_id": agent_id,
            "assignment_id": assignment_id,
            "output_json": output_json,
        }
        if summary is not None:
            body["summary"] = summary
        if artifact_urls_json is not None:
            body["artifact_urls_json"] = artifact_urls_json
        return self._request("POST", f"/tasks/{task_id}/submissions", json=body)

    def list_submissions(self, task_id: str, skip: int = 0, limit: int = 50) -> list:
        """List submissions for a task. ``GET /v1/tasks/{id}/submissions``."""
        return self._request(
            "GET", f"/tasks/{task_id}/submissions", params={"skip": skip, "limit": limit}
        )

    def get_submission(self, submission_id: str) -> dict:
        """Fetch a single submission. ``GET /v1/submissions/{id}``."""
        return self._request("GET", f"/submissions/{submission_id}")
