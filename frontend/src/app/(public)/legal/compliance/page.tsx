"use client";

import { securityCopy } from "@/content/security";
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
  pt: {
    eyebrow: "Legal / Conformidade",
    title: "Conformidade e proteção de dados",
    summary: "A abordagem do TaskMatch à proteção de dados e à conformidade regulamentar — os princípios do tratamento, os direitos dos titulares dos dados e o modo como os pedidos são tratados.",
    updatedAt: "Última atualização: 1 de março de 2026",
    s: {
      overview: "1. Visão geral da conformidade",
      principles: "2. Princípios do tratamento",
      rights: "3. Direitos dos titulares dos dados",
      operations: "4. Práticas operacionais",
      requests: "5. Pedidos e encaminhamento"
    }
  },
};

export default function CompliancePage() {
  const { locale } = useTranslation();
  const c = COPY[locale];
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
      {toc.map((section, index) => <LegalSection key={section.id} id={section.id} title={section.label}>
        <p>{securityCopy[locale].compliance[index]}</p>
        {section.id === "requests" && <a href="mailto:privacy@tauraco.ai" className="text-signal-600 underline">privacy@tauraco.ai</a>}
      </LegalSection>)}
    </LegalPageShell>
  );
}
