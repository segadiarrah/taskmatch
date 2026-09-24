"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CreditCard, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { ConnectStatus, stripeUrl } from "@/lib/billing";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ConnectPanel() {
  const { t } = useTranslation();
  const [account, setAccount] = useState<ConnectStatus | null>(null);
  const [country, setCountry] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const active = useRef(true);
  const returned = useRef<string | null | undefined>(undefined);

  const load = useCallback(async (sync = false) => {
    setBusy(true); setError(null);
    try {
      if (sync) await apiPost<ConnectStatus>("/v1/billing/connect/sync", {});
      const next = await apiGet<ConnectStatus>("/v1/billing/connect");
      if (!active.current) return;
      setAccount(next);
      if (next.country) setCountry(next.country);
    } catch { if (active.current) setError(t("connect.failed")); }
    finally { if (active.current) { setBusy(false); setLoading(false); } }
  }, [t]);

  useEffect(() => {
    active.current = true;
    const query = new URLSearchParams(window.location.search);
    if (returned.current === undefined) returned.current = query.get("connect");
    if (query.has("connect")) {
      query.delete("connect");
      window.history.replaceState(null, "", `${window.location.pathname}${query.size ? `?${query}` : ""}`);
    }
    void load(returned.current === "return" || returned.current === "refresh");
    return () => { active.current = false; };
  }, [load]);

  async function openStripe(dashboard = false) {
    setBusy(true); setError(null);
    try {
      const response = await apiPost<{ url: string }>(dashboard ? "/v1/billing/connect/dashboard" : "/v1/billing/connect/onboarding", dashboard ? {} : { country: (account?.country || country).trim().toUpperCase() });
      const url = stripeUrl(response.url);
      if (!url) { setError(t("billing.invalidLink")); return; }
      window.location.assign(url);
    } catch { setError(t("connect.failed")); }
    finally { setBusy(false); }
  }

  const ready = account?.transfers_enabled;
  return <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-signal-400" />{t("connect.title")}</CardTitle>
      <CardDescription>{t("connect.description")}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {error && <p role="alert" data-testid="connect-error" className="rounded-lg border border-danger/40 p-3 text-sm text-danger">{error}</p>}
      {loading ? <Loader2 aria-label={t("connect.loading")} className="h-5 w-5 animate-spin" /> : account && <>
        {!account.enabled && <p className="text-sm text-warning">{t("connect.unavailable")}</p>}
        {account.mode === "test" && <p className="text-xs text-muted-foreground">{t("billing.testMode")}</p>}
        <div className="flex flex-wrap gap-2">
          <Badge variant={ready ? "success" : "warning"}>{t(ready ? "connect.transfersReady" : account.account_id ? "connect.transfersPending" : "connect.notConnected")}</Badge>
          {account.account_id && <Badge variant={account.payouts_enabled ? "success" : "secondary"}>{t(account.payouts_enabled ? "connect.payoutsReady" : "connect.payoutsPending")}</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{t("connect.meaning")}</p>
        {account.requirements.length > 0 && <div className="rounded-lg border border-warning/30 p-3">
          <p className="text-sm font-medium">{t("connect.requirements")}</p>
          <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">{account.requirements.map(item => <li key={item}>{item}</li>)}</ul>
        </div>}
        {!account.account_id && account.enabled && <div className="max-w-xl space-y-2">
          <label htmlFor="connect-country" className="text-sm font-medium">{t("connect.country")}</label>
          <Input id="connect-country" value={country} onChange={event => setCountry(event.target.value)} maxLength={2} autoComplete="country" className="w-28 uppercase" aria-describedby="connect-country-hint" />
          <p id="connect-country-hint" className="text-xs text-muted-foreground">{t("connect.countryHint")}</p>
        </div>}
      </>}
      <div className="flex flex-wrap gap-2">
        {account?.enabled && (!ready || !account.details_submitted || account.requirements.length > 0) && <Button disabled={busy || (!account.account_id && !/^[A-Za-z]{2}$/.test(country.trim()))} onClick={() => void openStripe()}>{t(account.account_id ? "connect.continue" : "connect.setup")}</Button>}
        <Button variant="outline" disabled={busy} onClick={() => void load(true)}><RefreshCw className="mr-2 h-4 w-4" />{t("connect.refresh")}</Button>
        {account?.enabled && account.account_id && <Button variant="outline" disabled={busy} onClick={() => void openStripe(true)}><ExternalLink className="mr-2 h-4 w-4" />{t("connect.dashboard")}</Button>}
      </div>
    </CardContent>
  </Card>;
}
