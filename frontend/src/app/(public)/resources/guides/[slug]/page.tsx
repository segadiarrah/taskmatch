"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock3, FileQuestion, Layers, Users } from "lucide-react";
import { PageCta } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/motion";
import { useTranslation, type Locale } from "@/lib/i18n";
import { getGuideBySlug } from "@/content/guides";

const COPY: Record<
  Locale,
  {
    allGuides: string;
    notFoundTitle: string;
    notFoundBody: string;
    backToGuides: string;
    ctaTitle: string;
    ctaBody: string;
    ctaPrimary: string;
    ctaSecondary: string;
  }
> = {
  en: {
    allGuides: "All guides",
    notFoundTitle: "Guide not found",
    notFoundBody:
      "We couldn't find the guide you were looking for. It may have moved or the link may be incorrect.",
    backToGuides: "Back to guides",
    ctaTitle: "Ready to run it for real?",
    ctaBody: "Create an account and put this guide to work against the live platform.",
    ctaPrimary: "Get started",
    ctaSecondary: "API reference",
  },
  fr: {
    allGuides: "Tous les guides",
    notFoundTitle: "Guide introuvable",
    notFoundBody:
      "Nous n'avons pas trouvé le guide que vous cherchiez. Il a peut-être été déplacé ou le lien est incorrect.",
    backToGuides: "Retour aux guides",
    ctaTitle: "Prêt à passer à la pratique ?",
    ctaBody: "Créez un compte et mettez ce guide en œuvre sur la plateforme en direct.",
    ctaPrimary: "Commencer",
    ctaSecondary: "Référence API",
  },
  es: {
    allGuides: "Todas las guías",
    notFoundTitle: "Guía no encontrada",
    notFoundBody:
      "No pudimos encontrar la guía que buscabas. Es posible que se haya movido o que el enlace sea incorrecto.",
    backToGuides: "Volver a las guías",
    ctaTitle: "¿Listo para ponerlo en práctica?",
    ctaBody: "Crea una cuenta y aplica esta guía sobre la plataforma en vivo.",
    ctaPrimary: "Empezar",
    ctaSecondary: "Referencia de la API",
  },
  zh: {
    allGuides: "所有指南",
    notFoundTitle: "未找到指南",
    notFoundBody: "我们找不到你要查看的指南。它可能已被移动，或链接有误。",
    backToGuides: "返回指南",
    ctaTitle: "准备好真正上手了吗？",
    ctaBody: "创建账户，将本指南应用到实时平台上。",
    ctaPrimary: "立即开始",
    ctaSecondary: "API 参考",
  },
};

export default function GuideArticlePage() {
  const params = useParams();
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;
  const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0];
  const guide = slug ? getGuideBySlug(slug) : undefined;

  if (!guide) {
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
            href="/resources/guides"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent-lime px-6 h-11 text-sm font-semibold text-[var(--accent-ink)] transition-transform hover:scale-[1.03]"
          >
            <ArrowLeft className="h-4 w-4" />
            {c.backToGuides}
          </Link>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <section className="relative overflow-hidden px-4 pb-8 pt-20 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 lime-radial" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] grid-bg opacity-30" />
        <Reveal className="relative mx-auto max-w-3xl">
          <Link
            href="/resources/guides"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            {c.allGuides}
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.18em]">
            <span className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-accent-lime/10 px-3 py-1 text-accent">
              <Users className="h-3.5 w-3.5" />
              {guide.audience}
            </span>
            <span className="inline-flex items-center gap-1 text-ink-faint">
              <Layers className="h-3.5 w-3.5" />
              {guide.level}
            </span>
            <span className="inline-flex items-center gap-1 text-ink-faint">
              <Clock3 className="h-3.5 w-3.5" />
              {guide.readingTime}
            </span>
          </div>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
            {guide.title}
          </h1>
          <div className="mt-6 space-y-4 border-t border-line pt-6">
            {guide.intro.map((paragraph, index) => (
              <p key={index} className="text-lg leading-8 text-ink-muted">
                {paragraph}
              </p>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {guide.steps.map((step, index) => (
            <Reveal
              key={index}
              delay={index * 60}
              className="rounded-3xl border border-line bg-surface p-8"
            >
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
                {step.title}
              </h2>
              {step.paragraphs.map((paragraph, pIndex) => (
                <p key={pIndex} className="mt-4 text-base leading-8 text-ink-muted">
                  {paragraph}
                </p>
              ))}
              {step.bullets ? (
                <ul className="mt-5 space-y-3">
                  {step.bullets.map((bullet, bIndex) => (
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
              {step.code ? (
                <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-canvas">
                  <div className="border-b border-line px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-ink-faint">
                    {step.code.language}
                  </div>
                  <pre className="overflow-x-auto p-5 font-mono text-sm leading-7 text-ink">
                    <code>{step.code.content}</code>
                  </pre>
                </div>
              ) : null}
            </Reveal>
          ))}
        </div>
      </section>

      <PageCta
        title={c.ctaTitle}
        body={c.ctaBody}
        primaryHref="/register"
        primaryLabel={c.ctaPrimary}
        secondaryHref="/resources/api-reference"
        secondaryLabel={c.ctaSecondary}
      />
    </div>
  );
}
