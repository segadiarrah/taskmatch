"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import { cn, formatCurrency, formatDate, formatStatus, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Bot,
  Star,
  TrendingUp,
  CheckCircle2,
  Pause,
  XCircle,
  Play,
  Shield,
  BarChart3,
  History,
  MessageSquare,
  Plus,
} from "lucide-react";

interface AgentDetail {
  id: string;
  name: string;
  developer_id: string;
  developer_name: string;
  developer_email: string;
  status: string;
  capabilities: string[];
  description: string;
  success_rate: number;
  avg_score: number;
  completed_tasks: number;
  active_tasks: number;
  total_earnings: number;
  created_at: string;
  assignment_history: Assignment[];
  feedback_notes: FeedbackNote[];
}

interface Assignment {
  id: string;
  task_id: string;
  task_title: string;
  job_title: string;
  status: string;
  amount: number;
  score: number | null;
  completed_at: string | null;
  assigned_at: string;
}

interface FeedbackNote {
  id: string;
  author: string;
  category: string;
  content: string;
  created_at: string;
}

const statusConfig: Record<string, { variant: "success" | "warning" | "destructive"; dot: string; label: string }> = {
  active: { variant: "success", dot: "bg-success", label: "Active" },
  paused: { variant: "warning", dot: "bg-warning", label: "Paused" },
  disabled: { variant: "destructive", dot: "bg-danger", label: "Disabled" },
};

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteCategory, setNoteCategory] = useState("general");

  const fetchAgent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<AgentDetail>(`/v1/agents/${agentId}`);
      setAgent(data);
    } catch {
      setAgent({
        id: agentId,
        name: "ReactMaster",
        developer_id: "u-10",
        developer_name: "Sarah Chen",
        developer_email: "sarah.chen@example.com",
        status: "active",
        capabilities: ["react", "nextjs", "typescript", "testing", "tailwindcss"],
        description: "Specialized in building modern, performant React/Next.js applications with a focus on clean code, accessibility, and comprehensive testing. 5+ years of frontend experience.",
        success_rate: 0.92,
        avg_score: 4.6,
        completed_tasks: 47,
        active_tasks: 2,
        total_earnings: 84500,
        created_at: "2025-11-01T00:00:00Z",
        assignment_history: [
          { id: "as-1", task_id: "t-1", task_title: "Frontend UI Development", job_title: "E-commerce Rebuild", status: "in_progress", amount: 5500, score: null, completed_at: null, assigned_at: "2026-03-19T16:00:00Z" },
          { id: "as-2", task_id: "t-15", task_title: "Dashboard Components", job_title: "Analytics Platform", status: "completed", amount: 3200, score: 4.8, completed_at: "2026-03-10T14:00:00Z", assigned_at: "2026-02-25T10:00:00Z" },
          { id: "as-3", task_id: "t-22", task_title: "Landing Page Redesign", job_title: "SaaS Marketing Site", status: "completed", amount: 2000, score: 4.5, completed_at: "2026-02-20T16:00:00Z", assigned_at: "2026-02-15T09:00:00Z" },
          { id: "as-4", task_id: "t-30", task_title: "Form Builder Component", job_title: "CRM Platform", status: "completed", amount: 4000, score: 4.7, completed_at: "2026-02-08T11:00:00Z", assigned_at: "2026-01-28T10:00:00Z" },
          { id: "as-5", task_id: "t-35", task_title: "Mobile Responsive Fix", job_title: "E-commerce v1", status: "completed", amount: 1200, score: 4.2, completed_at: "2026-01-22T15:00:00Z", assigned_at: "2026-01-20T09:00:00Z" },
        ],
        feedback_notes: [
          { id: "fn-1", author: "Admin", category: "quality", content: "Consistently delivers high-quality, well-tested code. Excellent attention to accessibility.", created_at: "2026-03-10T14:00:00Z" },
          { id: "fn-2", author: "MCP", category: "performance", content: "Above-average delivery speed while maintaining quality scores. Recommended for priority tasks.", created_at: "2026-02-28T10:00:00Z" },
          { id: "fn-3", author: "Client", category: "communication", content: "Clear submission summaries and good documentation. Easy to review.", created_at: "2026-02-20T16:00:00Z" },
        ],
      });
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  async function handleStatusAction(action: string) {
    if (!agent) return;
    setActionLoading(true);
    try {
      await apiPost(`/v1/agents/${agentId}/${action}`);
      await fetchAgent();
    } catch {
      const statusMap: Record<string, string> = {
        pause: "paused",
        disable: "disabled",
        reactivate: "active",
      };
      setAgent({ ...agent, status: statusMap[action] || agent.status });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddNote() {
    if (!agent || !newNote.trim()) return;
    try {
      await apiPost(`/v1/agents/${agentId}/feedback`, {
        category: noteCategory,
        content: newNote,
      });
      await fetchAgent();
    } catch {
      setAgent({
        ...agent,
        feedback_notes: [
          {
            id: `fn-${Date.now()}`,
            author: "Admin",
            category: noteCategory,
            content: newNote,
            created_at: new Date().toISOString(),
          },
          ...agent.feedback_notes,
        ],
      });
    }
    setNewNote("");
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-700 border-t-signal-500" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Agent not found.</p>
      </div>
    );
  }

  const cfg = statusConfig[agent.status] || statusConfig.active;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/agents")}
          className="mb-4 text-muted-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Agents
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-ink-700 bg-ink-800 font-display text-2xl font-medium text-ink-100">
              {agent.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-medium tracking-tight text-ink-50">{agent.name}</h1>
                <Badge variant={cfg.variant}>
                  <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full inline-block", cfg.dot)} />
                  {cfg.label}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                by {agent.developer_name} ({agent.developer_email})
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {agent.status === "active" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusAction("pause")}
                  disabled={actionLoading}
                >
                  <Pause className="mr-1 h-4 w-4" />
                  Pause
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStatusAction("disable")}
                  disabled={actionLoading}
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Disable
                </Button>
              </>
            )}
            {(agent.status === "paused" || agent.status === "disabled") && (
              <Button
                size="sm"
                onClick={() => handleStatusAction("reactivate")}
                disabled={actionLoading}
              >
                <Play className="mr-1 h-4 w-4" />
                Reactivate
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Profile + Performance */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-display text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-ink-300">{agent.description}</p>
            <div>
              <p className="eyebrow mb-2 text-ink-500">Capabilities</p>
              <div className="flex flex-wrap gap-1.5">
                {agent.capabilities.map((cap) => (
                  <Badge key={cap} variant="outline">{cap}</Badge>
                ))}
              </div>
            </div>
            <div className="font-mono text-xs text-ink-500">
              Registered {formatDate(agent.created_at)}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <BarChart3 className="h-4 w-4 text-info" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-ink-800 bg-ink-900/60 p-4 text-center">
                <TrendingUp className="mx-auto h-5 w-5 text-success" />
                <p className="mt-2 font-display text-2xl font-medium text-ink-50">
                  {(agent.success_rate * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
                <Progress value={agent.success_rate * 100} className="mt-2" />
              </div>
              <div className="rounded-md border border-ink-800 bg-ink-900/60 p-4 text-center">
                <Star className="mx-auto h-5 w-5 text-warning" />
                <p className="mt-2 font-display text-2xl font-medium text-ink-50">
                  {agent.avg_score.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Avg. Score</p>
                <Progress value={(agent.avg_score / 5) * 100} className="mt-2" />
              </div>
              <div className="rounded-md border border-ink-800 bg-ink-900/60 p-4 text-center">
                <CheckCircle2 className="mx-auto h-5 w-5 text-info" />
                <p className="mt-2 font-display text-2xl font-medium text-ink-50">
                  {agent.completed_tasks}
                </p>
                <p className="text-xs text-muted-foreground">Completed Tasks</p>
                <p className="mt-2 font-mono text-xs text-ink-500">{agent.active_tasks} currently active</p>
              </div>
              <div className="rounded-md border border-ink-800 bg-ink-900/60 p-4 text-center">
                <Shield className="mx-auto h-5 w-5 text-[#b49aff]" />
                <p className="mt-2 font-display text-2xl font-medium text-ink-50">
                  {formatCurrency(agent.total_earnings)}
                </p>
                <p className="text-xs text-muted-foreground">Total Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <History className="h-4 w-4 text-ink-500" />
            Assignment History
          </CardTitle>
          <CardDescription>Past and current task assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {agent.assignment_history.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-ink-500">
              No assignment history.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agent.assignment_history.map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/tasks/${a.task_id}`)}
                  >
                    <TableCell className="font-medium text-foreground">{a.task_title}</TableCell>
                    <TableCell className="text-ink-400">{a.job_title}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          a.status === "completed" ? "success" :
                          a.status === "in_progress" ? "warning" :
                          "secondary"
                        }
                      >
                        {formatStatus(a.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-foreground">
                      {formatCurrency(a.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {a.score !== null ? (
                        <span className="flex items-center justify-end gap-1 font-mono text-ink-200">
                          <Star className="h-3 w-3 text-warning" />
                          {a.score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-ink-600">--</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-ink-400">{formatDate(a.assigned_at)}</TableCell>
                    <TableCell className="font-mono text-ink-400">
                      {a.completed_at ? formatDate(a.completed_at) : "--"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Feedback Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <MessageSquare className="h-4 w-4 text-ink-500" />
            Feedback Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new note */}
          <div className="rounded-md border border-ink-800 bg-ink-900/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <select
                className="rounded-md border border-ink-600 bg-ink-900 px-2 py-1 text-sm text-ink-200"
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value)}
              >
                <option value="general">General</option>
                <option value="quality">Quality</option>
                <option value="performance">Performance</option>
                <option value="communication">Communication</option>
                <option value="concern">Concern</option>
              </select>
            </div>
            <Textarea
              placeholder="Add a feedback note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="mb-2"
            />
            <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
              <Plus className="mr-1 h-3 w-3" />
              Add Note
            </Button>
          </div>

          {/* Notes list */}
          {agent.feedback_notes.length === 0 ? (
            <div className="flex h-16 items-center justify-center text-sm text-ink-500">
              No feedback notes yet.
            </div>
          ) : (
            <div className="space-y-3">
              {agent.feedback_notes.map((note) => (
                <div key={note.id} className="rounded-md border border-ink-800 bg-ink-900/60 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{note.author}</span>
                    <Badge variant="outline" className="text-[10px]">{note.category}</Badge>
                    <span className="font-mono text-xs text-ink-500">{formatDateTime(note.created_at)}</span>
                  </div>
                  <p className="text-sm text-ink-300">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
