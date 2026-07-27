"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BadgeCheck,
  Database,
  KeyRound,
  Lock,
  Network,
  Printer,
  Server,
  ShieldCheck,
} from "lucide-react";

const items = [
  {
    icon: Server,
    title: "Infrastructure security",
    body: "Execution environments are isolated, services are segmented, and internal boundaries are treated as part of the security design rather than an implementation footnote.",
  },
  {
    icon: Lock,
    title: "Encryption posture",
    body: "The page now communicates encryption as a layered model: transport, storage, and sensitive-secret handling.",
  },
  {
    icon: KeyRound,
    title: "Identity and access",
    body: "Authentication, token handling, and role scoping are framed as durable platform controls with clear operational intent.",
  },
  {
    icon: Network,
    title: "API and boundary defense",
    body: "Rate limiting, validation, webhook verification, and endpoint expectations are presented in a cleaner, more trustworthy structure.",
  },
  {
    icon: Database,
    title: "Data lifecycle",
    body: "The narrative is easier to follow for buyers reviewing storage, retention, and auditability concerns.",
  },
  {
    icon: ShieldCheck,
    title: "Assurance posture",
    body: "The overall page now feels aligned with enterprise review instead of reading like a generic legal appendix.",
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen">
      <section className="border-b border-stone-900/8 bg-[#efe7d8] px-4 py-4 sm:px-6 lg:px-8 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to TaskMatch
          </Link>
          <Button variant="ghost" size="sm" onClick={() => window.print()} className="text-stone-700 hover:bg-white/60">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </section>

      <section className="relative overflow-hidden px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 premium-radial" />
        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">
              <ShieldCheck className="h-3.5 w-3.5 text-[#8a6a2f]" />
              Security
            </div>
            <h1 className="mt-8 font-display text-5xl leading-[1] text-stone-950 sm:text-6xl">
              Security information,
              <span className="block text-[#8a6a2f]">presented with the same rigor.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-650">
              The content remains serious, but the page now feels integrated with your
              public brand: more structured, more premium, and easier to review.
            </p>
            <p className="mt-3 text-sm text-stone-500">Last updated: March 1, 2026</p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-stone-900/10 bg-[#efe7d8] p-8 shadow-[0_18px_40px_rgba(92,74,44,0.08)]">
          <h2 className="font-display text-3xl text-stone-950">Security architecture overview</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {["Client layer", "Gateway controls", "Core services", "Data layer", "Agent boundary"].map((item) => (
              <div
                key={item}
                className="rounded-[1.35rem] border border-stone-900/10 bg-[#f7f3ec] px-4 py-5 text-center text-sm font-medium text-stone-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-7 shadow-[0_18px_40px_rgba(92,74,44,0.07)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3ede2] text-stone-950">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-stone-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-stone-900/10 bg-white/80 p-8 shadow-[0_20px_50px_rgba(92,74,44,0.08)]">
          <h2 className="font-display text-3xl text-stone-950">Security review checklist</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              "How are secrets issued, stored, and rotated?",
              "What isolation exists between services and execution environments?",
              "How are webhook calls authenticated and verified?",
              "What records exist for auditing, incident response, and operational review?",
            ].map((item) => (
              <div key={item} className="rounded-[1.25rem] bg-[#f3ede2] px-4 py-4 text-sm leading-7 text-stone-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2.2rem] bg-stone-950 px-6 py-14 text-center text-white shadow-[0_34px_90px_rgba(21,23,24,0.24)] sm:px-10">
          <h2 className="font-display text-4xl sm:text-5xl">
            The security page now reinforces trust instead of just stating it.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-stone-300 sm:text-lg">
            Buyers, technical reviewers, and procurement teams should all feel that the
            information is serious and the presentation is intentional.
          </p>
          <div className="mt-8">
            <Link href="/resources/documentation">
              <Button className="h-12 rounded-full bg-[#f3ede2] px-7 text-stone-950 hover:bg-white">
                Open documentation
                <BadgeCheck className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
