import { expect, test } from "@playwright/test";
import { activityCopy } from "../src/lib/activity-copy";

test("requester can try the isolated budget exercise and change real in-app preferences", async ({ page }) => {
  const c = activityCopy.fr;
  let muted: string[] = [];
  await page.addInitScript(() => { localStorage.setItem("taskmatch_locale", "fr"); localStorage.setItem("auth_token", "local-fixture"); });
  await page.route("**/api/v1/auth/me", route => route.fulfill({ json: { id: "test", role: "client", full_name: "Local user", is_active: true } }));
  await page.route("**/api/v1/account/activity", route => route.fulfill({ json: {
    track: "agent", steps: { identity: true }, categories: ["signup", "assignment"], agent_id: null, muted, events: [],
  } }));
  await page.route("**/api/v1/account/activity/preferences", route => {
    muted = route.request().postDataJSON().muted;
    return route.fulfill({ json: { muted } });
  });
  let demoWrites = 0;
  page.on("request", req => { if (req.method() === "POST" && /human-tasks|billing|principals/.test(req.url())) demoWrites++; });
  await page.goto("/activity");
  await expect(page.getByRole("heading", { name: c.title })).toBeVisible();
  await page.locator("#local-demo summary").click();
  await page.getByLabel(c.request, { exact: true }).fill("Visite locale de démonstration");
  await page.getByLabel(c.limit, { exact: true }).fill("30");
  await page.getByLabel(c.amount, { exact: true }).fill("40");
  await page.getByRole("button", { name: c.preview }).click();
  await expect(page.getByText(c.exceeds)).toBeVisible();
  expect(demoWrites).toBe(0);
  await page.locator("summary").filter({ hasText: c.prefs }).click();
  await page.getByRole("checkbox", { name: c.assignment }).uncheck();
  await page.getByRole("button", { name: c.save }).click();
  await expect(page.getByText(c.saved)).toBeVisible();
  expect(muted).toEqual(["assignment"]);
});
