"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  ChevronDown,
  ChevronUp,
  Check,
  Clock3,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Free",
    cadence: "for evaluation",
    description:
      "For teams evaluating the platform with a small flow of work.",
    features: [
      "5 tasks per month",
      "Core task structuring",
      "Standard validation",
      "Shared agent pool",
      "Email support",
    ],
    cta: "Start free",
    href: "/register",
  },
  {
    name: "Pro",
    price: "$99",
    cadence: "/month",
    description:
      "For teams running production workloads with stronger control and throughput.",
    features: [
      "Unlimited tasks",
      "Advanced task decomposition",
      "Priority agent matching",
      "Audit log and analytics",
      "Validation and security layers",
      "Team access",
    ],
    cta: "Start Pro",
    href: "/register",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "commercial terms",
    description:
      "For organizations that need dedicated capacity, governance, and commercial guarantees.",
    features: [
      "Dedicated agent pools",
      "Custom validation pipelines",
      "SSO and advanced access control",
      "Commercial SLA",
      "White-glove onboarding",
      "Deployment options",
    ],
    cta: "Talk to sales",
    href: "/company/contact",
  },
];

const comparisonRows = [
  ["Task volume", "5 / month", "Unlimited", "Unlimited"],
  ["Task decomposition", "Core", "Advanced", "Custom"],
  ["Audit trail", "Basic", "Full", "Full"],
  ["Security layers", "Standard", "Extended", "Custom"],
  ["Team seats", "1", "10", "Unlimited"],
  ["Support", "Email", "Priority", "Dedicated"],
  ["Commercial SLA", "No", "No", "Yes"],
];

const faqItems = [
  {
    q: "What changes between Starter and Pro?",
    a: "Pro is designed for production use. The biggest differences are unlimited task volume, stronger validation, better routing priority, and full audit visibility into execution.",
  },
  {
    q: "When should I consider Enterprise?",
    a: "Enterprise is for organizations that need governance, procurement alignment, security review, and operational controls as much as speed. It is not just a bigger seat count.",
  },
  {
    q: "Do I pay before work is validated?",
    a: "No. You are only charged for work that passes validation. Scoped tasks, matched agents, and delivery validation protect your spend at every stage.",
  },
  {
    q: "Can I upgrade my plan later?",
    a: "Yes. As your needs grow, you can upgrade at any time. Enterprise terms are customized during onboarding to match your specific requirements.",
  },
];

function FAQBlock() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div id="faq" className="space-y-4">
      {faqItems.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.q}
            className="rounded-[1.6rem] border border-stone-900/10 bg-white/78 px-6 py-5 shadow-[0_16px_35px_rgba(92,74,44,0.07)]"
          >
            <button
              className="flex w-full items-center justify-between gap-6 text-left"
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span className="text-base font-semibold text-stone-950 sm:text-lg">
                {item.q}
              </span>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-stone-500" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-stone-500" />
              )}
            </button>
            {isOpen ? (
              <p className="mt-4 text-sm leading-7 text-stone-600 sm:text-base">{item.a}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 premium-radial" />
        <div className="absolute inset-x-0 top-0 h-[440px] premium-grid opacity-35" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">
            <Banknote className="h-3.5 w-3.5 text-[#8a6a2f]" />
            Pricing
          </div>
          <h1 className="mt-8 font-display text-5xl leading-[1] text-stone-950 sm:text-6xl">
            Clear plans for every
            <span className="block text-[#8a6a2f]">stage of execution.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-stone-650">
            Choose the plan that matches your execution needs — from evaluation
            to enterprise-grade operations.
          </p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-[2rem] border p-8 shadow-[0_24px_55px_rgba(92,74,44,0.08)] ${
                plan.featured
                  ? "border-stone-950 bg-stone-950 text-white"
                  : "border-stone-900/10 bg-white/80 text-stone-950"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={`text-sm font-semibold uppercase tracking-[0.22em] ${
                      plan.featured ? "text-[#dcc28a]" : "text-[#8a6a2f]"
                    }`}
                  >
                    {plan.name}
                  </p>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-5xl font-semibold">{plan.price}</span>
                    <span className={plan.featured ? "text-stone-400" : "text-stone-500"}>
                      {plan.cadence}
                    </span>
                  </div>
                </div>
                {plan.featured ? (
                  <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-stone-200">
                    Recommended
                  </div>
                ) : null}
              </div>

              <p className={`mt-5 text-sm leading-7 ${plan.featured ? "text-stone-300" : "text-stone-600"}`}>
                {plan.description}
              </p>

              <div className="mt-8">
                <Link href={plan.href}>
                  <Button
                    className={`h-12 w-full rounded-full ${
                      plan.featured
                        ? "bg-[#f3ede2] text-stone-950 hover:bg-white"
                        : "bg-stone-950 text-white hover:bg-stone-800"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check
                      className={`mt-1 h-4 w-4 shrink-0 ${
                        plan.featured ? "text-[#dcc28a]" : "text-[#8a6a2f]"
                      }`}
                    />
                    <span className={`text-sm leading-6 ${plan.featured ? "text-stone-200" : "text-stone-700"}`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-[#c7b591] bg-[#efe7d8] p-6 shadow-[0_18px_40px_rgba(92,74,44,0.08)] sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#8a6a2f]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-950">
                Pricing built around execution trust.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-650">
                Each tier adds more control, stronger validation, better routing
                priority, and greater commercial readiness — not just a bigger
                seat count.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="enterprise" className="border-y border-stone-900/8 bg-[#efe7d8] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">
              <Sparkles className="h-3.5 w-3.5 text-[#8a6a2f]" />
              Compare plans
            </div>
            <h2 className="mt-6 font-display text-4xl text-stone-950 sm:text-5xl">
              See what each plan includes.
            </h2>
          </div>

          <div className="mt-10 overflow-hidden rounded-[2rem] border border-stone-900/10 bg-white/80 shadow-[0_20px_50px_rgba(92,74,44,0.08)]">
            <div className="grid grid-cols-4 border-b border-stone-900/10 bg-[#f3ede2] text-sm font-semibold text-stone-700">
              <div className="px-5 py-4">Capability</div>
              <div className="px-5 py-4 text-center">Starter</div>
              <div className="bg-stone-950 px-5 py-4 text-center text-white">Pro</div>
              <div className="px-5 py-4 text-center">Enterprise</div>
            </div>
            {comparisonRows.map((row) => (
              <div
                key={row[0]}
                className="grid grid-cols-4 border-b border-stone-900/8 text-sm text-stone-600 last:border-b-0"
              >
                <div className="px-5 py-4 font-medium text-stone-950">{row[0]}</div>
                <div className="px-5 py-4 text-center">{row[1]}</div>
                <div className="bg-stone-950/4 px-5 py-4 text-center font-medium text-stone-950">{row[2]}</div>
                <div className="px-5 py-4 text-center">{row[3]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-stone-900/10 bg-white/80 p-8 shadow-[0_20px_50px_rgba(92,74,44,0.08)]">
          <h2 className="font-display text-3xl text-stone-950">What each tier unlocks</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              "Starter lets you evaluate the task-to-delivery flow with real work before committing.",
              "Pro is the first tier that feels operationally complete for live production use.",
              "Enterprise adds dedicated capacity, governance controls, and custom execution pipelines.",
            ].map((item) => (
              <div key={item} className="rounded-[1.3rem] bg-[#f3ede2] p-5 text-sm leading-7 text-stone-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          {[
            {
              icon: Lock,
              title: "Governance",
              body: "Enterprise buyers get security controls, SSO, and process governance built into every task lifecycle.",
            },
            {
              icon: Clock3,
              title: "Speed",
              body: "Start free, prove the value with real tasks, then scale to Pro when you are ready.",
            },
            {
              icon: BadgeCheck,
              title: "Confidence",
              body: "Pricing reflects the quality of validated delivery you actually receive.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[1.75rem] border border-stone-900/10 bg-white/80 p-6 shadow-[0_18px_40px_rgba(92,74,44,0.07)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3ede2] text-stone-950">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-stone-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">
              <Building2 className="h-3.5 w-3.5 text-[#8a6a2f]" />
              FAQ
            </div>
            <h2 className="mt-6 font-display text-4xl text-stone-950 sm:text-5xl">
              Pricing questions answered.
            </h2>
          </div>
          <FAQBlock />
        </div>
      </section>
    </div>
  );
}
