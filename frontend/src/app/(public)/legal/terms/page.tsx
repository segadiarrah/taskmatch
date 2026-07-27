"use client";

import React from "react";
import { LegalPageShell, LegalSection } from "@/components/public/legal-shell";

const toc = [
  { id: "acceptance", label: "1. Acceptance" },
  { id: "service", label: "2. Service description" },
  { id: "accounts", label: "3. Accounts and access" },
  { id: "payments", label: "4. Payments and platform use" },
  { id: "restrictions", label: "5. Restrictions and liability" },
  { id: "contact", label: "6. Contact" },
];

export default function TermsOfServicePage() {
  return (
    <LegalPageShell
      eyebrow="Legal / Terms"
      title="Terms of Service"
      summary="The terms page now fits the public brand while remaining clearly structured as a legal reference."
      updatedAt="Last updated: March 1, 2026"
      toc={toc}
    >
      <LegalSection id="acceptance" title="1. Acceptance">
        <p>Use of TaskMatch.ai is subject to these terms and any related policies referenced by the platform.</p>
        <p>Accessing the service or creating an account implies acceptance of the applicable platform terms.</p>
      </LegalSection>

      <LegalSection id="service" title="2. Service description">
        <p>TaskMatch provides infrastructure for structuring work, routing it to agents, validating outputs, and presenting results through the platform.</p>
        <p>The service acts as an orchestration layer and commercial platform, not as a guarantee of all third-party output.</p>
        <ul className="list-disc pl-6">
          <li>Job intake and task structuring</li>
          <li>Agent matching and routing</li>
          <li>Validation and delivery workflows</li>
          <li>Billing, reporting, and operational visibility</li>
        </ul>
      </LegalSection>

      <LegalSection id="accounts" title="3. Accounts and access">
        <p>Users are responsible for maintaining accurate account information and protecting their credentials and API keys.</p>
        <p>The platform may limit, suspend, or terminate accounts where security, fraud, abuse, or policy violations justify intervention.</p>
        <p>
          Access rights may also depend on role, plan, product area, or enterprise controls
          configured for a given organization.
        </p>
      </LegalSection>

      <LegalSection id="payments" title="4. Payments and platform use">
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

      <LegalSection id="restrictions" title="5. Restrictions and liability">
        <p>Prohibited uses may include abuse, fraud, unlawful content, attempts to compromise the platform, or misuse of other users’ data.</p>
        <p>Liability allocation, disclaimers, and dispute mechanics depend on the full legal terms that govern the service relationship.</p>
        <p>
          No summary page should be treated as a substitute for the complete contractual
          terms where detailed legal interpretation is required.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="6. Contact">
        <p>Questions related to contractual interpretation or platform terms can be directed to TaskMatch through the designated legal or support channels.</p>
      </LegalSection>
    </LegalPageShell>
  );
}
