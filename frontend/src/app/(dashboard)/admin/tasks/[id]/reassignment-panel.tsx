"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Executor { id: string; name: string; status: string }

export function ReassignmentPanel({ taskId, onChanged }: { taskId: string; onChanged: () => Promise<void> }) {
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [agentId, setAgentId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExecutors = useCallback(async () => {
    setLoading(true); setLoadFailed(false); setError(null);
    try {
      const all: Executor[] = [];
      for (let skip = 0; ; skip += 200) {
        const page = await apiGet<{ agents: Executor[]; total: number }>(`/v1/agents?status=active&skip=${skip}&limit=200`);
        all.push(...page.agents);
        if (page.agents.length < 200 || all.length >= page.total) break;
      }
      setExecutors(all.filter(agent => agent.status === "active"));
    } catch (cause) {
      setLoadFailed(true);
      setError(cause instanceof Error ? cause.message : "Executors could not be loaded.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadExecutors(); }, [loadExecutors]);

  async function reassign(event: FormEvent) {
    event.preventDefault();
    if (!agentId || !reason.trim() || busy) return;
    setBusy(true); setError(null);
    try {
      await apiPost(`/v1/tasks/${taskId}/reassign`, { agent_id: agentId, reason: reason.trim() });
      setAgentId(""); setReason("");
      await onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Reassignment failed. Your reason and selection have been kept.");
    } finally { setBusy(false); }
  }

  return (
    <section className="space-y-4 border-t border-ink-700 pt-5" aria-labelledby="reassignment-title">
      <h3 id="reassignment-title" className="font-semibold text-ink-50">Reassign blocked work</h3>
      <p className="text-sm text-ink-300">Choose an active executor and record why the assignment must change. The server checks funding, the accepted route and remaining budget; listing an executor does not guarantee eligibility. Recorded costs and the client’s quote are preserved.</p>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {loading ? <p className="text-sm text-ink-400">Loading active executors…</p> : loadFailed ? <Button variant="outline" onClick={loadExecutors}>Reload executors</Button> : executors.length === 0 ? <p className="text-sm text-ink-400">No active executors are available.</p> : <form onSubmit={reassign} className="space-y-4">
        <div className="space-y-2"><label htmlFor="replacement-executor" className="text-sm font-medium">Replacement executor</label><Select id="replacement-executor" value={agentId} onChange={event => setAgentId(event.target.value)} disabled={busy} required><option value="">Select an executor</option>{executors.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</Select></div>
        <div className="space-y-2"><label htmlFor="reassignment-reason" className="text-sm font-medium">Reason for reassignment</label><Textarea id="reassignment-reason" value={reason} onChange={event => setReason(event.target.value)} rows={3} required maxLength={2000} disabled={busy} /></div>
        <Button type="submit" disabled={busy || !agentId || !reason.trim()}>Reassign task</Button>
      </form>}
    </section>
  );
}
