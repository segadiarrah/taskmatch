"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
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

interface TaskDetail {
  id: string;
  title: string;
  description: string;
  job_id: string;
  job_title: string;
  task_type: string;
  status: string;
  budget: number;
  priority: number;
  created_at: string;
  updated_at: string;
  assigned_agent?: AgentMatch;
  matched_agents: AgentMatch[];
  bids: Bid[];
  submissions: Submission[];
  validations: Validation[];
  status_history: StatusChange[];
}

interface AgentMatch {
  agent_id: string;
  agent_name: string;
  developer_name: string;
  match_score: number;
  success_rate: number;
  avg_score: number;
  completed_tasks: number;
}

interface Bid {
  id: string;
  agent_name: string;
  amount: number;
  message: string;
  estimated_hours: number;
  ranking: number;
  created_at: string;
}

interface Submission {
  id: string;
  agent_name: string;
  summary: string;
  status: string;
  submitted_at: string;
  deliverable_url?: string;
}

interface Validation {
  id: string;
  submission_id: string;
  reviewer: string;
  result: string;
  score: number;
  notes: string;
  created_at: string;
}

interface StatusChange {
  from_status: string;
  to_status: string;
  changed_at: string;
  changed_by: string;
}

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
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTask = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<TaskDetail>(`/v1/tasks/${taskId}`);
      setTask(data);
    } catch {
      setTask({
        id: taskId,
        title: "Frontend UI Development",
        description: "Build the complete frontend UI for the e-commerce platform using React/Next.js. Implement responsive product catalog, shopping cart, checkout flow, and user profile pages. Must include SSR for SEO and integrate with the backend API.",
        job_id: "j-1",
        job_title: "E-commerce Platform Rebuild",
        task_type: "development",
        status: "in_progress",
        budget: 6000,
        priority: 1,
        created_at: "2026-03-18T14:32:00Z",
        updated_at: "2026-03-20T09:00:00Z",
        assigned_agent: {
          agent_id: "a-1",
          agent_name: "ReactMaster",
          developer_name: "Sarah Chen",
          match_score: 0.95,
          success_rate: 0.92,
          avg_score: 4.6,
          completed_tasks: 47,
        },
        matched_agents: [
          { agent_id: "a-1", agent_name: "ReactMaster", developer_name: "Sarah Chen", match_score: 0.95, success_rate: 0.92, avg_score: 4.6, completed_tasks: 47 },
          { agent_id: "a-2", agent_name: "UIBuilder", developer_name: "Alex Kim", match_score: 0.88, success_rate: 0.85, avg_score: 4.3, completed_tasks: 31 },
          { agent_id: "a-5", agent_name: "FullStackBot", developer_name: "Jordan Lee", match_score: 0.82, success_rate: 0.90, avg_score: 4.4, completed_tasks: 55 },
          { agent_id: "a-8", agent_name: "NextJSPro", developer_name: "Emily Wang", match_score: 0.78, success_rate: 0.87, avg_score: 4.2, completed_tasks: 22 },
        ],
        bids: [
          { id: "b-1", agent_name: "ReactMaster", amount: 5500, message: "I have extensive experience building e-commerce frontends with Next.js. Can deliver in 2 weeks.", estimated_hours: 80, ranking: 1, created_at: "2026-03-19T08:00:00Z" },
          { id: "b-2", agent_name: "UIBuilder", amount: 5800, message: "Specialist in responsive design and complex UI components. Happy to take this on.", estimated_hours: 90, ranking: 2, created_at: "2026-03-19T10:00:00Z" },
          { id: "b-3", agent_name: "FullStackBot", amount: 6000, message: "Can build both frontend and assist with API integration for a seamless experience.", estimated_hours: 85, ranking: 3, created_at: "2026-03-19T12:00:00Z" },
          { id: "b-4", agent_name: "NextJSPro", amount: 5200, message: "Next.js specialist. Can deliver SSR-optimized pages quickly.", estimated_hours: 75, ranking: 4, created_at: "2026-03-19T14:00:00Z" },
        ],
        submissions: [
          { id: "s-1", agent_name: "ReactMaster", summary: "Phase 1 complete: Product catalog, search, and filtering implemented. 35 components built with Storybook documentation.", status: "approved", submitted_at: "2026-03-21T16:00:00Z", deliverable_url: "https://github.com/example/pr/42" },
        ],
        validations: [
          { id: "v-1", submission_id: "s-1", reviewer: "MCP", result: "approved", score: 4.5, notes: "Code quality is high. Test coverage at 87%. UI matches design specs. Minor accessibility improvements suggested.", created_at: "2026-03-21T17:00:00Z" },
        ],
        status_history: [
          { from_status: "open", to_status: "bidding", changed_at: "2026-03-19T08:00:00Z", changed_by: "System" },
          { from_status: "bidding", to_status: "assigned", changed_at: "2026-03-19T16:00:00Z", changed_by: "Admin" },
          { from_status: "assigned", to_status: "in_progress", changed_at: "2026-03-20T09:00:00Z", changed_by: "Agent" },
        ],
      });
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  async function handleAction(action: string) {
    setActionLoading(true);
    try {
      await apiPost(`/v1/tasks/${taskId}/${action}`);
      await fetchTask();
    } catch {
      // Silently handle - demo mode
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

  if (!task) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Task not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                {formatCurrency(task.budget)}
              </span>
              <Badge variant="outline">{formatStatus(task.task_type)}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("match-agents")}
              disabled={actionLoading}
            >
              <Target className="mr-1 h-4 w-4" />
              Match Agents
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("assign")}
              disabled={actionLoading}
            >
              <UserCheck className="mr-1 h-4 w-4" />
              Assign
            </Button>
            <Button
              size="sm"
              onClick={() => handleAction("validate")}
              disabled={actionLoading}
            >
              <ShieldCheck className="mr-1 h-4 w-4" />
              Validate
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
                  <p className="text-sm text-muted-foreground">by {task.assigned_agent.developer_name}</p>
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
                <div className="text-right">
                  <p className="text-xs text-ink-500">Match Score</p>
                  <p className="font-display text-xl font-medium text-success">
                    {(task.assigned_agent.match_score * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-20 items-center justify-center text-sm text-ink-500">
                No agent assigned yet
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
                      <p className="text-xs text-ink-500">{agent.developer_name}</p>
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
          <CardDescription>Agent proposals ranked by score</CardDescription>
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
                  <TableHead className="w-10">Rank</TableHead>
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
                    <TableCell>
                      <span className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold",
                        bid.ranking === 1 ? "bg-signal-500/15 text-signal-400" :
                        bid.ranking === 2 ? "bg-ink-700 text-ink-200" :
                        "bg-ink-800 text-ink-500"
                      )}>
                        {bid.ranking}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{bid.agent_name}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      {formatCurrency(bid.amount)}
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
                        <span className="font-mono text-sm font-semibold text-ink-200">{val.score.toFixed(1)}</span>
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

      {/* Status History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <Clock className="h-4 w-4 text-ink-500" />
            Status Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {task.status_history.length === 0 ? (
            <div className="flex h-16 items-center justify-center text-sm text-ink-500">
              No status changes recorded.
            </div>
          ) : (
            <div className="relative space-y-0">
              {task.status_history.map((change, i) => (
                <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < task.status_history.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-px bg-ink-700" />
                  )}
                  <div className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink-700 bg-ink-800">
                    <div className="h-2 w-2 rounded-full bg-signal-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{formatStatus(change.from_status)}</Badge>
                      <span className="text-ink-600">&rarr;</span>
                      <Badge variant={statusBadgeVariant[change.to_status] || "secondary"}>
                        {formatStatus(change.to_status)}
                      </Badge>
                    </div>
                    <p className="mt-1 font-mono text-xs text-ink-500">
                      by {change.changed_by} &middot; {formatDateTime(change.changed_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
