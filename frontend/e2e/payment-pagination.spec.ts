import { expect, test } from "@playwright/test";

test("admin can reach older payments and totals describe the current page", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("auth_token", "test-token");
    localStorage.setItem("taskmatch_locale", "en");
  });
  await page.route("**/api/v1/auth/me", route => route.fulfill({ json: {
    id: "admin-test", role: "admin", email: "admin@example.test", full_name: "Test admin", is_active: true,
  } }));
  await page.route("**/api/v1/admin/payments**", route => {
    const skip = Number(new URL(route.request().url()).searchParams.get("skip") ?? 0);
    const json = Array.from({ length: skip === 0 ? 200 : 1 }, (_, i) => ({
      id: `payment-${skip + i}`, job_title: "Test job", task_title: `Delivery ${skip + i}`,
      client_name: "Client", developer_name: "Developer", currency: "EUR", provider: "manual",
      gross_amount: 10, platform_fee: 1, net_amount: 9, status: "paid",
    }));
    return route.fulfill({ json });
  });
  await page.route("**/api/v1/billing/admin/**", route => route.fulfill({ json: [] }));
  await page.goto("/admin/payments");
  await expect(page.getByText("Delivery 0", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Previous page" })).toBeDisabled();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Delivery 200", { exact: true })).toBeVisible();
  await expect(page.getByText(/Totals below cover the payments on page 2/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled();
  await page.getByRole("button", { name: "Previous page" }).click();
  await expect(page.getByText("Delivery 0", { exact: true })).toBeVisible();
});
