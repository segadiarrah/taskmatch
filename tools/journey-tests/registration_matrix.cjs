// Real browser submissions to the fixed local journey network, without financial operations.
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { createRequire } = require("node:module");
const path = require("node:path");
const { chromium, expect } = createRequire(path.resolve(__dirname, "../../frontend/package.json"))("@playwright/test");

const base = "http://127.0.0.1:3170";
const paths = {
  project: "/client/jobs/new", work: "/human-tasks?view=work",
  executor: "/developer/agents/new", mission: "/human-tasks?view=request", agent: "/human-tasks?view=agents",
};

async function one(browser, locale, mobile, intent, destination) {
  const context = await browser.newContext({ locale, viewport: { width: mobile ? 390 : 1280, height: 844 } });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.name));
    await page.goto(base + "/register?" + new URLSearchParams({ lang: locale, intent }));
    const form = page.locator("form:visible").filter({ has: page.locator("#email:visible") });
    await expect(form).toHaveCount(1);
    const selected = page.locator('input[name="form_intent"]:checked:visible');
    await expect(selected).toHaveValue(intent);
    const intentLabel = await page.locator("label:visible").filter({ has: selected }).innerText();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(intentLabel.trim());
    await form.locator("#full_name:visible").fill("Isolated registration");
    await form.locator("#email:visible").fill("journey-" + randomUUID() + "@example.org");
    await form.locator("#password:visible").fill(randomUUID() + randomUUID());
    await form.locator("#country:visible").selectOption("PT");
    const creation = page.waitForResponse(r => r.url() === base + "/api/v1/auth/register" && r.request().method() === "POST");
    await form.getByRole("button", { name: /.+/ }).click();
    const registration = await creation;
    assert.equal(registration.status(), 201);
    const attribution = registration.request().postDataJSON().attribution;
    assert.equal(attribution.language, locale);
    assert.equal(attribution.intent, intent);
    assert.equal(attribution.country, "PT");
    await page.waitForURL(base + destination, { timeout: 12000 });
    await page.locator("main h1").first().waitFor({ state: "visible" });
    assert.equal(await page.locator("html").getAttribute("lang"), locale);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}

(async () => {
  const fixture = await fetch("http://127.0.0.1:3172/__journey_fixture/state", {
    headers: { "X-Journey-Fixture": "local-only" }, redirect: "error",
  });
  assert.ok(fixture.ok && Array.isArray((await fixture.json()).sessions), "Local journey fixture required");
  const browser = await chromium.launch();
  try {
    for (const locale of ["en", "fr", "zh", "es", "pt"]) {
      for (const [intent, destination] of Object.entries(paths)) {
        await Promise.all([false, true].map(mobile => one(browser, locale, mobile, intent, destination)));
      }
      console.log(locale + " · 5 intentions × 2 viewports passed");
    }
    console.log("50 real isolated registrations passed.");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
