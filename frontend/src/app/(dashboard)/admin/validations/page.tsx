"use client";

import React, { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSubmissions();
  }, []);

  async function fetchSubmissions() {
    setLoading(true);
    try {
      const data = await apiGet<SubmissionForReview[]>("/v1/admin/submissions");
      setSubmissions(data);
    } catch {
      setSubmissions([
        {
          id: "s-1",
          task_id: "t-5",
          task_title: "Mobile App UI Screens",
          job_title: "Mobile App API Integration",
          agent_id: "a-5",
          agent_name: "DesignPro",
          developer_name: "Bob Builder",
          summary: "Completed all 12 mobile screens including onboarding flow, dashboard, settings, and profile pages. All screens follow the design system and support both light and dark themes.",
          deliverable_url: "https://github.com/example/pr/55",
          submitted_at: "2026-03-21T14:00:00Z",
          status: "pending_review",
          review_result: null,
          review_notes: null,
          reviewed_at: null,
          reviewer: null,
          mcp_auto_validation: {
            passed: true,
            score: 91,
            notes: "All acceptance criteria met. Code quality is high with consistent patterns.",
            checks: [
              { name: "Code Quality", passed: true, detail: "ESLint score: 98/100. No critical issues." },
              { name: "Test Coverage", passed: true, detail: "85% coverage across components." },
              { name: "Acceptance Criteria", passed: true, detail: "All 8 criteria satisfied." },
              { name: "Performance", passed: true, detail: "Lighthouse score: 94. Under budget." },
            ],
          },
        },
        {
          id: "s-2",
          task_id: "t-7",
          task_title: "ETL Pipeline Setup",
          job_title: "Data Pipeline Optimization",
          agent_id: "a-11",
          agent_name: "DataBot",
          developer_name: "Eve Engineer",
          summary: "Implemented the complete ETL pipeline with Apache Airflow DAGs for data extraction from 3 sources, transformation logic, and loading into the data warehouse. Includes monitoring and alerting.",
          deliverable_url: "https://github.com/example/pr/58",
          submitted_at: "2026-03-21T10:00:00Z",
          status: "pending_review",
          review_result: null,
          review_notes: null,
          reviewed_at: null,
          reviewer: null,
          mcp_auto_validation: {
            passed: false,
            score: 72,
            notes: "Most criteria met but test coverage is below threshold and one acceptance criterion is partially addressed.",
            checks: [
              { name: "Code Quality", passed: true, detail: "Clean code with good documentation." },
              { name: "Test Coverage", passed: false, detail: "62% coverage, below the 80% threshold." },
              { name: "Acceptance Criteria", passed: false, detail: "7 of 8 criteria met. Error handling for source C incomplete." },
              { name: "Performance", passed: true, detail: "Pipeline executes within SLA requirements." },
            ],
          },
        },
        {
          id: "s-3",
          task_id: "t-9",
          task_title: "ML Model Training",
          job_title: "ML Model Deployment",
          agent_id: "a-4",
          agent_name: "MLEngine",
          developer_name: "Carol Coder",
          summary: "Phase 1 model training complete. Achieved 94.2% accuracy on test set (target was 92%). Model is packaged as a Docker container with REST API endpoint for inference.",
          deliverable_url: "https://github.com/example/pr/60",
          submitted_at: "2026-03-20T16:00:00Z",
          status: "pending_review",
          review_result: null,
          review_notes: null,
          reviewed_at: null,
          reviewer: null,
          mcp_auto_validation: {
            passed: true,
            score: 96,
            notes: "Exceptional quality. Model exceeds accuracy targets with efficient inference times.",
            checks: [
              { name: "Model Accuracy", passed: true, detail: "94.2% vs 92% target. Exceeds requirements." },
              { name: "Test Coverage", passed: true, detail: "88% coverage with comprehensive unit and integration tests." },
              { name: "Acceptance Criteria", passed: true, detail: "All criteria met including containerization." },
              { name: "Documentation", passed: true, detail: "Complete model card and API documentation." },
            ],
          },
        },
        {
          id: "s-4",
          task_id: "t-6",
          task_title: "REST API Endpoints",
          job_title: "Mobile App API Integration",
          agent_id: "a-6",
          agent_name: "APIWizard",
          developer_name: "Dan Dev",
          summary: "All 24 REST endpoints implemented with full CRUD operations, authentication middleware, rate limiting, and OpenAPI documentation.",
          deliverable_url: "https://github.com/example/pr/48",
          submitted_at: "2026-03-18T11:00:00Z",
          status: "approved",
          review_result: "approved",
          review_notes: "Excellent API design with comprehensive documentation. All edge cases handled properly.",
          reviewed_at: "2026-03-19T09:00:00Z",
          reviewer: "Admin",
          mcp_auto_validation: {
            passed: true,
            score: 94,
            notes: "High quality implementation with excellent test coverage.",
            checks: [
              { name: "Code Quality", passed: true, detail: "Clean architecture with proper separation of concerns." },
              { name: "Test Coverage", passed: true, detail: "91% coverage." },
              { name: "Acceptance Criteria", passed: true, detail: "All 10 criteria met." },
              { name: "API Spec Compliance", passed: true, detail: "OpenAPI spec is complete and accurate." },
            ],
          },
        },
        {
          id: "s-5",
          task_id: "t-12",
          task_title: "Authentication System",
          job_title: "SaaS Platform Build",
          agent_id: "a-9",
          agent_name: "FrontendPro",
          developer_name: "Carol Coder",
          summary: "JWT-based auth system with OAuth2 social login (Google, GitHub), MFA support, and password reset flow.",
          deliverable_url: "https://github.com/example/pr/45",
          submitted_at: "2026-03-16T14:00:00Z",
          status: "rejected",
          review_result: "rejected",
          review_notes: "MFA implementation has security vulnerabilities. TOTP secret storage needs encryption at rest. Rate limiting on auth endpoints is missing.",
          reviewed_at: "2026-03-17T10:00:00Z",
          reviewer: "Admin",
          mcp_auto_validation: {
            passed: false,
            score: 58,
            notes: "Critical security issues identified in MFA implementation.",
            checks: [
              { name: "Code Quality", passed: true, detail: "Code is well-structured." },
              { name: "Security Audit", passed: false, detail: "TOTP secrets stored in plaintext. No rate limiting." },
              { name: "Acceptance Criteria", passed: false, detail: "5 of 7 criteria met. Security requirements not satisfied." },
              { name: "Test Coverage", passed: false, detail: "71% coverage. Security edge cases not tested." },
            ],
          },
        },
        {
          id: "s-6",
          task_id: "t-15",
          task_title: "Dashboard Components",
          job_title: "Analytics Platform",
          agent_id: "a-1",
          agent_name: "ReactMaster",
          developer_name: "Alice Dev",
          summary: "Built 15 reusable chart and data visualization components using Recharts. Includes responsive grid layout system.",
          deliverable_url: "https://github.com/example/pr/42",
          submitted_at: "2026-03-10T09:00:00Z",
          status: "approved",
          review_result: "approved",
          review_notes: "Beautifully crafted components with excellent accessibility and responsive design.",
          reviewed_at: "2026-03-10T14:00:00Z",
          reviewer: "Admin",
          mcp_auto_validation: {
            passed: true,
            score: 97,
            notes: "Outstanding quality across all dimensions.",
            checks: [
              { name: "Code Quality", passed: true, detail: "Exemplary patterns with Storybook documentation." },
              { name: "Test Coverage", passed: true, detail: "93% coverage." },
              { name: "Acceptance Criteria", passed: true, detail: "All criteria exceeded." },
              { name: "Accessibility", passed: true, detail: "WCAG 2.1 AA compliant." },
            ],
          },
        },
      ]);
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
        isPending && mcpVal?.passed ? "border-l-emerald-400" : isPending && !mcpVal?.passed ? "border-l-amber-400" : ""
      )}>
        <CardContent className="pt-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className="font-semibold text-zinc-900 hover:text-zinc-600 cursor-pointer"
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
              <p className="mt-0.5 text-sm text-zinc-500">{submission.job_title}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-zinc-400">Submitted</p>
              <p className="text-sm font-medium text-zinc-600">{timeAgo(submission.submitted_at)}</p>
            </div>
          </div>

          {/* Agent info */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600">
              {submission.agent_name.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-zinc-700">{submission.agent_name}</span>
            <span className="text-xs text-zinc-400">by {submission.developer_name}</span>
          </div>

          {/* Summary */}
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">{submission.summary}</p>

          {submission.deliverable_url && (
            <a
              href={submission.deliverable_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-3 w-3" />
              View Deliverable
            </a>
          )}

          {/* MCP Auto-Validation */}
          {mcpVal && (
            <div className={cn(
              "mt-4 rounded-lg border p-4",
              mcpVal.passed ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/50"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-semibold text-zinc-700">MCP Auto-Validation</span>
                </div>
                <div className="flex items-center gap-2">
                  {mcpVal.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className={cn(
                    "text-lg font-bold",
                    mcpVal.score >= 80 ? "text-emerald-600" :
                    mcpVal.score >= 60 ? "text-amber-600" :
                    "text-red-600"
                  )}>
                    {mcpVal.score}/100
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-zinc-600">{mcpVal.notes}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {mcpVal.checks.map((check) => (
                  <div
                    key={check.name}
                    className={cn(
                      "flex items-start gap-2 rounded-md p-2 text-xs",
                      check.passed ? "bg-white/60" : "bg-white/80"
                    )}
                  >
                    {check.passed ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-zinc-700">{check.name}</p>
                      <p className="text-zinc-500">{check.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review result for already reviewed */}
          {submission.review_result && submission.reviewed_at && (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-700">
                    Reviewed by {submission.reviewer}
                  </span>
                </div>
                <span className="text-xs text-zinc-400">{formatDate(submission.reviewed_at)}</span>
              </div>
              {submission.review_notes && (
                <p className="mt-2 text-sm text-zinc-600">{submission.review_notes}</p>
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
                  className="bg-amber-500 hover:bg-amber-600 text-white"
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
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Validation Center</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Review agent submissions, validate deliverables, and manage quality assurance.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{pendingSubmissions.length}</p>
                <p className="text-xs text-zinc-500">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">
                  {submissions.filter((s) => s.review_result === "approved").length}
                </p>
                <p className="text-xs text-zinc-500">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">
                  {submissions.filter((s) => s.review_result === "rejected").length}
                </p>
                <p className="text-xs text-zinc-500">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <RotateCcw className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">
                  {submissions.filter((s) => s.review_result === "rework_requested").length}
                </p>
                <p className="text-xs text-zinc-500">Rework Requested</p>
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
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
                <p className="text-sm text-zinc-500">Loading submissions...</p>
              </div>
            </div>
          ) : pendingSubmissions.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <Inbox className="h-10 w-10 text-zinc-300" />
              <p className="mt-3 text-sm font-medium text-zinc-500">All caught up!</p>
              <p className="text-xs text-zinc-400">No submissions pending review right now.</p>
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
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
            </div>
          ) : reviewedSubmissions.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <ShieldCheck className="h-10 w-10 text-zinc-300" />
              <p className="mt-3 text-sm font-medium text-zinc-500">No reviewed submissions yet</p>
              <p className="text-xs text-zinc-400">Submissions will appear here after review.</p>
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
