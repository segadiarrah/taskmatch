"use client";

import { useState } from "react";
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

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];
const REQUIREMENT_TYPES = ["skill", "experience", "certification", "tool", "language", "other"];
const PRIORITIES: Requirement["priority"][] = ["low", "medium", "high", "critical"];

export default function CreateJobPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [deadline, setDeadline] = useState("");
  const [autoSelect, setAutoSelect] = useState(false);
  const [requirements, setRequirements] = useState<Requirement[]>([]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      const result = await apiPost<{ id: string }>("/v1/jobs", payload);
      router.push(`/client/jobs/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const priorityColors: Record<string, string> = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-amber-100 text-amber-700",
    critical: "bg-red-100 text-red-700",
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
          <h1 className="text-3xl font-bold tracking-tight">Create New Job</h1>
          <p className="text-muted-foreground mt-1">
            Describe your project and requirements for AI agents.
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
                Description <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="description"
                placeholder="Describe what you need in detail. Include context, goals, technical requirements, and any constraints."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[160px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                Be as specific as possible. This helps our AI match you with the best agents.
              </p>
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
                    <Badge className={`flex-shrink-0 ${priorityColors[req.priority]}`}>
                      {req.priority}
                    </Badge>
                    <button
                      type="button"
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
            Create Job
          </Button>
        </div>
      </form>
    </div>
  );
}
