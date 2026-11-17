"use client";

import { useAdminCopy } from "@/lib/admin-copy";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataLoadError } from "@/components/dashboard/data-load-error";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";
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
  Wallet,
  Percent,
  CheckCircle2,
  Gauge,
} from "lucide-react";

interface DashboardOverview {
  total_jobs: number;
  total_tasks: number;
  active_agents: number;
  pending_validations: number;
  failed_tasks: number;
  total_payments_pending: number;
  total_payments_completed: number;
  gmv?: number;
  platform_revenue?: number;
  take_rate?: number;
  completed_jobs?: number;
  avg_job_value?: number;
  currency?: string;
  jobs_by_status: Record<string, number>;
  tasks_by_status: Record<string, number>;
  recent_activity?: AuditEntry[];
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
  draft: "bg-ink-500",
  submitted: "bg-info",
  formatted: "bg-signal-500",
  bidding: "bg-warning",
  in_progress: "bg-signal-400",
  under_review: "bg-[#b49aff]",
  completed: "bg-success",
  cancelled: "bg-danger",
  open: "bg-info",
  assigned: "bg-signal-400",
  pending_validation: "bg-[#b49aff]",
  approved: "bg-success",
  rejected: "bg-danger",
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
  const { formatNumber } = useAdminCopy();
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-md border border-ink-700 bg-ink-800 p-2">
          <Icon className="h-4 w-4 text-signal-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-display text-3xl font-medium text-ink-50">{typeof value === "number" ? formatNumber(value) : value}</div>
        <div className="mt-1 flex items-center gap-1">
          {trend && (
            <span className="flex items-center text-xs font-medium text-success">
              <TrendingUp className="mr-0.5 h-3 w-3" />
              {trend}
            </span>
          )}
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
      <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-ink-800/50" />
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
  const { formatStatus, formatNumber } = useAdminCopy();
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-sm text-ink-300 capitalize">{formatStatus(label)}</span>
      <div className="flex-1">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-800">
          <div
            className={cn("h-full rounded-full transition-all duration-500", color)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="w-10 text-right font-mono text-sm font-medium text-ink-200">{formatNumber(count)}</span>
    </div>
  );
}

function ActivityItem({ entry }: { entry: AuditEntry }) {
  const { formatStatus, timeAgo } = useAdminCopy();
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 rounded-full border border-ink-700 bg-ink-800 p-1.5">
        <Activity className="h-3 w-3 text-ink-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink-200">
          <span className="font-medium">{formatStatus(entry.actor_type)}</span>
          {" "}
          <span className="text-ink-400">{formatStatus(entry.action)}</span>
          {" "}
          <span className="font-medium">{formatStatus(entry.entity_type)}</span>
        </p>
        {entry.details && (
          <p className="mt-0.5 truncate text-xs text-ink-500">{entry.details}</p>
        )}
      </div>
      <span className="shrink-0 font-mono text-xs text-ink-500">
        <Clock className="mr-1 inline h-3 w-3" />
        {timeAgo(entry.created_at)}
      </span>
    </div>
  );
}

export default function AdminOverviewPage() {
  const { a, formatCurrency, formatPercent } = useAdminCopy();
  const router = useRouter();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<DashboardOverview>("/v1/dashboard/overview")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-700 border-t-signal-500" />
          <p className="text-sm text-muted-foreground">{a("Loading dashboard...")}</p>
        </div>
      </div>
    );
  }

  if (!data) return <DataLoadError onRetry={() => window.location.reload()} />;

  const jobsTotal = Object.values(data.jobs_by_status).reduce((a, b) => a + b, 0);
  const tasksTotal = Object.values(data.tasks_by_status).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink-50">{a("Mission Control")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{a("Real-time overview of your TaskMatch platform operations.")}</p>
      </div>

      {/* Marketplace economics — the numbers investors ask for first */}
      <div>
        <h2 className="eyebrow mb-3 text-ink-400">{a("Marketplace economics")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KPICard
            title={a("GMV")}
            value={formatCurrency(data.gmv ?? 0, data.currency)}
            description={a("recorded gross payment volume")}
            icon={Wallet}
          />
          <KPICard
            title={a("Platform Revenue")}
            value={formatCurrency(data.platform_revenue ?? 0, data.currency)}
            description={a("fees on settled work")}
            icon={DollarSign}
          />
          <KPICard
            title={a("Take Rate")}
            value={formatPercent((data.take_rate ?? 0) / 100, 1)}
            description={a("revenue / settled GMV")}
            icon={Percent}
          />
          <KPICard
            title={a("Completed Jobs")}
            value={data.completed_jobs ?? 0}
            description={a("delivered & accepted")}
            icon={CheckCircle2}
          />
          <KPICard
            title={a("Avg Job Value")}
            value={formatCurrency(data.avg_job_value ?? 0, data.currency)}
            description={a("gross per paid job")}
            icon={Gauge}
          />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title={a("Total Jobs")}
          value={data.total_jobs}
          description={a("across all statuses")}
          icon={Briefcase}
        />
        <KPICard
          title={a("Active Tasks")}
          value={data.total_tasks}
          description={a("currently in pipeline")}
          icon={ListChecks}
        />
        <KPICard
          title={a("Active Agents")}
          value={data.active_agents}
          description={a("ready to work")}
          icon={Bot}
        />
        <KPICard
          title={a("Pending Reviews")}
          value={data.pending_validations}
          description={a("awaiting validation")}
          icon={ClipboardCheck}
        />
        <KPICard
          title={a("Revenue Pipeline")}
          value={formatCurrency(data.total_payments_pending)}
          description={a("total in-flight value")}
          icon={DollarSign}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Jobs by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">{a("Jobs by Status")}</CardTitle>
            <CardDescription>{a("Distribution across the job lifecycle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.jobs_by_status).map(([status, count]) => (
              <StatusBar
                key={status}
                label={status}
                count={count}
                total={jobsTotal}
                color={statusColors[status] || "bg-ink-500"}
              />
            ))}
          </CardContent>
        </Card>

        {/* Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">{a("Tasks by Status")}</CardTitle>
            <CardDescription>{a("Current task pipeline breakdown")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.tasks_by_status).map(([status, count]) => (
              <StatusBar
                key={status}
                label={status}
                count={count}
                total={tasksTotal}
                color={statusColors[status] || "bg-ink-500"}
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
            <CardTitle className="font-display text-base">{a("Recent Activity")}</CardTitle>
            <CardDescription>{a("Latest platform events")}</CardDescription>
          </CardHeader>
          <CardContent>
            {!data.recent_activity || data.recent_activity.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-ink-500">{a("No recent activity")}</div>
            ) : (
              <div className="divide-y divide-ink-800">
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
            <CardTitle className="font-display text-base">{a("Quick Actions")}</CardTitle>
            <CardDescription>{a("Common operator workflows")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push("/admin/jobs")}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-signal-400" />{a("Format Next Job")}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push("/admin/validations")}
            >
              <span className="flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-[#b49aff]" />{a("Review Submissions")}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push("/admin/agents")}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-info" />{a("Agent Directory")}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push("/admin/payments")}
            >
              <span className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-success" />{a("Process Payments")}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push("/admin/audit")}
            >
              <span className="flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-warning" />{a("View Audit Log")}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
