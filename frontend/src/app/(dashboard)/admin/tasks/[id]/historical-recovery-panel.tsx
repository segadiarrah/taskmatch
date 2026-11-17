"use client";

import { useAdminCopy, adminSource, adminError } from "@/lib/admin-copy";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface Provider {
  provider: string;
  label: string;
  enabled: boolean;
  key_set: boolean;
  models: string[];
}
interface RecoveryPreview {
  eligible: boolean;
  reason?: string;
  quote_id?: string;
  execution?: { provider: string; model: string; max_cost_eur: number | string };
}

export function HistoricalRecoveryPanel({ taskId, onChanged }: { taskId: string; onChanged: () => Promise<void> }) {
  const { a, formatNumber } = useAdminCopy();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [preview, setPreview] = useState<RecoveryPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const models = providers.find(item => item.provider === provider)?.models ?? [];

  const loadProviders = useCallback(async () => {
    setLoading(true); setLoadFailed(false); setError(null);
    try {
      const response = await apiGet<{ providers: Provider[] }>("/v1/admin/providers");
      setProviders(response.providers.filter(item => item.enabled && item.key_set && item.models.length > 0));
    } catch (cause) {
      setLoadFailed(true);
      setError(adminError(cause, adminSource("Providers could not be loaded.")));
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadProviders(); }, [loadProviders]);

  function changeSelection(nextProvider: string, nextModel: string) {
    setProvider(nextProvider); setModel(nextModel); setPreview(null); setError(null); setMessage(null);
  }

  async function previewRecovery() {
    if (!provider || !models.includes(model)) return;
    setBusy(true); setPreview(null); setError(null); setMessage(null);
    try {
      const query = new URLSearchParams({ provider, model });
      const response = await apiGet<RecoveryPreview>(`/v1/tasks/${taskId}/recovery-preview?${query}`);
      if (!response.eligible) {
        setError(response.reason || adminSource("This task is no longer eligible for historical recovery."));
        return;
      }
      const execution = response.execution;
      const cost = typeof execution?.max_cost_eur === "number" || (typeof execution?.max_cost_eur === "string" && execution.max_cost_eur.trim()) ? Number(execution.max_cost_eur) : NaN;
      if (!response.quote_id || !execution || execution.provider !== provider || execution.model !== model || !Number.isFinite(cost) || cost < 0) {
        throw new Error("The server did not return a valid recovery cost limit. Preview again before recovering.");
      }
      setPreview(response);
    } catch (cause) {
      setError(adminError(cause, adminSource("Recovery could not be previewed.")));
    } finally { setBusy(false); }
  }

  async function recover() {
    if (!preview?.eligible || !preview.quote_id || !preview.execution || busy) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      await apiPost(`/v1/tasks/${taskId}/recover`, {
        provider, model, quote_id: preview.quote_id, approved_max_cost_eur: preview.execution.max_cost_eur,
      });
      setPreview(null);
      setMessage(adminSource("Recovery requested. Execution remains subject to the recorded cost limit and funding checks."));
      await onChanged();
    } catch (cause) {
      setPreview(null);
      setError(adminError(cause, adminSource("Recovery failed. Preview again before retrying.")));
    } finally { setBusy(false); }
  }

  return (
    <section className="space-y-4 border-t border-ink-700 pt-5" aria-labelledby="historical-recovery-title">
      <h3 id="historical-recovery-title" className="font-semibold text-ink-50">{a("Recover historical task")}</h3>
      <p className="text-sm text-ink-300">{a("Choose an execution route and preview its cost limit before recovering this task. Historical mission pricing remains unchanged.")}</p>
      {error && <p role="alert" className="text-sm text-danger">{a(error)}</p>}
      {message && <p role="status" className="text-sm text-success">{a(message)}</p>}
      {loading ? <p className="text-sm text-ink-400">{a("Loading configured providers…")}</p> : loadFailed ? <Button variant="outline" onClick={loadProviders}>{a("Reload recovery providers")}</Button> : providers.length === 0 ? <p className="text-sm text-ink-400">{a("No enabled provider with a saved key and priced models is available. Configure a provider before previewing recovery.")}</p> : <>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><label htmlFor="recovery-provider" className="text-sm font-medium">{a("Recovery provider")}</label><Select id="recovery-provider" value={provider} onChange={event => changeSelection(event.target.value, "")} disabled={busy}><option value="">{a("Select a provider")}</option>{providers.map(item => <option key={item.provider} value={item.provider}>{item.label}</option>)}</Select></div>
          <div className="space-y-2"><label htmlFor="recovery-model" className="text-sm font-medium">{a("Recovery model")}</label><Select id="recovery-model" value={model} onChange={event => changeSelection(provider, event.target.value)} disabled={busy || !provider}><option value="">{a("Select a model")}</option>{models.map(item => <option key={item} value={item}>{item}</option>)}</Select></div>
        </div>
        <Button variant="outline" onClick={previewRecovery} disabled={busy || !provider || !model}>{a("Preview recovery")}</Button>
        {preview?.eligible && preview.execution && <div className="space-y-3 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
          <p className="text-ink-300">{a("Execution cost limit:")}  <strong className="font-mono text-ink-50">{formatNumber(preview.execution.max_cost_eur, 4)} EUR</strong></p>
          <p className="break-words text-ink-300">{preview.execution.provider} · {preview.execution.model}</p>
          <p className="text-ink-300">{a("Approving reserves this execution budget for this task. It does not change the client’s accepted quote.")}</p>
          <Button onClick={recover} disabled={busy}>{a("Approve cost limit and recover")}</Button>
        </div>}
      </>}
    </section>
  );
}
