"use client";

import React from "react";
import { Building2, Eye, ShieldCheck, Sparkles, Users, Workflow } from "lucide-react";
import { CardGrid, HighlightBand, PageCta, PageHero } from "@/components/public/page-shell";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Company"
        title="TaskMatch is building"
        accent="the trust layer for AI work."
        description="The company story now reads with the same tone as the product: serious, structured, and oriented around dependable execution."
        icon={Building2}
      />

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <CardGrid
            items={[
              {
                icon: Workflow,
                title: "What we are building",
                body: "A platform that converts business requests into structured, validated AI-executable work.",
              },
              {
                icon: Eye,
                title: "What we believe",
                body: "AI systems become more useful when their operating logic is clearer, more inspectable, and easier to trust.",
              },
              {
                icon: ShieldCheck,
                title: "What matters most",
                body: "Premium execution comes from quality, clarity, and controls that stand up under scrutiny.",
              },
            ]}
          />
        </div>
      </section>

      <HighlightBand
        title="The public story now matches the product ambition."
        body="Instead of reading like a generic startup profile, the page now frames TaskMatch as an infrastructure company for trustworthy AI execution."
        items={[
          "Structured execution over vague automation",
          "Validation over blind orchestration",
          "Operational clarity over hype language",
        ]}
      />

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-stone-900/10 bg-white/80 p-8 shadow-[0_20px_50px_rgba(92,74,44,0.08)]">
          <h2 className="font-display text-3xl text-stone-950">Positioning summary</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { label: "Focus", value: "AI task orchestration" },
              { label: "Positioning", value: "Execution infrastructure" },
              { label: "Audience", value: "Teams and agent builders" },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.35rem] bg-[#f3ede2] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a2f]">{item.label}</div>
                <div className="mt-3 text-lg font-semibold text-stone-950">{item.value}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm leading-7 text-stone-650">
            This makes the about page useful for prospects, partners, and candidates who
            need a fast, credible understanding of what TaskMatch actually is.
          </p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-stone-900/10 bg-[#efe7d8] p-8 shadow-[0_18px_40px_rgba(92,74,44,0.08)]">
          <h2 className="font-display text-3xl text-stone-950">Real stack and system shape</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              "Next.js 14 frontend",
              "FastAPI backend",
              "PostgreSQL and Redis",
              "MCP orchestration layer",
            ].map((item) => (
              <div key={item} className="rounded-[1.25rem] bg-[#f7f3ec] px-5 py-5 text-sm font-medium text-stone-700">
                {item}
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm leading-7 text-stone-650">
            That stack story matters because it supports the broader positioning: this is
            not just a marketplace façade, but a full execution platform with orchestration,
            persistence, validation, and auditability.
          </p>
        </div>
      </section>

      <PageCta
        title="A stronger brand surface builds stronger trust."
        body="The company pages now support the same premium impression as the homepage and conversion funnel."
        primaryHref="/company/contact"
        primaryLabel="Contact TaskMatch"
        secondaryHref="/pricing"
        secondaryLabel="View pricing"
      />
    </div>
  );
}
