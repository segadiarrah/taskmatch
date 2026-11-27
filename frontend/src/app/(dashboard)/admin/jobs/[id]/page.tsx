"use client";

import { statusTimeline } from "@/lib/admin-vocabulary";

import { useAdminCopy, adminSource, adminError } from "@/lib/admin-copy";

import React, { useState, useEffect, useCallback } from "react";
import { DataLoadError } from "@/components/dashboard/data-load-error";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import { loadAdminJobDetail, type AdminJobDetail } from "@/lib/admin-details";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Sparkles,
  Network,
  Clock,
  DollarSign,
  CalendarDays,
  User,
  FileText,
  ListChecks,
  Brain,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";

const statusBadgeVariant: Record<string, "secondary" | "info" | "default" | "warning" | "purple" | "success" | "destructive"> = {
  draft: "secondary",
  submitted: "info",
  formatted: "default",
  bidding: "warning",
  in_progress: "warning",
  under_review: "purple",
  completed: "success",
  cancelled: "destructive",
  open: "info",
  assigned: "warning",
  pending_validation: "purple",
  approved: "success",
  rejected: "destructive",
};



function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const { formatStatus } = useAdminCopy();
  const currentIndex = statusTimeline.indexOf(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {statusTimeline.map((status, index) => {
        const isCompleted = !isCancelled && index <= currentIndex;
        const isCurrent = status === currentStatus;
        return (
          <React.Fragment key={status}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted
                    ? "border-success bg-success text-ink-950"
                    : isCancelled
                    ? "border-danger/40 bg-danger/10 text-danger"
                    : "border-ink-700 bg-ink-900 text-ink-500"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isCancelled ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <span
                className={cn(
                  "mt-1 text-[10px] font-medium capitalize",
                  isCurrent ? "text-ink-50" : "text-ink-500"
                )}
              >
                {formatStatus(status)}
              </span>
            </div>
            {index < statusTimeline.length - 1 && (
              <div
                className={cn(
                  "mb-4 h-0.5 w-6 flex-shrink-0",
                  !isCancelled && index < currentIndex
                    ? "bg-success"
                    : "bg-ink-700"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function JobDetailPage() {
  const { a, formatStatus, formatDate, formatDateTime, formatCurrency, formatNumber, formatPercent } = useAdminCopy();
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<AdminJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJob = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await loadAdminJobDetail(apiGet, jobId);
      setJob(data);
    } catch {
      setLoadError(true);
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  async function handleFormat() {
    if (!job) return;
    setActionError(null);
    setActionLoading(true);
    try {
      await apiPost(`/v1/mcp/format-job/${jobId}`);
      await fetchJob();
    } catch (error) {
      setActionError(adminError(error, adminSource("The request failed. Please refresh and try again.")));
      return;
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDecompose() {
    if (!job) return;
    setActionError(null);
    setActionLoading(true);
    try {
      await apiPost(`/v1/mcp/decompose-job/${jobId}`);
      await fetchJob();
    } catch (error) {
      setActionError(adminError(error, adminSource("The request failed. Please refresh and try again.")));
      return;
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-700 border-t-signal-500" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8">
        <DataLoadError onRetry={fetchJob} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">{a("Job not found.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {actionError && <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{a(actionError)}</p>}
      {/* Back + Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/jobs")}
          className="mb-4 text-muted-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />{a("Back to Jobs")}</Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-medium tracking-tight text-ink-50">{job.title}</h1>
              <Badge variant={statusBadgeVariant[job.status] || "secondary"}>
                {formatStatus(job.status)}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {job.client_name}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {formatCurrency(job.budget_min, job.currency)} - {formatCurrency(job.budget_max, job.currency)}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />{a("Due")} {formatDate(job.deadline)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />{a("Created")} {formatDate(job.created_at)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {job.status === "submitted" && (
              <Button onClick={handleFormat} disabled={actionLoading}>
                <Sparkles className="mr-2 h-4 w-4" />{a("Format Job")}</Button>
            )}
            {job.status === "formatted" && (
              <Button onClick={handleDecompose} disabled={actionLoading}>
                <Network className="mr-2 h-4 w-4" />{a("Decompose Job")}</Button>
            )}

          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">{a("Status Timeline")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTimeline currentStatus={job.status} />
        </CardContent>
      </Card>

      {/* Description comparison */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <FileText className="h-4 w-4 text-ink-500" />{a("Raw Description")}</CardTitle>
            <CardDescription>{a("Original client submission")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-ink-800 bg-ink-900 p-4 text-sm leading-relaxed text-ink-200 whitespace-pre-wrap">
              {job.description_raw || a("No raw description available.")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Sparkles className="h-4 w-4 text-signal-400" />{a("Formatted Summary")}</CardTitle>
            <CardDescription>{a("AI-structured version")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-signal-500/20 bg-signal-500/5 p-4 text-sm leading-relaxed text-ink-200 whitespace-pre-wrap">
              {job.description_formatted || a("Not yet formatted. Click 'Format Job' to process.")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <ListChecks className="h-4 w-4 text-ink-500" />{a("Tasks ({count})", { count: job.tasks.length })}
              </CardTitle>
              <CardDescription>{a("Decomposed work items for this job")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {job.tasks.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-center">
              <ListChecks className="h-8 w-8 text-ink-600" />
              <p className="mt-2 text-sm text-ink-500">{a("No tasks yet. Decompose this job to create tasks.")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{a("Title")}</TableHead>
                  <TableHead>{a("Type")}</TableHead>
                  <TableHead>{a("Status")}</TableHead>
                  <TableHead className="text-right">{a("Budget")}</TableHead>
                  <TableHead>{a("Priority")}</TableHead>
                  <TableHead>{a("Assigned")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {job.tasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/tasks/${task.id}`)}
                  >
                    <TableCell className="font-medium text-foreground">{task.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatStatus(task.task_type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[task.status] || "secondary"}>
                        {formatStatus(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-foreground">
                      {task.budget === null ? "—" : formatCurrency(task.budget, job.currency)}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "font-mono text-sm font-medium",
                        task.priority === 1 ? "text-danger" :
                        task.priority === 2 ? "text-warning" : "text-ink-500"
                      )}>
                        {a("Priority")} {formatNumber(task.priority)}
                      </span>
                    </TableCell>
                    <TableCell className="text-ink-400">
                      {task.assigned_agent || a("Unassigned")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* MCP Decisions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <Brain className="h-4 w-4 text-[#b49aff]" />{a("MCP Decisions")}</CardTitle>
          <CardDescription>{a("AI reasoning and decisions for this job")}</CardDescription>
        </CardHeader>
        <CardContent>
          {job.mcp_decisions.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-ink-500">{a("No MCP decisions recorded yet.")}</div>
          ) : (
            <div className="space-y-4">
              {job.mcp_decisions.map((decision) => (
                <div
                  key={decision.id}
                  className="rounded-md border border-ink-800 bg-ink-900/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="purple">{formatStatus(decision.decision_type)}</Badge>
                      <span className="font-mono text-xs text-ink-500">
                        {formatDateTime(decision.created_at)}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-medium text-ink-400">{a("Confidence:")} {decision.confidence === null ? "—" : formatPercent(decision.confidence)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-300">
                    {decision.reasoning}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
