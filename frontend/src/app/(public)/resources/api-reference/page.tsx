"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHero } from "@/components/public/page-shell";
import { useTranslation } from "@/lib/i18n";
import { integrationCopy, endpointGroups } from "@/content/integration";

const loginExample = `curl -X POST https://taskmatch.ai/api/v1/auth/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'username=you@example.com' \
  --data-urlencode 'password=YOUR_PASSWORD'

# Send the returned access_token with subsequent requests:
# Authorization: Bearer ACCESS_TOKEN`;

export default function ApiReferencePage() {
  const { locale } = useTranslation();
  const c = integrationCopy[locale];
  const [open, setOpen] = useState<string>("auth");
  return <div className="min-h-screen bg-ink-950 text-ink-50">
    <PageHero eyebrow={c.reference} title={c.apiTitle} description={c.apiIntro} />
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-12 sm:px-6">
      {endpointGroups.map((group) => {
        const isOpen = open === group.id;
        return <section key={group.id} className="rounded-lg border border-ink-700 bg-ink-900">
          <button type="button" aria-expanded={isOpen} aria-controls={`group-${group.id}`} onClick={() => setOpen(isOpen ? "" : group.id)} className="flex w-full justify-between p-6 text-left font-display text-2xl">
            {c[group.id]}<span aria-hidden="true">{isOpen ? "−" : "+"}</span>
          </button>
          {isOpen && <div id={`group-${group.id}`} className="border-t border-ink-700 p-6">
            <p className="leading-8 text-ink-300">{c[group.key]}</p>
            <pre className="mt-6 overflow-x-auto rounded-md border border-ink-700 bg-ink-950 p-5 text-sm leading-7"><code>{group.code}</code></pre>
          </div>}
        </section>;
      })}
      <section className="rounded-lg border border-ink-700 bg-ink-900 p-8">
        <h2 className="font-display text-2xl">{c.sample}</h2>
        <pre className="mt-6 overflow-x-auto rounded-md border border-ink-700 bg-ink-950 p-5 text-sm leading-7"><code>{loginExample}</code></pre>
      </section>
      <section className="rounded-lg border border-ink-700 bg-ink-900 p-8">
        <h2 className="font-display text-2xl">{c.observe}</h2><p className="mt-4 leading-8 text-ink-300">{c.observeBody}</p>
        <h2 className="mt-8 font-display text-2xl">{c.limits}</h2><p className="mt-4 leading-8 text-ink-300">{c.limitsBody}</p>
      </section>
      <Link className="text-signal-500 underline" href="/resources/sdk">{c.sdk}</Link>
    </main>
  </div>;
}
