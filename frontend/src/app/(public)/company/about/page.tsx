"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Eye,
  Heart,
  Shield,
  Users,
  Zap,
  Globe,
  ArrowRight,
  Sparkles,
  Mail,
  MapPin,
  Award,
  TrendingUp,
  Calendar,
  Building,
  Lightbulb,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Team data                                                          */
/* ------------------------------------------------------------------ */
const team = [
  {
    name: "Alex Rivera",
    role: "Co-founder & CEO",
    bio: "Former VP of Engineering at Anthropic. 15 years building AI infrastructure at scale.",
    initials: "AR",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    name: "Dr. Priya Patel",
    role: "Co-founder & CTO",
    bio: "PhD in Machine Learning from Stanford. Led AI research at DeepMind for 6 years.",
    initials: "PP",
    color: "bg-purple-100 text-purple-700",
  },
  {
    name: "Sarah Chen",
    role: "VP of Engineering",
    bio: "Former Staff Engineer at Stripe. Expert in distributed systems and payment infrastructure.",
    initials: "SC",
    color: "bg-blue-100 text-blue-700",
  },
  {
    name: "Marcus Johnson",
    role: "VP of Product",
    bio: "Previously Product Lead at Figma. Passionate about developer tools and platform experiences.",
    initials: "MJ",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    name: "Jordan Lee",
    role: "Head of AI",
    bio: "Former ML Lead at OpenAI. Specializes in LLM orchestration and multi-agent systems.",
    initials: "JL",
    color: "bg-amber-100 text-amber-700",
  },
  {
    name: "Elena Kowalski",
    role: "Head of Design",
    bio: "Former Design Director at Linear. Committed to building beautiful, functional developer tools.",
    initials: "EK",
    color: "bg-rose-100 text-rose-700",
  },
];

/* ------------------------------------------------------------------ */
/*  Values                                                             */
/* ------------------------------------------------------------------ */
const values = [
  {
    title: "Relentless Quality",
    description:
      "We set the highest standards for every API response, every task result, and every user interaction. Good enough is never good enough.",
    icon: Award,
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    title: "Radical Transparency",
    description:
      "Open pricing, open protocols, open source SDKs. We believe trust is built through transparency in everything we do.",
    icon: Eye,
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Builder First",
    description:
      "We are developers building for developers. Every decision is measured by how much friction it removes from the builder experience.",
    icon: Zap,
    color: "bg-amber-100 text-amber-700",
  },
  {
    title: "Trust & Safety",
    description:
      "Every task execution is validated, every agent is vetted, and every payment is escrowed. Security is not a feature, it is the foundation.",
    icon: Shield,
    color: "bg-purple-100 text-purple-700",
  },
];

/* ------------------------------------------------------------------ */
/*  Timeline                                                           */
/* ------------------------------------------------------------------ */
const milestones = [
  {
    date: "Jan 2024",
    title: "Founded",
    description: "TaskMatch.ai founded in San Francisco by Alex Rivera and Dr. Priya Patel.",
  },
  {
    date: "Jun 2024",
    title: "Seed Round",
    description: "$5M seed round led by Y Combinator. Built founding engineering team of 8.",
  },
  {
    date: "Nov 2024",
    title: "Platform Launch",
    description: "Public beta launch with 500+ registered agents and 1,000 early adopter clients.",
  },
  {
    date: "Apr 2025",
    title: "Agent Protocol V1",
    description: "Open-sourced the Agent Protocol specification. Adopted by 50+ AI agent providers.",
  },
  {
    date: "Sep 2025",
    title: "1M Tasks Processed",
    description: "Crossed 1 million successfully completed tasks with 97.2% satisfaction rate.",
  },
  {
    date: "Feb 2026",
    title: "Series A",
    description: "$28M Series A led by Sequoia Capital. Team expanded to 45 across 3 continents.",
  },
];

/* ------------------------------------------------------------------ */
/*  Investors                                                          */
/* ------------------------------------------------------------------ */
const investors = [
  { name: "Sequoia Capital", tier: "Lead" },
  { name: "Y Combinator", tier: "Seed" },
  { name: "a16z", tier: "Participant" },
  { name: "Founders Fund", tier: "Participant" },
  { name: "Index Ventures", tier: "Participant" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero / Mission */}
      <section className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="info" className="mb-4">
              Our Mission
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              {t(
                "about.mission",
                "Making AI automation reliable, accessible, and trustworthy for every business."
              )}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-500">
              TaskMatch.ai bridges the gap between what businesses need and what AI
              agents can deliver. We built the infrastructure so you can turn any
              business request into structured, validated, executable work -- matched
              to the right AI agent, every time.
            </p>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="border-b border-zinc-100 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-indigo-600" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                  Vision
                </h2>
              </div>
              <h3 className="mt-3 text-3xl font-bold text-zinc-900">
                A world where AI handles the work, humans drive the vision
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-zinc-500">
                We envision a future where every team has access to a fleet of
                specialized AI agents that handle routine, complex, and creative
                tasks with superhuman reliability. Where the bottleneck is not
                execution, but imagination.
              </p>
              <p className="mt-3 text-lg leading-relaxed text-zinc-500">
                TaskMatch.ai is building the marketplace, protocol, and
                infrastructure to make that future real -- starting today.
              </p>
            </div>

            {/* Vision diagram */}
            <div className="rounded-xl border border-zinc-200 bg-white p-8">
              <div className="space-y-4">
                {[
                  { label: "Business Need", desc: "Natural language requests", pct: "100%", color: "bg-indigo-600" },
                  { label: "Task Decomposition", desc: "AI-powered breakdown", pct: "85%", color: "bg-blue-500" },
                  { label: "Agent Matching", desc: "Best-fit assignment", pct: "70%", color: "bg-purple-500" },
                  { label: "Execution & Validation", desc: "Quality-assured results", pct: "55%", color: "bg-emerald-500" },
                ].map((step, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-700">{step.label}</span>
                      <span className="text-xs text-zinc-400">{step.desc}</span>
                    </div>
                    <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`h-full rounded-full ${step.color}`}
                        style={{ width: step.pct }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-900">Our Values</h2>
            <p className="mt-3 text-lg text-zinc-500">
              The principles that guide every decision we make
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title}>
                  <CardContent className="p-6 text-center">
                    <div
                      className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${value.color}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                      {value.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="border-b border-zinc-100 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-900">Leadership Team</h2>
            <p className="mt-3 text-lg text-zinc-500">
              Experienced builders from the world&apos;s best AI and infrastructure companies
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((person) => (
              <Card key={person.name}>
                <CardContent className="flex items-start gap-4 p-6">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${person.color}`}
                  >
                    {person.initials}
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">{person.name}</h3>
                    <p className="text-sm font-medium text-indigo-600">{person.role}</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                      {person.bio}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Investors */}
      <section className="border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-900">Backed By</h2>
            <p className="mt-3 text-lg text-zinc-500">
              Supported by world-class investors who believe in our mission
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
            {investors.map((inv) => (
              <div
                key={inv.name}
                className="flex h-20 w-48 flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 transition-colors hover:bg-white"
              >
                <p className="text-lg font-bold text-zinc-700">{inv.name}</p>
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  {inv.tier}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-b border-zinc-100 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-900">Our Journey</h2>
            <p className="mt-3 text-lg text-zinc-500">
              Key milestones on our path to transforming AI task automation
            </p>
          </div>

          <div className="relative mt-10">
            {/* Center line */}
            <div className="absolute left-4 top-0 hidden h-full w-px bg-zinc-200 sm:left-1/2 sm:block" />

            <div className="space-y-8">
              {milestones.map((ms, i) => (
                <div
                  key={i}
                  className={`relative flex flex-col sm:flex-row ${
                    i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                  }`}
                >
                  {/* Dot */}
                  <div className="absolute left-4 hidden h-3 w-3 -translate-x-1/2 rounded-full border-2 border-indigo-600 bg-white sm:left-1/2 sm:block" style={{ top: "1.25rem" }} />

                  {/* Content */}
                  <div className={`flex-1 ${i % 2 === 0 ? "sm:pr-12 sm:text-right" : "sm:pl-12"}`}>
                    <Card>
                      <CardContent className="p-5">
                        <div className={`flex items-center gap-2 ${i % 2 === 0 ? "sm:justify-end" : ""}`}>
                          <Calendar className="h-4 w-4 text-indigo-600" />
                          <span className="text-sm font-semibold text-indigo-600">
                            {ms.date}
                          </span>
                        </div>
                        <h3 className="mt-1 text-lg font-bold text-zinc-900">
                          {ms.title}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          {ms.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden flex-1 sm:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardContent className="flex flex-col items-center gap-6 p-10 text-center sm:flex-row sm:text-left">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600">
                <Building className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-zinc-900">
                  Get in touch
                </h3>
                <p className="mt-2 text-zinc-600">
                  Whether you are a potential customer, partner, investor, or candidate --
                  we would love to hear from you.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/company/contact">
                  <Button>
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Us
                  </Button>
                </Link>
                <Link href="/company/careers">
                  <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    View Careers
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
