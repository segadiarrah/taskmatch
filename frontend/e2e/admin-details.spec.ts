import { expect, test, type Page } from "@playwright/test";

const date = "2026-09-24T12:00:00Z";
const user = { id: "user-1", email: "owner@example.com", full_name: "Actual Owner", role: "admin", is_active: true, created_at: date };
const job = { id: "job-1", client_user_id: "user-1", title: "Actual Job", raw_description: "Original project brief", formatted_summary: "Structured brief", budget_min: 25, budget_max: 50, currency: "USD", deadline: null, status: "quoted", tasks_count: 1, created_at: date, updated_at: date };
const task = { id: "task-1", job_id: job.id, title: "Actual Task", description: "Produce a useful result", task_type: "writing", status: "open_for_bids", budget: 25, priority: 1, assigned_agent_id: null, created_at: date, updated_at: date };
const agent = { id: "agent-1", developer_user_id: "user-1", name: "Actual Agent", slug: "actual-agent", description: "Writes useful results", endpoint_url: "https://example.test/worker", auth_type: "none", status: "active", capabilities: [{ id: "cap-1", agent_id: "agent-1", capability_name: "writing", version: "1.0", metadata_json: null }], supported_task_types: ["writing"], average_score: 87.5, success_rate: 0.8, completed_tasks_count: 4, created_at: date, updated_at: date };
const bid = { id: "bid-1", task_id: task.id, agent_id: agent.id, agent_name: agent.name, price: 23, eta_hours: 2, confidence_score: 0.9, proposal_text: "Actual proposal", status: "submitted", created_at: date, updated_at: date };
const submission = { id: "sub-1", task_id: task.id, agent_id: agent.id, assignment_id: "assignment-1", output_json: { result: "Actual result" }, summary: "Actual submitted result", artifact_urls_json: [], status: "submitted", created_at: date, updated_at: date };
const matching = [{ agent_id: agent.id, agent_name: agent.name, combined_score: 0.92, capability_score: 1, historical_score: 0.8, reasons: ["Supports writing"] }];

async function mockApi(page: Page, writes: Array<{ method: string; path: string; body: unknown }>) {
  await page.addInitScript(() => { localStorage.setItem("auth_token", "test-token"); localStorage.setItem("taskmatch_locale", "en"); });
  await page.route("**/api/v1/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1", "");
    if (request.method() !== "GET") {
      writes.push({ method: request.method(), path: path + url.search, body: request.postDataJSON() });
      return route.fulfill({ status: 409, json: { detail: "State changed; refresh before retrying" } });
    }
    const responses: Record<string, unknown> = {
      "/auth/me": user,
      "/users/user-1": user,
      "/jobs/job-1": job,
      "/tasks": { tasks: [task], total: 1 },
      "/tasks/task-1": task,
      "/tasks/task-1/execution": { assignment: null, review_required: false, reviewer_name: null, can_review: false, operations: [], can_retry: false, recovery: null },
      "/tasks/task-1/bids": { bids: [bid], total: 1 },
      "/tasks/task-1/submissions": [submission],
      "/tasks/task-1/reviews": [{ id: "review-1", submission_id: "sub-1", reviewer_user_id: "user-1", decision: "rework_requested", score: null, notes: "Actual review notes", created_at: date, updated_at: date }],
      "/dashboard/agent-matching/task-1": matching,
      "/dashboard/mcp-decisions": [{ id: "decision-1", entity_id: "job-1", entity_type: "Job", decision_type: "formatting", reasoning: "Actual reasoning", confidence: 0.9, created_at: date }],
      "/dashboard/feedback-notes": [{ id: "note-1", agent_id: agent.id, author: "Admin", category: "quality", note: "Actual feedback", created_at: date }],
      "/agents/agent-1": agent,
      "/agents/agent-1/stats": { agent_id: agent.id, total_submissions: 6, approved_submissions: 4 },
    };
    if (!(path in responses)) return route.fulfill({ status: 404, json: { detail: `Unexpected test route ${path}` } });
    return route.fulfill({ json: responses[path] });
  });
}

test("admin job detail composes actual resource shapes without invented status writes", async ({ page }) => {
  await mockApi(page, []);
  await page.goto("/admin/jobs/job-1");
  await expect(page.getByRole("heading", { name: "Actual Job", exact: true })).toBeVisible();
  await expect(page.getByText("Original project brief", { exact: true })).toBeVisible();
  await expect(page.getByText("Actual Task", { exact: true })).toBeVisible();
  await expect(page.getByText("Actual reasoning", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit Status" })).toHaveCount(0);
  await expect(page.getByText(/NaN|Invalid Date/)).toHaveCount(0);
});

test("admin agent detail maps capabilities, recorded metrics and feedback", async ({ page }) => {
  const writes: Array<{ method: string; path: string; body: unknown }> = [];
  await mockApi(page, writes);
  await page.goto("/admin/agents/agent-1");
  await expect(page.getByRole("heading", { name: "Actual Agent", exact: true })).toBeVisible();
  await expect(page.getByText("87.5", { exact: true })).toBeVisible();
  await expect(page.getByText("Actual feedback", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "State changed" })).toBeVisible();
  expect(writes[0]).toEqual({ method: "PUT", path: "/agents/agent-1", body: { status: "paused" } });
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await page.getByPlaceholder("Add a feedback note...").fill("Keep my note after failure");
  await page.getByRole("button", { name: "Add Note", exact: true }).click();
  await expect.poll(() => writes.length).toBe(2);
  expect(writes[1]).toEqual({ method: "POST", path: "/dashboard/feedback-notes", body: { agent_id: "agent-1", category: "quality", note: "Keep my note after failure" } });
  await expect(page.getByPlaceholder("Add a feedback note...")).toHaveValue("Keep my note after failure");
});

test("admin task detail uses real matching, bid, submission and review contracts", async ({ page }) => {
  const writes: Array<{ method: string; path: string; body: unknown }> = [];
  await mockApi(page, writes);
  await page.goto("/admin/tasks/task-1");
  await expect(page.getByRole("heading", { name: "Actual Task", exact: true })).toBeVisible();
  await expect(page.getByText("Actual proposal", { exact: true })).toBeVisible();
  await expect(page.getByText("Actual submitted result", { exact: true })).toBeVisible();
  await expect(page.getByText("Actual review notes", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Assign", exact: true })).toBeDisabled();
  await page.getByLabel("Agent to assign").selectOption("agent-1");
  await page.getByRole("button", { name: "Assign", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "State changed" })).toBeVisible();
  expect(writes[0]).toEqual({ method: "POST", path: "/tasks/task-1/assign?agent_id=agent-1", body: null });
  await page.getByRole("button", { name: "Run structural validation", exact: true }).click();
  await expect.poll(() => writes.length).toBe(2);
  expect(writes[1].path).toBe("/mcp/validate-submission/sub-1");
});

test("admin submits own human assignment and sees bounded execution recovery", async ({ page }) => {
  await mockApi(page, []);
  let submitted = false;
  let retryCount = 0;
  await page.route("**/api/v1/tasks/task-1/execution", route => route.fulfill({ json: {
    assignment: { id: "human-assignment", agent_id: "sega-agent", agent_name: "Sega", owner_user_id: user.id, kind: "human", status: submitted ? "submitted" : "assigned", can_submit: !submitted },
    review_required: true, reviewer_name: "Sega", operations: [{ id: "op-1", status: "failed", attempts: 3, last_error: "Provider budget exhausted", available_at: date }], can_retry: !submitted,
    recovery: { eligible: false, reason: "Legacy mission requires operator review" },
  } }));
  await page.route("**/api/v1/tasks/task-1/retry", route => { retryCount++; return route.fulfill({ json: { status: "pending" } }); });
  await page.route("**/api/v1/tasks/task-1/submissions", route => {
    if (route.request().method() === "GET") return route.fulfill({ json: [] });
    expect(route.request().postDataJSON()).toEqual({ task_id: "task-1", agent_id: "sega-agent", assignment_id: "human-assignment", output_json: { result: "Complete human deliverable", summary: "Verified result" }, summary: "Verified result" });
    submitted = true;
    return route.fulfill({ json: { id: "human-submission" } });
  });
  await page.goto("/admin/tasks/task-1");
  await expect(page.getByText("Provider budget exhausted", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Retry task", exact: true }).click();
  await expect.poll(() => retryCount).toBe(1);
  await page.getByLabel("Deliverable result").fill("Complete human deliverable");
  await page.getByLabel("Delivery summary").fill("Verified result");
  await page.getByRole("button", { name: "Submit human deliverable" }).click();
  await expect(page.getByLabel("Deliverable result")).toHaveCount(0);
  expect(submitted).toBe(true);
});

test("human delivery failures preserve the draft and review uses the explicit human contract", async ({ page }) => {
  await mockApi(page, []);
  let allowSubmit = true;
  let reviews = 0;
  await page.route("**/api/v1/tasks/task-1/execution", route => route.fulfill({ json: {
    assignment: { id: "human-assignment", agent_id: "sega-agent", agent_name: "Sega", kind: "human", status: "assigned", can_submit: allowSubmit },
    review_required: true, reviewer_name: "Sega", can_review: !allowSubmit, operations: [], can_retry: false, recovery: null,
  } }));
  await page.route("**/api/v1/tasks/task-1/submissions", route => route.request().method() === "POST"
    ? route.fulfill({ status: 409, json: { detail: "Assignment is no longer active" } })
    : route.fulfill({ json: [submission] }));
  await page.route("**/api/v1/submissions/sub-1/reviews", route => {
    expect(route.request().postDataJSON()).toEqual({ submission_id: "sub-1", decision: "rework_requested", notes: "Please verify the source data" });
    reviews++;
    return route.fulfill({ json: { id: "review-2" } });
  });
  await page.goto("/admin/tasks/task-1");
  await page.getByLabel("Deliverable result").fill("Keep actual work");
  await page.getByLabel("Delivery summary").fill("Keep summary");
  await page.getByRole("button", { name: "Submit human deliverable" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Assignment is no longer active" })).toBeVisible();
  await expect(page.getByLabel("Deliverable result")).toHaveValue("Keep actual work");
  await expect(page.getByRole("button", { name: "Approve human review" })).toHaveCount(0);
  allowSubmit = false;
  await page.reload();
  await expect(page.getByLabel("Deliverable result")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Request corrections" })).toBeDisabled();
  await page.getByLabel("Human review notes").fill("Please verify the source data");
  await page.getByRole("button", { name: "Request corrections" }).click();
  await expect.poll(() => reviews).toBe(1);
});

test("historical recovery requires a current cost preview and preserves server conflicts", async ({ page }) => {
  await mockApi(page, []);
  let recoveries = 0;
  await page.route("**/api/v1/tasks/task-1/execution", route => route.fulfill({ json: {
    assignment: null, review_required: false, reviewer_name: null, can_review: false, operations: [], can_retry: false,
    recovery: { eligible: true, reason: "Historical execution needs an approved cost limit" },
  } }));
  await page.route("**/api/v1/admin/providers", route => route.fulfill({ json: { providers: [
    { provider: "openai", label: "OpenAI", enabled: true, key_set: true, models: ["gpt-6-luna", "model-2"] },
    { provider: "disabled", label: "Disabled provider", enabled: false, key_set: true, models: ["disabled-model"] },
  ] } }));
  await page.route("**/api/v1/tasks/task-1/recovery-preview?**", route => {
    const query = new URL(route.request().url()).searchParams;
    return route.fulfill({ json: { eligible: true, quote_id: "historical-quote", execution: { provider: query.get("provider"), model: query.get("model"), max_cost_eur: "0.1256" } } });
  });
  await page.route("**/api/v1/tasks/task-1/recover", route => {
    expect(route.request().postDataJSON()).toEqual({ provider: "openai", model: "model-2", quote_id: "historical-quote", approved_max_cost_eur: "0.1256" });
    recoveries++;
    return route.fulfill({ status: 409, json: { detail: "Quote changed; preview again" } });
  });
  await page.goto("/admin/tasks/task-1");
  await expect(page.getByRole("button", { name: "Approve cost limit and recover" })).toHaveCount(0);
  await expect(page.getByLabel("Recovery provider").locator("option")).toHaveCount(2);
  await page.getByLabel("Recovery provider").selectOption("openai");
  await page.getByLabel("Recovery model").selectOption("gpt-6-luna");
  await page.getByRole("button", { name: "Preview recovery" }).click();
  await expect(page.getByText("0.1256 EUR", { exact: true })).toBeVisible();
  await page.getByLabel("Recovery model").selectOption("model-2");
  await expect(page.getByRole("button", { name: "Approve cost limit and recover" })).toHaveCount(0);
  expect(recoveries).toBe(0);
  await page.getByRole("button", { name: "Preview recovery" }).click();
  await page.getByRole("button", { name: "Approve cost limit and recover" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Quote changed; preview again" })).toBeVisible();
  await expect(page.getByLabel("Recovery model")).toHaveValue("model-2");
  expect(recoveries).toBe(1);
});

test("task reassignment requires an audit reason and retains inputs when the server rejects the route", async ({ page }) => {
  await mockApi(page, []);
  let reassignments = 0;
  await page.route("**/api/v1/tasks/task-1/execution", route => route.fulfill({ json: {
    assignment: null, review_required: false, reviewer_name: null, can_review: false, operations: [], can_retry: false, can_reassign: true,
    recovery: { eligible: false, reason: "Task already has a frozen execution route" },
  } }));
  await page.route("**/api/v1/agents?**", route => route.fulfill({ json: { agents: [{ id: "sega-agent", name: "Sega", status: "active" }], total: 1 } }));
  await page.route("**/api/v1/tasks/task-1/reassign", route => {
    expect(route.request().postDataJSON()).toEqual({ agent_id: "sega-agent", reason: "Complete the remaining human work" });
    reassignments++;
    return route.fulfill({ status: 409, json: { detail: "Funding is frozen" } });
  });
  await page.goto("/admin/tasks/task-1");
  await expect(page.getByRole("button", { name: "Preview recovery" })).toHaveCount(0);
  await page.getByLabel("Replacement executor").selectOption("sega-agent");
  await expect(page.getByRole("button", { name: "Reassign task", exact: true })).toBeDisabled();
  await page.getByLabel("Reason for reassignment").fill("Complete the remaining human work");
  await page.getByRole("button", { name: "Reassign task", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Funding is frozen" })).toBeVisible();
  await expect(page.getByLabel("Replacement executor")).toHaveValue("sega-agent");
  await expect(page.getByLabel("Reason for reassignment")).toHaveValue("Complete the remaining human work");
  expect(reassignments).toBe(1);
});
