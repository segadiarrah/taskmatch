import { expect, test } from "@playwright/test";
import { COPY } from "../src/lib/landing-copy";

test("first campaign and delegation survive language selection, login, and signup", async ({ page }) => {
  let submitted: Record<string, unknown> | undefined;
  await page.addInitScript(() => localStorage.setItem("taskmatch_usage_measurement_v1", "allow"));
  await page.route("**/api/v1/auth/register", route => {
    submitted = route.request().postDataJSON();
    return route.fulfill({ status: 201, json: { id: "new-signup" } });
  });
  await page.route("**/api/v1/auth/login", route => route.fulfill({ json: { access_token: "registered" } }));
  await page.route("**/api/v1/auth/me", route => route.fulfill({ json: { id: "new-signup", role: "client", full_name: "Sample", is_active: true } }));
  await page.goto("/?utm_source=courrier&utm_medium=email&utm_campaign=novembre&ref=partenaire&token=private");
  await page.getByRole("main").getByRole("link", { name: COPY.en.project, exact: true }).first().waitFor();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("taskmatch_signup_campaign"))).toContain("novembre");
  await page.goto("/register?intent=delegation&lang=fr");
  await expect(page.getByRole("radio", { name: COPY.fr.agent, exact: true })).toBeChecked();
  await page.getByRole("link", { name: "Se connecter", exact: true }).click();
  await page.getByRole("link", { name: "Créer un compte", exact: true }).click();
  await page.locator("#full_name:visible").fill("Sample");
  await page.locator("#email:visible").fill("sample@example.test");
  await page.locator("#password:visible").fill("local-test-password");
  await page.locator("#country:visible").selectOption("ML");
  await page.getByRole("button", { name: "Créer un compte", exact: true }).click();
  await expect.poll(() => submitted?.attribution).toEqual({
    utm_source: "courrier", utm_medium: "email", utm_campaign: "novembre", referral: "partenaire",
    language: "fr", country: "ML", intent: "agent",
  });
});

test("contact rejects an empty acknowledgement even when the HTTP response is successful", async ({ page }) => {
  await page.route("**/api/v1/contact", route => route.fulfill({ status: 200, json: {} }));
  await page.goto("/company/contact?lang=en");
  await page.getByRole("textbox", { name: "Full name", exact: true }).fill("Sample");
  await page.getByRole("textbox", { name: "Email address", exact: true }).fill("sample@example.test");
  await page.getByRole("textbox", { name: "Subject", exact: true }).fill("Subject");
  await page.getByRole("textbox", { name: "How can we help?", exact: true }).fill("Hello.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "We could not save your message" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "How can we help?", exact: true })).toHaveValue("Hello.");
});
