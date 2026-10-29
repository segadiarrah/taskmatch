"use client";

import { ExecutionPanel } from "./execution-panel";
import React, { useState, useEffect, useCallback } from "react";
import { DataLoadError } from "@/components/dashboard/data-load-error";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import { loadAdminTaskDetail, type AdminTaskDetail } from "@/lib/admin-details";
import { Select } from "@/components/ui/select";
import { cn, formatCurrency, formatDate, formatStatus, formatDateTime, timeAgo } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Bot,
  Target,
  Gavel,
  UserCheck,
  FileCheck,
  ShieldCheck,
  Clock,
  DollarSign,
  Star,
  TrendingUp,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

const statusBadgeVariant: Record<string, "secondary" | "info" | "default" | "warning" | "purple" | "success" | "destructive"> = {
  open: "info",
  bidding: "warning",
  assigned: "default",
  in_progress: "warning",
  pending_validation: "purple",
  completed: "success",
  approved: "success",
  rejected: "destructive",
  cancelled: "destructive",
  pending: "warning",
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [task, setTask] = useState<AdminTaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");

  const fetchTask = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setLoadError(false);
    try {
      const data = await loadAdminTaskDetail(apiGet, taskId);
      setTask(data);
    } catch {
      setLoadError(true);
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  async function handleAction(action: string) {
    setActionError(null);
    setActionLoading(true);
    try {
      if (action === "match-agents") {
        await apiPost(`/v1/mcp/match-agents/${taskId}`);
      } else if (action === "validate") {
        const submission = task?.submissions.find(item => ["submitted", "under_review"].includes(item.status));
        if (!submission) throw new Error("No submission to validate");
        await apiPost(`/v1/mcp/validate-submission/${submission.id}`);
      } else if (action === "assign") {
        if (!selectedAgentId) throw new Error("Select an agent before assigning this task");
        await apiPost(`/v1/tasks/${taskId}/assign?agent_id=${encodeURIComponent(selectedAgentId)}`);
      }
      await fetchTask();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The request failed. Please refresh and try again.");
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
        <DataLoadError onRetry={fetchTask} />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Task not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {actionError && <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{actionError}</p>}
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/tasks")}
          className="mb-4 text-muted-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Tasks
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-medium tracking-tight text-ink-50">{task.title}</h1>
              <Badge variant={statusBadgeVariant[task.status] || "secondary"}>
                {formatStatus(task.status)}
              </Badge>
              <span className={cn(
                "font-mono text-sm font-bold",
                task.priority === 1 ? "text-danger" :
                task.priority === 2 ? "text-warning" : "text-ink-500"
              )}>
                P{task.priority}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <button
                className="flex items-center gap-1 hover:text-signal-400"
                onClick={() => router.push(`/admin/jobs/${task.job_id}`)}
              >
                Job: {task.job_title}
              </button>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {task.budget === null ? "—" : formatCurrency(task.budget, task.currency)}
              </span>
              <Badge variant="outline">{formatStatus(task.task_type)}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("match-agents")}
              disabled={actionLoading}
            >
              <Target className="mr-1 h-4 w-4" />
              Match Agents
            </Button>
            <Select
              aria-label="Agent to assign"
              value={selectedAgentId}
              onChange={(event) => setSelectedAgentId(event.target.value)}
              disabled={actionLoading || !["open_for_bids", "pending", "reassigned"].includes(task.status)}
              className="w-44"
            >
              <option value="">Select an agent</option>
              {task.matched_agents.filter(agent => agent.capability_score > 0).map(agent => (
                <option key={agent.agent_id} value={agent.agent_id}>{agent.agent_name}</option>
              ))}
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("assign")}
              disabled={actionLoading || !selectedAgentId || !["open_for_bids", "pending", "reassigned"].includes(task.status)}
            >
              <UserCheck className="mr-1 h-4 w-4" />
              Assign
            </Button>
            <Button
              size="sm"
              onClick={() => handleAction("validate")}
              disabled={actionLoading || !task.submissions.some(item => ["submitted", "under_review"].includes(item.status))}
            >
              <ShieldCheck className="mr-1 h-4 w-4" />
              Run structural validation
            </Button>
          </div>
        </div>
      </div>

      {/* Task info */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-ink-300">{task.description}</p>
        </CardContent>
      </Card>

      <ExecutionPanel key={taskId} taskId={taskId} submissions={task.submissions} onChanged={() => fetchTask(true)} />

      {/* Assigned Agent + Agent Matching Panel */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <UserCheck className="h-4 w-4 text-success" />
              Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {task.assigned_agent ? (
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-success/30 bg-success/10 font-display text-lg font-medium text-success">
                  {task.assigned_agent.agent_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{task.assigned_agent.agent_name}</p>
                  <div className="mt-2 flex gap-4 text-xs text-ink-400">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-warning" />
                      {task.assigned_agent.avg_score.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-success" />
                      {(task.assigned_agent.success_rate * 100).toFixed(0)}%
                    </span>
                    <span>{task.assigned_agent.completed_tasks} completed</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex h-20 items-center justify-center text-sm text-ink-500">
                {["assigned", "in_progress", "submitted", "approved", "validation_failed"].includes(task.status) ? "Assignment details are not available." : "No agent assigned yet"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Matched Agents Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Target className="h-4 w-4 text-info" />
              Agent Matching
            </CardTitle>
            <CardDescription>Ranked by composite score</CardDescription>
          </CardHeader>
          <CardContent>
            {task.matched_agents.length === 0 ? (
              <div className="flex h-20 items-center justify-center text-sm text-ink-500">
                No agents matched. Run matching to find candidates.
              </div>
            ) : (
              <div className="space-y-3">
                {task.matched_agents.map((agent, i) => (
                  <div key={agent.agent_id} className="flex items-center gap-3">
                    <span className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold",
                      i === 0 ? "bg-signal-500/15 text-signal-400" :
                      i === 1 ? "bg-ink-700 text-ink-200" :
                      i === 2 ? "bg-warning/15 text-warning" :
                      "bg-ink-800 text-ink-500"
                    )}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{agent.agent_name}</p>
                      <p className="text-xs text-ink-500">{agent.reasons.join(" · ")}</p>
                    </div>
                    <div className="w-24">
                      <Progress value={agent.match_score * 100} />
                    </div>
                    <span className="w-12 text-right font-mono text-sm font-semibold text-ink-200">
                      {(agent.match_score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bids */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <Gavel className="h-4 w-4 text-warning" />
            Bids ({task.bids.length})
          </CardTitle>
          <CardDescription>Agent proposals, newest first</CardDescription>
        </CardHeader>
        <CardContent>
          {task.bids.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-ink-500">
              No bids received yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Est. Hours</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {task.bids.map((bid) => (
                  <TableRow key={bid.id}>
                    <TableCell><Badge variant="secondary">{formatStatus(bid.status)}</Badge></TableCell>
                    <TableCell className="font-medium text-foreground">{bid.agent_name}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      {formatCurrency(bid.amount, task.currency)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-ink-300">{bid.estimated_hours}h</TableCell>
                    <TableCell className="max-w-xs truncate text-ink-400">{bid.message}</TableCell>
                    <TableCell className="font-mono text-xs text-ink-500">{timeAgo(bid.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <FileCheck className="h-4 w-4 text-info" />
            Submissions ({task.submissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {task.submissions.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-ink-500">
              No submissions yet.
            </div>
          ) : (
            <div className="space-y-4">
              {task.submissions.map((sub) => (
                <div key={sub.id} className="rounded-md border border-ink-800 bg-ink-900/40 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{sub.agent_name}</span>
                      <Badge variant={statusBadgeVariant[sub.status] || "secondary"}>
                        {formatStatus(sub.status)}
                      </Badge>
                    </div>
                    <span className="font-mono text-xs text-ink-500">{timeAgo(sub.submitted_at)}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-300">{sub.summary}</p>
                  <details className="mt-3 text-sm text-ink-300"><summary className="cursor-pointer text-signal-400">Inspect submitted result</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md border border-ink-700 p-4">{JSON.stringify(sub.output_json, null, 2)}</pre></details>
                  {sub.deliverable_url && (
                    <a
                      href={sub.deliverable_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-medium text-info hover:text-info/80 hover:underline"
                    >
                      View Deliverable &rarr;
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <ShieldCheck className="h-4 w-4 text-[#b49aff]" />
            Validation Reviews ({task.validations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {task.validations.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-ink-500">
              No validations yet.
            </div>
          ) : (
            <div className="space-y-4">
              {task.validations.map((val) => (
                <div key={val.id} className="rounded-md border border-ink-800 bg-ink-900/40 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {val.result === "approved" ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : val.result === "rejected" ? (
                        <XCircle className="h-5 w-5 text-danger" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-warning" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Reviewed by {val.reviewer}
                        </p>
                        <p className="font-mono text-xs text-ink-500">
                          {formatDateTime(val.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-warning" />
                        <span className="font-mono text-sm font-semibold text-ink-200">{val.score === null ? "—" : val.score.toFixed(1)}</span>
                      </div>
                      <Badge variant={val.result === "approved" ? "success" : val.result === "rejected" ? "destructive" : "warning"}>
                        {formatStatus(val.result)}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-ink-300">{val.notes}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
