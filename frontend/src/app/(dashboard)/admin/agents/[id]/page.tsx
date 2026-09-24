"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DataLoadError } from "@/components/dashboard/data-load-error";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { loadAdminAgentDetail, type AdminAgentDetail } from "@/lib/admin-details";
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

const statusConfig: Record<string, { variant: "success" | "warning" | "destructive"; dot: string; label: string }> = {
  active: { variant: "success", dot: "bg-success", label: "Active" },
  paused: { variant: "warning", dot: "bg-warning", label: "Paused" },
  disabled: { variant: "destructive", dot: "bg-danger", label: "Disabled" },
};

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  const [agent, setAgent] = useState<AdminAgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteCategory, setNoteCategory] = useState("quality");

  const fetchAgent = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await loadAdminAgentDetail(apiGet, agentId);
      setAgent(data);
    } catch {
      setLoadError(true);
      setAgent(null);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  async function handleStatusAction(action: string) {
    if (!agent) return;
    setActionError(null);
    setActionLoading(true);
    try {
      await apiPut(`/v1/agents/${agentId}`, { status: action === "reactivate" ? "active" : action === "disable" ? "disabled" : "paused" });
      await fetchAgent();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The request failed. Please refresh and try again.");
      return;
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddNote() {
    if (!agent || !newNote.trim()) return;
    setActionError(null);
    setActionLoading(true);
    try {
      await apiPost("/v1/dashboard/feedback-notes", {
        agent_id: agentId,
        category: noteCategory,
        note: newNote,
      });
      await fetchAgent();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The request failed. Please refresh and try again.");
      return;
    } finally {
      setActionLoading(false);
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

  if (loadError) {
    return (
      <div className="p-8">
        <DataLoadError onRetry={fetchAgent} />
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
      {actionError && <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{actionError}</p>}
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
                <Progress value={agent.avg_score} className="mt-2" />
              </div>
              <div className="rounded-md border border-ink-800 bg-ink-900/60 p-4 text-center">
                <CheckCircle2 className="mx-auto h-5 w-5 text-info" />
                <p className="mt-2 font-display text-2xl font-medium text-ink-50">
                  {agent.completed_tasks}
                </p>
                <p className="text-xs text-muted-foreground">Completed Tasks</p>
                <p className="mt-2 font-mono text-xs text-ink-500">{agent.approved_submissions} approved submissions</p>
              </div>
              <div className="rounded-md border border-ink-800 bg-ink-900/60 p-4 text-center">
                <Shield className="mx-auto h-5 w-5 text-[#b49aff]" />
                <p className="mt-2 font-display text-2xl font-medium text-ink-50">
                  {agent.total_submissions}
                </p>
                <p className="text-xs text-muted-foreground">Total Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                aria-label="Feedback category"
                className="rounded-md border border-ink-600 bg-ink-900 px-2 py-1 text-sm text-ink-200"
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value)}
              >
                <option value="quality">Quality</option>
                <option value="speed">Speed</option>
                <option value="reliability">Reliability</option>
                <option value="communication">Communication</option>
                <option value="formatting">Formatting</option>
              </select>
            </div>
            <Textarea
              aria-label="Feedback note"
              placeholder="Add a feedback note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="mb-2"
            />
            <Button size="sm" onClick={handleAddNote} disabled={actionLoading || !newNote.trim()}>
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
