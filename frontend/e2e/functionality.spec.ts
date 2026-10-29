import { expect, test, type Page } from "@playwright/test";

const admin = { id: "00000000-0000-0000-0000-000000000001", email: "admin@example.com", full_name: "Test Admin", role: "admin", is_active: true, created_at: "2026-01-01T00:00:00Z" };

async function authenticated(page: Page) {
  await page.route("**/api/v1/billing/admin/**", route => route.fulfill({ json: [] }));
  await page.addInitScript(() => {
    localStorage.setItem("auth_token", "test-token");
    localStorage.setItem("taskmatch_locale", "en");
  });
  await page.route("**/api/v1/auth/me", (route) => route.fulfill({ json: admin }));
}

test("short admin identifier can be submitted and routes to admin", async ({ page }) => {
  let identifier = "";
  await page.route("**/api/v1/auth/login", (route) => {
    identifier = new URLSearchParams(route.request().postData() || "").get("username") || "";
    return route.fulfill({ json: { access_token: "test-token", token_type: "bearer" } });
  });
  await page.route("**/api/v1/auth/me", (route) => route.fulfill({ json: admin }));
  await page.route("**/api/v1/dashboard/overview", (route) => route.fulfill({ status: 503, json: { detail: "Unavailable" } }));
  await page.goto("/login");
  await page.locator("#email").fill("operator");
  await page.locator("#password").fill("example-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  expect(identifier).toBe("operator");
});

test("login help leads to a working contact page", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Need help signing in?" }).click();
  await expect(page).toHaveURL(/\/company\/contact$/);
  await expect(page.locator("form")).toBeVisible();
});

test("admin overview failures show recovery instead of fabricated metrics", async ({ page }) => {
  await authenticated(page);
  await page.route("**/api/v1/dashboard/overview", (route) => route.fulfill({ status: 503, json: { detail: "Unavailable" } }));
  await page.goto("/admin");
  await expect(page.getByRole("button", { name: /try again|retry/i })).toBeVisible();
  await expect(page.getByText("47", { exact: true })).toHaveCount(0);
});

test("unauthenticated dashboard access returns to login", async ({ page }) => {
  await page.goto("/client/jobs");
  await expect(page).toHaveURL(/\/login$/);
});

test("expired sessions clear the token", async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("auth_token", "expired");
      sessionStorage.setItem("seeded", "true");
    }
  });
  await page.route("**/api/v1/auth/me", (route) => route.fulfill({ status: 401, json: { detail: "Expired" } }));
  await page.goto("/client");
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem("auth_token"))).toBeNull();
});

test("admin payments render actual ledger states and preserve them on failed actions", async ({ page }) => {
  await authenticated(page);
  await page.route("**/api/v1/admin/payments", (route) => route.fulfill({ json: [{
    id: "payment-test", job_id: "job-test", task_id: "task-test", job_title: "Test job", task_title: "Test delivery",
    client_name: "Test client", developer_name: "Test developer", gross_amount: 120, platform_fee: 12,
    net_amount: 108, currency: "USD", status: "pending", provider: "manual", provider_ref: null,
    created_at: "2026-09-24T12:00:00Z",
  }] }));
  await page.route("**/api/v1/payments/payment-test/release", (route) => route.fulfill({ status: 409, json: { detail: "Not approved" } }));
  await page.goto("/admin/payments");
  await expect(page.getByText("Test delivery", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mark releasable" }).click();
  await expect(page.getByTestId("payment-action-error")).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "Test delivery" })).toContainText("Pending");
});

test("admin pending reviews use persisted submitted status", async ({ page }) => {
  await authenticated(page);
  await page.route("**/api/v1/admin/submissions", (route) => route.fulfill({ json: [{
    id: "submission-test", task_id: "task-test", task_title: "Needs approval", job_title: "Test job",
    agent_id: "agent-test", agent_name: "Test agent", developer_name: "Test developer", summary: "Review this",
    deliverable_url: null, submitted_at: "2026-09-24T12:00:00Z", status: "submitted",
    review_result: null, review_notes: null, reviewed_at: null, reviewer: null, mcp_auto_validation: null,
  }] }));
  await page.goto("/admin/validations");
  await expect(page.getByText("Needs approval", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toBeVisible();
});

test("temporary session lookup failures offer recovery without logging the user out", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("auth_token", "existing-session");
    localStorage.setItem("taskmatch_locale", "en");
  });
  let healthy = false;
  await page.route("**/api/v1/auth/me", (route) => healthy
    ? route.fulfill({ json: { ...admin, role: "client" } })
    : route.fulfill({ status: 503, json: { detail: "Service unavailable" } }));
  await page.route("**/api/v1/jobs**", (route) => route.fulfill({ json: { items: [], jobs: [] } }));
  await page.route("**/api/v1/client/dashboard/stats", (route) => route.fulfill({ json: { my_jobs: 0, active_tasks: 0, pending_reviews: 0, total_spent: 0 } }));
  await page.goto("/client");
  await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("auth_token"))).toBe("existing-session");
  healthy = true;
  await page.getByRole("button", { name: /try again/i }).click();
  await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
  await expect(page).toHaveURL(/\/client$/);
});
