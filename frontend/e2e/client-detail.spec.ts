import { expect, test, type Page } from "@playwright/test";

async function prepare(page: Page, status = "client_review") {
  await page.addInitScript(() => { localStorage.setItem("auth_token", "test-token"); localStorage.setItem("taskmatch_locale", "en"); });
  await page.route("**/api/v1/auth/me", route => route.fulfill({ json: { id: "client-test", full_name: "Client", email: "client@example.test", role: "client", is_active: true } }));
  await page.route("**/api/v1/jobs/job-test/**", route => route.fulfill({ status: 404, json: { detail: "Not available" } }));
  await page.route("**/api/v1/jobs/job-test", route => route.fulfill({ json: { id: "job-test", title: "Real API job", billing_mode: "legacy_manual", raw_description: "The saved raw brief", status, budget_min: 10, budget_max: 50, currency: "USD", auto_select_enabled: false, tasks_count: 1, created_at: "2026-09-24T12:00:00Z", updated_at: "2026-09-24T12:00:00Z" } }));
}
function plan(status = "client_review", taskStatus = "approved") {
  return { ready: true, planning: false, job: { id: "job-test", status, currency: "USD" }, spec: { objective: "Review result", deliverables: [], constraints: [], success_criteria: [] }, tasks: [{ id: "task-test", title: "Completed report", status: taskStatus, task_type: "analysis", budget: 10, matched_agents: [], delivered: { submission_id: "submission-test", summary: "Result evidence", result_preview: "Actual report", status: taskStatus } }], stages: [], payment: null };
}

test("job detail uses raw API fields and accepts reviewed work without a payment record", async ({ page }) => {
  await prepare(page);
  let accepted = false;
  await page.route("**/api/v1/jobs/job-test/plan", route => route.fulfill({ json: plan(accepted ? "completed" : "client_review") }));
  await page.route("**/api/v1/jobs/job-test/accept", route => { accepted = true; return route.fulfill({ json: { status: "completed", payments_released: 0, payment_settlement: "manual" } }); });
  await page.goto("/client/jobs/job-test");
  await expect(page.getByText("The saved raw brief", { exact: true })).toBeVisible();
  await expect(page.getByText("Actual report", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Accept work", exact: true }).click();
  await expect(page.getByText("Work accepted", { exact: true })).toBeVisible();
  await expect(page.getByText(/Payment settlement is separate/)).toBeVisible();
});

test("plan loading failures offer recovery instead of invented planning progress", async ({ page }) => {
  await prepare(page, "submitted");
  let available = false;
  await page.route("**/api/v1/jobs/job-test/plan", route => route.fulfill(available ? { json: plan() } : { status: 503, json: { detail: "Unavailable" } }));
  await page.goto("/client/jobs/job-test");
  await expect(page.locator("main [role=alert]")).toBeVisible();
  available = true;
  await page.getByRole("button", { name: /try again|retry/i }).click();
  await expect(page.getByText("Actual report", { exact: true })).toBeVisible();
});

test("individual task review shows failure and only updates after a saved review", async ({ page }) => {
  await prepare(page, "in_progress");
  let approved = false;
  let attempts = 0;
  await page.route("**/api/v1/jobs/job-test/plan", route => route.fulfill({ json: plan(approved ? "client_review" : "in_progress", approved ? "approved" : "submitted") }));
  await page.route("**/api/v1/submissions/submission-test/reviews", route => {
    attempts += 1;
    if (attempts === 1) return route.fulfill({ status: 503, json: { detail: "Review unavailable" } });
    expect(route.request().postDataJSON()).toMatchObject({ submission_id: "submission-test", decision: "approved" });
    approved = true;
    return route.fulfill({ json: { id: "review-test", decision: "approved" } });
  });
  await page.goto("/client/jobs/job-test");
  await page.getByRole("button", { name: "Approve Result", exact: true }).click();
  await expect(page.locator("main [role=alert]")).toBeVisible();
  await page.getByRole("button", { name: "Approve Result", exact: true }).click();
  await expect(page.getByRole("button", { name: "Accept work", exact: true })).toBeVisible();
  expect(attempts).toBe(2);
});
