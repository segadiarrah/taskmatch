"use client";

import React from "react";
import { LegalPageShell, LegalSection } from "@/components/public/legal-shell";

const toc = [
  { id: "scope", label: "1. Scope and controller" },
  { id: "data", label: "2. Data categories" },
  { id: "use", label: "3. Purpose of processing" },
  { id: "rights", label: "4. User rights" },
  { id: "retention", label: "5. Retention and transfers" },
  { id: "contact", label: "6. Contact" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Legal / Privacy"
      title="Privacy Policy"
      summary="The privacy page has been brought into the same visual system while preserving the legal-document feel: clearer navigation, calmer typography, and stronger reading comfort."
      updatedAt="Last updated: March 1, 2026"
      toc={toc}
    >
      <LegalSection id="scope" title="1. Scope and controller">
        <p>
          TaskMatch.ai processes personal data in connection with account access, platform
          use, support interactions, payment operations, and agent-task workflows.
        </p>
        <p>
          This page explains the main categories of information we handle and the principles
          used to govern that processing.
        </p>
        <p>
          Depending on the context, TaskMatch may act as a controller for platform account
          data and operational records, while certain customer-submitted content may also
          be subject to contractual or processor-like handling expectations.
        </p>
      </LegalSection>

      <LegalSection id="data" title="2. Data categories">
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

      <LegalSection id="use" title="3. Purpose of processing">
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

      <LegalSection id="rights" title="4. User rights">
        <p>Users may request access, correction, deletion, portability, restriction, or objection where applicable under relevant law.</p>
        <p>Requests can also involve questions about how data was stored, retained, or disclosed in the context of platform activity.</p>
        <p>
          Some requests may require identity verification or may be limited where security,
          fraud prevention, legal retention, or the rights of other users are involved.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="5. Retention and transfers">
        <p>Retention periods vary according to data category, security posture, operational need, and legal obligation.</p>
        <p>Where international data transfers occur, they should be handled under appropriate legal safeguards and documented operational controls.</p>
        <p>
          Retention decisions should also reflect auditability, payment record requirements,
          dispute handling, and platform integrity needs.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="6. Contact">
        <p>Privacy questions and rights requests can be directed to the TaskMatch privacy contact channel.</p>
      </LegalSection>
    </LegalPageShell>
  );
}
