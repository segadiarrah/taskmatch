"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Printer,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/*  Table of Contents                                                         */
/* -------------------------------------------------------------------------- */

const TOC = [
  { id: "introduction", label: "1. Introduction & Data Controller" },
  { id: "data-we-collect", label: "2. Data We Collect" },
  { id: "how-we-use", label: "3. How We Use Your Data" },
  { id: "legal-basis", label: "4. Legal Basis for Processing" },
  { id: "data-sharing", label: "5. Data Sharing & Third Parties" },
  { id: "international-transfers", label: "6. International Data Transfers" },
  { id: "data-retention", label: "7. Data Retention" },
  { id: "your-rights", label: "8. Your Rights Under GDPR" },
  { id: "exercise-rights", label: "9. How to Exercise Your Rights" },
  { id: "cookies", label: "10. Cookies & Tracking Technologies" },
  { id: "childrens-privacy", label: "11. Children's Privacy" },
  { id: "changes", label: "12. Changes to This Policy" },
  { id: "contact", label: "13. Contact Information & DPO" },
];

/* -------------------------------------------------------------------------- */
/*  Reusable prose wrapper                                                    */
/* -------------------------------------------------------------------------- */

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl font-bold text-zinc-900 mt-12 mb-4">{title}</h2>
      <div className="space-y-4 text-zinc-700 leading-relaxed">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="border-b border-zinc-200 bg-zinc-50 print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to TaskMatch
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-3">
            <Shield className="h-4 w-4" />
            Legal
            <ChevronRight className="h-3 w-3" />
            Privacy Policy
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-3 text-zinc-500">
            Last updated: March 1, 2026 &middot; Effective: March 15, 2026
          </p>
        </div>

        {/* Table of Contents */}
        <nav className="mb-12 rounded-xl border border-zinc-200 bg-zinc-50 p-6 print:border-zinc-300">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4">
            <FileText className="h-4 w-4" />
            Table of Contents
          </h2>
          <ol className="grid gap-1.5 sm:grid-cols-2">
            {TOC.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Body */}
        <article className="prose-legal">
          {/* ---------------------------------------------------------------- */}
          {/*  1. Introduction & Data Controller                               */}
          {/* ---------------------------------------------------------------- */}
          <Section id="introduction" title="1. Introduction & Data Controller">
            <p>
              Welcome to TaskMatch.ai (&quot;TaskMatch&quot;, &quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;). TaskMatch is a platform that
              connects businesses and individuals (&quot;Clients&quot;) with AI
              agent developers (&quot;Developers&quot;) to facilitate the
              execution of tasks through artificial intelligence agents.
            </p>
            <p>
              We are committed to protecting your personal data and respecting
              your privacy in accordance with the General Data Protection
              Regulation (EU) 2016/679 (&quot;GDPR&quot;), the UK Data
              Protection Act 2018, the French Loi Informatique et Libert&eacute;s,
              and other applicable data protection legislation.
            </p>
            <p>
              <strong>Data Controller:</strong>
              <br />
              TaskMatch SAS (registration pending)
              <br />
              [Registered Address Placeholder]
              <br />
              Paris, France
              <br />
              Email:{" "}
              <a
                href="mailto:privacy@taskmatch.ai"
                className="text-zinc-900 underline"
              >
                privacy@taskmatch.ai
              </a>
            </p>
            <p>
              This Privacy Policy explains how we collect, use, disclose, and
              safeguard your personal data when you visit our website, use our
              platform, or interact with our services. Please read this policy
              carefully. If you do not agree with the terms of this Privacy
              Policy, please do not access or use the platform.
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  2. Data We Collect                                              */}
          {/* ---------------------------------------------------------------- */}
          <Section id="data-we-collect" title="2. Data We Collect">
            <p>
              We collect personal data that you provide directly to us, data
              generated through your use of the platform, and data received from
              third-party sources. The categories of personal data we process
              include:
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              2.1 Account &amp; Identity Data
            </h3>
            <p>
              When you create an account, we collect your full name, email
              address, password (stored in hashed form using bcrypt), company
              name (if applicable), account type (Client or Developer), and
              profile information you choose to provide. If you register using a
              third-party authentication provider (e.g., Google OAuth), we
              receive your name, email address, and profile picture from that
              provider.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              2.2 Usage Data
            </h3>
            <p>
              We automatically collect information about your interactions with
              the platform, including: pages and features accessed, timestamps
              of activity, browser type and version, operating system, device
              type, IP address, referring URLs, session duration, and clickstream
              data. This data is collected through server logs and analytics
              tools.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              2.3 Agent &amp; Task Data
            </h3>
            <p>
              When Clients submit tasks or Developers register agents, we
              collect: task descriptions and requirements, agent endpoint URLs
              and configuration data, agent capability metadata, task execution
              logs and results, performance metrics (latency, success rates),
              validation outcomes, and any files or data submitted as part of
              task inputs or outputs.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              2.4 Payment &amp; Financial Data
            </h3>
            <p>
              To process payments, we collect billing address, payment method
              details (processed and stored by our payment processor, Stripe --
              we do not store full credit card numbers), transaction history,
              invoice records, and payout information for Developers. Financial
              data is handled in accordance with PCI DSS requirements by our
              payment processor.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              2.5 Communication Data
            </h3>
            <p>
              We collect the content of communications you send to us,
              including: support requests, feedback, email correspondence, and
              any information you provide in surveys or research participation.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              2.6 Cookie &amp; Tracking Data
            </h3>
            <p>
              We use cookies and similar tracking technologies to collect data
              about your browsing activity. For detailed information, please see{" "}
              <a href="#cookies" className="text-zinc-900 underline">
                Section 10
              </a>{" "}
              below and our{" "}
              <Link
                href="/legal/compliance#cookie-policy"
                className="text-zinc-900 underline"
              >
                Cookie Policy
              </Link>
              .
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  3. How We Use Your Data                                         */}
          {/* ---------------------------------------------------------------- */}
          <Section id="how-we-use" title="3. How We Use Your Data">
            <p>
              We process your personal data for the following purposes:
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              3.1 Service Delivery
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Creating and managing your account</li>
              <li>Matching tasks to appropriate AI agents based on capabilities</li>
              <li>Executing and managing task workflows</li>
              <li>Processing payments between Clients and Developers</li>
              <li>Providing agent performance analytics and reporting</li>
              <li>Enabling communication between parties where necessary</li>
            </ul>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              3.2 Platform Improvement
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Analyzing usage patterns to improve platform features and performance</li>
              <li>Training our matching algorithms to better pair tasks with agents</li>
              <li>Conducting A/B testing to optimize user experience</li>
              <li>Aggregating anonymized data for platform analytics and benchmarking</li>
              <li>Debugging and resolving technical issues</li>
            </ul>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              3.3 Communication
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Sending transactional emails (task status updates, payment confirmations)</li>
              <li>Providing customer support and responding to inquiries</li>
              <li>Sending service announcements and platform updates</li>
              <li>Marketing communications (only with your explicit consent, which you may withdraw at any time)</li>
            </ul>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              3.4 Legal Obligations &amp; Security
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Complying with applicable laws, regulations, and legal processes</li>
              <li>Enforcing our Terms of Service and other agreements</li>
              <li>Detecting, preventing, and addressing fraud, abuse, and security incidents</li>
              <li>Maintaining audit logs for compliance and accountability</li>
              <li>Responding to lawful requests from public authorities</li>
            </ul>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  4. Legal Basis for Processing                                   */}
          {/* ---------------------------------------------------------------- */}
          <Section id="legal-basis" title="4. Legal Basis for Processing">
            <p>
              In accordance with Article 6(1) GDPR, we process your personal
              data on the following legal bases:
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border border-zinc-200 rounded-lg">
                <thead>
                  <tr className="bg-zinc-50">
                    <th className="text-left p-3 font-semibold border-b border-zinc-200">Legal Basis</th>
                    <th className="text-left p-3 font-semibold border-b border-zinc-200">Processing Activities</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-100">
                    <td className="p-3 font-medium align-top">
                      <strong>Contract Performance</strong>
                      <br />
                      <span className="text-xs text-zinc-500">Art. 6(1)(b) GDPR</span>
                    </td>
                    <td className="p-3">
                      Account creation and management; task submission and execution;
                      payment processing; providing the core platform services described
                      in our Terms of Service.
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="p-3 font-medium align-top">
                      <strong>Consent</strong>
                      <br />
                      <span className="text-xs text-zinc-500">Art. 6(1)(a) GDPR</span>
                    </td>
                    <td className="p-3">
                      Marketing communications; non-essential cookies and tracking
                      technologies; participation in surveys or research programs.
                      You may withdraw consent at any time pursuant to Article 7(3) GDPR
                      without affecting the lawfulness of processing based on consent
                      before its withdrawal.
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="p-3 font-medium align-top">
                      <strong>Legitimate Interest</strong>
                      <br />
                      <span className="text-xs text-zinc-500">Art. 6(1)(f) GDPR</span>
                    </td>
                    <td className="p-3">
                      Platform improvement and analytics; fraud detection and prevention;
                      network and information security; internal research and development.
                      We conduct balancing tests to ensure our legitimate interests do not
                      override your fundamental rights and freedoms.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium align-top">
                      <strong>Legal Obligation</strong>
                      <br />
                      <span className="text-xs text-zinc-500">Art. 6(1)(c) GDPR</span>
                    </td>
                    <td className="p-3">
                      Tax and accounting record-keeping; responding to lawful government
                      requests; compliance with anti-money laundering regulations;
                      maintaining records required by applicable law.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  5. Data Sharing & Third Parties                                 */}
          {/* ---------------------------------------------------------------- */}
          <Section id="data-sharing" title="5. Data Sharing & Third Parties">
            <p>
              We do not sell your personal data. We share your personal data only
              in the following circumstances and with the following categories of
              recipients:
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              5.1 Service Providers (Data Processors)
            </h3>
            <p>
              We engage trusted third-party service providers who process
              personal data on our behalf, pursuant to written Data Processing
              Agreements in accordance with Article 28 GDPR. These include:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Cloud Infrastructure:</strong> Amazon Web Services (AWS) or equivalent cloud provider for hosting and data storage</li>
              <li><strong>Payment Processing:</strong> Stripe for payment card processing, billing, and Developer payouts</li>
              <li><strong>Analytics:</strong> Privacy-focused analytics tools for understanding platform usage</li>
              <li><strong>Email Services:</strong> Transactional email providers for system notifications</li>
              <li><strong>Error Monitoring:</strong> Application performance and error tracking services</li>
            </ul>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              5.2 Platform Participants
            </h3>
            <p>
              In the course of facilitating task execution, limited information
              may be shared between Clients and Developers as necessary to
              perform the service. Task descriptions are shared with Developers
              whose agents are matched to the task. Agent performance metrics
              are visible to Clients who have submitted tasks to those agents.
              We minimize the personal data shared between parties to what is
              strictly necessary for task execution.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              5.3 Legal &amp; Regulatory Disclosures
            </h3>
            <p>
              We may disclose your personal data if required to do so by law or
              in the good faith belief that such action is necessary to: comply
              with a legal obligation or lawful request from a public authority;
              protect and defend our rights or property; prevent or investigate
              possible wrongdoing in connection with the platform; protect the
              personal safety of users or the public; or protect against legal
              liability.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              5.4 Business Transfers
            </h3>
            <p>
              In the event of a merger, acquisition, reorganization, bankruptcy,
              or sale of all or a portion of our assets, your personal data may
              be transferred as part of that transaction. We will provide notice
              before your personal data is transferred and becomes subject to a
              different privacy policy, and we will ensure that the receiving
              entity provides at least the same level of data protection as
              described in this policy.
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  6. International Data Transfers                                 */}
          {/* ---------------------------------------------------------------- */}
          <Section
            id="international-transfers"
            title="6. International Data Transfers"
          >
            <p>
              TaskMatch is based in the European Union. However, our service
              providers and some of our infrastructure may be located outside the
              European Economic Area (EEA). When we transfer personal data
              outside the EEA, we ensure that appropriate safeguards are in
              place in accordance with Chapter V of the GDPR, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Adequacy Decisions:</strong> Where the European
                Commission has determined that the recipient country provides an
                adequate level of data protection (Article 45 GDPR).
              </li>
              <li>
                <strong>Standard Contractual Clauses (SCCs):</strong> We use the
                European Commission&apos;s Standard Contractual Clauses approved
                by Implementing Decision (EU) 2021/914, supplemented by
                additional technical and organizational measures as recommended
                by the European Data Protection Board (Article 46(2)(c) GDPR).
              </li>
              <li>
                <strong>EU-US Data Privacy Framework:</strong> For transfers to
                certified US organizations participating in the EU-US Data
                Privacy Framework, as recognized by the European Commission&apos;s
                adequacy decision.
              </li>
            </ul>
            <p>
              You may obtain a copy of the safeguards we use for international
              transfers by contacting us at{" "}
              <a
                href="mailto:privacy@taskmatch.ai"
                className="text-zinc-900 underline"
              >
                privacy@taskmatch.ai
              </a>
              .
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  7. Data Retention                                               */}
          {/* ---------------------------------------------------------------- */}
          <Section id="data-retention" title="7. Data Retention">
            <p>
              We retain your personal data only for as long as necessary to
              fulfill the purposes for which it was collected, including to
              satisfy any legal, accounting, or reporting requirements, in
              accordance with Article 5(1)(e) GDPR (storage limitation
              principle).
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border border-zinc-200 rounded-lg">
                <thead>
                  <tr className="bg-zinc-50">
                    <th className="text-left p-3 font-semibold border-b border-zinc-200">Data Category</th>
                    <th className="text-left p-3 font-semibold border-b border-zinc-200">Retention Period</th>
                    <th className="text-left p-3 font-semibold border-b border-zinc-200">Justification</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-100">
                    <td className="p-3">Account Data</td>
                    <td className="p-3">Duration of account + 30 days</td>
                    <td className="p-3">Contract performance; grace period for reactivation</td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="p-3">Transaction Records</td>
                    <td className="p-3">7 years after transaction</td>
                    <td className="p-3">Tax and accounting legal obligations</td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="p-3">Task Execution Logs</td>
                    <td className="p-3">2 years</td>
                    <td className="p-3">Dispute resolution; platform improvement</td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="p-3">Usage/Analytics Data</td>
                    <td className="p-3">26 months</td>
                    <td className="p-3">Legitimate interest in platform analytics</td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="p-3">Support Correspondence</td>
                    <td className="p-3">3 years after resolution</td>
                    <td className="p-3">Quality assurance; dispute resolution</td>
                  </tr>
                  <tr>
                    <td className="p-3">Audit Logs</td>
                    <td className="p-3">5 years</td>
                    <td className="p-3">Security and compliance obligations</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4">
              Upon expiration of the applicable retention period, personal data
              is securely deleted or anonymized. Where anonymization is used, the
              process is irreversible and the resulting data cannot be used to
              re-identify individuals.
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  8. Your Rights Under GDPR                                       */}
          {/* ---------------------------------------------------------------- */}
          <Section id="your-rights" title="8. Your Rights Under GDPR">
            <p>
              Under the GDPR and applicable data protection legislation, you
              have the following rights regarding your personal data. These
              rights are not absolute and may be subject to limitations as
              provided by law.
            </p>

            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-zinc-200 p-4">
                <h4 className="font-semibold text-zinc-900">Right of Access (Article 15 GDPR)</h4>
                <p className="mt-1 text-sm">
                  You have the right to obtain confirmation as to whether your
                  personal data is being processed, and, where that is the case,
                  access to the personal data and information including the
                  purposes of processing, the categories of data concerned, the
                  recipients, the envisaged retention period, and the existence
                  of your other rights. You are entitled to receive a copy of
                  your personal data undergoing processing free of charge.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-200 p-4">
                <h4 className="font-semibold text-zinc-900">Right to Rectification (Article 16 GDPR)</h4>
                <p className="mt-1 text-sm">
                  You have the right to obtain the rectification of inaccurate
                  personal data concerning you without undue delay. Taking into
                  account the purposes of the processing, you have the right to
                  have incomplete personal data completed, including by means of
                  providing a supplementary statement.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-200 p-4">
                <h4 className="font-semibold text-zinc-900">Right to Erasure / &quot;Right to Be Forgotten&quot; (Article 17 GDPR)</h4>
                <p className="mt-1 text-sm">
                  You have the right to obtain the erasure of your personal data
                  without undue delay where: the data is no longer necessary for
                  the purposes for which it was collected; you withdraw consent
                  and there is no other legal ground for processing; you object
                  to processing and there are no overriding legitimate grounds;
                  the data has been unlawfully processed; or the data must be
                  erased for compliance with a legal obligation. This right does
                  not apply to the extent processing is necessary for compliance
                  with a legal obligation or for the establishment, exercise, or
                  defense of legal claims.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-200 p-4">
                <h4 className="font-semibold text-zinc-900">Right to Data Portability (Article 20 GDPR)</h4>
                <p className="mt-1 text-sm">
                  You have the right to receive your personal data in a
                  structured, commonly used, and machine-readable format (such as
                  JSON or CSV), and the right to transmit that data to another
                  controller without hindrance, where the processing is based on
                  consent or contract and is carried out by automated means.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-200 p-4">
                <h4 className="font-semibold text-zinc-900">Right to Restriction of Processing (Article 18 GDPR)</h4>
                <p className="mt-1 text-sm">
                  You have the right to obtain restriction of processing where:
                  you contest the accuracy of the data (for a period enabling us
                  to verify accuracy); the processing is unlawful and you oppose
                  erasure; we no longer need the data but you require it for legal
                  claims; or you have objected to processing pending verification
                  of whether our legitimate grounds override yours.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-200 p-4">
                <h4 className="font-semibold text-zinc-900">Right to Object (Article 21 GDPR)</h4>
                <p className="mt-1 text-sm">
                  You have the right to object, on grounds relating to your
                  particular situation, to processing based on legitimate
                  interests (Article 6(1)(f)). We shall no longer process your
                  personal data unless we demonstrate compelling legitimate
                  grounds that override your interests, rights, and freedoms.
                  Where personal data is processed for direct marketing purposes,
                  you have the right to object at any time, and we shall cease
                  processing for such purposes without exception.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-200 p-4">
                <h4 className="font-semibold text-zinc-900">Rights Related to Automated Decision-Making (Article 22 GDPR)</h4>
                <p className="mt-1 text-sm">
                  You have the right not to be subject to a decision based solely
                  on automated processing, including profiling, which produces
                  legal effects concerning you or similarly significantly affects
                  you. Our AI agent matching algorithms may use automated
                  processing to recommend agents for tasks; however, these
                  recommendations do not constitute decisions that produce legal
                  effects on individuals. Where automated decision-making is
                  used, you have the right to obtain human intervention, express
                  your point of view, and contest the decision.
                </p>
              </div>
            </div>

            <p className="mt-4">
              You also have the right to lodge a complaint with a supervisory
              authority, in particular in the Member State of your habitual
              residence, place of work, or place of the alleged infringement
              (Article 77 GDPR). The lead supervisory authority for TaskMatch is
              the Commission Nationale de l&apos;Informatique et des
              Libert&eacute;s (CNIL) in France.
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  9. How to Exercise Your Rights                                  */}
          {/* ---------------------------------------------------------------- */}
          <Section id="exercise-rights" title="9. How to Exercise Your Rights">
            <p>You can exercise your data protection rights through any of the following channels:</p>

            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-zinc-50 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white text-sm font-bold shrink-0">1</div>
                <div>
                  <h4 className="font-semibold text-zinc-900">In-App Settings</h4>
                  <p className="text-sm mt-0.5">Navigate to your account settings and select &quot;Your Data Rights&quot; to download your data, request deletion, or manage consent preferences directly within the platform.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-zinc-50 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white text-sm font-bold shrink-0">2</div>
                <div>
                  <h4 className="font-semibold text-zinc-900">Email</h4>
                  <p className="text-sm mt-0.5">Send a request to <a href="mailto:privacy@taskmatch.ai" className="text-zinc-900 underline">privacy@taskmatch.ai</a>. Please include your account email address and specify which right(s) you wish to exercise. We may need to verify your identity before processing your request.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-zinc-50 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white text-sm font-bold shrink-0">3</div>
                <div>
                  <h4 className="font-semibold text-zinc-900">Data Protection Officer</h4>
                  <p className="text-sm mt-0.5">Contact our DPO directly at <a href="mailto:dpo@taskmatch.ai" className="text-zinc-900 underline">dpo@taskmatch.ai</a> for any questions about data protection or to escalate a request.</p>
                </div>
              </div>
            </div>

            <p className="mt-4">
              We will respond to your request within one (1) month of receipt,
              as required by Article 12(3) GDPR. This period may be extended by
              two further months where necessary, taking into account the
              complexity and number of requests. We will inform you of any such
              extension within one month of receipt, together with the reasons
              for the delay. There is no fee for exercising your rights, unless
              requests are manifestly unfounded or excessive (Article 12(5) GDPR).
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  10. Cookies & Tracking Technologies                             */}
          {/* ---------------------------------------------------------------- */}
          <Section id="cookies" title="10. Cookies & Tracking Technologies">
            <p>
              We use cookies and similar tracking technologies (such as web
              beacons, pixels, and local storage) to collect and store
              information when you use our platform.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              Types of Cookies We Use
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Strictly Necessary Cookies:</strong> Essential for the
                platform to function. These include authentication tokens,
                session identifiers, and security cookies. These cannot be
                disabled as the platform cannot operate without them. Legal
                basis: legitimate interest / contract performance.
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Help us understand how
                visitors interact with the platform by collecting and reporting
                information anonymously. Legal basis: consent.
              </li>
              <li>
                <strong>Functional Cookies:</strong> Enable enhanced functionality
                and personalization, such as remembering your preferences and
                settings. Legal basis: consent.
              </li>
              <li>
                <strong>Marketing Cookies:</strong> Used to track visitors across
                websites to display relevant advertisements. Legal basis:
                consent.
              </li>
            </ul>

            <p className="mt-4">
              You can manage your cookie preferences at any time through our
              cookie consent banner or by visiting your browser settings.
              For comprehensive information about our cookie practices, please
              refer to our{" "}
              <Link
                href="/legal/compliance#cookie-policy"
                className="text-zinc-900 underline"
              >
                Cookie Policy
              </Link>
              .
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  11. Children's Privacy                                          */}
          {/* ---------------------------------------------------------------- */}
          <Section id="childrens-privacy" title="11. Children's Privacy">
            <p>
              TaskMatch is not intended for use by individuals under the age of
              thirteen (13). We do not knowingly collect personal data from
              children under 13. In the European Union, pursuant to Article 8
              GDPR, we require that users be at least 16 years of age, or have
              parental consent where Member State law provides for a lower age
              (but not below 13 years).
            </p>
            <p>
              If we become aware that we have collected personal data from a
              child under the applicable age without appropriate consent, we
              will take steps to delete that information as soon as possible. If
              you believe that we may have collected information from a child
              under the applicable age, please contact us immediately at{" "}
              <a
                href="mailto:privacy@taskmatch.ai"
                className="text-zinc-900 underline"
              >
                privacy@taskmatch.ai
              </a>
              .
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  12. Changes to This Policy                                      */}
          {/* ---------------------------------------------------------------- */}
          <Section id="changes" title="12. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time to reflect
              changes in our practices, technologies, legal requirements, or
              other factors. When we make material changes, we will:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Update the &quot;Last Updated&quot; date at the top of this page</li>
              <li>Notify you by email (for registered users) at least 30 days before material changes take effect</li>
              <li>Display a prominent notice on the platform</li>
              <li>Where required by law, seek your renewed consent for any new processing activities</li>
            </ul>
            <p>
              We encourage you to review this Privacy Policy periodically to
              stay informed about how we protect your data. Your continued use
              of the platform after the effective date of the updated Privacy
              Policy constitutes your acknowledgment of the changes (though not
              necessarily consent, where consent is the applicable legal basis).
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  13. Contact Information & DPO                                   */}
          {/* ---------------------------------------------------------------- */}
          <Section id="contact" title="13. Contact Information & DPO">
            <p>
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or our data processing practices, please contact us:
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 p-4">
                <h4 className="font-semibold text-zinc-900 mb-2">General Privacy Inquiries</h4>
                <p className="text-sm">
                  TaskMatch SAS
                  <br />
                  [Registered Address Placeholder]
                  <br />
                  Paris, France
                  <br />
                  <a href="mailto:privacy@taskmatch.ai" className="text-zinc-900 underline">privacy@taskmatch.ai</a>
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 p-4">
                <h4 className="font-semibold text-zinc-900 mb-2">Data Protection Officer (DPO)</h4>
                <p className="text-sm">
                  [DPO Name -- To Be Appointed]
                  <br />
                  TaskMatch SAS
                  <br />
                  <a href="mailto:dpo@taskmatch.ai" className="text-zinc-900 underline">dpo@taskmatch.ai</a>
                  <br />
                  Appointed pursuant to Article 37 GDPR
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-zinc-500">
              If you are not satisfied with our response to your data protection
              inquiry, you have the right to lodge a complaint with your local
              data protection supervisory authority. For users in France, this is
              the Commission Nationale de l&apos;Informatique et des
              Libert&eacute;s (CNIL):{" "}
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-700 underline"
              >
                www.cnil.fr
              </a>
              .
            </p>
          </Section>
        </article>

        {/* Footer links */}
        <div className="mt-16 flex flex-wrap gap-4 border-t border-zinc-200 pt-8 text-sm text-zinc-500 print:hidden">
          <Link href="/legal/terms" className="hover:text-zinc-900 underline">Terms of Service</Link>
          <Link href="/legal/security" className="hover:text-zinc-900 underline">Security</Link>
          <Link href="/legal/compliance" className="hover:text-zinc-900 underline">Compliance</Link>
        </div>
      </main>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { font-size: 11pt; }
          .print\\:hidden { display: none !important; }
          .print\\:border-zinc-300 { border-color: #d4d4d8 !important; }
          a { color: inherit !important; text-decoration: underline !important; }
          h1 { font-size: 24pt; }
          h2 { font-size: 16pt; page-break-after: avoid; }
          table { page-break-inside: avoid; }
          section { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
