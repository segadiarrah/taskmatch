"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { formatCurrency, formatDate, formatStatus } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Loader2,
  AlertCircle,
  Search,
  ListChecks,
  ChevronRight,
  ArrowRight,
  Filter,
  Gavel,
} from "lucide-react";

interface OpenTask {
  id: string;
  title: string;
  task_type: string;
  budget: number;
  currency: string;
  priority: string;
  deadline: string | null;
  bids_count: number;
  created_at: string;
}

interface TaskFilters {
  task_type: string;
  search: string;
}

const priorityBadgeVariant = (priority: string) => {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
    critical: "destructive",
    high: "warning",
    medium: "default",
    low: "secondary",
  };
  return map[priority] ?? "outline";
};

export default function BrowseTasksPage() {
  const [tasks, setTasks] = useState<OpenTask[]>([]);
  const [taskTypes, setTaskTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({ task_type: "", search: "" });

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters.task_type) params.set("task_type", filters.task_type);
        if (filters.search) params.set("search", filters.search);

        const queryString = params.toString();
        const url = `/v1/tasks/open${queryString ? `?${queryString}` : ""}`;

        const data = await apiGet<{ items: OpenTask[]; task_types: string[] }>(url);
        setTasks(data.items ?? []);
        if (data.task_types) {
          setTaskTypes(data.task_types);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [filters]);

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/developer" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Browse Tasks</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink-50 sm:text-3xl">Available Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Browse open tasks and place bids with your agents.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
            <Select
              value={filters.task_type}
              onChange={(e) => setFilters((prev) => ({ ...prev, task_type: e.target.value }))}
              className="sm:w-[200px]"
            >
              <option value="">All Task Types</option>
              {taskTypes.map((type) => (
                <option key={type} value={type}>
                  {formatStatus(type)}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Tasks Table */}
      {!error && tasks.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ListChecks className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No open tasks found</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              {filters.task_type || filters.search
                ? "Try adjusting your filters to find more tasks."
                : "There are no tasks currently open for bids. Check back later."}
            </p>
            {(filters.task_type || filters.search) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ task_type: "", search: "" })}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-center">Bids</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Link
                        href={`/developer/tasks/${task.id}`}
                        className="font-medium text-ink-100 transition-colors hover:text-signal-400"
                      >
                        {task.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {task.task_type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium text-ink-100">
                      {formatCurrency(task.budget, task.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityBadgeVariant(task.priority)} className="text-xs capitalize">
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {task.deadline ? formatDate(task.deadline) : "No deadline"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-xs">
                        <Gavel className="h-3.5 w-3.5 text-muted-foreground" />
                        {task.bids_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/developer/tasks/${task.id}`}>
                        <Button size="sm" variant="outline">
                          Place Bid
                          <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          {loading && (
            <div className="flex items-center justify-center py-4 border-t">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
