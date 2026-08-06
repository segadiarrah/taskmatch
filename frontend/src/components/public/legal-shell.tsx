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
    <div className="min-h-screen bg-white">
      <section className="border-b border-stone-200 px-4 py-4 sm:px-6 lg:px-8 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to TaskMatch
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </section>

      <section className="border-b border-stone-200 px-4 pb-10 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="eyebrow inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-1.5 text-stone-600">
            {eyebrow}
          </div>
          <h1 className="mt-8 text-5xl font-semibold leading-[1.05] tracking-tight text-stone-900 sm:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-600">{summary}</p>
          <p className="mt-3 font-mono text-xs text-stone-400">{updatedAt}</p>
        </div>
      </section>

      <section className="px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
              <div className="eyebrow mb-3 text-stone-500">Contents</div>
              <nav className="space-y-1">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-white hover:text-brand-700"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <Reveal as="article" className="rounded-xl border border-stone-200 bg-white p-8">
            <div className="space-y-10 text-stone-600">{children}</div>
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
      <h2 className="text-2xl font-semibold text-stone-900">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-stone-600 sm:text-base">{children}</div>
    </section>
  );
}
