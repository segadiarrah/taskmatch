"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock3, FileQuestion, Layers, Users } from "lucide-react";
import { PageCta } from "@/components/public/page-shell";
import { getGuideBySlug } from "@/content/guides";

export default function GuideArticlePage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0];
  const guide = slug ? getGuideBySlug(slug) : undefined;

  if (!guide) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-md rounded-[2rem] border border-stone-900/10 bg-white/80 p-10 text-center shadow-[0_20px_50px_rgba(92,74,44,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3ede2] text-[#8a6a2f]">
            <FileQuestion className="h-6 w-6" />
          </div>
          <h1 className="mt-6 font-display text-3xl text-stone-950">Guide not found</h1>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            We couldn&rsquo;t find the guide you were looking for. It may have moved or the link may be incorrect.
          </p>
          <Link
            href="/resources/guides"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to guides
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden px-4 pb-8 pt-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 premium-radial" />
        <div className="absolute inset-x-0 top-0 h-[320px] premium-grid opacity-30" />
        <div className="relative mx-auto max-w-3xl">
          <Link
            href="/resources/guides"
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition-colors hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            All guides
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em]">
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

          <h1 className="mt-6 font-display text-4xl leading-[1.1] text-stone-950 sm:text-5xl">
            {guide.title}
          </h1>
          <div className="mt-6 space-y-4 border-t border-stone-900/8 pt-6">
            {guide.intro.map((paragraph, index) => (
              <p key={index} className="text-lg leading-8 text-stone-650">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {guide.steps.map((step, index) => (
            <div
              key={index}
              className="rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-8 shadow-[0_18px_40px_rgba(92,74,44,0.07)]"
            >
              <h2 className="font-display text-2xl text-stone-950">{step.title}</h2>
              {step.paragraphs.map((paragraph, pIndex) => (
                <p key={pIndex} className="mt-4 text-base leading-8 text-stone-700">
                  {paragraph}
                </p>
              ))}
              {step.bullets ? (
                <ul className="mt-5 space-y-3">
                  {step.bullets.map((bullet, bIndex) => (
                    <li
                      key={bIndex}
                      className="flex gap-3 rounded-[1.2rem] bg-[#f3ede2] px-5 py-4 text-sm leading-7 text-stone-700"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8a6a2f]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {step.code ? (
                <div className="mt-6 overflow-hidden rounded-[1.4rem] border border-stone-900/10 bg-stone-950">
                  <div className="border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                    {step.code.language}
                  </div>
                  <pre className="overflow-x-auto p-5 text-sm leading-7 text-stone-300">
                    <code>{step.code.content}</code>
                  </pre>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <PageCta
        title="Ready to run it for real?"
        body="Create an account and put this guide to work against the live platform."
        primaryHref="/register"
        primaryLabel="Get started"
        secondaryHref="/resources/api-reference"
        secondaryLabel="API reference"
      />
    </div>
  );
}
