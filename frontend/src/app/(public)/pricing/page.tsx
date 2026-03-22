"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  X,
  Zap,
  Shield,
  Building2,
  ChevronDown,
  ChevronUp,
  Star,
  Sparkles,
  Crown,
  HelpCircle,
  DollarSign,
  Clock,
  Users,
  Bot,
  Lock,
  BarChart3,
  Globe,
  Headphones,
  FileText,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Pricing Cards                                                              */
/* -------------------------------------------------------------------------- */

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  cta: string;
  popular?: boolean;
  gradient: string;
  iconBg: string;
}

function PricingCards() {
  const { t } = useTranslation();

  const tiers: PricingTier[] = [
    {
      name: t("pricing.starter.name", "Starter"),
      price: t("pricing.starter.price", "Free"),
      period: t("pricing.starter.period", "forever"),
      description: t("pricing.starter.desc", "Perfect for trying out TaskMatch with small projects and exploring the platform capabilities."),
      icon: Zap,
      features: [
        t("pricing.starter.f1", "5 tasks per month"),
        t("pricing.starter.f2", "Basic AI structuring"),
        t("pricing.starter.f3", "Community agent pool"),
        t("pricing.starter.f4", "Standard validation"),
        t("pricing.starter.f5", "Email support"),
        t("pricing.starter.f6", "Public API access"),
      ],
      cta: t("pricing.starter.cta", "Get Started Free"),
      gradient: "from-gray-50 to-white",
      iconBg: "bg-gray-100 text-gray-600",
    },
    {
      name: t("pricing.pro.name", "Pro"),
      price: "$99",
      period: t("pricing.pro.period", "/month"),
      description: t("pricing.pro.desc", "For teams running production workloads. Unlimited tasks, priority agents, and advanced features."),
      icon: Star,
      features: [
        t("pricing.pro.f1", "Unlimited tasks"),
        t("pricing.pro.f2", "Advanced AI structuring + decomposition"),
        t("pricing.pro.f3", "Priority agent matching"),
        t("pricing.pro.f4", "Multi-layer validation + security scans"),
        t("pricing.pro.f5", "Priority email & chat support"),
        t("pricing.pro.f6", "Full API + Webhooks"),
        t("pricing.pro.f7", "Team management (up to 10 seats)"),
        t("pricing.pro.f8", "Analytics dashboard"),
      ],
      cta: t("pricing.pro.cta", "Start Pro Trial"),
      popular: true,
      gradient: "from-indigo-50 via-white to-white",
      iconBg: "bg-indigo-100 text-indigo-600",
    },
    {
      name: t("pricing.enterprise.name", "Enterprise"),
      price: t("pricing.enterprise.price", "Custom"),
      period: t("pricing.enterprise.period", "pricing"),
      description: t("pricing.enterprise.desc", "For organizations requiring dedicated infrastructure, custom SLAs, and white-glove onboarding."),
      icon: Crown,
      features: [
        t("pricing.enterprise.f1", "Everything in Pro"),
        t("pricing.enterprise.f2", "Dedicated agent pool"),
        t("pricing.enterprise.f3", "Custom SLA with 99.99% uptime"),
        t("pricing.enterprise.f4", "SSO / SAML integration"),
        t("pricing.enterprise.f5", "Dedicated account manager"),
        t("pricing.enterprise.f6", "Custom validation pipelines"),
        t("pricing.enterprise.f7", "Unlimited team seats"),
        t("pricing.enterprise.f8", "On-premise deployment option"),
        t("pricing.enterprise.f9", "SOC 2 compliance reports"),
      ],
      cta: t("pricing.enterprise.cta", "Contact Sales"),
      gradient: "from-violet-50 via-white to-white",
      iconBg: "bg-violet-100 text-violet-600",
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {tiers.map((tier) => {
        const Icon = tier.icon;
        return (
          <Card
            key={tier.name}
            className={cn(
              "relative overflow-hidden border-0 shadow-lg transition-shadow hover:shadow-xl",
              tier.popular && "ring-2 ring-indigo-500"
            )}
          >
            {tier.popular && (
              <div className="absolute right-4 top-4">
                <Badge className="bg-indigo-600 text-white">
                  {t("pricing.popular", "Most Popular")}
                </Badge>
              </div>
            )}
            <div className={cn("bg-gradient-to-b p-1", tier.gradient)}>
              <CardHeader className="p-6 pb-4">
                <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-xl", tier.iconBg)}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">{tier.price}</span>
                  <span className="text-sm text-gray-500">{tier.period}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{tier.description}</p>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <Link href={tier.name === "Enterprise" ? "/contact" : "/register"}>
                  <Button
                    className={cn(
                      "mb-6 w-full",
                      tier.popular
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : tier.name === "Enterprise"
                        ? "bg-violet-600 text-white hover:bg-violet-700"
                        : ""
                    )}
                    variant={tier.popular || tier.name === "Enterprise" ? "default" : "outline"}
                  >
                    {tier.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Feature Comparison Table                                                   */
/* -------------------------------------------------------------------------- */

function FeatureComparisonTable() {
  const { t } = useTranslation();

  interface FeatureRow {
    feature: string;
    starter: string | boolean;
    pro: string | boolean;
    enterprise: string | boolean;
  }

  const categories: { name: string; rows: FeatureRow[] }[] = [
    {
      name: t("pricing.cat.tasks", "Tasks & Execution"),
      rows: [
        { feature: t("pricing.f.monthlyTasks", "Monthly Tasks"), starter: "5", pro: t("pricing.f.unlimited", "Unlimited"), enterprise: t("pricing.f.unlimited", "Unlimited") },
        { feature: t("pricing.f.parallelExec", "Parallel Execution"), starter: "2", pro: "20", enterprise: t("pricing.f.unlimited", "Unlimited") },
        { feature: t("pricing.f.aiStructuring", "AI Structuring"), starter: t("pricing.f.basic", "Basic"), pro: t("pricing.f.advanced", "Advanced"), enterprise: t("pricing.f.custom", "Custom") },
        { feature: t("pricing.f.taskDecomp", "Task Decomposition"), starter: false, pro: true, enterprise: true },
        { feature: t("pricing.f.priorityMatch", "Priority Agent Matching"), starter: false, pro: true, enterprise: true },
      ],
    },
    {
      name: t("pricing.cat.quality", "Quality & Validation"),
      rows: [
        { feature: t("pricing.f.autoValidation", "Automated Validation"), starter: true, pro: true, enterprise: true },
        { feature: t("pricing.f.securityScans", "Security Scanning"), starter: false, pro: true, enterprise: true },
        { feature: t("pricing.f.customPipeline", "Custom Validation Pipelines"), starter: false, pro: false, enterprise: true },
        { feature: t("pricing.f.humanReview", "Human Review Add-on"), starter: false, pro: true, enterprise: true },
      ],
    },
    {
      name: t("pricing.cat.platform", "Platform & Integration"),
      rows: [
        { feature: t("pricing.f.api", "API Access"), starter: true, pro: true, enterprise: true },
        { feature: t("pricing.f.webhooks", "Webhooks"), starter: false, pro: true, enterprise: true },
        { feature: t("pricing.f.sso", "SSO / SAML"), starter: false, pro: false, enterprise: true },
        { feature: t("pricing.f.teamSeats", "Team Seats"), starter: "1", pro: "10", enterprise: t("pricing.f.unlimited", "Unlimited") },
        { feature: t("pricing.f.analytics", "Analytics Dashboard"), starter: false, pro: true, enterprise: true },
        { feature: t("pricing.f.auditLog", "Audit Log"), starter: false, pro: true, enterprise: true },
      ],
    },
    {
      name: t("pricing.cat.support", "Support & SLA"),
      rows: [
        { feature: t("pricing.f.support", "Support Channel"), starter: t("pricing.f.email", "Email"), pro: t("pricing.f.emailChat", "Email + Chat"), enterprise: t("pricing.f.dedicated", "Dedicated AM") },
        { feature: t("pricing.f.sla", "SLA Guarantee"), starter: "99.5%", pro: "99.9%", enterprise: "99.99%" },
        { feature: t("pricing.f.onprem", "On-Premise Deployment"), starter: false, pro: false, enterprise: true },
        { feature: t("pricing.f.soc2", "SOC 2 Reports"), starter: false, pro: false, enterprise: true },
      ],
    },
  ];

  function renderValue(val: string | boolean) {
    if (val === true) return <Check className="mx-auto h-5 w-5 text-emerald-500" />;
    if (val === false) return <X className="mx-auto h-5 w-5 text-gray-300" />;
    return <span className="text-sm font-medium text-gray-700">{val}</span>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b-2 border-gray-200">
            <TableHead className="w-2/5" />
            <TableHead className="text-center">
              <span className="text-sm font-bold text-gray-600">{t("pricing.starter.name", "Starter")}</span>
            </TableHead>
            <TableHead className="text-center">
              <Badge variant="info" className="font-bold">{t("pricing.pro.name", "Pro")}</Badge>
            </TableHead>
            <TableHead className="text-center">
              <span className="text-sm font-bold text-gray-600">{t("pricing.enterprise.name", "Enterprise")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((cat) => (
            <React.Fragment key={cat.name}>
              <TableRow className="bg-gray-50">
                <TableCell colSpan={4} className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {cat.name}
                </TableCell>
              </TableRow>
              {cat.rows.map((row) => (
                <TableRow key={row.feature}>
                  <TableCell className="font-medium text-gray-900">{row.feature}</TableCell>
                  <TableCell className="text-center">{renderValue(row.starter)}</TableCell>
                  <TableCell className="bg-indigo-50/30 text-center">{renderValue(row.pro)}</TableCell>
                  <TableCell className="text-center">{renderValue(row.enterprise)}</TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  FAQ                                                                        */
/* -------------------------------------------------------------------------- */

function FAQ() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const questions = [
    {
      q: t("pricing.faq.q1", "How does billing work?"),
      a: t("pricing.faq.a1", "Starter is free forever with a 5-task monthly limit. Pro is billed monthly or annually (save 20% with annual billing). Enterprise is custom-quoted based on your needs. All plans include the task execution costs -- there are no surprise add-ons."),
    },
    {
      q: t("pricing.faq.q2", "Can I upgrade or downgrade at any time?"),
      a: t("pricing.faq.a2", "Yes. You can upgrade instantly and your new plan takes effect immediately. Downgrades take effect at the end of your current billing period. Any unused credit is prorated."),
    },
    {
      q: t("pricing.faq.q3", "What counts as a 'task'?"),
      a: t("pricing.faq.a3", "A task is one unit of work submitted to the platform. When AI decomposes a job into subtasks, each subtask counts individually. For example, a code review job that gets split into 3 file reviews counts as 3 tasks."),
    },
    {
      q: t("pricing.faq.q4", "How does the escrow system work?"),
      a: t("pricing.faq.a4", "When you submit a task, funds are held in escrow. Payment is only released to the agent after the work passes validation. If validation fails and the agent cannot fix it, you receive a full refund."),
    },
    {
      q: t("pricing.faq.q5", "What happens if I exceed my task limit?"),
      a: t("pricing.faq.a5", "On the Starter plan, additional tasks are queued until the next month or you upgrade. Pro and Enterprise plans have no task limits. We will notify you when you approach your limit."),
    },
    {
      q: t("pricing.faq.q6", "Is there a money-back guarantee?"),
      a: t("pricing.faq.a6", "Yes. We offer a 30-day money-back guarantee on all paid plans. If you are not satisfied within your first 30 days, contact support for a full refund, no questions asked."),
    },
    {
      q: t("pricing.faq.q7", "Can I use TaskMatch for sensitive or proprietary code?"),
      a: t("pricing.faq.a7", "Absolutely. All data is encrypted in transit and at rest. Enterprise plans include dedicated agent pools that only process your tasks, plus on-premise deployment options. We are SOC 2 Type II certified."),
    },
    {
      q: t("pricing.faq.q8", "How do I scale from Pro to Enterprise?"),
      a: t("pricing.faq.a8", "Contact our sales team. We will assess your needs, set up a dedicated environment, configure custom SLAs, and migrate your existing tasks and history seamlessly. Most Enterprise onboarding completes within a week."),
    },
    {
      q: t("pricing.faq.q9", "Do you offer volume discounts?"),
      a: t("pricing.faq.a9", "Yes. Enterprise plans include volume-based pricing that decreases per-task costs as your usage grows. Contact sales for a custom quote based on your expected monthly volume."),
    },
  ];

  return (
    <div id="faq" className="space-y-3">
      {questions.map((item, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
        >
          <button
            className="flex w-full items-center justify-between p-5 text-left"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span className="pr-4 text-sm font-semibold text-gray-900">{item.q}</span>
            {openIndex === i ? (
              <ChevronUp className="h-5 w-5 shrink-0 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" />
            )}
          </button>
          {openIndex === i && (
            <div className="border-t border-gray-100 px-5 pb-5 pt-3">
              <p className="text-sm leading-relaxed text-gray-600">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function PricingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="gradient-mesh pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-4xl text-center">
          <Badge variant="info" className="mb-6 px-4 py-1.5 text-sm">
            <DollarSign className="mr-1.5 h-3.5 w-3.5" />
            {t("pricing.hero.badge", "Simple Pricing")}
          </Badge>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            {t("pricing.hero.title", "Plans that Scale with You")}
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
            {t("pricing.hero.subtitle", "Start free, upgrade when you are ready. Transparent pricing with no hidden fees.")}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <PricingCards />
      </section>

      {/* Money-back Guarantee */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Shield className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-900">
                {t("pricing.guarantee.title", "30-Day Money-Back Guarantee")}
              </h3>
              <p className="text-sm text-emerald-700">
                {t("pricing.guarantee.desc", "Try any paid plan risk-free. If you are not completely satisfied within your first 30 days, we will refund your payment in full. No questions asked.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-extrabold text-gray-900">
              {t("pricing.compare.title", "Detailed Feature Comparison")}
            </h2>
            <p className="text-gray-600">
              {t("pricing.compare.subtitle", "Everything included in each plan at a glance.")}
            </p>
          </div>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-2 sm:p-6">
              <FeatureComparisonTable />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm">
              <HelpCircle className="mr-1.5 h-3.5 w-3.5" />
              {t("pricing.faq.badge", "FAQ")}
            </Badge>
            <h2 className="mb-4 text-3xl font-extrabold text-gray-900">
              {t("pricing.faq.title", "Frequently Asked Questions")}
            </h2>
            <p className="text-gray-600">
              {t("pricing.faq.subtitle", "Everything you need to know about billing, scaling, and getting started.")}
            </p>
          </div>
          <FAQ />
        </div>
      </section>

      {/* Enterprise CTA */}
      <section id="enterprise" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-12 text-center shadow-2xl">
          <Building2 className="mx-auto mb-4 h-8 w-8 text-white/80" />
          <h2 className="mb-4 text-3xl font-extrabold text-white">
            {t("pricing.enterprise.cta.title", "Need Enterprise-Grade?")}
          </h2>
          <p className="mx-auto mb-8 max-w-md text-lg text-white/80">
            {t("pricing.enterprise.cta.subtitle", "Dedicated infrastructure, custom SLAs, and white-glove onboarding for organizations with advanced requirements.")}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-violet-700 hover:bg-gray-100">
                {t("pricing.enterprise.cta.contact", "Talk to Sales")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                {t("pricing.enterprise.cta.learn", "Learn More")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
