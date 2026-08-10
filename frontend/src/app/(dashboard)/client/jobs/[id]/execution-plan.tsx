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
  revision_count?: number;
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

interface PlanPayment {
  id: string;
  status: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  currency: string;
}

interface PlanResponse {
  ready: boolean;
  planning: boolean;
  job: PlanJob;
  spec: PlanSpec;
  tasks: PlanTask[];
  stages: PlanStage[];
  payment?: PlanPayment | null;
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
  const [accepting, setAccepting] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

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

  const handleAccept = async () => {
    try {
      setAccepting(true);
      await apiPost(`/v1/jobs/${jobId}/accept`, {});
      pollsRef.current = 0;
      await load();
      onSubmitted?.();
    } catch {
      /* keep current state; button stays available to retry */
    } finally {
      setAccepting(false);
    }
  };

  const handleDispute = async () => {
    try {
      setDisputing(true);
      await apiPost(`/v1/jobs/${jobId}/dispute`, { reason: disputeReason.trim() });
      setShowDispute(false);
      setDisputeReason("");
      // Escrow stays held; job re-enters revision — resume polling to watch it.
      pollsRef.current = 0;
      await load();
      onSubmitted?.();
    } catch {
      /* keep current state; button stays available to retry */
    } finally {
      setDisputing(false);
    }
  };

  // ---- Draft: prompt to submit ----
  if (isDraft) {
    return (
      <Card className="corner-brackets border-signal-500/40 bg-signal-500/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="h-5 w-5 text-signal-400" />
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
      <Card className="overflow-hidden border-signal-500/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-signal-400 animate-pulse" />
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
                    current && "border-signal-500/50 bg-signal-500/10",
                    done && "border-success/40 bg-success/10",
                    !done && !current && "border-border bg-ink-900"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-sm",
                      done && "bg-success/15 text-success",
                      current && "bg-signal-500 text-ink-950",
                      !done && !current && "bg-ink-800 text-ink-500"
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
                        current ? "text-signal-400" : done ? "text-foreground" : "text-ink-500"
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
  const payment = plan?.payment ?? null;
  const jobDone = plan?.job.status === "completed" || payment?.status === "paid";
  const canRelease =
    !!payment && (payment.status === "releasable" || payment.status === "authorized" || payment.status === "pending");
  const fmtMoney = (n: number, ccy: string) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: ccy || "EUR", maximumFractionDigits: 0 }).format(n);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Rocket className="h-5 w-5 text-signal-400" />
          Execution plan
          {ready && (
            <Badge variant="success" className="ml-1">
              Ready
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-sm">
          {"Here's exactly how your request will be delivered — the tasks it became, who executed each, and the result."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Escrow review & release */}
        {payment && (canRelease || jobDone) && (
          <section
            className={cn(
              "rounded-lg border p-4",
              jobDone ? "border-success/40 bg-success/10" : "border-info/40 bg-info/10"
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle2 className={cn("mt-0.5 h-5 w-5", jobDone ? "text-success" : "text-info")} />
                <div>
                  <p className="text-sm font-semibold text-ink-50">
                    {jobDone ? "Work accepted — escrow released" : "Work delivered — held in escrow for your review"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {jobDone
                      ? `${fmtMoney(payment.net_amount, payment.currency)} released to the executor. Job completed.`
                      : `${fmtMoney(payment.gross_amount, payment.currency)} held in escrow (${fmtMoney(
                          payment.net_amount,
                          payment.currency
                        )} to the executor after the ${fmtMoney(payment.platform_fee, payment.currency)} platform fee). Review the results below, then release.`}
                  </p>
                </div>
              </div>
              {canRelease && !jobDone && (
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={() => setShowDispute((v) => !v)}
                    disabled={accepting || disputing}
                    className="shrink-0"
                  >
                    Request changes
                  </Button>
                  <Button onClick={handleAccept} disabled={accepting || disputing} className="shrink-0">
                    {accepting ? "Releasing…" : "Accept & release payment"}
                  </Button>
                </div>
              )}
              {jobDone && (
                <Badge variant="success" className="shrink-0">
                  Completed
                </Badge>
              )}
            </div>

            {canRelease && !jobDone && showDispute && (
              <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3">
                <p className="text-xs font-medium text-ink-200">
                  What did the deliverable miss? Your payment stays held in escrow while the
                  executor revises the work against your success criteria.
                </p>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Section 2 doesn't cover the EU market as requested; tone is too informal."
                  className="mt-2 w-full rounded-md border border-input bg-ink-900 p-2 text-sm text-ink-100 placeholder:text-ink-500 focus:border-signal-500 focus:outline-none focus:ring-1 focus:ring-signal-500"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowDispute(false)}
                    disabled={disputing}
                    className="shrink-0"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleDispute} disabled={disputing} className="shrink-0">
                    {disputing ? "Submitting…" : "Submit dispute & request revision"}
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}
        {/* a. Structured spec */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              How we understood your brief
            </h3>
          </div>
          {spec.objective && (
            <div className="rounded-lg border bg-ink-900 p-4">
              <p className="eyebrow text-muted-foreground">Objective</p>
              <p className="mt-1 text-sm leading-relaxed">{spec.objective}</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {spec.deliverables.length > 0 && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-success" />
                  <p className="text-sm font-medium">Deliverables</p>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {spec.deliverables.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {spec.success_criteria.length > 0 && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-warning" />
                  <p className="text-sm font-medium">Success criteria</p>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {spec.success_criteria.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-warning" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {spec.constraints.length > 0 && (
            <div className="rounded-lg border border-warning/40 bg-warning/10 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-warning" />
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
                  <div key={task.id} className="rounded-lg border p-4 sm:p-5">
                    {/* Task header */}
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm bg-primary font-mono text-xs font-semibold text-primary-foreground">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-sm text-ink-100">{task.title}</p>
                          <Badge variant="info" className="capitalize">
                            {formatStatus(task.task_type)}
                          </Badge>
                          {task.priority !== null && task.priority !== undefined && task.priority !== "" && (
                            <Badge variant="outline" className="font-normal">
                              Priority {String(task.priority)}
                            </Badge>
                          )}
                          {!!task.revision_count && task.revision_count > 0 && (
                            <Badge variant="warning" className="font-normal">
                              Revised{task.revision_count > 1 ? ` ×${task.revision_count}` : ""}
                            </Badge>
                          )}
                          <span className="font-mono text-xs font-medium text-success">
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
                                    ? "border-success/40 bg-success/10 ring-1 ring-success/30"
                                    : "border-border"
                                )}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                                      #{aIdx + 1}
                                    </span>
                                    <span className="truncate text-sm font-medium text-ink-100">
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
                      <div className="mt-3 rounded-lg border border-success/40 bg-success/10 p-3">
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
                          <p className="mt-2 text-sm font-medium text-ink-100">
                            {task.delivered.summary}
                          </p>
                        ) : null}
                        <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap rounded-md border border-ink-800 bg-ink-950/70 p-2.5 font-mono text-xs leading-relaxed text-ink-200">
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
