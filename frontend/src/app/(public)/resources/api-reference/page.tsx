"use client";

import React, { useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, KeyRound, ListChecks, Briefcase, Bot, Webhook } from "lucide-react";
import { PageHero } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/motion";
import { useTranslation } from "@/lib/i18n";

function CodeBlock({ code, label }: { code: string; label: string }) {
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
        <span className="font-mono text-xs font-semibold text-accent">{label}</span>
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

/* Endpoint reference stays in English (technical body). */
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

type Copy = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  endpoints: string;
  request: string;
  response: string;
  infoTitle: string;
  info: { title: string; body: string }[];
  guidanceTitle: string;
};

const COPY: Record<"en" | "fr" | "es" | "zh", Copy> = {
  en: {
    eyebrow: "API Reference",
    title: "A reference that fits",
    accent: "the rest of the brand.",
    description: "The API reference reads as part of the same system: calmer, clearer, and easier to scan.",
    endpoints: "Endpoints",
    request: "request",
    response: "response",
    infoTitle: "Reference notes",
    info: [
      { title: "Base behavior", body: "The reference groups endpoints by business object rather than raw route order." },
      { title: "Auth expectation", body: "Most endpoints assume bearer authentication and environment-specific credentials." },
      { title: "Integration note", body: "For event-driven systems, pair core routes with webhook delivery rather than polling alone." },
    ],
    guidanceTitle: "Implementation guidance",
  },
  fr: {
    eyebrow: "Référence API",
    title: "Une référence à la hauteur",
    accent: "du reste de la marque.",
    description: "La référence API fait partie du même système : plus calme, plus claire et plus facile à parcourir.",
    endpoints: "Endpoints",
    request: "requête",
    response: "réponse",
    infoTitle: "Notes de référence",
    info: [
      { title: "Comportement de base", body: "La référence regroupe les endpoints par objet métier plutôt que par ordre de route brut." },
      { title: "Attente d’auth", body: "La plupart des endpoints supposent une authentification bearer et des identifiants propres à l’environnement." },
      { title: "Note d’intégration", body: "Pour les systèmes événementiels, associez les routes principales à la livraison par webhook plutôt qu’au seul polling." },
    ],
    guidanceTitle: "Conseils d’implémentation",
  },
  es: {
    eyebrow: "Referencia de la API",
    title: "Una referencia acorde con",
    accent: "el resto de la marca.",
    description: "La referencia de la API forma parte del mismo sistema: más calmada, más clara y más fácil de escanear.",
    endpoints: "Endpoints",
    request: "petición",
    response: "respuesta",
    infoTitle: "Notas de referencia",
    info: [
      { title: "Comportamiento base", body: "La referencia agrupa los endpoints por objeto de negocio en lugar del orden crudo de rutas." },
      { title: "Expectativa de auth", body: "La mayoría de los endpoints asumen autenticación bearer y credenciales por entorno." },
      { title: "Nota de integración", body: "Para sistemas orientados a eventos, combina las rutas principales con la entrega por webhook en vez de solo sondeo." },
    ],
    guidanceTitle: "Guía de implementación",
  },
  zh: {
    eyebrow: "API 参考",
    title: "一份契合品牌其余部分的",
    accent: "参考。",
    description: "API 参考是同一系统的一部分:更沉稳、更清晰、更易浏览。",
    endpoints: "端点",
    request: "请求",
    response: "响应",
    infoTitle: "参考说明",
    info: [
      { title: "基本行为", body: "参考按业务对象而非原始路由顺序对端点进行分组。" },
      { title: "认证预期", body: "大多数端点假定使用 bearer 认证与按环境区分的凭据。" },
      { title: "集成说明", body: "对于事件驱动系统,应将核心路由与 webhook 投递结合,而非仅靠轮询。" },
    ],
    guidanceTitle: "实现指引",
  },
};

const guidanceItems = [
  "Design clients around retries, idempotency, and explicit status observation.",
  "Separate job creation from result handling so downstream systems stay robust.",
  "Treat webhook handlers as part of the integration contract, not an optional extra.",
  "Prefer server-side integration for privileged actions and credentials.",
];

function GroupCard({
  group,
  isOpen,
  onToggle,
  copy,
}: {
  group: (typeof groups)[number];
  isOpen: boolean;
  onToggle: () => void;
  copy: Copy;
}) {
  return (
    <div className="hover-lift rounded-2xl border border-line bg-surface hover:border-line-strong">
      <button className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left" onClick={onToggle}>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white/5 text-accent">
            <group.icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-ink">{group.name}</h3>
            <p className="mt-1 text-sm leading-6 text-ink-muted">{group.description}</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-ink-muted" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-ink-muted" />
        )}
      </button>

      {isOpen ? (
        <div className="border-t border-line px-6 py-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="rounded-2xl border border-line bg-canvas p-5">
                <div className="tech-eyebrow text-accent">{copy.endpoints}</div>
                <div className="mt-4 space-y-3">
                  {group.endpoints.map((endpoint) => (
                    <div key={endpoint} className="rounded-lg border border-line bg-white/5 px-4 py-3 font-mono text-xs text-ink-muted">
                      {endpoint}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              <CodeBlock code={group.request} label={copy.request} />
              <CodeBlock code={group.response} label={copy.response} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ApiReferencePage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;
  const [open, setOpen] = useState<string>("Authentication");

  return (
    <div className="min-h-screen bg-canvas">
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        accent={c.accent}
        description={c.description}
      />

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-10 max-w-5xl rounded-2xl border border-line bg-surface p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {c.info.map((item, i) => (
              <Reveal key={item.title} delay={i * 70} className="rounded-2xl border border-line bg-canvas p-5">
                <div className="text-sm font-semibold text-ink">{item.title}</div>
                <p className="mt-2 text-sm leading-7 text-ink-muted">{item.body}</p>
              </Reveal>
            ))}
          </div>
        </Reveal>
        <div className="mx-auto max-w-5xl space-y-5">
          {groups.map((group, i) => (
            <Reveal key={group.name} delay={i * 60}>
              <GroupCard
                group={group}
                copy={c}
                isOpen={open === group.name}
                onToggle={() => setOpen(open === group.name ? "" : group.name)}
              />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-5xl rounded-3xl border border-line bg-surface p-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{c.guidanceTitle}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {guidanceItems.map((item) => (
              <div key={item} className="rounded-2xl border border-line bg-canvas px-4 py-4 text-sm leading-7 text-ink-muted">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
            <div className="grid min-w-[640px] grid-cols-4 bg-surface-2 text-sm font-semibold text-ink">
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
              <div key={row[0]} className="grid min-w-[640px] grid-cols-4 border-t border-line text-sm text-ink-muted">
                <div className="px-5 py-4 font-medium text-ink">{row[0]}</div>
                <div className="px-5 py-4">{row[1]}</div>
                <div className="px-5 py-4">{row[2]}</div>
                <div className="px-5 py-4">{row[3]}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
    </div>
  );
}
