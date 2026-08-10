"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost, apiPut, ApiError } from "@/lib/api";
import { formatCurrency, formatDate, formatStatus } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Bot,
  UserRound,
  ChevronRight,
  Pause,
  Play,
  Plus,
  X,
  CheckCircle2,
  Star,
  TrendingUp,
  DollarSign,
  Clock,
  MessageSquare,
} from "lucide-react";

interface Capability {
  id: string;
  name: string;
  version: string;
  metadata: Record<string, unknown> | null;
}

interface AssignmentHistory {
  id: string;
  task_id: string;
  task_title: string;
  job_title: string;
  status: string;
  budget: number;
  currency: string;
  completed_at: string | null;
  score: number | null;
}

interface Feedback {
  id: string;
  task_title: string;
  score: number;
  note: string;
  created_at: string;
}

interface EarningsBreakdown {
  total: number;
  pending: number;
  paid: number;
  currency: string;
}

interface AgentDetail {
  id: string;
  name: string;
  description: string;
  status: string;
  kind?: "agent" | "human";
  endpoint_url: string;
  auth_type: string;
  supported_task_types: string[];
  capabilities: Capability[];
  success_rate: number;
  avg_score: number;
  completed_tasks: number;
  total_assignments: number;
  assignment_history: AssignmentHistory[];
  earnings: EarningsBreakdown;
  feedback: Feedback[];
  created_at: string;
  updated_at: string;
}

const statusBadgeVariant = (status: string) => {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
    active: "success",
    paused: "warning",
    inactive: "secondary",
    suspended: "destructive",
    completed: "success",
    failed: "destructive",
    assigned: "default",
    in_progress: "default",
    submitted: "warning",
  };
  return map[status] ?? "outline";
};

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add capability
  const [showAddCap, setShowAddCap] = useState(false);
  const [newCapName, setNewCapName] = useState("");
  const [newCapVersion, setNewCapVersion] = useState("");

  const fetchAgent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<AgentDetail>(`/v1/agents/${agentId}`);
      setAgent(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("Agent not found.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load agent details");
      }
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  const handleToggleStatus = async () => {
    if (!agent) return;
    try {
      setActionLoading(true);
      const newStatus = agent.status === "active" ? "paused" : "active";
      await apiPut(`/v1/agents/${agentId}/status`, { status: newStatus });
      await fetchAgent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update agent status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCapability = async () => {
    if (!newCapName.trim()) return;
    try {
      setActionLoading(true);
      await apiPost(`/v1/agents/${agentId}/capabilities`, {
        name: newCapName.trim(),
        version: newCapVersion.trim() || undefined,
      });
      setNewCapName("");
      setNewCapVersion("");
      setShowAddCap(false);
      await fetchAgent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add capability");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveCapability = async (capId: string) => {
    try {
      setActionLoading(true);
      await apiPost(`/v1/agents/${agentId}/capabilities/${capId}/remove`);
      await fetchAgent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove capability");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">{error ?? "Agent not found"}</p>
        <Link href="/developer/agents">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agents
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/developer" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/developer/agents" className="hover:text-foreground transition-colors">
          Agents
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground truncate max-w-[200px]">{agent.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/developer/agents">
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-signal-500/30 bg-signal-500/10">
              {agent.kind === "human" ? (
                <UserRound className="h-6 w-6 text-signal-400" />
              ) : (
                <Bot className="h-6 w-6 text-signal-400" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-2xl font-medium text-ink-50 sm:text-3xl">{agent.name}</h1>
                <Badge variant={statusBadgeVariant(agent.status)}>
                  {agent.status}
                </Badge>
                <Badge variant={agent.kind === "human" ? "outline" : "secondary"}>
                  {agent.kind === "human" ? "Human expert" : "AI agent"}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">{agent.description || "No description"}</p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleToggleStatus}
          disabled={actionLoading || agent.status === "suspended"}
        >
          {agent.status === "active" ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Pause Agent
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Activate Agent
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-mono font-semibold">{Math.round(agent.success_rate)}%</span>
                </div>
                <Progress
                  value={agent.success_rate}
                  indicatorClassName={
                    agent.success_rate >= 80
                      ? "bg-success"
                      : agent.success_rate >= 50
                        ? "bg-warning"
                        : "bg-danger"
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Average Score</span>
                  <span className="font-mono font-semibold">{agent.avg_score.toFixed(1)} / 100</span>
                </div>
                <Progress
                  value={agent.avg_score}
                  indicatorClassName="bg-info"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completed Tasks</span>
                  <span className="font-mono font-semibold">
                    {agent.completed_tasks} / {agent.total_assignments}
                  </span>
                </div>
                <Progress
                  value={agent.total_assignments > 0 ? (agent.completed_tasks / agent.total_assignments) * 100 : 0}
                  indicatorClassName="bg-signal-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Capabilities</CardTitle>
                <CardDescription>Skills and tools this agent supports</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddCap(!showAddCap)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddCap && (
                <div className="flex items-end gap-3 rounded-lg border border-dashed p-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Name</label>
                    <Input
                      placeholder="e.g., python"
                      value={newCapName}
                      onChange={(e) => setNewCapName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCapability();
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Version</label>
                    <Input
                      placeholder="e.g., 3.11"
                      value={newCapVersion}
                      onChange={(e) => setNewCapVersion(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={handleAddCapability} disabled={actionLoading}>
                    Add
                  </Button>
                </div>
              )}

              {agent.capabilities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No capabilities registered yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.map((cap) => (
                    <div
                      key={cap.id}
                      className="inline-flex items-center gap-1.5 rounded-sm border px-3 py-1"
                    >
                      <span className="font-mono text-xs font-medium">{cap.name}</span>
                      {cap.version && (
                        <span className="font-mono text-[11px] text-muted-foreground">v{cap.version}</span>
                      )}
                      <button
                        type="button"
                        aria-label={`Remove ${cap.name}`}
                        onClick={() => handleRemoveCapability(cap.id)}
                        className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                        disabled={actionLoading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Supported Task Types */}
              {agent.supported_task_types && agent.supported_task_types.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Supported Task Types</p>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.supported_task_types.map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs capitalize">
                        {type.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Assignment History
              </CardTitle>
              <CardDescription>Recent task assignments for this agent</CardDescription>
            </CardHeader>
            <CardContent>
              {(!agent.assignment_history || agent.assignment_history.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No assignments yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {agent.assignment_history.map((assignment) => (
                    <Link
                      key={assignment.id}
                      href={`/developer/tasks/${assignment.task_id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:border-signal-500/30 hover:bg-ink-800/60"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-ink-100">{assignment.task_title}</p>
                        <div className="mt-1 flex items-center gap-3 font-mono text-xs text-muted-foreground">
                          <span>{assignment.job_title}</span>
                          <span>{formatCurrency(assignment.budget, assignment.currency)}</span>
                          {assignment.completed_at && (
                            <span>{formatDate(assignment.completed_at)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        {assignment.score !== null && (
                          <span className="font-mono text-xs font-medium text-ink-100">{assignment.score}/100</span>
                        )}
                        <Badge variant={statusBadgeVariant(assignment.status)} className="text-xs">
                          {formatStatus(assignment.status)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback */}
          {agent.feedback && agent.feedback.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  Feedback
                </CardTitle>
                <CardDescription>Client notes about this agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {agent.feedback.map((fb) => (
                  <div key={fb.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{fb.task_title}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        <span className="font-mono text-sm font-medium">{fb.score}/100</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{fb.note}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(fb.created_at)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Agent Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Agent Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusBadgeVariant(agent.status)}>{agent.status}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Auth Type</span>
                <span className="font-medium capitalize">{agent.auth_type.replace(/_/g, " ")}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Endpoint</span>
                <p className="font-mono text-xs mt-1 break-all">{agent.endpoint_url}</p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Registered</span>
                <span className="font-medium">{formatDate(agent.created_at)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium">{formatDate(agent.updated_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Earnings Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                Earnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Earned</span>
                <span className="font-mono font-semibold text-success">
                  {formatCurrency(agent.earnings?.total ?? 0, agent.earnings?.currency ?? "USD")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium">
                  {formatCurrency(agent.earnings?.pending ?? 0, agent.earnings?.currency ?? "USD")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium">
                  {formatCurrency(agent.earnings?.paid ?? 0, agent.earnings?.currency ?? "USD")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </span>
                <span className="font-medium">{agent.completed_tasks}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Assignments</span>
                <span className="font-medium">{agent.total_assignments}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" />
                  Avg Score
                </span>
                <span className="font-medium">{agent.avg_score.toFixed(1)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
