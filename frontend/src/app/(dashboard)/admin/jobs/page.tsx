"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import { cn, formatCurrency, formatDate, formatStatus } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Briefcase,
  Search,
  Sparkles,
  Network,
  ExternalLink,
  Filter,
  Plus,
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  client_name: string;
  status: string;
  budget_min: number;
  budget_max: number;
  deadline: string;
  created_at: string;
  task_count: number;
}

const statusBadgeVariant: Record<string, "secondary" | "info" | "default" | "warning" | "purple" | "success" | "destructive"> = {
  draft: "secondary",
  submitted: "info",
  formatted: "default",
  bidding: "warning",
  in_progress: "warning",
  under_review: "purple",
  completed: "success",
  cancelled: "destructive",
};

const allStatuses = [
  "draft",
  "submitted",
  "formatted",
  "bidding",
  "in_progress",
  "under_review",
  "completed",
  "cancelled",
];

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    try {
      const data = await apiGet<Job[]>("/v1/admin/jobs");
      setJobs(data);
    } catch {
      setJobs([
        { id: "j-1", title: "E-commerce Platform Rebuild", client_name: "TechCorp Inc", status: "submitted", budget_min: 15000, budget_max: 25000, deadline: "2026-05-01", created_at: "2026-03-15T10:00:00Z", task_count: 0 },
        { id: "j-2", title: "Mobile App API Integration", client_name: "StartupXYZ", status: "formatted", budget_min: 5000, budget_max: 8000, deadline: "2026-04-15", created_at: "2026-03-14T08:00:00Z", task_count: 3 },
        { id: "j-3", title: "Data Pipeline Optimization", client_name: "DataDriven LLC", status: "bidding", budget_min: 8000, budget_max: 12000, deadline: "2026-04-30", created_at: "2026-03-12T14:00:00Z", task_count: 5 },
        { id: "j-4", title: "ML Model Deployment", client_name: "AI Solutions", status: "in_progress", budget_min: 20000, budget_max: 35000, deadline: "2026-06-01", created_at: "2026-03-10T09:00:00Z", task_count: 8 },
        { id: "j-5", title: "Security Audit & Remediation", client_name: "SecureFirst", status: "under_review", budget_min: 10000, budget_max: 15000, deadline: "2026-04-20", created_at: "2026-03-08T11:00:00Z", task_count: 4 },
        { id: "j-6", title: "CRM Integration Suite", client_name: "SalesForce Pro", status: "completed", budget_min: 12000, budget_max: 18000, deadline: "2026-03-30", created_at: "2026-02-20T13:00:00Z", task_count: 6 },
        { id: "j-7", title: "Real-time Chat System", client_name: "ChatNow", status: "draft", budget_min: 7000, budget_max: 10000, deadline: "2026-05-15", created_at: "2026-03-20T16:00:00Z", task_count: 0 },
        { id: "j-8", title: "Analytics Dashboard Redesign", client_name: "MetricsHub", status: "submitted", budget_min: 6000, budget_max: 9000, deadline: "2026-04-25", created_at: "2026-03-19T10:00:00Z", task_count: 0 },
        { id: "j-9", title: "Microservices Migration", client_name: "LegacyCorp", status: "cancelled", budget_min: 30000, budget_max: 50000, deadline: "2026-07-01", created_at: "2026-03-01T08:00:00Z", task_count: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleFormat(jobId: string) {
    setActionLoading(jobId);
    try {
      await apiPost(`/v1/jobs/${jobId}/format`);
      await fetchJobs();
    } catch {
      // Simulate status change for demo
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: "formatted" } : j))
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDecompose(jobId: string) {
    setActionLoading(jobId);
    try {
      await apiPost(`/v1/jobs/${jobId}/decompose`);
      await fetchJobs();
    } catch {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status: "bidding", task_count: Math.floor(Math.random() * 5) + 3 } : j
        )
      );
    } finally {
      setActionLoading(null);
    }
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink-50">Job Intake</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage incoming jobs through the intake pipeline.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/jobs/new")} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          New Job
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <Input
                placeholder="Search by title or client..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-ink-500" />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-44"
              >
                <option value="all">All Statuses</option>
                {allStatuses.map((s) => (
                  <option key={s} value={s}>
                    {formatStatus(s)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-700 border-t-signal-500" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <Briefcase className="h-10 w-10 text-ink-600" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">No jobs found</p>
              <p className="text-xs text-ink-500">Try adjusting your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow
                    key={job.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/jobs/${job.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{job.title}</span>
                        {job.task_count > 0 && (
                          <span className="font-mono text-xs text-ink-500">
                            {job.task_count} tasks
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-ink-300">{job.client_name}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[job.status] || "secondary"}>
                        {formatStatus(job.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-foreground">
                      {formatCurrency(job.budget_min)} - {formatCurrency(job.budget_max)}
                    </TableCell>
                    <TableCell className="font-mono text-ink-300">{formatDate(job.deadline)}</TableCell>
                    <TableCell className="font-mono text-ink-400">{formatDate(job.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {job.status === "submitted" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFormat(job.id)}
                            disabled={actionLoading === job.id}
                          >
                            <Sparkles className="mr-1 h-3 w-3" />
                            {actionLoading === job.id ? "..." : "Format"}
                          </Button>
                        )}
                        {job.status === "formatted" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDecompose(job.id)}
                            disabled={actionLoading === job.id}
                          >
                            <Network className="mr-1 h-3 w-3" />
                            {actionLoading === job.id ? "..." : "Decompose"}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/admin/jobs/${job.id}`)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
