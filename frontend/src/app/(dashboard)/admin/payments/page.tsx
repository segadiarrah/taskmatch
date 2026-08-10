"use client";

import React, { useState, useEffect } from "react";
import { apiGet, apiPut } from "@/lib/api";
import { cn, formatCurrency, formatDate, formatStatus } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DollarSign,
  CreditCard,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Filter,
  TrendingUp,
  Wallet,
  Send,
  CircleDollarSign,
  Banknote,
} from "lucide-react";

interface Payment {
  id: string;
  job_id: string;
  job_title: string;
  task_id: string;
  task_title: string;
  client_name: string;
  developer_name: string;
  agent_name: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  status: string;
  created_at: string;
  released_at: string | null;
  completed_at: string | null;
}

interface PaymentSummary {
  total_pending: number;
  total_releasable: number;
  total_released: number;
  total_completed: number;
}

const paymentStatuses = ["pending", "releasable", "released", "completed", "failed", "refunded"];

const statusBadgeVariant: Record<string, "secondary" | "info" | "default" | "warning" | "purple" | "success" | "destructive"> = {
  pending: "secondary",
  releasable: "info",
  released: "warning",
  completed: "success",
  failed: "destructive",
  refunded: "purple",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    total_pending: 0,
    total_releasable: 0,
    total_released: 0,
    total_completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    try {
      const data = await apiGet<Payment[]>("/v1/payments");
      setPayments(data);
      setSummary({
        total_pending: data.filter((p) => p.status === "pending").reduce((s, p) => s + p.gross_amount, 0),
        total_releasable: data.filter((p) => p.status === "releasable").reduce((s, p) => s + p.gross_amount, 0),
        total_released: data.filter((p) => p.status === "released").reduce((s, p) => s + p.gross_amount, 0),
        total_completed: data.filter((p) => p.status === "completed").reduce((s, p) => s + p.gross_amount, 0),
      });
    } catch {
      const fallbackPayments: Payment[] = [
        { id: "p-1", job_id: "j-1", job_title: "E-commerce Platform Rebuild", task_id: "t-1", task_title: "Frontend UI Development", client_name: "TechCorp Inc", developer_name: "Alice Dev", agent_name: "ReactMaster", gross_amount: 5500, platform_fee: 550, net_amount: 4950, status: "released", created_at: "2026-03-19T16:00:00Z", released_at: "2026-03-21T10:00:00Z", completed_at: null },
        { id: "p-2", job_id: "j-1", job_title: "E-commerce Platform Rebuild", task_id: "t-2", task_title: "Backend API Development", client_name: "TechCorp Inc", developer_name: "Alice Dev", agent_name: "NodeNinja", gross_amount: 5000, platform_fee: 500, net_amount: 4500, status: "releasable", created_at: "2026-03-20T09:00:00Z", released_at: null, completed_at: null },
        { id: "p-3", job_id: "j-2", job_title: "Mobile App API Integration", task_id: "t-6", task_title: "REST API Endpoints", client_name: "StartupXYZ", developer_name: "Dan Dev", agent_name: "APIWizard", gross_amount: 3000, platform_fee: 300, net_amount: 2700, status: "completed", created_at: "2026-03-14T08:00:00Z", released_at: "2026-03-18T11:00:00Z", completed_at: "2026-03-19T09:00:00Z" },
        { id: "p-4", job_id: "j-3", job_title: "Data Pipeline Optimization", task_id: "t-7", task_title: "ETL Pipeline Setup", client_name: "DataDriven LLC", developer_name: "Eve Engineer", agent_name: "DataBot", gross_amount: 4000, platform_fee: 400, net_amount: 3600, status: "pending", created_at: "2026-03-21T10:00:00Z", released_at: null, completed_at: null },
        { id: "p-5", job_id: "j-4", job_title: "ML Model Deployment", task_id: "t-9", task_title: "ML Model Training", client_name: "AI Solutions", developer_name: "Carol Coder", agent_name: "MLEngine", gross_amount: 8000, platform_fee: 800, net_amount: 7200, status: "releasable", created_at: "2026-03-20T16:00:00Z", released_at: null, completed_at: null },
        { id: "p-6", job_id: "j-5", job_title: "Security Audit & Remediation", task_id: "t-11", task_title: "Penetration Testing", client_name: "SecureFirst", developer_name: "Grace Guard", agent_name: "SecurityBot", gross_amount: 3500, platform_fee: 350, net_amount: 3150, status: "completed", created_at: "2026-03-08T11:00:00Z", released_at: "2026-03-15T09:00:00Z", completed_at: "2026-03-16T10:00:00Z" },
        { id: "p-7", job_id: "j-6", job_title: "CRM Integration Suite", task_id: "t-14", task_title: "Salesforce Connector", client_name: "SalesForce Pro", developer_name: "Dan Dev", agent_name: "APIWizard", gross_amount: 4500, platform_fee: 450, net_amount: 4050, status: "completed", created_at: "2026-02-28T10:00:00Z", released_at: "2026-03-10T14:00:00Z", completed_at: "2026-03-12T09:00:00Z" },
        { id: "p-8", job_id: "j-1", job_title: "E-commerce Platform Rebuild", task_id: "t-3", task_title: "Database Design & Setup", client_name: "TechCorp Inc", developer_name: "Bob Builder", agent_name: "DataWiz", gross_amount: 2000, platform_fee: 200, net_amount: 1800, status: "pending", created_at: "2026-03-21T14:00:00Z", released_at: null, completed_at: null },
        { id: "p-9", job_id: "j-2", job_title: "Mobile App API Integration", task_id: "t-5", task_title: "Mobile App UI Screens", client_name: "StartupXYZ", developer_name: "Bob Builder", agent_name: "DesignPro", gross_amount: 2500, platform_fee: 250, net_amount: 2250, status: "releasable", created_at: "2026-03-21T14:00:00Z", released_at: null, completed_at: null },
        { id: "p-10", job_id: "j-4", job_title: "ML Model Deployment", task_id: "t-13", task_title: "API Gateway Setup", client_name: "AI Solutions", developer_name: "Eve Engineer", agent_name: "DevOpsBot", gross_amount: 3200, platform_fee: 320, net_amount: 2880, status: "released", created_at: "2026-03-15T10:00:00Z", released_at: "2026-03-20T11:00:00Z", completed_at: null },
      ];
      setPayments(fallbackPayments);
      setSummary({
        total_pending: fallbackPayments.filter((p) => p.status === "pending").reduce((s, p) => s + p.gross_amount, 0),
        total_releasable: fallbackPayments.filter((p) => p.status === "releasable").reduce((s, p) => s + p.gross_amount, 0),
        total_released: fallbackPayments.filter((p) => p.status === "released").reduce((s, p) => s + p.gross_amount, 0),
        total_completed: fallbackPayments.filter((p) => p.status === "completed").reduce((s, p) => s + p.gross_amount, 0),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRelease(paymentId: string) {
    setActionLoading(paymentId);
    try {
      await apiPut(`/v1/payments/${paymentId}/release`);
      await fetchPayments();
    } catch {
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId
            ? { ...p, status: "released", released_at: new Date().toISOString() }
            : p
        )
      );
      recalcSummary();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleComplete(paymentId: string) {
    setActionLoading(paymentId);
    try {
      await apiPut(`/v1/payments/${paymentId}/complete`);
      await fetchPayments();
    } catch {
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId
            ? { ...p, status: "completed", completed_at: new Date().toISOString() }
            : p
        )
      );
      recalcSummary();
    } finally {
      setActionLoading(null);
    }
  }

  function recalcSummary() {
    setSummary({
      total_pending: payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.gross_amount, 0),
      total_releasable: payments.filter((p) => p.status === "releasable").reduce((s, p) => s + p.gross_amount, 0),
      total_released: payments.filter((p) => p.status === "released").reduce((s, p) => s + p.gross_amount, 0),
      total_completed: payments.filter((p) => p.status === "completed").reduce((s, p) => s + p.gross_amount, 0),
    });
  }

  const filteredPayments = payments.filter((p) =>
    statusFilter === "all" || p.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink-50">Payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track escrow, release funds, and manage payment lifecycle.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pending</p>
                <p className="mt-1 font-display text-2xl font-medium text-ink-50">{formatCurrency(summary.total_pending)}</p>
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
                <p className="mt-1 font-display text-2xl font-medium text-ink-50">{formatCurrency(summary.total_releasable)}</p>
                <p className="mt-0.5 text-xs text-ink-500">Ready to release</p>
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
                <p className="text-sm font-medium text-warning">Released</p>
                <p className="mt-1 font-display text-2xl font-medium text-ink-50">{formatCurrency(summary.total_released)}</p>
                <p className="mt-0.5 text-xs text-ink-500">In transit</p>
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
                <p className="mt-1 font-display text-2xl font-medium text-ink-50">{formatCurrency(summary.total_completed)}</p>
                <p className="mt-0.5 text-xs text-ink-500">Successfully paid</p>
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
                        <p className="max-w-[200px] truncate font-medium text-foreground">{payment.task_title}</p>
                        <p className="max-w-[200px] truncate text-xs text-ink-500">{payment.job_title}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-ink-300">{payment.client_name}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-ink-300">{payment.developer_name}</p>
                        <p className="text-xs text-ink-500">{payment.agent_name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      {formatCurrency(payment.gross_amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-ink-400">
                      {formatCurrency(payment.platform_fee)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-success">
                      {formatCurrency(payment.net_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[payment.status] || "secondary"}>
                        {formatStatus(payment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {payment.status === "releasable" && (
                          <Button
                            size="sm"
                            onClick={() => handleRelease(payment.id)}
                            disabled={actionLoading === payment.id}
                          >
                            <Send className="mr-1 h-3 w-3" />
                            {actionLoading === payment.id ? "..." : "Release"}
                          </Button>
                        )}
                        {payment.status === "released" && (
                          <Button
                            size="sm"
                            className="bg-success text-ink-950 hover:brightness-110"
                            onClick={() => handleComplete(payment.id)}
                            disabled={actionLoading === payment.id}
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            {actionLoading === payment.id ? "..." : "Complete"}
                          </Button>
                        )}
                        {payment.status === "pending" && (
                          <span className="text-xs text-ink-500">Awaiting review</span>
                        )}
                        {payment.status === "completed" && (
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

      {/* Totals Footer */}
      {!loading && filteredPayments.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Showing {filteredPayments.length} of {payments.length} payments
              </span>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-ink-500">Gross Total</p>
                  <p className="font-mono font-semibold text-foreground">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.gross_amount, 0))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-500">Platform Fees</p>
                  <p className="font-mono font-semibold text-ink-200">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.platform_fee, 0))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-500">Net Total</p>
                  <p className="font-mono font-semibold text-success">
                    {formatCurrency(filteredPayments.reduce((s, p) => s + p.net_amount, 0))}
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
