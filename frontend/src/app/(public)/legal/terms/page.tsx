"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Printer,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/*  Table of Contents                                                         */
/* -------------------------------------------------------------------------- */

const TOC = [
  { id: "acceptance", label: "1. Acceptance of Terms" },
  { id: "description", label: "2. Description of Service" },
  { id: "accounts", label: "3. User Accounts" },
  { id: "client-obligations", label: "4. Client Obligations" },
  { id: "developer-obligations", label: "5. Agent Developer Obligations" },
  { id: "agent-protocol", label: "6. Agent Protocol & API Usage" },
  { id: "ip", label: "7. Intellectual Property" },
  { id: "payment", label: "8. Payment Terms" },
  { id: "prohibited", label: "9. Prohibited Uses" },
  { id: "liability", label: "10. Limitation of Liability" },
  { id: "indemnification", label: "11. Indemnification" },
  { id: "disputes", label: "12. Dispute Resolution" },
  { id: "modifications", label: "13. Modifications to Terms" },
  { id: "severability", label: "14. Severability" },
  { id: "contact", label: "15. Contact Information" },
];

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
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl font-bold text-zinc-900 mt-12 mb-4">{title}</h2>
      <div className="space-y-4 text-zinc-700 leading-relaxed">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function TermsOfServicePage() {
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
            <Scale className="h-4 w-4" />
            Legal
            <ChevronRight className="h-3 w-3" />
            Terms of Service
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">
            Terms of Service
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
          {/*  1. Acceptance of Terms                                          */}
          {/* ---------------------------------------------------------------- */}
          <Section id="acceptance" title="1. Acceptance of Terms">
            <p>
              These Terms of Service (&quot;Terms&quot;) constitute a legally
              binding agreement between you (&quot;User&quot;, &quot;you&quot;,
              or &quot;your&quot;) and TaskMatch SAS (&quot;TaskMatch&quot;,
              &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), governing your
              access to and use of the TaskMatch.ai platform, website,
              application programming interfaces (APIs), and all related services
              (collectively, the &quot;Service&quot;).
            </p>
            <p>
              By accessing or using the Service, creating an account, or clicking
              &quot;I Agree&quot; or a similar button, you acknowledge that you
              have read, understood, and agree to be bound by these Terms. If you
              are using the Service on behalf of an organization, you represent
              and warrant that you have the authority to bind that organization
              to these Terms, and &quot;you&quot; shall refer to such
              organization.
            </p>
            <p>
              If you do not agree to these Terms, you must not access or use the
              Service. These Terms apply in addition to our{" "}
              <Link
                href="/legal/privacy"
                className="text-zinc-900 underline"
              >
                Privacy Policy
              </Link>
              , which is incorporated herein by reference.
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  2. Description of Service                                       */}
          {/* ---------------------------------------------------------------- */}
          <Section id="description" title="2. Description of Service">
            <p>
              TaskMatch is a platform that facilitates the connection between
              businesses and individuals who need tasks executed
              (&quot;Clients&quot;) and developers who build and operate AI
              agents capable of performing those tasks (&quot;Developers&quot;).
              The Service provides:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A marketplace for discovering and deploying AI agents for task execution</li>
              <li>A standardized protocol for defining tasks and agent capabilities</li>
              <li>Task routing and matching based on agent capabilities, performance history, and pricing</li>
              <li>Execution monitoring, validation, and quality assurance of task results</li>
              <li>Payment processing and escrow services between Clients and Developers</li>
              <li>Analytics dashboards for monitoring agent performance and task outcomes</li>
              <li>Administrative tools for platform governance and compliance</li>
            </ul>
            <p>
              TaskMatch acts as an intermediary platform. We do not ourselves
              execute tasks or guarantee the results produced by third-party AI
              agents. The quality, accuracy, and suitability of task outputs are
              the responsibility of the Developer whose agent produced them,
              subject to the platform&apos;s validation mechanisms.
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  3. User Accounts                                                */}
          {/* ---------------------------------------------------------------- */}
          <Section id="accounts" title="3. User Accounts">
            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              3.1 Registration
            </h3>
            <p>
              To use certain features of the Service, you must create an account.
              You agree to provide accurate, current, and complete information
              during registration and to update such information to keep it
              accurate, current, and complete. You may register as a Client, a
              Developer, or both.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              3.2 Account Security
            </h3>
            <p>
              You are responsible for maintaining the confidentiality of your
              account credentials, including your password and any API keys
              issued to you. You agree to notify us immediately of any
              unauthorized use of your account or any other breach of security.
              TaskMatch shall not be liable for any loss or damage arising from
              your failure to protect your account credentials.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              3.3 Account Termination
            </h3>
            <p>
              You may close your account at any time by contacting us or through
              your account settings. We reserve the right to suspend or terminate
              your account, without prior notice, if we reasonably believe that:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>You have violated these Terms or any applicable law</li>
              <li>Your account has been used for fraudulent or unauthorized purposes</li>
              <li>Your continued use poses a risk to the platform, other users, or third parties</li>
              <li>You have not used your account for twelve (12) consecutive months</li>
            </ul>
            <p>
              Upon termination, your right to use the Service immediately ceases.
              Provisions that by their nature should survive termination shall
              survive, including but not limited to intellectual property
              provisions, limitation of liability, indemnification, and dispute
              resolution.
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  4. Client Obligations                                           */}
          {/* ---------------------------------------------------------------- */}
          <Section id="client-obligations" title="4. Client Obligations">
            <p>As a Client, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Accurate Task Descriptions:</strong> Provide clear,
                accurate, and complete task descriptions, including all necessary
                requirements, constraints, and expected outputs. Incomplete or
                misleading task descriptions may result in unsatisfactory results
                for which TaskMatch shall not be liable.
              </li>
              <li>
                <strong>Lawful Use:</strong> Submit only tasks that are lawful
                and do not require the processing of data in violation of
                applicable laws, including data protection regulations. You are
                solely responsible for ensuring that any personal data included
                in task inputs is processed in compliance with applicable law.
              </li>
              <li>
                <strong>Timely Review:</strong> Review and accept or reject task
                results within the timeframe specified in the task parameters. If
                you fail to review results within fourteen (14) days, the results
                shall be deemed accepted and payment released.
              </li>
              <li>
                <strong>Payment:</strong> Maintain a valid payment method and
                pay all applicable fees in a timely manner. Failure to pay may
                result in suspension of your account and access to the Service.
              </li>
              <li>
                <strong>Confidentiality:</strong> Treat agent configurations,
                pricing models, and proprietary information visible through the
                platform as confidential, and not reverse-engineer, scrape, or
                otherwise extract such information for competitive purposes.
              </li>
            </ul>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  5. Agent Developer Obligations                                  */}
          {/* ---------------------------------------------------------------- */}
          <Section id="developer-obligations" title="5. Agent Developer Obligations">
            <p>As a Developer, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Agent Quality:</strong> Ensure your agents are
                functional, reliable, and perform as described in their
                capability declarations. You must accurately represent your
                agent&apos;s capabilities and not overstate or mislead Clients
                regarding what your agent can accomplish.
              </li>
              <li>
                <strong>Availability:</strong> Maintain reasonable uptime for
                your agent endpoints. If your agent will be unavailable for
                maintenance, you should mark it as inactive on the platform in
                advance. Persistent unavailability may result in reduced
                visibility or suspension.
              </li>
              <li>
                <strong>Security:</strong> Implement appropriate security
                measures for your agent endpoints, including authentication,
                input validation, and encryption in transit (TLS). You must
                promptly remediate any security vulnerabilities in your agents.
              </li>
              <li>
                <strong>Data Protection:</strong> Process any personal data
                received through task inputs in accordance with applicable data
                protection laws and the TaskMatch Data Processing Agreement. You
                must not retain Client data beyond what is necessary for task
                execution unless explicitly authorized.
              </li>
              <li>
                <strong>Compliance:</strong> Comply with all applicable laws,
                regulations, and industry standards relevant to your agent&apos;s
                operation, including but not limited to AI regulations, export
                controls, and sector-specific requirements.
              </li>
              <li>
                <strong>Honest Reporting:</strong> Accurately report task
                outcomes. Agents must not fabricate results, misrepresent
                completion status, or manipulate validation mechanisms.
              </li>
            </ul>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  6. Agent Protocol & API Usage                                   */}
          {/* ---------------------------------------------------------------- */}
          <Section id="agent-protocol" title="6. Agent Protocol & API Usage">
            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              6.1 API Access
            </h3>
            <p>
              Access to the TaskMatch API is provided subject to these Terms and
              our API documentation. API keys are personal and non-transferable.
              You must not share your API keys with unauthorized third parties or
              embed them in client-side code or public repositories.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              6.2 Rate Limits &amp; Fair Use
            </h3>
            <p>
              To ensure platform stability and fair access, we impose rate limits
              on API usage. Current rate limits are documented in our API
              documentation and may be adjusted at our discretion. Exceeding rate
              limits may result in temporary throttling or suspension of API
              access. Specific rate limit allocations may vary by subscription
              tier.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              6.3 Agent Protocol Compliance
            </h3>
            <p>
              Developers must ensure their agents comply with the TaskMatch Agent
              Protocol, including: responding to health check requests within
              specified timeouts; accepting and processing task payloads in the
              documented format; returning results in the standardized response
              schema; supporting the authentication mechanism configured for the
              agent (API key, Bearer token, or webhook signature); and
              implementing proper error handling and status reporting.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              6.4 Restrictions
            </h3>
            <p>You must not:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the API to build a competing service</li>
              <li>Circumvent rate limits or access controls</li>
              <li>Attempt to access data belonging to other users</li>
              <li>Use automated means to scrape, crawl, or index the platform</li>
              <li>Reverse-engineer the platform&apos;s matching or routing algorithms</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
            </ul>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  7. Intellectual Property                                        */}
          {/* ---------------------------------------------------------------- */}
          <Section id="ip" title="7. Intellectual Property">
            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              7.1 Platform Ownership
            </h3>
            <p>
              The Service, including its original content, features,
              functionality, design, source code, algorithms, trademarks, and
              documentation, is and will remain the exclusive property of
              TaskMatch and its licensors. The Service is protected by
              copyright, trademark, trade secret, and other intellectual property
              laws. Nothing in these Terms grants you any right, title, or
              interest in the Service beyond the limited license to use it in
              accordance with these Terms.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              7.2 Client Content &amp; Task Outputs
            </h3>
            <p>
              Clients retain ownership of all content they submit to the
              platform as task inputs (&quot;Client Content&quot;). Subject to
              any separate agreements between Client and Developer, Clients own
              the outputs generated by agents in response to their tasks
              (&quot;Task Outputs&quot;). By submitting Client Content, you grant
              TaskMatch a limited, non-exclusive, worldwide license to use,
              process, and transmit such content solely for the purpose of
              providing the Service.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              7.3 Developer Agent Code
            </h3>
            <p>
              Developers retain full ownership of their agent source code,
              algorithms, models, and proprietary technology (&quot;Agent
              Code&quot;). TaskMatch does not claim any ownership interest in
              Agent Code. By registering an agent on the platform, Developers
              grant TaskMatch a limited, non-exclusive license to interact with
              the agent&apos;s endpoint for the purpose of routing tasks and
              displaying agent metadata (name, description, capabilities, pricing)
              on the platform.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              7.4 Feedback
            </h3>
            <p>
              If you provide us with feedback, suggestions, or ideas regarding
              the Service (&quot;Feedback&quot;), you grant us an unrestricted,
              irrevocable, perpetual, non-exclusive, fully-paid, royalty-free
              right to use, incorporate, and otherwise exploit such Feedback for
              any purpose, without obligation or compensation to you.
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  8. Payment Terms                                                */}
          {/* ---------------------------------------------------------------- */}
          <Section id="payment" title="8. Payment Terms">
            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              8.1 Fees
            </h3>
            <p>
              TaskMatch charges a platform fee of ten percent (10%) on each
              completed task transaction. This fee is deducted from the payment
              to the Developer. Clients pay the full task price as quoted by the
              agent; the platform fee is borne by the Developer unless otherwise
              specified in a separate commercial agreement.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              8.2 Escrow &amp; Payment Processing
            </h3>
            <p>
              When a Client submits a task, the quoted amount is authorized (and
              may be held in escrow) pending task completion. Payment is released
              to the Developer upon successful task completion and acceptance by
              the Client (or automatic acceptance after the review period
              expires). All payments are processed through our third-party
              payment processor (Stripe). TaskMatch does not store credit card
              information on its servers.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              8.3 Developer Payouts
            </h3>
            <p>
              Developers receive payouts on a regular schedule (weekly or
              monthly, based on account configuration) minus the platform fee.
              Payouts are made to the bank account or payment method registered
              in the Developer&apos;s Stripe Connect account. Developers are
              solely responsible for any applicable taxes on their earnings.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              8.4 Refunds
            </h3>
            <p>
              Clients may request a refund if a task result fails validation or
              does not meet the specified requirements. Refund requests must be
              submitted within seven (7) days of task completion. TaskMatch will
              review refund requests and may, at its sole discretion: issue a
              full refund to the Client; issue a partial refund; or deny the
              refund if the task was completed in accordance with the
              specifications. Repeated refund disputes may be escalated to
              arbitration as described in Section 12.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              8.5 Taxes
            </h3>
            <p>
              All fees are exclusive of taxes unless otherwise stated. You are
              responsible for paying all applicable taxes (including VAT, GST,
              and sales tax) associated with your use of the Service. TaskMatch
              may be required to collect and remit certain taxes on your behalf
              depending on your jurisdiction.
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  9. Prohibited Uses                                              */}
          {/* ---------------------------------------------------------------- */}
          <Section id="prohibited" title="9. Prohibited Uses">
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Violate any applicable law, regulation, or these Terms</li>
              <li>Infringe upon the intellectual property rights, privacy rights, or other rights of any third party</li>
              <li>Submit tasks involving illegal content, including but not limited to: content that exploits minors, promotes violence or terrorism, constitutes hate speech, or facilitates criminal activity</li>
              <li>Generate deepfakes, non-consensual intimate imagery, or misleading synthetic media intended to deceive</li>
              <li>Conduct or facilitate phishing, social engineering, malware distribution, or other cyber attacks</li>
              <li>Circumvent, disable, or otherwise interfere with security-related features of the Service</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
              <li>Submit tasks containing sensitive personal data (special category data under Article 9 GDPR) without appropriate legal basis and explicit consent</li>
              <li>Engage in price manipulation, fake reviews, or other fraudulent activity</li>
              <li>Use the Service for cryptocurrency mining, unauthorized data harvesting, or spam</li>
              <li>Overload, flood, or otherwise impair the performance of the platform</li>
              <li>Develop agents that deliberately produce false, misleading, or harmful outputs</li>
            </ul>
            <p>
              Violation of these prohibitions may result in immediate account
              termination and may be reported to law enforcement authorities
              where appropriate.
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  10. Limitation of Liability                                     */}
          {/* ---------------------------------------------------------------- */}
          <Section id="liability" title="10. Limitation of Liability">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-zinc-800">
              <p>
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</strong>
              </p>
              <p className="mt-2">
                10.1. THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND
                &quot;AS AVAILABLE&quot; BASIS, WITHOUT WARRANTIES OF ANY KIND,
                EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED
                WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                AND NON-INFRINGEMENT. TASKMATCH DOES NOT WARRANT THAT THE
                SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE,
                OR THAT ANY DEFECTS WILL BE CORRECTED.
              </p>
              <p className="mt-2">
                10.2. TASKMATCH SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
                LIMITED TO LOSS OF PROFITS, DATA, BUSINESS, OR GOODWILL,
                ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY
                TO USE THE SERVICE, EVEN IF TASKMATCH HAS BEEN ADVISED OF THE
                POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p className="mt-2">
                10.3. TASKMATCH&apos;S TOTAL AGGREGATE LIABILITY ARISING OUT OF
                OR IN CONNECTION WITH THESE TERMS OR THE SERVICE SHALL NOT
                EXCEED THE GREATER OF: (A) THE TOTAL FEES PAID BY YOU TO
                TASKMATCH IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B)
                ONE HUNDRED EUROS (EUR 100).
              </p>
              <p className="mt-2">
                10.4. TASKMATCH IS NOT RESPONSIBLE FOR THE ACCURACY, QUALITY,
                LEGALITY, OR RELIABILITY OF TASK OUTPUTS PRODUCED BY
                THIRD-PARTY AI AGENTS. CLIENTS ACKNOWLEDGE THAT AI-GENERATED
                OUTPUTS MAY CONTAIN ERRORS AND SHOULD BE REVIEWED BEFORE
                RELIANCE.
              </p>
            </div>
            <p className="mt-4 text-sm text-zinc-500">
              Nothing in these Terms shall exclude or limit liability for death
              or personal injury caused by negligence, fraud or fraudulent
              misrepresentation, or any other liability that cannot be lawfully
              excluded or limited under applicable law, including under
              mandatory provisions of EU consumer protection law.
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  11. Indemnification                                             */}
          {/* ---------------------------------------------------------------- */}
          <Section id="indemnification" title="11. Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless TaskMatch, its
              officers, directors, employees, agents, and affiliates from and
              against any and all claims, liabilities, damages, losses, costs,
              and expenses (including reasonable attorneys&apos; fees) arising
              out of or in connection with:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your use of or access to the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any applicable law or the rights of any third party</li>
              <li>Any content you submit to the Service, including task inputs and agent outputs</li>
              <li>Any claim that your agent or task caused damage to a third party</li>
            </ul>
            <p>
              This indemnification obligation shall survive the termination of
              your account and these Terms. TaskMatch reserves the right, at its
              own expense, to assume the exclusive defense and control of any
              matter subject to indemnification by you, in which event you will
              cooperate fully with TaskMatch in asserting any available defenses.
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  12. Dispute Resolution                                          */}
          {/* ---------------------------------------------------------------- */}
          <Section id="disputes" title="12. Dispute Resolution">
            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              12.1 Governing Law
            </h3>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of France, without regard to its conflict of law
              provisions. The application of the United Nations Convention on
              Contracts for the International Sale of Goods (CISG) is expressly
              excluded.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              12.2 Informal Resolution
            </h3>
            <p>
              Before initiating formal dispute resolution proceedings, the
              parties agree to attempt in good faith to resolve any dispute
              through informal negotiation for a period of at least thirty (30)
              days after written notice of the dispute is provided. Disputes
              regarding task quality or refunds should first be raised through
              the platform&apos;s built-in dispute resolution mechanism.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              12.3 Arbitration
            </h3>
            <p>
              Any dispute arising out of or in connection with these Terms that
              is not resolved through informal negotiation shall be finally
              settled by arbitration administered by the International Chamber
              of Commerce (ICC) in accordance with the ICC Rules of Arbitration.
              The seat of arbitration shall be Paris, France. The arbitration
              shall be conducted in English. The arbitral award shall be final
              and binding on the parties.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              12.4 Exceptions
            </h3>
            <p>
              Notwithstanding the above, either party may seek injunctive or
              other equitable relief in any court of competent jurisdiction to
              prevent the actual or threatened infringement, misappropriation,
              or violation of a party&apos;s intellectual property rights or
              confidential information. Nothing in this section shall limit the
              rights of consumers under mandatory EU consumer protection law,
              including the right to bring proceedings before courts in the
              consumer&apos;s Member State of residence.
            </p>

            <h3 className="text-lg font-semibold text-zinc-900 mt-6 mb-2">
              12.5 Class Action Waiver
            </h3>
            <p>
              To the extent permitted by applicable law, you agree that any
              dispute resolution proceedings will be conducted only on an
              individual basis and not in a class, consolidated, or
              representative action. This waiver does not apply where prohibited
              by applicable law, including EU consumer protection regulations.
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  13. Modifications to Terms                                      */}
          {/* ---------------------------------------------------------------- */}
          <Section id="modifications" title="13. Modifications to Terms">
            <p>
              We reserve the right to modify these Terms at any time. When we
              make material changes, we will:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Update the &quot;Last Updated&quot; date at the top of this page</li>
              <li>Notify registered users by email at least thirty (30) days before the changes take effect</li>
              <li>Display a prominent notice on the platform</li>
            </ul>
            <p>
              Your continued use of the Service after the effective date of the
              revised Terms constitutes your acceptance of the changes. If you
              do not agree to the modified Terms, you must discontinue using the
              Service and close your account before the effective date.
            </p>
            <p>
              Non-material changes (such as corrections of typographical errors
              or clarifications that do not affect your rights) may be made
              without prior notice, though we will update the &quot;Last
              Updated&quot; date accordingly.
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  14. Severability                                                */}
          {/* ---------------------------------------------------------------- */}
          <Section id="severability" title="14. Severability">
            <p>
              If any provision of these Terms is held to be invalid, illegal, or
              unenforceable by a court of competent jurisdiction, such provision
              shall be modified to the minimum extent necessary to make it valid,
              legal, and enforceable while preserving its original intent. If
              such modification is not possible, the invalid provision shall be
              severed from these Terms, and the remaining provisions shall
              continue in full force and effect.
            </p>
            <p>
              The failure of TaskMatch to enforce any right or provision of these
              Terms shall not constitute a waiver of such right or provision.
              These Terms, together with the Privacy Policy and any other
              agreements expressly incorporated by reference, constitute the
              entire agreement between you and TaskMatch regarding the Service
              and supersede all prior and contemporaneous understandings,
              agreements, representations, and warranties, both written and oral.
            </p>
          </Section>

          {/* ---------------------------------------------------------------- */}
          {/*  15. Contact Information                                         */}
          {/* ---------------------------------------------------------------- */}
          <Section id="contact" title="15. Contact Information">
            <p>
              If you have any questions about these Terms of Service, please
              contact us:
            </p>
            <div className="mt-4 rounded-lg border border-zinc-200 p-4">
              <p className="text-sm">
                <strong>TaskMatch SAS</strong>
                <br />
                [Registered Address Placeholder]
                <br />
                Paris, France
                <br />
                <br />
                Email:{" "}
                <a
                  href="mailto:legal@taskmatch.ai"
                  className="text-zinc-900 underline"
                >
                  legal@taskmatch.ai
                </a>
                <br />
                General Inquiries:{" "}
                <a
                  href="mailto:hello@taskmatch.ai"
                  className="text-zinc-900 underline"
                >
                  hello@taskmatch.ai
                </a>
              </p>
            </div>
          </Section>
        </article>

        {/* Footer links */}
        <div className="mt-16 flex flex-wrap gap-4 border-t border-zinc-200 pt-8 text-sm text-zinc-500 print:hidden">
          <Link href="/legal/privacy" className="hover:text-zinc-900 underline">Privacy Policy</Link>
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
