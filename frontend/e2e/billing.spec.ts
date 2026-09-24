import { expect, test, type Page } from "@playwright/test";

const base = { billing_mode: "stripe", status: "unpaid", amount_minor: 1259, currency: "EUR", refunded_minor: 0, receipt_url: null, checkout_url: null, can_checkout: true, can_cancel: false, payouts: [], error: null };
const account = { account_id: null, country: null, details_submitted: false, transfers_enabled: false, payouts_enabled: false, requirements: [], enabled: true, mode: "test" };
async function setup(page: Page, role = "client", locale = "en") {
  await page.addInitScript(selected => { localStorage.setItem("auth_token", "test-token"); localStorage.setItem("taskmatch_locale", selected); }, locale);
  await page.route("**/api/v1/**", route => route.fulfill({ status: 404, json: { detail: "Not available" } }));
  await page.route("**/api/v1/auth/me", route => route.fulfill({ json: { id: "user-test", role, email: "test@example.test", full_name: "Test user", is_active: true } }));
  await page.route("**/api/v1/billing/config", route => route.fulfill({ json: { enabled: true, mode: "test", currencies: ["EUR", "USD", "GBP"], connect_enabled: true } }));
  await page.route("**/api/v1/jobs/job-test", route => route.fulfill({ json: { id: "job-test", billing_mode: "stripe", title: "Funded job", raw_description: "A real brief", status: "quoted", currency: "EUR", budget_min: 1, budget_max: 20, auto_select_enabled: false, created_at: "2026-09-24T00:00:00Z", updated_at: "2026-09-24T00:00:00Z" } }));
  await page.route("**/api/v1/jobs/job-test/plan", route => route.fulfill({ json: { ready: true, planning: false, job: { id: "job-test", status: "quoted", currency: "EUR" }, spec: { objective: "A real brief", deliverables: [], constraints: [], success_criteria: [] }, tasks: [], stages: [], payment: null } }));
  await page.route("**/api/v1/billing/jobs/job-test", route => route.fulfill({ json: base }));
}

test("checkout uses the server URL and sends no client amount", async ({ page }) => {
  await setup(page);
  let body: unknown;
  await page.route("**/api/v1/billing/jobs/job-test/checkout", route => { body = route.request().postDataJSON(); return route.fulfill({ json: { checkout_url: "https://checkout.stripe.com/c/pay/test", session_id: "cs_test", status: "checkout_pending", amount_minor: 1259, currency: "EUR" } }); });
  await page.route("https://checkout.stripe.com/**", route => route.fulfill({ contentType: "text/html", body: "<h1>Hosted test checkout</h1>" }));
  await page.goto("/client/jobs/job-test");
  await expect(page.getByTestId("billing-amount")).toHaveText(/12[.,]59/);
  await page.getByRole("button", { name: "Pay securely with Stripe", exact: true }).click();
  await expect(page).toHaveURL("https://checkout.stripe.com/c/pay/test");
  expect(body).toEqual({});
});

test("a forged success return does not claim payment before server confirmation", async ({ page }) => {
  await setup(page);
  const sequence: string[] = [];
  let confirmed = false;
  await page.route("**/api/v1/billing/jobs/job-test/sync", route => { sequence.push("sync"); return route.fulfill({ json: base }); });
  await page.route("**/api/v1/billing/jobs/job-test", route => { sequence.push("get"); return route.fulfill({ json: confirmed ? { ...base, status: "paid", can_checkout: false } : base }); });
  await page.goto("/client/jobs/job-test?checkout=success&session_id=forged");
  await expect(page.getByTestId("funding-status")).toHaveText("Awaiting payment");
  expect(sequence.indexOf("get")).toBeGreaterThan(sequence.indexOf("sync"));
  await expect(page.getByText("Payment confirmed", { exact: true })).toHaveCount(0);
  confirmed = true;
  await page.getByRole("button", { name: "Check payment status", exact: true }).click();
  await expect(page.getByTestId("funding-status")).toHaveText("Payment confirmed");
});

test("cancel return preserves unpaid state and explicit cancellation enables retry", async ({ page }) => {
  await setup(page);
  let cancelled = false;
  await page.route("**/api/v1/billing/jobs/job-test", route => route.fulfill({ json: cancelled ? base : { ...base, status: "checkout_pending", can_cancel: true, can_checkout: false, checkout_url: "https://checkout.stripe.com/c/pay/test" } }));
  await page.route("**/api/v1/billing/jobs/job-test/cancel", route => { cancelled = true; return route.fulfill({ json: base }); });
  await page.goto("/client/jobs/job-test?checkout=cancel");
  await expect(page.getByText("Checkout was closed. Check the payment status before trying again.")).toBeVisible();
  await page.getByRole("button", { name: "Cancel this checkout", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pay securely with Stripe", exact: true })).toBeVisible();
  expect(cancelled).toBe(true);
});

test("checkout failures and non-Stripe URLs never navigate or claim success", async ({ page }) => {
  await setup(page);
  let attempts = 0;
  await page.route("**/api/v1/billing/jobs/job-test/checkout", route => { attempts++; return route.fulfill(attempts === 1 ? { status: 503, json: { detail: "Unavailable" } } : { json: { checkout_url: "https://stripe.com.example.test/pay", status: "checkout_pending" } }); });
  await page.goto("/client/jobs/job-test");
  await page.getByRole("button", { name: "Pay securely with Stripe", exact: true }).click();
  await expect(page.getByTestId("billing-error")).toBeVisible();
  await page.getByRole("button", { name: "Pay securely with Stripe", exact: true }).click();
  await expect(page.getByTestId("billing-error")).toContainText("secure Stripe link");
  await expect(page).toHaveURL(/\/client\/jobs\/job-test$/);
});

async function earnings(page: Page, locale = "en") {
  await setup(page, "agent_developer", locale);
  await page.route("**/api/v1/developer/earnings/summary", route => route.fulfill({ json: { by_currency: [{ currency: "EUR", total_earned: 12.59, pending_payments: 3.04, this_month: 12.59 }, { currency: "USD", total_earned: 20.01, pending_payments: 0, this_month: 20.01 }] } }));
  await page.route("**/api/v1/developer/earnings/payments**", route => route.fulfill({ json: { items: [] } }));
  await page.route("**/api/v1/billing/connect", route => route.fulfill({ json: account }));
}

test("Connect requires an explicit country and uses hosted onboarding", async ({ page }) => {
  await earnings(page);
  let country: unknown;
  await page.route("**/api/v1/billing/connect/onboarding", route => { country = route.request().postDataJSON().country; return route.fulfill({ json: { url: "https://connect.stripe.com/setup/test" } }); });
  await page.route("https://connect.stripe.com/**", route => route.fulfill({ contentType: "text/html", body: "<h1>Hosted onboarding</h1>" }));
  await page.goto("/developer/earnings");
  await expect(page.getByRole("button", { name: "Set up payouts", exact: true })).toBeDisabled();
  await page.getByLabel("Account country (two-letter code)").fill("fr");
  await page.getByRole("button", { name: "Set up payouts", exact: true }).click();
  await expect(page).toHaveURL("https://connect.stripe.com/setup/test");
  expect(country).toBe("FR");
});

test("Connect return verifies requirements and distinguishes transfers from bank payouts", async ({ page }) => {
  await earnings(page);
  let syncs = 0;
  const incomplete = { ...account, account_id: "acct_test", country: "FR", details_submitted: true, requirements: ["individual.verification.document"] };
  await page.route("**/api/v1/billing/connect/sync", route => { syncs++; return route.fulfill({ json: incomplete }); });
  await page.route("**/api/v1/billing/connect", route => route.fulfill({ json: incomplete }));
  await page.goto("/developer/earnings?connect=return");
  await expect(page.getByText("More information required", { exact: true })).toBeVisible();
  await expect(page.getByText("individual.verification.document", { exact: true })).toBeVisible();
  expect(syncs).toBeGreaterThan(0);
  await expect(page.getByText("Transfers enabled", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Earnings currency")).toBeVisible();
  await page.getByLabel("Earnings currency").selectOption("USD");
  await expect(page.getByTestId("total-earned")).toContainText("20.01");
});

test("Connect errors preserve the account state and offer a retry", async ({ page }) => {
  await earnings(page);
  await page.route("**/api/v1/billing/connect/sync", route => route.fulfill({ status: 503, json: { detail: "Unavailable" } }));
  await page.goto("/developer/earnings");
  await page.getByRole("button", { name: "Refresh Stripe status", exact: true }).click();
  await expect(page.getByTestId("connect-error")).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh Stripe status", exact: true })).toBeEnabled();
});

test("unavailable earnings never appear as zero or empty payment history", async ({ page }) => {
  await earnings(page);
  let unavailable = true;
  await page.route("**/api/v1/developer/earnings/summary", route => route.fulfill(unavailable
    ? { status: 503, json: { detail: "Unavailable" } }
    : { json: { by_currency: [{ currency: "USD", total_earned: 20.01, pending_payments: 0, this_month: 20.01 }] } }));
  await page.goto("/developer/earnings");
  await expect(page.getByRole("button", { name: "Retry", exact: true })).toBeVisible();
  await expect(page.getByTestId("total-earned")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "No payments yet", exact: true })).toHaveCount(0);
  unavailable = false;
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByTestId("total-earned")).toContainText("20.01");
  await expect(page.getByRole("heading", { name: "No payments yet", exact: true })).toBeVisible();
});

test("developer dashboard never combines currencies into a single earnings total", async ({ page }) => {
  await earnings(page);
  await page.route("**/api/v1/developer/dashboard/stats", route => route.fulfill({ json: { my_agents: 1, active_assignments: 0, completed_tasks: 2, total_earnings: 999, earnings_by_currency: [{ currency: "EUR", amount: 12.59 }, { currency: "USD", amount: 20.01 }] } }));
  await page.route("**/api/v1/developer/assignments**", route => route.fulfill({ json: { items: [] } }));
  await page.goto("/developer");
  await expect(page.getByTestId("dashboard-earnings")).toContainText("12.59");
  await expect(page.getByTestId("dashboard-earnings")).toContainText("20.01");
  await expect(page.getByTestId("dashboard-earnings")).not.toContainText("999");
});

for (const [locale, status, country] of [
  ["fr", "En attente de paiement", "Pays du compte (code à deux lettres)"],
  ["es", "Pendiente de pago", "País de la cuenta (código de dos letras)"],
  ["zh", "等待付款", "账户所在国家或地区（两字母代码）"],
]) {
  test(`payment and Connect controls are translated in ${locale}`, async ({ page }) => {
    await setup(page, "client", locale);
    await page.goto("/client/jobs/job-test");
    await expect(page.getByTestId("funding-status")).toHaveText(status);
    await earnings(page, locale);
    await page.goto("/developer/earnings");
    await expect(page.getByLabel(country)).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
  });
}

test("approving a Stripe quote redirects to Checkout without announcing execution", async ({ page }) => {
  await setup(page);
  await page.route("**/api/v1/jobs/job-test/quote", route => route.fulfill({ json: { pending: false, job_status: "quoted", quote: { id: "quote-test", status: "pending_client", currency: "EUR", subtotal: 11.33, platform_fee: 1.26, total: 12.59, human_equivalent: { low: null, high: null }, savings_vs_human: null, valid_until: null, pricing_version: "test", rejection_reason: null, actionable: true, requires_human: false, tasks: [] } } }));
  await page.route("**/api/v1/jobs/job-test/quote/accept", route => { expect(route.request().postDataJSON()).toEqual({}); return route.fulfill({ json: { checkout_url: "https://checkout.stripe.com/c/pay/quote", session_id: "cs_quote", status: "checkout_pending", amount_minor: 1259, currency: "EUR" } }); });
  await page.route("https://checkout.stripe.com/**", route => route.fulfill({ contentType: "text/html", body: "<h1>Hosted test checkout</h1>" }));
  await page.goto("/client/jobs/job-test");
  await expect(page.getByText("Quote approved — execution has started.", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Approve & pay with Stripe", exact: true }).click();
  await expect(page).toHaveURL("https://checkout.stripe.com/c/pay/quote");
});
