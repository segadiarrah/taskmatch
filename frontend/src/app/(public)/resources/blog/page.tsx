"use client";

import React from "react";
import Link from "@/components/public/localized-link";
import { ArrowRight, CalendarDays, Clock3, Newspaper } from "lucide-react";
import { PageHero } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/motion";
import { getBlogPosts } from "@/content/blog";
import { useTranslation, type Locale } from "@/lib/i18n";

type Copy = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  featured: string;
  featuredTagline: string;
  readArticle: string;
};

const COPY: Record<"en" | "fr" | "es" | "zh" | "pt", Copy> = {
  en: {
    eyebrow: "Blog",
    title: "Notes from building",
    accent: "dependable AI execution.",
    description:
      "Technical essays and product thinking on task decomposition, explainable matching, validation, mission payments, and making AI decisions auditable.",
    featured: "Featured",
    featuredTagline: "The path from a sentence to shipped, validated work — explained by the people building it.",
    readArticle: "Read the article",
  },
  fr: {
    eyebrow: "Blog",
    title: "Notes de construction",
    accent: "d’une exécution IA fiable.",
    description:
      "Essais techniques et réflexions produit sur la décomposition des tâches, le matching explicable, la validation, les paiements des missions et l’auditabilité des décisions IA.",
    featured: "À la une",
    featuredTagline: "Le chemin d’une phrase jusqu’à un travail livré et validé — expliqué par ceux qui le construisent.",
    readArticle: "Lire l’article",
  },
  es: {
    eyebrow: "Blog",
    title: "Notas sobre construir",
    accent: "una ejecución de IA fiable.",
    description:
      "Ensayos técnicos y reflexiones de producto sobre descomposición de tareas, emparejamiento explicable, validación, pagos de misiones y auditabilidad de las decisiones de IA.",
    featured: "Destacado",
    featuredTagline: "El camino de una frase a un trabajo entregado y validado — explicado por quienes lo construyen.",
    readArticle: "Leer el artículo",
  },
  zh: {
    eyebrow: "博客",
    title: "构建可靠 AI 执行的",
    accent: "手记。",
    description:
      "关于任务拆解、可解释匹配、验证、项目付款，以及让 AI 决策可审计的技术随笔与产品思考。",
    featured: "精选",
    featuredTagline: "从一句话到交付并验证的工作——由正在构建它的人讲述。",
    readArticle: "阅读文章",
  },
  pt: {
    "eyebrow": "Blog",
    "title": "Notas sobre a construção",
    "accent": "de uma execução de IA confiável.",
    "description": "Artigos técnicos e reflexões sobre decomposição de tarefas, correspondência explicável, validação, pagamentos de missões e auditoria de decisões de IA.",
    "featured": "Em destaque",
    "featuredTagline": "O caminho de uma frase a um trabalho entregue e validado, explicado por quem o está construindo.",
    "readArticle": "Ler o artigo"
  }
};

const dateLocales: Record<Locale, string> = { en: "en-US", fr: "fr-FR", es: "es-ES", zh: "zh-CN", pt: "pt-BR" };

export default function BlogPage() {
  const { locale } = useTranslation();
  const c = COPY[locale];

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocales[locale] ?? "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const sorted = [...getBlogPosts(locale)].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const [featured, ...rest] = sorted;

  return (
    <div className="min-h-screen bg-ink-950 text-ink-50">
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        accent={c.accent}
        description={c.description}
        icon={Newspaper}
      />

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <Link href={`/resources/blog/${featured.slug}`} className="group block">
              <article lang={locale} className="hover-lift grid gap-8 rounded-lg border border-ink-700 bg-ink-900 p-8 hover:border-signal-500/40 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
                <div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                    <span className="rounded-full border border-signal-500/30 bg-signal-500/10 px-3 py-1 eyebrow text-signal-400">
                      {featured.tag}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-ink-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(featured.date)}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-ink-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      {featured.readingTime}
                    </span>
                  </div>
                  <h2 className="mt-5 font-display text-4xl font-medium leading-tight text-ink-50">{featured.title}</h2>
                  <p className="mt-4 text-base leading-8 text-ink-300">{featured.excerpt}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-signal-500 text-sm font-semibold text-ink-950">
                      {featured.author.name.charAt(0)}
                    </div>
                    <div className="text-sm">
                      <div className="font-semibold text-ink-50">{featured.author.name}</div>
                      <div className="text-ink-500">{featured.author.role}</div>
                    </div>
                  </div>
                  <span lang={locale} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ink-50">
                    {c.readArticle}
                    <ArrowRight className="h-4 w-4 text-signal-400 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
                <div lang={locale} className="hidden rounded-md border border-ink-700 bg-ink-850 p-8 lg:flex lg:flex-col lg:justify-center">
                  <div className="eyebrow text-signal-400">{c.featured}</div>
                  <p className="mt-4 font-display text-2xl font-medium leading-snug text-ink-50">{c.featuredTagline}</p>
                </div>
              </article>
            </Link>
          </Reveal>
        </div>
      </section>

      <section lang={locale} className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {rest.map((post, i) => (
              <Reveal key={post.slug} delay={i * 70}>
                <Link
                  href={`/resources/blog/${post.slug}`}
                  className="hover-lift group flex h-full flex-col rounded-lg border border-ink-700 bg-ink-900 p-7 hover:border-signal-500/40"
                >
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                    <span className="rounded-full border border-signal-500/30 bg-signal-500/10 px-3 py-1 eyebrow text-signal-400">
                      {post.tag}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-ink-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      {post.readingTime}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-medium leading-snug text-ink-50">{post.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-7 text-ink-400">{post.excerpt}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-ink-700 pt-5 text-sm">
                    <div>
                      <div className="font-medium text-ink-100">{post.author.name}</div>
                      <div className="font-mono text-xs text-ink-500">{formatDate(post.date)}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-signal-400 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
