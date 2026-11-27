import { expect, test } from "@playwright/test";

for (const locale of ["en", "fr", "es", "zh", "pt"]) {
  test(`pricing explains the quote currency without assuming the client’s currency (${locale})`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem("taskmatch_locale", value), locale);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: locale === "en" ? 390 : 1280, height: 900 });
    await page.goto(`/pricing?lang=${locale}`);
    await expect(page.getByRole("main")).toContainText("10 %");
    const fixedCurrency = /\b(?:euros?|EUR|USD)\b|欧元|美元|[€$]/i;
    await expect(page.getByRole("main")).not.toContainText(fixedCurrency);
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
      await expect(page.locator(selector)).toHaveAttribute("content", /.+/);
      await expect(page.locator(selector)).not.toHaveAttribute("content", fixedCurrency);
    }
    const waiver = page.locator("#first-project");
    await expect(waiver).toContainText("20");
    await expect(waiver).toContainText(/10\s*%/);
    await expect(page.getByRole("main")).toContainText(/100.*10.*110/);
    await expect(page.getByRole("main")).not.toContainText(/€9|€19|9 €|19 €|Starter|SSO|SLA/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`pricing-${locale}.png`), fullPage: true });
  });
}

test("provider catalog refresh preserves disabled state and describes verification limits", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("auth_token", "test-token"); localStorage.setItem("taskmatch_locale", "en"); });
  await page.route("**/api/v1/auth/me", route => route.fulfill({ json: { id: "admin", role: "admin", full_name: "Admin", is_active: true } }));
  let refreshed = false;
  await page.route("**/api/v1/admin/providers", route => route.fulfill({ json: { providers: [{ provider: "openai", label: "OpenAI", base_url: "https://api.openai.com/v1", models: ["model-1"], selected_model: "model-1", enabled: false, key_set: true, key_hint: "…1234", available_models: refreshed ? ["model-1", "model-2"] : [], catalog_checked_at: refreshed ? "2026-10-29T00:00:00Z" : null, catalog_error: null }] } }));
  await page.route("**/api/v1/admin/providers/openai/refresh", route => { refreshed = true; return route.fulfill({ json: {} }); });
  await page.goto("/admin/providers");
  await page.getByRole("button", { name: "Check model catalog" }).click();
  await expect(page.getByText("2 models visible to this account")).toBeVisible();
  await expect(page.getByText(/does not prove generation/)).toBeVisible();
  await expect(page.getByRole("switch", { name: "Toggle OpenAI" })).not.toBeChecked();
});
