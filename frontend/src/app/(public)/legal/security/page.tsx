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
    titleLead: "Security information,",
    titleAccent: "presented with the same rigor.",
    summary:
      "The content remains serious, but the page now feels integrated with your public brand: more structured, more premium, and easier to review.",
    updatedAt: "Last updated: March 1, 2026",
    archTitle: "Security architecture overview",
    checklistTitle: "Security review checklist",
    ctaTitle: "The security page now reinforces trust instead of just stating it.",
    ctaBody:
      "Buyers, technical reviewers, and procurement teams should all feel that the information is serious and the presentation is intentional.",
    ctaButton: "Open documentation",
  },
  fr: {
    back: "Retour à TaskMatch",
    print: "Imprimer",
    eyebrow: "Sécurité",
    titleLead: "Informations de sécurité,",
    titleAccent: "présentées avec la même rigueur.",
    summary:
      "Le contenu reste sérieux, mais la page s'intègre désormais à votre marque publique : plus structurée, plus premium et plus facile à examiner.",
    updatedAt: "Dernière mise à jour : 1 mars 2026",
    archTitle: "Aperçu de l'architecture de sécurité",
    checklistTitle: "Liste de contrôle pour l'examen de sécurité",
    ctaTitle: "La page de sécurité renforce désormais la confiance au lieu de simplement l'affirmer.",
    ctaBody:
      "Les acheteurs, les évaluateurs techniques et les équipes achats doivent tous sentir que l'information est sérieuse et la présentation intentionnelle.",
    ctaButton: "Ouvrir la documentation",
  },
  es: {
    back: "Volver a TaskMatch",
    print: "Imprimir",
    eyebrow: "Seguridad",
    titleLead: "Información de seguridad,",
    titleAccent: "presentada con el mismo rigor.",
    summary:
      "El contenido sigue siendo serio, pero la página ahora se integra con tu marca pública: más estructurada, más premium y más fácil de revisar.",
    updatedAt: "Última actualización: 1 de marzo de 2026",
    archTitle: "Resumen de la arquitectura de seguridad",
    checklistTitle: "Lista de verificación de seguridad",
    ctaTitle: "La página de seguridad ahora refuerza la confianza en lugar de solo afirmarla.",
    ctaBody:
      "Los compradores, los revisores técnicos y los equipos de compras deben sentir que la información es seria y la presentación es intencionada.",
    ctaButton: "Abrir la documentación",
  },
  zh: {
    back: "返回 TaskMatch",
    print: "打印",
    eyebrow: "安全",
    titleLead: "安全信息，",
    titleAccent: "以同样的严谨呈现。",
    summary: "内容依旧严肃，但页面现已与你的公开品牌融为一体：更有结构、更高端、更易审阅。",
    updatedAt: "最后更新：2026 年 3 月 1 日",
    archTitle: "安全架构概览",
    checklistTitle: "安全审查清单",
    ctaTitle: "安全页面如今不再只是声明信任，而是切实强化信任。",
    ctaBody: "买家、技术评审人员和采购团队都应感受到：信息是严肃的，呈现是用心的。",
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
    body: "The page now communicates encryption as a layered model: transport, storage, and sensitive-secret handling.",
  },
  {
    icon: KeyRound,
    title: "Identity and access",
    body: "Authentication, token handling, and role scoping are framed as durable platform controls with clear operational intent.",
  },
  {
    icon: Network,
    title: "API and boundary defense",
    body: "Rate limiting, validation, webhook verification, and endpoint expectations are presented in a cleaner, more trustworthy structure.",
  },
  {
    icon: Database,
    title: "Data lifecycle",
    body: "The narrative is easier to follow for buyers reviewing storage, retention, and auditability concerns.",
  },
  {
    icon: ShieldCheck,
    title: "Assurance posture",
    body: "The overall page now feels aligned with enterprise review instead of reading like a generic legal appendix.",
  },
];

const archLayers = ["Client layer", "Gateway controls", "Core services", "Data layer", "Agent boundary"];

const checklist = [
  "How are secrets issued, stored, and rotated?",
  "What isolation exists between services and execution environments?",
  "How are webhook calls authenticated and verified?",
  "What records exist for auditing, incident response, and operational review?",
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
