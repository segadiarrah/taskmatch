import { expect, test, type Page } from "@playwright/test";
const locales = ["en", "fr", "zh", "es", "pt"] as const;
const date = "2026-09-24T12:00:00Z", long = "LongUnbrokenSourceContent".repeat(7);
const agent = { id: "agent-mobile", developer_user_id: "owner-mobile", name: long, slug: "agent-mobile", description: "Recorded agent description", endpoint_url: `https://example.test/${long}`, auth_type: "none", status: "active", supported_task_types: ["writing"], average_score: 87.5, success_rate: 0.8, completed_tasks_count: 4, last_heartbeat_at: null, capabilities: [{ id: "cap-mobile", agent_id: "agent-mobile", capability_name: "writing", version: "1.0", metadata_json: null }], created_at: date, updated_at: date, kind: "agent" };
const job = { id: "job-mobile", client_user_id: "owner-mobile", title: long, raw_description: "Recorded project brief", formatted_summary: null, status: "in_progress", budget_min: 25, budget_max: 50, currency: "EUR", deadline: null, tasks_count: 1, created_at: date, updated_at: date };
const task = { id: "task-mobile", job_id: job.id, title: long, description: `Recorded task instructions ${long}`, task_type: "writing", status: "assigned", input_spec_json: { source: long }, output_spec_json: { result: long }, validation_spec_json: null, budget: 25, priority: 1, assigned_agent_id: agent.id, created_at: date, updated_at: date };
const assignment = { id: "assignment-mobile", task_id: task.id, agent_id: agent.id, task_title: task.title, job_title: job.title, agent_name: agent.name, status: "active", revision_count: 0, budget: 25, currency: "EUR", deadline: null };
async function fixture(page: Page, locale: typeof locales[number], role: "admin" | "agent_developer") {
  const errors: string[] = [], unexpected: string[] = [], writes: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.addInitScript(language => { localStorage.setItem("auth_token", "mobile-fixture"); localStorage.setItem("taskmatch_locale", language); }, locale);
  await page.route("**/api/v1/**", route => {
    const req = route.request(), path = new URL(req.url()).pathname.replace("/api/v1", "");
    if (req.method() !== "GET") { writes.push(`${req.method()} ${path}`); return route.fulfill({ status: 409, json: { detail: "Read-only fixture" } }); }
    const responses: Record<string, unknown> = {
      "/auth/me": { id: "owner-mobile", email: "fixture@example.test", full_name: "Fixture Owner", role, is_active: true, created_at: date },
      "/users/owner-mobile": { id: "owner-mobile", email: "fixture@example.test", full_name: "Fixture Owner", role },
      "/agents/agent-mobile": agent, "/agents": { agents: [agent], total: 1 },
      "/developer/agents": { items: [{ ...agent, success_rate: 80, completed_tasks: 4, capabilities: ["writing"] }] },
      "/developer/assignments": { items: [assignment] }, "/jobs/job-mobile": job, "/tasks/task-mobile": task,
      "/tasks/task-mobile/bids/mine": { items: [] }, "/tasks/task-mobile/submissions/mine": { items: [] },
      "/tasks/task-mobile/assignments/mine": { items: [{ id: assignment.id, agent_id: agent.id, agent_name: agent.name, status: "active" }] },
      "/tasks/task-mobile/bids": { bids: [], total: 0 }, "/tasks/task-mobile/submissions": [], "/tasks/task-mobile/reviews": [],
      "/tasks/task-mobile/execution": { assignment: { id: assignment.id, agent_id: agent.id, agent_name: agent.name, owner_user_id: "owner-mobile", kind: "agent", status: "active", can_submit: false }, review_required: false, reviewer_name: null, can_review: false, operations: [], can_retry: false, can_reassign: false, recovery: null },
      "/dashboard/agent-matching/task-mobile": [{ agent_id: agent.id, agent_name: agent.name, combined_score: 0.92, capability_score: 1, historical_score: 0.8, reasons: [long] }],
      "/admin/providers": { providers: [{ provider: "openai", label: "OpenAI", base_url: `https://example.test/${long}`, models: [long], selected_model: long, enabled: false, key_set: false, key_hint: null }] },
      "/admin/payments": [{ id: "payment-mobile", job_id: job.id, job_title: job.title, task_id: task.id, task_title: task.title, client_name: "Fixture Client", developer_name: agent.name, billing_mode: "stripe", funding_id: "funding-mobile", transfer_id: null, provider: "stripe_connect", provider_ref: null, status: "paid", gross_amount: 25, platform_fee: 2.5, net_amount: 22.5, currency: "EUR", payout_error: null, created_at: date }],
      "/billing/admin/fundings": [{ id: "funding-mobile", job_id: job.id, job_title: job.title, payer_name: "Fixture Client", amount_minor: 2500, currency: "EUR", refunded_minor: 0, status: "paid", error: null, can_refund: true }],
      "/billing/admin/operations": [{ id: "operation-mobile", kind: "transfer", entity_id: long, status: "blocked", attempts: 2, available_at: date, last_error: "Account onboarding incomplete" }],
    };
    if (!(path in responses)) { unexpected.push(path); return route.fulfill({ status: 404, json: { detail: "Unexpected fixture route" } }); }
    return route.fulfill({ json: responses[path] });
  });
  return { errors, unexpected, writes };
}
async function healthyMobile(page: Page, locale: typeof locales[number]) {
  await expect(page.locator("html")).toHaveAttribute("lang", locale);
  await expect(page.locator("main")).toHaveAttribute("lang", locale);
  await expect(page.locator("main h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("main .animate-spin")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => ({ document: document.documentElement.scrollWidth - innerWidth, main: document.querySelector("main")!.scrollWidth - document.querySelector("main")!.clientWidth }))).toEqual({ document: 0, main: 0 });
}
for (const locale of locales) {
  test(`filled admin private journeys fit mobile in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const state = await fixture(page, locale, "admin");
    for (const path of ["/admin/payments", "/admin/providers", "/admin/tasks/task-mobile"]) {
      await page.goto(path); await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("main .animate-spin")).toHaveCount(0); await healthyMobile(page, locale);
    }
    expect(state.errors).toEqual([]); expect(state.unexpected).toEqual([]); expect(state.writes).toEqual([]);
  });
  test(`actual developer resource contracts render on mobile in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const state = await fixture(page, locale, "agent_developer");
    await page.goto("/developer/agents/agent-mobile"); await expect(page.locator("main h1")).toHaveText(agent.name);
    await expect(page.getByText("87.5 / 100", { exact: true })).toBeVisible(); await expect(page.getByText("80%", { exact: true })).toBeVisible();
    await expect(page.locator("main")).toContainText("writing"); await expect(page.locator('main a[href="/developer/tasks/task-mobile"]')).toBeVisible();
    await healthyMobile(page, locale);
    await page.goto("/developer/tasks/task-mobile"); await expect(page.locator("main h1")).toHaveText(task.title);
    await expect(page.locator("main pre").first()).toContainText(long); await healthyMobile(page, locale);
    expect(state.errors).toEqual([]); expect(state.unexpected).toEqual([]); expect(state.writes).toEqual([]);
  });
}

test("rejected agent edits preserve the recorded detail and capability draft", async ({ page }) => {
  await fixture(page, "en", "agent_developer");
  await page.route("**/api/v1/agents/agent-mobile/capabilities", route => {
    expect(route.request().postDataJSON()).toEqual({ capability_name: "reviewing", version: "2.0" });
    return route.fulfill({ status: 409, json: { detail: "State changed; refresh before retrying" } });
  });
  await page.goto("/developer/agents/agent-mobile");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByPlaceholder("e.g., python").fill("reviewing");
  await page.getByPlaceholder("e.g., 3.11").fill("2.0");
  await page.getByRole("button", { name: "Add", exact: true }).last().click();
  await expect(page.locator('main [role="alert"]')).toContainText("State changed");
  await expect(page.locator("main h1")).toHaveText(agent.name);
  await expect(page.getByPlaceholder("e.g., python")).toHaveValue("reviewing");
});

test("developer agent edits use canonical resource and capability contracts", async ({ page }) => {
  await fixture(page, "en", "agent_developer");
  let current = { ...agent, capabilities: [...agent.capabilities] };
  const edits: string[] = [];
  await page.route("**/api/v1/agents/agent-mobile", route => {
    if (route.request().method() === "PUT") {
      expect(route.request().postDataJSON()).toEqual({ status: "paused" });
      edits.push("status"); current = { ...current, status: "paused" };
    }
    return route.fulfill({ json: current });
  });
  await page.route("**/api/v1/agents/agent-mobile/capabilities", route => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toEqual({ capability_name: "reviewing", version: "2.0" });
    edits.push("add"); current.capabilities.push({ ...agent.capabilities[0], id: "cap-added", capability_name: "reviewing", version: "2.0" });
    return route.fulfill({ status: 201, json: current.capabilities[1] });
  });
  await page.route("**/api/v1/agents/agent-mobile/capabilities/cap-added/remove", route => {
    expect(route.request().method()).toBe("POST"); expect(route.request().postData()).toBe(null);
    edits.push("remove"); current = { ...current, capabilities: current.capabilities.filter(cap => cap.id !== "cap-added") };
    return route.fulfill({ status: 204 });
  });
  await page.goto("/developer/agents/agent-mobile");
  await page.getByRole("button", { name: "Pause Agent", exact: true }).click();
  await expect(page.getByRole("button", { name: "Activate Agent", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByPlaceholder("e.g., python").fill("reviewing"); await page.getByPlaceholder("e.g., 3.11").fill("2.0");
  await page.getByRole("button", { name: "Add", exact: true }).last().click();
  await expect(page.getByRole("button", { name: "Remove reviewing", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remove reviewing", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove reviewing", exact: true })).toHaveCount(0);
  expect(edits).toEqual(["status", "add", "remove"]);
});

for (const variant of ["human", "platform"] as const) {
  test(`${variant} agent capabilities stay under their authoritative workflow`, async ({ page }) => {
    await fixture(page, "en", "agent_developer");
    await page.route("**/api/v1/agents/agent-mobile", route => route.fulfill({ json: { ...agent, kind: variant === "human" ? "human" : "agent", slug: variant === "platform" ? "llm-openai" : agent.slug } }));
    await page.goto("/developer/agents/agent-mobile");
    await expect(page.locator("main h1")).toHaveText(agent.name);
    await expect(page.getByRole("button", { name: "Add", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Remove writing", exact: true })).toHaveCount(0);
  });
}

for (const taskStatus of ["assigned", "validation_failed"] as const) {
  test(`delivery uses the active assignment's owned agent for ${taskStatus} and preserves rejected drafts`, async ({ page }) => {
    await fixture(page, "en", "agent_developer");
    const submitted: unknown[] = [];
    await page.route("**/api/v1/tasks/task-mobile", route => route.fulfill({ json: { ...task, status: taskStatus } }));
    await page.route("**/api/v1/developer/agents", route => route.fulfill({ json: { items: [
      { ...agent, id: "alphabetically-first-unassigned", name: "A first unassigned agent" },
      { ...agent, name: "Z actual assigned agent" },
    ] } }));
    await page.route("**/api/v1/tasks/task-mobile/assignments/mine", route => route.fulfill({ json: { items: [
      { id: "old-canceled-assignment", agent_id: "alphabetically-first-unassigned", agent_name: "A first unassigned agent", status: "cancelled" },
      { id: assignment.id, agent_id: agent.id, agent_name: "Z actual assigned agent", status: "active" },
    ] } }));
    await page.route("**/api/v1/tasks/task-mobile/submissions", route => {
      submitted.push(route.request().postDataJSON());
      return route.fulfill({ status: 409, json: { detail: "Assignment is no longer active" } });
    });
    await page.goto("/developer/tasks/task-mobile");
    await expect(page.locator("#sub-output")).toBeVisible();
    await page.locator("#sub-output").fill('{"result":"Keep the reviewed deliverable"}');
    await page.locator("#sub-summary").fill("Keep the delivery summary");
    await page.locator("#sub-artifacts").fill("https://example.test/delivery");
    await page.getByRole("button", { name: "Submit Work", exact: true }).click();
    await expect.poll(() => submitted.length).toBe(1);
    expect(submitted[0]).toEqual({ task_id: task.id, agent_id: agent.id, assignment_id: assignment.id, output_json: { result: "Keep the reviewed deliverable" }, summary: "Keep the delivery summary", artifact_urls_json: ["https://example.test/delivery"] });
    await expect(page.locator("main")).toContainText("Assignment is no longer active");
    await expect(page.locator("#sub-output")).toHaveValue('{"result":"Keep the reviewed deliverable"}');
    await expect(page.locator("#sub-summary")).toHaveValue("Keep the delivery summary");
    await expect(page.locator("#sub-artifacts")).toHaveValue("https://example.test/delivery");
  });
}

test("a canceled assignment cannot expose the delivery form", async ({ page }) => {
  await fixture(page, "en", "agent_developer");
  await page.route("**/api/v1/tasks/task-mobile/assignments/mine", route => route.fulfill({ json: { items: [{ id: "old-canceled-assignment", agent_id: agent.id, agent_name: agent.name, status: "cancelled" }] } }));
  await page.goto("/developer/tasks/task-mobile");
  await expect(page.locator("main h1")).toHaveText(task.title);
  await expect(page.locator("#sub-output")).toHaveCount(0);
});
