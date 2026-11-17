import { expect, test } from "@playwright/test";

const locales = {
  en: { mission: "Delegate a mission", work: "Find work", agent: "Connect an agent", login: "Sign in", register: "Create account", consent: "Terms of Service" },
  fr: { mission: "Confier une mission", work: "Trouver une mission", agent: "Connecter un agent", login: "Se connecter", register: "Créer un compte", consent: "Conditions d'utilisation" },
  es: { mission: "Delegar una misión", work: "Encontrar trabajo", agent: "Conectar un agente", login: "Iniciar sesión", register: "Crear cuenta", consent: "Términos del servicio" },
  zh: { mission: "委托任务", work: "寻找工作", agent: "连接智能体", login: "登录", register: "创建账户", consent: "服务条款" },
};
const user = { id: "public-user", email: "user@example.test", full_name: "Test User", role: "client", is_active: true, created_at: "2026-01-01T00:00:00Z" };

for (const [locale, labels] of Object.entries(locales)) {
  test(`three clear journeys preserve intent through auth (${locale})`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem("taskmatch_locale", value), locale);
    await page.setViewportSize({ width: locale === "en" ? 390 : 1280, height: 900 });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("body")).not.toContainText(/stripe/i);
    await expect(page.locator("video")).toHaveCount(0);
    for (const [intent, label] of [["mission", labels.mission], ["work", labels.work], ["agent", labels.agent]]) {
      const link = page.locator("main").getByRole("link", { name: label, exact: true }).first();
      await expect(link).toHaveAttribute("href", `/register?intent=${intent}`);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator("main").getByRole("link", { name: labels.work, exact: true }).click();
    await expect(page).toHaveURL(/\/register\?intent=work$/);
    await expect(page.getByRole("radio", { name: labels.work, exact: true })).toBeChecked();
    await expect(page.getByRole("link", { name: labels.consent, exact: true })).toHaveAttribute("href", "/legal/terms");
    await page.getByRole("link", { name: labels.login, exact: true }).click();
    await expect(page).toHaveURL(/\/login\?intent=work$/);
    await page.screenshot({ path: test.info().outputPath(`login-${locale}.png`), fullPage: true });
  });
}

for (const [intent, view] of [["mission", "request"], ["work", "work"], ["agent", "agents"]]) {
  test(`registration returns to ${intent} without requiring another role`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("taskmatch_locale", "en"));
    let submittedRole = "";
    await page.route("**/api/v1/auth/register", route => { submittedRole = route.request().postDataJSON().role; return route.fulfill({ json: user }); });
    await page.route("**/api/v1/auth/login", route => route.fulfill({ json: { access_token: "public-test-token" } }));
    await page.route("**/api/v1/auth/me", route => route.fulfill({ json: user }));
    await page.route("**/api/v1/human-tasks**", route => route.fulfill({ json: { items: [], categories: [] } }));
    await page.route("**/api/v1/workers/me", route => route.fulfill({ json: null }));
    await page.route("**/api/v1/principals", route => route.fulfill({ json: [] }));
    await page.goto(`/register?intent=${intent}`);
    await page.locator("#full_name").fill("Test User");
    await page.locator("#email").fill("user@example.test");
    await page.locator("#password").fill("public-test-password");
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page).toHaveURL(`/human-tasks?view=${view}`);
    expect(submittedRole).toBe("client");
  });
}

test("mobile navigation has three direct journeys and closes after navigation", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("taskmatch_locale", "en"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Toggle menu" });
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#public-mobile-nav nav a")).toHaveCount(3);
  await page.locator("#public-mobile-nav").getByRole("link", { name: "Connect an agent" }).click();
  await expect(page).toHaveURL(/\/register\?intent=agent$/);
  await expect(page.getByRole("radio", { name: "Connect an agent" })).toBeChecked();
});

const publicSurfaces = ["/", "/how-it-works", "/for-clients", "/for-developers", "/pricing", "/changelog", "/company/about", "/company/careers", "/company/contact", "/company/press-kit", "/resources/documentation", "/resources/api-reference", "/resources/sdk", "/resources/guides", "/resources/blog", "/resources/blog/escrow-payments-for-autonomous-agent-work", "/resources/guides/integrate-webhooks-safely", "/legal/notice", "/legal/privacy", "/legal/terms", "/legal/security", "/legal/compliance", "/login", "/register"];
for (const locale of Object.keys(locales)) {
  test(`public routes show neutral payment copy and usable content (${locale})`, async ({ page }) => {
    test.setTimeout(150_000);
    await page.addInitScript(value => localStorage.setItem("taskmatch_locale", value), locale);
    await page.setViewportSize({ width: locale === "fr" ? 390 : 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const path of publicSurfaces) {
      await test.step(path, async () => {
        const response = await page.goto(path);
        expect(response?.ok()).toBe(true);
        await expect(page.locator("h1").first()).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("body")).not.toContainText(/stripe/i);
        const metadata = await page.locator('meta[name="description"],meta[property="og:description"]').evaluateAll(elements => elements.map(element => element.getAttribute("content")).join(" "));
        expect(metadata).not.toMatch(/stripe/i);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
        expect(await page.locator('a[href="#"]').count(), path).toBe(0);
        if (path === "/") await page.screenshot({ path: test.info().outputPath(`home-${locale}.png`), fullPage: true });
      });
    }
  });
}
