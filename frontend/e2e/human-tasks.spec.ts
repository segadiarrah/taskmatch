import { test, expect, type Page } from "@playwright/test";
const categories = [
  {
    id: "translation_review",
    labels: { en: "Translation review" },
    required_capabilities: ["translation"],
    execution_mode: "remote",
    evidence: ["report"],
    authorizations: ["data_owner_consent"],
  },
  {
    id: "visual_inspection",
    labels: { en: "Visual inspection" },
    required_capabilities: ["visual_inspection"],
    execution_mode: "physical",
    evidence: ["photo", "report"],
    authorizations: ["owner_consent"],
  },
];
async function session(page: Page, role = "client") {
  await page.addInitScript(() => {
    localStorage.setItem("auth_token", "human-test");
    localStorage.setItem("taskmatch_locale", "en");
  });
  await page.route("**/api/v1/auth/me", (r) =>
    r.fulfill({
      json: { id: "owner", full_name: "Customer", role, is_active: true },
    }),
  );
  await page.route("**/api/v1/worker-portal/missions?**", (r) =>
    r.fulfill({ json: { items: [], total: 0 } }),
  );
  await page.route("**/api/v1/workers/me", (r) => r.fulfill({ json: null }));
  await page.route("**/api/v1/worker-portal/opportunities?**", (r) =>
    r.fulfill({ json: { items: [] } }),
  );
  await page.route("**/api/v1/human-tasks/taxonomy", (r) =>
    r.fulfill({ json: { categories } }),
  );
  await page.route("**/api/v1/principals", (r) =>
    r.fulfill({
      json: r.request().method() === "POST" ? { id: "principal" } : [],
    }),
  );
}

test("progressive physical mission collects location, permissions and evidence on mobile", async ({
  page,
}) => {
  await session(page);
  await page.setViewportSize({ width: 390, height: 844 });
  let sent: Record<string, unknown> | undefined;
  await page.route("**/api/v1/human-tasks", (r) => {
    sent = r.request().postDataJSON();
    return r.fulfill({ status: 201, json: { task_id: "task" } });
  });
  await page.goto("/human-tasks?view=request");
  await page.getByLabel("Mission title").fill("Inspect my shop window");
  await page
    .getByLabel("What needs to be done?")
    .fill("Check the shop window condition.");
  await page.getByLabel("Mission category").selectOption("visual_inspection");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Instructions", { exact: true })
    .fill("Inspect the outside and provide photos.");
  await page.getByLabel("City", { exact: true }).fill("Paris");
  await page.getByLabel("Address", { exact: true }).fill("10 rue de Test");
  await expect(
    page.getByText("Owner permission", { exact: true }),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: "Owner permission" }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Deadline").fill("2026-12-20T12:00");
  await page
    .getByRole("button", { name: "Submit for review", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Saved");
  expect(sent?.execution_mode).toBe("physical");
  expect(sent?.location).toEqual({
    country: "FR",
    city: "Paris",
    address: "10 rue de Test",
  });
  expect(sent?.evidence_requirements).toEqual(["photo", "report"]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("worker chooses skills without codes and can postpone payment setup", async ({
  page,
}) => {
  await session(page);
  let saved: Record<string, unknown> | undefined;
  await page.route("**/api/v1/workers/me", (r) => {
    if (r.request().method() === "PUT") {
      saved = r.request().postDataJSON();
      return r.fulfill({
        json: {
          ...saved,
          verification_status: "pending",
          payment_eligible: false,
          eligibility_reasons: [
            "identity_verification_required",
            "payment_onboarding_required",
          ],
        },
      });
    }
    return r.fulfill({ json: null });
  });
  await page.goto("/human-tasks?view=work");
  await page
    .getByRole("checkbox", { name: "Translation review", exact: true })
    .check();
  await page.getByLabel("I consent").check();
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
  expect(saved?.skills).toEqual(["translation"]);
  await expect(
    page.getByText("Create your profile for free.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Set up payments", exact: true }),
  ).not.toBeVisible();
});

test("request list paginates and failed reads offer retry", async ({
  page,
}) => {
  await session(page);
  await page.route("**/api/v1/worker-portal/missions?**", (r) => {
    const skip = new URL(r.request().url()).searchParams.get("skip");
    return r.fulfill({
      json: {
        items: [
          {
            task_id: skip === "12" ? "second" : "first",
            title: skip === "12" ? "Next mission" : "First mission",
            status: "pending",
            policy_status: "pending",
          },
        ],
        total: 13,
      },
    });
  });
  await page.goto("/human-tasks");
  await expect(
    page.getByRole("button", { name: /First mission/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(
    page.getByRole("button", { name: /Next mission/ }),
  ).toBeVisible();
  await page.route("**/api/v1/worker-portal/missions?**", (r) =>
    r.fulfill({ status: 503, json: { detail: "Temporarily unavailable" } }),
  );
  await page.getByRole("button", { name: "Previous page" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Temporarily unavailable" }),
  ).toContainText("Temporarily unavailable");
  await expect(
    page.getByRole("button", { name: "Refresh", exact: true }),
  ).toBeVisible();
});

test("admin reviews declared skills through the independent verification endpoint", async ({
  page,
}) => {
  await session(page, "admin");
  await page.route("**/api/v1/worker-portal/workers?**", (r) =>
    r.fulfill({
      json: {
        items: [
          {
            user_id: "worker",
            full_name: "Alex",
            skills: ["translation"],
            attested_skills: [],
            verification_status: "pending",
            country: "FR",
            languages: ["fr"],
          },
        ],
        total: 1,
      },
    }),
  );
  let review: Record<string, unknown> | undefined;
  await page.route("**/api/v1/workers/worker/verify", (r) => {
    review = r.request().postDataJSON();
    return r.fulfill({ json: {} });
  });
  await page.goto("/human-tasks?view=review");
  await page
    .getByRole("checkbox", { name: "Translation review", exact: true })
    .check();
  await page
    .getByLabel("Verification notes")
    .fill("Identity and translation qualification checked.");
  await page
    .getByRole("button", { name: "Verify worker", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Saved");
  expect(review?.attested_skills).toEqual(["translation"]);
});

test("owner explicitly configures a signed webhook and sees its secret once", async ({
  page,
}) => {
  await session(page);
  await page.route("**/api/v1/principals", (r) =>
    r.fulfill({ json: [{ id: "principal", kind: "individual" }] }),
  );
  await page.route("**/api/v1/worker-portal/agents", (r) =>
    r.fulfill({
      json: {
        items: [{ id: "agent", name: "Research assistant", status: "active" }],
      },
    }),
  );
  await page.route("**/api/v1/worker-portal/delegations", (r) =>
    r.fulfill({
      json: {
        items: [
          {
            id: "mandate",
            principal_id: "principal",
            agent_name: "Research assistant",
            max_amount_minor: 5000,
            reserved_amount_minor: 0,
            status: "active",
            expires_at: "2026-12-20T12:00:00Z",
            categories: ["translation_review"],
          },
        ],
      },
    }),
  );
  await page.route("**/api/v1/principals/principal/payment-method", (r) =>
    r.fulfill({ json: { ready: false } }),
  );
  let configured: Record<string, unknown> | undefined;
  await page.route("**/api/v1/principals/principal/webhooks", (r) => {
    if (r.request().method() === "POST") {
      configured = r.request().postDataJSON();
      return r.fulfill({
        status: 201,
        json: {
          id: "hook",
          url: configured?.url,
          active: true,
          secret: "only-once-secret",
        },
      });
    }
    return r.fulfill({ json: configured ? [{id:"hook",url:configured.url,active:true,delegation_id:null}] : [] });
  });
  await page.route("**/api/v1/principals/principal/webhooks/hook/deliveries",r=>r.fulfill({json:[{id:"delivery",status:"delivered",attempts:2,last_http_status:200,delivered_at:"2026-11-17T12:00:00Z",next_attempt_at:null}]}));
  await page.goto("/human-tasks?view=agents");
  await page
    .getByLabel("Notification endpoint (HTTPS)")
    .fill("https://hooks.example.test/taskmatch");
  await page
    .getByRole("button", { name: "Enable notifications", exact: true })
    .click();
  await expect(page.getByLabel("Signing secret")).toHaveValue(
    "only-once-secret",
  );
  expect(configured).toEqual({
    url: "https://hooks.example.test/taskmatch",
    delegation_id: null,
  });
  await page
    .getByRole("button", { name: "I have saved the secret", exact: true })
    .click();
  await expect(page.getByLabel("Signing secret")).not.toBeVisible();
  await page.getByRole("button",{name:"Delivery history",exact:true}).click();
  await expect(page.getByText("Delivered",{exact:true})).toBeVisible();
  await expect(page.getByText("Attempts: 2 · HTTP 200",{exact:true})).toBeVisible();
});

test('brief progresses with Enter without validating hidden later steps', async ({page}) => {
  await session(page);
  await page.goto('/human-tasks?view=request');
  await page.getByLabel('Mission title').fill('Review my translation');
  await page.getByLabel('What needs to be done?').fill('Check the supplied translation.');
  await page.getByLabel('Mission title').press('Enter');
  await expect(page.getByLabel('Instructions',{exact:true})).toBeVisible();
  await expect(page.getByRole('checkbox',{name:'Permission to use the supplied data'})).toBeVisible();
});
