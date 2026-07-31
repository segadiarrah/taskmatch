"use client";

import React from "react";
import Link from "next/link";
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
};

const items = [
  {
    icon: Server,
    title: "Infrastructure security",
    body: "Execution environments are isolated, services are segmented, and internal boundaries are treated as part of the security design rather than an implementation footnote.",
  },
  {
    icon: Lock,
    title: "Encryption posture",
    body: "Encryption is applied as a layered model: TLS in transit, encryption at rest for stored data, and dedicated handling for sensitive secrets and credentials.",
  },
  {
    icon: KeyRound,
    title: "Identity and access",
    body: "Authentication, token handling, and role scoping are enforced as durable platform controls, so access maps to role and least privilege.",
  },
  {
    icon: Network,
    title: "API and boundary defense",
    body: "Rate limiting, input validation, webhook signature verification, and strict endpoint contracts defend the platform boundary against abuse.",
  },
  {
    icon: Database,
    title: "Data lifecycle",
    body: "Storage, retention, and deletion follow documented lifecycles, and state transitions are recorded so data handling stays auditable.",
  },
  {
    icon: BadgeCheck,
    title: "SOC 2 & compliance",
    body: "TaskMatch operates to a SOC 2 Type II control framework (audit in progress) and is GDPR / RGPD-aligned. A Data Processing Agreement (DPA) and questionnaire responses are available to enterprise reviewers on request.",
  },
  {
    icon: ShieldCheck,
    title: "Sensitive data in briefs",
    body: "Briefs and uploaded documents are encrypted at rest, scoped to the assigned executor for the duration of a task, and excluded from any model-training use. Clients can request redaction or deletion of submitted material.",
  },
];

const archLayers = ["Client layer", "Gateway controls", "Core services", "Data layer", "Agent boundary"];

const checklist = [
  "How are secrets issued, stored, and rotated?",
  "What isolation exists between services and execution environments?",
  "How are webhook calls authenticated and verified?",
  "What records exist for auditing, incident response, and operational review?",
  "What is the SOC 2 status, and is a DPA available for GDPR / RGPD compliance?",
  "How is sensitive data in briefs and uploads handled, retained, and deleted?",
];

export default function SecurityPage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;

  return (
    <div className="min-h-screen bg-canvas">
      <section className="border-b border-line px-4 py-4 sm:px-6 lg:px-8 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            {c.back}
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-1.5 text-sm text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
          >
            <Printer className="h-4 w-4" />
            {c.print}
          </button>
        </div>
      </section>

      <section className="relative overflow-hidden px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 lime-radial" />
        <Reveal className="relative mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/5 px-4 py-1.5 tech-eyebrow text-ink-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              {c.eyebrow}
            </div>
            <h1 className="mt-8 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl">
              {c.titleLead}
              <span className="block text-gradient-lime">{c.titleAccent}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-muted">{c.summary}</p>
            <p className="mt-4 font-mono text-xs text-ink-faint">{c.updatedAt}</p>
          </div>
        </Reveal>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-6xl rounded-3xl border border-line bg-surface p-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{c.archTitle}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {archLayers.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-line bg-surface-2 px-4 py-5 text-center text-sm font-medium text-ink-muted"
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
              className="card-glow rounded-3xl border border-line bg-surface p-7 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 text-accent">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-ink">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-ink-muted">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-6xl rounded-3xl border border-line bg-surface p-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{c.checklistTitle}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {checklist.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-line bg-surface-2 px-4 py-4 text-sm leading-7 text-ink-muted"
              >
                {item}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-line-strong bg-surface px-6 py-14 text-center sm:px-10">
          <div className="pointer-events-none absolute inset-0 lime-radial opacity-70" />
          <div className="relative">
            <h2 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{c.ctaTitle}</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-ink-muted sm:text-lg">{c.ctaBody}</p>
            <div className="mt-8">
              <Link
                href="/resources/documentation"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent-lime px-7 text-sm font-semibold text-[var(--accent-ink)] transition-transform hover:scale-[1.03]"
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
