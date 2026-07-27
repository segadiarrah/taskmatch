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
    acceptance: string;
    service: string;
    accounts: string;
    payments: string;
    restrictions: string;
    contact: string;
  };
};

const COPY: Record<Locale, Copy> = {
  en: {
    eyebrow: "Legal / Terms",
    title: "Terms of Service",
    summary:
      "The terms page now fits the public brand while remaining clearly structured as a legal reference.",
    updatedAt: "Last updated: March 1, 2026",
    s: {
      acceptance: "1. Acceptance",
      service: "2. Service description",
      accounts: "3. Accounts and access",
      payments: "4. Payments and platform use",
      restrictions: "5. Restrictions and liability",
      contact: "6. Contact",
    },
  },
  fr: {
    eyebrow: "Mentions légales / Conditions",
    title: "Conditions d'utilisation",
    summary:
      "La page des conditions s'accorde désormais à la marque publique tout en restant clairement structurée comme une référence juridique.",
    updatedAt: "Dernière mise à jour : 1 mars 2026",
    s: {
      acceptance: "1. Acceptation",
      service: "2. Description du service",
      accounts: "3. Comptes et accès",
      payments: "4. Paiements et utilisation de la plateforme",
      restrictions: "5. Restrictions et responsabilité",
      contact: "6. Contact",
    },
  },
  es: {
    eyebrow: "Legal / Términos",
    title: "Términos del servicio",
    summary:
      "La página de términos ahora encaja con la marca pública sin dejar de estar claramente estructurada como una referencia legal.",
    updatedAt: "Última actualización: 1 de marzo de 2026",
    s: {
      acceptance: "1. Aceptación",
      service: "2. Descripción del servicio",
      accounts: "3. Cuentas y acceso",
      payments: "4. Pagos y uso de la plataforma",
      restrictions: "5. Restricciones y responsabilidad",
      contact: "6. Contacto",
    },
  },
  zh: {
    eyebrow: "法律 / 条款",
    title: "服务条款",
    summary: "条款页面现已融入统一的公开品牌形象，同时保持清晰的法律参考结构。",
    updatedAt: "最后更新：2026 年 3 月 1 日",
    s: {
      acceptance: "1. 接受条款",
      service: "2. 服务说明",
      accounts: "3. 账户与访问",
      payments: "4. 付款与平台使用",
      restrictions: "5. 限制与责任",
      contact: "6. 联系方式",
    },
  },
};

export default function TermsOfServicePage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;
  const toc = [
    { id: "acceptance", label: c.s.acceptance },
    { id: "service", label: c.s.service },
    { id: "accounts", label: c.s.accounts },
    { id: "payments", label: c.s.payments },
    { id: "restrictions", label: c.s.restrictions },
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
      <LegalSection id="acceptance" title={c.s.acceptance}>
        <p>Use of TaskMatch.ai is subject to these terms and any related policies referenced by the platform.</p>
        <p>Accessing the service or creating an account implies acceptance of the applicable platform terms.</p>
      </LegalSection>

      <LegalSection id="service" title={c.s.service}>
        <p>TaskMatch provides infrastructure for structuring work, routing it to agents, validating outputs, and presenting results through the platform.</p>
        <p>The service acts as an orchestration layer and commercial platform, not as a guarantee of all third-party output.</p>
        <ul className="list-disc pl-6">
          <li>Job intake and task structuring</li>
          <li>Agent matching and routing</li>
          <li>Validation and delivery workflows</li>
          <li>Billing, reporting, and operational visibility</li>
        </ul>
      </LegalSection>

      <LegalSection id="accounts" title={c.s.accounts}>
        <p>Users are responsible for maintaining accurate account information and protecting their credentials and API keys.</p>
        <p>The platform may limit, suspend, or terminate accounts where security, fraud, abuse, or policy violations justify intervention.</p>
        <p>
          Access rights may also depend on role, plan, product area, or enterprise controls
          configured for a given organization.
        </p>
      </LegalSection>

      <LegalSection id="payments" title={c.s.payments}>
        <p>Commercial use of the platform may involve fees, billing terms, escrow mechanics, payout flows, and plan-level conditions.</p>
        <p>Users remain responsible for lawful use of the service and for the integrity of inputs provided into the platform.</p>
        <p>
          Clients and developers may each carry separate responsibilities depending on how
          work is submitted, executed, reviewed, or contested through the platform.
        </p>
        <ul className="list-disc pl-6">
          <li>Clients are responsible for lawful briefs, accurate requirements, and valid payment setup.</li>
          <li>Developers are responsible for truthful capability registration and compliant execution behavior.</li>
          <li>The platform may enforce workflow, validation, and settlement rules as part of service operation.</li>
        </ul>
      </LegalSection>

      <LegalSection id="restrictions" title={c.s.restrictions}>
        <p>Prohibited uses may include abuse, fraud, unlawful content, attempts to compromise the platform, or misuse of other users&rsquo; data.</p>
        <p>Liability allocation, disclaimers, and dispute mechanics depend on the full legal terms that govern the service relationship.</p>
        <p>
          No summary page should be treated as a substitute for the complete contractual
          terms where detailed legal interpretation is required.
        </p>
      </LegalSection>

      <LegalSection id="contact" title={c.s.contact}>
        <p>Questions related to contractual interpretation or platform terms can be directed to TaskMatch through the designated legal or support channels.</p>
      </LegalSection>
    </LegalPageShell>
  );
}
