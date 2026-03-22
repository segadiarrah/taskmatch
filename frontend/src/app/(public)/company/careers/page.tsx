"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  MapPin,
  Clock,
  ArrowRight,
  Heart,
  DollarSign,
  GraduationCap,
  Plane,
  Coffee,
  Monitor,
  Shield,
  Sparkles,
  Users,
  Code2,
  Cpu,
  BarChart3,
  MessageSquare,
  Globe,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Open positions                                                     */
/* ------------------------------------------------------------------ */
interface Position {
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  icon: React.ElementType;
}

const positions: Position[] = [
  {
    title: "Senior Backend Engineer",
    department: "Engineering",
    location: "Remote (US/EU)",
    type: "Full-time",
    description:
      "Design and build scalable microservices powering the TaskMatch platform. Work with FastAPI, PostgreSQL, Redis, and event-driven architectures to handle millions of task executions.",
    icon: Code2,
  },
  {
    title: "Frontend Engineer",
    department: "Engineering",
    location: "Remote (Global)",
    type: "Full-time",
    description:
      "Build beautiful, performant interfaces with Next.js, TypeScript, and Tailwind CSS. Create real-time dashboards, developer tools, and the best-in-class platform experience.",
    icon: Monitor,
  },
  {
    title: "AI/ML Engineer",
    department: "AI Research",
    location: "Remote (US/EU)",
    type: "Full-time",
    description:
      "Develop and optimize the task decomposition engine, agent matching algorithms, and quality validation models. Work at the frontier of multi-agent orchestration and MCP.",
    icon: Cpu,
  },
  {
    title: "Product Manager",
    department: "Product",
    location: "Remote (US)",
    type: "Full-time",
    description:
      "Own the product roadmap for the developer platform. Work with engineering, design, and customers to ship features that developers love. Data-driven, customer-obsessed.",
    icon: BarChart3,
  },
  {
    title: "Developer Relations Engineer",
    department: "DevRel",
    location: "Remote (Global)",
    type: "Full-time",
    description:
      "Be the bridge between TaskMatch and the developer community. Write docs, build demos, speak at conferences, and help shape the Agent Protocol specification.",
    icon: MessageSquare,
  },
  {
    title: "Infrastructure Engineer",
    department: "Engineering",
    location: "Remote (US/EU)",
    type: "Full-time",
    description:
      "Build and maintain the cloud infrastructure that runs TaskMatch at scale. Kubernetes, Terraform, observability, and zero-downtime deployment pipelines.",
    icon: Globe,
  },
];

/* ------------------------------------------------------------------ */
/*  Benefits                                                           */
/* ------------------------------------------------------------------ */
const benefits = [
  {
    title: "Competitive Compensation",
    description: "Top-of-market salary, meaningful equity, and performance bonuses.",
    icon: DollarSign,
  },
  {
    title: "Remote First",
    description: "Work from anywhere. We have team members across 12 countries and 8 time zones.",
    icon: Globe,
  },
  {
    title: "Health & Wellness",
    description: "Comprehensive health, dental, and vision insurance. Plus $1,000/yr wellness stipend.",
    icon: Heart,
  },
  {
    title: "Learning Budget",
    description: "$2,500/yr for conferences, courses, books, and professional development.",
    icon: GraduationCap,
  },
  {
    title: "Home Office Setup",
    description: "$3,000 one-time stipend for your ideal workspace. Top-of-line hardware provided.",
    icon: Coffee,
  },
  {
    title: "Generous PTO",
    description: "Unlimited PTO with a 4-week minimum. Plus company-wide recharge weeks.",
    icon: Plane,
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function CareersPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="purple" className="mb-4">
              We&apos;re Hiring
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              {t("careers.title", "Build the future of AI automation")}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-500">
              Join a team of exceptional engineers, researchers, and builders
              creating the infrastructure that connects businesses with AI
              agents. Remote-first, mission-driven, and growing fast.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Badge variant="secondary">
                <Users className="mr-1 h-3 w-3" />
                45 team members
              </Badge>
              <Badge variant="secondary">
                <Globe className="mr-1 h-3 w-3" />
                12 countries
              </Badge>
              <Badge variant="secondary">
                <Zap className="mr-1 h-3 w-3" />
                Series A funded
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Culture statement */}
      <section className="border-b border-zinc-100 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                title: "Ship Fast, Ship Well",
                desc: "We move quickly but never compromise on quality. Our deploy pipeline pushes 50+ times a week with zero-downtime releases.",
                icon: Zap,
              },
              {
                title: "Ownership Culture",
                desc: "Every engineer owns their domain end-to-end. You will have real impact from day one, with the autonomy to make big decisions.",
                icon: Shield,
              },
              {
                title: "Learn & Grow",
                desc: "We invest heavily in our team. Dedicated learning budgets, internal tech talks, and mentorship from industry leaders.",
                icon: Sparkles,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                    <Icon className="h-6 w-6 text-indigo-700" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open positions */}
      <section className="border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-900">Open Positions</h2>
            <p className="mt-3 text-lg text-zinc-500">
              Find your next role. All positions are remote-friendly.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {positions.map((pos) => {
              const Icon = pos.icon;
              return (
                <Card
                  key={pos.title}
                  className="group transition-all hover:shadow-md"
                >
                  <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                    {/* Icon */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 transition-colors group-hover:bg-indigo-100">
                      <Icon className="h-5 w-5 text-zinc-600 group-hover:text-indigo-700" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-indigo-700 transition-colors">
                        {pos.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                        {pos.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge variant="info">{pos.department}</Badge>
                        <Badge variant="secondary">
                          <MapPin className="mr-1 h-3 w-3" />
                          {pos.location}
                        </Badge>
                        <Badge variant="secondary">
                          <Clock className="mr-1 h-3 w-3" />
                          {pos.type}
                        </Badge>
                      </div>
                    </div>

                    {/* Apply button */}
                    <Button variant="outline" className="shrink-0">
                      Apply
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-zinc-100 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-900">
              Benefits &amp; Perks
            </h2>
            <p className="mt-3 text-lg text-zinc-500">
              We take care of our team so they can focus on building great things
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card key={benefit.title}>
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                      <Icon className="h-5 w-5 text-indigo-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900">
                        {benefit.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                        {benefit.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Application CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardContent className="flex flex-col items-center gap-6 p-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600">
                <Briefcase className="h-7 w-7 text-white" />
              </div>
              <div className="max-w-xl">
                <h3 className="text-2xl font-bold text-zinc-900">
                  Don&apos;t see the right role?
                </h3>
                <p className="mt-3 text-zinc-600">
                  We are always looking for exceptional people. Send us your resume and tell
                  us what excites you about TaskMatch.ai. We will reach out when the right
                  opportunity opens up.
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/company/contact">
                  <Button size="lg">
                    Send Your Resume
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/company/about">
                  <Button variant="outline" size="lg">
                    Learn About Us
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
