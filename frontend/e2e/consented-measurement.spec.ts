import { expect, test } from "@playwright/test";

test("usage measurement starts on consent and stops immediately on withdrawal",async({page})=>{
  const events:string[]=[];
  const consent:string[]=[];
  await page.route("**/api/v1/measurement/**", async route=>{
    if (new URL(route.request().url()).pathname.endsWith("/consent")) consent.push(route.request().method());
    else events.push(route.request().postDataJSON().kind);
    await route.fulfill({status:route.request().method()==="POST" && new URL(route.request().url()).pathname.endsWith("/consent") ? 201 : 204});
  });
  await page.goto("/?lang=en");
  const preferences=page.getByRole("button",{name:"Usage measurement",exact:true});
  await preferences.click();
  expect(consent).toEqual([]);
  expect(events).toEqual([]);
  await page.getByRole("button",{name:"Allow measurement",exact:true}).click();
  await expect.poll(()=>events).toContain("landing_page_view");
  expect(consent).toEqual(["POST"]);
  await preferences.click();
  await page.getByRole("button",{name:"Withdraw and erase history",exact:true}).click();
  await expect.poll(()=>consent).toEqual(["POST","DELETE"]);
  const count=events.length;
  await page.goto("/pricing?lang=en");
  await expect(page.getByRole("button",{name:"Usage measurement",exact:true})).toBeVisible();
  expect(events).toHaveLength(count);
});

test("French admin report distinguishes public signups, measured browsers and empty retention",async({page})=>{
  await page.addInitScript(()=>{localStorage.setItem("auth_token","fixture");});
  await page.route("**/api/v1/auth/me",r=>r.fulfill({json:{id:"local-fixture",role:"admin",email:"synthetic@example.test",full_name:"Operator"}}));
  await page.route("**/api/v1/admin/growth/summary?*",r=>r.fulfill({json:[{public_registrations:8}]}));
  await page.route("**/api/v1/admin/growth/campaigns?*",r=>r.fulfill({json:[]}));
  await page.route("**/api/v1/admin/growth/funnel?*",r=>r.fulfill({json:{
    cohort_visitors:3,excluded:1, events:{landing_page_view:3,registration_completed:1,agent_connection_verified:0},
    rates:{signup:{numerator:1,denominator:2,rate:.5}},retention:{D1:{eligible:0,returned:0,rate:null}},
    money:{gross_captured_minor:0,refunded_minor:0,net_collected_minor:0,quoted_platform_fee_minor:0},dimensions:[],
  }}));
  await page.goto("/admin/growth?lang=fr");
  await expect(page.getByRole("heading",{name:"Acquisition",exact:true})).toBeVisible();
  await expect(page.getByText("Aucune cohorte éligible",{exact:true})).toBeVisible();
  await expect(page.getByText("Inscriptions publiques sur la période",{exact:true}).locator("..")).toContainText("8");
  await expect(page.getByText("Cohorte de navigateurs consentants",{exact:true}).first().locator("..")).toContainText("3");
});

test("French referral dashboard shows the sponsor's four private counters", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("auth_token", "fixture"));
  await page.route("**/api/v1/auth/me", route => route.fulfill({
    json: { id: "local-fixture", role: "client", email: "sponsor@example.test", full_name: "Parrain" },
  }));
  await page.route("**/api/v1/referrals/me", route => route.fulfill({
    json: { path: "/?ref=abcdefghijklmnopqrstuv", stats: { visits: 9, verified_signups: 4, activations: 2, first_captures: 1 } },
  }));
  await page.goto("/referrals?lang=fr");
  for (const [label, value] of [
    ["Visiteurs distincts ayant accepté la mesure", "9"],
    ["Inscriptions vérifiées par e-mail", "4"],
    ["Comptes activés", "2"],
    ["Comptes avec un premier paiement réel encaissé", "1"],
  ]) {
    await expect(page.getByText(label, { exact: true }).locator("..").locator("dd")).toHaveText(value);
  }
});
