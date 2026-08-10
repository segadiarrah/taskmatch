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
  "inline-flex h-12 items-center gap-2 rounded-md bg-signal-500 px-7 text-sm font-semibold text-ink-950 transition-all hover:bg-signal-400 hover:shadow-glow";
const BTN_SECONDARY =
  "inline-flex h-12 items-center gap-2 rounded-md border border-ink-600 bg-transparent px-7 text-sm font-medium text-ink-100 transition-colors hover:border-ink-400 hover:bg-ink-800";
const BTN_PRIMARY_PAPER =
  "inline-flex h-12 items-center gap-2 rounded-md bg-paper-ink px-7 text-sm font-semibold text-paper transition-colors hover:bg-ink-800";
const BTN_SECONDARY_PAPER =
  "inline-flex h-12 items-center gap-2 rounded-md border border-paper-ink/30 px-7 text-sm font-medium text-paper-ink transition-colors hover:bg-paper-ink hover:text-paper";

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
    <section className="relative overflow-hidden border-b border-ink-800 bg-ink-950 pt-16">
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-signal-glow" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pt-24 lg:px-8 lg:pt-28">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-2xl">
            <Reveal>
              <div className="eyebrow inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900/80 px-3.5 py-1.5 text-ink-300">
                <span className="h-1.5 w-1.5 rounded-full bg-signal-500 animate-pulse-dot" />
                {c.hero.eyebrow}
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-7 font-display text-5xl font-medium leading-[1.02] text-ink-50 sm:text-6xl lg:text-[4.5rem]">
                {c.hero.titleLead}
                <span className="mt-1 block font-display italic text-signal-500 text-glow">
                  {c.hero.titleAccent}
                </span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-lg leading-8 text-ink-300">
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

          {/* Execution ticket */}
          <Reveal delay={200}>
            <div>
              <p className="eyebrow mb-3 text-ink-500">{c.hero.cardLabel}</p>
              <div className="corner-brackets relative overflow-hidden rounded-lg border border-ink-700 bg-ink-900 p-6 shadow-panel">
                {/* scanning beam */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-1/4 animate-scan bg-gradient-to-b from-transparent via-signal-500/[0.06] to-transparent"
                  aria-hidden="true"
                />

                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-ink-500">TM-1847 · demo</span>
                  <span className="inline-flex items-center gap-1.5 rounded-sm border border-signal-500/40 bg-signal-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-signal-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-signal-500 animate-pulse-dot" />
                    {c.hero.cardStageActive}
                  </span>
                </div>

                <p className="mt-4 text-base font-medium leading-6 text-ink-50">
                  {c.hero.cardBrief}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  {stages.map((s) => (
                    <div
                      key={s.key}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-xs ${
                        s.done
                          ? "border-success/30 bg-success/5 text-success"
                          : s.active
                          ? "border-signal-500/50 bg-signal-500/10 font-medium text-signal-400"
                          : "border-ink-700 bg-ink-850 text-ink-500"
                      }`}
                    >
                      {s.done ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : s.active ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-signal-500 animate-pulse-dot" />
                      ) : (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-600" />
                      )}
                      <span className="font-mono">{s.key}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-[10px]">
                  <span className="inline-flex items-center gap-1 rounded-full border border-ink-700 px-2 py-0.5 text-ink-300">
                    <Network className="h-2.5 w-2.5 text-signal-400" />
                    {c.hero.cardMatched}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-ink-700 px-2 py-0.5 text-ink-300">
                    <Trophy className="h-2.5 w-2.5 text-signal-400" />
                    {c.hero.cardScore}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-ink-800 pt-4 text-xs">
                  <div className="flex items-center gap-2 text-ink-300">
                    <span className="flex h-5 w-5 items-center justify-center rounded-sm border border-ink-700 bg-ink-800">
                      <Bot className="h-3 w-3 text-signal-400" />
                    </span>
                    <span className="font-mono">{c.hero.cardAgent}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-success">
                    <Lock className="h-2.5 w-2.5" />
                    {c.hero.cardEscrow}
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Built-on marquee strip */}
      <div className="relative border-t border-ink-800 bg-ink-900/60 py-4">
        <div className="flex items-center">
          <span className="eyebrow shrink-0 px-4 text-ink-500 sm:px-6 lg:px-8">
            {c.marqueeLabel}
          </span>
          <div className="relative flex-1 overflow-hidden mask-fade-x">
            <div className="flex w-max animate-marquee items-center gap-10 pr-10">
              {[...TECH_KEYWORDS, ...TECH_KEYWORDS].map((k, i) => (
                <span
                  key={`${k}-${i}`}
                  className="flex items-center gap-10 whitespace-nowrap font-mono text-sm text-ink-400"
                >
                  {k}
                  <span className="text-signal-500">✦</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats — ledger rows                                                */
/* ------------------------------------------------------------------ */

function Stats({ c }: { c: Copy }) {
  return (
    <section className="border-b border-ink-800 bg-ink-950 py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {STAT_VALUES.map((s, i) => (
          <Reveal key={i} delay={i * 70}>
            <div className="border-l border-ink-700 pl-6">
              <div className="font-display text-5xl font-medium text-ink-50 sm:text-6xl">
                <Counter value={s.value} suffix="" decimals={s.decimals} />
                <span className="text-signal-500">{s.suffix}</span>
              </div>
              <div className="eyebrow mt-3 text-ink-500">
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
/*  Demo video — paper broadsheet                                      */
/* ------------------------------------------------------------------ */

function DemoVideo({ c }: { c: Copy }) {
  return (
    <section className="relative border-b border-paper-ink/15 bg-paper py-24 text-paper-ink sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-grid-paper" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <div className="eyebrow text-signal-600">{c.demo.eyebrow}</div>
            <h2 className="mt-4 font-display text-4xl font-medium text-paper-ink sm:text-5xl">
              {c.demo.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-8 text-paper-ink/70">{c.demo.body}</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-10 rounded-lg border border-paper-ink bg-ink-950 p-2 shadow-[8px_8px_0_0_#191b12]">
            <video
              className="aspect-video w-full rounded-sm bg-ink-900"
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

/* ------------------------------------------------------------------ */
/*  How it works — ruled ledger columns on paper                       */
/* ------------------------------------------------------------------ */

function HowItWorks({ c }: { c: Copy }) {
  return (
    <section className="relative bg-paper py-24 text-paper-ink sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-grid-paper" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="eyebrow text-signal-600">{c.how.eyebrow}</p>
          </Reveal>
          <Reveal delay={70}>
            <h2 className="mt-4 font-display text-4xl font-medium text-paper-ink sm:text-5xl">
              {c.how.title}
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-5 text-lg leading-8 text-paper-ink/70">{c.how.subtitle}</p>
          </Reveal>
        </div>

        <Reveal delay={100}>
          <div className="mt-16 grid gap-px overflow-hidden rounded-lg border border-paper-ink/15 bg-paper-ink/15 sm:grid-cols-2 lg:grid-cols-4">
            {c.how.steps.map((step, i) => {
              const Icon = HOW_ICONS[i];
              return (
                <div key={step.title} className="group bg-paper p-6 transition-colors hover:bg-paper-deep">
                  <div className="flex items-start justify-between">
                    <span className="font-display text-5xl font-medium leading-none text-paper-ink/15 transition-colors group-hover:text-signal-600">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-paper-ink/20 text-paper-ink transition-colors group-hover:border-signal-600 group-hover:text-signal-600">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="mt-8 text-lg font-semibold tracking-tight text-paper-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-paper-ink/70">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-10 flex justify-center">
            <Link href="/how-it-works" className={BTN_SECONDARY_PAPER}>
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
/*  Features — console grid                                            */
/* ------------------------------------------------------------------ */

function Features({ c }: { c: Copy }) {
  return (
    <section className="border-y border-ink-800 bg-ink-900 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow text-signal-500">{c.features.eyebrow}</p>
          </Reveal>
          <Reveal delay={70}>
            <h2 className="mt-4 font-display text-4xl font-medium text-ink-50 sm:text-5xl">
              {c.features.title}
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-5 text-lg leading-8 text-ink-300">{c.features.subtitle}</p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.features.items.map((item, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <Reveal key={item.title} delay={i * 70}>
                <div className="hover-lift h-full rounded-lg border border-ink-700 bg-ink-950 p-6 hover:border-signal-500/40">
                  <span className="flex h-11 w-11 items-center justify-center rounded-sm border border-signal-500/30 bg-signal-500/10 text-signal-400">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-6 text-lg font-semibold tracking-tight text-ink-50">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-400">{item.desc}</p>
                  <div className="mt-5 h-px w-full bg-gradient-to-r from-signal-500/40 to-transparent" />
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
/*  Trust — paper                                                      */
/* ------------------------------------------------------------------ */

function Trust({ c }: { c: Copy }) {
  return (
    <section className="relative bg-paper py-24 text-paper-ink sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-grid-paper" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <Reveal>
              <p className="eyebrow text-signal-600">{c.trust.eyebrow}</p>
            </Reveal>
            <Reveal delay={70}>
              <h2 className="mt-4 font-display text-4xl font-medium text-paper-ink sm:text-5xl">
                {c.trust.title}
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-5 max-w-xl text-lg leading-8 text-paper-ink/70">
                {c.trust.subtitle}
              </p>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-8">
                <Link href="/register" className={BTN_PRIMARY_PAPER}>
                  {c.trust.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="space-y-3">
            {c.trust.points.map((point, i) => (
              <Reveal key={point} delay={i * 70}>
                <div className="flex items-start gap-3 rounded-md border border-paper-ink/15 bg-paper p-5 transition-colors hover:border-paper-ink/40">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-paper-ink text-paper">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm leading-6 text-paper-ink/80">{point}</span>
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
    <section className="border-y border-ink-800 bg-ink-950 py-24 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
          <p className="eyebrow text-signal-500">{c.testimonial.eyebrow}</p>
        </Reveal>
        <Reveal delay={60}>
          <div className="font-display text-7xl leading-none text-signal-500" aria-hidden="true">
            &ldquo;
          </div>
        </Reveal>
        <Reveal delay={80}>
          <blockquote className="font-display text-2xl font-medium leading-snug text-ink-100 sm:text-3xl">
            {c.testimonial.quote}
          </blockquote>
        </Reveal>
        <Reveal delay={160}>
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-signal-500 font-mono text-sm font-bold text-ink-950">
              SC
            </span>
            <div className="text-left">
              <div className="text-sm font-semibold text-ink-50">{c.testimonial.name}</div>
              <div className="font-mono text-xs text-ink-500">{c.testimonial.role}</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA — signal dispatch panel                                        */
/* ------------------------------------------------------------------ */

function CTASection({ c }: { c: Copy }) {
  return (
    <section className="bg-ink-950 px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
      <Reveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-lg bg-signal-500 p-10 text-center text-ink-950 sm:p-16">
          <div className="pointer-events-none absolute inset-0 bg-noise opacity-20" aria-hidden="true" />
          <div className="relative">
            <div className="eyebrow inline-flex items-center gap-2 rounded-full border border-ink-950/30 px-3.5 py-1.5 text-ink-950/80">
              {c.cta.eyebrow}
            </div>
            <h2 className="mt-6 font-display text-4xl font-medium text-ink-950 sm:text-5xl lg:text-6xl">
              {c.cta.title}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-ink-950/75">
              {c.cta.subtitle}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2 rounded-md bg-ink-950 px-7 text-sm font-semibold text-ink-50 transition-colors hover:bg-ink-850"
              >
                {c.cta.primary}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/for-developers"
                className="inline-flex h-12 items-center gap-2 rounded-md border border-ink-950/40 px-7 text-sm font-medium text-ink-950 transition-colors hover:bg-ink-950/10"
              >
                {c.cta.secondary}
              </Link>
            </div>
            <p className="mt-6 font-mono text-xs text-ink-950/60">{c.cta.note}</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Try it live — dispatch console                                     */
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
    <section className="relative overflow-hidden bg-ink-950 py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <div className="eyebrow text-signal-500">{t.eyebrow}</div>
            <h2 className="mt-4 font-display text-4xl font-medium text-ink-50 sm:text-5xl">{t.title}</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-8 text-ink-300">{t.body}</p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="corner-brackets mt-10 rounded-lg border border-ink-700 bg-ink-900 p-4 shadow-panel sm:p-5">
            <div className="mb-3 flex items-center justify-between border-b border-ink-800 pb-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">
                input / brief
              </span>
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="h-2 w-2 rounded-full bg-ink-700" />
                <span className="h-2 w-2 rounded-full bg-ink-700" />
                <span className="h-2 w-2 rounded-full bg-signal-500" />
              </span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={t.placeholder}
              className="w-full resize-none rounded-md border border-ink-700 bg-ink-950 px-4 py-3 font-mono text-sm text-ink-100 placeholder:text-ink-600 focus:border-signal-500 focus:outline-none focus:ring-1 focus:ring-signal-500"
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {t.examples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => run(ex)}
                    className="rounded-full border border-ink-700 px-3 py-1 font-mono text-[11px] text-ink-400 transition-colors hover:border-signal-500 hover:text-signal-400"
                  >
                    {ex.length > 42 ? ex.slice(0, 42) + "…" : ex}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => run(input)}
                disabled={loading || input.trim().length < 10}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-signal-500 px-6 text-sm font-semibold text-ink-950 transition-all hover:bg-signal-400 hover:shadow-glow-sm disabled:opacity-50"
              >
                {loading ? t.loading : t.button}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </Reveal>

        {error && <p className="mt-4 text-center text-sm text-danger">{error}</p>}

        {loading && (
          <div className="mt-6 flex items-center justify-center gap-3 font-mono text-sm text-ink-400">
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-signal-500" />
            {t.loading}
            <span className="animate-blink text-signal-500">▌</span>
          </div>
        )}

        {result && !loading && (
          <div className="mt-8 space-y-6">
            {/* Spec */}
            <div className="rounded-lg border border-ink-700 bg-ink-900 p-6 shadow-panel">
              <div className="eyebrow text-ink-500">{t.specTitle}</div>
              {result.spec.objective && (
                <p className="mt-3 font-display text-xl leading-8 text-ink-50">{result.spec.objective}</p>
              )}
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <div>
                  <div className="eyebrow mb-3 text-signal-400">{t.deliverablesLabel}</div>
                  <ul className="space-y-1.5">
                    {result.spec.deliverables.map((d, i) => (
                      <li key={i} className="flex gap-2 text-sm text-ink-300">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="eyebrow mb-3 text-signal-400">{t.criteriaLabel}</div>
                  <ul className="space-y-1.5">
                    {result.spec.success_criteria.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-ink-300">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-signal-400" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Task breakdown + matched executors */}
            <div>
              <div className="eyebrow mb-4 text-ink-500">{t.breakdownTitle}</div>
              <div className="grid gap-4 md:grid-cols-2">
                {result.tasks.map((task, i) => (
                  <div key={i} className="hover-lift rounded-lg border border-ink-700 bg-ink-900 p-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-sm border border-signal-500/40 bg-signal-500/10 font-mono text-xs text-signal-400">
                        {i + 1}
                      </span>
                      <span className="rounded-sm border border-ink-700 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-ink-400">
                        {task.task_type}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-ink-50">{task.title}</p>
                    <div className="mt-4">
                      <div className="eyebrow mb-2 text-[10px] text-ink-500">
                        {t.matchedLabel}
                      </div>
                      <div className="space-y-1.5">
                        {task.matched.map((m, mi) => (
                          <div key={m.slug} className="flex items-center gap-2">
                            <span className={mi === 0 ? "text-signal-400" : "text-ink-600"}>
                              {mi === 0 ? <Trophy className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                            </span>
                            <span className="w-28 shrink-0 truncate font-mono text-xs text-ink-200">{m.name}</span>
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-800">
                              <span
                                className={`block h-full rounded-full ${mi === 0 ? "bg-signal-500" : "bg-ink-600"}`}
                                style={{ width: `${Math.max(6, Math.min(100, m.score))}%` }}
                              />
                            </span>
                            <span className="w-10 shrink-0 text-right font-mono text-xs text-ink-500">
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
                className="inline-flex h-11 items-center gap-2 rounded-md border border-ink-600 px-6 text-sm font-medium text-ink-100 transition-colors hover:border-ink-400 hover:bg-ink-800"
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

export default function LandingPage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;

  return (
    <main className="min-h-screen bg-ink-950 text-ink-50">
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
