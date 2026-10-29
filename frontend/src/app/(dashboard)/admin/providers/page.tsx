"use client";

import React, { useState, useEffect } from "react";
import { DataLoadError } from "@/components/dashboard/data-load-error";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
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
  available_models?: string[];
  catalog_checked_at?: string | null;
  catalog_error?: string | null;
  selected_model_available?: boolean;
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

function competingStatus(enabled: boolean, keySet: boolean) {
  if (enabled && keySet) return { label: "Configured", variant: "success" as const };
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
  const [loadError, setLoadError] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await apiGet<ProvidersResponse>("/v1/admin/providers");
      setProviders(data.providers);
      setDrafts(makeDrafts(data.providers));
    } catch {
      setLoadError(true);
      setProviders([]);
      setDrafts({});
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

  async function checkCatalog(p: Provider) {
    setChecking(p.provider);
    patchDraft(p.provider, { saveState: "idle", message: "" });
    try {
      await apiPost(`/v1/admin/providers/${p.provider}/refresh`);
      const data = await apiGet<ProvidersResponse>("/v1/admin/providers");
      setProviders(data.providers);
      const updated = data.providers.find(item => item.provider === p.provider);
      patchDraft(p.provider, { saveState: updated?.catalog_error ? "error" : "success", message: updated?.catalog_error || "Catalog checked. Access, pricing and execution limits still apply." });
    } catch (cause) {
      patchDraft(p.provider, { saveState: "error", message: cause instanceof Error ? cause.message : "Catalog check failed. The last recorded catalog is retained." });
    } finally { setChecking(null); }
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
          message: "Configuration saved. Access, protocol compatibility and pricing determine execution eligibility.",
        },
      }));
    } catch (cause) {
      patchDraft(p.provider, {
        saveState: "error",
        message: cause instanceof Error ? cause.message : "Could not save. Check the key and try again.",
      });
    }
  }

  if (loadError) return <DataLoadError onRetry={fetchProviders} />;

  const competingCount = providers.filter((p) => p.enabled && p.key_set).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink-50">AI Providers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure providers and inspect models available to your account. Execution also requires
          a supported protocol, known pricing and sufficient mission budget.
        </p>
      </div>

      {/* Explainer callout */}
      <div className="flex items-start gap-3 rounded-md border border-info/30 bg-info/10 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
        <p className="text-sm leading-relaxed text-info">
          Model catalog access does not prove generation will succeed. Disabled providers remain
          disabled when their catalog is checked. Keys are stored server-side and never displayed again.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-md border border-ink-700 bg-ink-800 p-2">
              <Cpu className="h-4 w-4 text-ink-300" />
            </div>
            <div>
              <p className="font-display text-2xl font-medium text-ink-50">{providers.length}</p>
              <p className="text-xs text-muted-foreground">Providers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-md border border-success/30 bg-success/10 p-2">
              <Zap className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="font-display text-2xl font-medium text-ink-50">{competingCount}</p>
              <p className="text-xs text-muted-foreground">Enabled with Key</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-md border border-info/30 bg-info/10 p-2">
              <KeyRound className="h-4 w-4 text-info" />
            </div>
            <div>
              <p className="font-display text-2xl font-medium text-ink-50">
                {providers.filter((p) => p.key_set).length}
              </p>
              <p className="text-xs text-muted-foreground">Keys Configured</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider cards */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-700 border-t-signal-500" />
            <p className="text-sm text-muted-foreground">Loading providers...</p>
          </div>
        </div>
      ) : providers.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center text-center pt-6">
            <Plug className="h-10 w-10 text-ink-600" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">No providers available</p>
            <p className="text-xs text-ink-500">Providers will appear here once configured on the backend.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {providers.map((p) => {
            const draft = drafts[p.provider];
            if (!draft) return null;
            const status = competingStatus(p.enabled, p.key_set);
            return (
              <Card key={p.provider}>
                <CardContent className="pt-6">
                  {/* Top row: identity + status + toggle */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-ink-700 bg-ink-800 font-display text-lg font-medium text-ink-100">
                        {p.label.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{p.label}</h3>
                          <Badge variant={status.variant} className="text-[10px]">
                            {status.label}
                          </Badge>
                        </div>
                        <p className="font-mono text-xs text-ink-500">{p.base_url}</p>
                      </div>
                    </div>

                    {/* Enable / disable toggle */}
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-300">
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
                          draft.enabled ? "bg-signal-500" : "bg-ink-700"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-ink-50 shadow transition-transform",
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
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Model version
                      </label>
                      <Select
                        aria-label={`${p.label} model version`}
                        value={draft.selected_model}
                        onChange={(e) =>
                          patchDraft(p.provider, {
                            selected_model: e.target.value,
                            saveState: "idle",
                            message: "",
                          })
                        }
                      >
                        {Array.from(new Set([draft.selected_model, ...p.models])).filter(Boolean).map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* API key */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
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
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-500">
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

                  <div className="mt-5 space-y-2 rounded-md border border-ink-700 p-4 text-sm text-ink-300">
                    <p>{p.catalog_checked_at ? `Last catalog check: ${formatDateTime(p.catalog_checked_at)}` : "Model catalog has not been checked for this account."}</p>
                    {p.catalog_checked_at && <p>{p.available_models?.length ?? 0} models visible to this account</p>}
                    {p.catalog_error && <p role="alert" className="text-danger">{p.catalog_error}. The last recorded catalog is retained.</p>}
                    {p.selected_model_available === false && <p className="text-warning">The selected model is unavailable in the latest catalog. Choose an eligible model before using it for new missions.</p>}
                    <p className="text-xs text-ink-400">The model selector lists supported, priced text models. Account visibility alone does not establish execution eligibility. Catalog checks use the saved key; save key changes before checking.</p>
                    <Button variant="outline" size="sm" disabled={checking !== null || draft.saveState === "saving" || !p.key_set} onClick={() => checkCatalog(p)}>{checking === p.provider ? "Checking catalog…" : "Check model catalog"}</Button>
                  </div>

                  {/* Footer: save + status message */}
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="min-h-[20px] text-sm">
                      {draft.saveState === "success" && (
                        <span role="status" className="flex items-center gap-1 text-success">
                          <CheckCircle2 className="h-4 w-4" />
                          {draft.message}
                        </span>
                      )}
                      {draft.saveState === "error" && (
                        <span role="alert" className="flex items-center gap-1 text-danger">
                          <AlertCircle className="h-4 w-4" />
                          {draft.message}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSave(p)}
                      disabled={draft.saveState === "saving" || checking !== null}
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
