"use client";

import React, { useState, useEffect } from "react";
import { DataLoadError } from "@/components/dashboard/data-load-error";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { cn, formatCurrency, formatStatus } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
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
  ListChecks,
  Search,
  Filter,
  ExternalLink,
  CheckSquare,
  MoreHorizontal,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  job_id: string;
  job_title: string;
  task_type: string;
  status: string;
  budget: number;
  priority: number;
  assigned_agent_name: string | null;
  bids_count: number;
}

const statusBadgeVariant: Record<string, "secondary" | "info" | "default" | "warning" | "purple" | "success" | "destructive"> = {
  open: "info",
  bidding: "warning",
  assigned: "default",
  in_progress: "warning",
  pending_validation: "purple",
  completed: "success",
  approved: "success",
  rejected: "destructive",
  cancelled: "destructive",
};

const taskStatuses = ["open", "bidding", "assigned", "in_progress", "pending_validation", "completed", "approved", "rejected", "cancelled"];
const taskTypes = ["development", "design", "testing", "integration", "documentation", "devops", "research"];

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await apiGet<Task[]>("/v1/admin/tasks");
      setTasks(data);
        } catch {
      setLoadError(true);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesType = typeFilter === "all" || task.task_type === typeFilter;
    const matchesSearch =
      !searchQuery ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.job_title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  function toggleTask(id: string) {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map((t) => t.id)));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink-50">Task Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track and manage all decomposed tasks across jobs.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <Input
                placeholder="Search by task or job title..."
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
                className="w-40"
              >
                <option value="all">All Statuses</option>
                {taskStatuses.map((s) => (
                  <option key={s} value={s}>{formatStatus(s)}</option>
                ))}
              </Select>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-40"
              >
                <option value="all">All Types</option>
                {taskTypes.map((t) => (
                  <option key={t} value={t}>{formatStatus(t)}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      {selectedTasks.size > 0 && (
        <Card className="border-signal-500/30 bg-signal-500/5">
          <CardContent className="flex items-center gap-3 py-3 pt-3">
            <span className="text-sm font-medium text-ink-200">
              {selectedTasks.size} task{selectedTasks.size > 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">Match Agents</Button>
              <Button size="sm" variant="outline">Update Status</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedTasks(new Set())}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-700 border-t-signal-500" />
            </div>
          ) : loadError ? (
            <DataLoadError onRetry={fetchTasks} />
          ) : filteredTasks.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <ListChecks className="h-10 w-10 text-ink-600" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">No tasks found</p>
              <p className="text-xs text-ink-500">Try adjusting your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-ink-600 bg-ink-800 accent-signal-500"
                      checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                      onChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Bids</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/tasks/${task.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-ink-600 bg-ink-800 accent-signal-500"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => toggleTask(task.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{task.title}</TableCell>
                    <TableCell className="max-w-[160px] truncate text-ink-400">{task.job_title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatStatus(task.task_type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[task.status] || "secondary"}>
                        {formatStatus(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-foreground">{formatCurrency(task.budget)}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "font-mono text-sm font-semibold",
                        task.priority === 1 ? "text-danger" :
                        task.priority === 2 ? "text-warning" : "text-ink-500"
                      )}>
                        P{task.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-ink-300">
                      {task.assigned_agent_name || (
                        <span className="text-ink-600">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {task.bids_count > 0 ? (
                        <span className="rounded-sm border border-info/40 bg-info/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-info">
                          {task.bids_count}
                        </span>
                      ) : (
                        <span className="text-ink-600">0</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/tasks/${task.id}`)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
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
