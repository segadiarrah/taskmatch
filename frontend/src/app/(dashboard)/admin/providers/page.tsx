"use client";

import React, { useState, useEffect } from "react";
import { apiGet, apiPut } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Plug,
  KeyRound,
  Cpu,
  Zap,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface Provider {
  provider: string;
  label: string;
  base_url: string;
  models: string[];
  selected_model: string;
  enabled: boolean;
  key_set: boolean;
  key_hint: string | null;
}

interface ProvidersResponse {
  providers: Provider[];
}

interface PutResponse {
  provider: Provider;
  competing: boolean;
}

type SaveState = "idle" | "saving" | "success" | "error";

// Local, per-provider draft of pending edits (never re-displays the key).
interface Draft {
  selected_model: string;
  enabled: boolean;
  apiKey: string; // write-only; cleared after save
  saveState: SaveState;
  message: string;
}

const FALLBACK_PROVIDERS: Provider[] = [
  {
    provider: "openai",
    label: "OpenAI",
    base_url: "https://api.openai.com/v1",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "o3"],
    selected_model: "gpt-4o",
    enabled: false,
    key_set: false,
    key_hint: null,
  },
  {
    provider: "anthropic",
    label: "Anthropic",
    base_url: "https://api.anthropic.com",
    models: ["claude-opus-4", "claude-sonnet-4", "claude-3-5-haiku"],
    selected_model: "claude-sonnet-4",
    enabled: false,
    key_set: false,
    key_hint: null,
  },
  {
    provider: "google",
    label: "Google Gemini",
    base_url: "https://generativelanguage.googleapis.com",
    models: ["gemini-2.5-pro", "gemini-2.5-flash"],
    selected_model: "gemini-2.5-flash",
    enabled: false,
    key_set: false,
    key_hint: null,
  },
  {
    provider: "mistral",
    label: "Mistral",
    base_url: "https://api.mistral.ai/v1",
    models: ["mistral-large", "mistral-small", "codestral"],
    selected_model: "mistral-small",
    enabled: false,
    key_set: false,
    key_hint: null,
  },
  {
    provider: "xai",
    label: "xAI Grok",
    base_url: "https://api.x.ai/v1",
    models: ["grok-4", "grok-3", "grok-3-mini"],
    selected_model: "grok-3",
    enabled: false,
    key_set: false,
    key_hint: null,
  },
  {
    provider: "deepseek",
    label: "DeepSeek",
    base_url: "https://api.deepseek.com",
    models: ["deepseek-chat", "deepseek-reasoner"],
    selected_model: "deepseek-chat",
    enabled: false,
    key_set: false,
    key_hint: null,
  },
];

function competingStatus(enabled: boolean, keySet: boolean) {
  if (enabled && keySet) return { label: "Competing", variant: "success" as const };
  if (enabled && !keySet) return { label: "Enabled (no key)", variant: "warning" as const };
  return { label: "Off", variant: "secondary" as const };
}

function makeDrafts(providers: Provider[]): Record<string, Draft> {
  const drafts: Record<string, Draft> = {};
  for (const p of providers) {
    drafts[p.provider] = {
      selected_model: p.selected_model,
      enabled: p.enabled,
      apiKey: "",
      saveState: "idle",
      message: "",
    };
  }
  return drafts;
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    setLoading(true);
    try {
      const data = await apiGet<ProvidersResponse>("/v1/admin/providers");
      setProviders(data.providers);
      setDrafts(makeDrafts(data.providers));
    } catch {
      setProviders(FALLBACK_PROVIDERS);
      setDrafts(makeDrafts(FALLBACK_PROVIDERS));
    } finally {
      setLoading(false);
    }
  }

  function patchDraft(providerId: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({
      ...prev,
      [providerId]: { ...prev[providerId], ...patch },
    }));
  }

  async function handleSave(p: Provider) {
    const draft = drafts[p.provider];
    if (!draft) return;

    // Build a body with only the fields that actually changed.
    const body: {
      api_key?: string;
      enabled?: boolean;
      selected_model?: string;
    } = {};
    if (draft.apiKey.trim()) body.api_key = draft.apiKey.trim();
    if (draft.enabled !== p.enabled) body.enabled = draft.enabled;
    if (draft.selected_model !== p.selected_model) body.selected_model = draft.selected_model;

    if (Object.keys(body).length === 0) {
      patchDraft(p.provider, { saveState: "error", message: "No changes to save." });
      return;
    }

    patchDraft(p.provider, { saveState: "saving", message: "" });
    try {
      const res = await apiPut<PutResponse>(`/v1/admin/providers/${p.provider}`, body);
      // Refresh this provider from the masked response.
      setProviders((prev) =>
        prev.map((x) => (x.provider === p.provider ? res.provider : x))
      );
      setDrafts((prev) => ({
        ...prev,
        [p.provider]: {
          selected_model: res.provider.selected_model,
          enabled: res.provider.enabled,
          apiKey: "",
          saveState: "success",
          message: res.competing
            ? "Saved. This provider is now competing on tasks."
            : "Saved.",
        },
      }));
    } catch {
      patchDraft(p.provider, {
        saveState: "error",
        message: "Could not save. Check the key and try again.",
      });
    }
  }

  const competingCount = providers.filter((p) => p.enabled && p.key_set).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">AI Providers</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Plug in the major market LLMs so they compete as executors alongside
          developer-registered agents. Enabled providers can pick up and execute
          incoming requests immediately, without waiting for a developer agent to sign up.
        </p>
      </div>

      {/* Explainer callout */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <p className="text-sm leading-relaxed text-blue-800">
          Providers you enable here register as platform agents that bid on and execute
          tasks automatically &mdash; before any developer agent signs up. Keys are stored
          server-side and never displayed again.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-zinc-100 p-2">
              <Cpu className="h-4 w-4 text-zinc-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{providers.length}</p>
              <p className="text-xs text-zinc-500">Providers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-emerald-100 p-2">
              <Zap className="h-4 w-4 text-emerald-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{competingCount}</p>
              <p className="text-xs text-zinc-500">Competing Now</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-lg bg-blue-100 p-2">
              <KeyRound className="h-4 w-4 text-blue-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">
                {providers.filter((p) => p.key_set).length}
              </p>
              <p className="text-xs text-zinc-500">Keys Configured</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider cards */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
            <p className="text-sm text-zinc-500">Loading providers...</p>
          </div>
        </div>
      ) : providers.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center text-center pt-6">
            <Plug className="h-10 w-10 text-zinc-300" />
            <p className="mt-3 text-sm font-medium text-zinc-500">No providers available</p>
            <p className="text-xs text-zinc-400">Providers will appear here once configured on the backend.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {providers.map((p) => {
            const draft = drafts[p.provider];
            if (!draft) return null;
            const status = competingStatus(draft.enabled, p.key_set || !!draft.apiKey.trim());
            return (
              <Card key={p.provider}>
                <CardContent className="pt-6">
                  {/* Top row: identity + status + toggle */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-lg font-bold text-zinc-700">
                        {p.label.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-zinc-900">{p.label}</h3>
                          <Badge variant={status.variant} className="text-[10px]">
                            {status.label}
                          </Badge>
                        </div>
                        <p className="font-mono text-xs text-zinc-400">{p.base_url}</p>
                      </div>
                    </div>

                    {/* Enable / disable toggle */}
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600">
                      <span>{draft.enabled ? "Enabled" : "Disabled"}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={draft.enabled}
                        aria-label={`Toggle ${p.label}`}
                        onClick={() =>
                          patchDraft(p.provider, {
                            enabled: !draft.enabled,
                            saveState: "idle",
                            message: "",
                          })
                        }
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                          draft.enabled ? "bg-emerald-500" : "bg-zinc-300"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                            draft.enabled ? "translate-x-4" : "translate-x-0.5"
                          )}
                        />
                      </button>
                    </label>
                  </div>

                  {/* Controls */}
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {/* Model select */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-500">
                        Model version
                      </label>
                      <Select
                        value={draft.selected_model}
                        onChange={(e) =>
                          patchDraft(p.provider, {
                            selected_model: e.target.value,
                            saveState: "idle",
                            message: "",
                          })
                        }
                      >
                        {p.models.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* API key */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-500">
                        API key
                      </label>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder={
                          p.key_set && p.key_hint
                            ? `Key set (${p.key_hint}) - enter to replace`
                            : "No key set - paste API key"
                        }
                        value={draft.apiKey}
                        onChange={(e) =>
                          patchDraft(p.provider, {
                            apiKey: e.target.value,
                            saveState: "idle",
                            message: "",
                          })
                        }
                      />
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-zinc-400">
                        <KeyRound className="h-3 w-3" />
                        {p.key_set && p.key_hint ? (
                          <span>
                            Stored key: <span className="font-mono">{p.key_hint}</span>
                          </span>
                        ) : (
                          <span>No key set</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Footer: save + status message */}
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="min-h-[20px] text-sm">
                      {draft.saveState === "success" && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          {draft.message}
                        </span>
                      )}
                      {draft.saveState === "error" && (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          {draft.message}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSave(p)}
                      disabled={draft.saveState === "saving"}
                    >
                      {draft.saveState === "saving" ? (
                        <>
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
