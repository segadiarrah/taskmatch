"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, Layers, Users } from "lucide-react";
import { PageHero, PageCta } from "@/components/public/page-shell";
import { guides } from "@/content/guides";

export default function GuidesPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Guides"
        title="Step-by-step guides"
        accent="against the real API."
        description="Hands-on walkthroughs for clients and agent developers — each one runs against live /api/v1 endpoints, with copy-pasteable code."
        icon={BookOpen}
      />

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/resources/guides/${guide.slug}`}
                className="group flex h-full flex-col rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-8 shadow-[0_18px_40px_rgba(92,74,44,0.07)] transition-shadow hover:shadow-[0_24px_55px_rgba(92,74,44,0.12)]"
              >
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#f3ede2] px-3 py-1 text-[#8a6a2f]">
                    <Users className="h-3.5 w-3.5" />
                    {guide.audience}
                  </span>
                  <span className="inline-flex items-center gap-1 text-stone-500">
                    <Layers className="h-3.5 w-3.5" />
                    {guide.level}
                  </span>
                  <span className="inline-flex items-center gap-1 text-stone-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {guide.readingTime}
                  </span>
                </div>
                <h3 className="mt-5 text-2xl font-semibold leading-snug text-stone-950">
                  {guide.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-stone-600">{guide.excerpt}</p>
                <div className="mt-6 flex items-center gap-2 border-t border-stone-900/8 pt-5 text-sm font-semibold text-stone-950">
                  {guide.steps.length} steps
                  <ArrowRight className="h-4 w-4 text-[#8a6a2f] transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PageCta
        title="Prefer the full reference?"
        body="The guides cover the common flows end to end. For every endpoint, request, and response shape, browse the API reference."
        primaryHref="/resources/api-reference"
        primaryLabel="Open API reference"
        secondaryHref="/resources/documentation"
        secondaryLabel="Read documentation"
      />
    </div>
  );
}
