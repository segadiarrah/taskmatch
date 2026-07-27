"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { formatCurrency, formatDate, formatStatus } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import ExecutionPlan from "./execution-plan";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Calendar,
  FileText,
  ChevronRight,
  Download,
  ThumbsUp,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
  task_type: string;
  assigned_agent_id: string | null;
  assigned_agent_name: string | null;
  budget: number;
  submission_status: string | null;
  submission_id: string | null;
}

interface Submission {
  id: string;
  task_id: string;
  task_title: string;
  status: string;
  output_summary: string;
  artifact_urls: string[];
  score: number | null;
  submitted_at: string;
}

interface JobDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  deadline: string | null;
  auto_select_agents: boolean;
  formatted_summary: string | null;
  created_at: string;
  updated_at: string;
  tasks: Task[];
  deliverables: Submission[];
  payment_status: string;
  total_paid: number;
  total_budget_used: number;
}

const JOB_LIFECYCLE = [
  "draft",
  "pending",
  "active",
  "in_progress",
  "client_review",
  "completed",
];

const statusBadgeVariant = (status: string) => {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
    draft: "secondary",
    pending: "warning",
    open_for_bids: "default",
    active: "default",
    assigned: "default",
    in_progress: "default",
    completed: "success",
    approved: "success",
    cancelled: "destructive",
    failed: "destructive",
    rejected: "destructive",
    client_review: "warning",
    submitted: "warning",
    pending_review: "warning",
  };
  return map[status] ?? "outline";
};

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<JobDetail>(`/v1/jobs/${jobId}`);
      setJob(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("Job not found.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load job details");
      }
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleApprove = async () => {
    if (!job) return;
    const submission = job.tasks
      ?.flatMap((t: any) => t.submissions || [])
      ?.find((s: any) => s.status === "submitted" || s.status === "under_review");
    if (!submission) return;
    try {
      setActionLoading("approve");
      await apiPost(`/v1/submissions/${submission.id}/reviews`, {
        submission_id: submission.id,
        decision: "approved",
        notes: reviewNote.trim() || null,
      });
      setReviewNote("");
      await fetchJob();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestRevision = async () => {
    if (!job || !reviewNote.trim()) return;
    const submission = job.tasks
      ?.flatMap((t: any) => t.submissions || [])
      ?.find((s: any) => s.status === "submitted" || s.status === "under_review");
    if (!submission) return;
    try {
      setActionLoading("revision");
      await apiPost(`/v1/submissions/${submission.id}/reviews`, {
        submission_id: submission.id,
        decision: "rework_requested",
        notes: reviewNote.trim(),
      });
      setReviewNote("");
      await fetchJob();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request revision");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">{error ?? "Job not found"}</p>
        <Link href="/client/jobs">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>
      </div>
    );
  }

  const lifecycleIndex = JOB_LIFECYCLE.indexOf(job.status);
  const progressPercent =
    job.status === "cancelled"
      ? 0
      : lifecycleIndex >= 0
        ? Math.round(((lifecycleIndex + 1) / JOB_LIFECYCLE.length) * 100)
        : 50;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/client" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/client/jobs" className="hover:text-foreground transition-colors">
          Jobs
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground truncate max-w-[200px]">{job.title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/client/jobs">
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
              <Badge variant={statusBadgeVariant(job.status)}>
                {formatStatus(job.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Created {formatDate(job.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Job Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="mb-4" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {JOB_LIFECYCLE.map((stage) => (
              <span
                key={stage}
                className={
                  stage === job.status
                    ? "font-semibold text-primary"
                    : lifecycleIndex > JOB_LIFECYCLE.indexOf(stage)
                      ? "text-foreground"
                      : ""
                }
              >
                {formatStatus(stage)}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Execution Plan */}
      <ExecutionPlan
        jobId={job.id}
        jobStatus={job.status}
        fallbackCurrency={job.currency}
        onSubmitted={fetchJob}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{job.description}</p>
            </CardContent>
          </Card>

          {/* Formatted Summary */}
          {job.formatted_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  AI-Structured Summary
                </CardTitle>
                <CardDescription>
                  Auto-generated structured breakdown of your job requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert text-sm whitespace-pre-wrap">
                  {job.formatted_summary}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deliverables */}
          {job.deliverables && job.deliverables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Final Deliverables
                </CardTitle>
                <CardDescription>Approved submissions from agents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.deliverables.map((sub) => (
                  <div key={sub.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{sub.task_title}</p>
                      <Badge variant="success">{formatStatus(sub.status)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{sub.output_summary}</p>
                    {sub.score !== null && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Quality Score:</span>
                        <span className="font-semibold">{sub.score}/100</span>
                      </div>
                    )}
                    {sub.artifact_urls && sub.artifact_urls.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {sub.artifact_urls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <Download className="h-3 w-3" />
                            Artifact {idx + 1}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDate(sub.submitted_at)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Client Review Actions */}
          {job.status === "client_review" && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="text-lg">Review Required</CardTitle>
                <CardDescription>
                  This job is awaiting your review. Approve the results or request revisions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Revision Notes (optional for approve, required for revision)</label>
                  <Textarea
                    placeholder="Provide feedback or revision instructions..."
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
              <CardFooter className="gap-3">
                <Button
                  onClick={handleApprove}
                  disabled={actionLoading !== null}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {actionLoading === "approve" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsUp className="mr-2 h-4 w-4" />
                  )}
                  Approve Result
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRequestRevision}
                  disabled={actionLoading !== null || !reviewNote.trim()}
                >
                  {actionLoading === "revision" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-2 h-4 w-4" />
                  )}
                  Request Revision
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Budget Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Range</span>
                <span className="font-medium">
                  {formatCurrency(job.budget_min, job.currency)} - {formatCurrency(job.budget_max, job.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Used</span>
                <span className="font-medium">
                  {formatCurrency(job.total_budget_used ?? 0, job.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium">{job.currency}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusBadgeVariant(job.payment_status ?? "pending")}>
                  {formatStatus(job.payment_status ?? "pending")}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Paid</span>
                <span className="font-medium">
                  {formatCurrency(job.total_paid ?? 0, job.currency)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deadline</span>
                <span className="font-medium">
                  {job.deadline ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(job.deadline)}
                    </span>
                  ) : (
                    "No deadline"
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Auto-select</span>
                <span className="font-medium">{job.auto_select_agents ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium">{formatDate(job.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
