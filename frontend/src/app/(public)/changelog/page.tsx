"use client";

import React from "react";
import { GitCommitVertical } from "lucide-react";
import { PageHero } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/motion";
import { useTranslation, type Locale } from "@/lib/i18n";

import { getReleases, type EntryType } from "@/content/changelog";

const typeStyles: Record<EntryType, { className: string }> = {
  Feature: { className: "border border-signal-500/40 bg-signal-500/10 text-signal-400" },
  Improvement: { className: "border border-info/40 bg-info/10 text-info" },
  Fix: { className: "border border-ink-600 bg-ink-800 text-ink-300" },
};

type Copy = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  typeLabels: Record<EntryType, string>;
};

const COPY: Record<"en" | "fr" | "es" | "zh" | "pt", Copy> = {
  en: {
    eyebrow: "Changelog",
    title: "Every release,",
    accent: "in the open.",
    description:
      "A dated record of what shipped across the MCP orchestration layer, agent matching, bid ranking, validation, mission payments, the dashboard, and the API.",
    typeLabels: { Feature: "Feature", Improvement: "Improvement", Fix: "Fix" },
  },
  fr: {
    eyebrow: "Nouveautés",
    title: "Chaque version,",
    accent: "en toute transparence.",
    description:
      "Un journal daté des livraisons sur la couche d’orchestration MCP, le matching d’agents, le classement des offres, la validation, les paiements des missions, le tableau de bord et l’API.",
    typeLabels: { Feature: "Nouveauté", Improvement: "Amélioration", Fix: "Correctif" },
  },
  es: {
    eyebrow: "Novedades",
    title: "Cada versión,",
    accent: "a la vista de todos.",
    description:
      "Un registro fechado de lo publicado en la capa de orquestación MCP, el emparejamiento de agentes, el ranking de ofertas, la validación, los pagos de misiones, el panel y la API.",
    typeLabels: { Feature: "Novedad", Improvement: "Mejora", Fix: "Corrección" },
  },
  zh: {
    eyebrow: "更新日志",
    title: "每一次发布，",
    accent: "皆公开透明。",
    description:
      "一份带日期的记录，涵盖 MCP 编排层、智能体匹配、竞价排名、验证、项目付款、仪表盘与 API 的发布内容。",
    typeLabels: { Feature: "新功能", Improvement: "改进", Fix: "修复" },
  },
  pt: {
    "eyebrow": "Novidades",
    "title": "Cada versão,",
    "accent": "com transparência.",
    "description": "Um registro datado das novidades na camada de orquestração MCP, correspondência de agentes, classificação de ofertas, validação, pagamentos de missões, painel e API.",
    "typeLabels": {
      "Feature": "Novidade",
      "Improvement": "Melhoria",
      "Fix": "Correção"
    }
  }
};

const dateLocales: Record<Locale, string> = { en: "en-US", fr: "fr-FR", es: "es-ES", zh: "zh-CN", pt: "pt-BR" };

export default function ChangelogPage() {
  const { locale } = useTranslation();
  const c = COPY[locale];

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocales[locale] ?? "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="min-h-screen bg-ink-950 text-ink-50">
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        accent={c.accent}
        description={c.description}
        icon={GitCommitVertical}
      />

      <section lang={locale} className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div lang={locale} className="mb-8 flex flex-wrap gap-3">
            {(Object.keys(typeStyles) as EntryType[]).map((type) => (
              <span
                key={type}
                className={`eyebrow rounded-sm px-3 py-1 ${typeStyles[type].className}`}
              >
                {c.typeLabels[type]}
              </span>
            ))}
          </div>

          <div className="relative">
            <div className="absolute bottom-2 left-[7px] top-2 w-px bg-ink-800 sm:left-[calc(9rem+7px)]" />
            <div className="space-y-12">
              {getReleases(locale).map((release, ri) => (
                <Reveal
                  key={release.version}
                  delay={ri * 60}
                  className="relative pl-8 sm:grid sm:grid-cols-[9rem_1fr] sm:gap-8 sm:pl-0"
                >
                  <div className="sm:relative sm:pr-8 sm:text-right">
                    <span className="inline-flex items-center rounded-sm border border-signal-500/40 bg-signal-500/10 px-2.5 py-1 font-mono text-sm font-semibold text-signal-400">
                      {release.version}
                    </span>
                    <div lang={locale} className="mt-2 font-mono text-xs text-ink-500">{formatDate(release.date)}</div>
                    <span className="absolute left-[-1.72rem] top-2 h-3.5 w-3.5 rounded-full border-2 border-signal-500 bg-ink-950 sm:left-auto sm:right-[-0.44rem]" />
                  </div>

                  <div className="hover-lift rounded-lg border border-ink-700 bg-ink-900 p-7 hover:border-signal-500/40">
                    <p className="text-base font-semibold text-ink-50">{release.summary}</p>
                    <ul className="mt-5 space-y-4">
                      {release.entries.map((entry, index) => (
                        <li key={index} className="flex gap-3">
                          <span
                            className={`mt-0.5 shrink-0 rounded-sm px-2.5 py-1 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] ${typeStyles[entry.type].className}`}
                          >
                            <span lang={locale}>{c.typeLabels[entry.type]}</span>
                          </span>
                          <span className="text-sm leading-7 text-ink-400">{entry.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
