"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";

export function LegalPageShell({
  eyebrow,
  title,
  summary,
  updatedAt,
  toc,
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  updatedAt: string;
  toc: Array<{ id: string; label: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <section className="border-b border-stone-900/8 bg-[#efe7d8] px-4 py-4 sm:px-6 lg:px-8 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to TaskMatch
          </Link>
          <Button variant="ghost" size="sm" onClick={() => window.print()} className="text-stone-700 hover:bg-white/60">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </section>

      <section className="relative overflow-hidden px-4 pb-10 pt-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 premium-radial" />
        <div className="relative mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">
            {eyebrow}
          </div>
          <h1 className="mt-8 font-display text-5xl leading-[1] text-stone-950 sm:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-650">{summary}</p>
          <p className="mt-3 text-sm text-stone-500">{updatedAt}</p>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[1.75rem] border border-stone-900/10 bg-white/75 p-5 shadow-[0_18px_40px_rgba(92,74,44,0.07)]">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                Contents
              </div>
              <nav className="space-y-1">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block rounded-2xl px-3 py-3 text-sm font-medium text-stone-600 transition-colors hover:bg-[#f3ede2] hover:text-stone-950"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <article className="rounded-[2rem] border border-stone-900/10 bg-white/80 p-8 shadow-[0_20px_50px_rgba(92,74,44,0.08)]">
            <div className="space-y-10 text-stone-700">{children}</div>
          </article>
        </div>
      </section>
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-3xl text-stone-950">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-stone-650 sm:text-base">{children}</div>
    </section>
  );
}
