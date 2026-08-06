"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, Layers, Users } from "lucide-react";
import { PageHero, PageCta } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/motion";
import { guides } from "@/content/guides";
import { useTranslation } from "@/lib/i18n";

type Copy = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  steps: (n: number) => string;
  ctaTitle: string;
  ctaBody: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

const COPY: Record<"en" | "fr" | "es" | "zh", Copy> = {
  en: {
    eyebrow: "Guides",
    title: "Step-by-step guides",
    accent: "against the real API.",
    description:
      "Hands-on walkthroughs for clients and agent developers — each one runs against live /api/v1 endpoints, with copy-pasteable code.",
    steps: (n) => `${n} steps`,
    ctaTitle: "Prefer the full reference?",
    ctaBody:
      "The guides cover the common flows end to end. For every endpoint, request, and response shape, browse the API reference.",
    ctaPrimary: "Open API reference",
    ctaSecondary: "Read documentation",
  },
  fr: {
    eyebrow: "Guides",
    title: "Des guides pas à pas",
    accent: "sur la vraie API.",
    description:
      "Des tutoriels pratiques pour clients et développeurs d’agents — chacun s’exécute sur les endpoints /api/v1 en direct, avec du code à copier-coller.",
    steps: (n) => `${n} étapes`,
    ctaTitle: "Vous préférez la référence complète ?",
    ctaBody:
      "Les guides couvrent les flux courants de bout en bout. Pour chaque endpoint, requête et réponse, parcourez la référence API.",
    ctaPrimary: "Ouvrir la référence API",
    ctaSecondary: "Lire la documentation",
  },
  es: {
    eyebrow: "Guías",
    title: "Guías paso a paso",
    accent: "contra la API real.",
    description:
      "Tutoriales prácticos para clientes y desarrolladores de agentes — cada uno se ejecuta contra endpoints /api/v1 en vivo, con código para copiar y pegar.",
    steps: (n) => `${n} pasos`,
    ctaTitle: "¿Prefieres la referencia completa?",
    ctaBody:
      "Las guías cubren los flujos comunes de principio a fin. Para cada endpoint, petición y respuesta, explora la referencia de la API.",
    ctaPrimary: "Abrir referencia API",
    ctaSecondary: "Leer documentación",
  },
  zh: {
    eyebrow: "指南",
    title: "分步指南",
    accent: "面向真实 API。",
    description: "面向客户与智能体开发者的实操教程——每篇都针对在线的 /api/v1 端点运行，并附可复制粘贴的代码。",
    steps: (n) => `${n} 个步骤`,
    ctaTitle: "更想要完整参考？",
    ctaBody: "指南端到端覆盖常见流程。若需每个端点、请求与响应结构，请浏览 API 参考。",
    ctaPrimary: "打开 API 参考",
    ctaSecondary: "阅读文档",
  },
};

export default function GuidesPage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        accent={c.accent}
        description={c.description}
        icon={BookOpen}
      />

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2">
            {guides.map((guide, i) => (
              <Reveal key={guide.slug} delay={i * 70}>
                <Link
                  href={`/resources/guides/${guide.slug}`}
                  className="hover-lift group flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-8 hover:border-stone-300 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                    <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 eyebrow text-brand-700">
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
                  <h3 className="mt-5 text-2xl font-semibold leading-snug text-stone-900">{guide.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-7 text-stone-600">{guide.excerpt}</p>
                  <div className="mt-6 flex items-center gap-2 border-t border-stone-200 pt-5 text-sm font-semibold text-stone-900">
                    {c.steps(guide.steps.length)}
                    <ArrowRight className="h-4 w-4 text-brand-700 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <PageCta
        title={c.ctaTitle}
        body={c.ctaBody}
        primaryHref="/resources/api-reference"
        primaryLabel={c.ctaPrimary}
        secondaryHref="/resources/documentation"
        secondaryLabel={c.ctaSecondary}
      />
    </div>
  );
}
