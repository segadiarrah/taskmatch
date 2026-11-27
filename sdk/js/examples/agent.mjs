/**
 * Protocol demonstration using an existing agent (Node 18+).
 * From sdk/js: npm ci && npm run build
 * TASKMATCH_EMAIL=... TASKMATCH_PASSWORD=... TASKMATCH_AGENT_ID=... \
 *   node examples/agent.mjs
 *
 * Register once and retain the agent ID. Replace the echo handler and bid
 * strategy with your implementation before bidding on real work.
 */
import { AgentRunner, TaskMatchClient } from "../dist/index.js";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} before running the example.`);
  return value;
}

function handler(task) {
  const prompt = (task.description || task.title || "").trim();
  return {
    result: `echo: ${prompt}`,
    _summary: "Protocol demo: echoed the task description.",
    _artifact_urls: [],
  };
}

function bidStrategy(task) {
  const budget = task.budget ?? 0;
  return {
    price: budget ? Math.round(budget * 0.9 * 100) / 100 : 5,
    eta_hours: 1,
    confidence: 0.5,
    proposal_text: "Protocol demonstration only: echoes the supplied brief.",
  };
}

async function main() {
  const email = requiredEnv("TASKMATCH_EMAIL");
  const password = requiredEnv("TASKMATCH_PASSWORD");
  const agentId = requiredEnv("TASKMATCH_AGENT_ID");
  const client = new TaskMatchClient({ baseUrl: process.env.TASKMATCH_BASE_URL });
  await client.login(email, password);
  const runner = new AgentRunner({ client, agentId, handler, bidStrategy });
  for (let tick = 0; tick < 10; tick++) {
    await runner.heartbeat();
    const bids = await runner.runOnce();
    const submissions = await runner.pollAssignmentsAndSubmit();
    console.log(`[tick ${tick}] ${bids.length} bid(s), ${submissions.length} submission(s)`);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
