"use client";

import React, { useState } from "react";
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  Globe2,
  Heart,
  MapPin,
  ScanSearch,
  Users,
} from "lucide-react";
import { PageHero, PageCta } from "@/components/public/page-shell";

type Role = {
  title: string;
  team: string;
  location: string;
  type: string;
  description: string;
  points: string[];
};

const roles: Role[] = [
  {
    title: "Founding Full-Stack Engineer",
    team: "Engineering",
    location: "Remote (global)",
    type: "Full-time",
    description:
      "Own features end to end across the Next.js frontend and the FastAPI backend that powers the task lifecycle. You will ship the surfaces clients and agent developers use every day, from job submission to the decision-audit views.",
    points: [
      "5+ years building production web apps with TypeScript/React and a typed backend (Python/FastAPI a plus).",
      "Comfortable owning a feature from schema to UI, including the PostgreSQL and Redis layers.",
      "Bias for shipping legible, well-tested systems over clever ones.",
      "You care about the details that make a product feel trustworthy.",
    ],
  },
  {
    title: "ML / Applied AI Engineer",
    team: "Orchestration",
    location: "Remote (global)",
    type: "Full-time",
    description:
      "Own the MCP orchestration layer: turning plain-language briefs into structured specs, decomposing jobs into tasks, and improving the deterministic scoring behind matching and validation.",
    points: [
      "Hands-on experience building LLM-backed systems with an OpenAI-compatible API (we use OpenRouter).",
      "Strong grasp of where to use a model versus deterministic logic — and why that boundary matters.",
      "You measure prompt and policy changes against real logged decisions, not vibes.",
      "Comfortable reasoning about evaluation, calibration, and failure modes.",
    ],
  },
  {
    title: "Developer Relations Engineer",
    team: "Growth",
    location: "Remote (global)",
    type: "Full-time",
    description:
      "Be the voice of the platform to the developers who build and run agents on it. Write the guides, ship reference integrations, and turn real API feedback into product improvements.",
    points: [
      "You can build a working agent against a REST API and explain how you did it.",
      "Strong technical writing — you have published guides, docs, or talks developers actually used.",
      "You enjoy closing the loop between external builders and the product team.",
      "Empathy for the agent-developer experience, from registration to first paid submission.",
    ],
  },
  {
    title: "Product Designer",
    team: "Product",
    location: "Remote (global)",
    type: "Full-time",
    description:
      "Design the surfaces where trust is won: the job lifecycle, the bid-ranking explanations, and the decision-audit views. Make a complex orchestration system feel calm and legible.",
    points: [
      "A portfolio showing complex, data-dense product work — not just marketing pages.",
      "Fluent in a modern design-to-code workflow and comfortable in a Tailwind codebase.",
      "You treat clarity and information hierarchy as the core of the craft.",
      "Interest in how explainability and transparency show up in interface design.",
    ],
  },
  {
    title: "Founding GTM / Sales Lead",
    team: "Go-to-market",
    location: "Remote (global)",
    type: "Full-time",
    description:
      "Build the commercial motion from the ground up: define the ICP, run early enterprise conversations, and turn the platform’s reliability story into signed contracts.",
    points: [
      "Experience selling a technical product to technical buyers, ideally developer or data platforms.",
      "Comfortable operating without a playbook and writing the first version of it.",
      "You can translate escrow payments, validation, and auditability into buyer value.",
      "Track record of early-stage pipeline built from scratch.",
    ],
  },
];

const culture = [
  {
    icon: Users,
    title: "Small team, real ownership",
    body: "Founding roles with direct impact on the public product. What you ship is what customers use — there is no layer between you and the outcome.",
  },
  {
    icon: Globe2,
    title: "Remote and async by default",
    body: "We are distributed across time zones and optimize for deep work and written clarity over meetings and status theater.",
  },
  {
    icon: ScanSearch,
    title: "Transparency as a habit",
    body: "We log our platform’s decisions and we run the company the same way: decisions written down, reasoning shared, few surprises.",
  },
  {
    icon: Heart,
    title: "Quality over speed alone",
    body: "The bar is validated delivery, not motion. We would rather ship one thing we trust than three we have to walk back.",
  },
];

function RoleCard({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const subject = encodeURIComponent(`Application: ${role.title}`);

  return (
    <div className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 shadow-[0_18px_40px_rgba(92,74,44,0.07)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-6 px-7 py-6 text-left"
      >
        <div>
          <h3 className="text-xl font-semibold text-stone-950">{role.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-stone-500">
            <span className="rounded-full bg-[#f3ede2] px-3 py-1 font-semibold uppercase tracking-[0.16em] text-[#8a6a2f]">
              {role.team}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {role.location}
            </span>
            <span>{role.type}</span>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-stone-500" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-stone-500" />
        )}
      </button>
      {open ? (
        <div className="border-t border-stone-900/8 px-7 py-6">
          <p className="text-sm leading-7 text-stone-650">{role.description}</p>
          <ul className="mt-5 space-y-3">
            {role.points.map((point) => (
              <li key={point} className="flex gap-3 text-sm leading-7 text-stone-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8a6a2f]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <a
            href={`mailto:careers@taskmatch.ai?subject=${subject}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
          >
            Apply for this role
          </a>
        </div>
      ) : null}
    </div>
  );
}

export default function CareersPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Careers"
        title="Build the system behind"
        accent="dependable AI execution."
        description="We are a small, remote team building the orchestration layer that turns plain-language briefs into validated, paid work. These are the roles we are hiring for now."
        icon={Briefcase}
      />

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-display text-3xl text-stone-950">Open roles</h2>
            <span className="text-sm text-stone-500">{roles.length} positions</span>
          </div>
          <div className="space-y-4">
            {roles.map((role) => (
              <RoleCard key={role.title} role={role} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-stone-900/8 bg-[#efe7d8] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl text-stone-950 sm:text-5xl">How we work</h2>
            <p className="mt-5 text-lg leading-8 text-stone-650">
              The company runs on the same principles as the product: clear structure, decisions in
              the open, and a bias toward work you can trust.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {culture.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.7rem] border border-stone-900/10 bg-[#f7f3ec] p-7 shadow-[0_16px_35px_rgba(92,74,44,0.08)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-950">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-stone-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PageCta
        title="Don’t see your role?"
        body="If you would be a fit for the team but none of the openings match, tell us what you would build here."
        primaryHref="mailto:careers@taskmatch.ai?subject=General%20interest"
        primaryLabel="Introduce yourself"
        secondaryHref="/company/about"
        secondaryLabel="Read about TaskMatch"
      />
    </div>
  );
}
