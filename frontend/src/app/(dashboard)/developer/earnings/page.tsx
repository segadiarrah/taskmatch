"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import ConnectPanel from "./connect-panel";
import { Select } from "@/components/ui/select";
import { billingStatusKey, paymentProviderKey } from "@/lib/billing";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  AlertCircle,
  ChevronRight,
  DollarSign,
  Clock,
  TrendingUp,
  Wallet,
  Receipt,
} from "lucide-react";

interface CurrencySummary {
  total_earned: number;
  pending_payments: number;
  this_month: number;
  currency: string;
}

interface EarningsSummary {
  by_currency: CurrencySummary[];
}

interface Payment {
  provider: string;
  transfer_id: string | null;
  payout_error: string | null;
  id: string;
  task_id: string;
  task_title: string;
  agent_name: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  currency: string;
  status: string;
  created_at: string;
}

const paymentStatusBadgeVariant = (status: string) => {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
    pending: "secondary",
    releasable: "info",
    paid: "success",
    failed: "destructive",
    refunded: "warning",
  };
  return map[status] ?? "outline";
};

export default function EarningsPage() {
  const { t, locale } = useTranslation();
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [summaryData, paymentsData] = await Promise.all([
        apiGet<EarningsSummary>("/v1/developer/earnings/summary"),
        apiGet<{ items: Payment[]; total: number }>(`/v1/developer/earnings/payments?skip=${page * 50}&limit=50`),
      ]);
      setSummary(summaryData);
      setPayments(paymentsData.items ?? []);
      setTotal(paymentsData.total ?? paymentsData.items.length);
    } catch { setError(t("billing.loadFailed")); }
    finally { setLoading(false); }
  }, [page, t]);

  useEffect(() => { void fetchEarnings(); }, [fetchEarnings]);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const summaries = summary?.by_currency ?? [];
  const current = summaries.find(item => item.currency === selectedCurrency) ?? summaries[0];
  const currency = current?.currency ?? "";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/developer" className="hover:text-foreground transition-colors">
          {t("developer.earnings.breadcrumbDashboard")}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{t("developer.earnings.breadcrumb")}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-medium text-ink-50 sm:text-3xl">{t("developer.earnings.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("developer.earnings.subtitle")}
        </p>
      </div>

      <ConnectPanel />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => void fetchEarnings()}
          >
            {t("developer.earnings.retry")}
          </Button>
        </div>
      )}

      {summaries.length > 0 && <Select aria-label={t("billing.currency")} value={currency} onChange={event => setSelectedCurrency(event.target.value)} className="w-36">
        {summaries.map(item => <option key={item.currency} value={item.currency}>{item.currency}</option>)}
      </Select>}
      {/* Summary Cards */}
      {current && <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="eyebrow">{t("developer.earnings.totalEarned")}</CardDescription>
            <DollarSign className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div data-testid="total-earned" className="font-display text-3xl font-medium text-success">
              {formatCurrency(current.total_earned, currency, locale)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("developer.earnings.totalEarnedHint")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="eyebrow">{t("developer.earnings.pending")}</CardDescription>
            <Clock className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-medium text-ink-50">
              {formatCurrency(current.pending_payments, currency, locale)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("developer.earnings.pendingHint")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="eyebrow">{t("developer.earnings.thisMonth")}</CardDescription>
            <TrendingUp className="h-5 w-5 text-info" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-medium text-ink-50">
              {formatCurrency(current.this_month, currency, locale)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("developer.earnings.thisMonthHint")}
            </p>
          </CardContent>
        </Card>
      </div>}

      {/* Payments Table */}
      {summary && <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            {t("developer.earnings.historyTitle")}
          </CardTitle>
          <CardDescription>{t("connect.historyMeaning")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Wallet className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("developer.earnings.emptyTitle")}</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                {t("developer.earnings.emptyBody")}
              </p>
              <Link href="/developer/tasks">
                <Button variant="outline" size="sm">
                  {t("developer.earnings.emptyCta")}
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("developer.earnings.column.task")}</TableHead>
                  <TableHead>{t("developer.earnings.column.agent")}</TableHead>
                  <TableHead className="text-right">{t("developer.earnings.column.gross")}</TableHead>
                  <TableHead className="text-right">{t("developer.earnings.column.fee")}</TableHead>
                  <TableHead className="text-right">{t("developer.earnings.column.net")}</TableHead>
                  <TableHead>{t("developer.earnings.column.status")}</TableHead>
                  <TableHead>{t("developer.earnings.column.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Link
                        href={`/developer/tasks/${payment.task_id}`}
                        className="font-medium text-ink-100 transition-colors hover:text-signal-400"
                      >
                        {payment.task_title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.agent_name}
                      <p className="text-xs">{t(paymentProviderKey(payment.provider))}</p>
                      {payment.payout_error && <p className="text-xs text-danger">{payment.payout_error}</p>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-ink-100">
                      {formatCurrency(payment.gross_amount, payment.currency, locale)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      -{formatCurrency(payment.platform_fee, payment.currency, locale)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold text-success">
                      {formatCurrency(payment.net_amount, payment.currency, locale)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={paymentStatusBadgeVariant(payment.status)}
                        className="text-xs"
                      >
                        {payment.provider === "stripe_connect" && payment.status === "paid" ? t("billing.status.transferred") : t(billingStatusKey(payment.status))}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDate(payment.created_at, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={loading || page === 0} onClick={() => setPage(page - 1)}>{t("billing.previous")}</Button>
        <span className="text-sm text-muted-foreground">{t("billing.page", { page: page + 1 })}</span>
        <Button variant="outline" disabled={loading || (page + 1) * 50 >= total} onClick={() => setPage(page + 1)}>{t("billing.next")}</Button>
      </div>
      </>}
    </div>
  );
}
