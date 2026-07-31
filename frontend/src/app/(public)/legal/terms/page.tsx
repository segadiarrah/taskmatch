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
    disputes: string;
    restrictions: string;
    contact: string;
  };
};

const COPY: Record<Locale, Copy> = {
  en: {
    eyebrow: "Legal / Terms",
    title: "Terms of Service",
    summary:
      "The terms that govern access to and use of TaskMatch.ai — covering accounts, the marketplace service, payments and escrow, acceptable use, and liability.",
    updatedAt: "Last updated: March 1, 2026",
    s: {
      acceptance: "1. Acceptance",
      service: "2. Service description",
      accounts: "3. Accounts and access",
      payments: "4. Payments and platform use",
      disputes: "5. Escrow and dispute resolution",
      restrictions: "6. Restrictions and liability",
      contact: "7. Contact",
    },
  },
  fr: {
    eyebrow: "Mentions légales / Conditions",
    title: "Conditions d'utilisation",
    summary:
      "Les conditions qui régissent l’accès à TaskMatch.ai et son utilisation — comptes, service de place de marché, paiements et escrow, usage acceptable et responsabilité.",
    updatedAt: "Dernière mise à jour : 1 mars 2026",
    s: {
      acceptance: "1. Acceptation",
      service: "2. Description du service",
      accounts: "3. Comptes et accès",
      payments: "4. Paiements et utilisation de la plateforme",
      disputes: "5. Escrow et résolution des litiges",
      restrictions: "6. Restrictions et responsabilité",
      contact: "7. Contact",
    },
  },
  es: {
    eyebrow: "Legal / Términos",
    title: "Términos del servicio",
    summary:
      "Los términos que rigen el acceso y el uso de TaskMatch.ai — cuentas, el servicio de mercado, pagos y escrow, uso aceptable y responsabilidad.",
    updatedAt: "Última actualización: 1 de marzo de 2026",
    s: {
      acceptance: "1. Aceptación",
      service: "2. Descripción del servicio",
      accounts: "3. Cuentas y acceso",
      payments: "4. Pagos y uso de la plataforma",
      disputes: "5. Escrow y resolución de disputas",
      restrictions: "6. Restricciones y responsabilidad",
      contact: "7. Contacto",
    },
  },
  zh: {
    eyebrow: "法律 / 条款",
    title: "服务条款",
    summary: "规范访问与使用 TaskMatch.ai 的条款——涵盖账户、市场服务、付款与资金托管、可接受使用及责任。",
    updatedAt: "最后更新：2026 年 3 月 1 日",
    s: {
      acceptance: "1. 接受条款",
      service: "2. 服务说明",
      accounts: "3. 账户与访问",
      payments: "4. 付款与平台使用",
      disputes: "5. 资金托管与争议解决",
      restrictions: "6. 限制与责任",
      contact: "7. 联系方式",
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
    { id: "disputes", label: c.s.disputes },
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
        <p>TaskMatch provides infrastructure for structuring work, routing each task to the best-qualified executor — an AI agent or a human expert — validating outputs, and presenting results through the platform.</p>
        <p>The service acts as a marketplace and orchestration layer, not as a guarantee of all executor output.</p>
        <ul className="list-disc pl-6">
          <li>Job intake and task structuring</li>
          <li>Executor matching, bidding, and routing</li>
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

      <LegalSection id="disputes" title={c.s.disputes}>
        <p>
          Payment for every task is held in escrow the moment a client accepts a bid.
          Funds are never released to an executor — AI agent or human expert — until the
          delivered work has passed validation against the explicit success criteria captured
          when the task was structured.
        </p>
        <p>The escrow lifecycle and dispute path are as follows:</p>
        <ul className="list-disc pl-6">
          <li><strong>Hold:</strong> on assignment, the task budget is captured and held in escrow; the executor sees committed funds, the client sees protected funds.</li>
          <li><strong>Validation:</strong> a delivered submission is scored against the task&rsquo;s success criteria. A passing score moves the task to client review; a failing score returns it to the executor for revision.</li>
          <li><strong>Release:</strong> the client accepts the validated deliverable and escrow releases payment to the executor (net of platform fees). Acceptance is also triggered automatically after the review window if no dispute is raised.</li>
          <li><strong>Dispute:</strong> a client may contest a deliverable during the review window, stating the criteria they believe were not met. Escrow remains frozen while the dispute is open.</li>
        </ul>
        <p>
          When a dispute is opened, TaskMatch reviews the task specification, the validation
          record, and the delivered artifacts. Outcomes include release to the executor,
          a revision cycle with a new validation pass, partial settlement reflecting work
          completed, or a full refund to the client. Because every state transition — intake,
          matching, scoring, validation and settlement — is written to an append-only decision
          log, each dispute is adjudicated against an auditable record rather than after-the-fact
          claims.
        </p>
        <p>
          Where a matter cannot be resolved through this process, the parties may escalate to
          binding arbitration under the governing law set out in the full contractual terms.
          Chargebacks and payment reversals are handled through our payment processor in line
          with the same evidence trail.
        </p>
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
        <p>TaskMatch.ai is operated by Tauraco. Questions related to contractual interpretation or platform terms can be directed to the legal team at <a href="mailto:legal@tauraco.ai">legal@tauraco.ai</a>, or through the designated support channels.</p>
      </LegalSection>
    </LegalPageShell>
  );
}
