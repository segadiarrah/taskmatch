"use client";

import React, { useState, useEffect } from "react";
import { DataLoadError } from "@/components/dashboard/data-load-error";
import { apiGet, apiPut } from "@/lib/api";
import { formatCurrency, formatStatus } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Filter,
  Send,
  CircleDollarSign,
} from "lucide-react";

interface Payment {
  id: string;
  job_id: string;
  job_title: string;
  task_id: string;
  task_title: string;
  client_name: string;
  developer_name: string;
  currency: string;
  provider: string;
  provider_ref: string | null;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  status: string;
  created_at: string;
  released_at: string | null;
  completed_at: string | null;
}

const paymentStatuses = ["pending", "authorized", "releasable", "paid", "cancelled", "refunded"];

const statusBadgeVariant: Record<string, "secondary" | "info" | "default" | "warning" | "purple" | "success" | "destructive"> = {
  pending: "secondary",
  releasable: "info",
  authorized: "warning",
  paid: "success",
  cancelled: "destructive",
  refunded: "purple",
};

export default function PaymentsPage() {
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments(0);
  }, []);

  async function fetchPayments(nextPage: number) {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await apiGet<Payment[]>(nextPage === 0 ? "/v1/admin/payments" : `/v1/admin/payments?skip=${nextPage * 200}&limit=200`);
      setPayments(data);
      setPage(nextPage);
      setHasNextPage(data.length === 200);
    } catch {
      setLoadError(true);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRelease(paymentId: string) {
    setActionError(null);
    setActionLoading(paymentId);
    try {
      await apiPut(`/v1/payments/${paymentId}/release`);
      await fetchPayments(page);
    } catch {
      setActionError("The request failed. No change was saved. Please try again.");
      return;
    } finally {
      setActionLoading(null);
    }
  }

  async function handleComplete(paymentId: string) {
    if (!window.confirm("Confirm that this payment has already been settled externally. This action records the payment; it does not transfer money.")) return;
    setActionError(null);
    setActionLoading(paymentId);
    try {
      await apiPut(`/v1/payments/${paymentId}/complete`);
      await fetchPayments(page);
    } catch {
      setActionError("The request failed. No change was saved. Please try again.");
      return;
    } finally {
      setActionLoading(null);
    }
  }

  const currency = currencyFilter || payments[0]?.currency || "EUR";
  const currencyPayments = payments.filter((payment) => payment.currency === currency);
  const totalFor = (status: string) => currencyPayments.filter((payment) => payment.status === status).reduce((total, payment) => total + payment.gross_amount, 0);
  const summary = { total_pending: totalFor("pending"), total_releasable: totalFor("releasable"), total_released: totalFor("authorized"), total_completed: totalFor("paid") };
  const filteredPayments = currencyPayments.filter((payment) => statusFilter === "all" || payment.status === statusFilter);

  return (
    <div className="space-y-6">
      {actionError && <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{actionError}</p>}
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink-50">Payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage payment records. Settle funds externally, then record the payment here.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">Totals below cover the payments on page {page + 1} in the selected currency.</p>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pending</p>
                <p className="mt-1 font-display text-2xl font-medium text-ink-50">{formatCurrency(summary.total_pending, currency)}</p>
                <p className="mt-0.5 text-xs text-ink-500">Awaiting validation</p>
              </div>
              <div className="rounded-md border border-ink-700 bg-ink-800 p-3">
                <Clock className="h-5 w-5 text-ink-400" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-3 -right-3 h-20 w-20 rounded-full bg-ink-800/50" />
        </Card>
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-info">Releasable</p>
                <p className="mt-1 font-display text-2xl font-medium text-ink-50">{formatCurrency(summary.total_releasable, currency)}</p>
                <p className="mt-0.5 text-xs text-ink-500">Ready for external settlement</p>
              </div>
              <div className="rounded-md border border-info/30 bg-info/10 p-3">
                <Send className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-3 -right-3 h-20 w-20 rounded-full bg-info/5" />
        </Card>
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warning">Authorized</p>
                <p className="mt-1 font-display text-2xl font-medium text-ink-50">{formatCurrency(summary.total_released, currency)}</p>
                <p className="mt-0.5 text-xs text-ink-500">Authorization recorded</p>
              </div>
              <div className="rounded-md border border-warning/30 bg-warning/10 p-3">
                <ArrowUpRight className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-3 -right-3 h-20 w-20 rounded-full bg-warning/5" />
        </Card>
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-success">Completed</p>
                <p className="mt-1 font-display text-2xl font-medium text-ink-50">{formatCurrency(summary.total_completed, currency)}</p>
                <p className="mt-0.5 text-xs text-ink-500">Recorded as paid</p>
              </div>
              <div className="rounded-md border border-success/30 bg-success/10 p-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-3 -right-3 h-20 w-20 rounded-full bg-success/5" />
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-ink-500" />
            <Select aria-label="Currency" value={currency} onChange={(event) => setCurrencyFilter(event.target.value)} className="w-28">
              {Array.from(new Set(payments.map((payment) => payment.currency))).map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-44"
            >
              <option value="all">All Statuses</option>
              {paymentStatuses.map((s) => (
                <option key={s} value={s}>{formatStatus(s)}</option>
              ))}
            </Select>
            <span className="font-mono text-sm text-ink-500">
              {filteredPayments.length} payment{filteredPayments.length !== 1 ? "s" : ""}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-700 border-t-signal-500" />
                <p className="text-sm text-muted-foreground">Loading payments...</p>
              </div>
            </div>
          ) : loadError ? (
            <DataLoadError onRetry={() => fetchPayments(page)} />
          ) : filteredPayments.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <CircleDollarSign className="h-10 w-10 text-ink-600" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">No payments found</p>
              <p className="text-xs text-ink-500">Try adjusting the status filter</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job / Task</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="max-w-[200px] truncate font-medium text-foreground">{payment.task_title || "Job payment"}</p>
                        <p className="max-w-[200px] truncate text-xs text-ink-500">{payment.job_title}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-ink-300">{payment.client_name}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-ink-300">{payment.developer_name || "Unassigned"}</p>
                        <p className="text-xs text-ink-500">{payment.provider}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      {formatCurrency(payment.gross_amount, payment.currency)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-ink-400">
                      {formatCurrency(payment.platform_fee, payment.currency)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-success">
                      {formatCurrency(payment.net_amount, payment.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[payment.status] || "secondary"}>
                        {formatStatus(payment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {["pending", "authorized"].includes(payment.status) && (
                          <Button
                            size="sm"
                            onClick={() => handleRelease(payment.id)}
                            disabled={actionLoading === payment.id}
                          >
                            <Send className="mr-1 h-3 w-3" />
                            {actionLoading === payment.id ? "..." : "Mark releasable"}
                          </Button>
                        )}
                        {payment.status === "releasable" && (
                          <Button
                            size="sm"
                            className="bg-success text-ink-950 hover:brightness-110"
                            onClick={() => handleComplete(payment.id)}
                            disabled={actionLoading === payment.id}
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            {actionLoading === payment.id ? "..." : "Record payment"}
                          </Button>
                        )}
                        {payment.status === "paid" && (
                          <span className="flex items-center gap-1 font-mono text-xs font-medium text-success">
                            <CheckCircle2 className="h-3 w-3" />
                            Paid
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={loading || page === 0} onClick={() => fetchPayments(page - 1)}>Previous page</Button>
        <span className="text-sm text-muted-foreground">Page {page + 1}</span>
        <Button variant="outline" disabled={loading || !hasNextPage} onClick={() => fetchPayments(page + 1)}>Next page</Button>
      </div>

      {/* Totals Footer */}
      {!loading && filteredPayments.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Showing {filteredPayments.length} of {payments.length} loaded payments ({currency})
              </span>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-ink-500">Gross Total</p>
                  <p className="font-mono font-semibold text-foreground">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.gross_amount, 0), currency)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-500">Platform Fees</p>
                  <p className="font-mono font-semibold text-ink-200">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.platform_fee, 0), currency)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-500">Net Total</p>
                  <p className="font-mono font-semibold text-success">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.net_amount, 0), currency)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
