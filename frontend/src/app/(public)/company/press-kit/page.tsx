"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Newspaper,
  Download,
  Palette,
  Type,
  Image,
  Mail,
  Building,
  Users,
  DollarSign,
  Calendar,
  Globe,
  Award,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  FileText,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Brand colors                                                       */
/* ------------------------------------------------------------------ */
const brandColors = [
  { name: "Primary", hex: "#4F46E5", className: "bg-indigo-600" },
  { name: "Primary Dark", hex: "#3730A3", className: "bg-indigo-800" },
  { name: "Secondary", hex: "#7C3AED", className: "bg-violet-600" },
  { name: "Success", hex: "#059669", className: "bg-emerald-600" },
  { name: "Warning", hex: "#D97706", className: "bg-amber-600" },
  { name: "Dark", hex: "#18181B", className: "bg-zinc-900" },
  { name: "Light", hex: "#F4F4F5", className: "bg-zinc-100" },
  { name: "White", hex: "#FFFFFF", className: "bg-white border border-zinc-200" },
];

/* ------------------------------------------------------------------ */
/*  Company facts                                                      */
/* ------------------------------------------------------------------ */
const facts = [
  { label: "Founded", value: "January 2024", icon: Calendar },
  { label: "Headquarters", value: "San Francisco, CA", icon: Building },
  { label: "Team Size", value: "45+ employees", icon: Users },
  { label: "Total Funding", value: "$33M (Seed + Series A)", icon: DollarSign },
  { label: "Markets", value: "Global (120+ countries)", icon: Globe },
  { label: "Tasks Processed", value: "1M+", icon: Award },
];

/* ------------------------------------------------------------------ */
/*  Color swatch with copy                                             */
/* ------------------------------------------------------------------ */
function ColorSwatch({
  name,
  hex,
  className,
}: {
  name: string;
  hex: string;
  className: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="group flex flex-col items-center gap-2 text-center"
    >
      <div
        className={`h-16 w-16 rounded-xl shadow-sm transition-transform group-hover:scale-105 ${className}`}
      />
      <div>
        <p className="text-sm font-medium text-zinc-700">{name}</p>
        <p className="flex items-center gap-1 text-xs text-zinc-400">
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" /> Copied
            </>
          ) : (
            <>
              {hex} <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100" />
            </>
          )}
        </p>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function PressKitPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Hero */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900">
              <Newspaper className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                {t("press.title", "Press Kit")}
              </h1>
              <p className="mt-1 text-lg text-zinc-500">
                {t(
                  "press.subtitle",
                  "Brand assets, company information, and media resources"
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Brand assets */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900">Brand Assets</h2>
          <p className="mt-2 text-zinc-500">
            Official TaskMatch.ai logos and brand marks for media use.
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Primary logo */}
            <Card>
              <CardContent className="p-6">
                <div className="flex h-32 items-center justify-center rounded-lg bg-white border border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-zinc-900">
                      TaskMatch<span className="text-indigo-600">.ai</span>
                    </span>
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-zinc-900">
                  Primary Logo
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Full color logo on light backgrounds. Minimum clear space of 16px around logo.
                </p>
                <Badge variant="secondary" className="mt-2">
                  SVG, PNG
                </Badge>
              </CardContent>
            </Card>

            {/* Dark logo */}
            <Card>
              <CardContent className="p-6">
                <div className="flex h-32 items-center justify-center rounded-lg bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-white">
                      TaskMatch<span className="text-indigo-400">.ai</span>
                    </span>
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-zinc-900">
                  Logo on Dark
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  White text variant for dark backgrounds. Same clear space rules apply.
                </p>
                <Badge variant="secondary" className="mt-2">
                  SVG, PNG
                </Badge>
              </CardContent>
            </Card>

            {/* Icon mark */}
            <Card>
              <CardContent className="p-6">
                <div className="flex h-32 items-center justify-center rounded-lg bg-zinc-50">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-zinc-900">
                  Icon Mark
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Standalone icon for small spaces, favicons, and social media avatars.
                </p>
                <Badge variant="secondary" className="mt-2">
                  SVG, PNG, ICO
                </Badge>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Company facts */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-zinc-900">Company Facts</h2>
          <p className="mt-2 text-zinc-500">
            Key figures and information about TaskMatch.ai.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map((fact) => {
              const Icon = fact.icon;
              return (
                <Card key={fact.label}>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                      <Icon className="h-5 w-5 text-zinc-600" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500">{fact.label}</p>
                      <p className="text-lg font-bold text-zinc-900">{fact.value}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Media contact */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-zinc-900">Media Contact</h2>
          <p className="mt-2 text-zinc-500">
            For press inquiries, interviews, and media requests.
          </p>

          <Card className="mt-6">
            <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                <Mail className="h-6 w-6 text-indigo-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-900">
                  Press Team
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  For media inquiries, interview requests, and press coverage
                  coordination.
                </p>
                <p className="mt-2 text-sm font-medium text-indigo-600">
                  press@taskmatch.ai
                </p>
              </div>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Contact Press Team
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Brand guidelines - Colors */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-zinc-900">Brand Colors</h2>
          <p className="mt-2 text-zinc-500">
            Click any swatch to copy its hex value to clipboard.
          </p>

          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-8">
            <div className="flex flex-wrap items-start justify-center gap-8">
              {brandColors.map((c) => (
                <ColorSwatch key={c.name} name={c.name} hex={c.hex} className={c.className} />
              ))}
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-zinc-900">Typography</h2>
          <p className="mt-2 text-zinc-500">
            Our brand uses the Inter typeface family across all platforms.
          </p>

          <Card className="mt-6">
            <CardContent className="p-8">
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <Badge variant="secondary" className="mb-4">
                    Primary Typeface
                  </Badge>
                  <h3 className="text-4xl font-bold text-zinc-900">
                    Inter
                  </h3>
                  <p className="mt-2 text-zinc-500">
                    Used for all headings, body text, UI elements, and
                    marketing materials. Available on Google Fonts.
                  </p>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-light text-zinc-600">
                      Light (300) - Used for large display text
                    </p>
                    <p className="text-sm font-normal text-zinc-600">
                      Regular (400) - Body text and descriptions
                    </p>
                    <p className="text-sm font-medium text-zinc-600">
                      Medium (500) - Labels and subheadings
                    </p>
                    <p className="text-sm font-semibold text-zinc-600">
                      Semibold (600) - Section headings
                    </p>
                    <p className="text-sm font-bold text-zinc-600">
                      Bold (700) - Page titles and emphasis
                    </p>
                  </div>
                </div>
                <div>
                  <Badge variant="secondary" className="mb-4">
                    Monospace
                  </Badge>
                  <h3 className="font-mono text-4xl font-bold text-zinc-900">
                    JetBrains Mono
                  </h3>
                  <p className="mt-2 text-zinc-500">
                    Used for code snippets, API endpoints, terminal commands,
                    and technical content throughout the platform.
                  </p>
                  <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-950 p-4">
                    <code className="font-mono text-sm text-zinc-300">
                      const client = new TaskMatch(&#123; apiKey &#125;);
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Boilerplate */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-zinc-900">Boilerplate</h2>
          <p className="mt-2 text-zinc-500">
            Approved company description for use in press coverage and publications.
          </p>

          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  About TaskMatch.ai
                </h3>
                <p className="mt-3 leading-relaxed text-zinc-700">
                  TaskMatch.ai is an AI-powered task automation platform that connects
                  businesses with specialized AI agents. Founded in 2024 in San Francisco,
                  TaskMatch provides the infrastructure for turning natural language business
                  requests into structured, executable tasks -- automatically matched to the
                  best-fit AI agents through a transparent bidding protocol. The platform
                  handles the full lifecycle from job decomposition and agent matching to
                  execution, validation, and payment. TaskMatch has processed over 1 million
                  tasks with a 97% satisfaction rate and is backed by Sequoia Capital,
                  Y Combinator, and leading enterprise investors. For more information,
                  visit www.taskmatch.ai.
                </p>
              </div>

              <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  Short Description (50 words)
                </h3>
                <p className="mt-3 leading-relaxed text-zinc-700">
                  TaskMatch.ai is an AI-powered platform that turns business requests into
                  structured tasks, matches them to specialized AI agents, and delivers
                  validated results. With transparent pricing, quality guarantees, and open
                  protocols, TaskMatch makes enterprise AI automation reliable and accessible.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Brand guidelines summary */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-zinc-900">
            Usage Guidelines
          </h2>
          <p className="mt-2 text-zinc-500">
            Please follow these guidelines when using TaskMatch brand assets.
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-emerald-700">
                  <Check className="h-4 w-4" />
                  Do
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-zinc-600">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Use the official logo files provided in this press kit
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Maintain minimum clear space around the logo
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Write &quot;TaskMatch.ai&quot; with capital T and M, lowercase &quot;.ai&quot;
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Use approved brand colors for backgrounds
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-red-700">
                  <FileText className="h-4 w-4" />
                  Don&apos;t
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-zinc-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 h-4 w-4 shrink-0 text-center text-red-500">&times;</span>
                    Alter, rotate, or distort the logo in any way
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 h-4 w-4 shrink-0 text-center text-red-500">&times;</span>
                    Use the logo on busy or low-contrast backgrounds
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 h-4 w-4 shrink-0 text-center text-red-500">&times;</span>
                    Recreate or modify the logo using different fonts
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 h-4 w-4 shrink-0 text-center text-red-500">&times;</span>
                    Use the brand assets to imply endorsement or partnership
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16">
          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
                <Download className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-zinc-900">
                  Download full press kit
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Get all logos, brand assets, and media resources in a single ZIP file.
                  Includes SVG, PNG, and PDF formats.
                </p>
              </div>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Download ZIP
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
