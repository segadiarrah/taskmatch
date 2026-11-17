"use client";

import { useAdminCopy, adminSource, adminError } from "@/lib/admin-copy";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { HistoricalRecoveryPanel } from "./historical-recovery-panel";
import { ReassignmentPanel } from "./reassignment-panel";
import { apiGet, apiPost } from "@/lib/api";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Execution {
  assignment: { id: string; agent_id: string; agent_name: string; owner_user_id: string; kind: string; status: string; can_submit: boolean } | null;
  review_required: boolean;
  reviewer_name: string | null;
  operations: { id: string; status: string; attempts: number; last_error: string | null; available_at: string | null }[];
  can_retry: boolean;
  can_review: boolean;
  can_reassign?: boolean;
  recovery: { eligible: boolean; reason: string } | null;
}

export function ExecutionPanel({ taskId, submissions, onChanged }: { taskId: string; submissions: { id: string; status: string; summary: string | null }[]; onChanged: () => Promise<void> }) {
  const { a, formatStatus, formatDateTime } = useAdminCopy();
  const { user } = useAuth();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [summary, setSummary] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewId, setReviewId] = useState("");
  const reviewable = submissions.filter(item => ["submitted", "under_review"].includes(item.status));
  const activeReviewId = reviewable.some(item => item.id === reviewId) ? reviewId : reviewable[0]?.id;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setExecution(await apiGet<Execution>(`/v1/tasks/${taskId}/execution`));
    } catch (cause) {
      setExecution(null);
      setError(adminError(cause, adminSource("Execution details could not be loaded.")));
    } finally { setLoading(false); }
  }, [taskId]);
  useEffect(() => { void refresh(); }, [refresh]);

  async function refreshTask() {
    setBusy(true);
    try {
      await Promise.all([refresh(), onChanged()]);
    } finally { setBusy(false); }
  }

  async function retry() {
    setBusy(true); setError(null); setMessage(null);
    try {
      await apiPost(`/v1/tasks/${taskId}/retry`);
      await refresh();
      setMessage(adminSource("Retry requested. The server checks funding, attempt limits and remaining budget before execution or human intervention."));
    } catch (cause) {
      setError(adminError(cause, adminSource("The retry request failed.")));
    } finally { setBusy(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const assignment = execution?.assignment;
    if (!assignment?.can_submit || !result.trim() || !summary.trim()) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      await apiPost(`/v1/tasks/${taskId}/submissions`, {
        task_id: taskId, agent_id: assignment.agent_id, assignment_id: assignment.id,
        output_json: { result: result.trim(), summary: summary.trim() }, summary: summary.trim(),
      });
      setResult(""); setSummary("");
      await refresh();
      setMessage(adminSource("Deliverable submitted for review."));
      await onChanged();
    } catch (cause) {
      setError(adminError(cause, adminSource("The submission failed. Your draft has been kept.")));
    } finally { setBusy(false); }
  }

  async function review(decision: "approved" | "rework_requested") {
    if (!execution?.can_review || !activeReviewId || (decision === "rework_requested" && !reviewNotes.trim())) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      await apiPost(`/v1/submissions/${activeReviewId}/reviews`, {
        submission_id: activeReviewId, decision, ...(reviewNotes.trim() ? { notes: reviewNotes.trim() } : {}),
      });
      setReviewNotes("");
      await refresh();
      await onChanged();
    } catch (cause) {
      setError(adminError(cause, adminSource("The review failed. Your notes have been kept.")));
    } finally { setBusy(false); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-base">{a("Execution and human work")}</CardTitle>
        <CardDescription>{a("Tasks progress independently. Required human work and review keep the mission in progress until resolved.")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && <p role="alert" className="text-sm text-danger">{a(error)}</p>}
        {message && <p role="status" className="text-sm text-success">{a(message)}</p>}
        {loading && <p className="text-sm text-ink-400">{a("Loading execution details…")}</p>}
        {!loading && !execution && <Button variant="outline" onClick={refresh}>{a("Reload execution details")}</Button>}
        {execution && <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 text-sm text-ink-300">
              {execution.assignment ? <p>{a("Assigned to")}  <strong className="text-ink-50">{execution.assignment.agent_name}</strong> · {formatStatus(execution.assignment.kind)} · {formatStatus(execution.assignment.status)}</p> : <p>{a("No active assignment.")}</p>}
              {execution.review_required && <p className="text-warning">{a("Human review required")}{execution.reviewer_name ? ` · ${execution.reviewer_name}` : ""}{a(". Automatic validation alone does not approve this task.")}</p>}
              {execution.recovery && <p>{a(execution.recovery.reason)}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={refreshTask} disabled={busy || loading}>{a("Refresh execution")}</Button>
              <Button variant="outline" onClick={retry} disabled={busy || loading || !execution.can_retry}>{a("Retry task")}</Button>
            </div>
          </div>
          {execution.operations.length ? <ul className="space-y-3" aria-label={a("Execution attempts")}>{execution.operations.map(operation => (
            <li key={operation.id} className="rounded-md border border-ink-700 bg-ink-900/40 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-3"><Badge variant={operation.status === "failed" ? "destructive" : "secondary"}>{formatStatus(operation.status)}</Badge><span>{a("{count} attempts", { count: operation.attempts })}</span></div>
              {operation.last_error && <p className="mt-2 break-words text-danger">{a(operation.last_error)}</p>}
              {operation.available_at && <p className="mt-2 text-xs text-ink-400">{a("Available from")}  {formatDateTime(operation.available_at)}</p>}
            </li>
          ))}</ul> : <p className="text-sm text-ink-400">{a("No execution attempts recorded.")}</p>}
          {user?.role === "admin" && execution.recovery?.eligible && <HistoricalRecoveryPanel taskId={taskId} onChanged={async () => { await refresh(); await onChanged(); }} />}
          {user?.role === "admin" && execution.can_reassign && <ReassignmentPanel taskId={taskId} onChanged={async () => { await refresh(); await onChanged(); }} />}
          {execution.assignment?.can_submit && <form onSubmit={submit} className="space-y-4 border-t border-ink-700 pt-5">
            <h3 className="font-semibold text-ink-50">{a("Submit your human deliverable")}</h3>
            <p className="text-sm text-ink-300">{a("Record the actual work completed for your assignment. Submission does not mark the mission accepted.")}</p>
            <div className="space-y-2"><label htmlFor="human-result" className="text-sm font-medium">{a("Deliverable result")}</label><Textarea id="human-result" value={result} onChange={event => setResult(event.target.value)} rows={8} required disabled={busy} /></div>
            <div className="space-y-2"><label htmlFor="human-summary" className="text-sm font-medium">{a("Delivery summary")}</label><Textarea id="human-summary" value={summary} onChange={event => setSummary(event.target.value)} rows={3} required disabled={busy} /></div>
            <Button type="submit" disabled={busy || !result.trim() || !summary.trim()}>{a("Submit human deliverable")}</Button>
          </form>}
          {execution.can_review && reviewable.length > 0 && <div className="space-y-4 border-t border-ink-700 pt-5">
            <h3 className="font-semibold text-ink-50">{a("Human review")}</h3>
            <p className="text-sm text-ink-300">{a("Inspect the submitted result and evidence below before approving. Request corrections when the acceptance criteria have not been met.")}</p>
            <div className="space-y-2"><label htmlFor="human-review-submission" className="text-sm font-medium">{a("Submission to review")}</label><Select id="human-review-submission" value={activeReviewId} onChange={event => setReviewId(event.target.value)} disabled={busy}>{reviewable.map(item => <option key={item.id} value={item.id}>{item.summary || item.id}</option>)}</Select></div>
            <div className="space-y-2"><label htmlFor="human-review-notes" className="text-sm font-medium">{a("Human review notes")}</label><Textarea id="human-review-notes" value={reviewNotes} onChange={event => setReviewNotes(event.target.value)} rows={3} disabled={busy} /></div>
            <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={() => review("approved")}>{a("Approve human review")}</Button><Button variant="outline" disabled={busy || !reviewNotes.trim()} onClick={() => review("rework_requested")}>{a("Request corrections")}</Button></div>
          </div>}
          <p className="text-sm leading-relaxed text-ink-400">{a("If the mission cannot be delivered, use the")}  <Link className="text-signal-400 hover:underline" href="/admin/payments">{a("payments workflow")} </Link> {a("to resolve cancellation and a full refund. Completed work remains visible for review; partial delivery and partial refunds are not offered at launch.")}</p>
        </>}
      </CardContent>
    </Card>
  );
}
