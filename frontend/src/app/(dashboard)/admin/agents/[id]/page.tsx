"use client";

import React, { useState, useEffect } from "react";
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

const statusConfig: Record<string, { color: string; dot: string; label: string }> = {
  active: { color: "text-emerald-700 bg-emerald-100", dot: "bg-emerald-500", label: "Active" },
  paused: { color: "text-amber-700 bg-amber-100", dot: "bg-amber-500", label: "Paused" },
  disabled: { color: "text-red-700 bg-red-100", dot: "bg-red-500", label: "Disabled" },
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

  useEffect(() => {
    fetchAgent();
  }, [agentId]);

  async function fetchAgent() {
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
  }

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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-zinc-500">Agent not found.</p>
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
          className="mb-4 text-zinc-500"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Agents
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100 text-2xl font-bold text-zinc-700">
              {agent.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{agent.name}</h1>
                <Badge className={cfg.color}>
                  <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full inline-block", cfg.dot)} />
                  {cfg.label}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
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
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-zinc-600">{agent.description}</p>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">Capabilities</p>
              <div className="flex flex-wrap gap-1.5">
                {agent.capabilities.map((cap) => (
                  <Badge key={cap} variant="outline">{cap}</Badge>
                ))}
              </div>
            </div>
            <div className="text-xs text-zinc-400">
              Registered {formatDate(agent.created_at)}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-zinc-50 p-4 text-center">
                <TrendingUp className="mx-auto h-5 w-5 text-emerald-500" />
                <p className="mt-2 text-2xl font-bold text-zinc-900">
                  {(agent.success_rate * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-zinc-500">Success Rate</p>
                <Progress value={agent.success_rate * 100} className="mt-2" />
              </div>
              <div className="rounded-lg bg-zinc-50 p-4 text-center">
                <Star className="mx-auto h-5 w-5 text-amber-500" />
                <p className="mt-2 text-2xl font-bold text-zinc-900">
                  {agent.avg_score.toFixed(1)}
                </p>
                <p className="text-xs text-zinc-500">Avg. Score</p>
                <Progress value={(agent.avg_score / 5) * 100} className="mt-2" />
              </div>
              <div className="rounded-lg bg-zinc-50 p-4 text-center">
                <CheckCircle2 className="mx-auto h-5 w-5 text-blue-500" />
                <p className="mt-2 text-2xl font-bold text-zinc-900">
                  {agent.completed_tasks}
                </p>
                <p className="text-xs text-zinc-500">Completed Tasks</p>
                <p className="mt-2 text-xs text-zinc-400">{agent.active_tasks} currently active</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-4 text-center">
                <Shield className="mx-auto h-5 w-5 text-purple-500" />
                <p className="mt-2 text-2xl font-bold text-zinc-900">
                  {formatCurrency(agent.total_earnings)}
                </p>
                <p className="text-xs text-zinc-500">Total Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-zinc-400" />
            Assignment History
          </CardTitle>
          <CardDescription>Past and current task assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {agent.assignment_history.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-zinc-400">
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
                    <TableCell className="font-medium">{a.task_title}</TableCell>
                    <TableCell className="text-zinc-500">{a.job_title}</TableCell>
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
                    <TableCell className="text-right font-medium">
                      {formatCurrency(a.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {a.score !== null ? (
                        <span className="flex items-center justify-end gap-1">
                          <Star className="h-3 w-3 text-amber-500" />
                          {a.score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-zinc-400">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-500">{formatDate(a.assigned_at)}</TableCell>
                    <TableCell className="text-zinc-500">
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
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-zinc-400" />
            Feedback Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new note */}
          <div className="rounded-lg border border-zinc-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <select
                className="rounded-md border border-zinc-200 px-2 py-1 text-sm"
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
            <div className="flex h-16 items-center justify-center text-sm text-zinc-400">
              No feedback notes yet.
            </div>
          ) : (
            <div className="space-y-3">
              {agent.feedback_notes.map((note) => (
                <div key={note.id} className="rounded-lg bg-zinc-50 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-zinc-900">{note.author}</span>
                    <Badge variant="outline" className="text-[10px]">{note.category}</Badge>
                    <span className="text-xs text-zinc-400">{formatDateTime(note.created_at)}</span>
                  </div>
                  <p className="text-sm text-zinc-600">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
