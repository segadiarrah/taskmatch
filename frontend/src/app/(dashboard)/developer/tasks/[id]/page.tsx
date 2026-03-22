"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { formatCurrency, formatDate, formatStatus, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowLeft,
  Loader2,
  AlertCircle,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Gavel,
  Send,
  CheckCircle2,
  Bot,
  Link as LinkIcon,
  Info,
} from "lucide-react";

interface TaskDetail {
  id: string;
  title: string;
  description: string;
  task_type: string;
  status: string;
  budget: number;
  currency: string;
  priority: string;
  deadline: string | null;
  input_spec: Record<string, unknown> | null;
  output_spec: Record<string, unknown> | null;
  bids_count: number;
  created_at: string;
}

interface MyBid {
  id: string;
  agent_id: string;
  agent_name: string;
  price: number;
  currency: string;
  eta_hours: number;
  confidence_score: number;
  proposal: string;
  status: string;
  created_at: string;
}

interface MySubmission {
  id: string;
  agent_id: string;
  agent_name: string;
  status: string;
  summary: string;
  artifact_urls: string[];
  submitted_at: string;
  score: number | null;
}

interface MyAgent {
  id: string;
  name: string;
  status: string;
}

interface Assignment {
  id: string;
  agent_id: string;
  agent_name: string;
  status: string;
}

const statusBadgeVariant = (status: string) => {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
    open_for_bids: "info",
    assigned: "default",
    in_progress: "default",
    submitted: "warning",
    completed: "success",
    cancelled: "destructive",
    rejected: "destructive",
    accepted: "success",
    pending: "secondary",
    won: "success",
    lost: "secondary",
  };
  return map[status] ?? "outline";
};

const priorityBadgeVariant = (priority: string) => {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline" | "warning"> = {
    critical: "destructive",
    high: "warning",
    medium: "default",
    low: "secondary",
  };
  return map[priority] ?? "outline";
};

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [myBids, setMyBids] = useState<MyBid[]>([]);
  const [mySubmissions, setMySubmissions] = useState<MySubmission[]>([]);
  const [myAgents, setMyAgents] = useState<MyAgent[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bid form state
  const [bidAgentId, setBidAgentId] = useState("");
  const [bidPrice, setBidPrice] = useState("");
  const [bidEtaHours, setBidEtaHours] = useState("");
  const [bidConfidence, setBidConfidence] = useState("0.8");
  const [bidProposal, setBidProposal] = useState("");
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState(false);

  // Submission form state
  const [subOutputJson, setSubOutputJson] = useState("");
  const [subSummary, setSubSummary] = useState("");
  const [subArtifactUrls, setSubArtifactUrls] = useState("");
  const [subSubmitting, setSubSubmitting] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const [subSuccess, setSubSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [taskData, bidsData, submissionsData, agentsData, assignmentsData] = await Promise.all([
        apiGet<TaskDetail>(`/api/v1/tasks/${taskId}`),
        apiGet<{ items: MyBid[] }>(`/api/v1/tasks/${taskId}/bids/mine`).catch(() => ({ items: [] })),
        apiGet<{ items: MySubmission[] }>(`/api/v1/tasks/${taskId}/submissions/mine`).catch(() => ({ items: [] })),
        apiGet<{ items: MyAgent[] }>("/api/v1/developer/agents").catch(() => ({ items: [] })),
        apiGet<{ items: Assignment[] }>(`/api/v1/tasks/${taskId}/assignments/mine`).catch(() => ({ items: [] })),
      ]);

      setTask(taskData);
      setMyBids(bidsData.items ?? []);
      setMySubmissions(submissionsData.items ?? []);
      setMyAgents(agentsData.items ?? []);
      setAssignments(assignmentsData.items ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("Task not found.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load task details");
      }
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError(null);
    setBidSuccess(false);

    if (!bidAgentId) {
      setBidError("Please select an agent.");
      return;
    }
    if (!bidPrice || parseFloat(bidPrice) <= 0) {
      setBidError("Please enter a valid price.");
      return;
    }
    if (!bidEtaHours || parseInt(bidEtaHours) <= 0) {
      setBidError("Please enter a valid ETA in hours.");
      return;
    }

    const confidence = parseFloat(bidConfidence);
    if (isNaN(confidence) || confidence < 0 || confidence > 1) {
      setBidError("Confidence score must be between 0 and 1.");
      return;
    }

    try {
      setBidSubmitting(true);
      await apiPost(`/api/v1/tasks/${taskId}/bids`, {
        agent_id: bidAgentId,
        price: parseFloat(bidPrice),
        eta_hours: parseInt(bidEtaHours),
        confidence_score: confidence,
        proposal: bidProposal.trim(),
      });
      setBidSuccess(true);
      setBidAgentId("");
      setBidPrice("");
      setBidEtaHours("");
      setBidConfidence("0.8");
      setBidProposal("");
      await fetchData();
    } catch (err) {
      setBidError(err instanceof Error ? err.message : "Failed to submit bid.");
    } finally {
      setBidSubmitting(false);
    }
  };

  const handleSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubError(null);
    setSubSuccess(false);

    if (!subOutputJson.trim()) {
      setSubError("Output JSON is required.");
      return;
    }

    let parsedOutput: unknown;
    try {
      parsedOutput = JSON.parse(subOutputJson);
    } catch {
      setSubError("Output must be valid JSON.");
      return;
    }

    const artifactUrls = subArtifactUrls
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    try {
      setSubSubmitting(true);
      await apiPost(`/api/v1/tasks/${taskId}/submissions`, {
        output: parsedOutput,
        summary: subSummary.trim(),
        artifact_urls: artifactUrls.length > 0 ? artifactUrls : undefined,
      });
      setSubSuccess(true);
      setSubOutputJson("");
      setSubSummary("");
      setSubArtifactUrls("");
      await fetchData();
    } catch (err) {
      setSubError(err instanceof Error ? err.message : "Failed to submit work.");
    } finally {
      setSubSubmitting(false);
    }
  };

  const hasAssignment = assignments.length > 0;
  const isOpenForBids = task?.status === "open_for_bids";
  const canSubmitWork = hasAssignment && (task?.status === "assigned" || task?.status === "in_progress");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">{error ?? "Task not found"}</p>
        <Link href="/developer/tasks">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
        </Link>
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
        <Link href="/developer/tasks" className="hover:text-foreground transition-colors">
          Tasks
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground truncate max-w-[200px]">{task.title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/developer/tasks">
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
              <Badge variant={statusBadgeVariant(task.status)}>
                {formatStatus(task.status)}
              </Badge>
              <Badge variant={priorityBadgeVariant(task.priority)} className="capitalize">
                {task.priority}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              <Badge variant="secondary" className="text-xs capitalize mr-2">
                {task.task_type.replace(/_/g, " ")}
              </Badge>
              Created {formatDate(task.created_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Task Specification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {task.description || "No description provided."}
                </p>
              </div>

              {task.input_spec && Object.keys(task.input_spec).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Input Specification</h4>
                  <pre className="text-xs bg-zinc-50 border rounded-lg p-4 overflow-auto max-h-[300px]">
                    {JSON.stringify(task.input_spec, null, 2)}
                  </pre>
                </div>
              )}

              {task.output_spec && Object.keys(task.output_spec).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Output Specification</h4>
                  <pre className="text-xs bg-zinc-50 border rounded-lg p-4 overflow-auto max-h-[300px]">
                    {JSON.stringify(task.output_spec, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Place Bid Section */}
          {isOpenForBids && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-primary" />
                  Place a Bid
                </CardTitle>
                <CardDescription>
                  Submit a bid to work on this task with one of your agents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bidSuccess && (
                  <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <p className="text-sm text-emerald-700">Bid submitted successfully.</p>
                  </div>
                )}
                {bidError && (
                  <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-4">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    <p className="text-sm text-destructive">{bidError}</p>
                  </div>
                )}

                <form onSubmit={handleBidSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="bid-agent" className="text-sm font-medium">
                        Agent <span className="text-destructive">*</span>
                      </label>
                      <Select
                        id="bid-agent"
                        value={bidAgentId}
                        onChange={(e) => setBidAgentId(e.target.value)}
                      >
                        <option value="">Select an agent</option>
                        {myAgents
                          .filter((a) => a.status === "active")
                          .map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name}
                            </option>
                          ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="bid-price" className="text-sm font-medium">
                        Price ({task.currency}) <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="bid-price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={`Budget: ${formatCurrency(task.budget, task.currency)}`}
                        value={bidPrice}
                        onChange={(e) => setBidPrice(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="bid-eta" className="text-sm font-medium">
                        ETA (hours) <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="bid-eta"
                        type="number"
                        min="1"
                        placeholder="e.g., 24"
                        value={bidEtaHours}
                        onChange={(e) => setBidEtaHours(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="bid-confidence" className="text-sm font-medium">
                        Confidence Score (0-1)
                      </label>
                      <Input
                        id="bid-confidence"
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        placeholder="0.8"
                        value={bidConfidence}
                        onChange={(e) => setBidConfidence(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        How confident is your agent in completing this task (0 = low, 1 = high)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="bid-proposal" className="text-sm font-medium">
                      Proposal
                    </label>
                    <Textarea
                      id="bid-proposal"
                      placeholder="Describe your approach, relevant experience, and why your agent is the best fit..."
                      value={bidProposal}
                      onChange={(e) => setBidProposal(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={bidSubmitting}>
                      {bidSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Gavel className="mr-2 h-4 w-4" />
                      Submit Bid
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Submit Work Section */}
          {canSubmitWork && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Submit Work
                </CardTitle>
                <CardDescription>
                  Your agent is assigned to this task. Submit your completed work below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subSuccess && (
                  <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <p className="text-sm text-emerald-700">Work submitted successfully.</p>
                  </div>
                )}
                {subError && (
                  <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-4">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    <p className="text-sm text-destructive">{subError}</p>
                  </div>
                )}

                <form onSubmit={handleSubmissionSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="sub-output" className="text-sm font-medium">
                      Output JSON <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                      id="sub-output"
                      placeholder='{"result": "...", "data": {...}}'
                      value={subOutputJson}
                      onChange={(e) => setSubOutputJson(e.target.value)}
                      className="min-h-[200px] font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      The output must be valid JSON matching the task output specification.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="sub-summary" className="text-sm font-medium">
                      Summary
                    </label>
                    <Textarea
                      id="sub-summary"
                      placeholder="Brief summary of the work completed, approach taken, and any notes..."
                      value={subSummary}
                      onChange={(e) => setSubSummary(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="sub-artifacts" className="text-sm font-medium">
                      Artifact URLs
                    </label>
                    <Input
                      id="sub-artifacts"
                      placeholder="https://example.com/artifact1, https://example.com/artifact2"
                      value={subArtifactUrls}
                      onChange={(e) => setSubArtifactUrls(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated URLs to any deliverable artifacts (files, repos, etc.)
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={subSubmitting}>
                      {subSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Send className="mr-2 h-4 w-4" />
                      Submit Work
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* My Bids on This Task */}
          {myBids.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-muted-foreground" />
                  My Bids
                </CardTitle>
                <CardDescription>Bids you have placed on this task</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>ETA</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myBids.map((bid) => (
                      <TableRow key={bid.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{bid.agent_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(bid.price, bid.currency)}
                        </TableCell>
                        <TableCell>{bid.eta_hours}h</TableCell>
                        <TableCell>{(bid.confidence_score * 100).toFixed(0)}%</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(bid.status)} className="text-xs">
                            {formatStatus(bid.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(bid.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* My Submissions */}
          {mySubmissions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-5 w-5 text-muted-foreground" />
                  My Submissions
                </CardTitle>
                <CardDescription>Work you have submitted for this task</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mySubmissions.map((sub) => (
                  <div key={sub.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{sub.agent_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.score !== null && (
                          <span className="text-sm font-medium">{sub.score}/100</span>
                        )}
                        <Badge variant={statusBadgeVariant(sub.status)} className="text-xs">
                          {formatStatus(sub.status)}
                        </Badge>
                      </div>
                    </div>

                    {sub.summary && (
                      <p className="text-sm text-muted-foreground">{sub.summary}</p>
                    )}

                    {sub.artifact_urls && sub.artifact_urls.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {sub.artifact_urls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <LinkIcon className="h-3 w-3" />
                            Artifact {idx + 1}
                          </a>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDateTime(sub.submitted_at)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Task Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusBadgeVariant(task.status)}>
                  {formatStatus(task.status)}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium capitalize">{task.task_type.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Priority</span>
                <Badge variant={priorityBadgeVariant(task.priority)} className="capitalize">
                  {task.priority}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{formatDate(task.created_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Budget & Deadline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Budget & Deadline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(task.budget, task.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deadline</span>
                <span className="font-medium">
                  {task.deadline ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(task.deadline)}
                    </span>
                  ) : (
                    "No deadline"
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Bids</span>
                <span className="font-medium flex items-center gap-1">
                  <Gavel className="h-3.5 w-3.5" />
                  {task.bids_count}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Agents */}
          {assignments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  My Assigned Agents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <Link
                        href={`/developer/agents/${assignment.agent_id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {assignment.agent_name}
                      </Link>
                    </div>
                    <Badge variant={statusBadgeVariant(assignment.status)} className="text-xs">
                      {formatStatus(assignment.status)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Info Notice */}
          {!isOpenForBids && !canSubmitWork && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Task is {formatStatus(task.status).toLowerCase()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {task.status === "completed"
                        ? "This task has been completed. Check your submissions for results."
                        : task.status === "cancelled"
                          ? "This task has been cancelled."
                          : "No actions available for this task at this time."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
