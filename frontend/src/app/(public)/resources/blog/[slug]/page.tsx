"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, FileQuestion } from "lucide-react";
import { PageCta } from "@/components/public/page-shell";
import { getPostBySlug } from "@/content/blog";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogArticlePage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0];
  const post = slug ? getPostBySlug(slug) : undefined;

  if (!post) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-md rounded-[2rem] border border-stone-900/10 bg-white/80 p-10 text-center shadow-[0_20px_50px_rgba(92,74,44,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3ede2] text-[#8a6a2f]">
            <FileQuestion className="h-6 w-6" />
          </div>
          <h1 className="mt-6 font-display text-3xl text-stone-950">Article not found</h1>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            We couldn&rsquo;t find the article you were looking for. It may have moved or the link may be incorrect.
          </p>
          <Link
            href="/resources/blog"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to the blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <article className="relative overflow-hidden px-4 pb-8 pt-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 premium-radial" />
        <div className="absolute inset-x-0 top-0 h-[320px] premium-grid opacity-30" />
        <div className="relative mx-auto max-w-3xl">
          <Link
            href="/resources/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition-colors hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            All articles
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em]">
            <span className="rounded-full bg-[#f3ede2] px-3 py-1 text-[#8a6a2f]">{post.tag}</span>
            <span className="inline-flex items-center gap-1 text-stone-500">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(post.date)}
            </span>
            <span className="inline-flex items-center gap-1 text-stone-500">
              <Clock3 className="h-3.5 w-3.5" />
              {post.readingTime}
            </span>
          </div>

          <h1 className="mt-6 font-display text-4xl leading-[1.1] text-stone-950 sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-stone-650">{post.excerpt}</p>

          <div className="mt-8 flex items-center gap-3 border-t border-stone-900/8 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-950 text-sm font-semibold text-white">
              {post.author.name.charAt(0)}
            </div>
            <div className="text-sm">
              <div className="font-semibold text-stone-950">{post.author.name}</div>
              <div className="text-stone-500">{post.author.role}</div>
            </div>
          </div>
        </div>
      </article>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-10">
            {post.body.map((section, index) => (
              <div key={index}>
                {section.heading ? (
                  <h2 className="font-display text-2xl text-stone-950 sm:text-3xl">
                    {section.heading}
                  </h2>
                ) : null}
                {section.paragraphs?.map((paragraph, pIndex) => (
                  <p
                    key={pIndex}
                    className={`text-base leading-8 text-stone-700 ${
                      section.heading || pIndex > 0 ? "mt-5" : ""
                    }`}
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="mt-5 space-y-3">
                    {section.bullets.map((bullet, bIndex) => (
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
                {section.code ? (
                  <div className="mt-6 overflow-hidden rounded-[1.4rem] border border-stone-900/10 bg-stone-950">
                    <div className="border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                      {section.code.language}
                    </div>
                    <pre className="overflow-x-auto p-5 text-sm leading-7 text-stone-300">
                      <code>{section.code.content}</code>
                    </pre>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <PageCta
        title="See the lifecycle for yourself"
        body="Submit a plain-language brief and watch it become structured, decomposed, matched, and validated work."
        primaryHref="/register"
        primaryLabel="Get started"
        secondaryHref="/how-it-works"
        secondaryLabel="How it works"
      />
    </div>
  );
}
