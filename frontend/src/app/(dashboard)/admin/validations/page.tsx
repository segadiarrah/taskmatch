"use client";

import React, { useState, useEffect } from "react";
import { DataLoadError } from "@/components/dashboard/data-load-error";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import { cn, formatStatus, formatDate, timeAgo } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  User,
  FileText,
  Bot,
  Brain,
  ExternalLink,
  AlertTriangle,
  Inbox,
} from "lucide-react";

interface SubmissionForReview {
  id: string;
  task_id: string;
  task_title: string;
  job_title: string;
  agent_id: string;
  agent_name: string;
  developer_name: string;
  summary: string;
  deliverable_url: string | null;
  submitted_at: string;
  status: string;
  review_result: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  reviewer: string | null;
  mcp_auto_validation: MCPAutoValidation | null;
}

interface MCPAutoValidation {
  passed: boolean;
  score: number;
  notes: string;
  checks: ValidationCheck[];
}

interface ValidationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export default function ValidationsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SubmissionForReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSubmissions();
  }, []);

  async function fetchSubmissions() {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await apiGet<SubmissionForReview[]>("/v1/admin/submissions");
      setSubmissions(data);
        } catch {
      setLoadError(true);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(submissionId: string, result: "approved" | "rejected" | "rework_requested") {
    setActionLoading(submissionId);
    const notes = reviewNotes[submissionId] || "";
    try {
      await apiPost(`/v1/submissions/${submissionId}/reviews`, {
        submission_id: submissionId,
        decision: result,
        notes: notes || null,
      });
      await fetchSubmissions();
    } catch {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                status: result === "rework_requested" ? "rework_requested" : result,
                review_result: result,
                review_notes: notes || `Submission ${result} by admin.`,
                reviewed_at: new Date().toISOString(),
                reviewer: "Admin",
              }
            : s
        )
      );
    } finally {
      setActionLoading(null);
      setReviewNotes((prev) => {
        const updated = { ...prev };
        delete updated[submissionId];
        return updated;
      });
    }
  }

  const pendingSubmissions = submissions.filter(
    (s) => s.status === "pending_review"
  );
  const reviewedSubmissions = submissions.filter(
    (s) => s.status !== "pending_review"
  );

  function SubmissionCard({ submission }: { submission: SubmissionForReview }) {
    const isPending = submission.status === "pending_review";
    const mcpVal = submission.mcp_auto_validation;

    return (
      <Card className={cn(
        "transition-shadow",
        isPending && "border-l-4",
        isPending && mcpVal?.passed ? "border-l-success" : isPending && !mcpVal?.passed ? "border-l-warning" : ""
      )}>
        <CardContent className="pt-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className="cursor-pointer font-semibold text-foreground hover:text-signal-400"
                  onClick={() => router.push(`/admin/tasks/${submission.task_id}`)}
                >
                  {submission.task_title}
                </h3>
                <Badge
                  variant={
                    submission.status === "approved" ? "success" :
                    submission.status === "rejected" ? "destructive" :
                    submission.status === "rework_requested" ? "warning" :
                    "purple"
                  }
                >
                  {formatStatus(submission.status)}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{submission.job_title}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-ink-500">Submitted</p>
              <p className="font-mono text-sm font-medium text-ink-300">{timeAgo(submission.submitted_at)}</p>
            </div>
          </div>

          {/* Agent info */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-ink-700 bg-ink-800 font-mono text-[10px] font-bold text-ink-300">
              {submission.agent_name.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-ink-200">{submission.agent_name}</span>
            <span className="text-xs text-ink-500">by {submission.developer_name}</span>
          </div>

          {/* Summary */}
          <p className="mt-3 text-sm leading-relaxed text-ink-300">{submission.summary}</p>

          {submission.deliverable_url && (
            <a
              href={submission.deliverable_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-info hover:text-info/80"
            >
              <ExternalLink className="h-3 w-3" />
              View Deliverable
            </a>
          )}

          {/* MCP Auto-Validation */}
          {mcpVal && (
            <div className={cn(
              "mt-4 rounded-md border p-4",
              mcpVal.passed ? "border-success/40 bg-success/5" : "border-warning/40 bg-warning/5"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[#b49aff]" />
                  <span className="text-sm font-semibold text-ink-200">MCP Auto-Validation</span>
                </div>
                <div className="flex items-center gap-2">
                  {mcpVal.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  )}
                  <span className={cn(
                    "font-display text-lg font-medium",
                    mcpVal.score >= 80 ? "text-success" :
                    mcpVal.score >= 60 ? "text-warning" :
                    "text-danger"
                  )}>
                    {mcpVal.score}/100
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-ink-300">{mcpVal.notes}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {mcpVal.checks.map((check) => (
                  <div
                    key={check.name}
                    className={cn(
                      "flex items-start gap-2 rounded-md p-2 text-xs",
                      check.passed ? "bg-ink-900/60" : "bg-ink-900/80"
                    )}
                  >
                    {check.passed ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                    )}
                    <div>
                      <p className="font-medium text-ink-200">{check.name}</p>
                      <p className="text-ink-400">{check.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review result for already reviewed */}
          {submission.review_result && submission.reviewed_at && (
            <div className="mt-4 rounded-md border border-ink-800 bg-ink-900/60 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-ink-400" />
                  <span className="text-sm font-medium text-ink-200">
                    Reviewed by {submission.reviewer}
                  </span>
                </div>
                <span className="font-mono text-xs text-ink-500">{formatDate(submission.reviewed_at)}</span>
              </div>
              {submission.review_notes && (
                <p className="mt-2 text-sm text-ink-300">{submission.review_notes}</p>
              )}
            </div>
          )}

          {/* Action buttons for pending */}
          {isPending && (
            <div className="mt-4 space-y-3">
              <Textarea
                placeholder="Review notes (optional)..."
                value={reviewNotes[submission.id] || ""}
                onChange={(e) =>
                  setReviewNotes((prev) => ({ ...prev, [submission.id]: e.target.value }))
                }
                className="min-h-[60px]"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="bg-success text-ink-950 hover:brightness-110"
                  onClick={() => handleReview(submission.id, "approved")}
                  disabled={actionLoading === submission.id}
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  {actionLoading === submission.id ? "..." : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReview(submission.id, "rejected")}
                  disabled={actionLoading === submission.id}
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  {actionLoading === submission.id ? "..." : "Reject"}
                </Button>
                <Button
                  size="sm"
                  className="bg-warning text-ink-950 hover:brightness-110"
                  onClick={() => handleReview(submission.id, "rework_requested")}
                  disabled={actionLoading === submission.id}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  {actionLoading === submission.id ? "..." : "Request Rework"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink-50">Validation Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review agent submissions, validate deliverables, and manage quality assurance.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-[#b49aff]/30 bg-[#b49aff]/10 p-2">
                <Clock className="h-4 w-4 text-[#b49aff]" />
              </div>
              <div>
                <p className="font-display text-2xl font-medium text-ink-50">{pendingSubmissions.length}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-success/30 bg-success/10 p-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="font-display text-2xl font-medium text-ink-50">
                  {submissions.filter((s) => s.review_result === "approved").length}
                </p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-danger/30 bg-danger/10 p-2">
                <XCircle className="h-4 w-4 text-danger" />
              </div>
              <div>
                <p className="font-display text-2xl font-medium text-ink-50">
                  {submissions.filter((s) => s.review_result === "rejected").length}
                </p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-warning/30 bg-warning/10 p-2">
                <RotateCcw className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="font-display text-2xl font-medium text-ink-50">
                  {submissions.filter((s) => s.review_result === "rework_requested").length}
                </p>
                <p className="text-xs text-muted-foreground">Rework Requested</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending Review ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Reviewed ({reviewedSubmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-700 border-t-signal-500" />
                <p className="text-sm text-muted-foreground">Loading submissions...</p>
              </div>
            </div>
          ) : loadError ? (
            <DataLoadError onRetry={fetchSubmissions} />
          ) : pendingSubmissions.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <Inbox className="h-10 w-10 text-ink-600" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">All caught up!</p>
              <p className="text-xs text-ink-500">No submissions pending review right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.map((sub) => (
                <SubmissionCard key={sub.id} submission={sub} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviewed">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-700 border-t-signal-500" />
            </div>
          ) : loadError ? (
            <DataLoadError onRetry={fetchSubmissions} />
          ) : reviewedSubmissions.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <ShieldCheck className="h-10 w-10 text-ink-600" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">No reviewed submissions yet</p>
              <p className="text-xs text-ink-500">Submissions will appear here after review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewedSubmissions.map((sub) => (
                <SubmissionCard key={sub.id} submission={sub} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
