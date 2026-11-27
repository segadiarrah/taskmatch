import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { directoryCopy } from "../src/lib/directory-copy";
import { SUPPORTED_LOCALES } from "../src/lib/locales";

const api = process.env.TASKMATCH_E2E_API;
if (api && (api !== "http://127.0.0.1:3171" || process.env.PLAYWRIGHT_BASE_URL !== "http://127.0.0.1:3170")) {
  throw new Error("Use only the disposable journey frontend 3170 and API 3171");
}
test.skip(!api, "TASKMATCH_E2E_API must point at the isolated journey API");

test("owner publishes, anonymous visitors filter and share in five languages, then owner withdraws", async ({ page, request, browser }) => {
  test.setTimeout(120000);
  const suffix = randomUUID().slice(0, 8).replace(/[0-9]/g, digit => String.fromCharCode(103 + Number(digit)));
  const email = "owner-" + suffix + "@directory-fixture.org";
  const password = "Local-directory-test-password";
  const account = await request.post("/api/v1/auth/register", { data: { email, password, full_name: "Private owner", role: "agent_developer" } });
  expect(account.status()).toBe(201);
  const login = await request.post("/api/v1/auth/login", { form: { username: email, password } });
  const token = (await login.json()).access_token;
  const created = await request.post("/api/v1/agents/register", {
    headers: { Authorization: "Bearer " + token }, data: { name: "Local executor " + suffix, description: "Private description" },
  });
  expect(created.status(), await created.text()).toBe(201);
  const id = (await created.json()).id;
  await page.addInitScript(value => { localStorage.setItem("auth_token", value); localStorage.setItem("taskmatch_locale", "en"); }, token);
  await page.goto("/developer/agents/" + id);
  const controls = page.locator("details").filter({ has: page.getByText("Directory profile", { exact: true }) });
  await controls.locator("summary").click();
  await controls.getByLabel("Public display name").fill("Public studio " + suffix);
  await controls.getByLabel("Expertise").fill("Local editing");
  await controls.getByLabel("Public description").fill("Editorial services for public reports.");
  await controls.getByLabel("Country").selectOption("FR");
  await controls.getByLabel("Working language").selectOption("fr");
  await controls.getByRole("button", { name: "Publish profile" }).click();
  const href = await controls.getByRole("link", { name: "Public link" }).getAttribute("href");
  expect(href).toMatch(/^\/directory\/[0-9a-f-]+/);
  const [profilePath] = href!.split("?");
  const reader = await browser.newContext({ javaScriptEnabled: false, baseURL: process.env.PLAYWRIGHT_BASE_URL });
  const anon = await reader.newPage();
  try {
    for (const lang of SUPPORTED_LOCALES) {
      const c = directoryCopy[lang];
      await anon.goto("/directory?kind=agent&country=FR&language=fr&q=" + suffix + "&lang=" + lang);
      await expect(anon.getByRole("heading", { name: c.title, exact: true })).toBeVisible();
      await anon.getByRole("link", { name: c.view, exact: true }).click();
      await expect(anon.getByRole("heading", { name: "Public studio " + suffix })).toBeVisible();
      await expect(anon.locator('meta[property="og:description"]')).toHaveAttribute("content", "Editorial services for public reports.");
      await expect(anon.locator("body")).not.toContainText(email);
    }
    await controls.getByRole("button", { name: "Unpublish", exact: true }).click();
    await expect(controls.getByRole("status")).toHaveText("Private");
    const removed = await anon.goto(profilePath);
    expect(removed?.status()).toBe(404);
  } finally {
    await reader.close();
  }
});
