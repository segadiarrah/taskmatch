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
