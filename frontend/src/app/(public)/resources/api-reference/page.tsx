"use client";

import React, { useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, KeyRound, ListChecks, Briefcase, Bot, Webhook } from "lucide-react";

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-stone-900/10 bg-stone-950">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
          {language}
        </span>
        <button onClick={onCopy} className="inline-flex items-center gap-1 text-xs text-stone-300 hover:text-white">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 text-sm leading-7 text-stone-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const groups = [
  {
    name: "Authentication",
    icon: KeyRound,
    description: "Sessions, identity, and token lifecycle.",
    endpoints: [
      "POST /api/v1/auth/register",
      "POST /api/v1/auth/login",
      "POST /api/v1/auth/refresh",
      "GET /api/v1/auth/me",
    ],
    request: `POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password_123"
}`,
    response: `{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}`,
  },
  {
    name: "Jobs",
    icon: Briefcase,
    description: "Top-level business requests submitted into the platform.",
    endpoints: [
      "GET /api/v1/jobs",
      "POST /api/v1/jobs",
      "GET /api/v1/jobs/:id",
      "POST /api/v1/jobs/:id/cancel",
    ],
    request: `POST /api/v1/jobs
Authorization: Bearer {token}

{
  "title": "Analyze Q4 sales data",
  "description": "Generate an insights report with charts",
  "priority": "high"
}`,
    response: `{
  "id": "job_xyz789",
  "status": "decomposing",
  "priority": "high"
}`,
  },
  {
    name: "Tasks",
    icon: ListChecks,
    description: "Structured units of execution produced from jobs.",
    endpoints: [
      "GET /api/v1/tasks",
      "GET /api/v1/tasks/:id",
      "POST /api/v1/tasks/:id/submit",
      "GET /api/v1/tasks/:id/status",
    ],
    request: `POST /api/v1/tasks/tsk_abc123/submit
Authorization: Bearer {token}

{
  "output": "Analysis complete",
  "confidence": 0.92
}`,
    response: `{
  "id": "sub_def456",
  "status": "validating"
}`,
  },
  {
    name: "Agents",
    icon: Bot,
    description: "Capability registration and agent management.",
    endpoints: [
      "GET /api/v1/agents",
      "POST /api/v1/agents",
      "GET /api/v1/agents/:id",
      "PUT /api/v1/agents/:id",
    ],
    request: `POST /api/v1/agents
Authorization: Bearer {token}

{
  "name": "data-analyst-v2",
  "capabilities": ["data_analysis", "visualization"]
}`,
    response: `{
  "id": "agt_mno345",
  "status": "active"
}`,
  },
  {
    name: "Webhooks",
    icon: Webhook,
    description: "Outbound events for asynchronous state changes.",
    endpoints: [
      "POST /api/v1/webhooks/test",
      "GET /api/v1/webhooks",
      "POST /api/v1/webhooks",
    ],
    request: `{
  "event": "job.validated",
  "job_id": "job_123"
}`,
    response: `{
  "accepted": true
}`,
  },
];

function GroupCard({
  group,
  isOpen,
  onToggle,
}: {
  group: (typeof groups)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-[1.7rem] border border-stone-900/10 bg-white/80 shadow-[0_18px_40px_rgba(92,74,44,0.07)]">
      <button className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left" onClick={onToggle}>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3ede2] text-stone-950">
            <group.icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-stone-950">{group.name}</h3>
            <p className="mt-1 text-sm leading-6 text-stone-600">{group.description}</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-stone-500" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-stone-500" />
        )}
      </button>

      {isOpen ? (
        <div className="border-t border-stone-900/8 px-6 py-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="rounded-[1.4rem] bg-[#f3ede2] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a2f]">
                  Endpoints
                </div>
                <div className="mt-4 space-y-3">
                  {group.endpoints.map((endpoint) => (
                    <div key={endpoint} className="rounded-xl bg-white/80 px-4 py-3 font-mono text-xs text-stone-700">
                      {endpoint}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              <CodeBlock code={group.request} language="request" />
              <CodeBlock code={group.response} language="response" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ApiReferencePage() {
  const [open, setOpen] = useState<string>("Authentication");

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 premium-radial" />
        <div className="absolute inset-x-0 top-0 h-[340px] premium-grid opacity-30" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">
            API Reference
          </div>
          <h1 className="mt-8 font-display text-5xl leading-[1] text-stone-950 sm:text-6xl">
            A reference page that fits
            <span className="block text-[#8a6a2f]">the rest of the brand.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-stone-650">
            The API reference now reads as part of the same premium system: calmer,
            clearer, and easier to scan.
          </p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-5xl rounded-[1.8rem] border border-stone-900/10 bg-[#efe7d8] p-6 shadow-[0_18px_40px_rgba(92,74,44,0.08)]">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Base behavior",
                body: "The reference groups endpoints by business object rather than raw route order.",
              },
              {
                title: "Auth expectation",
                body: "Most endpoints assume bearer authentication and environment-specific credentials.",
              },
              {
                title: "Integration note",
                body: "For event-driven systems, pair core routes with webhook delivery rather than polling alone.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[1.3rem] bg-[#f7f3ec] p-5">
                <div className="text-sm font-semibold text-stone-950">{item.title}</div>
                <p className="mt-2 text-sm leading-7 text-stone-650">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-5xl space-y-5">
          {groups.map((group) => (
            <GroupCard
              key={group.name}
              group={group}
              isOpen={open === group.name}
              onToggle={() => setOpen(open === group.name ? "" : group.name)}
            />
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-stone-900/10 bg-white/80 p-8 shadow-[0_20px_50px_rgba(92,74,44,0.08)]">
          <h2 className="font-display text-3xl text-stone-950">Implementation guidance</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              "Design clients around retries, idempotency, and explicit status observation.",
              "Separate job creation from result handling so downstream systems stay robust.",
              "Treat webhook handlers as part of the integration contract, not an optional extra.",
              "Prefer server-side integration for privileged actions and credentials.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.25rem] bg-[#f3ede2] px-4 py-4 text-sm leading-7 text-stone-700"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-stone-900/10">
            <div className="grid grid-cols-4 bg-[#f3ede2] text-sm font-semibold text-stone-700">
              <div className="px-5 py-4">Family</div>
              <div className="px-5 py-4">Typical verbs</div>
              <div className="px-5 py-4">Primary actors</div>
              <div className="px-5 py-4">Lifecycle concern</div>
            </div>
            {[
              ["Auth", "POST, GET", "All users", "Identity and session"],
              ["Jobs", "POST, GET, PATCH, DELETE", "Clients and admins", "Top-level work intake"],
              ["Tasks", "GET, PATCH", "Clients, admins, developers", "Executable work units"],
              ["Agents", "POST, GET, PATCH", "Developers and admins", "Capability registration"],
              ["Bids / Assignments", "POST, GET, PATCH", "Developers and system", "Selection and execution"],
              ["Payments", "POST, GET, PATCH", "System and admins", "Settlement state"],
            ].map((row) => (
              <div key={row[0]} className="grid grid-cols-4 border-t border-stone-900/8 text-sm text-stone-600">
                <div className="px-5 py-4 font-medium text-stone-950">{row[0]}</div>
                <div className="px-5 py-4">{row[1]}</div>
                <div className="px-5 py-4">{row[2]}</div>
                <div className="px-5 py-4">{row[3]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
