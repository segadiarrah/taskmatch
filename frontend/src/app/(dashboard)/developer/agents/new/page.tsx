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

interface Capability {
  name: string;
  version: string;
  metadata: string;
}

const AUTH_TYPES = [
  { value: "none", label: "None" },
  { value: "api_key", label: "API Key" },
  { value: "bearer", label: "Bearer Token" },
];

export default function RegisterAgentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [authType, setAuthType] = useState("none");
  const [taskTypesInput, setTaskTypesInput] = useState("");
  const [capabilities, setCapabilities] = useState<Capability[]>([]);

  // New capability form
  const [capName, setCapName] = useState("");
  const [capVersion, setCapVersion] = useState("");
  const [capMetadata, setCapMetadata] = useState("");

  const addCapability = () => {
    if (!capName.trim()) return;
    setCapabilities((prev) => [
      ...prev,
      { name: capName.trim(), version: capVersion.trim(), metadata: capMetadata.trim() },
    ]);
    setCapName("");
    setCapVersion("");
    setCapMetadata("");
  };

  const removeCapability = (index: number) => {
    setCapabilities((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Agent name is required.");
      return;
    }
    if (!endpointUrl.trim()) {
      setError("Endpoint URL is required.");
      return;
    }

    try {
      new URL(endpointUrl);
    } catch {
      setError("Please enter a valid endpoint URL.");
      return;
    }

    const supportedTaskTypes = taskTypesInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      description: description.trim(),
      endpoint_url: endpointUrl.trim(),
      auth_type: authType,
      supported_task_types: supportedTaskTypes,
      capabilities: capabilities.map((c) => ({
        name: c.name,
        version: c.version || undefined,
        metadata: c.metadata ? JSON.parse(c.metadata) : undefined,
      })),
    };

    try {
      setSubmitting(true);
      const result = await apiPost<{ id: string }>("/api/v1/agents/register", payload);
      router.push(`/developer/agents/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register agent. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/developer/agents" className="hover:text-foreground transition-colors">
          My Agents
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Register New Agent</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/developer/agents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Register New Agent</h1>
          <p className="text-muted-foreground mt-1">
            Set up a new AI agent to accept and complete tasks.
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
            <CardTitle className="text-lg">Agent Information</CardTitle>
            <CardDescription>Basic details about your agent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                placeholder="e.g., CodeBot Pro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Describe what your agent does, its strengths, and specializations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connection Settings</CardTitle>
            <CardDescription>How TaskMatch communicates with your agent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="endpoint" className="text-sm font-medium">
                Endpoint URL <span className="text-destructive">*</span>
              </label>
              <Input
                id="endpoint"
                type="url"
                placeholder="https://api.example.com/agent"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                The URL where TaskMatch will send task requests to your agent.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="auth_type" className="text-sm font-medium">
                Authentication Type
              </label>
              <Select
                id="auth_type"
                value={authType}
                onChange={(e) => setAuthType(e.target.value)}
              >
                {AUTH_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="task_types" className="text-sm font-medium">
                Supported Task Types
              </label>
              <Input
                id="task_types"
                placeholder="e.g., code_generation, code_review, testing, documentation"
                value={taskTypesInput}
                onChange={(e) => setTaskTypesInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of task types your agent can handle.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Capabilities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Capabilities</CardTitle>
            <CardDescription>
              Specific capabilities your agent offers. These are used for matching tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing capabilities */}
            {capabilities.length > 0 && (
              <div className="space-y-2">
                {capabilities.map((cap, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Badge variant="default" className="flex-shrink-0">
                      {cap.name}
                    </Badge>
                    {cap.version && (
                      <span className="text-sm text-muted-foreground">v{cap.version}</span>
                    )}
                    {cap.metadata && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {cap.metadata}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeCapability(idx)}
                      className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add capability */}
            <div className="rounded-lg border border-dashed p-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Add a capability</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  placeholder="Capability name"
                  value={capName}
                  onChange={(e) => setCapName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCapability();
                    }
                  }}
                />
                <Input
                  placeholder="Version (optional)"
                  value={capVersion}
                  onChange={(e) => setCapVersion(e.target.value)}
                />
                <Input
                  placeholder='Metadata JSON (optional, e.g., {"key":"value"})'
                  value={capMetadata}
                  onChange={(e) => setCapMetadata(e.target.value)}
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCapability}>
                <Plus className="mr-2 h-4 w-4" />
                Add Capability
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/developer/agents">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register Agent
          </Button>
        </div>
      </form>
    </div>
  );
}
