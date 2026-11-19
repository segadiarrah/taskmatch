import { expect, test, type Route } from "@playwright/test";

const admin = { id: "admin", email: "admin@example.com", full_name: "Admin", role: "admin", is_active: true, created_at: "2026-01-01T00:00:00Z" };

for (const status of [401, 403, 503]) {
  test(`a delayed session lookup ${status} preserves a newer login`, async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem("auth_token", "old-token");
        sessionStorage.setItem("seeded", "true");
      }
      localStorage.setItem("taskmatch_locale", "en");
    });
    const pending: Route[] = [];
    await page.route("**/api/v1/auth/me", (route) => {
      if (route.request().headers().authorization === "Bearer old-token") {
        pending.push(route);
        return;
      }
      return route.fulfill({ json: admin });
    });
    await page.route("**/api/v1/auth/login", (route) => route.fulfill({ json: { access_token: "new-token", token_type: "bearer" } }));
    await page.route("**/api/v1/worker-portal/admin/overview", route => route.fulfill({ json: { human_missions:0,pending_publication:0,active_human_missions:0,worker_profiles:0,pending_worker_verification:0 } }));
    await page.route("**/api/v1/dashboard/overview", (route) => route.fulfill({ status: 503, json: { detail: "Unavailable" } }));
    await page.goto("/login");
    await expect.poll(() => pending.length).toBeGreaterThan(0);
    await page.locator("#email").fill("operator");
    await page.locator("#password").fill("example-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    expect(await page.evaluate(() => localStorage.getItem("auth_token"))).toBe("new-token");

    await Promise.all(pending.map((route) => route.fulfill({ status, json: { detail: "Old session failed" } })));
    await expect(page.getByRole("link", { name: "Overview", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();
    await expect(page).toHaveURL(/\/admin$/);
    expect(await page.evaluate(() => localStorage.getItem("auth_token"))).toBe("new-token");
  });
}
