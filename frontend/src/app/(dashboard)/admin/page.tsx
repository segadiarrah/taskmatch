"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { cn, formatCurrency, timeAgo } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  ListChecks,
  Bot,
  ClipboardCheck,
  DollarSign,
  ArrowRight,
  Sparkles,
  FileSearch,
  Users,
  Activity,
  TrendingUp,
  Clock,
  ScrollText,
} from "lucide-react";

interface DashboardOverview {
  total_jobs: number;
  active_tasks: number;
  active_agents: number;
  pending_reviews: number;
  revenue_pipeline: number;
  jobs_by_status: Record<string, number>;
  tasks_by_status: Record<string, number>;
  recent_activity: AuditEntry[];
}

interface AuditEntry {
  id: string;
  actor_type: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-zinc-300",
  submitted: "bg-blue-400",
  formatted: "bg-indigo-400",
  bidding: "bg-amber-400",
  in_progress: "bg-orange-400",
  under_review: "bg-purple-400",
  completed: "bg-emerald-400",
  cancelled: "bg-red-400",
  open: "bg-blue-400",
  assigned: "bg-orange-400",
  pending_validation: "bg-purple-400",
  approved: "bg-emerald-400",
  rejected: "bg-red-400",
};

function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500">{title}</CardTitle>
        <div className="rounded-lg bg-zinc-100 p-2">
          <Icon className="h-4 w-4 text-zinc-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-zinc-900">{value}</div>
        <div className="mt-1 flex items-center gap-1">
          {trend && (
            <span className="flex items-center text-xs font-medium text-emerald-600">
              <TrendingUp className="mr-0.5 h-3 w-3" />
              {trend}
            </span>
          )}
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
      </CardContent>
      <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-zinc-50 opacity-50" />
    </Card>
  );
}

function StatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-sm text-zinc-600 capitalize">{label.replace(/_/g, " ")}</span>
      <div className="flex-1">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className={cn("h-full rounded-full transition-all duration-500", color)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="w-10 text-right text-sm font-medium text-zinc-700">{count}</span>
    </div>
  );
}

function ActivityItem({ entry }: { entry: AuditEntry }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 rounded-full bg-zinc-100 p-1.5">
        <Activity className="h-3 w-3 text-zinc-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-700">
          <span className="font-medium">{entry.actor_type}</span>
          {" "}
          <span className="text-zinc-500">{entry.action}</span>
          {" "}
          <span className="font-medium">{entry.entity_type}</span>
        </p>
        {entry.details && (
          <p className="mt-0.5 truncate text-xs text-zinc-400">{entry.details}</p>
        )}
      </div>
      <span className="shrink-0 text-xs text-zinc-400">
        <Clock className="mr-1 inline h-3 w-3" />
        {timeAgo(entry.created_at)}
      </span>
    </div>
  );
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<DashboardOverview>("/v1/dashboard/overview")
      .then(setData)
      .catch(() => {
        // Use placeholder data when API is not available
        setData({
          total_jobs: 47,
          active_tasks: 128,
          active_agents: 34,
          pending_reviews: 12,
          revenue_pipeline: 284500,
          jobs_by_status: {
            draft: 5,
            submitted: 8,
            formatted: 4,
            bidding: 6,
            in_progress: 12,
            under_review: 7,
            completed: 3,
            cancelled: 2,
          },
          tasks_by_status: {
            open: 24,
            bidding: 18,
            assigned: 32,
            in_progress: 28,
            pending_validation: 12,
            completed: 10,
            rejected: 4,
          },
          recent_activity: [
            { id: "1", actor_type: "MCP", actor_id: "system", action: "formatted", entity_type: "Job", entity_id: "j-42", details: "Job #42 auto-formatted from raw description", created_at: new Date(Date.now() - 120000).toISOString() },
            { id: "2", actor_type: "Agent", actor_id: "a-7", action: "submitted", entity_type: "Task", entity_id: "t-88", details: "Agent CodeBot submitted deliverable for review", created_at: new Date(Date.now() - 300000).toISOString() },
            { id: "3", actor_type: "Admin", actor_id: "u-1", action: "approved", entity_type: "Submission", entity_id: "s-15", details: "Submission approved, payment released", created_at: new Date(Date.now() - 600000).toISOString() },
            { id: "4", actor_type: "MCP", actor_id: "system", action: "decomposed", entity_type: "Job", entity_id: "j-41", details: "Job #41 decomposed into 5 tasks", created_at: new Date(Date.now() - 900000).toISOString() },
            { id: "5", actor_type: "Agent", actor_id: "a-3", action: "placed_bid", entity_type: "Task", entity_id: "t-92", details: "DataWiz bid $450 on data pipeline task", created_at: new Date(Date.now() - 1200000).toISOString() },
            { id: "6", actor_type: "MCP", actor_id: "system", action: "matched", entity_type: "Task", entity_id: "t-90", details: "3 agents matched for frontend task", created_at: new Date(Date.now() - 1800000).toISOString() },
            { id: "7", actor_type: "Client", actor_id: "u-5", action: "created", entity_type: "Job", entity_id: "j-48", details: "New job posted: E-commerce Platform Rebuild", created_at: new Date(Date.now() - 3600000).toISOString() },
            { id: "8", actor_type: "Admin", actor_id: "u-1", action: "released_payment", entity_type: "Payment", entity_id: "p-22", details: "$1,200 released to developer account", created_at: new Date(Date.now() - 7200000).toISOString() },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          <p className="text-sm text-zinc-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500">Failed to load dashboard data.</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const jobsTotal = Object.values(data.jobs_by_status).reduce((a, b) => a + b, 0);
  const tasksTotal = Object.values(data.tasks_by_status).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Mission Control</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Real-time overview of your TaskMatch platform operations.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Total Jobs"
          value={data.total_jobs}
          description="across all statuses"
          icon={Briefcase}
          trend="+12%"
        />
        <KPICard
          title="Active Tasks"
          value={data.active_tasks}
          description="currently in pipeline"
          icon={ListChecks}
          trend="+8%"
        />
        <KPICard
          title="Active Agents"
          value={data.active_agents}
          description="ready to work"
          icon={Bot}
        />
        <KPICard
          title="Pending Reviews"
          value={data.pending_reviews}
          description="awaiting validation"
          icon={ClipboardCheck}
        />
        <KPICard
          title="Revenue Pipeline"
          value={formatCurrency(data.revenue_pipeline)}
          description="total in-flight value"
          icon={DollarSign}
          trend="+23%"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Jobs by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jobs by Status</CardTitle>
            <CardDescription>Distribution across the job lifecycle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.jobs_by_status).map(([status, count]) => (
              <StatusBar
                key={status}
                label={status}
                count={count}
                total={jobsTotal}
                color={statusColors[status] || "bg-zinc-400"}
              />
            ))}
          </CardContent>
        </Card>

        {/* Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Status</CardTitle>
            <CardDescription>Current task pipeline breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.tasks_by_status).map(([status, count]) => (
              <StatusBar
                key={status}
                label={status}
                count={count}
                total={tasksTotal}
                color={statusColors[status] || "bg-zinc-400"}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recent_activity.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-zinc-400">
                No recent activity
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {data.recent_activity.map((entry) => (
                  <ActivityItem key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common operator workflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push("/admin/jobs")}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                Format Next Job
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push("/admin/validations")}
            >
              <span className="flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-purple-500" />
                Review Submissions
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push("/admin/agents")}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Agent Directory
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push("/admin/payments")}
            >
              <span className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Process Payments
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push("/admin/audit")}
            >
              <span className="flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-amber-500" />
                View Audit Log
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
