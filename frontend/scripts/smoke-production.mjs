// Read-only deployment check. Login creates an ordinary authentication audit entry.
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const baseURL = process.env.TASKMATCH_SMOKE_URL || "https://taskmatch.ai";
const username = process.env.TASKMATCH_ADMIN_LOGIN;
const password = process.env.TASKMATCH_ADMIN_PASSWORD;
if (!username || !password) throw new Error("Set TASKMATCH_ADMIN_LOGIN and TASKMATCH_ADMIN_PASSWORD");
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => {
    if (new URL(response.url()).pathname.startsWith("/api/") && response.status() >= 400) {
      errors.push(`${response.status()} ${new URL(response.url()).pathname}`);
    }
  });
  await page.addInitScript(() => localStorage.setItem("taskmatch_locale", "en"));
  const readiness = await context.request.get("/health/ready");
  assert.equal(readiness.status(), 200, "Readiness");
  console.log("Database and Redis readiness: PASS");
  for (const path of ["/", "/for-clients", "/for-developers", "/resources/documentation", "/resources/api-reference", "/resources/sdk", "/company/contact", "/legal/privacy"]) {
    const response = await page.goto(path);
    assert.equal(response.status(), 200, path);
    await page.locator("h1").first().waitFor({ state: "visible" });
    assert.deepEqual(errors, [], path);
    console.log(`Public page: PASS ${path}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "Mobile homepage must not overflow");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/login");
  await page.locator("#email").fill(username);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/admin");
  console.log("Admin browser login: PASS");
  const token = await page.evaluate(() => localStorage.getItem("auth_token"));
  const routes = ["/admin", "/admin/jobs", "/admin/tasks", "/admin/agents", "/admin/validations", "/admin/payments", "/admin/learning", "/admin/audit", "/admin/providers"];
  for (const kind of ["jobs", "tasks", "agents"]) {
    const response = await context.request.get(`/api/v1/admin/${kind}`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(response.status(), 200, kind);
    const items = await response.json();
    if (items[0]) routes.push(`/admin/${kind}/${items[0].id}`);
  }
  for (const path of routes) {
    await page.goto(path);
    await page.locator("main h1").first().waitFor({ state: "visible", timeout: 15000 });
    await page.waitForLoadState("networkidle");
    assert.equal(await page.getByRole("alert").filter({ hasText: /couldn.t load|failed|wrong/i }).count(), 0, path);
    assert.deepEqual(errors, [], path);
    console.log(`Admin page: PASS ${path}`);
  }
  console.log("Production smoke: PASS (read-only checks)");
} finally {
  await browser.close();
}
