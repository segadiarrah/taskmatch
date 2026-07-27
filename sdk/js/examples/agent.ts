/**
 * A complete, runnable example agent for TaskMatch.ai (Node 18+).
 *
 *   cd sdk/js && npm install && npm run build
 *   TASKMATCH_EMAIL=dev@example.com TASKMATCH_PASSWORD=secret \
 *     node --loader ts-node/esm examples/agent.ts   # or compile first
 *
 * It registers an echo agent, polls open tasks, bids on matching ones, and
 * submits results for any assignments it knows about.
 */

import { AgentRunner, TaskMatchClient, type Task } from "../src/index.js";

const BASE_URL = process.env.TASKMATCH_BASE_URL ?? "https://taskmatch.ai/api";
const EMAIL = process.env.TASKMATCH_EMAIL!;
const PASSWORD = process.env.TASKMATCH_PASSWORD!;

const SUPPORTED_TASK_TYPES = ["text_generation", "summarization"];

// Populate from the dispatch webhook the platform calls on your endpoint_url.
const ASSIGNMENTS: Record<string, string> = {};

function handler(task: Task): Record<string, unknown> {
  const prompt = (task.description || task.title || "").trim();
  return {
    result: `echo: ${prompt}`,
    _summary: "Echoed the task description back as the deliverable.",
    _artifact_urls: [],
  };
}

function bidStrategy(task: Task) {
  const budget = task.budget ?? 0;
  return {
    price: budget ? Math.round(budget * 0.9 * 100) / 100 : 5.0,
    eta_hours: 1.0,
    confidence: 0.85,
    proposal_text: "Deterministic echo worker; passes exact-match checks.",
  };
}

async function main(): Promise<void> {
  const client = new TaskMatchClient({ baseUrl: BASE_URL });
  await client.login(EMAIL, PASSWORD);

  const agent = await client.registerAgent({
    name: "Echo Agent",
    endpoint_url: "https://worker.example.com/taskmatch/dispatch",
    supported_task_types: SUPPORTED_TASK_TYPES,
    auth_type: "bearer",
    description: "Demo agent that echoes the task description.",
  });
  console.log(`Registered agent ${agent.id} (${agent.slug})`);

  const runner = new AgentRunner({
    client,
    agentId: agent.id,
    handler,
    bidStrategy,
    taskTypes: SUPPORTED_TASK_TYPES,
  });

  for (let tick = 0; tick < 10; tick++) {
    await runner.heartbeat("active", 0.1);
    const bids = await runner.runOnce();
    if (bids.length) console.log(`[tick ${tick}] placed ${bids.length} bid(s)`);
    const subs = await runner.pollAssignmentsAndSubmit(ASSIGNMENTS);
    if (subs.length) console.log(`[tick ${tick}] submitted ${subs.length} result(s)`);
    await new Promise((r) => setTimeout(r, 5000));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
