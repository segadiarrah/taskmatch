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
    <section className="border-b border-stone-200 bg-white px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-1.5 eyebrow text-stone-600">
          {Icon ? <Icon className="h-3.5 w-3.5 text-brand-700" /> : null}
          {eyebrow}
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-8 text-5xl font-semibold leading-[1.05] tracking-tight text-stone-900 sm:text-6xl">
            {title}
            {accent ? <span className="block text-brand-800">{accent}</span> : null}
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-stone-600">{description}</p>
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
          className="hover-lift group rounded-xl border border-stone-200 bg-white p-7 hover:border-stone-300 hover:shadow-sm"
        >
          {item.icon ? (
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-brand-700">
              <item.icon className="h-5 w-5" />
            </div>
          ) : null}
          <h3 className="mt-5 text-lg font-semibold text-stone-900">{item.title}</h3>
          <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
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
    <section className="border-y border-stone-200 bg-stone-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">{title}</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-600">{body}</p>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((item, i) => (
            <Reveal
              key={item}
              delay={i * 80}
              className="rounded-lg border border-stone-200 bg-white px-5 py-5 text-sm leading-6 text-stone-600"
            >
              <span className="mr-1.5 font-semibold text-brand-700">→</span>
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
      <Reveal className="mx-auto max-w-6xl rounded-2xl bg-brand-900 px-6 py-16 text-center sm:px-10">
        <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{title}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-brand-100 sm:text-lg">{body}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={primaryHref}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-7 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-50"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/25 px-7 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </Reveal>
    </section>
  );
}
