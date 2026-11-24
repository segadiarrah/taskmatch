import { expect, test } from "@playwright/test";
import { COPY } from "../src/lib/landing-copy";
import type { Locale } from "../src/lib/locales";

const locales = {
  en: { mission: "Request human help", work: "Find human work", agent: "Authorize human delegation", login: "Sign in", register: "Create account", consent: "Terms of Service" },
  fr: { mission: "Demander une aide humaine", work: "Trouver une mission humaine", agent: "Autoriser la délégation humaine", login: "Se connecter", register: "Créer un compte", consent: "Conditions d'utilisation" },
  es: { mission: "Solicitar ayuda humana", work: "Encontrar trabajo humano", agent: "Autorizar la delegación humana", login: "Iniciar sesión", register: "Crear cuenta", consent: "Términos del servicio" },
  pt: { mission: "Pedir ajuda humana", work: "Encontrar trabalho humano", agent: "Autorizar delegação humana", login: "Entrar", register: "Criar conta", consent: "Termos de Serviço" },
  zh: { mission: "请求人工协助", work: "寻找人工工作", agent: "授权人工委托", login: "登录", register: "创建账户", consent: "服务条款" },
};
const user = { id: "public-user", email: "user@example.test", full_name: "Test User", role: "client", is_active: true, created_at: "2026-01-01T00:00:00Z" };

for (const [locale, labels] of Object.entries(locales)) {
  test(`five public journeys preserve language and intent through auth (${locale})`, async ({ page }) => {
    await page.setViewportSize({ width: locale === "en" ? 390 : 1280, height: 900 });
    const copy = COPY[locale as Locale];
    for (const intent of ["project", "work", "executor", "mission", "agent"] as const) {
      await page.goto(`/?lang=${locale}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("body")).not.toContainText(/stripe/i);
      await expect(page.locator("video")).toHaveCount(0);
      const link = page.getByRole("main").getByRole("link", { name: copy[intent], exact: true }).first();
      await expect(link).toHaveAttribute("href", `/register?intent=${intent}&lang=${locale}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await link.click();
      await expect(page).toHaveURL(url => url.pathname === "/register" && url.searchParams.get("intent") === intent && url.searchParams.get("lang") === locale);
      await expect(page.getByRole("radio", { name: copy[intent], exact: true })).toBeChecked();
      await expect(page.getByRole("link", { name: labels.consent, exact: true })).toHaveAttribute("href", `/legal/terms?lang=${locale}`);
      await page.getByRole("link", { name: labels.login, exact: true }).click();
      await expect(page).toHaveURL(url => url.pathname === "/login" && url.searchParams.get("intent") === intent && url.searchParams.get("lang") === locale);
    }
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
    await page.route(/\/api\/v1\/worker-portal\/(agents|delegations|missions|opportunities)(?:\?|$)/, route => {
      expect(route.request().method()).toBe("GET");
      return route.fulfill({ json: { items: [], total: 0, skip: 0, limit: 20 } });
    });
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
  await page.locator("#public-mobile-nav").getByRole("link", { name: "Offer an AI agent" }).click();
  await expect(page).toHaveURL(/\/register\?intent=executor$/);
  await expect(page.getByRole("radio", { name: "Offer an AI agent" })).toBeChecked();
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
