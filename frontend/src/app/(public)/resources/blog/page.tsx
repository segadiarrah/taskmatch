"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Newspaper } from "lucide-react";
import { PageHero } from "@/components/public/page-shell";
import { blogPosts } from "@/content/blog";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
  const sorted = [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const [featured, ...rest] = sorted;

  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Blog"
        title="Notes from building"
        accent="dependable AI execution."
        description="Technical essays and product thinking on task decomposition, explainable matching, validation, escrow payments, and making AI decisions auditable."
        icon={Newspaper}
      />

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link href={`/resources/blog/${featured.slug}`} className="group block">
            <article className="grid gap-8 rounded-[2rem] border border-stone-900/10 bg-white/80 p-8 shadow-[0_20px_50px_rgba(92,74,44,0.08)] transition-shadow hover:shadow-[0_28px_70px_rgba(92,74,44,0.14)] lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a2f]">
                  <span className="rounded-full bg-[#f3ede2] px-3 py-1">{featured.tag}</span>
                  <span className="inline-flex items-center gap-1 text-stone-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(featured.date)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-stone-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {featured.readingTime}
                  </span>
                </div>
                <h2 className="mt-5 font-display text-4xl leading-tight text-stone-950">
                  {featured.title}
                </h2>
                <p className="mt-4 text-base leading-8 text-stone-650">{featured.excerpt}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-950 text-sm font-semibold text-white">
                    {featured.author.name.charAt(0)}
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-stone-950">{featured.author.name}</div>
                    <div className="text-stone-500">{featured.author.role}</div>
                  </div>
                </div>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-stone-950">
                  Read the article
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
              <div className="hidden rounded-[1.5rem] bg-[#efe7d8] p-8 lg:flex lg:flex-col lg:justify-center">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a2f]">
                  Featured
                </div>
                <p className="mt-4 font-display text-2xl leading-snug text-stone-950">
                  The path from a sentence to shipped, validated work — explained by the people building it.
                </p>
              </div>
            </article>
          </Link>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/resources/blog/${post.slug}`}
                className="group flex h-full flex-col rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-7 shadow-[0_18px_40px_rgba(92,74,44,0.07)] transition-shadow hover:shadow-[0_24px_55px_rgba(92,74,44,0.12)]"
              >
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em]">
                  <span className="rounded-full bg-[#f3ede2] px-3 py-1 text-[#8a6a2f]">{post.tag}</span>
                  <span className="inline-flex items-center gap-1 text-stone-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {post.readingTime}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold leading-snug text-stone-950">
                  {post.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-stone-600">{post.excerpt}</p>
                <div className="mt-6 flex items-center justify-between border-t border-stone-900/8 pt-5 text-sm">
                  <div>
                    <div className="font-medium text-stone-950">{post.author.name}</div>
                    <div className="text-xs text-stone-500">{formatDate(post.date)}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#8a6a2f] transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
