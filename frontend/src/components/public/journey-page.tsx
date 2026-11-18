"use client";

import Link from "next/link";
import { ArrowRight, Bot, Briefcase, Check, FileCheck2, Handshake } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { COPY } from "@/lib/landing-copy";
import { authIntentHref, postAuthDestination, MARKETPLACE_INTENTS, type PublicIntent } from "@/lib/public-intent";

export function JourneyPage({ mode = "home" }: { mode?: "home" | "client" | "worker" | "how" }) {
  const { isAuthenticated, user } = useAuth();
  const { locale } = useTranslation();
  const entryHref = (intent: PublicIntent) => isAuthenticated && user ? postAuthDestination(user.role, intent) : authIntentHref("register", intent);
  const c = COPY[locale];
  const labels = [c.project, c.work, c.executor];
  const icons = [Briefcase, Handshake, Bot];
  const humanRequestHref = entryHref("mission");
  const humanAgentHref = entryHref("agent");
  const humanPaths = [
    { title: c.humanDirectTitle, body: c.humanDirectBody, href: humanRequestHref, label: c.mission, Icon: Handshake },
    { title: c.humanAgentTitle, body: c.humanAgentBody, href: humanAgentHref, label: c.agent, Icon: Bot },
  ];
  return <div className="bg-ink-950 text-ink-50">
    <section className="relative overflow-hidden border-b border-ink-800 px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-36 lg:px-8">
      <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
        <div>
          <p className="eyebrow text-signal-600">{c.eyebrow}</p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
            {mode === "client" ? c.clientTitle : mode === "worker" ? c.workerTitle : mode === "how" ? c.stepsTitle : <>{c.titleLead}<span className="mt-2 block text-signal-600">{c.titleAccent}</span></>}
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-ink-300">{mode === "client" ? c.clientIntro : mode === "worker" ? c.workerIntro : c.intro}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href={entryHref(mode === "worker" ? "executor" : "project")} className="inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-signal-500 px-6 py-3 text-sm font-semibold text-white hover:bg-signal-400">{mode === "worker" ? c.executor : c.project}<ArrowRight className="h-4 w-4" /></Link>
            <Link href="/pricing" className="inline-flex min-h-12 items-center gap-2 px-2 text-sm font-medium text-ink-300 underline underline-offset-4 hover:text-ink-50">{c.pricing}</Link>
          </div>
        </div>
        <aside className="rounded-xl border border-ink-700 bg-white p-6 sm:p-8">
          <p className="font-mono text-xs leading-5 text-ink-400">{c.exampleLabel}</p>
          <FileCheck2 aria-hidden="true" className="mt-8 h-10 w-10 text-signal-600" />
          <h2 className="mt-5 font-display text-2xl font-semibold leading-tight">{c.exampleTitle}</h2>
          <p className="mt-4 text-sm leading-7 text-ink-300">{c.exampleBody}</p>
          <ol className="mt-7 space-y-3 border-t border-ink-800 pt-6">{c.exampleSteps.map((step) => <li key={step} className="flex items-center gap-3 text-sm text-ink-200"><Check aria-hidden="true" className="h-4 w-4 text-signal-600" />{step}</li>)}</ol>
          <p className="mt-7 text-xs leading-6 text-ink-400">{c.exampleNote}</p>
        </aside>
      </div>
    </section>
    <section className="mx-auto grid max-w-6xl gap-0 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8 lg:py-16">
      {c.paths.map((path, index) => { const Icon = icons[index]; return <article key={path.title} className="flex flex-col border-b border-ink-800 py-7 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
        <div className="flex items-center justify-between"><Icon aria-hidden="true" className="h-6 w-6 text-signal-600" /><span className="font-mono text-xs text-ink-500">0{index + 1}</span></div>
        <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight">{path.title}</h2>
        <p className="mt-4 flex-1 text-sm leading-7 text-ink-300">{path.body}</p>
        <p className="mt-6 font-mono text-[11px] leading-5 text-ink-400">{path.detail}</p>
        <Link href={entryHref(MARKETPLACE_INTENTS[index])} className="mt-5 inline-flex min-h-11 items-center justify-between gap-3 text-sm font-semibold text-signal-600 hover:text-signal-700">{labels[index]}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </article>; })}
    </section>
    <section id="how-it-works" className="border-y border-ink-800 bg-white px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl"><h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">{c.stepsTitle}</h2>
        <ol className="mt-9 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{c.steps.map((step, index) => <li key={step.title}><span className="font-mono text-xs text-signal-600">0{index + 1}</span><h3 className="mt-3 text-base font-semibold">{step.title}</h3><p className="mt-3 text-sm leading-7 text-ink-300">{step.body}</p></li>)}</ol>
      </div>
    </section>
    <section id="human-tasks" className="scroll-mt-20 border-b border-ink-800 bg-white px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow text-signal-600">{c.humanEyebrow}</p>
        <h2 className="mt-4 max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">{c.humanTitle}</h2>
        <p className="mt-5 max-w-3xl text-base leading-8 text-ink-300">{c.humanIntro}</p>
        <div className="mt-9 grid gap-6 md:grid-cols-2">
          {humanPaths.map(({ title, body, href, label, Icon }) => <article key={href} className="flex flex-col rounded-xl border border-ink-700 bg-ink-950 p-6 sm:p-8">
            <Icon aria-hidden="true" className="h-6 w-6 text-signal-600" />
            <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
            <p className="mt-4 flex-1 text-sm leading-7 text-ink-300">{body}</p>
            <Link href={href} className="mt-6 inline-flex min-h-11 items-center justify-between gap-3 text-sm font-semibold text-signal-600 hover:text-signal-700">{label}<ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link>
          </article>)}
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8"><div className="max-w-3xl"><h2 className="font-display text-3xl font-semibold tracking-tight">{c.trustTitle}</h2><p className="mt-5 text-base leading-8 text-ink-300">{c.trustBody}</p><div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-signal-600 underline underline-offset-4"><Link href="/legal/terms">{c.terms}</Link><Link href="/resources/documentation">{c.docs}</Link></div></div></section>
  </div>;
}
