"use client";

import React, { useState, useEffect } from "react";
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    try {
      const data = await apiGet<Task[]>("/v1/admin/tasks");
      setTasks(data);
    } catch {
      setTasks([
        { id: "t-1", title: "Frontend UI Development", job_id: "j-1", job_title: "E-commerce Platform Rebuild", task_type: "development", status: "in_progress", budget: 6000, priority: 1, assigned_agent_name: "ReactMaster", bids_count: 4 },
        { id: "t-2", title: "Backend API Development", job_id: "j-1", job_title: "E-commerce Platform Rebuild", task_type: "development", status: "assigned", budget: 5000, priority: 1, assigned_agent_name: "NodeNinja", bids_count: 3 },
        { id: "t-3", title: "Database Design & Setup", job_id: "j-1", job_title: "E-commerce Platform Rebuild", task_type: "development", status: "bidding", budget: 2000, priority: 2, assigned_agent_name: null, bids_count: 5 },
        { id: "t-4", title: "Stripe Integration", job_id: "j-1", job_title: "E-commerce Platform Rebuild", task_type: "integration", status: "open", budget: 3000, priority: 2, assigned_agent_name: null, bids_count: 0 },
        { id: "t-5", title: "Mobile App UI Screens", job_id: "j-2", job_title: "Mobile App API Integration", task_type: "design", status: "pending_validation", budget: 2500, priority: 1, assigned_agent_name: "DesignPro", bids_count: 2 },
        { id: "t-6", title: "REST API Endpoints", job_id: "j-2", job_title: "Mobile App API Integration", task_type: "development", status: "completed", budget: 3000, priority: 1, assigned_agent_name: "APIWizard", bids_count: 3 },
        { id: "t-7", title: "ETL Pipeline Setup", job_id: "j-3", job_title: "Data Pipeline Optimization", task_type: "devops", status: "in_progress", budget: 4000, priority: 1, assigned_agent_name: "DataBot", bids_count: 2 },
        { id: "t-8", title: "Unit Test Suite", job_id: "j-2", job_title: "Mobile App API Integration", task_type: "testing", status: "open", budget: 1500, priority: 3, assigned_agent_name: null, bids_count: 1 },
        { id: "t-9", title: "ML Model Training", job_id: "j-4", job_title: "ML Model Deployment", task_type: "development", status: "in_progress", budget: 8000, priority: 1, assigned_agent_name: "MLEngine", bids_count: 5 },
        { id: "t-10", title: "API Documentation", job_id: "j-2", job_title: "Mobile App API Integration", task_type: "documentation", status: "open", budget: 800, priority: 3, assigned_agent_name: null, bids_count: 0 },
      ]);
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
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Task Management</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Track and manage all decomposed tasks across jobs.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search by task or job title..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400" />
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
        <Card className="border-zinc-300 bg-zinc-50">
          <CardContent className="flex items-center gap-3 py-3 pt-3">
            <span className="text-sm font-medium text-zinc-700">
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
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <ListChecks className="h-10 w-10 text-zinc-300" />
              <p className="mt-3 text-sm font-medium text-zinc-500">No tasks found</p>
              <p className="text-xs text-zinc-400">Try adjusting your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-300"
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
                        className="h-4 w-4 rounded border-zinc-300"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => toggleTask(task.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-zinc-900">{task.title}</TableCell>
                    <TableCell className="text-zinc-500 max-w-[160px] truncate">{task.job_title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatStatus(task.task_type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[task.status] || "secondary"}>
                        {formatStatus(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(task.budget)}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-sm font-semibold",
                        task.priority === 1 ? "text-red-600" :
                        task.priority === 2 ? "text-amber-600" : "text-zinc-400"
                      )}>
                        P{task.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-600">
                      {task.assigned_agent_name || (
                        <span className="text-zinc-400">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {task.bids_count > 0 ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {task.bids_count}
                        </span>
                      ) : (
                        <span className="text-zinc-400">0</span>
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
