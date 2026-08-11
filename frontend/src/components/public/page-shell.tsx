"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/public/motion";

export function PageHero({
  eyebrow,
  title,
  accent,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  description: string;
  icon?: React.ElementType;
}) {
  return (
    <section className="relative overflow-hidden border-b border-ink-800 bg-ink-950 px-4 pb-20 pt-24 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-signal-glow" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl text-center">
        <Reveal className="eyebrow inline-flex items-center gap-2 rounded-full border border-ink-800 bg-white px-4 py-1.5 text-ink-400 shadow-sm">
          {Icon ? <Icon className="h-3.5 w-3.5 text-signal-400" /> : null}
          {eyebrow}
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-8 font-display text-5xl font-bold leading-[1.02] text-ink-50 sm:text-6xl lg:text-7xl">
            {title}
            {accent ? <span className="block font-display text-signal-500">{accent}</span> : null}
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-ink-300">{description}</p>
        </Reveal>
      </div>
    </section>
  );
}

export function CardGrid({
  items,
}: {
  items: Array<{ title: string; body: string; icon?: React.ElementType }>;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, i) => (
        <Reveal
          key={item.title}
          delay={i * 70}
          className="hover-lift group rounded-xl border border-ink-800 bg-white p-7 hover:border-ink-700"
        >
          {item.icon ? (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-signal-500/20 bg-signal-500/5 text-signal-400">
              <item.icon className="h-5 w-5" />
            </div>
          ) : null}
          <h3 className="mt-5 text-lg font-semibold text-ink-50">{item.title}</h3>
          <p className="mt-3 text-sm leading-7 text-ink-400">{item.body}</p>
        </Reveal>
      ))}
    </div>
  );
}

export function HighlightBand({
  title,
  body,
  items,
}: {
  title: string;
  body: string;
  items: string[];
}) {
  return (
    <section className="relative border-y border-paper-ink/15 bg-paper px-4 py-20 text-paper-ink sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <h2 className="font-display text-3xl font-medium text-paper-ink sm:text-4xl">{title}</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-paper-ink/70">{body}</p>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((item, i) => (
            <Reveal
              key={item}
              delay={i * 80}
              className="rounded-xl border border-paper-ink/10 bg-white px-5 py-5 text-sm leading-6 text-paper-ink/80 shadow-sm transition-colors hover:border-paper-ink/20"
            >
              <span className="mr-1.5 font-semibold text-signal-600">→</span>
              {item}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PageCta({
  title,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="bg-ink-950 px-4 pb-24 pt-20 sm:px-6 lg:px-8">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-ink-800 bg-white px-6 py-16 text-center text-ink-50 shadow-panel sm:px-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-signal-glow" aria-hidden="true" />
        <div className="relative">
          <h2 className="font-display text-4xl font-bold text-ink-50 sm:text-5xl">{title}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-ink-400 sm:text-lg">{body}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={primaryHref}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-signal-500 px-7 text-sm font-semibold text-white transition-colors hover:bg-signal-400"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link
                href={secondaryHref}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-ink-800 bg-white px-7 text-sm font-medium text-ink-100 transition-colors hover:bg-ink-900"
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
