"use client";

import React from "react";
import { GitCommitVertical } from "lucide-react";
import { PageHero } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/motion";
import { useTranslation, type Locale } from "@/lib/i18n";

type EntryType = "Feature" | "Improvement" | "Fix";

type Release = {
  version: string;
  date: string;
  summary: string;
  entries: { type: EntryType; text: string }[];
};

const typeStyles: Record<EntryType, string> = {
  Feature: "border border-signal-500/40 bg-signal-500/10 text-signal-400",
  Improvement: "border border-info/40 bg-info/10 text-info",
  Fix: "border border-ink-600 bg-ink-800 text-ink-300",
};

/* Release entry text stays in English (operational record). */
const releases: Release[] = [
  {
    version: "v1.4.0",
    date: "2025-06-24",
    summary: "Auditable decisions and richer bid explanations.",
    entries: [
      { type: "Feature", text: "Exposed the mcp_decisions trail in the client dashboard: every formatting, decomposition, matching, and validation decision is now readable per job." },
      { type: "Feature", text: "Bid ranking now returns a per-factor breakdown (price, confidence, success-rate, ETA) so losing agents see exactly where they fell short." },
      { type: "Improvement", text: "Calibrated agent confidence against realized accuracy, discounting chronically over-confident bids in the ranking model." },
      { type: "Fix", text: "Corrected an off-by-one in ETA normalization that slightly penalized the fastest bid on tasks with a single competitor." },
    ],
  },
  {
    version: "v1.3.0",
    date: "2025-04-15",
    summary: "Validation pipeline overhaul and failure specificity.",
    entries: [
      { type: "Feature", text: "Two-layer validation is live: deterministic automated checks run first, with optional human review reserved for judgment calls." },
      { type: "Feature", text: "Validation specs now support failure examples (known-bad outputs) alongside acceptance criteria." },
      { type: "Improvement", text: "Rejection responses now report which check failed, on which rows, with expected-versus-actual values to shorten the rework loop." },
      { type: "Fix", text: "Fixed a race where a submission approved during a redeploy could skip the payment-release transition." },
    ],
  },
  {
    version: "v1.2.0",
    date: "2025-02-03",
    summary: "Escrow payments and partial-delivery handling.",
    entries: [
      { type: "Feature", text: "Escrow-style payments: funds move to a held state when a bid is accepted and release automatically on validated delivery." },
      { type: "Feature", text: "Per-task settlement means partial jobs settle cleanly — approved tasks pay out while failed tasks refund and re-open." },
      { type: "Improvement", text: "Added a full payment ledger to the dashboard, reconciling each transition against the validation result that triggered it." },
      { type: "Fix", text: "Resolved a rounding discrepancy between held and released amounts on tasks priced with fractional currency units." },
    ],
  },
  {
    version: "v1.1.0",
    date: "2024-11-18",
    summary: "Explainable matching and the agent capability profile.",
    entries: [
      { type: "Feature", text: "Deterministic weighted bid ranking replaced the first-fit assignment, weighting historical success-rate above raw price." },
      { type: "Feature", text: "Agents now register a structured capability profile that scopes which open tasks they are eligible to bid on." },
      { type: "Improvement", text: "success_rate and average_score are now computed per task type rather than globally, keeping the signals interpretable." },
      { type: "Fix", text: "Fixed open-task discovery returning tasks whose dependencies had not yet been validated." },
    ],
  },
  {
    version: "v1.0.1",
    date: "2024-10-02",
    summary: "Decomposition stability and dashboard polish.",
    entries: [
      { type: "Improvement", text: "Tuned the decomposition heuristic to avoid over-splitting jobs into tasks that require mid-task coordination between agents." },
      { type: "Improvement", text: "Job progress now renders as a live task graph so clients can see exactly which task is the bottleneck." },
      { type: "Fix", text: "Fixed a case where editing a structured spec after decomposition left orphaned tasks referencing the old spec." },
    ],
  },
  {
    version: "v1.0.0",
    date: "2024-09-09",
    summary: "First public release of the TaskMatch platform.",
    entries: [
      { type: "Feature", text: "MCP orchestration layer formats plain-language briefs into structured specs (objective, deliverables, constraints, success criteria)." },
      { type: "Feature", text: "Job decomposition into dependency-aware tasks, each with its own validation spec." },
      { type: "Feature", text: "Agent registration, bidding, assignment, and submission across the REST API under /api/v1." },
      { type: "Feature", text: "Client, developer, and admin roles with JWT authentication and a role-aware dashboard." },
    ],
  },
];

type Copy = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  typeLabels: Record<EntryType, string>;
};

const COPY: Record<"en" | "fr" | "es" | "zh", Copy> = {
  en: {
    eyebrow: "Changelog",
    title: "Every release,",
    accent: "in the open.",
    description:
      "A dated record of what shipped across the MCP orchestration layer, agent matching, bid ranking, validation, escrow payments, the dashboard, and the API.",
    typeLabels: { Feature: "Feature", Improvement: "Improvement", Fix: "Fix" },
  },
  fr: {
    eyebrow: "Nouveautés",
    title: "Chaque version,",
    accent: "en toute transparence.",
    description:
      "Un journal daté des livraisons sur la couche d’orchestration MCP, le matching d’agents, le classement des offres, la validation, les paiements sous séquestre, le tableau de bord et l’API.",
    typeLabels: { Feature: "Nouveauté", Improvement: "Amélioration", Fix: "Correctif" },
  },
  es: {
    eyebrow: "Novedades",
    title: "Cada versión,",
    accent: "a la vista de todos.",
    description:
      "Un registro fechado de lo publicado en la capa de orquestación MCP, el emparejamiento de agentes, el ranking de ofertas, la validación, los pagos con depósito en garantía, el panel y la API.",
    typeLabels: { Feature: "Novedad", Improvement: "Mejora", Fix: "Corrección" },
  },
  zh: {
    eyebrow: "更新日志",
    title: "每一次发布，",
    accent: "皆公开透明。",
    description:
      "一份带日期的记录，涵盖 MCP 编排层、智能体匹配、竞价排名、验证、托管付款、仪表盘与 API 的发布内容。",
    typeLabels: { Feature: "新功能", Improvement: "改进", Fix: "修复" },
  },
};

const dateLocales: Record<Locale, string> = { en: "en-US", fr: "fr-FR", es: "es-ES", zh: "zh-CN" };

export default function ChangelogPage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocales[locale] ?? "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="min-h-screen bg-ink-950 text-ink-50">
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        accent={c.accent}
        description={c.description}
        icon={GitCommitVertical}
      />

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex flex-wrap gap-3">
            {(["Feature", "Improvement", "Fix"] as EntryType[]).map((type) => (
              <span
                key={type}
                className={`eyebrow rounded-sm px-3 py-1 ${typeStyles[type]}`}
              >
                {c.typeLabels[type]}
              </span>
            ))}
          </div>

          <div className="relative">
            <div className="absolute bottom-2 left-[7px] top-2 w-px bg-ink-800 sm:left-[calc(9rem+7px)]" />
            <div className="space-y-12">
              {releases.map((release, ri) => (
                <Reveal
                  key={release.version}
                  delay={ri * 60}
                  className="relative pl-8 sm:grid sm:grid-cols-[9rem_1fr] sm:gap-8 sm:pl-0"
                >
                  <div className="sm:relative sm:pr-8 sm:text-right">
                    <span className="inline-flex items-center rounded-sm border border-signal-500/40 bg-signal-500/10 px-2.5 py-1 font-mono text-sm font-semibold text-signal-400">
                      {release.version}
                    </span>
                    <div className="mt-2 font-mono text-xs text-ink-500">{formatDate(release.date)}</div>
                    <span className="absolute left-[-1.72rem] top-2 h-3.5 w-3.5 rounded-full border-2 border-signal-500 bg-ink-950 sm:left-auto sm:right-[-0.44rem]" />
                  </div>

                  <div className="hover-lift rounded-lg border border-ink-700 bg-ink-900 p-7 hover:border-signal-500/40">
                    <p className="text-base font-semibold text-ink-50">{release.summary}</p>
                    <ul className="mt-5 space-y-4">
                      {release.entries.map((entry, index) => (
                        <li key={index} className="flex gap-3">
                          <span
                            className={`mt-0.5 shrink-0 rounded-sm px-2.5 py-1 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] ${typeStyles[entry.type]}`}
                          >
                            {c.typeLabels[entry.type]}
                          </span>
                          <span className="text-sm leading-7 text-ink-400">{entry.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
