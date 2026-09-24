"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, ApiError } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { JOB_LIFECYCLE } from "@/lib/job-requirements";
import { formatCurrency, formatDate, formatStatus } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ExecutionPlan from "./execution-plan";
import QuotePanel from "./quote-panel";
import DeliveryPanel from "./delivery-panel";

/**
 * Job states in which no deliverable exists yet, so there is nothing to hand
 * over. These are lifecycle identifiers rather than copy, so they are declared
 * as bare constants — the localization checker treats string literals inside
 * JSX, objects and arrays as untranslated user-facing text.
 */
const STATUS_DRAFT = "draft";
const STATUS_SUBMITTED = "submitted";

function hasDeliverablePhase(status: string): boolean {
  return status !== STATUS_DRAFT && status !== STATUS_SUBMITTED;
}
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  DollarSign,
  Calendar,
  FileText,
  ChevronRight,
} from "lucide-react";

interface JobDetail {
  id: string;
  title: string;
  raw_description: string;
  status: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  deadline: string | null;
  auto_select_enabled: boolean;
  formatted_summary: string | null;
  created_at: string;
  updated_at: string;
}


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
  const { t } = useTranslation();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<JobDetail>(`/v1/jobs/${jobId}`);
      setJob(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError(t("client.detail.notFound"));
      } else {
        setError(err instanceof Error ? err.message : "Failed to load job details");
      }
    } finally {
      setLoading(false);
    }
  }, [jobId, t]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div role="alert" className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">{error ?? t("client.detail.notFound")}</p>
        <Button variant="outline" onClick={fetchJob}>{t("client.tryAgain")}</Button>
        <Link href="/client/jobs">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("client.detail.backToJobs")}
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
          {t("client.detail.breadcrumbDashboard")}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/client/jobs" className="hover:text-foreground transition-colors">
          {t("client.detail.breadcrumbJobs")}
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
              <h1 className="font-display text-2xl font-medium text-ink-50 sm:text-3xl">{job.title}</h1>
              <Badge variant={statusBadgeVariant(job.status)}>
                {formatStatus(job.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {t("client.detail.created")} {formatDate(job.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t("client.detail.progress")}</CardTitle>
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

      {/* Quote — the gate. Shown from the moment the job is priced until the
          client decides; execution only begins once they approve. */}
      <QuotePanel jobId={job.id} onAccepted={fetchJob} />

      {/* Execution Plan */}
      <ExecutionPlan
        jobId={job.id}
        jobStatus={job.status}
        fallbackCurrency={job.currency}
        onSubmitted={fetchJob}
      />

      {/* Delivery & handover — only meaningful once the work is under way. */}
      {hasDeliverablePhase(job.status) && <DeliveryPanel jobId={job.id} />}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("client.detail.description")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{job.raw_description}</p>
            </CardContent>
          </Card>

          {/* Formatted Summary */}
          {job.formatted_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {t("client.detail.summaryTitle")}
                </CardTitle>
                <CardDescription>
                  {t("client.detail.summarySubtitle")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert text-sm whitespace-pre-wrap">
                  {job.formatted_summary}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Budget Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                {t("client.detail.budget")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("client.detail.range")}</span>
                <span className="font-mono font-medium">
                  {formatCurrency(job.budget_min, job.currency)} - {formatCurrency(job.budget_max, job.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("client.detail.currency")}</span>
                <span className="font-mono font-medium">{job.currency}</span>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("client.detail.details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("client.detail.deadline")}</span>
                <span className="font-medium">
                  {job.deadline ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(job.deadline)}
                    </span>
                  ) : (
                    t("client.detail.noDeadline")
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("client.detail.autoSelect")}</span>
                <span className="font-medium">{job.auto_select_enabled ? t("client.detail.yes") : t("client.detail.no")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("client.detail.lastUpdated")}</span>
                <span className="font-medium">{formatDate(job.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
