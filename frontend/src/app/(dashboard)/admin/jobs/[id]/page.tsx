"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { cn, formatCurrency, formatDate, formatStatus, formatDateTime } from "@/lib/utils";
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
  ArrowLeft,
  Sparkles,
  Network,
  Edit,
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

interface JobDetail {
  id: string;
  title: string;
  description_raw: string;
  description_formatted: string;
  client_id: string;
  client_name: string;
  status: string;
  budget_min: number;
  budget_max: number;
  deadline: string;
  created_at: string;
  updated_at: string;
  status_history: StatusChange[];
  tasks: TaskSummary[];
  mcp_decisions: MCPDecision[];
}

interface StatusChange {
  from_status: string;
  to_status: string;
  changed_at: string;
  changed_by: string;
  reason?: string;
}

interface TaskSummary {
  id: string;
  title: string;
  task_type: string;
  status: string;
  budget: number;
  priority: number;
  assigned_agent?: string;
}

interface MCPDecision {
  id: string;
  decision_type: string;
  reasoning: string;
  created_at: string;
  confidence: number;
}

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

const statusTimeline = ["draft", "submitted", "formatted", "bidding", "in_progress", "under_review", "completed"];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIndex = statusTimeline.indexOf(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  return (
    <div className="flex items-center gap-1">
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
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isCancelled
                    ? "border-red-300 bg-red-50 text-red-400"
                    : "border-zinc-200 bg-white text-zinc-400"
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
                  isCurrent ? "text-zinc-900" : "text-zinc-400"
                )}
              >
                {status.replace(/_/g, " ")}
              </span>
            </div>
            {index < statusTimeline.length - 1 && (
              <div
                className={cn(
                  "mb-4 h-0.5 w-6 flex-shrink-0",
                  !isCancelled && index < currentIndex
                    ? "bg-emerald-500"
                    : "bg-zinc-200"
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
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  async function fetchJob() {
    setLoading(true);
    try {
      const data = await apiGet<JobDetail>(`/v1/jobs/${jobId}`);
      setJob(data);
    } catch {
      setJob({
        id: jobId,
        title: "E-commerce Platform Rebuild",
        description_raw: "We need a complete rebuild of our e-commerce platform. Current tech stack is outdated (PHP/jQuery). Need modern React frontend with Node.js backend. Must support 10k concurrent users, have Stripe integration, inventory management, and admin dashboard. Budget is $15k-25k, need it done by May 2026.",
        description_formatted: "## Project Overview\nComplete rebuild of an existing e-commerce platform, migrating from a legacy PHP/jQuery stack to a modern architecture.\n\n## Technical Requirements\n- **Frontend**: React/Next.js with responsive design\n- **Backend**: Node.js/Express or NestJS REST API\n- **Database**: PostgreSQL with Redis caching\n- **Payment**: Stripe integration (checkout, subscriptions, refunds)\n- **Performance**: Support 10,000+ concurrent users\n\n## Key Deliverables\n1. Product catalog with search and filtering\n2. Shopping cart and checkout flow\n3. Inventory management system\n4. Admin dashboard with analytics\n5. User authentication and profiles\n\n## Constraints\n- Budget: $15,000 - $25,000\n- Deadline: May 1, 2026\n- Must include comprehensive test coverage",
        client_id: "u-5",
        client_name: "TechCorp Inc",
        status: "formatted",
        budget_min: 15000,
        budget_max: 25000,
        deadline: "2026-05-01",
        created_at: "2026-03-15T10:00:00Z",
        updated_at: "2026-03-18T14:30:00Z",
        status_history: [
          { from_status: "draft", to_status: "submitted", changed_at: "2026-03-15T10:05:00Z", changed_by: "Client" },
          { from_status: "submitted", to_status: "formatted", changed_at: "2026-03-18T14:30:00Z", changed_by: "MCP", reason: "Auto-formatted by AI" },
        ],
        tasks: [
          { id: "t-1", title: "Frontend UI Development", task_type: "development", status: "open", budget: 6000, priority: 1 },
          { id: "t-2", title: "Backend API Development", task_type: "development", status: "open", budget: 5000, priority: 1 },
          { id: "t-3", title: "Database Design & Setup", task_type: "development", status: "open", budget: 2000, priority: 2 },
          { id: "t-4", title: "Stripe Integration", task_type: "integration", status: "open", budget: 3000, priority: 2 },
          { id: "t-5", title: "Testing & QA", task_type: "testing", status: "open", budget: 2000, priority: 3 },
        ],
        mcp_decisions: [
          { id: "d-1", decision_type: "format", reasoning: "Structured raw description into standardized format with clear requirements, deliverables, and constraints.", created_at: "2026-03-18T14:30:00Z", confidence: 0.94 },
          { id: "d-2", decision_type: "decompose", reasoning: "Split into 5 tasks based on functional boundaries. Frontend and backend are highest priority for parallel development.", created_at: "2026-03-18T14:32:00Z", confidence: 0.88 },
        ],
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleFormat() {
    if (!job) return;
    setActionLoading(true);
    try {
      await apiPost(`/v1/mcp/format-job/${jobId}`);
      await fetchJob();
    } catch {
      setJob({ ...job, status: "formatted" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDecompose() {
    if (!job) return;
    setActionLoading(true);
    try {
      await apiPost(`/v1/mcp/decompose-job/${jobId}`);
      await fetchJob();
    } catch {
      setJob({ ...job, status: "bidding" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStatusChange() {
    if (!job || !newStatus) return;
    setActionLoading(true);
    try {
      await apiPut(`/v1/jobs/${jobId}`, { status: newStatus });
      await fetchJob();
    } catch {
      setJob({ ...job, status: newStatus });
    } finally {
      setActionLoading(false);
      setEditingStatus(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-zinc-500">Job not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/jobs")}
          className="mb-4 text-zinc-500"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Jobs
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{job.title}</h1>
              <Badge variant={statusBadgeVariant[job.status] || "secondary"}>
                {formatStatus(job.status)}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {job.client_name}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {formatCurrency(job.budget_min)} - {formatCurrency(job.budget_max)}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Due {formatDate(job.deadline)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Created {formatDate(job.created_at)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {job.status === "submitted" && (
              <Button onClick={handleFormat} disabled={actionLoading}>
                <Sparkles className="mr-2 h-4 w-4" />
                Format Job
              </Button>
            )}
            {job.status === "formatted" && (
              <Button onClick={handleDecompose} disabled={actionLoading}>
                <Network className="mr-2 h-4 w-4" />
                Decompose Job
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setEditingStatus(true);
                setNewStatus(job.status);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Status
            </Button>
          </div>
        </div>
      </div>

      {/* Status edit inline */}
      {editingStatus && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <span className="text-sm font-medium text-zinc-700">Change status to:</span>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-48"
            >
              {["draft", "submitted", "formatted", "bidding", "in_progress", "under_review", "completed", "cancelled"].map((s) => (
                <option key={s} value={s}>
                  {formatStatus(s)}
                </option>
              ))}
            </Select>
            <Button size="sm" onClick={handleStatusChange} disabled={actionLoading}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingStatus(false)}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTimeline currentStatus={job.status} />
        </CardContent>
      </Card>

      {/* Description comparison */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-zinc-400" />
              Raw Description
            </CardTitle>
            <CardDescription>Original client submission</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
              {job.description_raw || "No raw description available."}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Formatted Summary
            </CardTitle>
            <CardDescription>AI-structured version</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-indigo-50/50 p-4 text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
              {job.description_formatted || "Not yet formatted. Click 'Format Job' to process."}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="h-4 w-4 text-zinc-400" />
                Tasks ({job.tasks.length})
              </CardTitle>
              <CardDescription>Decomposed work items for this job</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {job.tasks.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-center">
              <ListChecks className="h-8 w-8 text-zinc-300" />
              <p className="mt-2 text-sm text-zinc-400">
                No tasks yet. Decompose this job to create tasks.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {job.tasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/tasks/${task.id}`)}
                  >
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatStatus(task.task_type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[task.status] || "secondary"}>
                        {formatStatus(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(task.budget)}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-sm font-medium",
                        task.priority === 1 ? "text-red-600" :
                        task.priority === 2 ? "text-amber-600" : "text-zinc-500"
                      )}>
                        P{task.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {task.assigned_agent || "Unassigned"}
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
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-purple-500" />
            MCP Decisions
          </CardTitle>
          <CardDescription>AI reasoning and decisions for this job</CardDescription>
        </CardHeader>
        <CardContent>
          {job.mcp_decisions.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-zinc-400">
              No MCP decisions recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {job.mcp_decisions.map((decision) => (
                <div
                  key={decision.id}
                  className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="purple">{formatStatus(decision.decision_type)}</Badge>
                      <span className="text-xs text-zinc-400">
                        {formatDateTime(decision.created_at)}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-zinc-500">
                      Confidence: {(decision.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {decision.reasoning}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status History */}
      {job.status_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-zinc-400" />
              Status History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {job.status_history.map((change, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-zinc-400 w-32 shrink-0">
                    {formatDateTime(change.changed_at)}
                  </span>
                  <Badge variant="secondary" className="font-normal">
                    {formatStatus(change.from_status)}
                  </Badge>
                  <span className="text-zinc-400">&rarr;</span>
                  <Badge variant={statusBadgeVariant[change.to_status] || "secondary"}>
                    {formatStatus(change.to_status)}
                  </Badge>
                  <span className="text-zinc-500">by {change.changed_by}</span>
                  {change.reason && (
                    <span className="text-zinc-400">({change.reason})</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
