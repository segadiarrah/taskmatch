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
    <section className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 lime-radial" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] grid-bg" />
      <div className="relative mx-auto max-w-4xl text-center">
        <Reveal className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/5 px-4 py-1.5 tech-eyebrow text-ink-muted">
          {Icon ? <Icon className="h-3.5 w-3.5 text-accent" /> : null}
          {eyebrow}
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-8 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl">
            {title}
            {accent ? <span className="block text-gradient-lime">{accent}</span> : null}
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-ink-muted">{description}</p>
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
          className="hover-lift group rounded-2xl border border-line bg-surface p-7 hover:border-line-strong"
        >
          {item.icon ? (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white/5 text-accent transition-colors group-hover:border-[var(--accent-lime)]">
              <item.icon className="h-5 w-5" />
            </div>
          ) : null}
          <h3 className="mt-5 text-lg font-semibold text-ink">{item.title}</h3>
          <p className="mt-3 text-sm leading-7 text-ink-muted">{item.body}</p>
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
    <section className="border-y border-line bg-surface px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-ink-muted">{body}</p>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((item, i) => (
            <Reveal
              key={item}
              delay={i * 80}
              className="rounded-xl border border-line bg-canvas px-5 py-5 font-mono text-sm text-ink-muted"
            >
              <span className="text-accent">→ </span>
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
    <section className="px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-line-strong bg-surface px-6 py-16 text-center sm:px-10">
        <div className="pointer-events-none absolute inset-0 lime-radial opacity-70" />
        <div className="relative">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{title}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-ink-muted sm:text-lg">{body}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={primaryHref}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent-lime px-7 text-sm font-semibold text-[var(--accent-ink)] transition-transform hover:scale-[1.03]"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link
                href={secondaryHref}
                className="inline-flex h-12 items-center justify-center rounded-full border border-line-strong px-7 text-sm font-medium text-ink transition-colors hover:bg-white/5"
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
