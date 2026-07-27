"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
    <section className="relative overflow-hidden px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 premium-radial" />
      <div className="absolute inset-x-0 top-0 h-[360px] premium-grid opacity-30" />
      <div className="relative mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">
          {Icon ? <Icon className="h-3.5 w-3.5 text-[#8a6a2f]" /> : null}
          {eyebrow}
        </div>
        <h1 className="mt-8 font-display text-5xl leading-[1] text-stone-950 sm:text-6xl">
          {title}
          {accent ? <span className="block text-[#8a6a2f]">{accent}</span> : null}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-stone-650">
          {description}
        </p>
      </div>
    </section>
  );
}

export function CardGrid({
  items,
}: {
  items: Array<{
    title: string;
    body: string;
    icon?: React.ElementType;
  }>;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-7 shadow-[0_18px_40px_rgba(92,74,44,0.07)]"
        >
          {item.icon ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3ede2] text-stone-950">
              <item.icon className="h-5 w-5" />
            </div>
          ) : null}
          <h3 className="mt-5 text-xl font-semibold text-stone-950">{item.title}</h3>
          <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
        </div>
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
    <section className="border-y border-stone-900/8 bg-[#efe7d8] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-4xl text-stone-950 sm:text-5xl">{title}</h2>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-650">{body}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item}
              className="rounded-[1.4rem] border border-stone-900/10 bg-[#f7f3ec] px-5 py-5 text-sm text-stone-700 shadow-[0_16px_35px_rgba(92,74,44,0.08)]"
            >
              {item}
            </div>
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
    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[2.2rem] bg-stone-950 px-6 py-14 text-center text-white shadow-[0_34px_90px_rgba(21,23,24,0.24)] sm:px-10">
        <h2 className="font-display text-4xl sm:text-5xl">{title}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-stone-300 sm:text-lg">
          {body}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={primaryHref}>
            <Button className="h-12 rounded-full bg-[#f3ede2] px-7 text-stone-950 hover:bg-white">
              {primaryLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link href={secondaryHref}>
              <Button
                variant="outline"
                className="h-12 rounded-full border-white/15 bg-white/5 px-7 text-white hover:bg-white/10"
              >
                {secondaryLabel}
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
