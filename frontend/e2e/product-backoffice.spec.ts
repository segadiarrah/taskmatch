import { expect, test, type Page } from "@playwright/test";
import { humanCopy } from "../src/lib/human-copy";

const locales = ["en", "fr", "zh", "es", "pt"] as const;
type Locale = typeof locales[number];
type Role = "client" | "agent_developer" | "admin";
const titles = {
  en: ["Post an AI project", "Request human help", "Offer an AI agent", "Authorize human delegation", "Find human work", "Human Tasks"],
  fr: ["Publier un projet IA", "Demander une aide humaine", "Proposer un agent IA", "Autoriser la délégation humaine", "Trouver des missions humaines", "Missions humaines"],
  zh: ["发布 AI 项目", "寻求人工协助", "提供 AI 代理", "授权人工委派", "寻找人工任务", "人工任务"],
  es: ["Publicar un proyecto de IA", "Solicitar ayuda humana", "Ofrecer un agente de IA", "Autorizar la delegación humana", "Encontrar trabajo humano", "Tareas humanas"],
  pt: ["Publicar um projeto de IA", "Pedir ajuda humana", "Oferecer um agente de IA", "Autorizar a delegação humana", "Encontrar trabalho humano", "Tarefas humanas"],
};
const counts = { human_missions: 7, pending_publication: 2, active_human_missions: 3, worker_profiles: 5, pending_worker_verification: 1 };

async function fixture(page: Page, locale: Locale, role: Role) {
  const requests: string[] = [];
  await page.addInitScript(language => {
    localStorage.setItem("auth_token", "product-fixture");
    localStorage.setItem("taskmatch_locale", language);
  }, locale);
  await page.route("**/api/v1/**", route => {
    const path = new URL(route.request().url()).pathname.replace("/api/v1", "");
    requests.push(`${route.request().method()} ${path}`);
    const responses: Record<string, unknown> = {
      "/auth/me": { id: "product-user", full_name: "Product User", email: "product@example.test", role, is_active: true },
      "/client/dashboard/stats": { my_jobs: 4, active_tasks: 2, pending_reviews: 1, total_spent: 19 },
      "/jobs": { jobs: [], total: 0 },
      "/developer/dashboard/stats": { my_agents: 4, active_assignments: 2, completed_tasks: 8, total_earnings: null, earnings_by_currency: [] },
      "/developer/assignments": { items: [] },
      "/dashboard/overview": { total_jobs: 4, total_tasks: 2, active_agents: 3, pending_validations: 1, failed_tasks: 0, total_payments_pending: 0, total_payments_completed: 0, jobs_by_status: {}, tasks_by_status: {}, recent_activity: [] },
      "/worker-portal/admin/overview": counts,
      "/human-tasks/taxonomy": { categories: [] },
      "/workers/me": null,
      "/worker-portal/missions": { items: [], total: 0 },
      "/worker-portal/workers": { items: [], total: 0 },
      "/worker-portal/opportunities": { items: [], total: 0 },
      "/principals": [],
      "/delegation-mandates": [],
    };
    if (route.request().method() !== "GET" || !(path in responses))
      return route.fulfill({ status: 404, json: { detail: `Unexpected fixture request ${path}` } });
    return route.fulfill({ json: responses[path] });
  });
  return requests;
}

for (const locale of locales) {
  test(`client sees AI and human actions in ${locale} and each opens its workflow`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const requests = await fixture(page, locale, "client");
    await page.goto("/client");
    const actions = page.getByTestId("dashboard-actions");
    await expect(actions.getByRole("heading", { name: titles[locale][0], exact: true })).toBeVisible();
    await expect(actions.getByRole("heading", { name: titles[locale][1], exact: true })).toBeVisible();
    await expect(actions.locator('a[href="/client/jobs/new"]')).toBeVisible();
    await expect(page.getByTestId("client-original-metrics")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await actions.locator('a[href="/client/jobs/new"]').click();
    await expect(page).toHaveURL(/\/client\/jobs\/new$/);
    await expect(page.locator("main form")).toBeVisible();
    await page.goto("/client");
    await page.getByTestId("dashboard-actions").locator('a[href="/human-tasks?view=request"]').click();
    await expect(page).toHaveURL(/\/human-tasks\?view=request$/);
    await expect(page.getByRole("button", { name: humanCopy[locale].request, exact: true })).toHaveAttribute("aria-current", "page");
    expect(requests.some(path => path.endsWith("/worker-portal/admin/overview"))).toBe(false);
    expect(requests.every(path => path.startsWith("GET "))).toBe(true);
  });

  test(`developer retains AI work and discovers delegation and personal missions in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const requests = await fixture(page, locale, "agent_developer");
    await page.goto("/developer");
    const actions = page.getByTestId("dashboard-actions");
    for (const title of titles[locale].slice(2, 5))
      await expect(actions.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(actions.locator('a[href="/developer/agents/new"]')).toBeVisible();
    await expect(actions.locator('a[href="/developer/tasks"]')).toBeVisible();
    await expect(page.getByTestId("developer-original-metrics")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await actions.locator('a[href="/human-tasks?view=agents"]').click();
    await expect(page).toHaveURL(/\/human-tasks\?view=agents$/);
    await expect(page.getByRole("button", { name: humanCopy[locale].agents, exact: true })).toHaveAttribute("aria-current", "page");
    await page.goto("/developer");
    await page.getByTestId("dashboard-actions").locator('a[href="/human-tasks?view=work"]').click();
    await expect(page).toHaveURL(/\/human-tasks\?view=work$/);
    await expect(page.getByRole("button", { name: humanCopy[locale].work, exact: true })).toHaveAttribute("aria-current", "page");
    expect(requests.some(path => path.endsWith("/worker-portal/admin/overview"))).toBe(false);
    expect(requests.every(path => path.startsWith("GET "))).toBe(true);
  });

  test(`admin sees actual human counts and review routes beside AI operations in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const requests = await fixture(page, locale, "admin");
    await page.goto("/admin");
    const panel = page.getByTestId("human-operations");
    await expect(panel.getByRole("heading", { name: titles[locale][5], exact: true })).toBeVisible();
    for (const [key, count] of Object.entries(counts))
      await expect(panel.getByTestId(key)).toHaveText(String(count));
    await expect(page.getByTestId("admin-original-metrics")).toBeVisible();
    await expect(page.getByTestId("ai-operations").locator('a[href="/admin/jobs"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await panel.getByTestId("review-human-missions").click();
    await expect(page).toHaveURL(/\/human-tasks\?view=review$/);
    await expect(page.getByRole("heading", { name: humanCopy[locale].reviewMissions, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: humanCopy[locale].reviewWorkers, exact: true })).toBeVisible();
    expect(requests).toContain("GET /worker-portal/admin/overview");
    expect(requests.every(path => path.startsWith("GET "))).toBe(true);
  });
}

test("human overview keeps loading, zero and failed reads distinct and retries in place", async ({ page }) => {
  await fixture(page, "en", "admin");
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  let attempts = 0;
  let available = false;
  await page.route("**/api/v1/worker-portal/admin/overview", async route => {
    attempts += 1;
    await pending;
    if (!available) return route.fulfill({ status: 503, json: { detail: "Unavailable" } });
    return route.fulfill({ json: Object.fromEntries(Object.keys(counts).map(key => [key, 0])) });
  });
  await page.goto("/admin");
  const panel = page.getByTestId("human-operations");
  await expect(panel.getByRole("status")).toContainText("Loading human activity");
  await expect(panel.getByTestId("human_missions")).toHaveCount(0);
  await expect(page.getByTestId("admin-original-metrics")).toBeVisible();
  release();
  await expect(panel.getByRole("alert")).toContainText("Human activity could not be loaded");
  await expect(panel.getByTestId("human_missions")).toHaveCount(0);
  const beforeRetry = attempts;
  available = true;
  await panel.getByRole("button", { name: "Retry", exact: true }).click();
  for (const key of Object.keys(counts)) await expect(panel.getByTestId(key)).toHaveText("0");
  await expect(panel.getByText("No human missions yet.", { exact: true })).toBeVisible();
  await expect(panel.getByRole("alert")).toHaveCount(0);
  expect(attempts).toBe(beforeRetry + 1);
});

test("an incomplete human overview response shows an error instead of invented zero counts", async ({ page }) => {
  await fixture(page, "pt", "admin");
  await page.route("**/api/v1/worker-portal/admin/overview", route => route.fulfill({ json: { human_missions: 7 } }));
  await page.goto("/admin");
  const panel = page.getByTestId("human-operations");
  await expect(panel.getByRole("alert")).toContainText("Não foi possível carregar a atividade humana");
  await expect(panel.getByRole("button", { name: "Tentar novamente", exact: true })).toBeVisible();
  for (const key of Object.keys(counts)) await expect(panel.getByTestId(key)).toHaveCount(0);
});

for (const role of ["client", "agent_developer", "admin"] as const) {
  test(`${role} actions remain usable when the original dashboard metrics fail`, async ({ page }) => {
    await fixture(page, "en", role);
    const endpoint = role === "admin" ? "dashboard/overview" : `${role === "client" ? "client" : "developer"}/dashboard/stats`;
    await page.route(`**/api/v1/${endpoint}`, route => route.fulfill({ status: 503, json: { detail: "Metrics unavailable" } }));
    await page.goto(role === "agent_developer" ? "/developer" : `/${role}`);
    await expect(page.getByTestId("dashboard-actions")).toBeVisible();
    await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
    if (role === "admin") await expect(page.getByTestId("human-operations").getByTestId("human_missions")).toHaveText("7");
    else await expect(page.getByTestId("dashboard-actions").locator(`a[href="/human-tasks?view=${role === "client" ? "request" : "agents"}"]`)).toBeVisible();
  });
}

test("sidebar names Human Tasks explicitly and opens role-specific direct destinations", async ({ page }) => {
  await fixture(page, "en", "agent_developer");
  await page.goto("/developer");
  const nav = page.locator("aside nav");
  await expect(nav.getByText("Human Tasks", { exact: true })).toBeVisible();
  await expect(nav.locator('a[href="/developer/agents"]')).toBeVisible();
  await expect(nav.locator('a[href="/developer/tasks"]')).toBeVisible();
  await nav.locator('a[href="/human-tasks?view=agents"]').click();
  await expect(page).toHaveURL(/\/human-tasks\?view=agents$/);
  await expect(nav.locator('a[aria-current="page"]')).toHaveAttribute("href", "/human-tasks?view=agents");
  await expect(nav.locator('a[href="/human-tasks?view=work"]')).toBeVisible();
});
