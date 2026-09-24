import { expect, test, type Page } from "@playwright/test";

async function setup(page: Page) {
  await page.addInitScript(() => { localStorage.setItem("auth_token", "test-token"); localStorage.setItem("taskmatch_locale", "en"); });
  await page.route("**/api/v1/auth/me", route => route.fulfill({ json: { id: "admin-test", role: "admin", email: "admin@example.test", full_name: "Admin", is_active: true } }));
  await page.route("**/api/v1/admin/payments**", route => route.fulfill({ json: [
    { id: "stripe-payment", job_title: "Stripe job", task_title: "External work", client_name: "Client", developer_name: "Developer", provider: "stripe_connect", status: "releasable", gross_amount: 12.59, platform_fee: 1.26, net_amount: 11.33, currency: "EUR", payout_error: "Account onboarding incomplete" },
    { id: "manual-payment", job_title: "Existing job", task_title: "Manual work", client_name: "Client", developer_name: "Developer", provider: "manual", status: "releasable", gross_amount: 10, platform_fee: 1, net_amount: 9, currency: "EUR" },
    { id: "platform-payment", job_title: "Platform job", task_title: "Platform work", client_name: "Client", developer_name: null, provider: "platform", status: "paid", gross_amount: 5, platform_fee: 5, net_amount: 0, currency: "EUR" },
  ] }));
  await page.route("**/api/v1/billing/admin/fundings**", route => route.fulfill({ json: [{ id: "funding-test", job_id: "job-test", job_title: "Stripe job", payer_name: "Client", amount_minor: 1259, currency: "EUR", refunded_minor: 0, status: "paid", error: null, can_refund: true }] }));
  await page.route("**/api/v1/billing/admin/operations**", route => route.fulfill({ json: [{ id: "op-test", kind: "transfer", entity_id: "stripe-payment", status: "blocked", amount_minor: 1133, currency: "EUR", job_title: "Stripe job", attempts: 2, last_error: "Account onboarding incomplete", available_at: "2026-09-24T00:00:00Z" }] }));
}

test("Stripe retries real transfers while manual records retain manual actions", async ({ page }) => {
  await setup(page);
  let retries = 0;
  await page.route("**/api/v1/billing/payments/stripe-payment/retry", route => { retries++; return route.fulfill({ status: 503, json: { detail: "Unavailable" } }); });
  await page.goto("/admin/payments");
  const stripeRow = page.getByRole("row").filter({ hasText: "External work" });
  await expect(stripeRow.getByRole("button", { name: "Record payment" })).toHaveCount(0);
  page.once("dialog", async dialog => { expect(dialog.message()).toContain("11.33"); await dialog.accept(); });
  await stripeRow.getByRole("button", { name: "Retry Stripe transfer" }).click();
  await expect(page.getByTestId("payment-action-error")).toBeVisible();
  await expect(stripeRow).toContainText("Releasable");
  expect(retries).toBe(1);
  await expect(page.getByRole("row").filter({ hasText: "Manual work" }).getByRole("button", { name: "Record payment" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "Platform work" })).toContainText("Platform revenue");
});

test("full refund requires confirmation and stays pending until the server confirms it", async ({ page }) => {
  await setup(page);
  let refundCalls = 0;
  await page.route("**/api/v1/billing/jobs/job-test/refund", route => { refundCalls++; return route.fulfill({ json: { status: "refund_pending" } }); });
  await page.route("**/api/v1/billing/admin/fundings**", route => route.fulfill({ json: [{ id: "funding-test", job_id: "job-test", job_title: "Stripe job", payer_name: "Client", amount_minor: 1259, currency: "EUR", refunded_minor: 0, status: refundCalls ? "refund_pending" : "paid", error: null, can_refund: !refundCalls }] }));
  await page.goto("/admin/payments");
  await page.getByRole("button", { name: "Refund in full", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(/12[.,]59/);
  expect(refundCalls).toBe(0);
  await page.getByRole("button", { name: "Confirm full refund", exact: true }).click();
  await expect(page.getByTestId("funding-row")).toContainText("Refund Pending");
  await expect(page.getByTestId("funding-row")).not.toContainText("Refunded");
  expect(refundCalls).toBe(1);
  await expect(page.getByTestId("billing-operations")).toContainText("Account onboarding incomplete");
});

test("retrying a money operation requires confirmation and reports reconciliation errors", async ({ page }) => {
  await setup(page);
  let calls = 0;
  await page.route("**/api/v1/billing/admin/operations/op-test/retry", route => { calls++; return route.fulfill({ status: 409, json: { detail: "Reconcile the Stripe operation before retrying" } }); });
  await page.goto("/admin/payments");
  await page.getByTestId("billing-operations").getByRole("button", { name: "Retry operation", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("stripe-payment");
  await expect(page.getByRole("dialog")).toContainText(/11[.,]33/);
  expect(calls).toBe(0);
  await page.getByRole("button", { name: "Confirm retry", exact: true }).click();
  await expect(page.getByTestId("funding-action-error")).toContainText("Reconcile the Stripe operation");
  expect(calls).toBe(1);
});

test("historical Stripe labels retain manual settlement without exposing funded Stripe manual actions", async ({ page }) => {
  await setup(page);
  await page.route("**/api/v1/admin/payments**", route => route.fulfill({ json: [
    { id: "historical", job_title: "Historical job", task_title: "Legacy delivery", developer_name: "Developer", billing_mode: "legacy_manual", funding_id: null, provider: "stripe", status: "releasable", gross_amount: "12.59", platform_fee: "1.26", net_amount: "11.33", currency: "EUR" },
    { id: "historical-pending", task_title: "Legacy pending", billing_mode: "legacy_manual", funding_id: null, provider: "stripe", status: "pending", gross_amount: "20.01", platform_fee: "2.00", net_amount: "18.01", currency: "EUR" },
    { id: "funded", task_title: "Funded delivery", billing_mode: "stripe", funding_id: "funding", provider: "stripe_connect", status: "releasable", gross_amount: 10, platform_fee: 1, net_amount: 9, currency: "EUR" },
    { id: "funded-manual", task_title: "Funded legacy label", billing_mode: "legacy_manual", funding_id: "funding-other", provider: "manual", status: "releasable", gross_amount: 5, platform_fee: 0.5, net_amount: 4.5, currency: "EUR" },
    { id: "stripe-manual", task_title: "Stripe job without funding", billing_mode: "stripe", funding_id: null, provider: "manual", status: "releasable", gross_amount: 5, platform_fee: 0.5, net_amount: 4.5, currency: "EUR" },
  ] }));
  let completions = 0;
  await page.route("**/api/v1/payments/historical/complete", route => { completions++; return route.fulfill({ json: { status: "paid" } }); });
  await page.goto("/admin/payments");
  const historical = page.getByRole("row").filter({ hasText: "Legacy delivery" });
  await expect(historical).toContainText("Manual (historical)");
  await expect(page.getByRole("row").filter({ hasText: "Legacy pending" }).getByRole("button", { name: "Mark releasable" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "Funded delivery" }).getByRole("button", { name: "Record payment" })).toHaveCount(0);
  await expect(page.getByRole("row").filter({ hasText: "Funded delivery" }).getByRole("button", { name: "Retry Stripe transfer" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "Funded legacy label" }).getByRole("button", { name: "Record payment" })).toHaveCount(0);
  await expect(page.getByRole("row").filter({ hasText: "Stripe job without funding" }).getByRole("button", { name: "Record payment" })).toHaveCount(0);
  page.once("dialog", async dialog => { expect(dialog.message()).toContain("settled externally"); await dialog.dismiss(); });
  await historical.getByRole("button", { name: "Record payment" }).click();
  expect(completions).toBe(0);
  page.once("dialog", async dialog => { expect(dialog.message()).toContain("does not transfer money"); await dialog.accept(); });
  await historical.getByRole("button", { name: "Record payment" }).click();
  await expect.poll(() => completions).toBe(1);
});

test("decimal string payment amounts aggregate as money rather than text", async ({ page }) => {
  await setup(page);
  await page.route("**/api/v1/admin/payments**", route => route.fulfill({ json: [
    { id: "one", task_title: "First amount", provider: "manual", status: "releasable", gross_amount: "12.59", platform_fee: "1.26", net_amount: "11.33", currency: "EUR" },
    { id: "two", task_title: "Second amount", provider: "manual", status: "releasable", gross_amount: "20.01", platform_fee: "2.00", net_amount: "18.01", currency: "EUR" },
  ] }));
  await page.goto("/admin/payments");
  await expect(page.getByText("Gross Total", { exact: true }).locator("..")).toContainText("€32.6");
  await expect(page.getByText("Platform Fees", { exact: true }).locator("..")).toContainText("€3.26");
  await expect(page.getByText("Net Total", { exact: true }).locator("..")).toContainText("€29.34");
  await expect(page.locator("body")).not.toContainText("NaN");
});

test("invalid payment amounts show recovery instead of fabricated zero totals", async ({ page }) => {
  await setup(page);
  await page.route("**/api/v1/admin/payments**", route => route.fulfill({ json: [
    { id: "invalid", task_title: "Invalid amount", provider: "manual", status: "pending", gross_amount: null, platform_fee: "", net_amount: "invalid", currency: "EUR" },
  ] }));
  await page.goto("/admin/payments");
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
  await expect(page.getByText("Total Pending", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Gross Total", { exact: true })).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("NaN");
});

test("platform revenue excludes pending and refunded allocations", async ({ page }) => {
  await setup(page);
  await page.route("**/api/v1/admin/payments**", route => route.fulfill({ json: [
    { id: "paid", provider: "platform", status: "paid", gross_amount: "5.00", platform_fee: "5.00", net_amount: "0.00", currency: "EUR" },
    { id: "pending", provider: "platform", status: "pending", gross_amount: "10.00", platform_fee: "10.00", net_amount: "0.00", currency: "EUR" },
    { id: "refunded", provider: "platform", status: "refunded", gross_amount: "20.00", platform_fee: "20.00", net_amount: "0.00", currency: "EUR" },
  ] }));
  await page.goto("/admin/payments");
  await expect(page.getByText(/^Platform revenue on this page:/)).toHaveText("Platform revenue on this page: €5. This is retained platform revenue, not a bank payout.");
});
