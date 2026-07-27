"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { formatCurrency, formatDate, formatStatus } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  ListChecks,
  ClipboardCheck,
  DollarSign,
  Plus,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface DashboardStats {
  my_jobs: number;
  active_tasks: number;
  pending_reviews: number;
  total_spent: number;
}

interface RecentJob {
  id: string;
  title: string;
  status: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  created_at: string;
  task_count: number;
}

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

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);
        const [statsData, jobsData] = await Promise.all([
          apiGet<DashboardStats>("/v1/client/dashboard/stats"),
          apiGet<{ items: RecentJob[] }>("/v1/jobs?limit=5&sort=-created_at"),
        ]);
        setStats(statsData);
        setRecentJobs((jobsData as any).jobs ?? jobsData.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  const kpiCards = [
    { label: "My Jobs", value: stats?.my_jobs ?? 0, icon: Briefcase, color: "text-blue-600" },
    { label: "Active Tasks", value: stats?.active_tasks ?? 0, icon: ListChecks, color: "text-indigo-600" },
    { label: "Pending Reviews", value: stats?.pending_reviews ?? 0, icon: ClipboardCheck, color: "text-amber-600" },
    {
      label: "Total Spent",
      value: formatCurrency(stats?.total_spent ?? 0),
      icon: DollarSign,
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.full_name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here is an overview of your projects and tasks.
          </p>
        </div>
        <Link href="/client/jobs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Job
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="text-sm font-medium">{kpi.label}</CardDescription>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Jobs</CardTitle>
            <CardDescription>Your latest 5 job postings</CardDescription>
          </div>
          <Link href="/client/jobs">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-2">No jobs yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first job to get started with TaskMatch.
              </p>
              <Link href="/client/jobs/new">
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/client/jobs/${job.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-medium truncate">{job.title}</p>
                      <Badge variant={statusBadgeVariant(job.status)}>
                        {formatStatus(job.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>
                        {formatCurrency(job.budget_min, job.currency)} - {formatCurrency(job.budget_max, job.currency)}
                      </span>
                      <span>{job.task_count} tasks</span>
                      <span>{formatDate(job.created_at)}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-4" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
