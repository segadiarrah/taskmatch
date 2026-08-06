"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { Counter, Reveal } from "@/components/public/motion";
import { PublicFooter, PublicNavbar } from "@/components/public/site-chrome";
import { COPY, type Copy } from "@/lib/landing-copy";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  FileText,
  Gavel,
  Layers,
  ListChecks,
  Lock,
  Network,
  ScrollText,
  ShieldCheck,
  Trophy,
} from "lucide-react";

const TECH_KEYWORDS = [
  "Next.js",
  "FastAPI",
  "PostgreSQL",
  "Redis",
  "OpenRouter",
  "MCP",
  "Explainable scoring",
  "Escrow",
  "Audit log",
];

const STAT_VALUES = [
  { value: 98, suffix: "%", decimals: 0 },
  { value: 9, suffix: "", decimals: 0 },
  { value: 4, suffix: "s", decimals: 0 },
  { value: 100, suffix: "%", decimals: 0 },
];

const HOW_ICONS = [FileText, Layers, Network, Trophy, Gavel, ShieldCheck, Lock];
const FEATURE_ICONS = [ListChecks, ScrollText, Lock, Network];

const BTN_PRIMARY =
  "inline-flex h-12 items-center gap-2 rounded-lg bg-brand-800 px-7 text-sm font-semibold text-white transition-colors hover:bg-brand-900";
const BTN_SECONDARY =
  "inline-flex h-12 items-center gap-2 rounded-lg border border-stone-300 bg-white px-7 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50";

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero({ c }: { c: Copy }) {
  const stages = [
    { label: c.hero.cardStageDone, key: "Format", done: true, active: false },
    { label: c.hero.cardStageDone, key: "Decompose", done: true, active: false },
    { label: c.hero.cardStageActive, key: "Match & rank", done: false, active: true },
    { label: "", key: "Validate", done: false, active: false },
  ];

  return (
    <section className="border-b border-stone-200 bg-white pt-16">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pt-24 lg:px-8 lg:pt-28">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-2xl">
            <Reveal>
              <div className="eyebrow inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-stone-600">
                {c.hero.eyebrow}
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-7 text-5xl font-semibold leading-[1.02] tracking-tight text-stone-900 sm:text-6xl lg:text-[4.25rem]">
                {c.hero.titleLead}
                <span className="mt-1 block text-brand-800">{c.hero.titleAccent}</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600">
                {c.hero.subtitle}
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={BTN_PRIMARY}>
                  {c.hero.ctaPrimary}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/for-developers" className={BTN_SECONDARY}>
                  {c.hero.ctaSecondary}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <div>
              <p className="eyebrow mb-3 text-stone-400">{c.hero.cardLabel}</p>
              <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-stone-400">TM-1847 · demo</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-brand-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
                    {c.hero.cardStageActive}
                  </span>
                </div>

                <p className="mt-4 text-base font-medium leading-6 text-stone-900">
                  {c.hero.cardBrief}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  {stages.map((s) => (
                    <div
                      key={s.key}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs ${
                        s.done
                          ? "bg-brand-50 text-brand-700"
                          : s.active
                          ? "border border-stone-300 bg-white font-medium text-stone-900"
                          : "border border-stone-200 bg-stone-50 text-stone-400"
                      }`}
                    >
                      {s.done ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : s.active ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                      ) : (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300" />
                      )}
                      <span className="font-mono">{s.key}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-[10px]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-stone-600">
                    <Network className="h-2.5 w-2.5" />
                    {c.hero.cardMatched}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-stone-600">
                    <Trophy className="h-2.5 w-2.5" />
                    {c.hero.cardScore}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-stone-200 pt-4 text-xs">
                  <div className="flex items-center gap-2 text-stone-600">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-100">
                      <Bot className="h-3 w-3" />
                    </span>
                    <span className="font-mono">{c.hero.cardAgent}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-brand-700">
                    <Lock className="h-2.5 w-2.5" />
                    {c.hero.cardEscrow}
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Built-on strip */}
      <div className="border-t border-stone-200 bg-stone-50 py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-4 sm:px-6 lg:px-8">
          <span className="eyebrow shrink-0 text-stone-400">{c.marqueeLabel}</span>
          {TECH_KEYWORDS.map((k) => (
            <span key={k} className="font-mono text-sm text-stone-500">
              {k}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats                                                              */
/* ------------------------------------------------------------------ */

function Stats({ c }: { c: Copy }) {
  return (
    <section className="border-b border-stone-200 bg-white py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {STAT_VALUES.map((s, i) => (
          <Reveal key={i} delay={i * 70}>
            <div>
              <div className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
                <Counter value={s.value} suffix={s.suffix} decimals={s.decimals} />
              </div>
              <div className="mt-2 text-xs font-medium uppercase tracking-wider text-stone-500">
                {c.stats[i].label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How it works — the pipeline                                        */
/* ------------------------------------------------------------------ */

function HowItWorks({ c }: { c: Copy }) {
  return (
    <section className="bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="eyebrow text-brand-700">{c.how.eyebrow}</p>
          </Reveal>
          <Reveal delay={70}>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              {c.how.title}
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-5 text-lg leading-8 text-stone-600">{c.how.subtitle}</p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.how.steps.map((step, i) => {
            const Icon = HOW_ICONS[i];
            return (
              <Reveal key={step.title} delay={i * 70}>
                <div className="hover-lift h-full rounded-xl border border-stone-200 bg-white p-6 hover:border-stone-300 hover:shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs text-stone-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold tracking-tight text-stone-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{step.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={120}>
          <div className="mt-10 flex justify-center">
            <Link href="/how-it-works" className={BTN_SECONDARY}>
              {c.how.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features                                                           */
/* ------------------------------------------------------------------ */

function Features({ c }: { c: Copy }) {
  return (
    <section className="border-y border-stone-200 bg-stone-50 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow text-brand-700">{c.features.eyebrow}</p>
          </Reveal>
          <Reveal delay={70}>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              {c.features.title}
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-5 text-lg leading-8 text-stone-600">{c.features.subtitle}</p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.features.items.map((item, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <Reveal key={item.title} delay={i * 70}>
                <div className="hover-lift h-full rounded-xl border border-stone-200 bg-white p-6 hover:border-stone-300 hover:shadow-sm">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-6 text-lg font-semibold tracking-tight text-stone-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{item.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Trust                                                              */
/* ------------------------------------------------------------------ */

function Trust({ c }: { c: Copy }) {
  return (
    <section className="bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <Reveal>
              <p className="eyebrow text-brand-700">{c.trust.eyebrow}</p>
            </Reveal>
            <Reveal delay={70}>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
                {c.trust.title}
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-5 max-w-xl text-lg leading-8 text-stone-600">
                {c.trust.subtitle}
              </p>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-8">
                <Link href="/register" className={BTN_PRIMARY}>
                  {c.trust.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="space-y-3">
            {c.trust.points.map((point, i) => (
              <Reveal key={point} delay={i * 70}>
                <div className="hover-lift flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-5 hover:border-stone-300 hover:shadow-sm">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-800 text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm leading-6 text-stone-700">{point}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonial                                                        */
/* ------------------------------------------------------------------ */

function Testimonial({ c }: { c: Copy }) {
  return (
    <section className="border-y border-stone-200 bg-stone-50 py-24 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
          <p className="eyebrow text-brand-700">{c.testimonial.eyebrow}</p>
        </Reveal>
        <Reveal delay={80}>
          <blockquote className="mt-6 text-2xl font-medium leading-snug tracking-tight text-stone-900 sm:text-3xl">
            {c.testimonial.quote}
          </blockquote>
        </Reveal>
        <Reveal delay={160}>
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-800 text-sm font-semibold text-white">
              SC
            </span>
            <div className="text-left">
              <div className="text-sm font-semibold text-stone-900">{c.testimonial.name}</div>
              <div className="text-xs text-stone-500">{c.testimonial.role}</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA                                                                */
/* ------------------------------------------------------------------ */

function CTASection({ c }: { c: Copy }) {
  return (
    <section className="bg-white px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
      <Reveal>
        <div className="mx-auto max-w-5xl rounded-2xl bg-brand-900 p-10 text-center sm:p-16">
          <div className="eyebrow inline-flex items-center gap-2 rounded-full border border-white/20 px-3.5 py-1.5 text-brand-100">
            {c.cta.eyebrow}
          </div>
          <h2 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {c.cta.title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-brand-100">
            {c.cta.subtitle}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-7 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-50"
            >
              {c.cta.primary}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/for-developers"
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/25 px-7 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              {c.cta.secondary}
            </Link>
          </div>
          <p className="mt-6 text-xs text-brand-200">{c.cta.note}</p>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Try it live                                                        */
/* ------------------------------------------------------------------ */

interface DemoResult {
  spec: { objective?: string | null; deliverables: string[]; success_criteria: string[] };
  tasks: { title: string; task_type: string; matched: { name: string; slug: string; score: number }[] }[];
}

function TryItLive({ c }: { c: Copy }) {
  const t = c.tryit;
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DemoResult | null>(null);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "/api";

  async function run(text: string) {
    const q = text.trim();
    if (q.length < 10 || loading) return;
    setInput(text);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API}/v1/demo/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: q.slice(0, 2000) }),
      });
      if (!res.ok) throw new Error("bad");
      setResult((await res.json()) as DemoResult);
    } catch {
      setError(t.errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <div className="eyebrow text-brand-700">{t.eyebrow}</div>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">{t.title}</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-8 text-stone-600">{t.body}</p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={t.placeholder}
              className="w-full resize-none rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {t.examples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => run(ex)}
                    className="rounded-full border border-stone-300 px-3 py-1 text-xs text-stone-600 transition-colors hover:border-brand-600 hover:text-stone-900"
                  >
                    {ex.length > 42 ? ex.slice(0, 42) + "…" : ex}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => run(input)}
                disabled={loading || input.trim().length < 10}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-800 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-900 disabled:opacity-50"
              >
                {loading ? t.loading : t.button}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </Reveal>

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

        {loading && (
          <div className="mt-6 flex items-center justify-center gap-3 font-mono text-sm text-stone-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-600" />
            {t.loading}
          </div>
        )}

        {result && !loading && (
          <div className="mt-8 space-y-6">
            {/* Spec */}
            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <div className="eyebrow text-stone-400">{t.specTitle}</div>
              {result.spec.objective && (
                <p className="mt-3 text-lg font-medium leading-8 text-stone-900">{result.spec.objective}</p>
              )}
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-sm font-semibold text-brand-700">{t.deliverablesLabel}</div>
                  <ul className="space-y-1.5">
                    {result.spec.deliverables.map((d, i) => (
                      <li key={i} className="flex gap-2 text-sm text-stone-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="mb-2 text-sm font-semibold text-brand-700">{t.criteriaLabel}</div>
                  <ul className="space-y-1.5">
                    {result.spec.success_criteria.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-stone-600">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Task breakdown + matched executors */}
            <div>
              <div className="eyebrow mb-4 text-stone-400">{t.breakdownTitle}</div>
              <div className="grid gap-4 md:grid-cols-2">
                {result.tasks.map((task, i) => (
                  <div key={i} className="hover-lift rounded-xl border border-stone-200 bg-white p-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 font-mono text-xs text-brand-700">
                        {i + 1}
                      </span>
                      <span className="rounded-full border border-stone-200 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-stone-600">
                        {task.task_type}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-stone-900">{task.title}</p>
                    <div className="mt-4">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                        {t.matchedLabel}
                      </div>
                      <div className="space-y-1.5">
                        {task.matched.map((m, mi) => (
                          <div key={m.slug} className="flex items-center gap-2">
                            <span className={mi === 0 ? "text-brand-700" : "text-stone-400"}>
                              {mi === 0 ? <Trophy className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                            </span>
                            <span className="w-28 shrink-0 truncate text-xs text-stone-900">{m.name}</span>
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                              <span
                                className="block h-full rounded-full bg-brand-700"
                                style={{ width: `${Math.max(6, Math.min(100, m.score))}%` }}
                              />
                            </span>
                            <span className="w-10 shrink-0 text-right font-mono text-xs text-stone-500">
                              {Math.round(m.score)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/register"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-stone-300 px-6 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                {c.hero.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Demo video                                                         */
/* ------------------------------------------------------------------ */

function DemoVideo({ c }: { c: Copy }) {
  return (
    <section className="border-b border-stone-200 bg-stone-50 py-24 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <div className="eyebrow text-brand-700">{c.demo.eyebrow}</div>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              {c.demo.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-8 text-stone-600">{c.demo.body}</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-10 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <video
              className="aspect-video w-full bg-stone-100"
              controls
              playsInline
              preload="metadata"
              poster="/demo/demo-poster.jpg"
            >
              <source src="/demo/taskmatch-demo.mp4" type="video/mp4" />
            </video>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;

  return (
    <main className="min-h-screen bg-white text-stone-900">
      <PublicNavbar />
      <Hero c={c} />
      <Stats c={c} />
      <DemoVideo c={c} />
      <TryItLive c={c} />
      <HowItWorks c={c} />
      <Features c={c} />
      <Trust c={c} />
      <Testimonial c={c} />
      <CTASection c={c} />
      <PublicFooter />
    </main>
  );
}
