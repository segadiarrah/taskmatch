"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost, apiPut, ApiError } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
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
  Clock,
} from "lucide-react";

interface Capability {
  id: string;
  capability_name: string;
  version: string;
  metadata_json: Record<string, unknown> | null;
}

interface AssignmentHistory {
  id: string;
  task_id: string;
  agent_id: string;
  task_title: string;
  job_title: string;
  status: string;
  budget: number;
  currency: string;
}

interface AgentDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  kind?: "agent" | "human";
  endpoint_url: string;
  auth_type: string;
  supported_task_types: string[] | null;
  capabilities: Capability[];
  success_rate: number;
  average_score: number;
  completed_tasks_count: number;
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
  const { t, locale } = useTranslation();
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [recentAssignments, setRecentAssignments] = useState<AssignmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add capability
  const [showAddCap, setShowAddCap] = useState(false);
  const [newCapName, setNewCapName] = useState("");
  const [newCapVersion, setNewCapVersion] = useState("");

  const fetchAgent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, history] = await Promise.all([
        apiGet<AgentDetail>(`/v1/agents/${agentId}`),
        apiGet<{ items: AssignmentHistory[] }>("/v1/developer/assignments?limit=100"),
      ]);
      setAgent(data);
      setRecentAssignments(history.items.filter(item => item.agent_id === agentId));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError(t("developer.agentDetail.notFound"));
      } else {
        setError(err instanceof Error ? err.message : "Failed to load agent details");
      }
    } finally {
      setLoading(false);
    }
  }, [agentId, t]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  const handleToggleStatus = async () => {
    if (!agent) return;
    try {
      setActionLoading(true);
      setActionError(null);
      const newStatus = agent.status === "active" ? "paused" : "active";
      await apiPut(`/v1/agents/${agentId}`, { status: newStatus });
      await fetchAgent();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("dashboard.error"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCapability = async () => {
    if (!newCapName.trim()) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await apiPost(`/v1/agents/${agentId}/capabilities`, {
        capability_name: newCapName.trim(),
        version: newCapVersion.trim() || undefined,
      });
      setNewCapName("");
      setNewCapVersion("");
      setShowAddCap(false);
      await fetchAgent();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("dashboard.error"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveCapability = async (capId: string) => {
    try {
      setActionLoading(true);
      setActionError(null);
      await apiPost(`/v1/agents/${agentId}/capabilities/${capId}/remove`);
      await fetchAgent();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("dashboard.error"));
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
        <p className="text-lg text-muted-foreground">{error ?? t("developer.agentDetail.notFound")}</p>
        <Link href="/developer/agents">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("developer.agentDetail.back")}
          </Button>
        </Link>
      </div>
    );
  }

  const canEditCapabilities = agent.kind !== "human" && !agent.slug.startsWith("llm-");

  return (
    <div className="space-y-6 [overflow-wrap:anywhere]">
      {actionError && <p role="alert" className="rounded-lg border border-danger/40 p-4 text-sm text-danger">{actionError}</p>}
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/developer" className="hover:text-foreground transition-colors">
          {t("developer.agentDetail.breadcrumbDashboard")}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/developer/agents" className="hover:text-foreground transition-colors">
          {t("developer.agentDetail.breadcrumbAgents")}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground truncate max-w-[200px]">{agent.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Link href="/developer/agents">
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-signal-500/30 bg-signal-500/10">
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
                  {formatStatus(agent.status, locale)}
                </Badge>
                <Badge variant={agent.kind === "human" ? "outline" : "secondary"}>
                  {agent.kind === "human" ? t("developer.agentDetail.humanExpert") : t("developer.agentDetail.aiAgent")}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">{agent.description || t("developer.agentDetail.noDescription")}</p>
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
              {t("developer.agentDetail.pause")}
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              {t("developer.agentDetail.activate")}
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="min-w-0 lg:col-span-2 space-y-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {t("developer.agentDetail.metricsTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("developer.agentDetail.successRate")}</span>
                  <span className="font-mono font-semibold">{Math.round(agent.success_rate * 100)}%</span>
                </div>
                <Progress
                  value={agent.success_rate * 100}
                  indicatorClassName={
                    agent.success_rate >= 0.8
                      ? "bg-success"
                      : agent.success_rate >= 0.5
                        ? "bg-warning"
                        : "bg-danger"
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("developer.agentDetail.averageScore")}</span>
                  <span className="font-mono font-semibold">{agent.average_score.toFixed(1)} / 100</span>
                </div>
                <Progress
                  value={agent.average_score}
                  indicatorClassName="bg-info"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("developer.agentDetail.completedTasks")}</span>
                  <span className="font-mono font-semibold">
                    {agent.completed_tasks_count}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{t("developer.agentDetail.capabilities")}</CardTitle>
                <CardDescription>{t("developer.agentDetail.capabilitiesSubtitle")}</CardDescription>
              </div>
              {canEditCapabilities && <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddCap(!showAddCap)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("developer.agentDetail.add")}
              </Button>}
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddCap && canEditCapabilities && (
                <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed p-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{t("developer.agentDetail.name")}</label>
                    <Input
                      placeholder={t("developer.agentDetail.namePlaceholder")}
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
                    <label className="text-xs font-medium text-muted-foreground">{t("developer.agentDetail.version")}</label>
                    <Input
                      placeholder={t("developer.agentDetail.versionPlaceholder")}
                      value={newCapVersion}
                      onChange={(e) => setNewCapVersion(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={handleAddCapability} disabled={actionLoading}>
                    {t("developer.agentDetail.add")}
                  </Button>
                </div>
              )}

              {agent.capabilities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("developer.agentDetail.noCapabilities")}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.map((cap) => (
                    <div
                      key={cap.id}
                      className="inline-flex items-center gap-1.5 rounded-sm border px-3 py-1"
                    >
                      <span className="font-mono text-xs font-medium">{cap.capability_name}</span>
                      {cap.version && (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {t("developer.agentDetail.versionPrefix")}
                          {cap.version}
                        </span>
                      )}
                      {canEditCapabilities && <button
                        type="button"
                        aria-label={t("developer.agentDetail.removeCapability", { name: cap.capability_name })}
                        onClick={() => handleRemoveCapability(cap.id)}
                        className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                        disabled={actionLoading}
                      >
                        <X className="h-3 w-3" />
                      </button>}
                    </div>
                  ))}
                </div>
              )}

              {/* Supported Task Types */}
              {agent.supported_task_types && agent.supported_task_types.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">{t("developer.agentDetail.taskTypes")}</p>
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
                {t("developer.agentDetail.historyTitle")}
              </CardTitle>
              <CardDescription>{t("developer.agentDetail.historySubtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t("developer.agentDetail.noAssignments")}
                </p>
              ) : (
                <div className="space-y-3">
                  {recentAssignments.map((assignment) => (
                    <Link
                      key={assignment.id}
                      href={`/developer/tasks/${assignment.task_id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:border-signal-500/30 hover:bg-ink-800/60"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-ink-100">{assignment.task_title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
                          <span>{assignment.job_title}</span>
                          <span>{formatCurrency(assignment.budget, assignment.currency, locale)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Badge variant={statusBadgeVariant(assignment.status)} className="text-xs">
                          {formatStatus(assignment.status, locale)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Agent Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("developer.agentDetail.infoTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("developer.agentDetail.status")}</span>
                <Badge variant={statusBadgeVariant(agent.status)}>{formatStatus(agent.status, locale)}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("developer.agentDetail.authType")}</span>
                <span className="font-medium capitalize">{formatStatus(agent.auth_type, locale)}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">{t("developer.agentDetail.endpoint")}</span>
                <p className="font-mono text-xs mt-1 break-all">{agent.endpoint_url}</p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("developer.agentDetail.registered")}</span>
                <span className="font-medium">{formatDate(agent.created_at, locale)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("developer.agentDetail.lastUpdated")}</span>
                <span className="font-medium">{formatDate(agent.updated_at, locale)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("developer.agentDetail.statsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("developer.agentDetail.completed")}
                </span>
                <span className="font-medium">{agent.completed_tasks_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" />
                  {t("developer.agentDetail.avgScore")}
                </span>
                <span className="font-medium">{agent.average_score.toFixed(1)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
