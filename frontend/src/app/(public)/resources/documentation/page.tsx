"use client";

import Link from "@/components/public/localized-link";
import { PageHero } from "@/components/public/page-shell";
import { useTranslation } from "@/lib/i18n";
import { COPY } from "@/lib/landing-copy";
import { clientChecks, clientReferences, frameworkReferences } from "@/content/protocol-summary";
import { integrationCopy } from "@/content/integration";

export default function DocumentationPage() {
  const { locale } = useTranslation();
  const c = integrationCopy[locale];
  const checks = clientChecks[locale];
  return <div className="min-h-screen bg-ink-950 text-ink-50">
    <PageHero eyebrow={c.reference} title={c.title} accent={c.accent} description={c.intro} />
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-12 sm:px-6">
      <section className="rounded-lg border border-ink-700 bg-ink-900 p-8">
        <h2 className="font-display text-2xl">{c.jobs}</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-6 leading-8 text-ink-300">
          <li id="auth" className="scroll-mt-20">{c.authBody}</li><li id="jobs" className="scroll-mt-20">{c.jobsBody}</li><li id="billing" className="scroll-mt-20">{c.billingBody}</li>
        </ol>
        <Link className="mt-4 inline-block text-signal-600 underline" href="/pricing">{COPY[locale].pricing}</Link>
      </section>
      <section id="protocols" className="rounded-lg border border-ink-700 bg-ink-900 p-8">
        <h2 className="font-display text-2xl">{c.protocols}</h2><p className="mt-4 leading-8 text-ink-300">{c.protocolsBody}</p>
        <Link className="mt-4 inline-block text-signal-600 underline" href="/resources/api-reference#protocols">{c.reference}</Link>
      </section>
      <section id="webhooks" className="rounded-lg border border-ink-700 bg-ink-900 p-8">
        <h2 className="font-display text-2xl">{c.webhooks}</h2><p className="mt-4 leading-8 text-ink-300">{c.webhooksBody}</p>
      </section>
      <section className="rounded-lg border border-ink-700 bg-ink-900 p-8">
        <h2 className="font-display text-2xl">{c.limits}</h2><p className="mt-4 leading-8 text-ink-300">{c.limitsBody}</p>
      </section>
      <section id="compatibility" className="scroll-mt-20 rounded-lg border border-ink-700 bg-ink-900 p-5 sm:p-8">
        <h2 className="font-display text-2xl">{checks.title}</h2>
        <table className="mt-5 w-full table-fixed text-left text-sm leading-6">
          <thead><tr><th scope="col" className="w-2/5 pb-3 pr-4">{checks.client}</th><th scope="col" className="pb-3">{checks.result}</th></tr></thead>
          <tbody>
            {clientReferences.map(client => <tr key={client.href} className="border-t border-ink-700 align-top">
              <th scope="row" className="break-words py-3 pr-4 font-medium"><Link className="text-signal-600 underline" href={client.href}>{client.label}</Link></th>
              <td className="py-3 text-ink-300">{checks[client.result]}</td>
            </tr>)}
            <tr className="border-t border-ink-700 align-top">
              <th scope="row" className="py-3 pr-4 font-medium"><ul>{frameworkReferences.map(item => <li key={item.href}><a className="text-signal-600 underline" href={item.href}>{item.label}</a></li>)}</ul></th>
              <td className="py-3 text-ink-300">{checks.other}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <nav className="flex flex-wrap gap-6 text-signal-500 underline">
        <Link href="/resources/api-reference">{c.reference}</Link><Link href="/resources/sdk">{c.sdk}</Link><Link href="/resources/guides">{c.guides}</Link>
      </nav>
    </main>
  </div>;
}
