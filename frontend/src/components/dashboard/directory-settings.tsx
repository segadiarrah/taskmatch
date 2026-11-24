"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ApiError, apiDelete, apiGet, apiPut } from "@/lib/api";
import { countryOptions } from "@/lib/countries";
import { directoryCopy, type PublicDirectoryCard } from "@/lib/directory-copy";
import { SUPPORTED_LOCALES } from "@/lib/locales";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Card = PublicDirectoryCard & { published: boolean };
const selectClass = "mt-1 block h-10 w-full rounded-md border border-ink-700 bg-ink-950 px-3";

export function DirectorySettings({ agentId, active = true }: { agentId: string; active?: boolean }) {
  const { locale } = useTranslation();
  const c = directoryCopy[locale];
  const [open, setOpen] = useState(false);
  const [card, setCard] = useState<Card | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error" | "denied">("loading");
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const path = "/v1/directory/mine/" + agentId;
  const countries = useMemo(() => countryOptions(locale), [locale]);
  const names = new Intl.DisplayNames([locale], { type: "language" });

  useEffect(() => {
    if (!open) return;
    const abort = new AbortController();
    apiGet<Card | null>(path, { signal: abort.signal }).then(data => {
      if (abort.signal.aborted) return;
      setCard(data); setState("ready");
    }).catch(cause => {
      if (abort.signal.aborted) return;
      setState(cause instanceof ApiError && cause.status === 404 ? "denied" : "error");
    });
    return () => abort.abort();
  }, [open, attempt, path]);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true); setError(false);
    try {
      const data = await apiPut<PublicDirectoryCard>(path, {
        display_name: fields.get("display_name"), summary: fields.get("summary"), expertise: fields.get("expertise"),
        country: fields.get("country") || null, language: fields.get("language") || null,
      });
      setCard({ ...data, published: true });
    } catch { setError(true); }
    finally { setBusy(false); }
  }

  async function withdraw() {
    setBusy(true); setError(false);
    try { await apiDelete(path); setCard(old => old ? { ...old, published: false } : null); }
    catch { setError(true); }
    finally { setBusy(false); }
  }

  if (state === "denied") return null;
  return <details className="rounded-lg border border-ink-700 p-5" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="cursor-pointer font-semibold">{c.control}</summary>
    {open && (state === "loading" ? <p role="status" className="mt-3">{c.saving}</p> : state === "error" ?
      <div className="mt-3 space-y-2"><p role="alert">{c.loadError}</p><Button variant="outline" onClick={() => { setState("loading"); setAttempt(n => n + 1); }}>{c.retry}</Button></div>
      : <div className="mt-4 space-y-3">
        <p className="text-sm text-ink-400">{c.explanation}</p>
        <p role="status" className="font-medium">{card?.published && active ? c.published : c.private}</p>
        {!active && <p>{c.ownerUnavailable}</p>}
        <form key={card?.id || "new"} onSubmit={publish} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">{c.name}<Input name="display_name" minLength={2} maxLength={96} required defaultValue={card?.display_name} /></label>
          <label className="text-sm">{c.expertise}<Input name="expertise" minLength={2} maxLength={160} required defaultValue={card?.expertise} /></label>
          <label className="text-sm sm:col-span-2">{c.summary}<Textarea name="summary" minLength={5} maxLength={480} required defaultValue={card?.summary} /></label>
          <label className="text-sm">{c.country}<select className={selectClass} name="country" defaultValue={card?.country || ""}>
            <option value="">{c.optional}</option>{countries.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select></label>
          <label className="text-sm">{c.language}<select className={selectClass} name="language" defaultValue={card?.language || ""}>
            <option value="">{c.optional}</option>{SUPPORTED_LOCALES.map(value => <option key={value} value={value}>{names.of(value)}</option>)}
          </select></label>
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <Button type="submit" disabled={busy || !active}>{busy ? c.saving : card?.published ? c.update : c.publish}</Button>
            {card?.published && <Button type="button" variant="outline" disabled={busy} onClick={withdraw}>{c.withdraw}</Button>}
            {card?.published && active && <Link className="inline-flex items-center text-signal-600 underline" href={"/directory/" + card.id + "?lang=" + locale}>{c.publicLink}</Link>}
          </div>
        </form>
        {error && <p role="alert" className="text-sm text-danger">{c.error}</p>}
      </div>)}
  </details>;
}
