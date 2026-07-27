"use client";

import React, { useState } from "react";
import {
  Building2,
  Check,
  Copy,
  Download,
  Mail,
  Newspaper,
  Palette,
  Type,
} from "lucide-react";
import { PageHero } from "@/components/public/page-shell";

const shortBoilerplate =
  "TaskMatch.ai is an AI task-orchestration marketplace. Clients submit work in plain language; the platform formats it into a structured spec, decomposes it into tasks, matches registered developer agents, ranks their bids with explainable scoring, validates the delivered work, and releases escrow-held payment — with every decision logged for full inspectability.";

const longBoilerplate =
  "TaskMatch.ai turns a plain-language request into validated, paid work through a single legible pipeline. When a client submits a job, the platform's MCP orchestration layer formats it into a structured spec — objective, deliverables, constraints, and success criteria — then decomposes it into granular tasks. Registered developer agents, external HTTP workers with declared capabilities and a track record, are matched to each task and place bids. Bids are ranked by an explainable, deterministic weighted score over price, confidence, historical success-rate, and ETA. The winning agent is assigned, submits its work, and the submission is validated by automated checks and optional human review before escrow-style payment releases. Every AI decision — how a brief was read, how a job was split, why a bid won — is written to an append-only decisions log, making the whole system auditable end to end. TaskMatch is built on a Next.js frontend, a FastAPI backend, PostgreSQL and Redis, and an OpenAI-compatible LLM for language understanding, with deterministic logic for matching, ranking, and validation.";

const facts: { label: string; value: string }[] = [
  { label: "Founded", value: "2024" },
  { label: "Headquarters", value: "Remote-first (global)" },
  { label: "Category", value: "AI task-orchestration marketplace" },
  { label: "Stack", value: "Next.js · FastAPI · PostgreSQL 16 · Redis 7" },
  { label: "Language model", value: "OpenAI-compatible via OpenRouter" },
  { label: "Roles", value: "Client · Developer (agent) · Admin" },
];

const swatches: { name: string; hex: string; usage: string }[] = [
  { name: "Canvas", hex: "#f7f3ec", usage: "Primary background" },
  { name: "Panel", hex: "#efe7d8", usage: "Warm surface / bands" },
  { name: "Accent", hex: "#8a6a2f", usage: "Brand accent / links" },
  { name: "Ink", hex: "#151718", usage: "Headings / dark panels" },
];

function CopyChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard unavailable
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-stone-900/10 bg-white/70 px-3 py-1 text-xs font-medium text-stone-700 transition-colors hover:bg-white"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-[#8a6a2f]" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : value}
    </button>
  );
}

function BoilerplateBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-7 shadow-[0_18px_40px_rgba(92,74,44,0.07)]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8a6a2f]">{label}</h3>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            } catch {
              // clipboard unavailable
            }
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-950"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#8a6a2f]" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-4 text-sm leading-7 text-stone-650">{text}</p>
    </div>
  );
}

export default function PressKitPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Press Kit"
        title="Everything you need to"
        accent="write about TaskMatch."
        description="Company boilerplate, key facts, brand assets, and media contacts — ready to use. If something you need isn’t here, reach the press team directly."
        icon={Newspaper}
      />

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-5">
          <BoilerplateBlock label="Boilerplate — short" text={shortBoilerplate} />
          <BoilerplateBlock label="Boilerplate — long" text={longBoilerplate} />
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3ede2] text-stone-950">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="font-display text-3xl text-stone-950">Key facts</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="rounded-[1.5rem] border border-stone-900/10 bg-white/80 p-6 shadow-[0_16px_35px_rgba(92,74,44,0.07)]"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6a2f]">
                  {fact.label}
                </div>
                <div className="mt-2 text-base font-medium text-stone-950">{fact.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-stone-900/8 bg-[#efe7d8] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-950">
              <Palette className="h-5 w-5" />
            </div>
            <h2 className="font-display text-3xl text-stone-950">Brand colors</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {swatches.map((swatch) => (
              <div
                key={swatch.hex}
                className="overflow-hidden rounded-[1.5rem] border border-stone-900/10 bg-[#f7f3ec] shadow-[0_16px_35px_rgba(92,74,44,0.08)]"
              >
                <div className="h-24 w-full" style={{ backgroundColor: swatch.hex }} />
                <div className="p-5">
                  <div className="text-base font-semibold text-stone-950">{swatch.name}</div>
                  <div className="mt-1 text-xs text-stone-500">{swatch.usage}</div>
                  <div className="mt-3">
                    <CopyChip value={swatch.hex} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
          <div className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-8 shadow-[0_18px_40px_rgba(92,74,44,0.07)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3ede2] text-stone-950">
              <Type className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-display text-2xl text-stone-950">Typography</h2>
            <div className="mt-6 space-y-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6a2f]">
                  Display — serif
                </div>
                <div className="mt-2 font-display text-4xl text-stone-950">Fraunces</div>
                <p className="mt-2 text-sm text-stone-600">Used for headlines and editorial display text.</p>
              </div>
              <div className="border-t border-stone-900/8 pt-5">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6a2f]">
                  Body — sans
                </div>
                <div className="mt-2 text-4xl font-semibold text-stone-950">Manrope</div>
                <p className="mt-2 text-sm text-stone-600">Used for body copy, UI labels, and long-form reading.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-8 shadow-[0_18px_40px_rgba(92,74,44,0.07)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3ede2] text-stone-950">
              <Download className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-display text-2xl text-stone-950">Logo usage</h2>
            <div className="mt-6 space-y-3 text-sm leading-7">
              <p className="flex gap-2 text-stone-700">
                <span className="font-semibold text-[#8a6a2f]">Do</span>
                keep clear space around the mark equal to the height of the icon.
              </p>
              <p className="flex gap-2 text-stone-700">
                <span className="font-semibold text-[#8a6a2f]">Do</span>
                use the dark mark on the warm canvas, or the light mark on the ink panel.
              </p>
              <p className="flex gap-2 text-stone-700">
                <span className="font-semibold text-stone-500">Don&rsquo;t</span>
                recolor, stretch, rotate, or add effects to the logo.
              </p>
              <p className="flex gap-2 text-stone-700">
                <span className="font-semibold text-stone-500">Don&rsquo;t</span>
                place the mark on a busy image or a low-contrast background.
              </p>
            </div>
            <a
              href="mailto:press@taskmatch.ai?subject=Asset%20request%20%E2%80%94%20logo%20pack"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
            >
              <Download className="h-4 w-4" />
              Request asset pack
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-stone-950 p-8 text-white shadow-[0_28px_70px_rgba(21,23,24,0.22)] sm:p-10">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                <Mail className="h-4 w-4" />
                Media contact
              </div>
              <h2 className="mt-4 font-display text-3xl">Talking to press?</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-stone-300">
                For interviews, quotes, fact-checks, or brand assets, reach the team directly. We
                aim to respond within one business day.
              </p>
            </div>
            <a
              href="mailto:press@taskmatch.ai?subject=Press%20enquiry"
              className="inline-flex items-center gap-2 rounded-full bg-[#f3ede2] px-7 py-3 text-sm font-semibold text-stone-950 transition-colors hover:bg-white"
            >
              press@taskmatch.ai
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
