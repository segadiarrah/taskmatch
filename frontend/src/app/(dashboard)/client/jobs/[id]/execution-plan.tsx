"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { formatCurrency, formatStatus, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Loader2,
  Target,
  ListChecks,
  Users,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  FileText,
  Layers,
  UserCheck,
  Trophy,
  AlertTriangle,
  Send,
  Rocket,
} from "lucide-react";

interface MatchedAgent {
  agent_id: string;
  agent_name: string;
  agent_slug: string;
  total_score: number;
  breakdown: {
    capability_match: number;
    success_rate: number;
    average_score: number;
    completed_tasks_count: number;
  };
  reasoning: string | null;
}

interface PlanTask {
  id: string;
  title: string;
  description: string;
  task_type: string;
  budget: number;
  priority: number | string | null;
  status: string;
  matched_agents: MatchedAgent[];
  delivered?: {
    summary: string | null;
    result_preview: string | null;
    produced_by: string | null;
    status: string | null;
  } | null;
}

interface PlanSpec {
  objective: string | null;
  deliverables: string[];
  constraints: string[];
  success_criteria: string[];
}

interface PlanStage {
  key: string;
  label: string;
  desc: string;
}

interface PlanJob {
  id: string;
  title: string;
  status: string;
  currency: string;
  budget_min: number;
  budget_max: number;
}

interface PlanResponse {
  ready: boolean;
  planning: boolean;
  job: PlanJob;
  spec: PlanSpec;
  tasks: PlanTask[];
  stages: PlanStage[];
}

const POLL_MS = 3000;
const MAX_POLLS = 20;

const DEFAULT_STAGES: PlanStage[] = [
  { key: "format", label: "Format brief", desc: "Structuring your request" },
  { key: "decompose", label: "Decompose", desc: "Breaking it into tasks" },
  { key: "match", label: "Match agents", desc: "Finding the best AI agents" },
  { key: "assign", label: "Assign", desc: "Pairing agents to tasks" },
  { key: "validate", label: "Validate", desc: "Quality-checking the work" },
  { key: "pay", label: "Pay", desc: "Releasing payment on approval" },
];

const STAGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  format: FileText,
  decompose: Layers,
  match: Users,
  assign: UserCheck,
  validate: ShieldCheck,
  pay: CreditCard,
};

// Graceful fallback used only if the plan fetch errors outright.
const FALLBACK_PLAN: PlanResponse = {
  ready: false,
  planning: true,
  job: { id: "", title: "", status: "pending", currency: "USD", budget_min: 0, budget_max: 0 },
  spec: { objective: null, deliverables: [], constraints: [], success_criteria: [] },
  tasks: [],
  stages: DEFAULT_STAGES,
};

function scoreBadgeVariant(score: number): "success" | "info" | "warning" {
  if (score >= 80) return "success";
  if (score >= 60) return "info";
  return "warning";
}

function agentReason(agent: MatchedAgent): string {
  if (agent.reasoning && agent.reasoning.trim()) return agent.reasoning.trim();
  const b = agent.breakdown;
  if (!b) return "Matched on overall capability fit.";
  return `Strong capability match (${Math.round(b.capability_match)}%), ${Math.round(
    b.success_rate
  )}% success rate across ${b.completed_tasks_count} completed task${
    b.completed_tasks_count === 1 ? "" : "s"
  }.`;
}

interface ExecutionPlanProps {
  jobId: string;
  jobStatus: string;
  fallbackCurrency: string;
  onSubmitted?: () => void;
}

export default function ExecutionPlan({
  jobId,
  jobStatus,
  fallbackCurrency,
  onSubmitted,
}: ExecutionPlanProps) {
  const isDraft = jobStatus === "draft";

  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(!isDraft);
  const [tick, setTick] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pollsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<PlanResponse>(`/v1/jobs/${jobId}/plan`);
      if (!activeRef.current) return;
      if (!data.stages || data.stages.length === 0) {
        data.stages = DEFAULT_STAGES;
      }
      setPlan(data);
      setLoading(false);
      if ((data.planning || !data.ready) && pollsRef.current < MAX_POLLS) {
        pollsRef.current += 1;
        setTick((t) => t + 1);
        timerRef.current = setTimeout(load, POLL_MS);
      }
    } catch {
      if (!activeRef.current) return;
      setLoading(false);
      // Keep whatever we already have; otherwise fall back gracefully.
      setPlan((prev) => prev ?? FALLBACK_PLAN);
    }
  }, [jobId]);

  useEffect(() => {
    if (isDraft) return;
    activeRef.current = true;
    pollsRef.current = 0;
    load();
    return () => {
      activeRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDraft, load]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      await apiPost(`/v1/jobs/${jobId}/submit`, {});
      onSubmitted?.();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit this job. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Draft: prompt to submit ----
  if (isDraft) {
    return (
      <Card className="border-primary/40 bg-gradient-to-br from-emerald-50/60 to-blue-50/40">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="h-5 w-5 text-emerald-600" />
            Execution plan
          </CardTitle>
          <CardDescription>
            Submit this job to generate its execution plan. We will structure your brief, break it
            into tasks, and match the best AI agents to each one.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {submitError && (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{submitError}</p>
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Submit job to generate plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stages = plan?.stages && plan.stages.length > 0 ? plan.stages : DEFAULT_STAGES;
  const currency = plan?.job?.currency || fallbackCurrency;
  const ready = !!plan?.ready;
  const planning = !plan || plan.planning || !plan.ready;

  // ---- Loading first paint ----
  if (loading && !plan) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading your execution plan…</span>
        </CardContent>
      </Card>
    );
  }

  // ---- Planning state ----
  if (planning) {
    const activeStage = Math.min(tick, stages.length - 1);
    const progressValue = Math.min(92, 12 + tick * 14);
    return (
      <Card className="overflow-hidden border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600 animate-pulse" />
            We are planning your request…
          </CardTitle>
          <CardDescription>
            Our orchestration layer is structuring your brief, breaking it into tasks, and matching
            the best AI agents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={progressValue} className="h-2" />
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stages.map((stage, idx) => {
              const Icon = STAGE_ICONS[stage.key] ?? Sparkles;
              const done = idx < activeStage;
              const current = idx === activeStage;
              return (
                <li
                  key={stage.key}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                    current && "border-emerald-300 bg-emerald-50/70",
                    done && "border-emerald-200 bg-emerald-50/30",
                    !done && !current && "border-zinc-200 bg-white"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                      done && "bg-emerald-100 text-emerald-700",
                      current && "bg-emerald-600 text-white",
                      !done && !current && "bg-zinc-100 text-zinc-400"
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : current ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        current ? "text-emerald-700" : done ? "text-foreground" : "text-zinc-500"
                      )}
                    >
                      {stage.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{stage.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="text-xs text-muted-foreground">
            This usually takes under a minute. This panel updates automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ---- Ready state ----
  const spec = plan?.spec ?? { objective: null, deliverables: [], constraints: [], success_criteria: [] };
  const tasks = plan?.tasks ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Rocket className="h-5 w-5 text-emerald-600" />
          Execution plan
          {ready && (
            <Badge variant="success" className="ml-1">
              Ready
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-sm">
          {"Here's exactly how your request will be delivered — the tasks it became, and the agents matched to each."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* a. Structured spec */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              How we understood your brief
            </h3>
          </div>
          {spec.objective && (
            <div className="rounded-lg border bg-zinc-50/60 p-4">
              <p className="text-xs font-medium text-muted-foreground">Objective</p>
              <p className="mt-1 text-sm leading-relaxed">{spec.objective}</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {spec.deliverables.length > 0 && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-medium">Deliverables</p>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {spec.deliverables.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {spec.success_criteria.length > 0 && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <p className="text-sm font-medium">Success criteria</p>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {spec.success_criteria.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {spec.constraints.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-medium">Constraints</p>
              </div>
              <ul className="mt-2 flex flex-wrap gap-2">
                {spec.constraints.map((c, i) => (
                  <li key={i}>
                    <Badge variant="warning" className="font-normal">
                      {c}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!spec.objective &&
            spec.deliverables.length === 0 &&
            spec.success_criteria.length === 0 &&
            spec.constraints.length === 0 && (
              <p className="text-sm text-muted-foreground">
                A structured summary of your brief will appear here.
              </p>
            )}
        </section>

        {/* b. How it's broken down + c. Who will do it */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {`How it breaks down — ${tasks.length} task${tasks.length === 1 ? "" : "s"} & matched agents`}
            </h3>
          </div>

          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks were generated for this job.</p>
          ) : (
            <div className="space-y-4">
              {tasks.map((task, idx) => {
                const agents = [...(task.matched_agents ?? [])].sort(
                  (a, b) => b.total_score - a.total_score
                );
                return (
                  <div key={task.id} className="rounded-xl border p-4 sm:p-5">
                    {/* Task header */}
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-sm">{task.title}</p>
                          <Badge variant="info" className="capitalize">
                            {formatStatus(task.task_type)}
                          </Badge>
                          {task.priority !== null && task.priority !== undefined && task.priority !== "" && (
                            <Badge variant="outline" className="font-normal">
                              Priority {String(task.priority)}
                            </Badge>
                          )}
                          <span className="text-xs font-medium text-emerald-700">
                            {formatCurrency(task.budget, currency)}
                          </span>
                        </div>
                        {task.description && (
                          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Matched agents */}
                    <div className="mt-4 border-t pt-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Matched agents
                        </p>
                      </div>
                      {agents.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Matching agents to this task…
                        </p>
                      ) : (
                        <ol className="mt-3 space-y-2">
                          {agents.map((agent, aIdx) => {
                            const best = aIdx === 0;
                            return (
                              <li
                                key={agent.agent_id}
                                className={cn(
                                  "rounded-lg border p-3",
                                  best
                                    ? "border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-200"
                                    : "border-zinc-200"
                                )}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs font-semibold text-muted-foreground">
                                      #{aIdx + 1}
                                    </span>
                                    <span className="truncate text-sm font-medium">
                                      {agent.agent_name}
                                    </span>
                                    {best && (
                                      <Badge variant="success" className="flex-shrink-0">
                                        <Trophy className="mr-1 h-3 w-3" />
                                        Best match
                                      </Badge>
                                    )}
                                  </div>
                                  <Badge
                                    variant={scoreBadgeVariant(agent.total_score)}
                                    className="flex-shrink-0 tabular-nums"
                                  >
                                    {Math.round(agent.total_score)}/100
                                  </Badge>
                                </div>
                                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                                  {agentReason(agent)}
                                </p>
                              </li>
                            );
                          })}
                        </ol>
                      )}
                    </div>
                    {task.delivered && task.delivered.result_preview ? (
                      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="success" className="flex-shrink-0">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Delivered
                          </Badge>
                          {task.delivered.produced_by ? (
                            <span className="text-xs text-muted-foreground">
                              by {task.delivered.produced_by}
                            </span>
                          ) : null}
                        </div>
                        {task.delivered.summary ? (
                          <p className="mt-2 text-sm font-medium text-zinc-800">
                            {task.delivered.summary}
                          </p>
                        ) : null}
                        <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap rounded-md bg-white/70 p-2.5 text-xs leading-relaxed text-zinc-700">
                          {task.delivered.result_preview}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
