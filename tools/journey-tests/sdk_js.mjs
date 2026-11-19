/** Real HTTP SDK smoke: disposable accounts, agents and unfunded drafts only.
 * node tools/journey-tests/sdk_js.mjs --api http://127.0.0.1:3172 --human
 * Builds a temporary SDK copy; never replaces fetch or installs an HTTP mock.
 */
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const checks = [];
let stage = "local API guard";
let ErrorClass;
let temporary;

function check(condition, description) {
  if (!condition) throw new Error(description);
  checks.push(description);
}

async function errorStatus(invoke, status, description) {
  try {
    await invoke();
  } catch (error) {
    if (!(error instanceof ErrorClass)) throw error;
    check(error.statusCode === status, description);
    check(error.response?.status === status, `${description} response status`);
    check(error.detail !== undefined && error.detail !== null, `${description} detail preserved`);
    return;
  }
  throw new Error(description);
}

async function main() {
  const args = process.argv.slice(2);
  const index = args.indexOf("--api");
  if (index < 0 || !args[index + 1]) throw new Error("An explicit disposable API origin is required");
  const origin = args[index + 1].replace(/\/$/, "");
  const url = new URL(origin);
  const human = args.includes("--human");
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(url.hostname)
      || !["3171", "3172"].includes(url.port) || url.username || url.password
      || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Only explicitly provisioned loopback journey APIs are allowed");
  }
  if (human && url.port !== "3172") throw new Error("Human mode requires isolated paid API 3172");

  stage = "temporary SDK TypeScript build";
  temporary = mkdtempSync(join(tmpdir(), "taskmatch-sdk-http-"));
  const sdk = join(temporary, "sdk-js");
  cpSync(join(root, "sdk/js"), sdk, {
    recursive: true,
    filter: source => !["node_modules", "dist"].includes(source.split("/").at(-1)),
  });
  execFileSync(join(root, "frontend/node_modules/.bin/tsc"), ["-p", join(sdk, "tsconfig.json")], {
    cwd: sdk, stdio: "pipe", timeout: 30_000,
  });
  const { TaskMatchClient, TaskMatchError } = await import(pathToFileURL(join(sdk, "dist/index.js")));
  ErrorClass = TaskMatchError;
  const baseUrl = origin + "/api";
  const developer = new TaskMatchClient({ baseUrl });
  const owner = new TaskMatchClient({ baseUrl });
  const anonymous = new TaskMatchClient({ baseUrl });
  const run = randomUUID().replaceAll("-", "");
  const password = "SDK-journey+password&2026-" + run;

  async function setup(method, path, client, body) {
    const response = await fetch(baseUrl + "/v1/" + path, {
      method, redirect: "error", signal: AbortSignal.timeout(15_000),
      headers: { Authorization: "Bearer " + client.token, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) throw new Error("Direct HTTP setup returned an unexpected status");
    return response.json();
  }

  stage = "new developer registration and login";
  const email = "sdk-js-dev-" + run + "@example.com";
  const registration = { email, password, full_name: "SDK JavaScript Developer", role: "agent_developer" };
  const user = await developer.register(registration);
  check(user.role === "agent_developer", "fresh developer registration");
  check(Boolean(await developer.login(email, password)), "developer form login");
  check((await developer.me()).id === user.id, "developer bearer identity");
  await errorStatus(() => developer.register(registration), 409, "duplicate account conflict");
  await errorStatus(() => anonymous.me(), 401, "anonymous session denial");

  stage = "owned executor and list envelopes";
  const agent = await developer.registerAgent({
    name: "SDK JavaScript " + run, endpoint_url: "https://example.test/worker",
    supported_task_types: ["writing", "research"],
  });
  check(agent.developer_user_id === user.id, "owned agent registration");
  check((await developer.heartbeat(agent.id, { status: "paused" })).status === "paused", "heartbeat pause");
  check((await developer.getAgent(agent.id)).status === "paused", "pause persisted");
  await developer.heartbeat(agent.id, { status: "active", current_load: 0.1 });
  const stored = await developer.getAgent(agent.id);
  check(stored.status === "active" && Boolean(stored.last_heartbeat_at), "active heartbeat timestamp persisted");
  for (const [response, key, description] of [
    [await developer.listAgents({ limit: 100 }), "agents", "agent list envelope"],
    [await developer.listOpenTasks({ limit: 1 }), "tasks", "open task list envelope"],
    [await developer.listTasks({ limit: 1 }), "tasks", "task list envelope"],
    [await developer.listJobs({ limit: 1 }), "jobs", "developer job list envelope"],
  ]) check(Array.isArray(response[key]) && Number.isInteger(response.total), description);
  const assignments = await developer.listAssignments({ status: "active", limit: 100 });
  check(Array.isArray(assignments.items) && assignments.items.length === 0, "fresh developer assignment envelope");
  check(typeof await developer.getAgentStats(agent.id) === "object", "agent statistics response");

  stage = "new client and default currency draft";
  const ownerEmail = "sdk-js-client-" + run + "@example.com";
  const clientUser = await owner.register({ email: ownerEmail, password, full_name: "SDK JavaScript Client", role: "client" });
  await owner.login(ownerEmail, password);
  check((await owner.me()).id === clientUser.id, "fresh client registration and login");
  const draft = await owner.createJob({
    title: "SDK default currency " + run, raw_description: "Review a report in an unfunded SDK draft.",
    budget_min: 10, budget_max: 20,
  });
  check(draft.currency === "EUR" && draft.status === "draft", "default EUR draft created");
  check((await owner.getJob(draft.id)).currency === "EUR", "default EUR draft persisted");
  check((await owner.listJobs()).jobs.some(job => job.id === draft.id), "owner job list");
  await errorStatus(() => developer.getJob(draft.id), 403, "private draft denied to developer");
  await errorStatus(() => owner.createJob({
    title: "Unsupported currency", raw_description: "Unfunded draft.", budget_min: 10, budget_max: 20, currency: "USD",
  }), 422, "unsupported currency validation");

  if (human) {
    stage = "human schema and direct draft";
    const schema = await setup("GET", "human-tasks/schema", developer);
    const taxonomy = await setup("GET", "human-tasks/taxonomy", developer);
    check(schema.properties.schema_version.const === "tm.human-task.v1", "human schema contract");
    check(taxonomy.version === "tm.taxonomy.v1", "human taxonomy version");
    const principal = await setup("POST", "principals", developer, {
      kind: "individual", display_name: "SDK JavaScript Principal",
    });
    const contract = {
      schema_version: "tm.human-task.v1", principal_id: principal.id, requester_type: "HUMAN_REQUESTER",
      title: "SDK JavaScript translation review", objective: "Find translation errors",
      instructions: "Read the supplied text.", task_category: "translation_review", execution_mode: "remote",
      required_capabilities: ["translation"], language: "fr",
      deadline: new Date(Date.now() + 2 * 86400_000).toISOString(), expected_duration: 30,
      budget: { amount_minor: 1100, currency: "EUR" }, evidence_requirements: ["report"],
      authorizations: ["data_owner_consent"],
    };
    const key = "js-direct-" + run;
    const task = await developer.createHumanTask(contract, key);
    check((await developer.createHumanTask(contract, key)).task_id === task.task_id, "direct task identical-content replay");
    check((await developer.getHumanTask(task.task_id)).policy_status === "pending", "direct human draft remains unreviewed");
    check((await developer.getHumanResult(task.task_id)).ready === false, "unreviewed result not ready");
    check(Array.isArray((await developer.listHumanTasks()).items), "human list envelope");
    check(Array.isArray((await developer.humanTaskEvents(task.task_id)).items), "events envelope");
    check(typeof await developer.getHumanTaskDependencies(task.task_id) === "object", "dependency read contract");
    check(Array.isArray((await developer.listJobSteps(task.parent_job_id)).items), "job steps envelope");
    await errorStatus(() => developer.createHumanTask({ ...contract, title: "Changed content" }, key),
      409, "changed-content replay rejected");
    await errorStatus(() => owner.getHumanTask(task.task_id), 403, "human tenant privacy");

    stage = "delegated draft and scoped denials";
    const delegation = await setup("POST", `principals/${principal.id}/delegations`, developer, {
      agent_id: agent.id, max_amount_minor: 1100, categories: ["translation_review"],
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    });
    const scoped = new TaskMatchClient({ baseUrl, token: delegation.access_token });
    const delegatedContract = { ...contract, requester_type: "AGENT_REQUESTER", requesting_agent_id: agent.id, delegation_id: delegation.id };
    const delegatedKey = "js-delegated-" + run;
    const delegated = await scoped.createHumanTask(delegatedContract, delegatedKey);
    check((await scoped.createHumanTask(delegatedContract, delegatedKey)).task_id === delegated.task_id, "delegated task replay");
    check((await scoped.getHumanTask(delegated.task_id)).delegation_id === delegation.id, "delegated task read");
    await errorStatus(() => scoped.me(), 401, "scoped session denial");
    await errorStatus(() => scoped.getPrincipalPaymentMethod(principal.id), 401, "scoped owner payment read denial");
    await errorStatus(() => scoped.getHumanTask(task.task_id), 403, "scoped unrelated task denial");
    await errorStatus(() => scoped.createHumanTask(delegatedContract, "js-over-budget-" + run),
      409, "delegation spending cap");
    check(scoped.token === delegation.access_token, "scoped token unchanged after denials");
    await setup("DELETE", `principals/${principal.id}/delegations/${delegation.id}`, developer);
    await errorStatus(() => scoped.getHumanTask(delegated.task_id), 403, "revoked mandate denial");
  }
  console.log(JSON.stringify({ suite: "javascript-sdk-real-http", api: origin, human,
    passed: checks.length, checks, financial_operations: 0 }));
}

try {
  await main();
} catch (error) {
  // Never print API error text, request bodies, tokens or delegation secrets.
  console.error(JSON.stringify({ suite: "javascript-sdk-real-http", failed_stage: stage,
    error_type: error?.name, status: ErrorClass && error instanceof ErrorClass ? error.statusCode : null,
    checks_passed: checks.length }));
  process.exitCode = 1;
} finally {
  if (temporary) rmSync(temporary, { recursive: true, force: true });
}
