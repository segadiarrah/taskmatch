"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CreditCard, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { BillingConfig, CheckoutSession, FundingStatus, billingStatusKey, formatMinor, stripeUrl, payoutStatusKey, isPendingPayout } from "@/lib/billing";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BillingPanel({ jobId, onUpdated }: { jobId: string; onUpdated: () => void }) {
  const { t, locale } = useTranslation();
  const [funding, setFunding] = useState<FundingStatus | null>(null);
  const [config, setConfig] = useState<BillingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelledReturn, setCancelledReturn] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const active = useRef(true);
  const updated = useRef(onUpdated);
  updated.current = onUpdated;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const polls = useRef(0);
  const lastStatus = useRef<string | null>(null);
  const checkoutReturn = useRef<string | null | undefined>(undefined);

  const refresh = useCallback(async (sync = false): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      if (sync) {
        try { await apiPost(`/v1/billing/jobs/${jobId}/sync`, {}); }
        catch { if (active.current) setError(t("billing.syncFailed")); }
      }
      const [next, settings] = await Promise.all([
        apiGet<FundingStatus>(`/v1/billing/jobs/${jobId}`),
        apiGet<BillingConfig>("/v1/billing/config"),
      ]);
      if (!active.current) return;
      setFunding(next);
      setConfig(settings);
      const pending = next.status === "creating" || next.status === "checkout_pending";
      const pendingTransfer = next.status === "paid" && next.payouts.some(payout => payout.provider === "stripe_connect" && isPendingPayout(payout.status));
      setWaiting(pending);
      if (timer.current) clearTimeout(timer.current);
      if ((pending || pendingTransfer) && polls.current < 10) {
        polls.current++;
        timer.current = setTimeout(() => void refresh(false), 3000);
      }
      const wasPending = lastStatus.current !== null;
      const newlyPaid = next.status === "paid" && lastStatus.current !== "paid";
      lastStatus.current = next.status;
      if ((sync || wasPending) && newlyPaid) updated.current();
    } catch {
      if (active.current) setError(t("billing.loadFailed"));
    } finally {
      if (active.current) { setLoading(false); setBusy(false); }
    }
  }, [jobId, t]);

  useEffect(() => {
    active.current = true;
    const query = new URLSearchParams(window.location.search);
    if (checkoutReturn.current === undefined) checkoutReturn.current = query.get("checkout");
    const returned = checkoutReturn.current;
    setCancelledReturn(returned === "cancel");
    // Return parameters identify a navigation only. The known server-side
    // session is reconciled without accepting an ID or payment state here.
    if (returned) {
      query.delete("checkout"); query.delete("session_id");
      window.history.replaceState(null, "", `${window.location.pathname}${query.size ? `?${query}` : ""}`);
    }
    void refresh(returned === "success");
    return () => { active.current = false; if (timer.current) clearTimeout(timer.current); };
  }, [refresh]);

  async function checkout() {
    setBusy(true); setError(null);
    try {
      const result = await apiPost<CheckoutSession>(`/v1/billing/jobs/${jobId}/checkout`, {});
      const url = stripeUrl(result.checkout_url);
      if (url) { window.location.assign(url); return; }
      if (result.status === "paid") { await refresh(true); return; }
      setError(t("billing.invalidLink"));
    } catch (failure) { setError(failure instanceof ApiError ? failure.message : t("billing.checkoutFailed")); }
    finally { setBusy(false); }
  }

  async function cancel() {
    setBusy(true); setError(null);
    try { await apiPost(`/v1/billing/jobs/${jobId}/cancel`, {}); await refresh(false); }
    catch (failure) { setError(failure instanceof ApiError ? failure.message : t("billing.cancelFailed")); }
    finally { setBusy(false); }
  }

  const receipt = stripeUrl(funding?.receipt_url);
  const resume = stripeUrl(funding?.checkout_url);
  return <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-signal-400" />{t("billing.title")}</CardTitle>
      <CardDescription>{t("billing.description")}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {error && <p role="alert" data-testid="billing-error" className="rounded-lg border border-danger/40 p-3 text-sm text-danger">{error}</p>}
      {cancelledReturn && <p className="text-sm text-muted-foreground">{t("billing.cancelledReturn")}</p>}
      {loading ? <Loader2 aria-label={t("billing.loading")} className="h-5 w-5 animate-spin" /> : funding && <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p data-testid="billing-amount" className="font-display text-2xl">{funding.status === "unpaid" && funding.amount_minor === 0 ? t("billing.amountPending") : formatMinor(funding.amount_minor, funding.currency, locale)}</p>
            {funding.refunded_minor > 0 && <p className="text-sm text-muted-foreground">{t("billing.refundedAmount", { amount: formatMinor(funding.refunded_minor, funding.currency, locale) })}</p>}
          </div>
          <Badge data-testid="funding-status" variant={funding.status === "paid" ? "success" : "secondary"}>{t(billingStatusKey(funding.status))}</Badge>
        </div>
        {config?.mode === "test" && <p className="text-xs text-muted-foreground">{t("billing.testMode")}</p>}
        {!config?.enabled && <p className="text-sm text-warning">{t("billing.unavailable")}</p>}
        {waiting && <p role="status" className="text-sm text-muted-foreground">{t("billing.confirming")}</p>}
        {funding.error && <p role="alert" className="text-sm text-danger">{funding.error}</p>}
        {funding.payouts.some(payout => payout.provider !== "platform") && <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm font-medium">{t("billing.transfers")}</p>
          <p className="text-xs text-muted-foreground">{t("billing.transferMeaning")}</p>
          {funding.payouts.filter(payout => payout.provider !== "platform").map(payout => <div key={payout.id} className="rounded-lg border border-border p-3 text-sm">
            <div className="flex flex-wrap justify-between gap-2"><span>{payout.recipient_name}</span><span>{formatMinor(payout.amount_minor, payout.currency, locale)} · {t(payoutStatusKey(payout.status))}</span></div>
            {payout.error && <p className="mt-1 text-danger">{payout.error}</p>}
          </div>)}
        </div>}
      </>}
      <div className="flex flex-wrap gap-2">
        {funding?.can_checkout && config?.enabled && <Button onClick={checkout} disabled={busy}>{t("billing.pay")}</Button>}
        {!funding?.can_checkout && resume && config?.enabled && <Button onClick={() => window.location.assign(resume)} disabled={busy}>{t("billing.resume")}</Button>}
        {funding?.can_cancel && <Button variant="outline" onClick={cancel} disabled={busy}>{t("billing.cancel")}</Button>}
        <Button variant="outline" onClick={() => { polls.current = 0; void refresh(true); }} disabled={busy}><RefreshCw className="mr-2 h-4 w-4" />{t("billing.refresh")}</Button>
        {receipt && <a href={receipt} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 text-sm underline">{t("billing.receipt")}<ExternalLink className="h-3 w-3" /></a>}
      </div>
    </CardContent>
  </Card>;
}
