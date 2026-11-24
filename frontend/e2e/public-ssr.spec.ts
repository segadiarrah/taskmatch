import { expect, test } from "@playwright/test";
import { COPY } from "../src/lib/landing-copy";
import { SUPPORTED_LOCALES } from "../src/lib/locales";

test.use({ javaScriptEnabled: false });

for (const locale of SUPPORTED_LOCALES) {
  test(`public pages and registration previews work without JavaScript in ${locale}`, async ({ page }) => {
    const c = COPY[locale];
    await page.goto(`/?lang=${locale}`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(c.titleLead);
    const resourceLinks = await page.locator("footer a").evaluateAll(elements =>
      elements.map(element => new URL((element as HTMLAnchorElement).href)).filter(url =>
        ["/resources/documentation", "/resources/api-reference", "/resources/sdk", "/resources/guides"].includes(url.pathname) && !url.hash).map(url => ({ pathname: url.pathname, lang: url.searchParams.get("lang") })));
    expect(resourceLinks.every(link => link.lang === locale)).toBe(true);
    expect(new Set(resourceLinks.map(url => url.pathname)).size).toBe(4);
    for (const intent of ["project", "work", "executor", "mission", "agent", "delegation"] as const) {
      await page.goto(`/register?intent=${intent}&lang=${locale}&utm_source=email`);
      const label = c[intent === "delegation" ? "agent" : intent];
      await expect(page).toHaveTitle(`${label} — TaskMatch.ai`);
      await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute("content", `${label} — TaskMatch.ai`);
      await expect(page.locator('head meta[property="og:locale"]')).toHaveAttribute("content", { en: "en_US", fr: "fr_FR", zh: "zh_CN", es: "es_ES", pt: "pt_BR" }[locale]);
      await expect(page.locator('head meta[property="og:locale:alternate"]')).toHaveCount(4);
      await expect(page.locator('head meta[name="twitter:description"]')).toHaveAttribute("content", /.+/);
      await expect(page.locator('head meta[property="og:image"]')).toHaveAttribute("content", /^https?:\/\//);
      await expect(page.locator('head link[rel="alternate"][hreflang]')).toHaveCount(6);
      const canonical = await page.locator('head link[rel="canonical"]').getAttribute("href");
      expect(canonical).toContain(`intent=${intent === "delegation" ? "agent" : intent}`);
      expect(canonical).not.toContain("utm_");
    }
    await page.goto(`/pricing?lang=${locale}`);
    await expect(page.locator("#first-project")).toContainText("20");
    await page.locator('a[href*="/resources/documentation"][href$="#billing"]').click();
    await expect(page.locator("#billing")).toBeVisible();
    await expect(page.locator("#compatibility table")).toContainText("@a2a-js/sdk 0.3.14");
  });
}

test("mobile language form preserves intent and campaign without JavaScript", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/register?intent=work&utm_source=email");
  const form = page.locator('form[method="get"]').filter({ has: page.locator('select[name="lang"]') });
  await form.locator("select").selectOption("fr");
  await form.getByRole("button").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  expect(new URL(page.url()).searchParams.get("utm_source")).toBe("email");
  await expect(page).toHaveTitle(`${COPY.fr.work} — TaskMatch.ai`);
});
