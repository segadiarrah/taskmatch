"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Reveal } from "@/components/public/motion";

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
    <div className="min-h-screen bg-paper text-paper-ink">
      <section className="border-b border-paper-ink/15 px-4 py-4 sm:px-6 lg:px-8 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-paper-ink/60 transition-colors hover:text-paper-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to TaskMatch
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md border border-paper-ink/30 px-4 py-1.5 text-sm text-paper-ink/70 transition-colors hover:bg-paper-ink hover:text-paper"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </section>

      <section className="relative border-b border-paper-ink/15 px-4 pb-10 pt-20 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-grid-paper" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl">
          <div className="eyebrow inline-flex items-center gap-2 rounded-full border border-paper-ink/25 px-4 py-1.5 text-paper-ink/70">
            {eyebrow}
          </div>
          <h1 className="mt-8 font-display text-5xl font-medium leading-[1.05] text-paper-ink sm:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-paper-ink/70">{summary}</p>
          <p className="mt-3 font-mono text-xs text-paper-ink/50">{updatedAt}</p>
        </div>
      </section>

      <section className="px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-paper-ink/15 bg-paper-deep/50 p-5">
              <div className="eyebrow mb-3 text-signal-600">Contents</div>
              <nav className="space-y-1">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block rounded-md px-3 py-2.5 text-sm font-medium text-paper-ink/70 transition-colors hover:bg-paper hover:text-signal-600"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <Reveal as="article" className="rounded-lg border border-paper-ink/15 bg-paper p-8">
            <div className="space-y-10 text-paper-ink/80">{children}</div>
          </Reveal>
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
      <h2 className="font-display text-2xl font-medium text-paper-ink">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-paper-ink/75 sm:text-base">{children}</div>
    </section>
  );
}
