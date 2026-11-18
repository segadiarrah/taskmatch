import { expect, test } from "@playwright/test";
import { COPY } from "../src/lib/landing-copy";

for (const locale of ["en", "fr", "es", "zh", "pt"] as const) {
  test(`marketplace and added human capability are distinct (${locale})`, async ({ page }) => {
    await page.addInitScript(selected => localStorage.setItem("taskmatch_locale", selected), locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const c = COPY[locale];
    await expect(page.getByRole("heading", { level: 1 })).toContainText(c.titleLead);
    for (const [intent, label] of [["project", c.project], ["executor", c.executor], ["work", c.work], ["mission", c.mission], ["agent", c.agent]]) {
      await expect(page.getByRole("main").getByRole("link", { name: label, exact: true }).first()).toHaveAttribute("href", `/register?intent=${intent}`);
    }
    await expect(page.locator("#human-tasks")).toContainText(c.humanDirectBody);
    await expect(page.locator("#human-tasks")).toContainText(c.humanAgentBody);
    await expect(page.getByRole("main")).toContainText(c.steps[1].body);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("main").getByRole("link", { name: c.project, exact: true }).first().click();
    await expect(page).toHaveURL(/\/register\?intent=project$/);
    await expect(page.getByRole("radio", { name: c.project, exact: true })).toBeChecked();
  });
}

for (const role of ["client", "agent_developer", "admin"]) {
  test(`existing ${role} gets compatible public AI destinations`, async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem("auth_token", "existing-account"); localStorage.setItem("taskmatch_locale", "en"); });
    await page.route("**/api/v1/**", route => route.fulfill({ json: { items: [] } }));
    await page.route("**/api/v1/auth/me", route => route.fulfill({ json: { id: "existing", role, full_name: "Existing User", is_active: true } }));
    await page.goto("/");
    await expect(page).toHaveURL("/");
    const dashboard = role === "client" ? "/client" : role === "admin" ? "/admin" : "/developer";
    await expect(page.getByRole("main").getByRole("link", { name: COPY.en.project, exact: true }).first()).toHaveAttribute("href", role === "client" ? "/client/jobs/new" : dashboard);
    await expect(page.getByRole("main").getByRole("link", { name: COPY.en.executor, exact: true }).first()).toHaveAttribute("href", role === "agent_developer" ? "/developer/agents/new" : dashboard);
    await expect(page.locator("header nav").getByRole("link", { name: COPY.en.project, exact: true })).toHaveAttribute("href", role === "client" ? "/client/jobs/new" : dashboard);
    await page.getByRole("main").getByRole("link", { name: COPY.en.project, exact: true }).first().click();
    await expect(page).toHaveURL(role === "client" ? "/client/jobs/new" : dashboard);
    await page.goto("/");
    await page.getByRole("main").getByRole("link", { name: COPY.en.executor, exact: true }).first().click();
    await expect(page).toHaveURL(role === "agent_developer" ? "/developer/agents/new" : dashboard);
  });
}

for (const intent of [null, "project", "executor"] as const) {
  test(`registration for ${intent ?? "default"} creates the proper existing role`, async ({ page }) => {
    const role = intent === "executor" ? "agent_developer" : "client";
    let submitted: unknown;
    await page.addInitScript(() => localStorage.setItem("taskmatch_locale", "en"));
    await page.route("**/api/v1/auth/register", route => { submitted = route.request().postDataJSON(); return route.fulfill({ json: { id: "new-user", role } }); });
    await page.route("**/api/v1/auth/login", route => route.fulfill({ json: { access_token: "new-account" } }));
    await page.route("**/api/v1/auth/me", route => route.fulfill({ json: { id: "new-user", role, full_name: "New User", is_active: true } }));
    await page.goto(`/register${intent ? `?intent=${intent}` : ""}`);
    await expect(page.getByRole("radio", { name: intent === "executor" ? COPY.en.executor : COPY.en.project, exact: true })).toBeChecked();
    await page.locator("#full_name").fill("New User");
    await page.locator("#email").fill("new@example.test");
    await page.locator("#password").fill("test-password");
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page).toHaveURL(intent === "executor" ? "/developer/agents/new" : "/client/jobs/new");
    expect(submitted).toMatchObject({ role });
  });
}

for (const role of ["client", "agent_developer", "admin"]) {
  for (const intent of ["project", "executor"]) {
    test(`signed-in ${role} entering ${intent} auth keeps the existing account`, async ({ page }) => {
      let accountWrites = 0;
      await page.addInitScript(() => { localStorage.setItem("auth_token", "existing-account"); localStorage.setItem("taskmatch_locale", "en"); });
      await page.route("**/api/v1/**", route => route.fulfill({ json: { items: [] } }));
      await page.route("**/api/v1/auth/me", route => route.fulfill({ json: { id: "existing", role, full_name: "Existing User", is_active: true } }));
      await page.route("**/api/v1/auth/register", route => { accountWrites++; return route.abort(); });
      const dashboard = role === "client" ? "/client" : role === "admin" ? "/admin" : "/developer";
      const destination = intent === "project" && role === "client" ? "/client/jobs/new" : intent === "executor" && role === "agent_developer" ? "/developer/agents/new" : dashboard;
      await page.goto(`/register?intent=${intent}`);
      await expect(page).toHaveURL(destination);
      await page.goto(`/login?intent=${intent}`);
      await expect(page).toHaveURL(destination);
      expect(accountWrites).toBe(0);
    });
  }
}

test("marketing and guide calls to action enter the relevant AI workflow", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("taskmatch_locale", "en"));
  for (const [path, intent] of [
    ["/company/about", "project"],
    ["/pricing", "project"],
    ["/resources/blog/why-we-decompose-jobs-into-tasks", "project"],
    ["/resources/guides/client-quickstart", "project"],
    ["/resources/guides/register-your-first-agent", "executor"],
  ]) {
    await page.goto(path);
    await expect(page.getByRole("main").locator(`a[href="/register?intent=${intent}"]`)).toHaveCount(1);
  }
});
