"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Plus,
  X,
  ChevronRight,
  UploadCloud,
  FileText,
  CheckCircle2,
} from "lucide-react";

interface Requirement {
  requirement_type: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
}

interface CreateJobPayload {
  title: string;
  raw_description: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  deadline: string | null;
  auto_select_enabled: boolean;
  requirements: Requirement[];
}

interface UploadResult {
  documents?: { name: string; size: number; chars: number }[];
  ingested_chars?: number;
  total_documents?: number;
}

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];
const REQUIREMENT_TYPES = ["skill", "experience", "certification", "tool", "language", "other"];
const PRIORITIES: Requirement["priority"][] = ["low", "medium", "high", "critical"];

const ACCEPTED_DOC_TYPES = ".pdf,.doc,.docx,.txt,.md,.csv,.json,.rtf,.xls,.xlsx,.ppt,.pptx";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type SubmitPhase = "creating" | "uploading" | "planning";

export default function CreateJobPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<SubmitPhase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [ingestSummary, setIngestSummary] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [deadline, setDeadline] = useState("");
  const [autoSelect, setAutoSelect] = useState(false);
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  // Document attachments
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New requirement form state
  const [newReqType, setNewReqType] = useState("skill");
  const [newReqDesc, setNewReqDesc] = useState("");
  const [newReqPriority, setNewReqPriority] = useState<Requirement["priority"]>("medium");

  const addRequirement = () => {
    if (!newReqDesc.trim()) return;
    setRequirements((prev) => [
      ...prev,
      { requirement_type: newReqType, description: newReqDesc.trim(), priority: newReqPriority },
    ]);
    setNewReqDesc("");
    setNewReqPriority("medium");
  };

  const removeRequirement = (index: number) => {
    setRequirements((prev) => prev.filter((_, i) => i !== index));
  };

  const addFiles = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const list = Array.from(incoming);
    if (list.length === 0) return;
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const merged = [...prev];
      for (const f of list) {
        const key = `${f.name}:${f.size}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(f);
        }
      }
      return merged;
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (submitting) return;
    addFiles(e.dataTransfer?.files ?? null);
  };

  const uploadDocuments = async (jobId: string): Promise<UploadResult | null> => {
    if (files.length === 0) return null;
    const formData = new FormData();
    for (const f of files) {
      formData.append("files", f);
    }
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await fetch(`${API_BASE}/v1/jobs/${jobId}/documents`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
    if (!res.ok) {
      let detail = `Upload failed (${res.status})`;
      try {
        const body = await res.json();
        if (body && typeof body === "object" && "detail" in body) {
          detail = String((body as { detail: unknown }).detail);
        }
      } catch {
        // ignore parse errors, keep generic message
      }
      throw new Error(detail);
    }
    return (await res.json()) as UploadResult;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploadWarning(null);
    setIngestSummary(null);

    // Validation
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    const min = parseFloat(budgetMin);
    const max = parseFloat(budgetMax);
    if (isNaN(min) || min < 0) {
      setError("Please enter a valid minimum budget.");
      return;
    }
    if (isNaN(max) || max < min) {
      setError("Maximum budget must be greater than or equal to minimum budget.");
      return;
    }

    const payload: CreateJobPayload = {
      title: title.trim(),
      raw_description: description.trim(),
      budget_min: min,
      budget_max: max,
      currency,
      deadline: deadline || null,
      auto_select_enabled: autoSelect,
      requirements,
    };

    try {
      setSubmitting(true);

      // 1. Create the draft job.
      setPhase("creating");
      const result = await apiPost<{ id: string }>("/v1/jobs", payload);

      // 2. Best-effort: ingest attached documents into the brief before submit.
      if (files.length > 0) {
        setPhase("uploading");
        try {
          const uploaded = await uploadDocuments(result.id);
          if (uploaded) {
            const count = uploaded.total_documents ?? uploaded.documents?.length ?? files.length;
            const chars = uploaded.ingested_chars ?? 0;
            setIngestSummary(
              `Ingested ${count} document${count === 1 ? "" : "s"}` +
                (chars > 0 ? ` (${chars.toLocaleString()} characters)` : "") +
                " into the brief."
            );
          }
        } catch (uploadErr) {
          // Non-blocking: continue to submit even if ingestion fails.
          setUploadWarning(
            (uploadErr instanceof Error ? uploadErr.message : "Document upload failed.") +
              " Proceeding without the attachments."
          );
        }
      }

      // 3. Submit the job so the backend starts planning it in the background,
      // then route to the detail page where the execution plan appears.
      setPhase("planning");
      try {
        await apiPost(`/v1/jobs/${result.id}/submit`, {});
      } catch {
        // If auto-submit fails, the detail page still offers a submit prompt.
      }
      router.push(`/client/jobs/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job. Please try again.");
      setPhase(null);
      setSubmitting(false);
    }
  };

  const priorityVariant: Record<string, "secondary" | "info" | "warning" | "destructive"> = {
    low: "secondary",
    medium: "info",
    high: "warning",
    critical: "destructive",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/client/jobs" className="hover:text-foreground transition-colors">
          My Jobs
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Create New Job</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/client/jobs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-medium text-ink-50 sm:text-3xl">Create New Job</h1>
          <p className="text-muted-foreground mt-1">
            Describe your complex task in detail and attach any specs, data, or documents &mdash;
            the platform ingests everything and routes each part to the best-qualified agent or
            human expert.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Non-blocking upload warning */}
      {uploadWarning && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4">
          <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
          <p className="text-sm text-warning">{uploadWarning}</p>
        </div>
      )}

      {/* Ingestion confirmation */}
      {ingestSummary && (
        <div className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 p-4">
          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
          <p className="text-sm text-success">{ingestSummary}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Job Details</CardTitle>
            <CardDescription>Provide the basic information about your project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                placeholder="e.g., Build a REST API for e-commerce platform"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Detailed description <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="description"
                placeholder="Describe your complex task in full: the outcome you need, the context and background, deliverables, technical requirements, constraints, and success criteria. The more detail you provide, the better the platform can decompose the work and route each part to the right agent or human expert."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[260px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                Write as much as you need &mdash; this is not a one-line prompt. Attach supporting
                documents below and the platform will ingest them alongside your description.
              </p>
            </div>

            {/* Document uploads */}
            <div className="space-y-2">
              <label htmlFor="documents" className="text-sm font-medium">
                Attachments <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!submitting) setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                }}
                onDrop={handleDrop}
                onClick={() => {
                  if (!submitting) fileInputRef.current?.click();
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !submitting) {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-input hover:border-primary/60 hover:bg-muted/40"
                } ${submitting ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
              >
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Drop files here or <span className="text-primary">browse</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Specs, briefs, data, designs &mdash; PDF, Word, TXT, Markdown, CSV, JSON and more.
                  The platform extracts the text and ingests it into your brief.
                </p>
                <input
                  ref={fileInputRef}
                  id="documents"
                  type="file"
                  multiple
                  accept={ACCEPTED_DOC_TYPES}
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    // Reset so selecting the same file again re-triggers change.
                    e.target.value = "";
                  }}
                />
              </div>

              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {files.map((file, idx) => (
                    <span
                      key={`${file.name}:${file.size}:${idx}`}
                      className="inline-flex items-center gap-2 rounded-sm border border-ink-700 bg-ink-800 py-1 pl-3 pr-1.5 font-mono text-xs"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="max-w-[220px] truncate font-medium" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-muted-foreground">{formatBytes(file.size)}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        disabled={submitting}
                        aria-label={`Remove ${file.name}`}
                        className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget & Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget & Timeline</CardTitle>
            <CardDescription>Set your budget range and project deadline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="budget_min" className="text-sm font-medium">
                  Min Budget <span className="text-destructive">*</span>
                </label>
                <Input
                  id="budget_min"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="budget_max" className="text-sm font-medium">
                  Max Budget <span className="text-destructive">*</span>
                </label>
                <Input
                  id="budget_max"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="currency" className="text-sm font-medium">
                  Currency
                </label>
                <Select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="deadline" className="text-sm font-medium">
                Deadline
              </label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Leave blank if there is no hard deadline.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-4">
              <input
                id="auto_select"
                type="checkbox"
                checked={autoSelect}
                onChange={(e) => setAutoSelect(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              <div>
                <label htmlFor="auto_select" className="text-sm font-medium cursor-pointer">
                  Auto-select agents
                </label>
                <p className="text-xs text-muted-foreground">
                  Let TaskMatch automatically assign the best-matched agents to your tasks.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Requirements</CardTitle>
            <CardDescription>
              Add specific requirements for this job. These help filter and match agents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing requirements */}
            {requirements.length > 0 && (
              <div className="space-y-2">
                {requirements.map((req, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Badge variant="outline" className="flex-shrink-0 capitalize">
                      {req.requirement_type}
                    </Badge>
                    <span className="text-sm flex-1">{req.description}</span>
                    <Badge variant={priorityVariant[req.priority]} className="flex-shrink-0 capitalize">
                      {req.priority}
                    </Badge>
                    <button
                      type="button"
                      aria-label={`Remove requirement ${idx + 1}`}
                      onClick={() => removeRequirement(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new requirement */}
            <div className="rounded-lg border border-dashed p-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Add a requirement</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Select
                  value={newReqType}
                  onChange={(e) => setNewReqType(e.target.value)}
                >
                  {REQUIREMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </Select>
                <Input
                  placeholder="e.g., Python 3.10+"
                  value={newReqDesc}
                  onChange={(e) => setNewReqDesc(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRequirement();
                    }
                  }}
                />
                <Select
                  value={newReqPriority}
                  onChange={(e) => setNewReqPriority(e.target.value as Requirement["priority"])}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addRequirement}>
                <Plus className="mr-2 h-4 w-4" />
                Add Requirement
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/client/jobs">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {phase === "creating"
              ? "Creating…"
              : phase === "uploading"
              ? "Uploading documents…"
              : phase === "planning"
              ? "Planning…"
              : "Create Job"}
          </Button>
        </div>
      </form>
    </div>
  );
}
