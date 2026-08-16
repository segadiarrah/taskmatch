"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency, formatDate, formatStatus } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Loader2,
  AlertCircle,
  Briefcase,
  ArrowRight,
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  status: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  task_count: number;
  deadline: string | null;
  created_at: string;
}

interface JobsResponse {
  jobs: Job[];
  items?: Job[];
  total: number;
}

/* Les libellés dépendent de la langue courante : la liste est construite
   dans le composant plutôt qu'au chargement du module. */
const jobStatuses = (t: (key: string) => string) => [
  { value: "", label: t("client.jobs.allStatuses") },
  { value: "draft", label: t("client.jobs.status.draft") },
  { value: "pending", label: t("client.jobs.status.pending") },
  { value: "active", label: t("client.jobs.status.active") },
  { value: "in_progress", label: t("client.jobs.status.in_progress") },
  { value: "client_review", label: t("client.jobs.status.client_review") },
  { value: "completed", label: t("client.jobs.status.completed") },
  { value: "cancelled", label: t("client.jobs.status.cancelled") },
];

const statusBadgeVariant = (status: string) => {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
    draft: "secondary",
    pending: "warning",
    active: "default",
    in_progress: "default",
    completed: "success",
    cancelled: "destructive",
    client_review: "warning",
  };
  return map[status] ?? "outline";
};

export default function ClientJobsPage() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("skip", String((page - 1) * perPage));
      params.set("limit", String(perPage));
      params.set("sort", "-created_at");
      if (statusFilter) params.set("status", statusFilter);

      const data = await apiGet<JobsResponse>(`/v1/jobs?${params.toString()}`);
      setJobs(data.jobs ?? data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink-50 sm:text-3xl">{t("client.jobs.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("client.jobs.subtitle")}
          </p>
        </div>
        <Link href="/client/jobs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("client.jobs.create")}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-48">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                {jobStatuses(t).map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("client.jobs.found", { count: total })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchJobs} className="ml-auto">
            {t("client.jobs.retry")}
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && jobs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("client.jobs.emptyTitle")}</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              {statusFilter
                ? t("client.jobs.emptyFiltered")
                : t("client.jobs.emptyAll")}
            </p>
            {!statusFilter && (
              <Link href="/client/jobs/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("client.jobs.createFirst")}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Jobs Table */}
      {!loading && !error && jobs.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("client.jobs.column.title")}</TableHead>
                <TableHead>{t("client.jobs.column.status")}</TableHead>
                <TableHead>{t("client.jobs.column.budget")}</TableHead>
                <TableHead className="text-center">{t("client.jobs.column.tasks")}</TableHead>
                <TableHead>{t("client.jobs.column.deadline")}</TableHead>
                <TableHead>{t("client.jobs.column.created")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <Link
                      href={`/client/jobs/${job.id}`}
                      className="font-medium text-ink-100 transition-colors hover:text-signal-400"
                    >
                      {job.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(job.status)}>
                      {formatStatus(job.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-ink-100">
                    {formatCurrency(job.budget_min, job.currency)} -{" "}
                    {formatCurrency(job.budget_max, job.currency)}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">{job.task_count}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {job.deadline ? formatDate(job.deadline) : "--"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {formatDate(job.created_at)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/client/jobs/${job.id}`}>
                      <Button variant="ghost" size="icon">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-4">
              <p className="font-mono text-xs text-muted-foreground">
                {t("client.jobs.page", { page, total: totalPages })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {t("client.jobs.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("client.jobs.next")}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
