import { expect, test, type Page } from "@playwright/test";
import { adminCopy } from "../src/i18n/admin/copy";

const date = "2026-09-24T12:00:00Z";
const user = { id: "user-1", email: "owner@example.test", full_name: "Actual Owner", role: "admin", is_active: true, created_at: date };
const job = { id: "job-1", client_user_id: user.id, title: "Actual Job", raw_description: "Original client brief", formatted_summary: "Structured client brief", budget_min: 25, budget_max: 50, currency: "EUR", deadline: date, status: "quote_rejected", created_at: date, updated_at: date };
const task = { id: "task-1", job_id: job.id, title: "Actual Task", description: "Client task instructions", task_type: "writing", status: "open_for_bids", budget: 25, priority: 1, assigned_agent_id: null, created_at: date, updated_at: date };
const agent = { id: "agent-1", developer_user_id: user.id, name: "Actual Agent", slug: "actual-agent", description: "Client agent description", endpoint_url: "https://example.test/worker", auth_type: "none", status: "active", capabilities: [{ capability_name: "writing" }], supported_task_types: ["writing"], average_score: 87.5, success_rate: 0.8, completed_tasks_count: 4, created_at: date, updated_at: date };
const submission = { id: "submission-1", task_id: task.id, agent_id: agent.id, assignment_id: "assignment-1", output_json: { result: "Original deliverable" }, summary: "Actual submitted result", artifact_urls_json: [], status: "submitted", created_at: date, updated_at: date };
const funding = { id: "funding-1", job_id: job.id, job_title: job.title, payer_name: user.full_name, amount_minor: 2550, currency: "EUR", refunded_minor: 0, status: "paid", error: null, can_refund: true };
const operation = { id: "operation-1", kind: "transfer", entity_id: funding.id, status: "blocked", attempts: 2, available_at: date, last_error: "Funding is frozen", job_title: job.title, amount_minor: 2550, currency: "EUR" };
const audit = { id: "audit-1", actor_type: "Admin", actor_id: user.id, action: "created", entity_type: "Task", entity_id: task.id, details: "Actual audit details", payload_json: { task_id: task.id }, created_at: date };

type Write = { method: string; path: string; body: unknown };
async function fixture(page: Page, locale: keyof typeof adminCopy, writes: Write[]) {
  await page.addInitScript(language => { localStorage.setItem("auth_token", "fixture-token"); localStorage.setItem("taskmatch_locale", language); }, locale);
  await page.route("**/api/v1/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1", "");
    if (request.method() !== "GET") {
      writes.push({ method: request.method(), path: path + url.search, body: request.postDataJSON() });
      return route.fulfill({ status: 409, json: { detail: "Funding is frozen" } });
    }
    const responses: Record<string, unknown> = {
      "/auth/me": user, "/users/user-1": user,
      "/worker-portal/admin/overview": { human_missions: 0, pending_publication: 0, active_human_missions: 0, worker_profiles: 0, pending_worker_verification: 0 },
      "/dashboard/overview": { total_jobs: 1, total_tasks: 1, active_agents: 1, pending_validations: 1, failed_tasks: 0, total_payments_pending: 25.5, total_payments_completed: 0, jobs_by_status: { quoted: 1 }, tasks_by_status: { open_for_bids: 1 }, recent_activity: [audit], currency: "EUR" },
      "/admin/jobs": [{ ...job, client_name: user.full_name, task_count: 1 }],
      "/admin/tasks": [{ ...task, job_title: job.title, assigned_agent_name: null, bids_count: 0 }],
      "/admin/agents": [{ ...agent, kind: "agent", developer_name: user.full_name, capabilities: ["writing"], avg_score: 87.5, completed_tasks: 4, active_tasks: 1 }],
      "/admin/submissions": [{ ...submission, task_title: task.title, job_title: job.title, agent_name: agent.name, developer_name: user.full_name, deliverable_url: null, submitted_at: date, review_result: null, reviewed_at: null, reviewer: null, mcp_auto_validation: { passed: true, score: 95, notes: "MCP automated validation passed all checks.", checks: [{ name: "has_summary", passed: true, detail: "MCP automated validation passed all checks." }] } }],
      "/admin/payments": [{ id: "payment-1", billing_mode: "stripe", funding_id: funding.id, transfer_id: null, payout_error: null, job_id: job.id, job_title: job.title, task_id: task.id, task_title: task.title, client_name: user.full_name, developer_name: user.full_name, currency: "EUR", provider: "stripe_connect", provider_ref: null, gross_amount: "25.50", platform_fee: "2.50", net_amount: "23.00", status: "blocked", created_at: date, released_at: null, completed_at: null }],
      "/admin/providers": { providers: [{ provider: "fixture", label: "Fixture Provider", base_url: "https://example.test", models: ["fixture-model"], selected_model: "fixture-model", enabled: true, key_set: true, key_hint: "…test", catalog_checked_at: date, selected_model_available: true, available_models: ["fixture-model"] }] },
      "/billing/admin/fundings": [funding], "/billing/admin/operations": [operation], "/dashboard/audit-logs": [audit],
      "/dashboard/feedback-notes": [{ id: "note-1", author: "Actual Owner", category: "quality", note: "Actual feedback", agent_id: agent.id, agent_name: agent.name, task_id: task.id, task_title: task.title, created_at: date }],
      "/dashboard/mcp-decisions": ["formatting", "decomposition", "matching", "ranking", "validation"].map((decision_type, index) => ({ id: `decision-${index}`, entity_id: job.id, entity_type: "Job", entity_name: job.title, decision_type, reasoning: "Actual reasoning", confidence: 0.9, input_data_summary: "Original input", created_at: date })),
      "/jobs/job-1": job, "/tasks": { tasks: [task], total: 1 }, "/tasks/task-1": task,
      "/tasks/task-1/bids": { bids: [], total: 0 }, "/tasks/task-1/submissions": [submission], "/tasks/task-1/reviews": [],
      "/tasks/task-1/execution": { assignment: null, review_required: false, reviewer_name: null, can_review: false, operations: [operation], can_retry: false, can_reassign: true, recovery: { eligible: false, reason: "Task already has a frozen execution route" } },
      "/dashboard/agent-matching/task-1": [{ agent_id: agent.id, agent_name: agent.name, combined_score: 0.92, capability_score: 1, historical_score: 0.8, reasons: ["Supports task type 'writing'", "Completed 4 tasks with 80% success rate"] }],
      "/agents/agent-1": agent, "/agents/agent-1/stats": { total_submissions: 6, approved_submissions: 4 }, "/agents": { agents: [agent], total: 1 },
    };
    if (!(path in responses)) return route.fulfill({ status: 404, json: { detail: `Unexpected fixture GET ${path}` } });
    return route.fulfill({ json: responses[path] });
  });
}

for (const locale of Object.keys(adminCopy) as Array<keyof typeof adminCopy>) {
  test(`all admin route families and rejected actions use ${locale}`, async ({ page }) => {
    test.setTimeout(120_000);
    const copy = adminCopy[locale];
    const writes: Write[] = [];
    const pageErrors: string[] = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await fixture(page, locale, writes);
    const routes = [
      ["/admin", "Mission Control"], ["/admin/jobs", "Job Intake"], ["/admin/tasks", "Task Management"],
      ["/admin/agents", "Agent Directory"], ["/admin/validations", "Validation Center"], ["/admin/payments", "Payments"],
      ["/admin/providers", "AI Providers"], ["/admin/learning", "Learning & Feedback"], ["/admin/audit", "Audit Log"],
    ] as const;
    for (const [path, heading] of routes) {
      await test.step(path, async () => {
        await page.goto(path);
        await expect(page.getByRole("heading", { name: copy[heading], exact: true })).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.getByText(/NaN|Invalid Date/)).toHaveCount(0);
      });
    }
    expect(writes).toEqual([]);
    await page.goto("/admin/jobs/job-1");
    await expect(page.getByRole("heading", { name: job.title, exact: true })).toBeVisible();
    await expect(page.getByText(copy["Raw Description"], { exact: true })).toBeVisible();
    await expect(page.getByText(job.raw_description, { exact: true })).toBeVisible();
    await expect(page.getByText(copy["Quote Rejected"], { exact: true })).toBeVisible();
    for (const decisionLabel of ["Decompose", "Match", "Rank Bids", "Validate"] as const) {
      await expect(page.getByRole("main").getByText(copy[decisionLabel], { exact: true })).toBeVisible();
    }
    await page.goto("/admin/agents/agent-1");
    await expect(page.getByRole("heading", { name: agent.name, exact: true })).toBeVisible();
    await expect(page.getByText(copy["Performance Metrics"], { exact: true })).toBeVisible();
    await page.getByRole("button", { name: copy.Pause, exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: copy["Funding is frozen"] })).toBeVisible();
    await expect(page.getByRole("button", { name: copy.Pause, exact: true })).toBeVisible();
    expect(writes[0]).toEqual({ method: "PUT", path: "/agents/agent-1", body: { status: "paused" } });
    await page.goto("/admin/tasks/task-1");
    await expect(page.getByRole("heading", { name: task.title, exact: true })).toBeVisible();
    await expect(page.getByText(copy["Task already has a frozen execution route"], { exact: true })).toBeVisible();
    await expect(page.getByText(copy["Supports task type '{type}'"].replace("{type}", copy.Writing), { exact: false })).toBeVisible();
    await page.getByLabel(copy["Replacement executor"]).selectOption(agent.id);
    await expect(page.getByRole("button", { name: copy["Reassign task"], exact: true })).toBeDisabled();
    await page.getByLabel(copy["Reason for reassignment"]).fill("Keep this original reason");
    await page.getByRole("button", { name: copy["Reassign task"], exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: copy["Funding is frozen"] })).toBeVisible();
    await expect(page.getByLabel(copy["Reason for reassignment"])).toHaveValue("Keep this original reason");
    expect(writes[1]).toEqual({ method: "POST", path: "/tasks/task-1/reassign", body: { agent_id: agent.id, reason: "Keep this original reason" } });
    await page.goto("/admin/payments");
    await page.getByRole("button", { name: copy["Refund in full"], exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText(copy["Refund this payment in full?"]);
    await page.getByRole("button", { name: copy["Confirm full refund"], exact: true }).click();
    await expect(page.getByRole("dialog").getByRole("alert")).toHaveText(copy["Funding is frozen"]);
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(writes[2]).toEqual({ method: "POST", path: "/billing/jobs/job-1/refund", body: {} });
    expect(pageErrors).toEqual([]);
  });
}


test("admin catalogue has complete locale and interpolation parity", () => {
  const keys = Object.keys(adminCopy.en).sort();
  const tokens = (value: string) => Array.from(value.matchAll(/\{(\w+)\}/g), item => item[1]).sort();
  for (const [locale, copy] of Object.entries(adminCopy)) {
    expect(Object.keys(copy).sort(), locale).toEqual(keys);
    for (const key of keys) {
      const text = copy[key as keyof typeof copy];
      expect(text.trim().length, `${locale}: ${key}`).toBeGreaterThan(0);
      expect(tokens(text), `${locale}: ${key}`).toEqual(tokens(adminCopy.en[key as keyof typeof adminCopy.en]));
    }
  }
});

test("admin locale changes translate an existing rejection and preserve the draft", async ({ page }) => {
  const writes: Write[] = [];
  await fixture(page, "en", writes);
  await page.goto("/admin/agents/agent-1");
  await page.getByPlaceholder(adminCopy.en["Add a feedback note..."]).fill("Keep this user-authored note");
  await page.getByRole("button", { name: adminCopy.en.Pause, exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: adminCopy.en["Funding is frozen"] })).toBeVisible();
  await page.locator('select').filter({ has: page.locator('option[value="pt"]') }).selectOption("fr");
  await expect(page.getByRole("alert").filter({ hasText: adminCopy.fr["Funding is frozen"] })).toBeVisible();
  await expect(page.getByPlaceholder(adminCopy.fr["Add a feedback note..."])).toHaveValue("Keep this user-authored note");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("taskmatch_locale"))).toBe("fr");
  expect(writes).toHaveLength(1);
});

test("Portuguese admin labels remain usable on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fixture(page, "pt", []);
  for (const [path, heading] of [["/admin/providers", "AI Providers"], ["/admin/payments", "Payments"], ["/admin/tasks/task-1", "Actual Task"]] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading === "Actual Task" ? heading : adminCopy.pt[heading], exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBe(true);
  }
});
