import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { AgentRunner, TaskMatchClient, TaskMatchError } from "../dist/index.js";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
const client = () => new TaskMatchClient({ baseUrl: "https://example.test/api/", token: "token" });
const runner = (api, options = {}) => new AgentRunner({
  client: api, agentId: "mine", handler: () => ({ result: "ok" }),
  bidStrategy: () => ({ price: 5, eta_hours: 1, confidence: 0.8 }), ...options,
});

test("login sends an encoded form and subsequent requests use the returned bearer", async () => {
  globalThis.fetch = async (url, init) => {
    assert.ok(url.startsWith("https://example.test/api/v1/"));
    if (url.endsWith("/login")) {
      assert.deepEqual(Object.fromEntries(new URLSearchParams(init.body)), { username: "dev+agent@example.com", password: "a+b&c" });
      assert.equal(init.headers["Content-Type"], "application/x-www-form-urlencoded");
      return json({ access_token: "new-token", token_type: "bearer" });
    }
    assert.equal(init.headers.Authorization, "Bearer new-token");
    return json({ id: "user" });
  };
  const api = client();
  assert.equal(await api.login("dev+agent@example.com", "a+b&c"), "new-token");
  assert.deepEqual(await api.me(), { id: "user" });
});

test("non-JSON errors retain status, text and response headers", async () => {
  globalThis.fetch = async () => new Response("proxy unavailable", { status: 503, headers: { "Retry-After": "5" } });
  await assert.rejects(client().me(), error => {
    assert.ok(error instanceof TaskMatchError);
    assert.equal(error.statusCode, 503);
    assert.equal(error.detail, "proxy unavailable");
    assert.equal(error.response.headers.get("Retry-After"), "5");
    return true;
  });
});

test("new job defaults to the API-supported EUR currency", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "https://example.test/api/v1/jobs");
    assert.equal(init.method, "POST");
    const body = JSON.parse(init.body);
    assert.equal(body.currency, "EUR");
    return json({ id: "job", ...body }, 201);
  };
  const job = await client().createJob({
    title: "Review report", raw_description: "Review the supplied report.",
    budget_min: 10, budget_max: 20,
  });
  assert.equal(job.currency, "EUR");
});

test("JSON validation details remain structured", async () => {
  const detail = [{ loc: ["body", "email"], msg: "Invalid email" }];
  globalThis.fetch = async () => json({ detail }, 422);
  await assert.rejects(client().me(), error => {
    assert.ok(error instanceof TaskMatchError);
    assert.deepEqual(error.detail, detail);
    return true;
  });
});

test("assignment methods use the real developer and task routes", async () => {
  globalThis.fetch = async url => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith("/developer/assignments")) {
      assert.deepEqual(Object.fromEntries(parsed.searchParams), { status: "active", limit: "100" });
      return json({ items: [{ id: "assignment", task_id: "task" }] });
    }
    assert.equal(parsed.pathname, "/api/v1/tasks/task/assignments/mine");
    return json({ items: [{ id: "assignment", agent_id: "mine", status: "active" }] });
  };
  const api = client();
  assert.equal((await api.listAssignments({ status: "active", limit: 100 })).items[0].task_id, "task");
  assert.equal((await api.listTaskAssignments("task")).items[0].agent_id, "mine");
});

test("runner discovers own active assignments and submits each task once", async () => {
  const submitted = [];
  globalThis.fetch = async (url, init) => {
    const path = new URL(url).pathname;
    if (path.endsWith("/developer/assignments")) return json({ items: [{ id: "foreign", task_id: "task" }, { id: "mine-active", task_id: "task" }] });
    if (path.endsWith("/assignments/mine")) return json({ items: [
      { id: "foreign", agent_id: "other", status: "active" },
      { id: "mine-old", agent_id: "mine", status: "completed" },
      { id: "mine-active", agent_id: "mine", status: "active" },
    ] });
    if (init.method === "GET") return json({ id: "task", status: "assigned" });
    submitted.push(JSON.parse(init.body));
    return json({ id: "submission" }, 201);
  };
  assert.deepEqual(await runner(client()).pollAssignmentsAndSubmit(), [{ id: "submission" }]);
  assert.deepEqual(submitted.map(item => item.assignment_id), ["mine-active"]);
});

test("empty task whitelist cannot bid on arbitrary tasks", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return json({ tasks: [{ id: "task" }], total: 1 }); };
  assert.deepEqual(await runner(client(), { taskTypes: [] }).runOnce(), []);
  assert.equal(calls, 0);
});

test("runner reads every open task page and ignores only duplicate bids", async () => {
  const pages = [];
  globalThis.fetch = async (url, init) => {
    if (init.method === "GET") {
      const skip = Number(new URL(url).searchParams.get("skip") || 0);
      pages.push(skip);
      return json({ tasks: [{ id: String(skip), task_type: "writing" }], total: 2 });
    }
    const body = JSON.parse(init.body);
    assert.equal(body.confidence_score, 0.8);
    return body.task_id === "0" ? json({ detail: "Already bid" }, 409) : json({ id: "new-bid" }, 201);
  };
  assert.deepEqual(await runner(client(), { taskTypes: ["writing"] }).runOnce(), [{ id: "new-bid" }]);
  assert.deepEqual(pages, [0, 1]);
});

test("failed submission leaves output metadata intact and does not replay POST", async () => {
  const output = { result: "ok", _summary: "Keep for retry", _artifact_urls: ["https://example.test/a"] };
  let posts = 0;
  globalThis.fetch = async (url, init) => {
    if (init.method === "GET") return json({ id: "task", status: "assigned" });
    posts++;
    const body = JSON.parse(init.body);
    assert.deepEqual(body.output_json, { result: "ok" });
    assert.equal(body.summary, output._summary);
    return json({ detail: "Unavailable" }, 503);
  };
  await assert.rejects(runner(client(), { handler: () => output }).handleDispatch("task", "assignment"), TaskMatchError);
  assert.equal(output._summary, "Keep for retry");
  assert.equal(posts, 1);
});

test("explicit empty assignment map performs no HTTP requests", async () => {
  globalThis.fetch = async () => { assert.fail("Unexpected request"); };
  assert.deepEqual(await runner(client()).pollAssignmentsAndSubmit({}), []);
});

test("heartbeat and submission lists preserve backend request and response shapes", async () => {
  globalThis.fetch = async (url, init) => {
    if (init.method === "POST") {
      assert.equal(new URL(url).pathname, "/api/v1/agents/mine/heartbeat");
      assert.deepEqual(JSON.parse(init.body), { status: "paused", current_load: 0 });
      return json({ id: "mine", status: "paused" });
    }
    assert.equal(new URL(url).pathname, "/api/v1/tasks/task/submissions");
    return json([]);
  };
  const api = client();
  assert.equal((await api.heartbeat("mine", { status: "paused", current_load: 0 })).status, "paused");
  assert.deepEqual(await api.listSubmissions("task"), []);
});


test("human contracts preserve idempotency key and use the result endpoint", async () => {
  const seen=[];
  globalThis.fetch=async (url,init)=>{ seen.push({url,init}); return json({task_id:"human"}); };
  const api=client();
  await api.createHumanTask({schema_version:"tm.human-task.v1"},"operation-1");
  assert.equal(seen[0].init.headers["Idempotency-Key"],"operation-1");
  assert.equal(seen[0].url,"https://example.test/api/v1/human-tasks");
  await api.getHumanResult("human");
  assert.equal(seen[1].url,"https://example.test/api/v1/human-tasks/human/result");
});

test("human workflow wrappers preserve routes, bodies, account token and operation keys", async () => {
  const seen = [];
  globalThis.fetch = async (url, init) => {
    seen.push({path:new URL(url).pathname,method:init.method,body:init.body === undefined ? undefined : JSON.parse(init.body),headers:init.headers});
    return json({status:"creating"}, init.method === "POST" ? 202 : 200);
  };
  const api = client();
  const contract = {schema_version:"tm.human-task.v1",principal_id:"principal",title:"Additional review"};
  const ai = {title:"Analyse the evidence",instructions:"Summarise the verified findings",task_type:"research",depends_on:["task"]};
  const cases = [
    [()=>api.getHumanTaskFunding("task ?"),"GET","/human-tasks/task%20%3F/fund",undefined],
    [()=>api.fundHumanTask("task"),"POST","/human-tasks/task/fund",undefined],
    [()=>api.recoverHumanTaskFunding("task",{payment_intent_id:"pi_confirmed"}),"POST","/human-tasks/task/fund/recover",{payment_intent_id:"pi_confirmed"}],
    [()=>api.getPrincipalPaymentMethod("principal"),"GET","/principals/principal/payment-method",undefined],
    [()=>api.setupPrincipalPaymentMethod("principal",{allow_agent_payments:true}),"POST","/principals/principal/payment-method/setup",{allow_agent_payments:true}],
    [()=>api.confirmPrincipalPaymentMethod("principal"),"POST","/principals/principal/payment-method/confirm",{}],
    [()=>api.revokePrincipalPaymentMethod("principal"),"DELETE","/principals/principal/payment-method",undefined],
    [()=>api.getHumanTaskDependencies("task"),"GET","/human-tasks/task/dependencies",undefined],
    [()=>api.setHumanTaskDependencies("task",["first"]),"PUT","/human-tasks/task/dependencies",{depends_on:["first"]}],
    [()=>api.createJobAmendment("job",contract,"amendment-1"),"POST","/jobs/job/amendments",contract],
    [()=>api.addJobAIStep("job",ai),"POST","/jobs/job/steps",ai],
    [()=>api.listJobSteps("job"),"GET","/jobs/job/steps",undefined],
    [()=>api.createPrincipalWebhook("principal",{url:"https://hooks.example.test/events",delegation_id:"mandate"}),"POST","/principals/principal/webhooks",{url:"https://hooks.example.test/events",delegation_id:"mandate"}],
    [()=>api.listPrincipalWebhooks("principal"),"GET","/principals/principal/webhooks",undefined],
    [()=>api.revokePrincipalWebhook("principal","hook ?"),"DELETE","/principals/principal/webhooks/hook%20%3F",undefined],
    [()=>api.listPrincipalWebhookDeliveries("principal","hook"),"GET","/principals/principal/webhooks/hook/deliveries",undefined],
  ];
  for(const [invoke,method,path,body] of cases) {
    await invoke();
    const request=seen.at(-1);
    assert.equal(request.method,method);
    assert.equal(request.path,"/api/v1"+path);
    assert.deepEqual(request.body,body);
    assert.equal(request.headers.Authorization,"Bearer token");
  }
  assert.equal(seen.length,cases.length);
  assert.equal(seen[9].headers["Idempotency-Key"],"amendment-1");
  assert.equal(api.token,"token");
});

test("funding does not retry a failed write or replace a scoped token", async () => {
  let attempts=0;
  globalThis.fetch=async(url,init)=>{
    attempts++;
    assert.equal(init.headers.Authorization,"Bearer scoped-mandate");
    assert.equal(init.method,"POST");
    return json({detail:{status:"requires_review"}},409);
  };
  const api=new TaskMatchClient({baseUrl:"https://example.test/api",token:"scoped-mandate"});
  await assert.rejects(api.fundHumanTask("task"),error=>error instanceof TaskMatchError && error.statusCode===409 && error.detail.status==="requires_review");
  assert.equal(attempts,1);
  assert.equal(api.token,"scoped-mandate");
});

test("amendment retries are explicit and preserve the same key and contract", async () => {
  const seen=[];
  const contract={title:"Additional review",budget:{amount_minor:1100,currency:"EUR"}};
  globalThis.fetch=async(url,init)=>{seen.push(init);return json({task_id:"same-task"},201);};
  const api=client();
  assert.deepEqual(await api.createJobAmendment("job",contract,"stable-amendment"),{task_id:"same-task"});
  assert.equal(seen.length,1);
  await api.createJobAmendment("job",contract,"stable-amendment");
  assert.equal(seen.length,2);
  assert.equal(seen[0].headers["Idempotency-Key"],seen[1].headers["Idempotency-Key"]);
  assert.equal(seen[0].body,seen[1].body);
});

test("payment setup transmits explicit consent without elevating caller credentials", async () => {
  let attempts=0;
  globalThis.fetch=async(url,init)=>{
    attempts++;
    assert.equal(init.headers.Authorization,"Bearer scoped-mandate");
    assert.deepEqual(JSON.parse(init.body),{allow_agent_payments:true});
    return json({detail:"Full owner session required"},401);
  };
  const api=new TaskMatchClient({token:"scoped-mandate"});
  await assert.rejects(api.setupPrincipalPaymentMethod("principal",{allow_agent_payments:true}),TaskMatchError);
  assert.equal(attempts,1);
  assert.equal(api.token,"scoped-mandate");
});
