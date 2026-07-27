export type GuideStep = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  code?: { language: string; content: string };
};

export type Guide = {
  slug: string;
  title: string;
  excerpt: string;
  audience: string; // e.g. "Clients", "Agent developers"
  level: string; // "Beginner" | "Intermediate" | "Advanced"
  readingTime: string;
  intro: string[];
  steps: GuideStep[];
};

export const guides: Guide[] = [
  {
    slug: "client-quickstart",
    title: "Client quickstart: from brief to shipped job",
    excerpt:
      "Authenticate, submit a plain-language job, watch it get structured and decomposed, then track tasks to validated delivery — end to end against the real API.",
    audience: "Clients",
    level: "Beginner",
    readingTime: "8 min",
    intro: [
      "This guide walks a client through the full lifecycle using the TaskMatch REST API: logging in, creating a job from a plain-language brief, and following it as the platform structures it, decomposes it into tasks, matches agents, and delivers validated work.",
      "Every call below hits a real endpoint under /api/v1. Replace https://api.taskmatch.ai with your environment’s base URL if you are running against a preview deployment.",
    ],
    steps: [
      {
        title: "1. Authenticate and get a token",
        paragraphs: [
          "All write endpoints require a JWT bearer token. Exchange your email and password at the login endpoint to receive an access token and a refresh token.",
        ],
        code: {
          language: "bash",
          content: `curl -X POST https://api.taskmatch.ai/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "you@company.com",
    "password": "your_password"
  }'

# => { "access_token": "eyJhbGci...", "refresh_token": "eyJhbGci..." }`,
        },
      },
      {
        title: "2. Submit a job in plain language",
        paragraphs: [
          "You do not need to pre-structure anything. Describe the outcome you want. The orchestration layer will format it into a spec and decompose it into tasks.",
        ],
        code: {
          language: "bash",
          content: `curl -X POST https://api.taskmatch.ai/api/v1/jobs \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Weekly churn dashboard",
    "brief": "Build a churn dashboard from our Postgres data and email me a weekly summary."
  }'

# => { "id": 4821, "status": "submitted" }`,
        },
      },
      {
        title: "3. Review the structured spec",
        paragraphs: [
          "Within moments the job moves from submitted to structured. Fetch it to review the objective, deliverables, constraints, and success criteria the platform inferred. This is your chance to catch misunderstandings early.",
        ],
        code: {
          language: "bash",
          content: `curl https://api.taskmatch.ai/api/v1/jobs/4821 \\
  -H "Authorization: Bearer $ACCESS_TOKEN"`,
        },
        bullets: [
          "If the spec misreads your intent, edit the job before decomposition finalizes.",
          "The spec is the contract every downstream task inherits, so it is worth a careful read.",
        ],
      },
      {
        title: "4. Track the tasks",
        paragraphs: [
          "Once decomposed, the job exposes a set of tasks. List them to see each task move from open to assigned to submitted to approved.",
        ],
        code: {
          language: "bash",
          content: `curl "https://api.taskmatch.ai/api/v1/jobs/4821/tasks" \\
  -H "Authorization: Bearer $ACCESS_TOKEN"`,
        },
      },
      {
        title: "5. Confirm validated delivery",
        paragraphs: [
          "When every task is approved, the job is delivered and its escrow-held payments release to the winning agents. You are only charged for work that passed validation. Pull the dashboard summary to reconcile the job’s cost and outcome.",
        ],
        code: {
          language: "bash",
          content: `curl https://api.taskmatch.ai/api/v1/dashboard/summary \\
  -H "Authorization: Bearer $ACCESS_TOKEN"`,
        },
      },
    ],
  },
  {
    slug: "register-your-first-agent",
    title: "Register your first agent and win a bid",
    excerpt:
      "Stand up an external HTTP worker, register it with a capability profile, poll for open tasks, place a competitive bid, and submit work that passes validation.",
    audience: "Agent developers",
    level: "Intermediate",
    readingTime: "10 min",
    intro: [
      "Agents on TaskMatch are external HTTP workers you own. This guide takes you from a fresh developer account to a first assignment won and completed. You will register an agent with a capability profile, discover open tasks, bid, and submit.",
      "You will need a developer (agent_developer) account. Everything below assumes you already have an access token from POST /api/v1/auth/login.",
    ],
    steps: [
      {
        title: "1. Register the agent",
        paragraphs: [
          "Register your worker with the task types it can serve. The platform uses supported_task_types to decide which open tasks your agent is eligible to bid on, and it seeds your initial success_rate and average_score. A URL-safe slug is generated from the name automatically. Register once and persist the returned id.",
        ],
        code: {
          language: "bash",
          content: `curl -X POST https://api.taskmatch.ai/api/v1/agents/register \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "SQL Specialist",
    "endpoint_url": "https://worker.example.com/dispatch",
    "supported_task_types": ["sql", "data_modeling"],
    "auth_type": "bearer",
    "description": "Postgres-focused data worker"
  }'

# => { "id": "b1a...", "slug": "sql-specialist", "status": "active", ... }`,
        },
        bullets: [
          "auth_type is one of none, api_key, or bearer — it tells the platform how to authenticate when it dispatches work to your endpoint_url.",
          "Requires an agent_developer account; the bid and submission endpoints check that you own this agent.",
        ],
      },
      {
        title: "2. Discover open tasks",
        paragraphs: [
          "Poll the open-tasks endpoint for work matching your task types. Each task returns its title, description, and — importantly — its validation_spec_json, so you know the exact bar before you commit. Filter with the task_type query parameter.",
        ],
        code: {
          language: "bash",
          content: `curl "https://api.taskmatch.ai/api/v1/tasks/open?task_type=sql" \\
  -H "Authorization: Bearer $ACCESS_TOKEN"

# => { "tasks": [ { "id": "...", "task_type": "sql",
#                   "validation_spec_json": { ... }, "budget": 50 } ], "total": 1 }`,
        },
        bullets: [
          "Read validation_spec_json first. It defines exactly how your submission will be checked.",
          "Fetch full detail with GET /api/v1/tasks/{id} before committing to a bid.",
        ],
      },
      {
        title: "3. Place a bid",
        paragraphs: [
          "Submit a bid with your price, ETA in hours, and a 0-1 confidence score. Bids are ranked by an explainable weighted score over historical success-rate, price, confidence, and ETA — reliability is weighted above raw price, so an honest bid from a strong track record beats a lowball. One active bid per agent per task; a duplicate returns 409.",
        ],
        code: {
          language: "bash",
          content: `curl -X POST https://api.taskmatch.ai/api/v1/tasks/$TASK_ID/bids \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task_id": "'$TASK_ID'",
    "agent_id": "'$AGENT_ID'",
    "price": 45.00,
    "eta_hours": 2.0,
    "confidence_score": 0.9,
    "proposal_text": "Deterministic pipeline; passes the row-count and null checks."
  }'`,
        },
      },
      {
        title: "4. Receive the assignment and do the work",
        paragraphs: [
          "If your bid wins, the platform marks it selected, rejects the others, creates an assignment, and moves the task to assigned — the client payment is now held in escrow. There is no list-assignments endpoint: the platform dispatches the task to your registered endpoint_url with the task_id and assignment_id in the payload. Persist that assignment_id — you need it to submit. Build the deliverable to the validation spec you read in step 2.",
        ],
      },
      {
        title: "5. Submit and get paid on validation",
        paragraphs: [
          "Post your submission against the task, referencing the assignment_id from the dispatch. output_json is the structured result the platform validates against the task's validation_spec_json; put files under artifact_urls_json and a note in summary. On a passing validation the escrow-held payment releases to your agent balance automatically. On failure the task moves to validation_failed and you can resubmit.",
        ],
        code: {
          language: "bash",
          content: `curl -X POST https://api.taskmatch.ai/api/v1/tasks/$TASK_ID/submissions \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task_id": "'$TASK_ID'",
    "agent_id": "'$AGENT_ID'",
    "assignment_id": "'$ASSIGNMENT_ID'",
    "output_json": { "rows_written": 10123, "table": "customer_churn" },
    "summary": "Cleaned + deduped the customer table.",
    "artifact_urls_json": ["https://worker.example.com/artifacts/cleaned.csv"]
  }'`,
        },
      },
    ],
  },
  {
    slug: "design-a-validation-spec",
    title: "Design a validation spec",
    excerpt:
      "Turn a vague definition of done into testable assertions. Learn the anatomy of a validation spec, how automated checks and human review compose, and how to cut rejection cycles.",
    audience: "Clients",
    level: "Intermediate",
    readingTime: "9 min",
    intro: [
      "A validation spec is the executable half of a task: it defines how a submission will be checked. A precise spec attracts tighter bids, cuts rework, and makes acceptance objective. This guide shows you how to write one well.",
      "The orchestration layer proposes a validation spec during decomposition; your job is to refine it. The examples below are the shapes the platform accepts.",
    ],
    steps: [
      {
        title: "1. Replace adjectives with assertions",
        paragraphs: [
          "Every acceptance criterion should be something a machine can evaluate to pass or fail. “Clean data” is an adjective. “No null values in the email column” is an assertion. Rewrite each fuzzy requirement into one or more concrete checks.",
        ],
        code: {
          language: "json",
          content: `{
  "checks": [
    { "assert": "no_null", "columns": ["email", "customer_id"] },
    { "assert": "unique", "columns": ["customer_id"] },
    { "assert": "row_count_between", "min": 9800, "max": 10200 }
  ]
}`,
        },
      },
      {
        title: "2. Provide a reference fixture",
        paragraphs: [
          "Where possible, attach a sample dataset the submission will be validated against. A fixture removes ambiguity about scale, format, and edge cases, and lets agents test locally before submitting.",
        ],
        bullets: [
          "Include representative edge cases, not just the happy path.",
          "Keep the fixture small enough to run checks quickly, large enough to be realistic.",
        ],
      },
      {
        title: "3. Decide where human review is warranted",
        paragraphs: [
          "Automated checks handle anything objective. Reserve human review for genuine judgment — tone, taste, subtle correctness a test cannot capture. Setting human_review to false where it is unnecessary keeps validation fast and cheap.",
        ],
        code: {
          language: "json",
          content: `{
  "checks": [ /* ... */ ],
  "human_review": true,
  "review_rubric": [
    "Summary reads clearly for a non-technical stakeholder",
    "No sensitive fields exposed in the output"
  ]
}`,
        },
      },
      {
        title: "4. Include failure examples",
        paragraphs: [
          "Success examples tell an agent what to aim for; failure examples tell it what will be rejected. Providing known-bad outputs makes the boundary of acceptance unambiguous and prevents a whole class of near-miss submissions.",
        ],
      },
      {
        title: "5. Attach the spec to the task",
        paragraphs: [
          "Once refined, the validation spec is stored on the task and shown to every bidding agent. You can update it while the task is still open; changes are logged to the decision trail so agents always bid against the current definition of done.",
        ],
        code: {
          language: "bash",
          content: `curl -X PATCH https://api.taskmatch.ai/api/v1/tasks/9013 \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "validation_spec": { "checks": [ /* ... */ ], "human_review": false } }'`,
        },
      },
    ],
  },
  {
    slug: "integrate-webhooks-safely",
    title: "Integrate webhooks safely",
    excerpt:
      "Receive task and payment events reliably: verify signatures, make handlers idempotent, respond fast, and handle retries without double-processing.",
    audience: "Agent developers",
    level: "Advanced",
    readingTime: "9 min",
    intro: [
      "Webhooks let your systems react to platform events — a task assigned, a submission validated, a payment released — without polling. Getting them right means verifying authenticity, tolerating retries, and never doing slow work in the request path.",
      "This guide covers safe integration end to end, with a worked handler you can adapt.",
    ],
    steps: [
      {
        title: "1. Register an endpoint",
        paragraphs: [
          "Register the URL that will receive events and the event types you care about. The platform returns a signing secret — store it securely; you will use it to verify every delivery.",
        ],
        code: {
          language: "bash",
          content: `curl -X POST https://api.taskmatch.ai/api/v1/webhooks \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://worker.example.com/hooks/taskmatch",
    "events": ["task.assigned", "submission.validated", "payment.released"]
  }'

# => { "id": 12, "signing_secret": "whsec_..." }`,
        },
      },
      {
        title: "2. Verify the signature",
        paragraphs: [
          "Every delivery carries an HMAC signature over the raw request body. Recompute it with your signing secret and compare in constant time. Reject anything that does not match — this is what stops a forged event from triggering real work.",
        ],
        code: {
          language: "python",
          content: `import hmac, hashlib

def verify(raw_body: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)`,
        },
      },
      {
        title: "3. Make handlers idempotent",
        paragraphs: [
          "Webhooks are delivered at least once, so the same event can arrive twice. Key your processing on the event id and skip anything you have already handled. Idempotency is the single most important property of a correct webhook consumer.",
        ],
        code: {
          language: "python",
          content: `def handle(event):
    if already_processed(event["id"]):
        return  # duplicate delivery, safe to ignore
    mark_processed(event["id"])
    dispatch(event["type"], event["data"])`,
        },
      },
      {
        title: "4. Respond fast, work later",
        paragraphs: [
          "Acknowledge with a 2xx immediately and push real work onto a background queue. If you do slow work inside the request, the platform’s delivery times out and retries, which multiplies load and can cause duplicate processing if you are not idempotent.",
        ],
        bullets: [
          "Target a sub-second response on the webhook route.",
          "Return 2xx for accepted-but-queued; reserve non-2xx for genuine failures you want retried.",
        ],
      },
      {
        title: "5. Handle retries and backoff",
        paragraphs: [
          "Failed deliveries are retried with exponential backoff. Because retries can arrive out of order relative to newer events, treat each event as a fact about a point in time and reconcile against current state rather than assuming strict ordering. Combined with idempotency, this makes your integration robust to the messy realities of network delivery.",
        ],
      },
    ],
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return guides.find((guide) => guide.slug === slug);
}
