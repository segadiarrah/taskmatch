import { expect, test } from "@playwright/test";

for (const failure of ["upload", "submit"] as const) {
  test(`a failed ${failure} preserves the draft and retries without duplication`, async ({ page }) => {
    let creations = 0;
    let uploads = 0;
    let submissions = 0;
    await page.addInitScript(() => {
      localStorage.setItem("auth_token", "test-token");
      localStorage.setItem("taskmatch_locale", "en");
    });
    await page.route("**/api/v1/auth/me", route => route.fulfill({ json: { id: "client-test", full_name: "Test Client", email: "test@example.com", role: "client", is_active: true } }));
    await page.route("**/api/v1/jobs", route => {
      expect(route.request().postDataJSON().currency).toBe("EUR");
      creations += 1;
      return route.fulfill({ json: { id: "draft-test" } });
    });
    await page.route("**/api/v1/jobs/draft-test/**", route => route.fulfill({ status: 404, json: { detail: "Not available" } }));
    await page.route("**/api/v1/jobs/draft-test", route => route.fulfill({ json: { id: "draft-test", title: "Retryable job", billing_mode: "legacy_manual", raw_description: "Saved description", status: "submitted", budget_min: 10, budget_max: 50, currency: "USD", tasks_count: 0, auto_select_enabled: false, created_at: "2026-09-24T12:00:00Z", updated_at: "2026-09-24T12:00:00Z" } }));
    await page.route("**/api/v1/jobs/draft-test/documents", route => {
      uploads += 1;
      return route.fulfill(failure === "upload" && uploads === 1 ? { status: 503, json: { detail: "Upload unavailable" } } : { json: { total_documents: 1, ingested_chars: 12 } });
    });
    await page.route("**/api/v1/jobs/draft-test/submit", route => {
      submissions += 1;
      return route.fulfill(failure === "submit" && submissions === 1 ? { status: 503, json: { detail: "Planning unavailable" } } : { json: { id: "draft-test", status: "submitted" } });
    });
    await page.route("**/api/v1/jobs/draft-test/plan", route => route.fulfill({ json: { ready: false, status: "submitted", tasks: [] } }));
    await page.goto("/client/jobs/new");
    await expect(page.locator("#currency")).toHaveValue("EUR");
    await expect(page.locator("#currency option")).toHaveCount(1);
    await page.locator("#title").fill("Retryable job");
    await page.locator("#description").fill("Use the attached requirements to prepare a report.");
    await page.locator("#budget_min").fill("10");
    await page.locator("#budget_max").fill("50");
    await page.locator("#documents").setInputFiles({ name: "requirements.txt", mimeType: "text/plain", buffer: Buffer.from("Requirements") });
    await page.getByRole("button", { name: "Create Job", exact: true }).click();
    await expect(page.locator("main [role=alert]")).toBeVisible();
    await expect(page).toHaveURL(/\/client\/jobs\/new$/);
    expect(creations).toBe(1);
    if (failure === "upload") expect(submissions).toBe(0);
    await page.getByRole("button", { name: "Retry submission", exact: true }).click();
    await expect(page).toHaveURL(/\/client\/jobs\/draft-test$/);
    expect(creations).toBe(1);
    expect(uploads).toBe(failure === "upload" ? 2 : 1);
    expect(submissions).toBe(failure === "submit" ? 2 : 1);
  });
}
