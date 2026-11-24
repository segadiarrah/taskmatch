"use client";

import { securityCopy } from "@/content/security";
import React from "react";
import Link from "@/components/public/localized-link";
import { Reveal } from "@/components/public/motion";
import { useTranslation, type Locale } from "@/lib/i18n";
import {
  ArrowLeft,
  BadgeCheck,
  Database,
  KeyRound,
  Lock,
  Network,
  Printer,
  Server,
  ShieldCheck,
} from "lucide-react";

const COPY: Record<
  Locale,
  {
    back: string;
    print: string;
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    summary: string;
    updatedAt: string;
    archTitle: string;
    checklistTitle: string;
    ctaTitle: string;
    ctaBody: string;
    ctaButton: string;
  }
> = {
  en: {
    back: "Back to TaskMatch",
    print: "Print",
    eyebrow: "Security",
    titleLead: "How TaskMatch protects",
    titleAccent: "your data and your work.",
    summary:
      "How we secure infrastructure, encryption, identity, APIs, and the data lifecycle — with controls documented so technical and procurement reviewers can assess them directly.",
    updatedAt: "Last updated: March 1, 2026",
    archTitle: "Security architecture overview",
    checklistTitle: "Security review checklist",
    ctaTitle: "Reviewing TaskMatch for security?",
    ctaBody:
      "Read the documentation for architecture detail, or contact us for a security review, questionnaire responses, or a walkthrough of our controls.",
    ctaButton: "Open documentation",
  },
  fr: {
    back: "Retour à TaskMatch",
    print: "Imprimer",
    eyebrow: "Sécurité",
    titleLead: "Comment TaskMatch protège",
    titleAccent: "vos données et votre travail.",
    summary:
      "Comment nous sécurisons l’infrastructure, le chiffrement, les identités, les API et le cycle de vie des données — avec des contrôles documentés que les évaluateurs techniques et achats peuvent examiner directement.",
    updatedAt: "Dernière mise à jour : 1 mars 2026",
    archTitle: "Aperçu de l'architecture de sécurité",
    checklistTitle: "Liste de contrôle pour l'examen de sécurité",
    ctaTitle: "Vous évaluez la sécurité de TaskMatch ?",
    ctaBody:
      "Consultez la documentation pour le détail de l’architecture, ou contactez-nous pour un examen de sécurité, des réponses à un questionnaire ou une présentation de nos contrôles.",
    ctaButton: "Ouvrir la documentation",
  },
  es: {
    back: "Volver a TaskMatch",
    print: "Imprimir",
    eyebrow: "Seguridad",
    titleLead: "Cómo TaskMatch protege",
    titleAccent: "tus datos y tu trabajo.",
    summary:
      "Cómo aseguramos la infraestructura, el cifrado, la identidad, las API y el ciclo de vida de los datos — con controles documentados que los revisores técnicos y de compras pueden evaluar directamente.",
    updatedAt: "Última actualización: 1 de marzo de 2026",
    archTitle: "Resumen de la arquitectura de seguridad",
    checklistTitle: "Lista de verificación de seguridad",
    ctaTitle: "¿Evaluando la seguridad de TaskMatch?",
    ctaBody:
      "Consulta la documentación para el detalle de la arquitectura, o contáctanos para una revisión de seguridad, respuestas a cuestionarios o un recorrido por nuestros controles.",
    ctaButton: "Abrir la documentación",
  },
  zh: {
    back: "返回 TaskMatch",
    print: "打印",
    eyebrow: "安全",
    titleLead: "TaskMatch 如何保护",
    titleAccent: "你的数据与你的工作。",
    summary: "我们如何保护基础设施、加密、身份、API 与数据生命周期——控制措施均有文档记录，技术与采购评审可直接评估。",
    updatedAt: "最后更新：2026 年 3 月 1 日",
    archTitle: "安全架构概览",
    checklistTitle: "安全审查清单",
    ctaTitle: "正在评估 TaskMatch 的安全性？",
    ctaBody: "查阅文档了解架构细节，或联系我们进行安全评审、填写问卷或了解我们的控制措施。",
    ctaButton: "打开文档",
  },
  pt: {
    back: "Voltar ao TaskMatch",
    print: "Imprimir",
    eyebrow: "Segurança",
    titleLead: "Como o TaskMatch protege",
    titleAccent: "os seus dados e o seu trabalho.",
    summary: "Como protegemos a infraestrutura, a criptografia, as identidades, as APIs e o ciclo de vida dos dados — com controles documentados que as equipes técnicas e de compras podem avaliar diretamente.",
    updatedAt: "Última atualização: 1 de março de 2026",
    archTitle: "Visão geral da arquitetura de segurança",
    checklistTitle: "Lista de verificação de segurança",
    ctaTitle: "Está a avaliar a segurança do TaskMatch?",
    ctaBody: "Consulte a documentação para conhecer a arquitetura em detalhe ou contate-nos para uma avaliação de segurança, respostas a questionários ou uma apresentação dos nossos controles.",
    ctaButton: "Abrir a documentação"
  },
};

const icons = [Server, Lock, KeyRound, Network, Database, BadgeCheck, ShieldCheck];

export default function SecurityPage() {
  const { locale } = useTranslation();
  const c = COPY[locale];
  const detail = securityCopy[locale];
  const items = detail.items.map(([title, body], index) => ({ title, body, icon: icons[index] }));

  return (
    <div className="min-h-screen bg-paper text-paper-ink">
      <section className="border-b border-paper-ink/15 px-4 py-4 sm:px-6 lg:px-8 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-paper-ink/60 transition-colors hover:text-paper-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            {c.back}
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md border border-paper-ink/30 px-4 py-1.5 text-sm text-paper-ink/70 transition-colors hover:bg-paper-ink hover:text-paper"
          >
            <Printer className="h-4 w-4" />
            {c.print}
          </button>
        </div>
      </section>

      <section className="relative border-b border-paper-ink/15 px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-grid-paper" aria-hidden="true" />
        <Reveal className="relative mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="eyebrow inline-flex items-center gap-2 rounded-full border border-paper-ink/25 px-4 py-1.5 text-paper-ink/70">
              <ShieldCheck className="h-3.5 w-3.5 text-signal-600" />
              {c.eyebrow}
            </div>
            <h1 className="mt-8 font-display text-5xl font-medium leading-[1.05] text-paper-ink sm:text-6xl">
              {c.titleLead}
              <span className="block font-display italic text-signal-600">{c.titleAccent}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-paper-ink/70">{c.summary}</p>
            <p className="mt-4 font-mono text-xs text-paper-ink/50">{c.updatedAt}</p>
          </div>
        </Reveal>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-6xl rounded-lg border border-paper-ink/15 bg-paper-deep/50 p-8">
          <h2 className="font-display text-3xl font-medium text-paper-ink">{c.archTitle}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {detail.arch.map((item) => (
              <div
                key={item}
                className="rounded-md border border-paper-ink/15 bg-paper px-4 py-5 text-center font-mono text-xs uppercase tracking-wider text-paper-ink/70"
              >
                {item}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <Reveal
              key={item.title}
              delay={index * 60}
              className="rounded-lg border border-paper-ink/15 bg-paper-deep/50 p-7 transition-colors hover:border-paper-ink/40"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-paper-ink/20 text-signal-600">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-paper-ink">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-paper-ink/75">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-6xl rounded-lg border border-paper-ink/15 bg-paper-deep/50 p-8">
          <h2 className="font-display text-3xl font-medium text-paper-ink">{c.checklistTitle}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {detail.check.map((item) => (
              <div
                key={item}
                className="rounded-md border border-paper-ink/15 bg-paper px-4 py-4 text-sm leading-7 text-paper-ink/75"
              >
                {item}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-lg bg-paper-ink px-6 py-14 text-center text-paper sm:px-10">
          <div className="pointer-events-none absolute inset-0 bg-noise opacity-10" aria-hidden="true" />
          <div className="relative">
            <h2 className="font-display text-4xl font-medium text-paper sm:text-5xl">{c.ctaTitle}</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-paper/75 sm:text-lg">{c.ctaBody}</p>
            <div className="mt-8">
              <Link
                href="/resources/documentation"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-signal-500 px-7 text-sm font-semibold text-ink-950 transition-all hover:bg-signal-400 hover:shadow-glow-sm"
              >
                {c.ctaButton}
                <BadgeCheck className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
