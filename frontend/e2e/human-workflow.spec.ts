import { test, expect, type Page } from "@playwright/test";
const mission = { task_id:"task", parent_job_id:"job", principal_id:"principal", title:"Check the field report", objective:"Review the report", instructions:"Read the supplied information", status:"open_for_bids", policy_status:"approved", expected_duration:30, deadline:"2026-12-20T12:00:00Z", budget:{amount_minor:1100}, evidence_requirements:["report"], authorizations:["owner_consent"], actions:{can_edit_plan:true} };
async function open(page:Page, actions:Record<string,boolean>) {
 await page.addInitScript(()=>{localStorage.setItem("auth_token","test");localStorage.setItem("taskmatch_locale","en");});
 await page.route("**/api/v1/**",r=>r.fulfill({status:404,json:{detail:"Unavailable"}}));
 await page.route("**/api/v1/auth/me",r=>r.fulfill({json:{id:"owner",role:"client",full_name:"Owner",is_active:true}}));
 await page.route("**/api/v1/human-tasks/taxonomy",r=>r.fulfill({json:{categories:[]}}));
 await page.route("**/api/v1/worker-portal/missions?**",r=>r.fulfill({json:{items:[mission],total:1}}));
 await page.route("**/api/v1/human-tasks/task",r=>r.fulfill({json:{...mission,actions}}));
 await page.route("**/api/v1/tasks/task/submissions",r=>r.fulfill({json:[]}));
 await page.route("**/api/v1/jobs/job/steps",r=>r.fulfill({json:{items:[{task_id:"task",title:mission.title,status:"pending",kind:"human",depends_on:[]},{task_id:"first",title:"Earlier report",status:"pending",kind:"human",depends_on:[]}]}}));
 await page.route("**/api/v1/human-tasks/task/fund",r=>r.fulfill({json:{status:"requires_review"}}));
 await page.goto("/human-tasks?view=request");
 await page.getByRole("button",{name:new RegExp(mission.title)}).click();
}
test("owner saves prerequisites and adds an analysis using the current human step",async({page})=>{
 await open(page,{can_edit_plan:true});let dependencies:unknown,step:unknown;
 await page.route("**/api/v1/human-tasks/task/dependencies",r=>{dependencies=r.request().postDataJSON();return r.fulfill({json:{}});});
 await page.route("**/api/v1/jobs/job/steps",r=>{if(r.request().method()==="POST"){step=r.request().postDataJSON();return r.fulfill({status:201,json:{task_id:"ai"}});}return r.fulfill({json:{items:[{task_id:"task",title:mission.title,status:"pending",kind:"human",depends_on:[]},{task_id:"first",title:"Earlier report",status:"pending",kind:"human",depends_on:[]}]}});});
 await page.getByRole("checkbox",{name:"Earlier report"}).check();await page.getByRole("button",{name:"Save prerequisites"}).click();await expect.poll(()=>dependencies).toEqual({depends_on:["first"]});
 await page.getByRole("button",{name:"Add an AI analysis"}).click();await page.getByLabel("Analysis title").fill("Analyze the approved evidence");await page.getByLabel("What should the AI analyze?").fill("Write a summary of the verified field evidence.");await page.getByRole("button",{name:"Add analysis",exact:true}).click();await expect.poll(()=>step).toMatchObject({depends_on:["task"],task_type:"research"});
});
test("bank recovery happens before a new checkout and sends no client amount",async({page})=>{
 const calls:string[]=[];await page.route("**/api/v1/human-tasks/task/fund",r=>r.fulfill({json:{status:"requires_review"}}));
 await open(page,{can_fund:true});
 // The general setup is registered later; register the funding route again.
 await page.route("**/api/v1/human-tasks/task/fund",r=>r.fulfill({json:{status:"requires_review"}}));
 await page.route("**/api/v1/human-tasks/task/fund/recover",r=>{calls.push("recover");expect(r.request().postDataJSON()).toEqual({});return r.fulfill({json:{status:"cancelled"}});});
 await page.route("**/api/v1/billing/jobs/job/checkout",r=>{calls.push("checkout");expect(r.request().postDataJSON()).toBeNull();return r.fulfill({json:{status:"checkout_pending",checkout_url:"https://checkout.stripe.com/test"}});});
 await page.route("https://checkout.stripe.com/**",r=>r.fulfill({contentType:"text/html",body:"<h1>Secure payment</h1>"}));
 // Retry opening after the payment status mock becomes available.
 await page.getByRole("button",{name:"Back",exact:true}).click();await page.getByRole("button",{name:new RegExp(mission.title)}).click();
 await page.getByRole("button",{name:"Continue with a manual payment"}).click();await expect(page).toHaveURL("https://checkout.stripe.com/test");expect(calls).toEqual(["recover","checkout"]);
});
test("payment settings link switches the current page to the agent journey",async({page})=>{
 await open(page,{can_fund:true});await page.getByRole("link",{name:"Manage payment permissions"}).click();await expect(page).toHaveURL(/view=agents/);await expect(page.getByRole("button",{name:new RegExp(mission.title)})).toHaveCount(0);
});
