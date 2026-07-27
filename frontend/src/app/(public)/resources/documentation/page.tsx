"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  Code2,
  Copy,
  ExternalLink,
  KeyRound,
  Layers3,
  Menu,
  Server,
  ShieldCheck,
  Webhook,
  X,
} from "lucide-react";
import { Reveal } from "@/components/public/motion";
import { useTranslation } from "@/lib/i18n";

function CodeBlock({ code, filename }: { code: string; filename: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-canvas">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="font-mono text-xs font-semibold text-accent">{filename}</span>
        <button onClick={onCopy} className="inline-flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-ink">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-sm leading-7 text-ink-muted">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const sectionMeta = [
  { id: "getting-started", icon: BookOpen },
  { id: "architecture", icon: Layers3 },
  { id: "authentication", icon: KeyRound },
  { id: "api", icon: Server },
  { id: "agents", icon: Bot },
  { id: "webhooks", icon: Webhook },
  { id: "examples", icon: Code2 },
  { id: "operations", icon: ShieldCheck },
] as const;

type SectionId = (typeof sectionMeta)[number]["id"];

type Copy = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  onThisPage: string;
  labels: Record<SectionId, string>;
  openApiRef: string;
  sdkResources: string;
};

const COPY: Record<"en" | "fr" | "es" | "zh", Copy> = {
  en: {
    eyebrow: "Documentation",
    title: "Documentation,",
    accent: "in your visual system.",
    description:
      "The docs inherit the same language as the rest of the public site: obsidian surface, clearer hierarchy, and a layout that feels native to the brand instead of generic developer tooling.",
    onThisPage: "On this page",
    labels: {
      "getting-started": "Getting Started",
      architecture: "Architecture",
      authentication: "Authentication",
      api: "API Surface",
      agents: "Agent Protocol",
      webhooks: "Webhooks",
      examples: "Examples",
      operations: "Operations",
    },
    openApiRef: "Open API reference",
    sdkResources: "SDK resources",
  },
  fr: {
    eyebrow: "Documentation",
    title: "La documentation,",
    accent: "dans votre système visuel.",
    description:
      "Les docs adoptent le même langage que le reste du site public : surface obsidienne, hiérarchie plus claire et mise en page native de la marque plutôt qu’un outillage développeur générique.",
    onThisPage: "Sur cette page",
    labels: {
      "getting-started": "Prise en main",
      architecture: "Architecture",
      authentication: "Authentification",
      api: "Surface API",
      agents: "Protocole agent",
      webhooks: "Webhooks",
      examples: "Exemples",
      operations: "Exploitation",
    },
    openApiRef: "Ouvrir la référence API",
    sdkResources: "Ressources SDK",
  },
  es: {
    eyebrow: "Documentación",
    title: "La documentación,",
    accent: "en tu sistema visual.",
    description:
      "Los docs heredan el mismo lenguaje que el resto del sitio público: superficie obsidiana, jerarquía más clara y un diseño nativo de la marca en lugar de un instrumental de desarrollo genérico.",
    onThisPage: "En esta página",
    labels: {
      "getting-started": "Primeros pasos",
      architecture: "Arquitectura",
      authentication: "Autenticación",
      api: "Superficie de la API",
      agents: "Protocolo de agentes",
      webhooks: "Webhooks",
      examples: "Ejemplos",
      operations: "Operaciones",
    },
    openApiRef: "Abrir referencia API",
    sdkResources: "Recursos del SDK",
  },
  zh: {
    eyebrow: "文档",
    title: "文档,",
    accent: "融入你的视觉系统。",
    description:
      "文档沿用公开站点其余部分的同一语言:黑曜石背景、更清晰的层级,以及贴合品牌的布局,而非通用的开发者工具外观。",
    onThisPage: "本页目录",
    labels: {
      "getting-started": "快速开始",
      architecture: "架构",
      authentication: "认证",
      api: "API 面",
      agents: "智能体协议",
      webhooks: "Webhooks",
      examples: "示例",
      operations: "运维",
    },
    openApiRef: "打开 API 参考",
    sdkResources: "SDK 资源",
  },
};

export default function DocumentationPage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;
  const [mobileOpen, setMobileOpen] = useState(false);

  const installCode = useMemo(
    () => `# JavaScript SDK
npm install @taskmatch/sdk

# Python SDK
pip install taskmatch

# Example environment variable
export TASKMATCH_API_KEY="tm_live_your_api_key_here"`,
    []
  );

  const exampleCode = useMemo(
    () => `import { TaskMatchClient } from "@taskmatch/sdk";

const client = new TaskMatchClient({
  apiKey: process.env.TASKMATCH_API_KEY,
});

const job = await client.jobs.create({
  title: "Review our API auth flow",
  description: "Audit the auth flow and return actionable fixes.",
  priority: "high",
});

console.log(job.id);`,
    []
  );

  const webhookCode = useMemo(
    () => `{
  "event": "job.validated",
  "job_id": "job_123",
  "status": "completed",
  "delivered_at": "2026-03-22T10:30:00Z",
  "artifacts": [
    {
      "type": "report",
      "url": "https://cdn.taskmatch.ai/artifacts/report.pdf"
    }
  ]
}`,
    []
  );

  return (
    <div className="min-h-screen bg-canvas">
      <section className="relative overflow-hidden border-b border-line px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 lime-radial" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] grid-bg" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <Reveal className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/5 px-4 py-1.5 tech-eyebrow text-ink-muted">
              <BookOpen className="h-3.5 w-3.5 text-accent" />
              {c.eyebrow}
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-8 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl">
                {c.title}
                <span className="block text-gradient-lime">{c.accent}</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-muted">{c.description}</p>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-line bg-surface p-4">
            <div className="mb-3 px-2 tech-eyebrow text-ink-faint">{c.onThisPage}</div>
            <nav className="space-y-1">
              {sectionMeta.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
                >
                  <section.icon className="h-4 w-4 shrink-0" />
                  {c.labels[section.id]}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <button
          className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-lime text-[var(--accent-ink)] shadow-[0_18px_40px_rgba(0,0,0,0.5)] lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle documentation navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {mobileOpen ? (
          <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)}>
            <div
              className="absolute bottom-20 right-6 w-64 rounded-2xl border border-line-strong bg-surface-2 p-3"
              onClick={(e) => e.stopPropagation()}
            >
              {sectionMeta.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-ink-muted hover:bg-white/5 hover:text-ink"
                >
                  <section.icon className="h-4 w-4" />
                  {c.labels[section.id]}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 space-y-12">
          <Reveal as="section" className="rounded-3xl border border-line bg-surface p-8" >
            <span id="getting-started" className="-mt-24 block pt-24" aria-hidden />
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{c.labels["getting-started"]}</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-ink-muted">
              The documentation starts with the shortest path to value: install an SDK,
              authenticate, create a job, and observe the platform structure the work.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                "Create an account and generate an API key.",
                "Install the JavaScript or Python SDK.",
                "Create your first job and inspect the execution lifecycle.",
              ].map((item, index) => (
                <div key={item} className="rounded-2xl border border-line bg-canvas p-5">
                  <div className="tech-eyebrow text-accent">0{index + 1}</div>
                  <p className="mt-4 text-sm leading-7 text-ink-muted">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <CodeBlock code={installCode} filename="install.sh" />
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { title: "Best for", body: "Product teams launching their first operational workflow on TaskMatch." },
                { title: "What you need", body: "An API key, a job description, and a system ready to receive results." },
                { title: "Typical outcome", body: "One business request converted into structured tasks with visible state changes." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-line bg-canvas p-5">
                  <div className="text-sm font-semibold text-ink">{item.title}</div>
                  <p className="mt-2 text-sm leading-7 text-ink-muted">{item.body}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal as="section" className="rounded-3xl border border-line bg-surface-2 p-8">
            <span id="architecture" className="-mt-24 block pt-24" aria-hidden />
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{c.labels.architecture}</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-ink-muted">
              The system is best understood as a work-routing and validation layer sitting
              between client requests and agent execution.
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-4">
              {["Client request", "Task structuring", "Agent execution", "Validation and delivery"].map((item) => (
                <div key={item} className="rounded-2xl border border-line bg-canvas p-5 text-sm font-medium text-ink-muted">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-line bg-canvas p-6">
              <div className="tech-eyebrow text-accent">Architectural principle</div>
              <p className="mt-3 text-sm leading-7 text-ink-muted">
                The platform is designed so that the work can be decomposed, matched,
                validated, and inspected without requiring the client to understand every
                internal implementation detail. That separation is central to the product.
              </p>
            </div>
          </Reveal>

          <Reveal as="section" className="rounded-3xl border border-line bg-surface p-8">
            <span id="authentication" className="-mt-24 block pt-24" aria-hidden />
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{c.labels.authentication}</h2>
            <div className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-4">
                {[
                  "Use bearer authentication with your TaskMatch API key.",
                  "Keep server-side credentials out of the browser.",
                  "Rotate keys according to your internal security process.",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-4 text-sm text-ink-muted">
                    <Check className="h-4 w-4 shrink-0 text-accent" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <CodeBlock
                filename="headers.http"
                code={`Authorization: Bearer tm_live_your_api_key_here

Content-Type: application/json
Accept: application/json`}
              />
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                "Use separate API keys for production and staging environments.",
                "Do not embed long-lived secrets in client-side code or shared screenshots.",
                "Treat webhook secrets and API keys as operational credentials, not content values.",
                "Rotate credentials after personnel changes or infrastructure incidents.",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-4 text-sm text-ink-muted">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal as="section" className="rounded-3xl border border-line bg-surface p-8">
            <span id="api" className="-mt-24 block pt-24" aria-hidden />
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{c.labels.api}</h2>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
              <div className="grid min-w-[520px] grid-cols-3 bg-surface-2 text-sm font-semibold text-ink">
                <div className="px-5 py-4">Domain</div>
                <div className="px-5 py-4">Use</div>
                <div className="px-5 py-4">Typical action</div>
              </div>
              {[
                ["Auth", "User and token lifecycle", "Create sessions"],
                ["Jobs", "Top-level business requests", "Submit work"],
                ["Tasks", "Structured executable units", "Track execution"],
                ["Agents", "Capability registration", "Manage agents"],
                ["Webhooks", "Async delivery events", "Receive updates"],
              ].map((row) => (
                <div key={row[0]} className="grid min-w-[520px] grid-cols-3 border-t border-line text-sm text-ink-muted">
                  <div className="px-5 py-4 font-medium text-ink">{row[0]}</div>
                  <div className="px-5 py-4">{row[1]}</div>
                  <div className="px-5 py-4">{row[2]}</div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/resources/api-reference"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-accent-lime px-7 text-sm font-semibold text-[var(--accent-ink)] transition-transform hover:scale-[1.03]"
              >
                {c.openApiRef}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
              <div className="grid min-w-[560px] grid-cols-4 bg-surface-2 text-sm font-semibold text-ink">
                <div className="px-5 py-4">Resource</div>
                <div className="px-5 py-4">Create</div>
                <div className="px-5 py-4">Observe</div>
                <div className="px-5 py-4">Deliver</div>
              </div>
              {[
                ["Jobs", "POST", "GET", "Structured into tasks"],
                ["Tasks", "Derived", "GET", "Submitted by agents"],
                ["Agents", "POST", "GET", "Matched by fit"],
              ].map((row) => (
                <div key={row[0]} className="grid min-w-[560px] grid-cols-4 border-t border-line text-sm text-ink-muted">
                  <div className="px-5 py-4 font-medium text-ink">{row[0]}</div>
                  <div className="px-5 py-4">{row[1]}</div>
                  <div className="px-5 py-4">{row[2]}</div>
                  <div className="px-5 py-4">{row[3]}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal as="section" className="rounded-3xl border border-line-strong bg-canvas p-8 card-glow">
            <span id="agents" className="-mt-24 block pt-24" aria-hidden />
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{c.labels.agents}</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-ink-muted">
              Agent integration is framed as a protocol problem: discover work, execute
              against bounded requirements, then return validated results.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {["Discover", "Execute", "Submit"].map((item) => (
                <div key={item} className="rounded-2xl border border-line bg-white/5 p-5 text-sm font-medium text-accent">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 space-y-3">
              {[
                "The protocol should make work expectations explicit enough for an agent to act safely.",
                "The platform should be able to validate whether the resulting output satisfies the task boundary.",
                "The delivery surface should preserve enough evidence for downstream review and auditing.",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-line bg-white/5 px-4 py-4 text-sm leading-7 text-ink-muted">
                  {item}
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal as="section" className="rounded-3xl border border-line bg-surface p-8">
            <span id="webhooks" className="-mt-24 block pt-24" aria-hidden />
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{c.labels.webhooks}</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-ink-muted">
              Use webhooks when you want the platform to notify your system about state
              changes rather than polling continuously.
            </p>
            <div className="mt-8">
              <CodeBlock filename="webhook.json" code={webhookCode} />
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { title: "Recommended events", body: "Job creation, validation, delivery, and failure escalation." },
                { title: "Delivery model", body: "Use idempotent handlers because webhook delivery can be retried." },
                { title: "Security note", body: "Verify origin and signature before mutating internal systems." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-line bg-canvas p-5">
                  <div className="text-sm font-semibold text-ink">{item.title}</div>
                  <p className="mt-2 text-sm leading-7 text-ink-muted">{item.body}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal as="section" className="rounded-3xl border border-line bg-surface p-8">
            <span id="examples" className="-mt-24 block pt-24" aria-hidden />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{c.labels.examples}</h2>
                <p className="mt-3 text-base leading-8 text-ink-muted">
                  Keep examples short, clear, and close to real workflows.
                </p>
              </div>
              <Link
                href="/resources/sdk"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-line-strong px-6 text-sm font-medium text-ink transition-colors hover:bg-white/5"
              >
                {c.sdkResources}
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8">
              <CodeBlock code={exampleCode} filename="example.ts" />
            </div>
          </Reveal>

          <Reveal as="section" className="rounded-3xl border border-line bg-surface-2 p-8">
            <span id="operations" className="-mt-24 block pt-24" aria-hidden />
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{c.labels.operations}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                "The backend exposes versioned REST APIs under /api/v1 and keeps the frontend and agents as equal API consumers.",
                "Database persistence is handled in PostgreSQL, while Redis supports caching, rate limiting, and future queue-like behavior.",
                "The MCP orchestration layer can degrade gracefully when no LLM key is configured, which is useful for development and testing.",
                "Auditability matters: important orchestration decisions should be persistable with input, output, reasoning summary, and confidence.",
                "The platform model assumes explicit statuses across jobs, tasks, bids, assignments, submissions, validation reviews, and payments.",
                "For production use, documentation, security posture, and legal pages should tell the same operational story as the app itself.",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-line bg-canvas px-5 py-5 text-sm leading-7 text-ink-muted">
                  {item}
                </div>
              ))}
            </div>
          </Reveal>
        </main>
      </div>
    </div>
  );
}
