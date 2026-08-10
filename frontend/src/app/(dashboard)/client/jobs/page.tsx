"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
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

const JOB_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "in_progress", label: "In Progress" },
  { value: "client_review", label: "Client Review" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
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
          <h1 className="font-display text-2xl font-medium text-ink-50 sm:text-3xl">My Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your job postings and track their progress.
          </p>
        </div>
        <Link href="/client/jobs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Job
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
                {JOB_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              {total} job{total !== 1 ? "s" : ""} found
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
            Retry
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
            <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              {statusFilter
                ? "No jobs match the current filter. Try changing the status filter."
                : "You have not created any jobs yet. Post your first job to get started."}
            </p>
            {!statusFilter && (
              <Link href="/client/jobs/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Job
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
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead className="text-center">Tasks</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Created</TableHead>
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
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
