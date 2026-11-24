"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { ANALYTICS_PREFERENCE, analyticsAllowed } from "@/lib/analytics-consent";
import { growthCopy } from "@/lib/growth-copy";
import { useTranslation } from "@/lib/i18n";
import { captureCampaign } from "@/lib/public-intent";

export function MeasurementPreferences() {
  const { locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => { setAllowed(analyticsAllowed()); }, [open]);

  async function change(enable: boolean) {
    setBusy(true);
    setError(false);
    try {
      // Preference withdrawal immediately stops browser events, including if the
      // network fails. Keep the controls open so erasure can be retried.
      if (!enable) localStorage.setItem(ANALYTICS_PREFERENCE, "deny");
      const code = localStorage.getItem("auth_token") ? null : new URLSearchParams(window.location.search).get("ref");
      const response = await fetch(`${API_BASE_URL}/v1/measurement/consent`, enable ? {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allow: true, language: locale, referral: code && /^[\w-]{22}$/.test(code) ? code : null }),
      } : { method: "DELETE" });
      if (!response.ok) throw new Error();
      if (enable) localStorage.setItem(`${ANALYTICS_PREFERENCE}_until`, String(Date.now() + 366 * 86400000));
      else localStorage.removeItem(`${ANALYTICS_PREFERENCE}_until`);
      localStorage.setItem(ANALYTICS_PREFERENCE, enable ? "allow" : "deny");
      captureCampaign();
      window.dispatchEvent(new Event("taskmatch:usage-preference"));
      setAllowed(enable);
      setOpen(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return <div className="my-4 text-sm">
    <button type="button" className="underline underline-offset-4" aria-expanded={open} onClick={()=>setOpen(!open)}>
      {growthCopy[locale].measurement}
    </button>
    {open && <section className="mt-3 max-w-lg space-y-3 rounded-lg border border-ink-700 p-4">
      <p>{growthCopy[locale].consent}</p>
      {allowed && <p>{growthCopy[locale].on}</p>}
      <div className="flex flex-wrap gap-4">
        {!allowed && <button className="font-semibold underline" disabled={busy} onClick={()=>change(true)}>{growthCopy[locale].allow}</button>}
        <button className="underline" disabled={busy} onClick={()=>change(false)}>{allowed ? growthCopy[locale].withdraw : growthCopy[locale].off}</button>
      </div>
      {error && <p role="alert">{growthCopy[locale].failed}</p>}
    </section>}
  </div>;
}
