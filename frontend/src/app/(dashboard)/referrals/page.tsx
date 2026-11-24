"use client";

import { useEffect, useState } from "react";
import { MeasurementPreferences } from "@/components/measurement-preferences";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api";
import { growthCopy } from "@/lib/growth-copy";
import { useTranslation } from "@/lib/i18n";

type Stats = { visits: number; verified_signups: number; activations: number; first_captures: number };
type Referral = {path: string | null; stats: Stats};

export default function ReferralsPage() {
  const { locale } = useTranslation();
  const words = growthCopy[locale];
  const [link, setLink] = useState("");
  const [stats, setStats] = useState<Stats|null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setFailed(false);
    apiGet<Referral>("/v1/referrals/me", { signal:abort.signal })
      .then(data => {
        if (abort.signal.aborted) return;
        setStats(data.stats);
        setLink(data.path ? new URL(data.path,window.location.origin).href : "");
      })
      .catch(()=>{if (!abort.signal.aborted) setFailed(true);});
    return ()=>abort.abort();
  }, [retry]);

  async function loadLink() {
    setBusy(true);
    setFailed(false);
    try {
      const { path } = await apiPost<{ path: string }>("/v1/referrals/me", {});
      setLink(new URL(path, window.location.origin).href);
    } catch { setFailed(true); }
    finally { setBusy(false); }
  }
  return <section className="max-w-xl space-y-5">
    <h1 className="font-display text-3xl font-semibold">{words.invite}</h1>
    <p>{words.inviteNote}</p>
    {link ? <label className="block text-sm">{words.link}
      <input className="mt-2 w-full rounded border p-3" readOnly value={link} onFocus={e=>e.currentTarget.select()} />
    </label> : stats && <Button disabled={busy} onClick={loadLink}>{words.createLink}</Button>}
    {!stats && !failed && <p role="status">{words.loading}</p>}
    {failed && <p role="alert">{words.loadError} <button className="underline" onClick={()=>setRetry(x=>x+1)}>{words.retry}</button></p>}
    {stats && <section className="space-y-3">
      <h2 className="text-xl font-semibold">{words.referralStats}</h2>
      <dl className="grid grid-cols-[1fr_auto] gap-x-5 gap-y-2 text-sm">
        {([[words.referralVisits,stats.visits],[words.referralVerified,stats.verified_signups],
          [words.referralActivated,stats.activations],[words.referralPaid,stats.first_captures]] as const).map(([name,value])=>
          <div key={name} className="contents"><dt>{name}</dt><dd className="tabular-nums">{value}</dd></div>)}
      </dl>
    </section>}
    <MeasurementPreferences />
  </section>;
}
