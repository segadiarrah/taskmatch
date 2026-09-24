"use client";

import Link from "next/link";
import { PageHero } from "@/components/public/page-shell";
import { useTranslation } from "@/lib/i18n";
import { integrationCopy, endpointGroups } from "@/content/integration";

export default function DocumentationPage() {
  const { locale } = useTranslation();
  const c = integrationCopy[locale];
  return <div className="min-h-screen bg-ink-950 text-ink-50">
    <PageHero eyebrow={c.reference} title={c.title} accent={c.accent} description={c.intro} />
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-12 sm:px-6">
      {endpointGroups.map((group) => <section key={group.id} id={group.id} className="rounded-lg border border-ink-700 bg-ink-900 p-8">
        <h2 className="font-display text-2xl text-ink-50">{c[group.id]}</h2>
        <p className="mt-4 leading-8 text-ink-300">{c[group.key]}</p>
        <pre className="mt-6 overflow-x-auto rounded-md border border-ink-700 bg-ink-950 p-5 text-sm leading-7"><code>{group.code}</code></pre>
      </section>)}
      <section className="rounded-lg border border-ink-700 bg-ink-900 p-8">
        <h2 className="font-display text-2xl">{c.limits}</h2><p className="mt-4 leading-8 text-ink-300">{c.limitsBody}</p>
      </section>
      <nav className="flex flex-wrap gap-6 text-signal-500 underline">
        <Link href="/resources/api-reference">{c.reference}</Link><Link href="/resources/sdk">{c.sdk}</Link><Link href="/resources/guides">{c.guides}</Link>
      </nav>
    </main>
  </div>;
}
