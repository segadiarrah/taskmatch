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
      "How TaskMatch approaches data protection and regulatory compliance — the principles behind our processing, the rights available to data subjects, and how requests are handled.",
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
      "L’approche de TaskMatch en matière de protection des données et de conformité réglementaire — les principes qui régissent nos traitements, les droits des personnes concernées et le traitement des demandes.",
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
      "El enfoque de TaskMatch sobre la protección de datos y el cumplimiento normativo — los principios que rigen nuestro tratamiento, los derechos de los interesados y cómo se gestionan las solicitudes.",
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
    summary: "TaskMatch 在数据保护与合规方面的方针——我们处理数据所遵循的原则、数据主体享有的权利，以及请求的处理方式。",
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
        <p>TaskMatch.ai is operated by Tauraco and positions compliance as an operating discipline that spans platform design, data handling, access control, and review processes.</p>
        <p>
          Processing of personal data is aligned with the EU General Data Protection Regulation
          (GDPR / RGPD) and comparable regimes. TaskMatch designs its controls around the
          SOC 2 Type II framework, with formal certification on our roadmap, and makes a Data
          Processing Agreement (DPA) available to enterprise customers.
        </p>
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
          Where a request cannot be fully satisfied — for example, because of legal retention
          duties or the rights of others — we explain the reason for the limitation.
        </p>
      </LegalSection>

      <LegalSection id="operations" title={c.s.operations}>
        <p>Compliance also depends on records of processing, internal controls, documented retention, and secure operational boundaries.</p>
        <p>Because trust is core to the platform, we keep these controls documented and available for review by clients and partners.</p>
        <p>
          Reviewability, traceability, and documented control ownership are all part of the
          broader compliance posture presented by the platform.
        </p>
        <ul className="list-disc pl-6">
          <li>Role-scoped access and account boundaries</li>
          <li>Operational logs and auditable state transitions</li>
          <li>Controls aligned with the SOC 2 Type II framework (certification on our roadmap)</li>
          <li>Vetted sub-processors under data-processing agreements, with data hosted in the EU</li>
          <li>Encryption of briefs and uploaded documents at rest and in transit</li>
          <li>Retention and rights-handling process discipline</li>
        </ul>
        <p>
          Sensitive material submitted in briefs is scoped to the assigned executor for the
          duration of a task, is never used to train models, and can be redacted or deleted on
          request.
        </p>
      </LegalSection>

      <LegalSection id="requests" title={c.s.requests}>
        <p>Data-subject and privacy requests (access, correction, deletion, portability, restriction, and objection under GDPR / RGPD and comparable laws) can be sent to <a href="mailto:privacy@tauraco.ai">privacy@tauraco.ai</a>. Enterprise customers can request the DPA, sub-processor list, and security questionnaire responses through the same channel.</p>
      </LegalSection>
    </LegalPageShell>
  );
}
