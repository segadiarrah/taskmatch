import { expect, test, type APIRequestContext, type BrowserContext, type Locator, type Page, type Response } from "@playwright/test";

// Mutations are restricted to the separately provisioned, disposable paid API.
// App requests reach the real API/PostgreSQL. Only the payment provider boundary
// is simulated; no Stripe account, card, bank or production service is contacted.
const paidAPI = process.env.TASKMATCH_E2E_PAID_API;
const browserURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3120";
const password = "Browser-test-password-2026";
test.skip(!paidAPI, "TASKMATCH_E2E_PAID_API must point at the isolated paid browser-test API");

function apiURL() {
  if (!paidAPI) throw new Error("The isolated paid API is required");
  const url = new URL(paidAPI);
  if (url.origin !== "http://127.0.0.1:3172" || url.username || url.password || url.pathname !== "/" || url.search || url.hash)
    throw new Error("Use only the disposable paid API at 127.0.0.1:3172");
  if (new URL(browserURL).origin !== "http://127.0.0.1:3170")
    throw new Error("Use only the disposable browser application at 127.0.0.1:3170");
  return url.origin;
}

test.beforeAll(async ({ request }) => {
  if (!paidAPI) return;
  const response = await request.get(`${apiURL()}/__journey_fixture/state`, {
    headers: { "X-Journey-Fixture": "local-only" },
  });
  expect(response.status(), "A guarded payment fixture must exist before any signup").toBe(200);
  const state = await response.json();
  expect(Array.isArray(state.sessions) && Array.isArray(state.accounts)).toBe(true);
});

async function realAPI(context: BrowserContext) {
  const api = apiURL();
  context.setDefaultTimeout(15_000);
  context.setDefaultNavigationTimeout(30_000);
  await context.addInitScript(() => localStorage.setItem("taskmatch_locale", "en"));
  await context.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: `${api}${url.pathname}${url.search}` });
    await route.fulfill({ response });
  });
  for (const host of ["checkout.stripe.com", "connect.stripe.com"]) {
    await context.route(`https://${host}/**`, (route) => route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><html lang='en'><title>Simulated payment provider</title><h1>Simulated payment provider</h1><p>Local isolated journey fixture. No real payment or bank details.</p></html>",
    }));
  }
}

async function close(context: BrowserContext) {
  await context.unrouteAll({ behavior: "ignoreErrors" });
  await context.close();
}

async function token(page: Page) {
  const value = await page.evaluate(() => localStorage.getItem("auth_token"));
  if (!value) throw new Error("Expected the browser to be signed in");
  return { Authorization: `Bearer ${value}` };
}

async function call(request: APIRequestContext, method: string, path: string, headers: Record<string, string>, data?: unknown, status = 200) {
  const response = await request.fetch(`${apiURL()}/api/v1${path}`, { method, headers, data });
  expect(response.status(), `${method} ${path} status (body omitted to protect authentication data)`).toBe(status);
  return response.json();
}

async function fixture(request: APIRequestContext, path: string) {
  const response = await request.post(`${apiURL()}/__journey_fixture${path}`, { headers: { "X-Journey-Fixture": "local-only" } });
  expect(response.status(), `Local provider fixture ${path}`).toBe(200);
}

async function mutation(page: Page, method: string, path: string, action: () => Promise<unknown>, status = 200) {
  const pending = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/v1${path}` && response.request().method() === method);
  await action();
  const response = await pending;
  expect(response.status(), `Browser ${method} ${path} status (body omitted)`).toBe(status);
  return response;
}

async function signup(page: Page, intent: "mission" | "work" | "agent", name: string, email: string) {
  await page.goto(`/register?intent=${intent}`);
  await page.locator("#full_name").fill(name);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/human-tasks\\?view=${{ mission: "request", work: "work", agent: "agents" }[intent]}$`));
  await expect(page.getByRole("heading", { name: "Your workspace", exact: true })).toBeVisible();
}

async function adminPage(context: BrowserContext, request: APIRequestContext) {
  const response = await request.post(`${apiURL()}/api/v1/auth/login`, { form: { username: "browser-admin@taskmatch.ai", password } });
  expect(response.status(), "Isolated administrator login").toBe(200);
  const { access_token } = await response.json();
  await context.addInitScript((value: string) => localStorage.setItem("auth_token", value), access_token);
  const page = await context.newPage();
  await page.goto("/human-tasks?view=review");
  return page;
}

async function openMission(page: Page, title: string, view: "request" | "work" | "review") {
  await page.goto(`/human-tasks?view=${view}`);
  await page.getByRole("button", { name: new RegExp(title), exact: false }).click();
  const mission = page.getByRole("region", { name: title, exact: true });
  await expect(mission).toBeVisible();
  return mission;
}

async function review(page: Page, mission: Locator, decision: "Request changes" | "Approve delivery", notes: string) {
  const form = mission.locator("form").filter({ has: page.getByRole("button", { name: decision, exact: true }) });
  await form.getByLabel("Explain any changes required").fill(notes);
  const pending = page.waitForResponse((response: Response) => /\/api\/v1\/submissions\/[^/]+\/reviews$/.test(new URL(response.url()).pathname) && response.request().method() === "POST");
  await form.getByRole("button", { name: decision, exact: true }).click();
  expect((await pending).status(), `Browser delivery review: ${decision}`).toBe(201);
}

test("real paid human journey: signup, independent checks, checkout, claim, private evidence, rework, acceptance and earnings", async ({ browser, request }) => {
  test.setTimeout(180_000);
  apiURL();
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const title = `Browser human translation ${suffix}`;
  const workerName = `Browser human worker ${suffix}`;
  const contexts = await Promise.all([browser.newContext({ baseURL: browserURL }), browser.newContext({ baseURL: browserURL }), browser.newContext({ baseURL: browserURL })]);
  try {
    await Promise.all(contexts.map(realAPI));
    const requester = await contexts[0].newPage();
    const worker = await contexts[1].newPage();
    await signup(requester, "mission", `Browser requester ${suffix}`, `journey-requester-${suffix}@example.com`);
    await signup(worker, "work", workerName, `journey-worker-${suffix}@example.com`);
    console.info("human journey: requester and worker registrations succeeded");
    const requesterHeaders = await token(requester);
    const workerHeaders = await token(worker);
    expect((await call(request, "GET", "/auth/me", workerHeaders)).role).toBe("client");

    const profile = worker.locator("section").filter({ has: worker.getByRole("heading", { name: "Worker profile", exact: true }) });
    await profile.getByRole("combobox", { name: "Country", exact: true }).selectOption("FR");
    await profile.getByLabel("Time zone", { exact: true }).fill("Europe/Paris");
    await profile.getByRole("checkbox", { name: "English", exact: true }).check();
    await profile.getByRole("checkbox", { name: "Translation review", exact: true }).check();
    await profile.getByLabel("Desired hourly rate (EUR)", { exact: true }).fill("20");
    await profile.getByRole("checkbox", { name: "I consent to using my profile to match me with missions.", exact: true }).check();
    const saved = await mutation(worker, "PUT", "/workers/me", () => profile.getByRole("button", { name: "Save profile", exact: true }).click());
    const workerProfile = await saved.json();
    expect(workerProfile.verification_status).toBe("pending");
    expect(workerProfile.payment_eligible).toBe(false);

    const admin = await adminPage(contexts[2], request);
    const workersPanel = admin.locator("section").filter({ has: admin.getByRole("heading", { name: "Worker profiles", exact: true }) });
    await expect.poll(() => workersPanel.locator("form").count()).toBeGreaterThan(0);
    const workerReview = admin.locator("form").filter({ has: admin.getByRole("heading", { name: workerName, exact: true }) });
    for (let pageNumber = 0; await workerReview.count() === 0 && pageNumber < 20; pageNumber++) {
      const nextPage = admin.waitForResponse((response) => new URL(response.url()).pathname === "/api/v1/worker-portal/workers");
      await workersPanel.getByRole("button", { name: "Next page", exact: true }).click();
      const workers = await (await nextPage).json();
      await expect(workersPanel.getByRole("heading", { name: workers.items[0].full_name, exact: true })).toBeVisible();
    }
    await workerReview.getByRole("checkbox", { name: "Translation review", exact: true }).check();
    await workerReview.getByLabel("Verification notes", { exact: true }).fill("Identity and translation capability independently checked in the isolated test.");
    await mutation(admin, "POST", `/workers/${workerProfile.user_id}/verify`, () => workerReview.getByRole("button", { name: "Verify worker", exact: true }).click());
    console.info("human journey: worker profile saved and independently verified");

    await worker.getByText("Verification and payments", { exact: true }).click();
    await mutation(worker, "POST", "/billing/connect/onboarding", () => profile.getByRole("button", { name: "Set up payments", exact: true }).click());
    await expect(worker).toHaveURL(/^https:\/\/connect\.stripe\.com\//);
    await expect(worker.getByRole("heading", { name: "Simulated payment provider" })).toBeVisible();
    const account = await call(request, "GET", "/billing/connect", workerHeaders);
    expect(account.mode).toBe("test");
    await fixture(request, `/accounts/${account.account_id}/complete`);
    await worker.goto("/human-tasks?view=work");
    await worker.getByText("Verification and payments", { exact: true }).click();
    await mutation(worker, "POST", "/billing/connect/sync", () => worker.getByRole("button", { name: "Refresh payment status", exact: true }).click());
    await expect(worker.getByText("Eligible to accept paid work", { exact: true })).toBeVisible();
    expect((await call(request, "GET", "/auth/me", workerHeaders)).role).toBe("client");
    console.info("human journey: simulated provider onboarding and real account sync succeeded");

    const brief = requester.locator("form").filter({ has: requester.getByLabel("Mission title", { exact: true }) });
    await brief.getByLabel("Mission title", { exact: true }).fill(title);
    await brief.getByLabel("What needs to be done?", { exact: true }).fill("Review a short English translation and explain corrections.");
    await brief.getByRole("combobox", { name: "Mission category", exact: true }).selectOption("translation_review");
    await brief.getByRole("button", { name: "Continue", exact: true }).click();
    await brief.getByLabel("Instructions", { exact: true }).fill("Read the supplied synthetic source and translation. Return a corrected translation with reasons.");
    await brief.getByRole("checkbox", { name: "Permission to use the supplied data", exact: true }).check();
    await brief.getByRole("button", { name: "Continue", exact: true }).click();
    await brief.getByRole("combobox", { name: "Language", exact: true }).selectOption("en");
    await brief.getByLabel("Total spending limit (EUR, including fees)", { exact: true }).fill("11");
    await brief.getByLabel("Deadline", { exact: true }).fill(new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16));
    const created = await mutation(requester, "POST", "/human-tasks", () => brief.getByRole("button", { name: "Submit for review", exact: true }).click(), 201);
    const task = await created.json();
    expect(task.policy_status).toBe("pending");
    await call(request, "POST", `/human-tasks/${task.task_id}/claim`, workerHeaders, undefined, 409);

    const publication = await openMission(admin, title, "review");
    await publication.getByLabel("Review notes", { exact: true }).fill("Permissions, scope and required qualifications independently verified.");
    await publication.getByRole("checkbox", { name: "I verified permissions, safety and required qualifications.", exact: true }).check();
    await mutation(admin, "POST", `/human-tasks/${task.task_id}/publish`, () => publication.getByRole("button", { name: "Approve publication", exact: true }).click());
    const quote = await call(request, "GET", `/jobs/${task.parent_job_id}/quote`, requesterHeaders);
    expect(quote.quote.currency).toBe("EUR");
    expect(Number(quote.quote.total)).toBe(11);
    console.info("human journey: mission independently published and quoted");
    const requesterMission = await openMission(requester, title, "request");
    await mutation(requester, "POST", `/billing/jobs/${task.parent_job_id}/checkout`, () => requesterMission.getByRole("button", { name: "Pay this quote", exact: true }).click());
    await expect(requester).toHaveURL(/^https:\/\/checkout\.stripe\.com\//);
    const funding = await call(request, "GET", `/billing/jobs/${task.parent_job_id}`, requesterHeaders);
    expect(funding.status).toBe("checkout_pending");
    await call(request, "POST", `/human-tasks/${task.task_id}/claim`, workerHeaders, undefined, 402);
    // This provider fixture deliberately includes its server-created session in
    // the hosted URL. Reading it here avoids a response-body/navigation race.
    const sessionId = new URL(requester.url()).pathname.split("/").pop();
    expect(sessionId, "The simulated provider URL identifies its checkout session").toMatch(/^cs_/);
    await fixture(request, `/checkout/${sessionId}/complete`);
    // Follow the hosted checkout return through the actual BillingPanel sync.
    await requester.goto(`/client/jobs/${task.parent_job_id}?checkout=success`);
    await expect(requester.getByTestId("funding-status")).toHaveText("Payment confirmed", { timeout: 20_000 });
    expect((await call(request, "GET", `/billing/jobs/${task.parent_job_id}`, requesterHeaders)).billing_mode).toBe("stripe");
    console.info("human journey: simulated checkout confirmed through real return sync");

    await worker.goto("/human-tasks?view=work");
    const opportunity = worker.locator("article").filter({ has: worker.getByRole("heading", { name: title, exact: true }) });
    await mutation(worker, "POST", `/human-tasks/${task.task_id}/claim`, () => opportunity.getByRole("button", { name: "Accept mission", exact: true }).click());
    let workerMission = worker.getByRole("region", { name: title, exact: true });
    await expect(workerMission.getByRole("button", { name: "Send delivery", exact: true })).toBeVisible();
    await workerMission.getByLabel("Delivery summary", { exact: true }).fill("Initial translation review");
    await workerMission.getByLabel("Report", { exact: true }).fill("Initial corrected translation with a synthetic note.");
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGMUSbFhwAaYsIoOWgkAkhgAxOh0LCgAAAAASUVORK5CYII=", "base64");
    await mutation(worker, "POST", `/human-tasks/${task.task_id}/evidence`, () => workerMission.getByLabel("Add a photo", { exact: true }).setInputFiles({ name: "translation-evidence.png", mimeType: "image/png", buffer: png }), 201);
    await expect(workerMission.getByText("Photo added. You can add a note above.", { exact: true })).toBeVisible();
    const submissionResponse = await mutation(worker, "POST", `/human-tasks/${task.task_id}/result`, () => workerMission.getByRole("button", { name: "Send delivery", exact: true }).click(), 201);
    const submission = await submissionResponse.json();
    await call(request, "POST", `/submissions/${submission.id}/reviews`, workerHeaders, { submission_id: submission.id, decision: "approved" }, 403);
    console.info("human journey: mission claimed and private photo evidence submitted");
    let requesterReview = await openMission(requester, title, "request");
    const download = requester.waitForEvent("download");
    await requesterReview.getByRole("button", { name: "Download private photo", exact: true }).click();
    expect((await download).suggestedFilename()).toMatch(/^evidence-.*\.png$/);
    await review(requester, requesterReview, "Request changes", "Please explain why the second sentence was corrected.");
    expect((await call(request, "GET", `/human-tasks/${task.task_id}`, workerHeaders)).status).toBe("validation_failed");
    expect((await call(request, "GET", `/human-tasks/${task.task_id}/result`, requesterHeaders)).ready).toBe(false);
    workerMission = await openMission(worker, title, "work");
    await expect(workerMission.getByRole("button", { name: "Send delivery", exact: true })).toBeVisible();
    await workerMission.getByLabel("Delivery summary", { exact: true }).fill("Revised translation review with explanations");
    await workerMission.getByLabel("Report", { exact: true }).fill("Corrected translation. The second sentence now agrees in tense and includes the requested explanation.");
    await mutation(worker, "POST", `/human-tasks/${task.task_id}/result`, () => workerMission.getByRole("button", { name: "Send delivery", exact: true }).click(), 201);
    requesterReview = await openMission(requester, title, "request");
    await review(requester, requesterReview, "Approve delivery", "The revised translation and explanations satisfy the brief.");
    console.info("human journey: requested changes, resubmission and approval succeeded");
    await expect(requesterReview.getByRole("button", { name: "Accept completed work", exact: true })).toBeVisible();
    const result = await call(request, "GET", `/human-tasks/${task.task_id}/result`, requesterHeaders);
    expect(result.ready).toBe(true);
    expect(result.result.summary).toBe("Revised translation review with explanations");
    await mutation(requester, "POST", `/jobs/${task.parent_job_id}/accept`, () => requesterReview.getByRole("button", { name: "Accept completed work", exact: true }).click());
    expect((await call(request, "GET", `/jobs/${task.parent_job_id}`, requesterHeaders)).status).toBe("completed");
    await worker.goto("/human-tasks?view=earnings");
    const earning = worker.locator("article").filter({ has: worker.getByRole("heading", { name: title, exact: true }) });
    await expect(earning).toBeVisible();
    const earnings = await call(request, "GET", "/worker-portal/earnings", workerHeaders);
    const entry = earnings.items.find((item: { task_title: string }) => item.task_title === title);
    expect(Boolean(entry), "The accepted human mission has a real earnings entry").toBe(true);
    expect(entry.net_amount_minor).toBe(1000);
    expect(entry.currency).toBe("EUR");
    expect(["releasable", "paid", "processing"]).toContain(entry.status);
    await expect.poll(async () => {
      const next = await call(request, "GET", "/worker-portal/earnings", workerHeaders);
      return next.items.find((item: { id: string }) => item.id === entry.id)?.status;
    }, { timeout: 20_000, message: "The real billing worker records the simulated provider transfer" }).toBe("paid");
    await worker.reload();
    await expect(earning).toContainText("Paid");
    console.info("human journey: requester acceptance, EUR10 earnings and simulated provider transfer succeeded");
  } finally {
    await Promise.all(contexts.map(close));
  }
});

test("real agent mandate UI enforces scoped access, category, spending cap, idempotency and revocation", async ({ browser, request }) => {
  test.setTimeout(90_000);
  apiURL();
  const context = await browser.newContext({ baseURL: browserURL });
  try {
    await realAPI(context);
    const page = await context.newPage();
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const agentName = `Browser assistant ${suffix}`;
    await signup(page, "agent", `Browser mandate owner ${suffix}`, `journey-mandate-${suffix}@example.com`);
    console.info("mandate journey: registration succeeded");
    const ownerHeaders = await token(page);
    const agentForm = page.locator("form").filter({ has: page.getByRole("heading", { name: "Connect agent", exact: true }) });
    await agentForm.getByLabel("Agent name", { exact: true }).fill(agentName);
    await agentForm.getByLabel("Agent endpoint (HTTPS)", { exact: true }).fill("https://example.test/journey-agent");
    const connected = await mutation(page, "POST", "/worker-portal/agents", () => agentForm.getByRole("button", { name: "Connect agent", exact: true }).click(), 201);
    const agent = await connected.json();
    const mandate = page.locator("form").filter({ has: page.getByRole("heading", { name: "Create a mandate", exact: true }) });
    await mandate.getByRole("combobox", { name: "Agent name", exact: true }).selectOption(agent.id);
    await mandate.getByLabel("Total mandate limit (EUR)", { exact: true }).fill("11");
    await mandate.getByLabel("Expires on", { exact: true }).fill(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    await mandate.getByRole("checkbox", { name: "Translation review", exact: true }).check();
    const delegationResponse = page.waitForResponse((response) => /\/api\/v1\/principals\/[^/]+\/delegations$/.test(new URL(response.url()).pathname) && response.request().method() === "POST");
    await mandate.getByRole("button", { name: "Create mandate", exact: true }).click();
    const response = await delegationResponse;
    expect(response.status(), "Browser mandate creation").toBe(201);
    const delegation = await response.json();
    const tokenField = page.getByRole("textbox", { name: "Copy this access token now. It is shown only once.", exact: true });
    await expect(tokenField).toBeVisible();
    expect((await tokenField.inputValue()) === delegation.access_token, "The scoped token is shown once to its owner").toBe(true);
    await page.getByRole("button", { name: "I have saved the token", exact: true }).click();
    await expect(tokenField).toHaveCount(0);
    console.info("mandate journey: agent and scoped mandate created in UI");
    const principals = await call(request, "GET", "/principals", ownerHeaders);
    const principalId = principals.find((item: { kind: string }) => item.kind === "individual").id;
    const scoped = { Authorization: `Bearer ${delegation.access_token}` };
    await call(request, "GET", "/auth/me", scoped, undefined, 401);
    await call(request, "GET", "/worker-portal/agents", scoped, undefined, 401);
    const body = {
      schema_version: "tm.human-task.v1", principal_id: principalId,
      requester_type: "AGENT_REQUESTER", requesting_agent_id: agent.id, delegation_id: delegation.id,
      title: `Delegated translation ${suffix}`, objective: "Review a synthetic translation", instructions: "Return the corrected text with a concise explanation.",
      task_category: "translation_review", execution_mode: "remote", required_capabilities: ["translation"], language: "en",
      deadline: new Date(Date.now() + 2 * 86400000).toISOString(), expected_duration: 30,
      budget: { amount_minor: 1100, currency: "EUR" }, evidence_requirements: ["report"], authorizations: ["data_owner_consent"],
    };
    await call(request, "POST", "/human-tasks", { ...scoped, "Idempotency-Key": `wrong-category-${suffix}` }, { ...body, task_category: "user_testing", required_capabilities: ["user_testing"], authorizations: ["participant_consent"] }, 403);
    const key = `delegated-${suffix}`;
    const created = await call(request, "POST", "/human-tasks", { ...scoped, "Idempotency-Key": key }, body, 201);
    const replay = await call(request, "POST", "/human-tasks", { ...scoped, "Idempotency-Key": key }, body, 201);
    expect(replay.task_id).toBe(created.task_id);
    await call(request, "POST", "/human-tasks", { ...scoped, "Idempotency-Key": `over-limit-${suffix}` }, body, 409);
    const rows = await call(request, "GET", "/worker-portal/delegations", ownerHeaders);
    expect(rows.items.find((item: { id: string }) => item.id === delegation.id).reserved_amount_minor).toBe(1100);
    expect(JSON.stringify(rows).includes(delegation.access_token), "Mandate lists do not redisplay scoped tokens").toBe(false);
    expect((await call(request, "GET", "/auth/me", ownerHeaders)).role).toBe("client");
    await page.reload();
    const mandateCard = page.locator("article").filter({ has: page.getByRole("heading", { name: agentName, exact: true }) });
    await expect(mandateCard).toContainText("Reserved");
    await mutation(page, "DELETE", `/principals/${principalId}/delegations/${delegation.id}`, () => mandateCard.getByRole("button", { name: "Revoke mandate", exact: true }).click());
    await expect(mandateCard).toContainText("Revoked");
    await call(request, "GET", `/human-tasks/${created.task_id}`, scoped, undefined, 403);
    await call(request, "POST", "/human-tasks", { ...scoped, "Idempotency-Key": `after-revoke-${suffix}` }, body, 403);
    console.info("mandate journey: scoped denies, cap, replay and revocation succeeded");
  } finally {
    await close(context);
  }
});
