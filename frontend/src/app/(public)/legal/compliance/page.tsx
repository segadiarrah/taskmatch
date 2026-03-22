"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ClipboardCheck,
  Cookie,
  Database,
  Download,
  Eye,
  FileText,
  Globe,
  Mail,
  Pencil,
  Printer,
  ScrollText,
  Server,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* -------------------------------------------------------------------------- */
/*  Reusable section                                                          */
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
    <section id={id} className="scroll-mt-24 mb-16">
      <h2 className="text-2xl font-bold text-zinc-900 mb-6">{title}</h2>
      <div className="space-y-4 text-zinc-700 leading-relaxed">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Rights card                                                               */
/* -------------------------------------------------------------------------- */

function RightCard({
  icon: Icon,
  title,
  article,
  description,
}: {
  icon: React.ElementType;
  title: string;
  article: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h4 className="font-semibold text-zinc-900">{title}</h4>
        <p className="text-xs text-zinc-500 mb-1">{article}</p>
        <p className="text-sm text-zinc-600">{description}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="border-b border-zinc-200 bg-zinc-50 print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
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

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-3">
            <Shield className="h-4 w-4" />
            Legal
            <ChevronRight className="h-3 w-3" />
            Compliance
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">
            Compliance &amp; Data Protection
          </h1>
          <p className="mt-3 text-zinc-600 max-w-2xl">
            TaskMatch is committed to maintaining the highest standards of data
            protection and regulatory compliance. This page provides an overview
            of our compliance posture, our obligations as a data controller, and
            your rights as a data subject.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Last updated: March 1, 2026
          </p>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/*  GDPR Compliance Overview                                        */}
        {/* ---------------------------------------------------------------- */}
        <Section id="gdpr-overview" title="GDPR Compliance Overview">
          <p>
            The General Data Protection Regulation (EU) 2016/679
            (&quot;GDPR&quot;) is the cornerstone of our data protection
            framework. TaskMatch has been designed with data protection by
            design and by default (Article 25 GDPR) from its inception.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h4 className="font-semibold text-emerald-900">Lawful Processing</h4>
              </div>
              <p className="text-sm text-emerald-700">
                Every data processing activity has a documented legal basis
                under Article 6 GDPR. We maintain a comprehensive Record of
                Processing Activities (ROPA) per Article 30.
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                <h4 className="font-semibold text-emerald-900">DPIAs Conducted</h4>
              </div>
              <p className="text-sm text-emerald-700">
                Data Protection Impact Assessments are conducted for all
                high-risk processing activities (Article 35 GDPR), including
                our AI agent matching and automated task routing systems.
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                <h4 className="font-semibold text-emerald-900">Rights Supported</h4>
              </div>
              <p className="text-sm text-emerald-700">
                All data subject rights under Articles 15-22 GDPR are fully
                implemented, with both in-app self-service tools and manual
                request processing by our team.
              </p>
            </div>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        {/*  Data Processing Principles                                      */}
        {/* ---------------------------------------------------------------- */}
        <Section
          id="data-processing-principles"
          title="Data Processing Principles"
        >
          <p>
            In accordance with Article 5 GDPR, we adhere to the following
            fundamental principles in all our data processing activities:
          </p>

          <div className="mt-4 space-y-3">
            {[
              {
                principle: "Lawfulness, Fairness, and Transparency",
                article: "Art. 5(1)(a)",
                description:
                  "Personal data is processed lawfully, fairly, and in a transparent manner. We provide clear information about our processing activities through our Privacy Policy and this Compliance page.",
              },
              {
                principle: "Purpose Limitation",
                article: "Art. 5(1)(b)",
                description:
                  "Personal data is collected for specified, explicit, and legitimate purposes and not further processed in a manner incompatible with those purposes.",
              },
              {
                principle: "Data Minimization",
                article: "Art. 5(1)(c)",
                description:
                  "We collect only the personal data that is adequate, relevant, and limited to what is necessary for the purposes for which it is processed.",
              },
              {
                principle: "Accuracy",
                article: "Art. 5(1)(d)",
                description:
                  "We take reasonable steps to ensure that personal data is accurate and, where necessary, kept up to date. Users can update their information at any time through their account settings.",
              },
              {
                principle: "Storage Limitation",
                article: "Art. 5(1)(e)",
                description:
                  "Personal data is kept in a form which permits identification of data subjects for no longer than is necessary. We maintain documented retention schedules for all data categories.",
              },
              {
                principle: "Integrity and Confidentiality",
                article: "Art. 5(1)(f)",
                description:
                  "Personal data is processed with appropriate technical and organizational security measures, including protection against unauthorized or unlawful processing and against accidental loss, destruction, or damage.",
              },
              {
                principle: "Accountability",
                article: "Art. 5(2)",
                description:
                  "We are responsible for, and are able to demonstrate compliance with, all of the above principles through documentation, audits, and regular reviews.",
              },
            ].map((item) => (
              <div
                key={item.principle}
                className="flex items-start gap-3 rounded-lg border border-zinc-200 p-4"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold shrink-0 mt-0.5">
                  {item.article.replace("Art. 5(1)(", "").replace("Art. 5(", "").replace(")", "")}
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900">
                    {item.principle}
                    <span className="ml-2 text-xs font-normal text-zinc-500">
                      {item.article}
                    </span>
                  </h4>
                  <p className="text-sm text-zinc-600 mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        {/*  DPO Information                                                 */}
        {/* ---------------------------------------------------------------- */}
        <Section id="dpo" title="Data Protection Officer">
          <p>
            Pursuant to Articles 37-39 GDPR, TaskMatch has appointed a Data
            Protection Officer (DPO) who is responsible for overseeing our data
            protection strategy and ensuring compliance with GDPR requirements.
          </p>

          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shrink-0">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">
                  Data Protection Officer
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  [DPO Name -- To Be Appointed]
                </p>
                <div className="mt-3 space-y-1 text-sm text-zinc-700">
                  <p>
                    Email:{" "}
                    <a
                      href="mailto:dpo@taskmatch.ai"
                      className="text-zinc-900 underline"
                    >
                      dpo@taskmatch.ai
                    </a>
                  </p>
                  <p>TaskMatch SAS, [Registered Address Placeholder], Paris, France</p>
                </div>
                <p className="mt-3 text-sm text-zinc-600">
                  The DPO can be contacted on any matter relating to the
                  processing of personal data, the exercise of data subject
                  rights, or any data protection concern. The DPO reports
                  directly to the highest level of management and operates
                  independently, without receiving instructions regarding the
                  exercise of their tasks (Article 38(3) GDPR).
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        {/*  Sub-processors                                                  */}
        {/* ---------------------------------------------------------------- */}
        <Section id="sub-processors" title="Sub-Processors">
          <p>
            We use the following sub-processors to deliver our services. Each
            sub-processor has been vetted for GDPR compliance and is bound by a
            Data Processing Agreement (DPA) in accordance with Article 28 GDPR.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border border-zinc-200 rounded-lg">
              <thead>
                <tr className="bg-zinc-50">
                  <th className="text-left p-3 font-semibold border-b border-zinc-200">Sub-Processor</th>
                  <th className="text-left p-3 font-semibold border-b border-zinc-200">Purpose</th>
                  <th className="text-left p-3 font-semibold border-b border-zinc-200">Data Processed</th>
                  <th className="text-left p-3 font-semibold border-b border-zinc-200">Location</th>
                  <th className="text-left p-3 font-semibold border-b border-zinc-200">Transfer Safeguard</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-100">
                  <td className="p-3 font-medium">Amazon Web Services (AWS)</td>
                  <td className="p-3">Cloud infrastructure hosting, data storage, backups</td>
                  <td className="p-3">All platform data</td>
                  <td className="p-3">EU (eu-west-1)</td>
                  <td className="p-3">EU region; DPA</td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="p-3 font-medium">Stripe, Inc.</td>
                  <td className="p-3">Payment processing, billing, Developer payouts</td>
                  <td className="p-3">Payment data, billing address, transaction history</td>
                  <td className="p-3">US / EU</td>
                  <td className="p-3">EU-US DPF; SCCs</td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="p-3 font-medium">Resend / SendGrid</td>
                  <td className="p-3">Transactional email delivery</td>
                  <td className="p-3">Email address, name, notification content</td>
                  <td className="p-3">US</td>
                  <td className="p-3">SCCs; DPA</td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="p-3 font-medium">Plausible Analytics</td>
                  <td className="p-3">Privacy-focused website analytics</td>
                  <td className="p-3">Anonymized usage data (no personal data)</td>
                  <td className="p-3">EU</td>
                  <td className="p-3">EU region; no personal data</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Sentry</td>
                  <td className="p-3">Error monitoring and performance tracking</td>
                  <td className="p-3">Error logs, IP address (anonymized), browser info</td>
                  <td className="p-3">US / EU</td>
                  <td className="p-3">EU data residency; SCCs</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-zinc-500">
            We will notify users at least 30 days in advance of adding a new
            sub-processor. If you object to a new sub-processor, you may contact
            us to discuss alternatives or terminate your account. A full,
            up-to-date list of sub-processors is maintained and available upon
            request.
          </p>
        </Section>

        {/* ---------------------------------------------------------------- */}
        {/*  Data Processing Agreement                                       */}
        {/* ---------------------------------------------------------------- */}
        <Section id="dpa" title="Data Processing Agreement (DPA)">
          <p>
            TaskMatch provides a Data Processing Agreement (DPA) for customers
            who require one pursuant to Article 28 GDPR. The DPA governs the
            processing of personal data that TaskMatch performs on behalf of
            Clients (where the Client is a data controller and TaskMatch acts
            as a data processor).
          </p>

          <div className="mt-4 rounded-lg border border-zinc-200 p-5">
            <h4 className="font-semibold text-zinc-900 mb-3">
              Our DPA covers:
            </h4>
            <ul className="list-disc pl-6 space-y-1 text-sm text-zinc-700">
              <li>Subject matter, duration, nature, and purpose of processing</li>
              <li>Types of personal data processed and categories of data subjects</li>
              <li>Obligations and rights of the data controller</li>
              <li>Sub-processor authorization and change notification procedures</li>
              <li>Technical and organizational security measures (Annex II)</li>
              <li>Assistance with data subject rights requests</li>
              <li>Breach notification obligations (within 48 hours)</li>
              <li>Data return and deletion upon termination</li>
              <li>Audit rights</li>
              <li>Standard Contractual Clauses (SCCs) for international transfers (Annex III)</li>
            </ul>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:legal@taskmatch.ai?subject=DPA%20Request"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Request a DPA
            </a>
            <a
              href="mailto:legal@taskmatch.ai?subject=DPA%20Signed%20Copy"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download DPA Template
            </a>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        {/*  Cookie Policy                                                   */}
        {/* ---------------------------------------------------------------- */}
        <Section id="cookie-policy" title="Cookie Policy">
          <p>
            This section details our use of cookies and similar tracking
            technologies, in compliance with the ePrivacy Directive (2002/58/EC
            as amended by 2009/136/EC) and the GDPR.
          </p>

          <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-3">
            What Are Cookies?
          </h3>
          <p>
            Cookies are small text files placed on your device when you visit a
            website. They are widely used to make websites work more efficiently,
            provide a better user experience, and give website operators
            information about how their site is used.
          </p>

          <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-3">
            Cookies We Use
          </h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm border border-zinc-200 rounded-lg">
              <thead>
                <tr className="bg-zinc-50">
                  <th className="text-left p-3 font-semibold border-b border-zinc-200">Cookie Name</th>
                  <th className="text-left p-3 font-semibold border-b border-zinc-200">Type</th>
                  <th className="text-left p-3 font-semibold border-b border-zinc-200">Purpose</th>
                  <th className="text-left p-3 font-semibold border-b border-zinc-200">Duration</th>
                  <th className="text-left p-3 font-semibold border-b border-zinc-200">Required?</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-100">
                  <td className="p-3 font-mono text-xs">tm_session</td>
                  <td className="p-3">Necessary</td>
                  <td className="p-3">User authentication session</td>
                  <td className="p-3">Session</td>
                  <td className="p-3"><Badge variant="success">Required</Badge></td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="p-3 font-mono text-xs">tm_csrf</td>
                  <td className="p-3">Necessary</td>
                  <td className="p-3">Cross-site request forgery protection</td>
                  <td className="p-3">Session</td>
                  <td className="p-3"><Badge variant="success">Required</Badge></td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="p-3 font-mono text-xs">tm_consent</td>
                  <td className="p-3">Necessary</td>
                  <td className="p-3">Stores your cookie consent preferences</td>
                  <td className="p-3">1 year</td>
                  <td className="p-3"><Badge variant="success">Required</Badge></td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="p-3 font-mono text-xs">tm_theme</td>
                  <td className="p-3">Functional</td>
                  <td className="p-3">Remembers your UI theme preference</td>
                  <td className="p-3">1 year</td>
                  <td className="p-3"><Badge variant="outline">Optional</Badge></td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="p-3 font-mono text-xs">_plausible</td>
                  <td className="p-3">Analytics</td>
                  <td className="p-3">Privacy-focused page view analytics</td>
                  <td className="p-3">Session</td>
                  <td className="p-3"><Badge variant="outline">Optional</Badge></td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-xs">_tm_mkt</td>
                  <td className="p-3">Marketing</td>
                  <td className="p-3">Tracks marketing campaign effectiveness</td>
                  <td className="p-3">90 days</td>
                  <td className="p-3"><Badge variant="outline">Optional</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-3">
            Managing Your Cookies
          </h3>
          <p>
            You can manage your cookie preferences at any time through our
            cookie consent banner (which appears on your first visit) or by
            adjusting your browser settings. Please note that disabling
            necessary cookies may prevent you from using certain features of the
            platform. Most browsers allow you to: view what cookies are set and
            delete individual cookies; block third-party cookies; block all
            cookies from particular sites; block all cookies from being set; and
            delete all cookies when you close your browser.
          </p>
        </Section>

        {/* ---------------------------------------------------------------- */}
        {/*  User Rights Summary                                             */}
        {/* ---------------------------------------------------------------- */}
        <Section id="user-rights" title="Your Data Rights">
          <p>
            Under the GDPR, you have comprehensive rights over your personal
            data. Here is a summary of your rights and how TaskMatch supports
            them:
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <RightCard
              icon={Eye}
              title="Right of Access"
              article="Article 15 GDPR"
              description="Request a copy of all personal data we hold about you, including processing purposes, data categories, recipients, and retention periods."
            />
            <RightCard
              icon={Pencil}
              title="Right to Rectification"
              article="Article 16 GDPR"
              description="Correct inaccurate personal data or complete incomplete data directly through your account settings or by contacting us."
            />
            <RightCard
              icon={Trash2}
              title="Right to Erasure"
              article="Article 17 GDPR"
              description="Request deletion of your personal data when it is no longer necessary, you withdraw consent, or there is no overriding legitimate ground."
            />
            <RightCard
              icon={Download}
              title="Right to Data Portability"
              article="Article 20 GDPR"
              description="Receive your data in a structured, machine-readable format (JSON/CSV) and transmit it to another controller."
            />
            <RightCard
              icon={XCircle}
              title="Right to Object"
              article="Article 21 GDPR"
              description="Object to processing based on legitimate interests or for direct marketing purposes. Marketing objections are honored immediately."
            />
            <RightCard
              icon={Shield}
              title="Right to Restrict Processing"
              article="Article 18 GDPR"
              description="Request that we limit how we process your data while we verify accuracy, assess objections, or if processing is unlawful but you oppose erasure."
            />
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        {/*  How to Submit a Data Request                                    */}
        {/* ---------------------------------------------------------------- */}
        <Section id="data-requests" title="How to Submit a Data Request">
          <p>
            You can submit a data subject access request (DSAR) or exercise any
            of your GDPR rights through the following channels:
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex gap-4 items-start rounded-xl border border-zinc-200 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white shrink-0">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900">In-App (Recommended)</h4>
                <p className="text-sm text-zinc-600 mt-1">
                  Log into your TaskMatch account and navigate to
                  <strong> Settings &gt; Your Data Rights</strong>. You can
                  download your data, request deletion, update information, and
                  manage consent preferences directly. Requests submitted
                  in-app are automatically verified and processed fastest.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start rounded-xl border border-zinc-200 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900">Email</h4>
                <p className="text-sm text-zinc-600 mt-1">
                  Send your request to{" "}
                  <a
                    href="mailto:privacy@taskmatch.ai"
                    className="text-zinc-900 underline"
                  >
                    privacy@taskmatch.ai
                  </a>{" "}
                  with the subject line &quot;Data Rights Request&quot;. Include your
                  account email, the specific right(s) you wish to exercise, and
                  any relevant details. We may ask you to verify your identity.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start rounded-xl border border-zinc-200 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900">Contact the DPO</h4>
                <p className="text-sm text-zinc-600 mt-1">
                  For complex requests or escalations, contact our Data
                  Protection Officer directly at{" "}
                  <a
                    href="mailto:dpo@taskmatch.ai"
                    className="text-zinc-900 underline"
                  >
                    dpo@taskmatch.ai
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h4 className="font-semibold text-amber-900 mb-2">
              Processing Timeline
            </h4>
            <ul className="list-disc pl-5 text-sm text-amber-800 space-y-1">
              <li>
                <strong>Acknowledgment:</strong> Within 3 business days of
                receipt
              </li>
              <li>
                <strong>Identity verification:</strong> May be required for
                email requests (up to 5 business days)
              </li>
              <li>
                <strong>Response:</strong> Within 30 calendar days of verified
                request (extendable by 60 days for complex requests per Article
                12(3) GDPR)
              </li>
              <li>
                <strong>Cost:</strong> Free of charge (unless requests are
                manifestly unfounded or excessive)
              </li>
            </ul>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        {/*  Compliance Certifications Roadmap                               */}
        {/* ---------------------------------------------------------------- */}
        <Section id="certifications" title="Compliance Certifications Roadmap">
          <p>
            We are actively pursuing industry-recognized compliance
            certifications to provide our customers with independently verified
            assurance of our security and data protection practices.
          </p>

          <div className="mt-6 space-y-4">
            {/* GDPR */}
            <div className="flex items-start gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-emerald-900">GDPR Compliance</h4>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-sm text-emerald-700 mt-1">
                  Full compliance with the General Data Protection Regulation
                  (EU) 2016/679. Data Protection Impact Assessments conducted.
                  Record of Processing Activities maintained. DPO appointed.
                  Data subject rights fully implemented.
                </p>
              </div>
            </div>

            {/* SOC 2 */}
            <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500 text-white shrink-0">
                <ScrollText className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-amber-900">SOC 2 Type II</h4>
                  <Badge variant="warning">In Progress</Badge>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Independent audit against the AICPA Trust Services Criteria
                  (Security, Availability, Confidentiality). Readiness
                  assessment completed. Audit engagement initiated Q1 2026.
                  Expected certification: Q3 2026.
                </p>
              </div>
            </div>

            {/* ISO 27001 */}
            <div className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-400 text-white shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-zinc-900">ISO 27001:2022</h4>
                  <Badge variant="secondary">Planned - 2027</Badge>
                </div>
                <p className="text-sm text-zinc-600 mt-1">
                  Information Security Management System (ISMS) certification.
                  Gap analysis planned for Q4 2026. Implementation and
                  certification target: 2027. Scope will cover the entire
                  TaskMatch platform and supporting infrastructure.
                </p>
              </div>
            </div>

            {/* EU AI Act */}
            <div className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-400 text-white shrink-0">
                <Server className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-zinc-900">EU AI Act Readiness</h4>
                  <Badge variant="secondary">Monitoring</Badge>
                </div>
                <p className="text-sm text-zinc-600 mt-1">
                  We are actively monitoring the implementation of the EU
                  Artificial Intelligence Act (Regulation (EU) 2024/1689) and
                  preparing our compliance framework for applicable provisions.
                  As a platform facilitating AI agent deployment, we are
                  assessing our obligations under the Act&apos;s risk-based
                  framework.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* Footer links */}
        <div className="mt-8 flex flex-wrap gap-4 border-t border-zinc-200 pt-8 text-sm text-zinc-500 print:hidden">
          <Link href="/legal/privacy" className="hover:text-zinc-900 underline">Privacy Policy</Link>
          <Link href="/legal/terms" className="hover:text-zinc-900 underline">Terms of Service</Link>
          <Link href="/legal/security" className="hover:text-zinc-900 underline">Security</Link>
        </div>
      </main>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { font-size: 11pt; }
          .print\\:hidden { display: none !important; }
          a { color: inherit !important; text-decoration: underline !important; }
          h1 { font-size: 24pt; }
          h2 { font-size: 16pt; page-break-after: avoid; }
          table { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
