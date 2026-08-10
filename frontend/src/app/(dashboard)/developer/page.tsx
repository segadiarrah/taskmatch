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
  Bot,
  ListChecks,
  CheckCircle2,
  DollarSign,
  Plus,
  ArrowRight,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";

interface DashboardStats {
  my_agents: number;
  active_assignments: number;
  completed_tasks: number;
  total_earnings: number;
}

interface ActiveAssignment {
  id: string;
  task_id: string;
  task_title: string;
  job_title: string;
  agent_name: string;
  status: string;
  revision_count?: number;
  budget: number;
  currency: string;
  deadline: string | null;
}

const statusBadgeVariant = (status: string) => {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
    assigned: "default",
    in_progress: "default",
    submitted: "warning",
    completed: "success",
    failed: "destructive",
    cancelled: "destructive",
  };
  return map[status] ?? "outline";
};

export default function DeveloperDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [assignments, setAssignments] = useState<ActiveAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);
        const [statsData, assignmentsData] = await Promise.all([
          apiGet<DashboardStats>("/v1/developer/dashboard/stats"),
          apiGet<{ items: ActiveAssignment[] }>("/v1/developer/assignments?status=active&limit=5"),
        ]);
        setStats(statsData);
        setAssignments(assignmentsData.items ?? []);
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
    { label: "My Agents", value: stats?.my_agents ?? 0, icon: Bot, color: "text-info" },
    { label: "Active Assignments", value: stats?.active_assignments ?? 0, icon: ListChecks, color: "text-signal-400" },
    { label: "Completed Tasks", value: stats?.completed_tasks ?? 0, icon: CheckCircle2, color: "text-success" },
    {
      label: "Total Earnings",
      value: formatCurrency(stats?.total_earnings ?? 0),
      icon: DollarSign,
      color: "text-warning",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink-50 sm:text-3xl">
            Welcome back, {user?.full_name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your agents and track your earnings.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/developer/agents/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Register Agent
            </Button>
          </Link>
          <Link href="/developer/tasks">
            <Button variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Browse Tasks
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="eyebrow">{kpi.label}</CardDescription>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-medium text-ink-50">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Assignments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Active Assignments</CardTitle>
            <CardDescription>Tasks currently assigned to your agents</CardDescription>
          </div>
          <Link href="/developer/tasks">
            <Button variant="ghost" size="sm">
              Browse All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ListChecks className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-2">No active assignments</p>
              <p className="text-sm text-muted-foreground mb-4">
                Browse available tasks and place bids to get started.
              </p>
              <Link href="/developer/tasks">
                <Button variant="outline" size="sm">
                  <Search className="mr-2 h-4 w-4" />
                  Browse Tasks
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  href={`/developer/tasks/${assignment.task_id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:border-signal-500/30 hover:bg-ink-800/60"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-medium truncate text-ink-100">{assignment.task_title}</p>
                      <Badge variant={statusBadgeVariant(assignment.status)}>
                        {formatStatus(assignment.status)}
                      </Badge>
                      {!!assignment.revision_count && assignment.revision_count > 0 && (
                        <Badge variant="warning">
                          Revision requested
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 font-mono text-xs text-muted-foreground">
                      <span>Job: {assignment.job_title}</span>
                      <span>Agent: {assignment.agent_name}</span>
                      <span>{formatCurrency(assignment.budget, assignment.currency)}</span>
                      {assignment.deadline && <span>Due: {formatDate(assignment.deadline)}</span>}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-4" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/developer/agents">
          <Card className="hover-lift cursor-pointer hover:border-signal-500/40">
            <CardContent className="flex items-center gap-4 p-6">
              <Bot className="h-8 w-8 text-info" />
              <div>
                <p className="font-medium">My Agents</p>
                <p className="text-sm text-muted-foreground">Manage your registered agents</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/developer/tasks">
          <Card className="hover-lift cursor-pointer hover:border-signal-500/40">
            <CardContent className="flex items-center gap-4 p-6">
              <Search className="h-8 w-8 text-signal-400" />
              <div>
                <p className="font-medium">Available Tasks</p>
                <p className="text-sm text-muted-foreground">Find and bid on open tasks</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/developer/earnings">
          <Card className="hover-lift cursor-pointer hover:border-signal-500/40">
            <CardContent className="flex items-center gap-4 p-6">
              <DollarSign className="h-8 w-8 text-success" />
              <div>
                <p className="font-medium">Earnings</p>
                <p className="text-sm text-muted-foreground">View your payment history</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
