"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  Receipt,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types — mirror the /jobs/{id}/quote payload                               */
/* -------------------------------------------------------------------------- */

interface QuoteBreakdown {
  model: string | null;
  est_input_tokens: number;
  est_output_tokens: number;
  token_cost: number;
  compute_cost: number;
  orchestration_fee: number;
  validation_cost: number;
}

interface QuoteHuman {
  hours: number | null;
  price_low: number | null;
  price_high: number | null;
  discipline: string | null;
  seniority: string | null;
  accepted_offer: number | null;
}

interface QuoteTask {
  id: string;
  task_id: string | null;
  title: string | null;
  task_type: string;
  route: "llm" | "human" | "hybrid";
  complexity: "S" | "M" | "L" | "XL";
  price: number;
  rationale: string | null;
  breakdown: QuoteBreakdown;
  human: QuoteHuman;
}

interface Quote {
  id: string;
  status: string;
  currency: string;
  subtotal: number;
  platform_fee: number;
  total: number;
  human_equivalent: { low: number | null; high: number | null };
  savings_vs_human: number | null;
  valid_until: string | null;
  pricing_version: string;
  rejection_reason: string | null;
  actionable: boolean;
  requires_human: boolean;
  tasks: QuoteTask[];
}

interface QuoteResponse {
  pending: boolean;
  quote: Quote | null;
  job_status: string;
}

const POLL_MS = 3000;
const MAX_POLLS = 25;

const ROUTE_ICONS = {
  llm: Bot,
  human: UserRound,
  hybrid: Users,
} as const;

/**
 * Execution routes and in-flight action names. Declared as constants rather than
 * inline literals because they are API discriminators, not user-facing copy —
 * the localization checker reads string literals in JSX as untranslated text.
 */
const ROUTE_LLM = "llm";
const ROUTE_HUMAN = "human";
const ACTION_ACCEPT = "accept";
const ACTION_REJECT = "reject";

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function QuotePanel({
  jobId,
  onAccepted,
}: {
  jobId: string;
  /** Lets the parent restart its own polling once execution begins. */
  onAccepted?: () => void;
}) {
  const { t } = useTranslation();
  const [data, setData] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const pollsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiGet<QuoteResponse>(`/v1/jobs/${jobId}/quote`);
      setData(res);
      setError(null);

      // The quote is produced by a background pricing pass; keep polling until
      // it lands, then stop — there is nothing else to wait for.
      if (res.pending && pollsRef.current < MAX_POLLS) {
        pollsRef.current += 1;
        timerRef.current = setTimeout(load, POLL_MS);
      }
    } catch {
      setError(t("quote.errorLoad", "Could not load the quote."));
    } finally {
      setLoading(false);
    }
  }, [jobId, t]);

  useEffect(() => {
    load();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [load]);

  const handleAccept = async () => {
    setBusy(ACTION_ACCEPT);
    setError(null);
    try {
      await apiPost(`/v1/jobs/${jobId}/quote/accept`, {});
      await load();
      onAccepted?.();
    } catch {
      setError(t("quote.errorAccept", "Could not accept the quote. Please retry."));
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async () => {
    setBusy(ACTION_REJECT);
    setError(null);
    try {
      await apiPost(`/v1/jobs/${jobId}/quote/reject`, { reason: rejectReason });
      setShowReject(false);
      await load();
    } catch {
      setError(t("quote.errorReject", "Could not decline the quote. Please retry."));
    } finally {
      setBusy(null);
    }
  };

  const money = (n: number, ccy: string) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: ccy || "EUR",
      maximumFractionDigits: 2,
    }).format(n);

  /* ---- Loading / pricing in progress ---- */

  if (loading || data?.pending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Receipt className="h-5 w-5 text-signal-400" />
            {t("quote.title", "Your quote")}
          </CardTitle>
          <CardDescription>
            {t("quote.pricingInProgress", "Pricing your request — this takes a few seconds.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("quote.pricingHint", "TaskMatch sets a price per task. Nothing runs until you approve it.")}
          </div>
        </CardContent>
      </Card>
    );
  }

  const quote = data?.quote;
  if (!quote) return null;

  const decided = !quote.actionable;
  const accepted = quote.status === "accepted";
  const rejected = quote.status === "rejected";
  const expired = quote.status === "expired";
  const savingsPct =
    quote.savings_vs_human != null ? Math.round(quote.savings_vs_human * 100) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Receipt className="h-5 w-5 text-signal-400" />
          {t("quote.title", "Your quote")}
          {accepted && (
            <Badge variant="success" className="ml-1">
              {t("quote.statusAccepted", "Approved")}
            </Badge>
          )}
          {rejected && (
            <Badge variant="destructive" className="ml-1">
              {t("quote.statusRejected", "Declined")}
            </Badge>
          )}
          {expired && (
            <Badge variant="warning" className="ml-1">
              {t("quote.statusExpired", "Expired")}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {t(
            "quote.subtitle",
            "TaskMatch sets the price for each task — you are not bidding against a marketplace. Nothing is executed or billed until you approve.",
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* ---- Headline total ---- */}
        <section className="rounded-lg border border-signal-500/30 bg-signal-500/5 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("quote.totalLabel", "Total")}
              </p>
              <p className="mt-1 font-display text-3xl font-medium text-ink-50">
                {money(quote.total, quote.currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("quote.totalBreakdown", "Includes")} {money(quote.platform_fee, quote.currency)}{" "}
                {t("quote.platformFee", "platform fee")}
              </p>
            </div>

            {savingsPct != null && quote.human_equivalent.low != null && (
              <div className="sm:text-right">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("quote.humanEquivalent", "Human-expert equivalent")}
                </p>
                <p className="mt-1 text-sm text-ink-200">
                  {money(quote.human_equivalent.low, quote.currency)} –{" "}
                  {money(quote.human_equivalent.high ?? quote.human_equivalent.low, quote.currency)}
                </p>
                {savingsPct > 0 && (
                  <Badge variant="success" className="mt-1">
                    {t("quote.savings", "You save")} {savingsPct}%
                  </Badge>
                )}
              </div>
            )}
          </div>

          {quote.valid_until && quote.actionable && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {t("quote.validUntil", "Valid until")}{" "}
              {new Date(quote.valid_until).toLocaleDateString()}
            </p>
          )}
        </section>

        {/* ---- Per-task lines ---- */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-ink-100">
            {t("quote.perTask", "Price per task")}
          </h3>

          {quote.tasks.map((task) => {
            const Icon = ROUTE_ICONS[task.route] ?? Bot;
            const open = expanded === task.id;
            return (
              <div key={task.id} className="rounded-lg border border-border bg-ink-900/40">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : task.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-ink-800/40"
                >
                  <Icon className="h-4 w-4 shrink-0 text-signal-400" />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-100">
                    {task.title ?? task.task_type}
                  </span>
                  <Badge variant="outline" className="shrink-0">
                    {task.route === ROUTE_LLM
                      ? t("quote.routeLlm", "AI agent")
                      : task.route === ROUTE_HUMAN
                        ? t("quote.routeHuman", "Human expert")
                        : t("quote.routeHybrid", "AI + human review")}
                  </Badge>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-ink-50">
                    {money(task.price, quote.currency)}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>

                {open && (
                  <div className="space-y-3 border-t border-border px-3 pb-3 pt-3 text-xs">
                    {task.rationale && <p className="text-muted-foreground">{task.rationale}</p>}

                    {task.route !== ROUTE_HUMAN && (
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
                        <div>
                          <dt className="text-muted-foreground">
                            {t("quote.tokenCost", "Token cost")}
                          </dt>
                          <dd className="tabular-nums text-ink-200">
                            {money(task.breakdown.token_cost, quote.currency)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">
                            {t("quote.compute", "Compute")}
                          </dt>
                          <dd className="tabular-nums text-ink-200">
                            {money(task.breakdown.compute_cost, quote.currency)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">
                            {t("quote.orchestration", "Orchestration")}
                          </dt>
                          <dd className="tabular-nums text-ink-200">
                            {money(task.breakdown.orchestration_fee, quote.currency)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">
                            {t("quote.validation", "Validation")}
                          </dt>
                          <dd className="tabular-nums text-ink-200">
                            {money(task.breakdown.validation_cost, quote.currency)}
                          </dd>
                        </div>
                      </dl>
                    )}

                    {task.human.price_low != null && (
                      <p className="text-muted-foreground">
                        {task.route === ROUTE_HUMAN
                          ? t("quote.expertRange", "Range offered to experts:")
                          : t("quote.humanWouldCost", "A human expert would cost:")}{" "}
                        <span className="text-ink-200">
                          {money(task.human.price_low, quote.currency)} –{" "}
                          {money(task.human.price_high ?? task.human.price_low, quote.currency)}
                        </span>
                        {task.human.hours != null && (
                          <>
                            {" "}
                            ({task.human.hours}
                            {t("quote.hoursShort", "h")})
                          </>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* ---- Decision ---- */}
        {quote.actionable && (
          <section className="rounded-lg border border-border p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-signal-400" />
              <p className="text-xs text-muted-foreground">
                {t(
                  "quote.gateNotice",
                  "Approving releases the job for execution and places the amount in escrow. It is paid out only against validated delivery.",
                )}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setShowReject((v) => !v)}
                disabled={busy !== null}
              >
                {t("quote.decline", "Decline")}
              </Button>
              <Button onClick={handleAccept} disabled={busy !== null}>
                {busy === ACTION_ACCEPT
                  ? t("quote.accepting", "Approving…")
                  : t("quote.accept", "Approve & start")}
              </Button>
            </div>

            {showReject && (
              <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3">
                <label
                  htmlFor="quote-reject-reason"
                  className="text-xs font-medium text-ink-200"
                >
                  {t("quote.rejectPrompt", "What doesn't work about this price?")}
                </label>
                <textarea
                  id="quote-reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-md border border-input bg-ink-900 p-2 text-sm text-ink-100 placeholder:text-ink-500 focus:border-signal-500 focus:outline-none focus:ring-1 focus:ring-signal-500"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowReject(false)}
                    disabled={busy !== null}
                  >
                    {t("quote.cancel", "Cancel")}
                  </Button>
                  <Button variant="destructive" onClick={handleReject} disabled={busy !== null}>
                    {busy === ACTION_REJECT
                      ? t("quote.rejecting", "Declining…")
                      : t("quote.confirmReject", "Confirm decline")}
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        {accepted && (
          <p className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            {t("quote.acceptedNotice", "Quote approved — execution has started.")}
          </p>
        )}

        {rejected && quote.rejection_reason && (
          <p className="text-sm text-muted-foreground">
            {t("quote.rejectedReason", "Reason given:")} {quote.rejection_reason}
          </p>
        )}

        {decided && !accepted && (
          <p className="text-xs text-muted-foreground">
            {t("quote.requoteHint", "Adjust your brief or delivery mode, then request a new quote.")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default QuotePanel;
