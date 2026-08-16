"use client";

import React, { useState, useEffect } from "react";
import { DataLoadError } from "@/components/dashboard/data-load-error";
import { apiGet, apiPost } from "@/lib/api";
import { cn, formatStatus, formatDateTime, timeAgo } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  GraduationCap,
  Brain,
  MessageSquare,
  Plus,
  Star,
  Zap,
  TrendingUp,
  Clock,
  Filter,
  Tag,
  User,
  Bot,
  FileText,
  Lightbulb,
  Target,
  ShieldCheck,
  BarChart3,
} from "lucide-react";

interface FeedbackNote {
  id: string;
  author: string;
  category: string;
  note: string;
  task_id: string | null;
  task_title: string | null;
  agent_id: string | null;
  agent_name: string | null;
  created_at: string;
}

interface MCPDecision {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  decision_type: string;
  reasoning: string;
  confidence: number;
  input_data_summary: string;
  created_at: string;
}

const feedbackCategories = ["quality", "speed", "reliability", "communication", "cost", "technical", "general"];

const categoryColors: Record<string, { variant: "default" | "secondary" | "outline" | "success" | "warning" | "info" | "purple"; box: string; icon: React.ElementType }> = {
  quality: { variant: "purple", box: "bg-[#b49aff]/10 text-[#b49aff]", icon: Star },
  speed: { variant: "info", box: "bg-info/10 text-info", icon: Zap },
  reliability: { variant: "success", box: "bg-success/10 text-success", icon: ShieldCheck },
  communication: { variant: "warning", box: "bg-warning/10 text-warning", icon: MessageSquare },
  cost: { variant: "default", box: "bg-signal-500/10 text-signal-400", icon: TrendingUp },
  technical: { variant: "secondary", box: "bg-ink-800 text-ink-300", icon: Lightbulb },
  general: { variant: "outline", box: "bg-ink-800 text-ink-400", icon: Tag },
};

const decisionTypes = ["format", "decompose", "match", "rank_bids", "validate", "assign", "flag"];

const decisionTypeColors: Record<string, string> = {
  format: "info",
  decompose: "purple",
  match: "default",
  rank_bids: "warning",
  validate: "success",
  assign: "info",
  flag: "destructive",
};

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState("feedback");
  const [feedbackNotes, setFeedbackNotes] = useState<FeedbackNote[]>([]);
  const [mcpDecisions, setMCPDecisions] = useState<MCPDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // New note form
  const [newCategory, setNewCategory] = useState("general");
  const [newNote, setNewNote] = useState("");
  const [linkTaskId, setLinkTaskId] = useState("");
  const [linkAgentId, setLinkAgentId] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // MCP filter
  const [decisionTypeFilter, setDecisionTypeFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setLoadError(false);
    try {
      const [notes, decisions] = await Promise.all([
        apiGet<FeedbackNote[]>("/v1/dashboard/feedback-notes"),
        apiGet<MCPDecision[]>("/v1/dashboard/mcp-decisions"),
      ]);
      setFeedbackNotes(notes);
      setMCPDecisions(decisions);
        } catch {
      setLoadError(true);
      setFeedbackNotes([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await apiPost("/v1/dashboard/feedback-notes", {
        category: newCategory,
        note: newNote,
        task_id: linkTaskId || null,
        agent_id: linkAgentId || null,
      });
      await fetchData();
    } catch {
      setFeedbackNotes((prev) => [
        {
          id: `fn-${Date.now()}`,
          author: "Admin",
          category: newCategory,
          note: newNote,
          task_id: linkTaskId || null,
          task_title: linkTaskId ? `Task ${linkTaskId}` : null,
          agent_id: linkAgentId || null,
          agent_name: linkAgentId ? `Agent ${linkAgentId}` : null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setNewNote("");
      setLinkTaskId("");
      setLinkAgentId("");
      setAddingNote(false);
    }
  }

  const filteredDecisions = mcpDecisions.filter(
    (d) => decisionTypeFilter === "all" || d.decision_type === decisionTypeFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink-50">Learning & Feedback</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track operator feedback, MCP reasoning, and platform learning insights.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-[#b49aff]/30 bg-[#b49aff]/10 p-2">
                <MessageSquare className="h-4 w-4 text-[#b49aff]" />
              </div>
              <div>
                <p className="font-display text-2xl font-medium text-ink-50">{feedbackNotes.length}</p>
                <p className="text-xs text-muted-foreground">Feedback Notes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-signal-500/30 bg-signal-500/10 p-2">
                <Brain className="h-4 w-4 text-signal-400" />
              </div>
              <div>
                <p className="font-display text-2xl font-medium text-ink-50">{mcpDecisions.length}</p>
                <p className="text-xs text-muted-foreground">MCP Decisions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-success/30 bg-success/10 p-2">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="font-display text-2xl font-medium text-ink-50">
                  {mcpDecisions.length > 0
                    ? (mcpDecisions.reduce((s, d) => s + d.confidence, 0) / mcpDecisions.length * 100).toFixed(0)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Avg Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-warning/30 bg-warning/10 p-2">
                <BarChart3 className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="font-display text-2xl font-medium text-ink-50">
                  {new Set(mcpDecisions.map((d) => d.decision_type)).size}
                </p>
                <p className="text-xs text-muted-foreground">Decision Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="feedback">
            Feedback Notes
          </TabsTrigger>
          <TabsTrigger value="decisions">
            MCP Decisions
          </TabsTrigger>
        </TabsList>

        {/* Feedback Notes Tab */}
        <TabsContent value="feedback">
          <div className="space-y-6">
            {/* Add New Note Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <Plus className="h-4 w-4 text-ink-500" />
                  Add Feedback Note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full sm:w-40"
                    >
                      {feedbackCategories.map((cat) => (
                        <option key={cat} value={cat}>{formatStatus(cat)}</option>
                      ))}
                    </Select>
                    <Input
                      placeholder="Link task ID (optional)"
                      value={linkTaskId}
                      onChange={(e) => setLinkTaskId(e.target.value)}
                      className="w-full sm:w-44"
                    />
                    <Input
                      placeholder="Link agent ID (optional)"
                      value={linkAgentId}
                      onChange={(e) => setLinkAgentId(e.target.value)}
                      className="w-full sm:w-44"
                    />
                  </div>
                  <Textarea
                    placeholder="Write your feedback note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || addingNote}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      {addingNote ? "Adding..." : "Add Note"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes List */}
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-700 border-t-signal-500" />
                  <p className="text-sm text-muted-foreground">Loading feedback notes...</p>
                </div>
              </div>
            ) : loadError ? (
              <DataLoadError onRetry={fetchData} />
            ) : feedbackNotes.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center">
                <MessageSquare className="h-10 w-10 text-ink-600" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">No feedback notes yet</p>
                <p className="text-xs text-ink-500">Add your first note above to start building the knowledge base.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbackNotes.map((note) => {
                  const catConfig = categoryColors[note.category] || categoryColors.general;
                  const CatIcon = catConfig.icon;
                  return (
                    <Card key={note.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className={cn("shrink-0 rounded-md p-2", catConfig.box)}>
                            <CatIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={catConfig.variant} className="text-[10px]">
                                {formatStatus(note.category)}
                              </Badge>
                              <span className="text-xs font-medium text-ink-400">{note.author}</span>
                              <span className="font-mono text-xs text-ink-500">{timeAgo(note.created_at)}</span>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-ink-200">{note.note}</p>
                            {(note.task_title || note.agent_name) && (
                              <div className="mt-2 flex items-center gap-3 text-xs text-ink-500">
                                {note.agent_name && (
                                  <span className="flex items-center gap-1">
                                    <Bot className="h-3 w-3" />
                                    {note.agent_name}
                                  </span>
                                )}
                                {note.task_title && (
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {note.task_title}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* MCP Decisions Tab */}
        <TabsContent value="decisions">
          <div className="space-y-4">
            {/* Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-ink-500" />
                  <Select
                    value={decisionTypeFilter}
                    onChange={(e) => setDecisionTypeFilter(e.target.value)}
                    className="w-48"
                  >
                    <option value="all">All Decision Types</option>
                    {decisionTypes.map((dt) => (
                      <option key={dt} value={dt}>{formatStatus(dt)}</option>
                    ))}
                  </Select>
                  <span className="font-mono text-sm text-ink-500">
                    {filteredDecisions.length} decision{filteredDecisions.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Decisions List */}
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-700 border-t-signal-500" />
              </div>
            ) : loadError ? (
              <DataLoadError onRetry={fetchData} />
            ) : filteredDecisions.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center">
                <Brain className="h-10 w-10 text-ink-600" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">No MCP decisions found</p>
                <p className="text-xs text-ink-500">Try adjusting the filter or wait for MCP to process items.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDecisions.map((decision) => (
                  <Card key={decision.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div className="shrink-0 rounded-md border border-signal-500/30 bg-signal-500/10 p-2">
                            <Brain className="h-4 w-4 text-signal-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={(decisionTypeColors[decision.decision_type] as "info" | "purple" | "default" | "warning" | "success" | "destructive") || "secondary"}>
                                {formatStatus(decision.decision_type)}
                              </Badge>
                              <span className="text-sm font-medium text-ink-200">
                                {decision.entity_type}: {decision.entity_name}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-ink-300">
                              {decision.reasoning}
                            </p>
                            <div className="mt-2 rounded-md border border-ink-800 bg-ink-900 p-2 font-mono text-xs text-ink-400">
                              <span className="font-medium">Input:</span> {decision.input_data_summary}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <div className={cn(
                              "font-display text-lg font-medium",
                              decision.confidence >= 0.9 ? "text-success" :
                              decision.confidence >= 0.8 ? "text-info" :
                              decision.confidence >= 0.7 ? "text-warning" :
                              "text-danger"
                            )}>
                              {(decision.confidence * 100).toFixed(0)}%
                            </div>
                            <p className="eyebrow text-ink-500">Confidence</p>
                            <p className="mt-1 font-mono text-xs text-ink-500">{timeAgo(decision.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
