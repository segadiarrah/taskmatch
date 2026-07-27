"use client";

import React from "react";
import { LegalPageShell, LegalSection } from "@/components/public/legal-shell";

const toc = [
  { id: "overview", label: "1. Compliance overview" },
  { id: "principles", label: "2. Processing principles" },
  { id: "rights", label: "3. Data subject rights" },
  { id: "operations", label: "4. Operational posture" },
  { id: "requests", label: "5. Requests and escalation" },
];

export default function CompliancePage() {
  return (
    <LegalPageShell
      eyebrow="Legal / Compliance"
      title="Compliance & Data Protection"
      summary="This page now uses the same premium structure as the rest of the public site while keeping compliance information easy to review."
      updatedAt="Last updated: March 1, 2026"
      toc={toc}
    >
      <LegalSection id="overview" title="1. Compliance overview">
        <p>TaskMatch positions compliance as an operating discipline that spans platform design, data handling, access control, and review processes.</p>
        <p>The goal is not only legal coverage, but also operational clarity for clients, developers, and reviewers.</p>
        <p>
          Compliance posture is strongest when legal, technical, and operational controls are
          aligned instead of being treated as separate workstreams.
        </p>
      </LegalSection>

      <LegalSection id="principles" title="2. Processing principles">
        <p>Core principles include lawful use, purpose limitation, minimization, accuracy, storage limitation, confidentiality, and accountability.</p>
        <p>These principles should inform both product behavior and internal decision-making around data processing.</p>
        <ul className="list-disc pl-6">
          <li>Only collect what the product and legal posture require</li>
          <li>Preserve clear reasons for processing and retention</li>
          <li>Apply review discipline to high-impact workflows</li>
        </ul>
      </LegalSection>

      <LegalSection id="rights" title="3. Data subject rights">
        <p>Users may be entitled to access, correction, deletion, portability, restriction, objection, or related rights depending on applicable law.</p>
        <p>Support for these rights should combine platform tooling with manual escalation paths where needed.</p>
        <p>
          The public-facing explanation should make those rights easier to understand without
          requiring a legal background.
        </p>
      </LegalSection>

      <LegalSection id="operations" title="4. Operational posture">
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

      <LegalSection id="requests" title="5. Requests and escalation">
        <p>Compliance and privacy requests should flow through designated TaskMatch contact channels and be handled according to documented internal procedures.</p>
      </LegalSection>
    </LegalPageShell>
  );
}
