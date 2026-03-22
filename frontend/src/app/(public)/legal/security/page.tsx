"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bug,
  ChevronRight,
  Clock,
  Database,
  FileText,
  Key,
  Lock,
  MonitorCheck,
  Network,
  Printer,
  Server,
  Shield,
  ShieldCheck,
  Siren,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* -------------------------------------------------------------------------- */
/*  Security Feature Card                                                     */
/* -------------------------------------------------------------------------- */

function SecurityCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      </div>
      <div className="text-sm text-zinc-700 leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function SecurityPage() {
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
            Security
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">
            Security Practices
          </h1>
          <p className="mt-3 text-zinc-600 max-w-2xl">
            At TaskMatch, security is foundational to everything we build.
            This page describes the technical and organizational measures we
            employ to protect your data and ensure the integrity of our
            platform.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Last updated: March 1, 2026
          </p>
        </div>

        {/* Security Architecture Diagram */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">
            Security Architecture Overview
          </h2>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 overflow-x-auto print:bg-white">
            <div className="min-w-[640px]">
              {/* Top layer: Client */}
              <div className="flex justify-center mb-4">
                <div className="rounded-lg border-2 border-blue-300 bg-blue-50 px-6 py-3 text-center">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Client Layer</p>
                  <p className="text-sm text-zinc-700 mt-1">Browser / Mobile App</p>
                  <p className="text-xs text-zinc-500">TLS 1.3 &middot; CSP Headers &middot; HSTS</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center mb-4">
                <div className="flex flex-col items-center">
                  <div className="h-6 w-px bg-zinc-300" />
                  <div className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">HTTPS / WSS</div>
                  <div className="h-6 w-px bg-zinc-300" />
                </div>
              </div>

              {/* API Gateway layer */}
              <div className="flex justify-center mb-4">
                <div className="rounded-lg border-2 border-amber-300 bg-amber-50 px-6 py-3 text-center">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">API Gateway</p>
                  <p className="text-sm text-zinc-700 mt-1">Rate Limiting &middot; WAF &middot; Request Validation</p>
                  <p className="text-xs text-zinc-500">JWT Verification &middot; CORS &middot; IP Allow-listing</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center mb-4">
                <div className="flex flex-col items-center">
                  <div className="h-6 w-px bg-zinc-300" />
                  <div className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Internal TLS</div>
                  <div className="h-6 w-px bg-zinc-300" />
                </div>
              </div>

              {/* Application layer */}
              <div className="flex justify-center gap-4 mb-4 flex-wrap">
                <div className="rounded-lg border-2 border-purple-300 bg-purple-50 px-4 py-3 text-center flex-1 min-w-[150px] max-w-[200px]">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Auth Service</p>
                  <p className="text-xs text-zinc-500 mt-1">JWT &middot; bcrypt &middot; RBAC</p>
                </div>
                <div className="rounded-lg border-2 border-purple-300 bg-purple-50 px-4 py-3 text-center flex-1 min-w-[150px] max-w-[200px]">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Task Engine</p>
                  <p className="text-xs text-zinc-500 mt-1">Matching &middot; Routing &middot; Validation</p>
                </div>
                <div className="rounded-lg border-2 border-purple-300 bg-purple-50 px-4 py-3 text-center flex-1 min-w-[150px] max-w-[200px]">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Agent Gateway</p>
                  <p className="text-xs text-zinc-500 mt-1">Webhook Signing &middot; Timeout &middot; Retry</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center mb-4">
                <div className="flex flex-col items-center">
                  <div className="h-6 w-px bg-zinc-300" />
                  <div className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Encrypted Connections</div>
                  <div className="h-6 w-px bg-zinc-300" />
                </div>
              </div>

              {/* Data layer */}
              <div className="flex justify-center gap-4 mb-4 flex-wrap">
                <div className="rounded-lg border-2 border-zinc-300 bg-zinc-100 px-4 py-3 text-center flex-1 min-w-[130px] max-w-[180px]">
                  <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">PostgreSQL</p>
                  <p className="text-xs text-zinc-500 mt-1">AES-256 at rest</p>
                </div>
                <div className="rounded-lg border-2 border-zinc-300 bg-zinc-100 px-4 py-3 text-center flex-1 min-w-[130px] max-w-[180px]">
                  <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Redis</p>
                  <p className="text-xs text-zinc-500 mt-1">Session &middot; Cache</p>
                </div>
                <div className="rounded-lg border-2 border-zinc-300 bg-zinc-100 px-4 py-3 text-center flex-1 min-w-[130px] max-w-[180px]">
                  <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Object Storage</p>
                  <p className="text-xs text-zinc-500 mt-1">S3 &middot; SSE-S3</p>
                </div>
                <div className="rounded-lg border-2 border-zinc-300 bg-zinc-100 px-4 py-3 text-center flex-1 min-w-[130px] max-w-[180px]">
                  <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Audit Log</p>
                  <p className="text-xs text-zinc-500 mt-1">Append-only &middot; Immutable</p>
                </div>
              </div>

              {/* Bottom: Agent endpoints */}
              <div className="flex justify-center mt-6">
                <div className="rounded-lg border-2 border-dashed border-zinc-300 bg-white px-6 py-3 text-center">
                  <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">External Agent Endpoints</p>
                  <p className="text-xs text-zinc-500 mt-1">Auth Verification &middot; HMAC Webhooks &middot; TLS Required &middot; Docker Sandboxed Execution</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security practices grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Infrastructure Security */}
          <SecurityCard icon={Server} title="Infrastructure Security">
            <p>
              TaskMatch runs on hardened cloud infrastructure with multiple
              layers of defense:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Docker isolation:</strong> All agent execution
                environments are containerized using Docker with restricted
                capabilities, read-only file systems (where applicable), and
                resource limits (CPU, memory, network).
              </li>
              <li>
                <strong>Network segmentation:</strong> Production, staging, and
                development environments are strictly separated. Database servers
                are not accessible from the public internet.
              </li>
              <li>
                <strong>Encrypted connections:</strong> All internal
                service-to-service communication uses mutual TLS (mTLS).
                External traffic is encrypted with TLS 1.3.
              </li>
              <li>
                <strong>Infrastructure as Code:</strong> All infrastructure is
                defined in version-controlled templates, ensuring reproducibility
                and audit trails for any changes.
              </li>
              <li>
                <strong>Automated patching:</strong> Security patches are applied
                to all systems within 72 hours of critical CVE publication. OS
                images are rebuilt weekly.
              </li>
            </ul>
          </SecurityCard>

          {/* Data Encryption */}
          <SecurityCard icon={Lock} title="Data Encryption">
            <p>
              We employ encryption at every layer to protect data
              confidentiality:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>In transit:</strong> All data transmitted between clients
                and our servers is encrypted using TLS 1.3 with strong cipher
                suites. We enforce HSTS (HTTP Strict Transport Security) with a
                minimum max-age of one year and include preloading.
              </li>
              <li>
                <strong>At rest:</strong> All data stored in our databases is
                encrypted using AES-256. Database backups are encrypted before
                being written to storage. Encryption keys are managed through a
                dedicated Key Management Service (KMS) with automatic rotation.
              </li>
              <li>
                <strong>Sensitive fields:</strong> Particularly sensitive data
                (such as API keys, webhook secrets, and payment tokens) undergo
                additional application-level encryption before storage.
              </li>
            </ul>
          </SecurityCard>

          {/* Authentication & Authorization */}
          <SecurityCard icon={Key} title="Authentication & Authorization">
            <p>
              Multi-layered identity and access controls protect platform
              resources:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Password security:</strong> User passwords are hashed
                using bcrypt with a work factor of 12. We enforce minimum password
                complexity requirements and check against known breached password
                databases (HaveIBeenPwned k-anonymity API).
              </li>
              <li>
                <strong>JWT tokens:</strong> Authentication uses short-lived JSON
                Web Tokens (JWTs) signed with RS256. Access tokens expire after
                15 minutes; refresh tokens after 7 days. Token rotation is
                enforced on each refresh.
              </li>
              <li>
                <strong>Role-Based Access Control (RBAC):</strong> The platform
                implements strict RBAC with four roles: Admin, Client, Developer,
                and Validator. Each role has precisely scoped permissions, and
                privilege escalation is prevented through server-side enforcement.
              </li>
              <li>
                <strong>Session management:</strong> Concurrent session limits,
                idle timeout (30 minutes), and remote session invalidation are
                supported.
              </li>
            </ul>
          </SecurityCard>

          {/* API Security */}
          <SecurityCard icon={Zap} title="API Security">
            <p>
              Our API implements defense-in-depth protections aligned with
              industry best practices:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Rate limiting:</strong> Tiered rate limits per endpoint
                and per user to prevent abuse and ensure fair access. Burst
                limits and sustained throughput limits are enforced independently.
              </li>
              <li>
                <strong>Input validation:</strong> All API inputs are validated
                against strict JSON schemas. SQL injection, XSS, and command
                injection attempts are blocked by parameterized queries, output
                encoding, and input sanitization.
              </li>
              <li>
                <strong>OWASP Top 10:</strong> Our development practices address
                all OWASP Top 10 risks, including broken access control,
                cryptographic failures, injection, insecure design, security
                misconfiguration, vulnerable components, authentication failures,
                data integrity failures, logging failures, and SSRF.
              </li>
              <li>
                <strong>CORS policy:</strong> Cross-Origin Resource Sharing is
                restricted to approved origins only.
              </li>
            </ul>
          </SecurityCard>

          {/* Agent Endpoint Security */}
          <SecurityCard icon={Network} title="Agent Endpoint Security">
            <p>
              Agent endpoints are external services integrated into our
              platform. We enforce rigorous security at the boundary:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Authentication types:</strong> Agents must configure
                authentication using one of: API key (transmitted via header),
                Bearer token (OAuth2), or webhook signature verification
                (HMAC-SHA256).
              </li>
              <li>
                <strong>Webhook verification:</strong> All callbacks from agents
                are verified using HMAC-SHA256 signatures with per-agent shared
                secrets. Requests with invalid signatures are rejected and
                logged.
              </li>
              <li>
                <strong>TLS requirement:</strong> Agent endpoints must support
                TLS 1.2 or higher. Endpoints accessible only via HTTP (without
                TLS) are rejected during registration.
              </li>
              <li>
                <strong>Timeout enforcement:</strong> Task execution requests to
                agents are subject to configurable timeouts. Agents that
                consistently exceed timeouts are automatically marked for review.
              </li>
              <li>
                <strong>Response validation:</strong> Agent responses are
                validated against the expected schema before being delivered to
                Clients.
              </li>
            </ul>
          </SecurityCard>

          {/* Audit Logging */}
          <SecurityCard icon={MonitorCheck} title="Audit Logging">
            <p>
              Comprehensive audit logging ensures accountability and supports
              forensic analysis:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Scope:</strong> All authentication events, data access,
                configuration changes, task executions, payment transactions, and
                administrative actions are logged.
              </li>
              <li>
                <strong>Immutability:</strong> Audit logs are written to an
                append-only store. Logs cannot be modified or deleted, even by
                administrators.
              </li>
              <li>
                <strong>Retention:</strong> Audit logs are retained for a
                minimum of five (5) years in compliance with regulatory
                requirements.
              </li>
              <li>
                <strong>Alerting:</strong> Real-time alerts are triggered for
                suspicious patterns such as: failed authentication attempts
                exceeding threshold, privilege escalation attempts, unusual data
                access patterns, and API abuse.
              </li>
              <li>
                <strong>Access:</strong> Platform administrators can view audit
                logs through the admin dashboard. Users can request access to
                logs pertaining to their own activity.
              </li>
            </ul>
          </SecurityCard>

          {/* Incident Response */}
          <SecurityCard icon={Siren} title="Incident Response">
            <p>
              We maintain a documented incident response plan that follows the
              NIST SP 800-61 framework:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Detection:</strong> Automated monitoring, anomaly
                detection, and alerting systems provide 24/7 coverage. Mean time
                to detect (MTTD) target: under 15 minutes for critical
                incidents.
              </li>
              <li>
                <strong>Containment:</strong> Immediate isolation of affected
                systems and revocation of compromised credentials. Affected users
                are notified within the timelines prescribed by applicable data
                breach notification laws (72 hours under GDPR Article 33).
              </li>
              <li>
                <strong>Eradication &amp; Recovery:</strong> Root cause analysis,
                remediation of the vulnerability, and restoration of services
                from verified clean backups.
              </li>
              <li>
                <strong>Post-incident:</strong> Blameless retrospective with
                published findings (internally) and lessons learned. Security
                controls are updated based on findings.
              </li>
            </ul>
          </SecurityCard>

          {/* Responsible Disclosure */}
          <SecurityCard icon={Bug} title="Responsible Disclosure & Bug Bounty">
            <p>
              We value the security research community and encourage responsible
              disclosure of vulnerabilities:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Reporting:</strong> Security vulnerabilities can be
                reported to{" "}
                <a
                  href="mailto:security@taskmatch.ai"
                  className="text-zinc-900 underline"
                >
                  security@taskmatch.ai
                </a>
                . Please encrypt sensitive reports using our PGP key (available
                on our security page).
              </li>
              <li>
                <strong>Response time:</strong> We acknowledge receipt within 24
                hours and provide an initial assessment within 72 hours.
              </li>
              <li>
                <strong>Bug bounty:</strong> We operate a bug bounty program for
                qualifying vulnerabilities. Rewards range from EUR 100 to EUR
                5,000 depending on severity (CVSS score). Critical
                vulnerabilities (CVSS 9.0+) may qualify for higher rewards at
                our discretion.
              </li>
              <li>
                <strong>Safe harbor:</strong> We will not pursue legal action
                against researchers who act in good faith, comply with our
                responsible disclosure guidelines, and do not access or modify
                data belonging to other users.
              </li>
            </ul>
            <p className="mt-2">
              <strong>In scope:</strong> *.taskmatch.ai, the TaskMatch API, and
              the web application. <strong>Out of scope:</strong> Third-party
              services, social engineering, denial of service attacks.
            </p>
          </SecurityCard>
        </div>

        {/* Certifications roadmap */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">
            Compliance Certifications Roadmap
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
              <div className="flex justify-center mb-3">
                <ShieldCheck className="h-10 w-10 text-zinc-400" />
              </div>
              <h3 className="font-semibold text-zinc-900">SOC 2 Type II</h3>
              <Badge variant="warning" className="mt-2">In Progress</Badge>
              <p className="mt-3 text-xs text-zinc-500">
                Trust Services Criteria: Security, Availability, Confidentiality.
                Audit initiated Q1 2026; certification expected Q3 2026.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
              <div className="flex justify-center mb-3">
                <Shield className="h-10 w-10 text-zinc-400" />
              </div>
              <h3 className="font-semibold text-zinc-900">ISO 27001</h3>
              <Badge variant="secondary" className="mt-2">Planned</Badge>
              <p className="mt-3 text-xs text-zinc-500">
                Information Security Management System certification.
                Gap analysis scheduled for Q4 2026; certification target 2027.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
              <div className="flex justify-center mb-3">
                <Database className="h-10 w-10 text-zinc-400" />
              </div>
              <h3 className="font-semibold text-zinc-900">GDPR Compliance</h3>
              <Badge variant="success" className="mt-2">Active</Badge>
              <p className="mt-3 text-xs text-zinc-500">
                Full GDPR compliance implemented from day one. Data Protection
                Impact Assessments (DPIAs) conducted. DPO appointed.
              </p>
            </div>
          </div>
        </section>

        {/* Footer links */}
        <div className="mt-16 flex flex-wrap gap-4 border-t border-zinc-200 pt-8 text-sm text-zinc-500 print:hidden">
          <Link href="/legal/privacy" className="hover:text-zinc-900 underline">Privacy Policy</Link>
          <Link href="/legal/terms" className="hover:text-zinc-900 underline">Terms of Service</Link>
          <Link href="/legal/compliance" className="hover:text-zinc-900 underline">Compliance</Link>
        </div>
      </main>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { font-size: 11pt; }
          .print\\:hidden { display: none !important; }
          .print\\:bg-white { background-color: white !important; }
          a { color: inherit !important; text-decoration: underline !important; }
          h1 { font-size: 24pt; }
          h2 { font-size: 16pt; page-break-after: avoid; }
        }
      `}</style>
    </div>
  );
}
