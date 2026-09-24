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
