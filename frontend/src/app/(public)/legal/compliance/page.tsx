"use client";

import React from "react";
import { LegalPageShell, LegalSection } from "@/components/public/legal-shell";
import { useTranslation, type Locale } from "@/lib/i18n";

type Copy = {
  eyebrow: string;
  title: string;
  summary: string;
  updatedAt: string;
  s: {
    overview: string;
    principles: string;
    rights: string;
    operations: string;
    requests: string;
  };
};

const COPY: Record<Locale, Copy> = {
  en: {
    eyebrow: "Legal / Compliance",
    title: "Compliance & Data Protection",
    summary:
      "This page now uses the same premium structure as the rest of the public site while keeping compliance information easy to review.",
    updatedAt: "Last updated: March 1, 2026",
    s: {
      overview: "1. Compliance overview",
      principles: "2. Processing principles",
      rights: "3. Data subject rights",
      operations: "4. Operational posture",
      requests: "5. Requests and escalation",
    },
  },
  fr: {
    eyebrow: "Mentions légales / Conformité",
    title: "Conformité et protection des données",
    summary:
      "Cette page adopte désormais la même structure premium que le reste du site public tout en gardant les informations de conformité faciles à consulter.",
    updatedAt: "Dernière mise à jour : 1 mars 2026",
    s: {
      overview: "1. Aperçu de la conformité",
      principles: "2. Principes de traitement",
      rights: "3. Droits des personnes concernées",
      operations: "4. Posture opérationnelle",
      requests: "5. Demandes et escalade",
    },
  },
  es: {
    eyebrow: "Legal / Cumplimiento",
    title: "Cumplimiento y protección de datos",
    summary:
      "Esta página ahora usa la misma estructura premium que el resto del sitio público sin dejar de facilitar la revisión de la información de cumplimiento.",
    updatedAt: "Última actualización: 1 de marzo de 2026",
    s: {
      overview: "1. Resumen de cumplimiento",
      principles: "2. Principios de tratamiento",
      rights: "3. Derechos de los interesados",
      operations: "4. Postura operativa",
      requests: "5. Solicitudes y escalado",
    },
  },
  zh: {
    eyebrow: "法律 / 合规",
    title: "合规与数据保护",
    summary: "本页面现已采用与公开网站其余部分一致的高端结构，同时让合规信息便于查阅。",
    updatedAt: "最后更新：2026 年 3 月 1 日",
    s: {
      overview: "1. 合规概述",
      principles: "2. 处理原则",
      rights: "3. 数据主体权利",
      operations: "4. 运营态势",
      requests: "5. 请求与升级",
    },
  },
};

export default function CompliancePage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;
  const toc = [
    { id: "overview", label: c.s.overview },
    { id: "principles", label: c.s.principles },
    { id: "rights", label: c.s.rights },
    { id: "operations", label: c.s.operations },
    { id: "requests", label: c.s.requests },
  ];

  return (
    <LegalPageShell
      eyebrow={c.eyebrow}
      title={c.title}
      summary={c.summary}
      updatedAt={c.updatedAt}
      toc={toc}
    >
      <LegalSection id="overview" title={c.s.overview}>
        <p>TaskMatch positions compliance as an operating discipline that spans platform design, data handling, access control, and review processes.</p>
        <p>The goal is not only legal coverage, but also operational clarity for clients, developers, and reviewers.</p>
        <p>
          Compliance posture is strongest when legal, technical, and operational controls are
          aligned instead of being treated as separate workstreams.
        </p>
      </LegalSection>

      <LegalSection id="principles" title={c.s.principles}>
        <p>Core principles include lawful use, purpose limitation, minimization, accuracy, storage limitation, confidentiality, and accountability.</p>
        <p>These principles should inform both product behavior and internal decision-making around data processing.</p>
        <ul className="list-disc pl-6">
          <li>Only collect what the product and legal posture require</li>
          <li>Preserve clear reasons for processing and retention</li>
          <li>Apply review discipline to high-impact workflows</li>
        </ul>
      </LegalSection>

      <LegalSection id="rights" title={c.s.rights}>
        <p>Users may be entitled to access, correction, deletion, portability, restriction, objection, or related rights depending on applicable law.</p>
        <p>Support for these rights should combine platform tooling with manual escalation paths where needed.</p>
        <p>
          The public-facing explanation should make those rights easier to understand without
          requiring a legal background.
        </p>
      </LegalSection>

      <LegalSection id="operations" title={c.s.operations}>
        <p>Compliance also depends on records of processing, internal controls, documented retention, and secure operational boundaries.</p>
        <p>For a product positioned around trust, these topics should be visible and intelligible at the public layer too.</p>
        <p>
          Reviewability, traceability, and documented control ownership are all part of the
          broader compliance posture presented by the platform.
        </p>
        <ul className="list-disc pl-6">
          <li>Role-scoped access and account boundaries</li>
          <li>Operational logs and auditable state transitions</li>
          <li>Security review and incident handling expectations</li>
          <li>Retention and rights-handling process discipline</li>
        </ul>
      </LegalSection>

      <LegalSection id="requests" title={c.s.requests}>
        <p>Compliance and privacy requests should flow through designated TaskMatch contact channels and be handled according to documented internal procedures.</p>
      </LegalSection>
    </LegalPageShell>
  );
}
