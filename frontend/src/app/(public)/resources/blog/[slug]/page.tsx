"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, FileQuestion } from "lucide-react";
import { PageCta } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/motion";
import { useTranslation, type Locale } from "@/lib/i18n";
import { getPostBySlug } from "@/content/blog";

const DATE_LOCALE: Record<Locale, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  zh: "zh-CN",
};

const COPY: Record<
  Locale,
  {
    allArticles: string;
    notFoundTitle: string;
    notFoundBody: string;
    backToBlog: string;
    ctaTitle: string;
    ctaBody: string;
    ctaPrimary: string;
    ctaSecondary: string;
  }
> = {
  en: {
    allArticles: "All articles",
    notFoundTitle: "Article not found",
    notFoundBody:
      "We couldn't find the article you were looking for. It may have moved or the link may be incorrect.",
    backToBlog: "Back to the blog",
    ctaTitle: "See the lifecycle for yourself",
    ctaBody:
      "Submit a plain-language brief and watch it become structured, decomposed, matched, and validated work.",
    ctaPrimary: "Get started",
    ctaSecondary: "How it works",
  },
  fr: {
    allArticles: "Tous les articles",
    notFoundTitle: "Article introuvable",
    notFoundBody:
      "Nous n'avons pas trouvé l'article que vous cherchiez. Il a peut-être été déplacé ou le lien est incorrect.",
    backToBlog: "Retour au blog",
    ctaTitle: "Découvrez le cycle de vie par vous-même",
    ctaBody:
      "Soumettez un brief en langage naturel et voyez-le devenir un travail structuré, décomposé, attribué et validé.",
    ctaPrimary: "Commencer",
    ctaSecondary: "Comment ça marche",
  },
  es: {
    allArticles: "Todos los artículos",
    notFoundTitle: "Artículo no encontrado",
    notFoundBody:
      "No pudimos encontrar el artículo que buscabas. Es posible que se haya movido o que el enlace sea incorrecto.",
    backToBlog: "Volver al blog",
    ctaTitle: "Comprueba el ciclo de vida por ti mismo",
    ctaBody:
      "Envía un brief en lenguaje natural y míralo convertirse en trabajo estructurado, descompuesto, asignado y validado.",
    ctaPrimary: "Empezar",
    ctaSecondary: "Cómo funciona",
  },
  zh: {
    allArticles: "所有文章",
    notFoundTitle: "未找到文章",
    notFoundBody: "我们找不到你要查看的文章。它可能已被移动，或链接有误。",
    backToBlog: "返回博客",
    ctaTitle: "亲自体验完整流程",
    ctaBody: "提交一份自然语言需求，看着它变成结构化、拆解、匹配并验证过的工作。",
    ctaPrimary: "立即开始",
    ctaSecondary: "运作方式",
  },
};

export default function BlogArticlePage() {
  const params = useParams();
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;
  const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0];
  const post = slug ? getPostBySlug(slug) : undefined;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(DATE_LOCALE[locale] ?? "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (!post) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-canvas px-4">
        <Reveal className="card-glow max-w-md rounded-3xl border border-line bg-surface p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface-2 text-accent">
            <FileQuestion className="h-6 w-6" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink">
            {c.notFoundTitle}
          </h1>
          <p className="mt-3 text-sm leading-7 text-ink-muted">{c.notFoundBody}</p>
          <Link
            href="/resources/blog"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent-lime px-6 h-11 text-sm font-semibold text-[var(--accent-ink)] transition-transform hover:scale-[1.03]"
          >
            <ArrowLeft className="h-4 w-4" />
            {c.backToBlog}
          </Link>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <article className="relative overflow-hidden px-4 pb-8 pt-20 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 lime-radial" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] grid-bg opacity-30" />
        <Reveal className="relative mx-auto max-w-3xl">
          <Link
            href="/resources/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            {c.allArticles}
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.18em]">
            <span className="rounded-full border border-line-strong bg-accent-lime/10 px-3 py-1 text-accent">
              {post.tag}
            </span>
            <span className="inline-flex items-center gap-1 text-ink-faint">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(post.date)}
            </span>
            <span className="inline-flex items-center gap-1 text-ink-faint">
              <Clock3 className="h-3.5 w-3.5" />
              {post.readingTime}
            </span>
          </div>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-ink-muted">{post.excerpt}</p>

          <div className="mt-8 flex items-center gap-3 border-t border-line pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-lime text-sm font-semibold text-[var(--accent-ink)]">
              {post.author.name.charAt(0)}
            </div>
            <div className="text-sm">
              <div className="font-semibold text-ink">{post.author.name}</div>
              <div className="text-ink-faint">{post.author.role}</div>
            </div>
          </div>
        </Reveal>
      </article>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-line bg-surface p-8 sm:p-10">
            <div className="space-y-10">
              {post.body.map((section, index) => (
                <div key={index}>
                  {section.heading ? (
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                      {section.heading}
                    </h2>
                  ) : null}
                  {section.paragraphs?.map((paragraph, pIndex) => (
                    <p
                      key={pIndex}
                      className={`text-base leading-8 text-ink-muted ${
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
                          className="flex gap-3 rounded-2xl border border-line bg-surface-2 px-5 py-4 text-sm leading-7 text-ink-muted"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-lime" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {section.code ? (
                    <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-canvas">
                      <div className="border-b border-line px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-ink-faint">
                        {section.code.language}
                      </div>
                      <pre className="overflow-x-auto p-5 font-mono text-sm leading-7 text-ink">
                        <code>{section.code.content}</code>
                      </pre>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <PageCta
        title={c.ctaTitle}
        body={c.ctaBody}
        primaryHref="/register"
        primaryLabel={c.ctaPrimary}
        secondaryHref="/how-it-works"
        secondaryLabel={c.ctaSecondary}
      />
    </div>
  );
}
