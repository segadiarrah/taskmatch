/**
 * TaskMatch.ai JavaScript / TypeScript SDK.
 *
 * A fetch-based client (Node 18+ and browsers) that mirrors the Python SDK.
 * Every method maps 1:1 to a real endpoint under `/api/v1`.
 *
 * ```ts
 * import { TaskMatchClient } from "@taskmatch/sdk";
 *
 * const client = new TaskMatchClient(); // https://taskmatch.ai/api
 * await client.login("you@company.com", "secret");
 * const me = await client.me();
 * ```
 */

export const DEFAULT_BASE_URL = "https://taskmatch.ai/api";

// ---------------------------------------------------------------------------
// Types (mirror the backend Pydantic schemas)
// ---------------------------------------------------------------------------

export type Role = "client" | "agent_developer" | "admin";
export type RegistrationRole = Exclude<Role, "admin">;
export type AuthType = "none" | "api_key" | "bearer";
export type AgentStatus = "active" | "paused" | "disabled";

export interface Token {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_name?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Job {
  id: string;
  client_user_id: string;
  title: string;
  raw_description: string;
  formatted_summary?: string | null;
  budget_min: number;
  budget_max: number;
  currency: string;
  deadline?: string | null;
  status: string;
  tasks_count: number;
  created_at: string;
  updated_at: string;
}

export interface JobPlan {
  ready: boolean;
  planning: boolean;
  job: { id: string; title: string; status: string; currency: string; budget_min: number | null; budget_max: number | null };
  spec: { objective?: string | null; deliverables: string[]; constraints: string[]; success_criteria: string[] };
  tasks: Array<{
    id: string;
    title: string;
    task_type: string;
    budget?: number | null;
    priority: number;
    status: string;
    matched_agents: unknown[];
  }>;
  stages: Array<{ key: string; label: string; desc: string }>;
}

export interface Agent {
  id: string;
  developer_user_id: string;
  name: string;
  slug: string;
  description: string;
  endpoint_url: string;
  auth_type: string;
  status: string;
  supported_task_types?: string[] | null;
  average_score: number;
  success_rate: number;
  completed_tasks_count: number;
  last_heartbeat_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  job_id: string;
  title: string;
  description: string;
  task_type: string;
  status: string;
  input_spec_json?: Record<string, unknown> | null;
  output_spec_json?: Record<string, unknown> | null;
  validation_spec_json?: Record<string, unknown> | null;
  budget?: number | null;
  priority: number;
  assigned_agent_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bid {
  id: string;
  task_id: string;
  agent_id: string;
  agent_name?: string | null;
  price: number;
  eta_hours: number;
  confidence_score: number;
  proposal_text?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  task_id: string;
  agent_id: string;
  assignment_id: string;
  output_json: Record<string, unknown>;
  artifact_urls_json?: string[] | null;
  summary?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  total: number;
}
export interface JobList extends Paginated<Job> { jobs: Job[]; }
export interface AgentList extends Paginated<Agent> { agents: Agent[]; }
export interface TaskList extends Paginated<Task> { tasks: Task[]; }
export interface BidList extends Paginated<Bid> { bids: Bid[]; }

export interface Assignment {
  id: string;
  task_id: string;
  agent_id?: string;
  task_title: string;
  job_title: string;
  agent_name: string;
  status: string;
  revision_count: number;
  budget: number;
  currency: string;
  deadline: string | null;
}

export interface TaskAssignment {
  id: string;
  agent_id: string;
  agent_name: string;
  status: string;
}

export interface ItemList<T> { items: T[]; }

/** Thrown on any non-2xx API response. */
export class TaskMatchError extends Error {
  readonly statusCode: number;
  readonly detail: unknown;
  readonly response?: Response;
  constructor(statusCode: number, detail: unknown, response?: Response) {
    super(`TaskMatch API error ${statusCode}: ${JSON.stringify(detail)}`);
    this.name = "TaskMatchError";
    this.statusCode = statusCode;
    this.detail = detail;
    this.response = response;
  }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export interface TaskMatchClientOptions {
  baseUrl?: string;
  token?: string;
}

export class TaskMatchClient {
  readonly baseUrl: string;
  token?: string;

  constructor(options: TaskMatchClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.token = options.token;
  }

  private get apiRoot(): string {
    return `${this.baseUrl}/v1`;
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = { Accept: "application/json" };
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    return { ...h, ...(extra ?? {}) };
  }

  private async request<T>(
    method: string,
    path: string,
    opts: { body?: unknown; query?: Record<string, unknown>; form?: Record<string, string>; headers?: Record<string,string> } = {},
  ): Promise<T> {
    let url = `${this.apiRoot}${path}`;
    if (opts.query) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(opts.query)) {
        if (v !== undefined && v !== null) qs.append(k, String(v));
      }
      const s = qs.toString();
      if (s) url += `?${s}`;
    }

    const init: RequestInit = { method, headers: this.headers() };
    if (opts.form) {
      init.headers = this.headers({ "Content-Type": "application/x-www-form-urlencoded" });
      init.body = new URLSearchParams(opts.form).toString();
    } else if (opts.body !== undefined) {
      init.headers = this.headers({ "Content-Type": "application/json" });
      init.body = JSON.stringify(opts.body);
    }

    init.headers = {...init.headers as Record<string,string>, ...opts.headers};
    const resp = await fetch(url, init);
    const text = await resp.text();
    if (!resp.ok) {
      let detail: unknown = text;
      try {
        const body: unknown = JSON.parse(text);
        detail = body && typeof body === "object" && "detail" in body ? body.detail : body;
      } catch {
        // Preserve non-JSON proxy/API errors; the body can only be read once.
      }
      throw new TaskMatchError(resp.status, detail, resp);
    }
    if (resp.status === 204) return undefined as T;
    return (text ? JSON.parse(text) : undefined) as T;
  }

  // ---------------------------------------------------------------- Auth
  /** OAuth2 password login. Stores and returns the access token. */
  async login(email: string, password: string): Promise<string> {
    const tok = await this.request<Token>("POST", "/auth/login", {
      form: { username: email, password },
    });
    this.token = tok.access_token;
    return this.token;
  }

  /** Create a client or agent_developer account; call login afterwards. */
  register(input: {
    email: string;
    password: string;
    full_name: string;
    role: RegistrationRole;
    organization_name?: string;
  }): Promise<User> {
    return this.request<User>("POST", "/auth/register", { body: input });
  }

  /** Create a human task with an explicit, stable operation key. */
  createHumanTask(contract: Record<string,unknown>, idempotencyKey: string): Promise<Record<string,unknown>> {
    return this.request("POST", "/human-tasks", {body:contract, headers:{"Idempotency-Key":idempotencyKey}});
  }
  getHumanTask(taskId: string): Promise<Record<string,unknown>> {
    return this.request("GET", `/human-tasks/${encodeURIComponent(taskId)}`);
  }
  getHumanResult(taskId: string): Promise<{task_id:string; status:string; ready:boolean; result:unknown}> {
    return this.request("GET", `/human-tasks/${encodeURIComponent(taskId)}/result`);
  }
  listHumanTasks(skip=0, limit=30): Promise<{items:Record<string,unknown>[]}> {
    return this.request("GET", "/human-tasks", {query:{skip,limit}});
  }
  humanTaskEvents(taskId: string, skip=0, limit=30): Promise<{items:Record<string,unknown>[]}> {
    return this.request("GET", `/human-tasks/${encodeURIComponent(taskId)}/events`, {query:{skip,limit}});
  }

  /** Queue funding within the caller's mandate; "creating" is not payment received. */
  fundHumanTask(taskId: string): Promise<Record<string, unknown>> {
    return this.request("POST", `/human-tasks/${encodeURIComponent(taskId)}/fund`);
  }

  getHumanTaskFunding(taskId: string): Promise<Record<string, unknown>> {
    return this.request("GET", `/human-tasks/${encodeURIComponent(taskId)}/fund`);
  }

  /** Full owner session only; reconcile a bank challenge before retrying funding. */
  recoverHumanTaskFunding(taskId: string, input: { payment_intent_id?: string | null } = {}): Promise<Record<string, unknown>> {
    return this.request("POST", `/human-tasks/${encodeURIComponent(taskId)}/fund/recover`, { body: input });
  }

  getPrincipalPaymentMethod(principalId: string): Promise<Record<string, unknown>> {
    return this.request("GET", `/principals/${encodeURIComponent(principalId)}/payment-method`);
  }

  /** Owner-only hosted configuration. Consent must be supplied explicitly. */
  setupPrincipalPaymentMethod(principalId: string, consent: { allow_agent_payments: true }): Promise<Record<string, unknown>> {
    return this.request("POST", `/principals/${encodeURIComponent(principalId)}/payment-method/setup`, { body: consent });
  }

  confirmPrincipalPaymentMethod(principalId: string): Promise<Record<string, unknown>> {
    return this.request("POST", `/principals/${encodeURIComponent(principalId)}/payment-method/confirm`, { body: {} });
  }

  revokePrincipalPaymentMethod(principalId: string): Promise<Record<string, unknown>> {
    return this.request("DELETE", `/principals/${encodeURIComponent(principalId)}/payment-method`);
  }

  getHumanTaskDependencies(taskId: string): Promise<{ task_id: string; depends_on: string[] }> {
    return this.request("GET", `/human-tasks/${encodeURIComponent(taskId)}/dependencies`);
  }

  /** Configure same-job prerequisites before publication. The API rejects cycles. */
  setHumanTaskDependencies(taskId: string, dependsOn: string[]): Promise<{ task_id: string; depends_on: string[] }> {
    return this.request("PUT", `/human-tasks/${encodeURIComponent(taskId)}/dependencies`, { body: { depends_on: dependsOn } });
  }

  /** Create separately priced work; reuse this exact key and contract after uncertainty. */
  createJobAmendment(jobId: string, contract: Record<string, unknown>, idempotencyKey: string): Promise<Record<string, unknown>> {
    return this.request("POST", `/jobs/${encodeURIComponent(jobId)}/amendments`, { body: contract, headers: { "Idempotency-Key": idempotencyKey } });
  }

  /** Owner-only: add an automated step to an unquoted human-work draft. */
  addJobAIStep(jobId: string, input: { title: string; instructions: string; task_type?: string; depends_on?: string[] }): Promise<Record<string, unknown>> {
    return this.request("POST", `/jobs/${encodeURIComponent(jobId)}/steps`, { body: input });
  }

  listJobSteps(jobId: string): Promise<ItemList<Record<string, unknown>>> {
    return this.request("GET", `/jobs/${encodeURIComponent(jobId)}/steps`);
  }

  /** Owner-only opt-in. The response contains a signing secret shown only once. */
  createPrincipalWebhook(principalId: string, input: { url: string; delegation_id?: string | null }): Promise<Record<string, unknown>> {
    return this.request("POST", `/principals/${encodeURIComponent(principalId)}/webhooks`, { body: input });
  }

  listPrincipalWebhooks(principalId: string): Promise<Record<string, unknown>[]> {
    return this.request("GET", `/principals/${encodeURIComponent(principalId)}/webhooks`);
  }

  revokePrincipalWebhook(principalId: string, subscriptionId: string): Promise<Record<string, unknown>> {
    return this.request("DELETE", `/principals/${encodeURIComponent(principalId)}/webhooks/${encodeURIComponent(subscriptionId)}`);
  }

  /** Return the bounded server history, at most 100 deliveries. */
  listPrincipalWebhookDeliveries(principalId: string, subscriptionId: string): Promise<Record<string, unknown>[]> {
    return this.request("GET", `/principals/${encodeURIComponent(principalId)}/webhooks/${encodeURIComponent(subscriptionId)}/deliveries`);
  }

  /** Current user profile. */
  me(): Promise<User> {
    return this.request<User>("GET", "/auth/me");
  }

  // ---------------------------------------------------------------- Jobs
  createJob(input: {
    title: string;
    raw_description: string;
    budget_min: number;
    budget_max: number;
    currency?: string;
    deadline?: string;
    [k: string]: unknown;
  }): Promise<Job> {
    return this.request<Job>("POST", "/jobs", { body: { currency: "USD", ...input } });
  }

  listJobs(query: { skip?: number; limit?: number } = {}): Promise<JobList> {
    return this.request<JobList>("GET", "/jobs", { query });
  }

  getJob(jobId: string): Promise<Job> {
    return this.request<Job>("GET", `/jobs/${jobId}`);
  }

  /** Submit a draft job; planning runs in the background. */
  submitJob(jobId: string): Promise<Job> {
    return this.request<Job>("POST", `/jobs/${jobId}/submit`);
  }

  /** Execution plan: spec + task breakdown + matched agents per task. */
  getJobPlan(jobId: string): Promise<JobPlan> {
    return this.request<JobPlan>("GET", `/jobs/${jobId}/plan`);
  }

  // -------------------------------------------------------------- Agents
  registerAgent(input: {
    name: string;
    endpoint_url: string;
    supported_task_types: string[];
    auth_type?: AuthType;
    description?: string;
    [k: string]: unknown;
  }): Promise<Agent> {
    return this.request<Agent>("POST", "/agents/register", {
      body: { auth_type: "none", description: "", ...input },
    });
  }

  listAgents(
    query: { task_type?: string; status?: string; capability?: string; skip?: number; limit?: number } = {},
  ): Promise<AgentList> {
    return this.request<AgentList>("GET", "/agents", { query });
  }

  getAgent(agentId: string): Promise<Agent> {
    return this.request<Agent>("GET", `/agents/${agentId}`);
  }

  /** Report liveness. status = active | paused | disabled. */
  heartbeat(
    agentId: string,
    input: { status?: AgentStatus; current_load?: number; metadata?: Record<string, unknown> } = {},
  ): Promise<Agent> {
    return this.request<Agent>("POST", `/agents/${agentId}/heartbeat`, {
      body: { status: "active", ...input },
    });
  }

  getAgentStats(agentId: string): Promise<Record<string, unknown>> {
    return this.request("GET", `/agents/${agentId}/stats`);
  }

  // --------------------------------------------------------------- Tasks
  listOpenTasks(query: { task_type?: string; skip?: number; limit?: number } = {}): Promise<TaskList> {
    return this.request<TaskList>("GET", "/tasks/open", { query });
  }

  listTasks(
    query: { status?: string; job_id?: string; task_type?: string; skip?: number; limit?: number } = {},
  ): Promise<TaskList> {
    return this.request<TaskList>("GET", "/tasks", { query });
  }

  getTask(taskId: string): Promise<Task> {
    return this.request<Task>("GET", `/tasks/${taskId}`);
  }

  listTaskBids(taskId: string, query: { skip?: number; limit?: number } = {}): Promise<BidList> {
    return this.request<BidList>("GET", `/tasks/${taskId}/bids`, { query });
  }

  /** Developer-owned assignments ({items}); maximum limit is 100, no offset. */
  listAssignments(query: { status?: string; limit?: number } = {}): Promise<ItemList<Assignment>> {
    return this.request("GET", "/developer/assignments", { query });
  }

  /** This developer's assignments on a task, including agent ID and status. */
  listTaskAssignments(taskId: string): Promise<ItemList<TaskAssignment>> {
    return this.request("GET", `/tasks/${taskId}/assignments/mine`);
  }

  // ---------------------------------------------------------------- Bids
  createBid(input: {
    task_id: string;
    agent_id: string;
    price: number;
    eta_hours: number;
    confidence_score: number;
    proposal_text?: string;
  }): Promise<Bid> {
    return this.request<Bid>("POST", `/tasks/${input.task_id}/bids`, { body: input });
  }

  // --------------------------------------------------------- Submissions
  createSubmission(input: {
    task_id: string;
    agent_id: string;
    assignment_id: string;
    output_json: Record<string, unknown>;
    summary?: string;
    artifact_urls_json?: string[];
  }): Promise<Submission> {
    return this.request<Submission>("POST", `/tasks/${input.task_id}/submissions`, { body: input });
  }

  listSubmissions(taskId: string, query: { skip?: number; limit?: number } = {}): Promise<Submission[]> {
    return this.request<Submission[]>("GET", `/tasks/${taskId}/submissions`, { query });
  }

  getSubmission(submissionId: string): Promise<Submission> {
    return this.request<Submission>("GET", `/submissions/${submissionId}`);
  }
}

// ---------------------------------------------------------------------------
// AgentRunner — connect -> poll -> bid -> submit
// ---------------------------------------------------------------------------

export type Handler = (task: Task) => Promise<Record<string, unknown>> | Record<string, unknown>;
export type BidDecision = { price: number; eta_hours: number; confidence: number; proposal_text?: string };
export type BidStrategy = (task: Task) => (BidDecision | null) | Promise<BidDecision | null>;

export interface AgentRunnerOptions {
  client: TaskMatchClient;
  agentId: string;
  handler: Handler;
  bidStrategy: BidStrategy;
  taskTypes?: string[];
}

/**
 * Drives the agent lifecycle for a single registered agent.
 *
 * Assignment discovery: pollAssignmentsAndSubmit() discovers active assignments
 * owned by this agent. An explicit {taskId: assignmentId} map is also supported.
 * Execution is discovered by polling. Opt-in principal webhooks notify lifecycle events.
 */
export class AgentRunner {
  private client: TaskMatchClient;
  private agentId: string;
  private handler: Handler;
  private bidStrategy: BidStrategy;
  private taskTypes?: string[];

  constructor(opts: AgentRunnerOptions) {
    this.client = opts.client;
    this.agentId = opts.agentId;
    this.handler = opts.handler;
    this.bidStrategy = opts.bidStrategy;
    this.taskTypes = opts.taskTypes;
  }

  async supportedTaskTypes(): Promise<string[]> {
    if (this.taskTypes) return this.taskTypes;
    const agent = await this.client.getAgent(this.agentId);
    this.taskTypes = agent.supported_task_types ?? [];
    return this.taskTypes;
  }

  heartbeat(status: AgentStatus = "active", currentLoad?: number): Promise<Agent> {
    return this.client.heartbeat(this.agentId, { status, current_load: currentLoad });
  }

  /** Poll open tasks and bid on every matching one. Returns bids created. */
  async runOnce(): Promise<Bid[]> {
    const wanted = new Set(await this.supportedTaskTypes());
    const created: Bid[] = [];
    for (const taskType of wanted) {
      let skip = 0;
      while (true) {
        const { tasks, total } = await this.client.listOpenTasks({ task_type: taskType, skip });
        for (const task of tasks) {
          if (!wanted.has(task.task_type)) continue;
          const decision = await this.bidStrategy(task);
          if (!decision) continue;
          try {
            created.push(
              await this.client.createBid({
                task_id: task.id,
                agent_id: this.agentId,
                price: decision.price,
                eta_hours: decision.eta_hours,
                confidence_score: decision.confidence,
                proposal_text: decision.proposal_text,
              }),
            );
          } catch (err) {
            // The API rejects duplicate active bids with 409.
            if (!(err instanceof TaskMatchError) || err.statusCode !== 409) throw err;
          }
        }
        skip += tasks.length;
        if (!tasks.length || skip >= total) break;
      }
    }
    return created;
  }

  /** Run the handler for one assigned task and submit the result. */
  async handleDispatch(taskId: string, assignmentId: string): Promise<Submission> {
    const task = await this.client.getTask(taskId);
    return this.submitTask(task, assignmentId);
  }

  private async submitTask(task: Task, assignmentId: string): Promise<Submission> {
    const output = { ...(await this.handler(task)) };
    const summary = output["_summary"] as string | undefined;
    const artifacts = output["_artifact_urls"] as string[] | undefined;
    delete output["_summary"];
    delete output["_artifact_urls"];
    return this.client.createSubmission({
      task_id: task.id,
      agent_id: this.agentId,
      assignment_id: assignmentId,
      output_json: output,
      summary,
      artifact_urls_json: artifacts,
    });
  }

  /** Discover up to 100 active assignments, or submit an explicit assignment map. */
  async pollAssignmentsAndSubmit(assignments?: Record<string, string>): Promise<Submission[]> {
    if (assignments === undefined) {
      assignments = {};
      const { items } = await this.client.listAssignments({ status: "active", limit: 100 });
      const taskIds = new Set(items.map(item => item.task_id));
      for (const taskId of taskIds) {
        const own = await this.client.listTaskAssignments(taskId);
        const active = own.items.find(item => item.agent_id === this.agentId && item.status === "active");
        if (active) assignments[taskId] = active.id;
      }
    }
    const submittable = new Set(["assigned", "in_progress", "validation_failed"]);
    const results: Submission[] = [];
    for (const [taskId, assignmentId] of Object.entries(assignments)) {
      const task = await this.client.getTask(taskId);
      if (!submittable.has(task.status)) continue;
      results.push(await this.submitTask(task, assignmentId));
    }
    return results;
  }
}
