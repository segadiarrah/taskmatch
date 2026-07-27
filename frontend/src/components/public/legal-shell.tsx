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
    <div className="min-h-screen">
      <section className="border-b border-line px-4 py-4 sm:px-6 lg:px-8 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to TaskMatch
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-1.5 text-sm text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </section>

      <section className="relative overflow-hidden px-4 pb-10 pt-20 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 lime-radial" />
        <div className="relative mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/5 px-4 py-1.5 tech-eyebrow text-ink-muted">
            {eyebrow}
          </div>
          <h1 className="mt-8 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-ink-muted">{summary}</p>
          <p className="mt-3 font-mono text-xs text-ink-faint">{updatedAt}</p>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="mb-3 tech-eyebrow text-ink-faint">Contents</div>
              <nav className="space-y-1">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-white/5 hover:text-accent"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <Reveal as="article" className="rounded-3xl border border-line bg-surface p-8">
            <div className="space-y-10 text-ink-muted">{children}</div>
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
      <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-ink-muted sm:text-base">{children}</div>
    </section>
  );
}
