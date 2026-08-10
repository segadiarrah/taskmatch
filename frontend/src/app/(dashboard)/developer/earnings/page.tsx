"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { formatCurrency, formatDate, formatStatus } from "@/lib/utils";
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

interface EarningsSummary {
  total_earned: number;
  pending_payments: number;
  this_month: number;
  currency: string;
}

interface Payment {
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
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEarnings() {
      try {
        setLoading(true);
        setError(null);

        const [summaryData, paymentsData] = await Promise.all([
          apiGet<EarningsSummary>("/v1/developer/earnings/summary"),
          apiGet<{ items: Payment[] }>("/v1/developer/earnings/payments"),
        ]);

        setSummary(summaryData);
        setPayments(paymentsData.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load earnings data");
      } finally {
        setLoading(false);
      }
    }
    fetchEarnings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currency = summary?.currency ?? "USD";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/developer" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Earnings</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-medium text-ink-50 sm:text-3xl">Earnings</h1>
        <p className="text-muted-foreground mt-1">
          Track your revenue and payment history.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="eyebrow">Total Earned</CardDescription>
            <DollarSign className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-medium text-success">
              {formatCurrency(summary?.total_earned ?? 0, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime earnings after fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="eyebrow">Pending Payments</CardDescription>
            <Clock className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-medium text-ink-50">
              {formatCurrency(summary?.pending_payments ?? 0, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting release or processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="eyebrow">This Month</CardDescription>
            <TrendingUp className="h-5 w-5 text-info" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-medium text-ink-50">
              {formatCurrency(summary?.this_month ?? 0, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Earnings in current billing period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            Payment History
          </CardTitle>
          <CardDescription>All payments from completed tasks</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Wallet className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payments yet</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                Complete tasks to start earning. Your payment history will appear here.
              </p>
              <Link href="/developer/tasks">
                <Button variant="outline" size="sm">
                  Browse Available Tasks
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Platform Fee</TableHead>
                  <TableHead className="text-right">Net Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
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
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-ink-100">
                      {formatCurrency(payment.gross_amount, payment.currency)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      -{formatCurrency(payment.platform_fee, payment.currency)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold text-success">
                      {formatCurrency(payment.net_amount, payment.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={paymentStatusBadgeVariant(payment.status)}
                        className="text-xs"
                      >
                        {formatStatus(payment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDate(payment.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
