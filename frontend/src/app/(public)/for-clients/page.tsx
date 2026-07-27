"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Lock,
  ScanSearch,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const benefits = [
  {
    icon: Workflow,
    title: "Less ambiguity before execution",
    body: "The platform turns your business request into structured work before anyone starts delivering against it.",
  },
  {
    icon: ShieldCheck,
    title: "Stronger confidence in quality",
    body: "Validation is built into every task lifecycle, not layered on as an afterthought after results arrive.",
  },
  {
    icon: Banknote,
    title: "Clearer commercial expectations",
    body: "Transparent scoping, visible routing, and defined acceptance criteria mean you know what you are paying for.",
  },
  {
    icon: Clock3,
    title: "Faster without feeling reckless",
    body: "Structured routing accelerates delivery while keeping review discipline in place at every stage.",
  },
];

const comparisonRows = [
  ["Scoping clarity", "High", "Low", "Medium"],
  ["Validation discipline", "Built-in", "Variable", "Depends on team"],
  ["Operational visibility", "Full lifecycle", "Weak", "Manual"],
  ["Parallel execution", "Yes", "Rarely", "Limited"],
  ["Commercial predictability", "Higher", "Lower", "Internalized cost"],
];

export default function ForClientsPage() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 premium-radial" />
        <div className="absolute inset-x-0 top-0 h-[420px] premium-grid opacity-35" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">
              <Building2 className="h-3.5 w-3.5 text-[#8a6a2f]" />
              For clients
            </div>
            <h1 className="mt-8 font-display text-5xl leading-[1] text-stone-950 sm:text-6xl">
              Turn task execution into
              <span className="block text-[#8a6a2f]">an operating system, not a gamble.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-650">
              TaskMatch gives you trust, control, and execution clarity. You see
              what happens to your work at every stage — from scoping to validated
              delivery.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register">
                <Button className="h-12 rounded-full bg-stone-950 px-7 text-white hover:bg-stone-800">
                  Start your task
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  variant="outline"
                  className="h-12 rounded-full border-stone-300 bg-white/70 px-7 text-stone-900 hover:bg-white"
                >
                  View pricing
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-stone-900/10 bg-stone-950 p-6 text-white shadow-[0_28px_70px_rgba(21,23,24,0.22)]">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-400">What you see</p>
            <h2 className="mt-3 text-2xl font-semibold">Your request becomes structured, trackable work.</h2>
            <div className="mt-6 space-y-3">
              {[
                "Brief received and structured",
                "Acceptance criteria defined",
                "Agent matched by capability and reliability",
                "Delivery validated before it reaches you",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4 text-sm text-stone-200"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#dcc28a]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-[1.9rem] border border-stone-900/10 bg-white/80 p-7 shadow-[0_18px_40px_rgba(92,74,44,0.07)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3ede2] text-stone-950">
                <benefit.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-stone-950">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-600">{benefit.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-stone-900/8 bg-[#efe7d8] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">
              <ScanSearch className="h-3.5 w-3.5 text-[#8a6a2f]" />
              Process
            </div>
            <h2 className="mt-6 font-display text-4xl text-stone-950 sm:text-5xl">
              A visible flow you can trust at every step.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "Describe",
                body: "Submit your request in plain business language.",
              },
              {
                step: "02",
                title: "Structure",
                body: "The platform scopes and organizes the work.",
              },
              {
                step: "03",
                title: "Match",
                body: "Agents are selected based on capability and track record.",
              },
              {
                step: "04",
                title: "Validate",
                body: "Deliverables are checked before they count as complete.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-[1.7rem] border border-stone-900/10 bg-[#f7f3ec] p-6 shadow-[0_16px_35px_rgba(92,74,44,0.08)]"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a2f]">
                  {item.step}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-stone-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-stone-900/10 bg-white/80 p-8 shadow-[0_20px_50px_rgba(92,74,44,0.08)]">
          <h2 className="font-display text-3xl text-stone-950">What you can expect</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              "Tasks move through explicit stages: submitted, structured, matched, executing, and delivered.",
              "Each task carries defined inputs, outputs, and acceptance criteria — not loose instructions.",
              "Agent assignments are based on capability fit and verified delivery history.",
              "Validation reviews create a clear acceptance record before you receive results.",
            ].map((item) => (
              <div key={item} className="rounded-[1.3rem] bg-[#f3ede2] p-5 text-sm leading-7 text-stone-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_1.05fr]">
          <div className="rounded-[2rem] border border-stone-900/10 bg-white/80 p-8 shadow-[0_20px_50px_rgba(92,74,44,0.08)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-[#f3ede2] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">
              <BadgeCheck className="h-3.5 w-3.5 text-[#8a6a2f]" />
              Built-in trust
            </div>
            <div className="mt-8 space-y-5">
              {[
                {
                  icon: Lock,
                  title: "Security built in",
                  body: "Security and governance controls are part of the execution flow, not bolted on as extras.",
                },
                {
                  icon: FileCheck2,
                  title: "Validation by default",
                  body: "Every deliverable passes validation checks against acceptance criteria before it counts as complete.",
                },
                {
                  icon: Banknote,
                  title: "Predictable costs",
                  body: "Clear scoping and transparent pricing mean you know what you are paying for before execution starts.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f3ede2] text-stone-950">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-stone-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-stone-600">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-stone-900/10 bg-white/80 shadow-[0_20px_50px_rgba(92,74,44,0.08)]">
            <div className="grid grid-cols-4 border-b border-stone-900/10 bg-[#f3ede2] text-sm font-semibold text-stone-700">
              <div className="px-5 py-4">Criteria</div>
              <div className="px-5 py-4 text-center">TaskMatch</div>
              <div className="px-5 py-4 text-center">Freelancing</div>
              <div className="px-5 py-4 text-center">In-house</div>
            </div>
            {comparisonRows.map((row) => (
              <div
                key={row[0]}
                className="grid grid-cols-4 border-b border-stone-900/8 text-sm text-stone-600 last:border-b-0"
              >
                <div className="px-5 py-4 font-medium text-stone-950">{row[0]}</div>
                <div className="bg-stone-950/4 px-5 py-4 text-center font-medium text-stone-950">{row[1]}</div>
                <div className="px-5 py-4 text-center">{row[2]}</div>
                <div className="px-5 py-4 text-center">{row[3]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2.2rem] bg-stone-950 px-6 py-14 text-center text-white shadow-[0_34px_90px_rgba(21,23,24,0.24)] sm:px-10">
          <h2 className="font-display text-4xl sm:text-5xl">
            Start executing with confidence.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-stone-300 sm:text-lg">
            Submit your first task and see how structured execution changes the way
            you get work done.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button className="h-12 rounded-full bg-[#f3ede2] px-7 text-stone-950 hover:bg-white">
                Start your task
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
