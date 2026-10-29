"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DataLoadError } from "@/components/dashboard/data-load-error";
import { apiGet, apiPost } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { DEFAULT_PLAN_STAGE_KEYS } from "@/lib/job-requirements";
import { formatCurrency, formatStatus, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  review_access?: { can_review: boolean; reviewer_name: string | null; error?: boolean };
  delivered?: {
    submission_id?: string;
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

const STAGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  format: FileText,
  decompose: Layers,
  match: Users,
  assign: UserCheck,
  validate: ShieldCheck,
  pay: CreditCard,
};

function scoreBadgeVariant(score: number): "success" | "info" | "warning" {
  if (score >= 80) return "success";
  if (score >= 60) return "info";
  return "warning";
}

interface ExecutionPlanProps {
  billingMode: "stripe" | "legacy_manual";
  jobId: string;
  jobStatus: string;
  fallbackCurrency: string;
  onSubmitted?: () => void;
}

export default function ExecutionPlan({
  jobId,
  billingMode,
  jobStatus,
  fallbackCurrency,
  onSubmitted,
}: ExecutionPlanProps) {
  const { t } = useTranslation();
  const isDraft = jobStatus === "draft";
  const isLegacy = billingMode === "legacy_manual";

  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(!isDraft);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
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
      // Review authority follows the actual executor and designated reviewer,
      // including human takeover of a formerly automated task.
      data.tasks = await Promise.all(data.tasks.map(async task => {
        if (!task.delivered?.submission_id || (task.delivered.status !== "submitted" && task.delivered.status !== "under_review")) return task;
        try {
          const access = await apiGet<{ can_review: boolean; reviewer_name: string | null }>(`/v1/tasks/${task.id}/execution`);
          return { ...task, review_access: { can_review: access.can_review === true, reviewer_name: access.reviewer_name } };
        } catch {
          return { ...task, review_access: { can_review: false, reviewer_name: null, error: true } };
        }
      }));
      if (!activeRef.current) return;
      setLoadError(false);
      setPlan(data);
      setLoading(false);
      if ((data.planning || !data.ready) && pollsRef.current < MAX_POLLS) {
        pollsRef.current += 1;
        timerRef.current = setTimeout(load, POLL_MS);
      }
    } catch {
      if (!activeRef.current) return;
      setLoading(false);
      setLoadError(true);
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
      setActionError(null);
      setAccepting(true);
      await apiPost(`/v1/jobs/${jobId}/accept`, {});
      pollsRef.current = 0;
      await load();
      onSubmitted?.();
    } catch {
      setActionError(t("client.plan.actionFailed"));
    } finally {
      setAccepting(false);
    }
  };

  const handleDispute = async () => {
    try {
      setActionError(null);
      setDisputing(true);
      await apiPost(`/v1/jobs/${jobId}/dispute`, { reason: disputeReason.trim() });
      setShowDispute(false);
      setDisputeReason("");
      // Escrow stays held; job re-enters revision — resume polling to watch it.
      pollsRef.current = 0;
      await load();
      onSubmitted?.();
    } catch {
      setActionError(t("client.plan.actionFailed"));
    } finally {
      setDisputing(false);
    }
  };

  const handleReview = async (submissionId: string, decision: "approved" | "rework_requested") => {
    if (!plan?.tasks.some(task => task.delivered?.submission_id === submissionId && task.review_access?.can_review)) return;
    setReviewing(submissionId);
    setActionError(null);
    try {
      await apiPost(`/v1/submissions/${submissionId}/reviews`, { submission_id: submissionId, decision, notes: reviewNotes[submissionId]?.trim() || null });
      await load();
      onSubmitted?.();
    } catch {
      setActionError(t("client.plan.actionFailed"));
    } finally {
      setReviewing(null);
    }
  };

  // ---- Draft: prompt to submit ----
  if (isDraft) {
    return (
      <Card className="corner-brackets border-signal-500/40 bg-signal-500/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="h-5 w-5 text-signal-400" />
            {t("client.plan.title")}
          </CardTitle>
          <CardDescription>
            {t("client.plan.notSubmitted")}
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
            {t("client.plan.submitCta")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currency = plan?.job?.currency || fallbackCurrency;
  const ready = !!plan?.ready;
  const planning = !plan || plan.planning || !plan.ready;
  if (loadError) return <DataLoadError onRetry={() => { pollsRef.current = 0; load(); }} />;

  // ---- Loading first paint ----
  if (loading && !plan) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{t("client.plan.loading")}</span>
        </CardContent>
      </Card>
    );
  }

  // Planning has no measured percentage; report the server's state only.
  if (planning) {
    return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Loader2 className="h-5 w-5 animate-spin" />{t("client.plan.planningTitle")}</CardTitle>
        <CardDescription>{t("client.plan.planningBody")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{pollsRef.current >= MAX_POLLS ? t("client.plan.waiting") : t("client.plan.planningHint")}</p>
        <Button variant="outline" onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); pollsRef.current = 0; load(); }}>{t("client.plan.refresh")}</Button>
      </CardContent>
    </Card>;
  }

  // ---- Ready state ----
  const spec = plan?.spec ?? { objective: null, deliverables: [], constraints: [], success_criteria: [] };
  const tasks = plan?.tasks ?? [];
  const payment = plan?.payment ?? null;
  const jobDone = plan?.job.status === "completed";
  const canRelease = plan?.job.status === "client_review" && tasks.length > 0 && tasks.every((task) => task.status === "approved");
  const fmtMoney = (n: number, ccy: string) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: ccy || "EUR", maximumFractionDigits: 2 }).format(n);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Rocket className="h-5 w-5 text-signal-400" />
          {t("client.plan.title")}
          {ready && (
            <Badge variant="success" className="ml-1">
              {t("client.plan.ready")}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-sm">
          {t("client.plan.subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {actionError && <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{actionError}</p>}
        {/* Escrow review & release */}
        {(canRelease || jobDone) && (
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
                    {jobDone ? t("client.plan.escrowReleasedTitle") : t("client.plan.escrowHeldTitle")}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {jobDone ? t(isLegacy ? "client.plan.escrowReleasedBody" : "billing.acceptedStripe") : payment ? t("client.plan.escrowHeldBody", {
                      gross: fmtMoney(payment.gross_amount, payment.currency),
                      net: fmtMoney(payment.net_amount, payment.currency),
                      fee: fmtMoney(payment.platform_fee, payment.currency),
                    }) : t("client.plan.reviewWithoutPayment")}

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
                    {t("client.plan.requestChanges")}
                  </Button>
                  <Button onClick={handleAccept} disabled={accepting || disputing} className="shrink-0">
                    {accepting ? t("client.plan.releasing") : t("client.plan.acceptAndRelease")}
                  </Button>
                </div>
              )}
              {jobDone && (
                <Badge variant="success" className="shrink-0">
                  {t("client.plan.completed")}
                </Badge>
              )}
            </div>

            {canRelease && !jobDone && showDispute && (
              <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3">
                <p className="text-xs font-medium text-ink-200">
                  {t("client.plan.disputePrompt")}
                </p>
                <textarea
                  aria-label={t("client.plan.disputePrompt")}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={3}
                  placeholder={t("client.plan.disputePlaceholder")}
                  className="mt-2 w-full rounded-md border border-input bg-ink-900 p-2 text-sm text-ink-100 placeholder:text-ink-500 focus:border-signal-500 focus:outline-none focus:ring-1 focus:ring-signal-500"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowDispute(false)}
                    disabled={disputing}
                    className="shrink-0"
                  >
                    {t("client.plan.cancel")}
                  </Button>
                  <Button onClick={handleDispute} disabled={disputing || !disputeReason.trim()} className="shrink-0">
                    {disputing ? t("client.plan.submitting") : t("client.plan.submitDispute")}
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
              {t("client.plan.briefTitle")}
            </h3>
          </div>
          {spec.objective && (
            <div className="rounded-lg border bg-ink-900 p-4">
              <p className="eyebrow text-muted-foreground">{t("client.plan.objective")}</p>
              <p className="mt-1 text-sm leading-relaxed">{spec.objective}</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {spec.deliverables.length > 0 && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-success" />
                  <p className="text-sm font-medium">{t("client.plan.deliverables")}</p>
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
                  <p className="text-sm font-medium">{t("client.plan.successCriteria")}</p>
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
                <p className="text-sm font-medium">{t("client.plan.constraints")}</p>
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
                {t("client.plan.briefEmpty")}
              </p>
            )}
        </section>

        {/* b. How it's broken down + c. Who will do it */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("client.plan.breakdown", { count: tasks.length })}
            </h3>
          </div>

          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("client.plan.noTasks")}</p>
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
                              {t("client.plan.priority")} {String(task.priority)}
                            </Badge>
                          )}
                          {!!task.revision_count && task.revision_count > 0 && (
                            <Badge variant="warning" className="font-normal">
                              {t("client.plan.revised")}
                              {task.revision_count > 1
                                ? " " + t("client.plan.revisionCount", { count: task.revision_count })
                                : ""}
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
                          {t("client.plan.matchedAgents")}
                        </p>
                      </div>
                      {agents.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {t("client.plan.matching")}
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
                                        {t("client.plan.bestMatch")}
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
                                  {agent.reasoning?.trim() || (agent.breakdown ? t("client.plan.reason", { capability: Math.round(agent.breakdown.capability_match), rate: Math.round(agent.breakdown.success_rate), count: agent.breakdown.completed_tasks_count }) : t("client.plan.reasonFallback"))}
                                </p>
                              </li>
                            );
                          })}
                        </ol>
                      )}
                    </div>
                    {task.delivered ? (
                      <div className="mt-3 rounded-lg border border-success/40 bg-success/10 p-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="success" className="flex-shrink-0">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            {t("client.plan.delivered")}
                          </Badge>
                          {task.delivered.produced_by ? (
                            <span className="text-xs text-muted-foreground">
                              {t("client.plan.producedBy", { name: task.delivered.produced_by })}
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
                    {task.delivered?.submission_id && (task.delivered.status === "submitted" || task.delivered.status === "under_review") && task.review_access?.error && (
                      <div className="mt-3 space-y-2 rounded-lg border p-4">
                        <p role="alert" className="text-sm text-danger">{t("client.detail.reviewAccessFailed", "Review permissions could not be loaded.")}</p>
                        <Button variant="outline" onClick={() => void load()}>{t("client.detail.reloadReviewAccess", "Reload review permissions")}</Button>
                      </div>
                    )}
                    {task.delivered?.submission_id && (task.delivered.status === "submitted" || task.delivered.status === "under_review") && !task.review_access?.error && !task.review_access?.can_review && (
                      <p className="mt-3 text-sm text-ink-300">{task.review_access?.reviewer_name
                        ? t("client.detail.waitingReviewer", { reviewer: task.review_access.reviewer_name })
                        : t("client.detail.waitingReview", "Waiting for the designated reviewer.")}</p>
                    )}
                    {task.delivered?.submission_id && (task.delivered.status === "submitted" || task.delivered.status === "under_review") && task.review_access?.can_review && (
                      <div className="mt-3 space-y-3 rounded-lg border p-4">
                        <label className="block text-sm font-medium" htmlFor={`review-${task.id}`}>{t("client.detail.reviewNotesLabel")}</label>
                        <textarea id={`review-${task.id}`} value={reviewNotes[task.delivered.submission_id] ?? ""} onChange={(event) => setReviewNotes((current) => ({ ...current, [task.delivered!.submission_id!]: event.target.value }))} className="w-full rounded-md border border-input bg-ink-900 p-2 text-sm" />
                        <div className="flex flex-wrap gap-3">
                          <Button disabled={reviewing !== null} onClick={() => handleReview(task.delivered!.submission_id!, "approved")}>{t("client.detail.approve")}</Button>
                          <Button variant="outline" disabled={reviewing !== null || !reviewNotes[task.delivered.submission_id]?.trim()} onClick={() => handleReview(task.delivered!.submission_id!, "rework_requested")}>{t("client.detail.requestRevision")}</Button>
                        </div>
                      </div>
                    )}
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
