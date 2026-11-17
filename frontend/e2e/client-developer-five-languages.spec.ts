import { expect, test, type Page } from "@playwright/test";
import fr from "../src/i18n/fr";
import zh from "../src/i18n/zh";
import pt from "../src/i18n/pt";
import { displayCopy } from "../src/lib/display-copy";
import { formatDeliveryRequirement } from "../src/lib/utils";
import { localizeApiError } from "../src/lib/api-error-copy";

const dictionaries = { fr, zh, pt };
const date = "2026-09-24T12:00:00Z";
const fundingError = "Stripe reports a refund or dispute. Work and transfers are blocked.";
const job = { id: "job-test", title: "Original client title", raw_description: "Original client instructions", billing_mode: "stripe", status: "in_progress", budget_min: 10, budget_max: 50, currency: "EUR", auto_select_enabled: false, created_at: date, updated_at: date };
const task = { id: "task-test", title: "Original task title", description: "Original task instructions", job_title: job.title, job_id: job.id, status: "open_for_bids", task_type: "writing", budget: 25, currency: "EUR", priority: "medium", deadline: null, bids_count: 0, created_at: date };
const agent = { id: "agent-test", name: "Original agent name", description: "Original agent description", kind: "agent", status: "active", auth_type: "none", endpoint_url: "https://example.test/worker", supported_task_types: ["writing"], capabilities: [], success_rate: 0.94, avg_score: 70, completed_tasks: 4, total_assignments: 4, assignment_history: [], earnings: { currency: "EUR", total: 0, pending: 0, paid: 0 }, feedback: [], created_at: date, updated_at: date };
const requirements = ["Host or cluster endpoint", "Deploy credentials (SSH key or console login)", "Target environment name", "Original client requirement"];

async function fixture(page: Page, locale: keyof typeof dictionaries) {
  let role = "client";
  const writes: string[] = [];
  await page.addInitScript(language => { localStorage.setItem("auth_token", "fixture-token"); localStorage.setItem("taskmatch_locale", language); }, locale);
  await page.route("**/api/v1/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/v1", "");
    if (request.method() !== "GET") {
      writes.push(request.method() + " " + path);
      return route.fulfill({ status: 409, json: { detail: "Funding is frozen" } });
    }
    const responses: Record<string, unknown> = {
      "/auth/me": { id: "user-test", full_name: "Original user name", email: "user@example.test", role, is_active: true },
      "/jobs/job-test": job,
      "/jobs/job-test/plan": { ready: true, planning: false, job, spec: { objective: job.raw_description, deliverables: [], constraints: [], success_criteria: [] }, tasks: [{ ...task, matched_agents: [
        { agent_id: agent.id, agent_name: agent.name, agent_slug: "original-agent", total_score: 88, breakdown: { capability_match: 95, success_rate: 94, average_score: 70, completed_tasks_count: 52 }, reasoning: "Score 88.0/100: capability=95, success_rate=94, avg_score=70, experience=52" },
        { agent_id: "custom-agent", agent_name: "Original custom agent", total_score: 77, breakdown: { capability_match: 95, success_rate: 94, average_score: 70, completed_tasks_count: 52 }, reasoning: "Original user-authored evaluation" },
        { agent_id: "unknown-agent", agent_name: "Original unknown agent", total_score: 60, breakdown: { capability_match: 95, success_rate: 94, average_score: null, completed_tasks_count: 52 }, reasoning: "Score 60.0/100: capability=95, success_rate=94, avg_score=70, experience=52" },
      ] }], stages: [], payment: null },
      "/jobs/job-test/delivery": { id: "delivery-test", mode: "installation", status: "pending", target: null, requirements: { needs_access: true, items: requirements }, runbook: null, notes: null, needs_access_exchange: true, signed_off_at: null, vault_available: false, access_grants: [] },
      "/billing/config": { enabled: true, mode: "test", currencies: ["EUR"], connect_enabled: true },
      "/billing/jobs/job-test": { billing_mode: "stripe", status: "refund_pending", amount_minor: 2500, currency: "EUR", refunded_minor: 0, receipt_url: null, checkout_url: null, can_checkout: false, can_cancel: false, error: fundingError, payouts: [{ id: "payout-test", provider: "stripe_connect", status: "blocked", amount_minor: 2200, currency: "EUR", recipient_name: "Original recipient", error: fundingError }] },
      "/agents/agent-test": agent,
      "/developer/agents": { items: [agent] },
      "/tasks/open": { items: [task], task_types: [task.task_type] },
    };
    if (!(path in responses)) return route.fulfill({ status: 404, json: { detail: "Not available in this fixture" } });
    return route.fulfill({ json: responses[path] });
  });
  return { writes, setRole: (value: string) => { role = value; } };
}

for (const locale of Object.keys(dictionaries) as Array<keyof typeof dictionaries>) {
  test(`client and developer platform labels use ${locale} without changing frozen state`, async ({ page }) => {
    const copy = dictionaries[locale];
    const state = await fixture(page, locale);
    await page.goto("/client/jobs/job-test");
    await expect(page.getByRole("heading", { name: job.title, exact: true })).toBeVisible();
    await expect(page.getByText(job.raw_description, { exact: true }).first()).toBeVisible();
    for (const item of requirements.slice(0, 3)) {
      await expect(page.getByText("• " + formatDeliveryRequirement(item, locale), { exact: true })).toBeVisible();
      await expect(page.getByText("• " + item, { exact: true })).toHaveCount(0);
    }
    await expect(page.getByText("• Original client requirement", { exact: true })).toBeVisible();
    const reason = copy.client.plan.reason.replace(/\{(\w+)\}/g, (_, key: string) => String(({ capability: 95, rate: 94, score: 70, count: 52 } as Record<string, number>)[key]));
    await expect(page.getByText(reason, { exact: true })).toBeVisible();
    await expect(page.getByText(copy.client.plan.reasonFallback, { exact: true })).toBeVisible();
    await expect(page.getByText("Original user-authored evaluation", { exact: true })).toBeVisible();
    await expect(page.getByText(/capability=95|NaN|5200/)).toHaveCount(0);
    await expect(page.getByTestId("funding-status")).toHaveText(copy.billing.status.refund_pending);
    await expect(page.getByRole("alert").filter({ hasText: localizeApiError(fundingError, locale) })).toBeVisible();
    await page.getByRole("button", { name: copy.billing.refresh, exact: true }).click();
    await expect(page.getByTestId("funding-status")).toHaveText(copy.billing.status.refund_pending);
    await expect(page.getByTestId("billing-error")).toBeVisible();
    await expect(page.getByRole("button", { name: copy.billing.pay, exact: true })).toHaveCount(0);
    if (locale === "fr") {
      await page.locator("select").filter({ has: page.locator('option[value="pt"]') }).selectOption("en");
      await expect(page.getByRole("alert").filter({ hasText: "payment service reports a refund or dispute" })).toBeVisible();
      await expect(page.getByRole("main").getByText(/stripe/i)).toHaveCount(0);
    }
    await page.goto("/client/jobs/new");
    await page.getByPlaceholder(copy.client.new.requirementPlaceholder).fill("Original requirement description");
    await page.getByRole("button", { name: copy.client.new.addRequirement, exact: true }).click();
    const requirementRow = page.locator("div.rounded-lg.border.p-3").filter({ hasText: "Original requirement description" });
    await expect(requirementRow).toContainText(copy.client.new.reqType.skill);
    await expect(requirementRow).toContainText(copy.client.new.priority.medium);
    state.setRole("agent_developer");
    await page.goto("/developer/agents");
    await expect(page.getByText(agent.name, { exact: true })).toBeVisible();
    await expect(page.getByRole("main").getByText(displayCopy[locale].active, { exact: true })).toBeVisible();
    await page.goto("/developer/agents/agent-test");
    await expect(page.getByRole("heading", { name: agent.name, exact: true })).toBeVisible();
    await expect(page.getByRole("main").getByText(displayCopy[locale].none, { exact: true })).toBeVisible();
    await page.goto("/developer/tasks");
    await expect(page.getByText(task.title, { exact: true })).toBeVisible();
    await expect(page.getByRole("table").getByText(displayCopy[locale].writing, { exact: true })).toBeVisible();
    expect(state.writes).toEqual(["POST /billing/jobs/job-test/sync"]);
  });
}
