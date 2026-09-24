/** Compose admin details from the actual resource and list endpoint contracts. */
type Get = <T>(path: string) => Promise<T>;

interface UserRecord { id: string; full_name: string; email: string; }
interface JobRecord {
  id: string; title: string; raw_description: string; formatted_summary: string | null;
  client_user_id: string; status: string; budget_min: number; budget_max: number;
  currency: string; deadline: string | null; created_at: string; updated_at: string;
}
interface TaskRecord {
  id: string; job_id: string; title: string; description: string; task_type: string;
  status: string; budget: number | null; priority: number;
  assigned_agent_id: string | null; created_at: string; updated_at: string;
}
interface AgentRecord {
  id: string; developer_user_id: string; name: string; status: string;
  description: string; endpoint_url: string; auth_type: string;
  capabilities: Array<{ capability_name: string }>;
  supported_task_types: string[] | null; success_rate: number; average_score: number;
  completed_tasks_count: number; created_at: string;
}
interface DecisionRecord {
  id: string; entity_type: string; entity_id: string; decision_type: string;
  reasoning: string | null; confidence: number | null; created_at: string;
}
interface MatchRecord {
  agent_id: string; agent_name: string; combined_score: number;
  capability_score: number; historical_score: number; reasons: string[];
}
interface BidRecord {
  id: string; agent_id: string; agent_name: string | null; price: number;
  eta_hours: number; proposal_text: string | null; status: string; created_at: string;
}
interface SubmissionRecord {
  id: string; agent_id: string; summary: string | null; status: string;
  artifact_urls_json: string[] | null; output_json: Record<string, unknown>; created_at: string;
}
interface ReviewRecord {
  id: string; submission_id: string; reviewer_user_id: string | null;
  decision: string; score: number | null; notes: string | null; created_at: string;
}
interface FeedbackRecord {
  id: string; author: string; category: string; note: string; created_at: string;
}

async function listPages<T>(get: Get, path: string): Promise<T[]> {
  const rows: T[] = [];
  for (let skip = 0; ; skip += 200) {
    const page = await get<T[]>(`${path}${path.includes("?") ? "&" : "?"}skip=${skip}&limit=200`);
    rows.push(...page);
    if (page.length < 200) return rows;
  }
}

async function envelopedPages<T>(get: Get, path: string, key: "tasks" | "bids"): Promise<T[]> {
  const rows: T[] = [];
  while (true) {
    const page = await get<{ tasks?: T[]; bids?: T[]; total: number }>(
      `${path}${path.includes("?") ? "&" : "?"}skip=${rows.length}&limit=200`,
    );
    const items = page[key];
    if (!Array.isArray(items)) throw new Error(`Missing ${key} in API response`);
    rows.push(...items);
    if (!items.length || rows.length >= page.total) return rows;
  }
}

export async function loadAdminJobDetail(get: Get, id: string) {
  const [job, tasks, decisions] = await Promise.all([
    get<JobRecord>(`/v1/jobs/${id}`),
    envelopedPages<TaskRecord>(get, `/v1/tasks?job_id=${encodeURIComponent(id)}`, "tasks"),
    listPages<DecisionRecord>(get, "/v1/dashboard/mcp-decisions"),
  ]);
  const client = await get<UserRecord>(`/v1/users/${job.client_user_id}`);
  const agents = new Map<string, string>();
  await Promise.all(Array.from(new Set(tasks.map(task => task.assigned_agent_id).filter((agentId): agentId is string => !!agentId))).map(async agentId => {
    const agent = await get<AgentRecord>(`/v1/agents/${agentId}`);
    agents.set(agentId, agent.name);
  }));
  const taskIds = new Set(tasks.map(task => task.id));
  return {
    ...job,
    client_name: client.full_name,
    description_raw: job.raw_description,
    description_formatted: job.formatted_summary,
    tasks: tasks.map(task => ({ ...task, assigned_agent: task.assigned_agent_id ? agents.get(task.assigned_agent_id) : undefined })),
    mcp_decisions: decisions.filter(decision =>
      (decision.entity_type.toLowerCase() === "job" && decision.entity_id === id) ||
      (decision.entity_type.toLowerCase() === "task" && taskIds.has(decision.entity_id))),
  };
}

export async function loadAdminAgentDetail(get: Get, id: string) {
  const [agent, stats, notes] = await Promise.all([
    get<AgentRecord>(`/v1/agents/${id}`),
    get<{ total_submissions: number; approved_submissions: number }>(`/v1/agents/${id}/stats`),
    listPages<FeedbackRecord>(get, `/v1/dashboard/feedback-notes?agent_id=${encodeURIComponent(id)}`),
  ]);
  const developer = await get<UserRecord>(`/v1/users/${agent.developer_user_id}`);
  return {
    ...agent,
    developer_name: developer.full_name,
    developer_email: developer.email,
    capabilities: Array.from(new Set([...agent.capabilities.map(cap => cap.capability_name), ...(agent.supported_task_types ?? [])])),
    avg_score: agent.average_score,
    completed_tasks: agent.completed_tasks_count,
    total_submissions: stats.total_submissions,
    approved_submissions: stats.approved_submissions,
    feedback_notes: notes.map(note => ({ ...note, content: note.note })),
  };
}

export async function loadAdminTaskDetail(get: Get, id: string) {
  const [task, matches, bids, submissions, reviews] = await Promise.all([
    get<TaskRecord>(`/v1/tasks/${id}`),
    get<MatchRecord[]>(`/v1/dashboard/agent-matching/${id}`),
    envelopedPages<BidRecord>(get, `/v1/tasks/${id}/bids`, "bids"),
    listPages<SubmissionRecord>(get, `/v1/tasks/${id}/submissions`),
    listPages<ReviewRecord>(get, `/v1/tasks/${id}/reviews`),
  ]);
  const job = await get<JobRecord>(`/v1/jobs/${task.job_id}`);
  const agentIds = new Set([...submissions.map(sub => sub.agent_id), ...bids.map(bid => bid.agent_id)]);
  if (task.assigned_agent_id) agentIds.add(task.assigned_agent_id);
  const agents = new Map<string, AgentRecord>();
  await Promise.all(Array.from(agentIds).map(async agentId => agents.set(agentId, await get<AgentRecord>(`/v1/agents/${agentId}`))));
  const assigned = task.assigned_agent_id ? agents.get(task.assigned_agent_id) : undefined;
  const reviewerIds = Array.from(new Set(reviews.map(review => review.reviewer_user_id).filter((userId): userId is string => !!userId)));
  const reviewers = new Map<string, string>();
  await Promise.all(reviewerIds.map(async userId => reviewers.set(userId, (await get<UserRecord>(`/v1/users/${userId}`)).full_name)));
  return {
    ...task,
    job_title: job.title,
    currency: job.currency,
    assigned_agent: assigned ? {
      agent_id: assigned.id, agent_name: assigned.name, avg_score: assigned.average_score,
      success_rate: assigned.success_rate, completed_tasks: assigned.completed_tasks_count,
    } : undefined,
    matched_agents: matches.map(match => ({ ...match, match_score: match.combined_score })),
    bids: bids.map(bid => ({ ...bid, agent_name: bid.agent_name ?? agents.get(bid.agent_id)?.name ?? bid.agent_id,
      amount: bid.price, estimated_hours: bid.eta_hours, message: bid.proposal_text })),
    submissions: submissions.map(sub => ({ ...sub, agent_name: agents.get(sub.agent_id)?.name ?? sub.agent_id,
      submitted_at: sub.created_at, deliverable_url: sub.artifact_urls_json?.[0] })),
    validations: reviews.map(review => ({ ...review, result: review.decision,
      reviewer: review.reviewer_user_id ? reviewers.get(review.reviewer_user_id) ?? review.reviewer_user_id : "MCP" })),
  };
}

export type AdminJobDetail = Awaited<ReturnType<typeof loadAdminJobDetail>>;
export type AdminAgentDetail = Awaited<ReturnType<typeof loadAdminAgentDetail>>;
export type AdminTaskDetail = Awaited<ReturnType<typeof loadAdminTaskDetail>>;
