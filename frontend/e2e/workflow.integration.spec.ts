import { expect, test } from "@playwright/test";

// This suite writes fixtures. Point it ONLY at the separately provisioned test
// API described in docs/OPERATIONS.md, never the public/production deployment.
const api = process.env.TASKMATCH_E2E_API;
test.skip(!api, "TASKMATCH_E2E_API must point at the isolated browser-test API");
const password = "Browser-test-password-2026";

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "wait" });
});

test("real client creation, quote, manual execution, review and acceptance", async ({ page, request }) => {
  test.setTimeout(120_000);
  if (!api || !["127.0.0.1", "localhost"].includes(new URL(api).hostname)) throw new Error("Use the isolated loopback test API");
  await page.addInitScript(() => localStorage.setItem("taskmatch_locale", "en"));
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const response = await route.fetch({ url: `${api}${path}` });
    await route.fulfill({ response });
  });
  const login = async (role: string) => {
    const response = await request.post(`${api}/api/v1/auth/login`, { form: { username: `browser-${role}@taskmatch.ai`, password } });
    expect(response.ok(), await response.text()).toBeTruthy();
    return { Authorization: `Bearer ${(await response.json()).access_token}` };
  };
  const client = await login("client");
  const developer = await login("developer");
  const admin = await login("admin");
  const call = async (method: string, path: string, headers = client, data?: unknown) => {
    const response = await request.fetch(`${api}/api/v1${path}`, { method, headers, data });
    expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
    return response.json();
  };

  await page.goto("/login");
  await page.locator("#email").fill("browser-client@taskmatch.ai");
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/client$/);
  await page.goto("/client/jobs/new");
  const title = `Browser report ${Date.now()}`;
  await page.locator("#title").fill(title);
  await page.locator("#description").fill("Write a concise report on team process.");
  await page.locator("#budget_min").fill("1");
  await page.locator("#budget_max").fill("100");
  await page.locator("#auto_select").uncheck();
  await page.getByRole("button", { name: "Create Job", exact: true }).click();
  await expect(page).toHaveURL(/\/client\/jobs\/[0-9a-f-]+$/, { timeout: 30_000 });
  const jobId = new URL(page.url()).pathname.split("/").pop();
  let plan: any;
  await expect.poll(async () => {
    plan = await call("GET", `/jobs/${jobId}/plan`);
    return plan.job.status;
  }, { timeout: 30_000 }).toBe("quoted");
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Approve & start", exact: true }).click();
  await expect.poll(async () => (await call("GET", `/jobs/${jobId}/quote`)).quote.status).toBe("accepted");

  const agent = await call("POST", "/agents/register", developer, {
    name: `Browser worker ${Date.now()}`, description: "Isolated test worker", endpoint_url: "https://example.test/worker",
    supported_task_types: plan.tasks.map((task: any) => task.task_type),
  });
  for (const task of plan.tasks) {
    const bid = await call("POST", `/tasks/${task.id}/bids`, developer, {
      task_id: task.id, agent_id: agent.id, price: task.budget, eta_hours: 1, confidence_score: .9,
    });
    await call("PUT", `/bids/${bid.id}/select`, admin);
    const assignment = await call("GET", `/tasks/${task.id}/assignments/mine`, developer);
    const submission = await call("POST", `/tasks/${task.id}/submissions`, developer, {
      task_id: task.id, agent_id: agent.id, assignment_id: assignment.items[0].id,
      output_json: { result: "Report on team process with clear next steps.", summary: "Team process report" }, summary: "Team process report",
    });
    await call("POST", `/submissions/${submission.id}/reviews`, client, { submission_id: submission.id, decision: "approved", score: 95 });
  }
  await page.reload();
  await expect(page.getByRole("button", { name: /Accept.*(work|delivery|payment)|Accept delivery/i })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /Accept.*(work|delivery|payment)|Accept delivery/i }).click();
  await expect.poll(async () => (await call("GET", `/jobs/${jobId}/plan`)).job.status).toBe("completed");
  const ledger = await call("GET", "/payments");
  const entries = ledger.filter((item: any) => item.job_id === jobId);
  expect(entries).toHaveLength(plan.tasks.length);
  expect(entries.every((item: any) => item.payment_status === "releasable")).toBeTruthy();
});

for (const [role, paths] of Object.entries({
  admin: ["/admin", "/admin/jobs", "/admin/tasks", "/admin/agents", "/admin/validations", "/admin/payments", "/admin/learning", "/admin/audit", "/admin/providers"],
  client: ["/client", "/client/jobs", "/client/jobs/new"],
  developer: ["/developer", "/developer/agents", "/developer/agents/new", "/developer/tasks", "/developer/earnings"],
})) {
  test(`real ${role} dashboards render without API failures or crashes`, async ({ page, request }) => {
    test.setTimeout(120_000);
    if (!api) return;
    const auth = await request.post(`${api}/api/v1/auth/login`, { form: { username: `browser-${role}@taskmatch.ai`, password } });
    const { access_token } = await auth.json();
    await page.addInitScript((token) => { localStorage.setItem("auth_token", token); localStorage.setItem("taskmatch_locale", "en"); }, access_token);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/api/**", async (route) => {
      const url = new URL(route.request().url());
      const response = await route.fetch({ url: `${api}${url.pathname}${url.search}` });
      if (response.status() >= 400) errors.push(`${response.status()} ${url.pathname}`);
      await route.fulfill({ response });
    });
    const routes = [...paths];
    if (role === "admin") {
      for (const kind of ["jobs", "tasks", "agents"]) {
        const response = await request.get(`${api}/api/v1/admin/${kind}`, { headers: { Authorization: `Bearer ${access_token}` } });
        const items = await response.json();
        if (items[0]) routes.push(`/admin/${kind}/${items[0].id}`);
      }
    }
    for (const path of routes) {
      await page.goto(path);
      await expect(page.locator("main h1").first(), path).toBeVisible();
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
      expect(errors, path).toEqual([]);
    }
  });
}
