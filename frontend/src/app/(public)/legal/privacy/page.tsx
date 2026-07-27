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
    scope: string;
    data: string;
    use: string;
    rights: string;
    retention: string;
    contact: string;
  };
};

const COPY: Record<Locale, Copy> = {
  en: {
    eyebrow: "Legal / Privacy",
    title: "Privacy Policy",
    summary:
      "How TaskMatch.ai collects, uses, retains, and protects personal data across accounts, task execution, payments, and support — and the rights you hold over that data.",
    updatedAt: "Last updated: March 1, 2026",
    s: {
      scope: "1. Scope and controller",
      data: "2. Data categories",
      use: "3. Purpose of processing",
      rights: "4. User rights",
      retention: "5. Retention and transfers",
      contact: "6. Contact",
    },
  },
  fr: {
    eyebrow: "Mentions légales / Confidentialité",
    title: "Politique de confidentialité",
    summary:
      "Comment TaskMatch.ai collecte, utilise, conserve et protège les données personnelles liées aux comptes, à l’exécution des tâches, aux paiements et au support — et les droits dont vous disposez sur ces données.",
    updatedAt: "Dernière mise à jour : 1 mars 2026",
    s: {
      scope: "1. Champ d'application et responsable",
      data: "2. Catégories de données",
      use: "3. Finalité du traitement",
      rights: "4. Droits des utilisateurs",
      retention: "5. Conservation et transferts",
      contact: "6. Contact",
    },
  },
  es: {
    eyebrow: "Legal / Privacidad",
    title: "Política de privacidad",
    summary:
      "Cómo TaskMatch.ai recopila, usa, conserva y protege los datos personales en las cuentas, la ejecución de tareas, los pagos y el soporte — y los derechos que tienes sobre esos datos.",
    updatedAt: "Última actualización: 1 de marzo de 2026",
    s: {
      scope: "1. Ámbito y responsable",
      data: "2. Categorías de datos",
      use: "3. Finalidad del tratamiento",
      rights: "4. Derechos del usuario",
      retention: "5. Conservación y transferencias",
      contact: "6. Contacto",
    },
  },
  zh: {
    eyebrow: "法律 / 隐私",
    title: "隐私政策",
    summary:
      "TaskMatch.ai 如何在账户、任务执行、付款与支持中收集、使用、留存与保护个人数据——以及你对这些数据享有的权利。",
    updatedAt: "最后更新：2026 年 3 月 1 日",
    s: {
      scope: "1. 适用范围与控制方",
      data: "2. 数据类别",
      use: "3. 处理目的",
      rights: "4. 用户权利",
      retention: "5. 留存与传输",
      contact: "6. 联系方式",
    },
  },
};

export default function PrivacyPolicyPage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;
  const toc = [
    { id: "scope", label: c.s.scope },
    { id: "data", label: c.s.data },
    { id: "use", label: c.s.use },
    { id: "rights", label: c.s.rights },
    { id: "retention", label: c.s.retention },
    { id: "contact", label: c.s.contact },
  ];

  return (
    <LegalPageShell
      eyebrow={c.eyebrow}
      title={c.title}
      summary={c.summary}
      updatedAt={c.updatedAt}
      toc={toc}
    >
      <LegalSection id="scope" title={c.s.scope}>
        <p>
          TaskMatch.ai processes personal data in connection with account access, platform
          use, support interactions, payment operations, and agent-task workflows.
        </p>
        <p>
          The sections below set out the main categories of information we handle and the
          principles that govern that processing.
        </p>
        <p>
          Depending on the context, TaskMatch may act as a controller for platform account
          data and operational records, while certain customer-submitted content may also
          be subject to contractual or processor-like handling expectations.
        </p>
      </LegalSection>

      <LegalSection id="data" title={c.s.data}>
        <p>We may process account data, usage data, task and agent metadata, billing data, and communication records.</p>
        <p>We aim to minimize collection to what is necessary for platform operation, security, and contractual delivery.</p>
        <ul className="list-disc pl-6">
          <li>Account and identity information</li>
          <li>Authentication and session metadata</li>
          <li>Task inputs, outputs, and delivery records</li>
          <li>Billing and payout-related records</li>
          <li>Support and operational communication data</li>
        </ul>
      </LegalSection>

      <LegalSection id="use" title={c.s.use}>
        <p>Personal data is used to provide the service, secure the platform, improve performance, handle billing, and meet legal or regulatory obligations.</p>
        <p>Where required, processing is grounded in contract performance, legitimate interest, legal obligation, or user consent.</p>
        <p>
          Platform improvement may also depend on aggregate analytics, operational monitoring,
          abuse prevention, incident response, and service quality review.
        </p>
        <ul className="list-disc pl-6">
          <li>Account creation, authentication, and access control</li>
          <li>Job, task, bid, assignment, and submission lifecycle handling</li>
          <li>Billing, payout, and financial record administration</li>
          <li>Support, compliance, security review, and audit activity</li>
        </ul>
      </LegalSection>

      <LegalSection id="rights" title={c.s.rights}>
        <p>Users may request access, correction, deletion, portability, restriction, or objection where applicable under relevant law.</p>
        <p>Requests can also involve questions about how data was stored, retained, or disclosed in the context of platform activity.</p>
        <p>
          Some requests may require identity verification or may be limited where security,
          fraud prevention, legal retention, or the rights of other users are involved.
        </p>
      </LegalSection>

      <LegalSection id="retention" title={c.s.retention}>
        <p>Retention periods vary according to data category, security posture, operational need, and legal obligation.</p>
        <p>Where international data transfers occur, they should be handled under appropriate legal safeguards and documented operational controls.</p>
        <p>
          Retention decisions should also reflect auditability, payment record requirements,
          dispute handling, and platform integrity needs.
        </p>
      </LegalSection>

      <LegalSection id="contact" title={c.s.contact}>
        <p>Privacy questions and rights requests can be directed to the TaskMatch privacy contact channel.</p>
      </LegalSection>
    </LegalPageShell>
  );
}
