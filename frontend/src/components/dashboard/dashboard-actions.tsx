"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Bot, Handshake, Loader2, UserRound } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { dashboardActionsCopy } from "@/lib/dashboard-actions-copy";
import { Button } from "@/components/ui/button";

const actionClass = "inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-semibold text-signal-700 underline-offset-4 hover:underline";

function ActionCard({ title, description, href, icon, children }: {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-ink-800 bg-white p-5 shadow-panel">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-ink-800 bg-paper text-signal-600" aria-hidden="true">{icon}</div>
      <h3 className="text-base font-semibold text-ink-50">{title}</h3>
      <p className="mb-4 mt-2 flex-1 text-sm leading-6 text-ink-400">{description}</p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <Link href={href} className={actionClass}>{title}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link>
        {children}
      </div>
    </article>
  );
}

export function DashboardActions({ role }: { role: "client" | "agent_developer" }) {
  const { locale } = useTranslation();
  const c = dashboardActionsCopy[locale];
  const isClient = role === "client";
  return (
    <section data-testid="dashboard-actions" aria-labelledby="dashboard-actions-title" className="space-y-4">
      <div>
        <h2 id="dashboard-actions-title" className="font-display text-xl font-medium text-ink-50">{isClient ? c.clientTitle : c.developerTitle}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-400">{isClient ? c.clientIntro : c.developerIntro}</p>
      </div>
      <div className={`grid gap-4 ${isClient ? "md:grid-cols-2" : "xl:grid-cols-3"}`}>
        {isClient ? <>
          <ActionCard title={c.aiProject} description={c.aiProjectBody} href="/client/jobs/new" icon={<Bot size={20} />} />
          <ActionCard title={c.humanRequest} description={c.humanRequestBody} href="/human-tasks?view=request" icon={<Handshake size={20} />} />
        </> : <>
          <ActionCard title={c.offerAgent} description={c.offerAgentBody} href="/developer/agents/new" icon={<Bot size={20} />}>
            <Link href="/developer/tasks" className={actionClass}>{c.browseAgentTasks}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link>
          </ActionCard>
          <ActionCard title={c.delegation} description={c.delegationBody} href="/human-tasks?view=agents" icon={<Handshake size={20} />} />
          <ActionCard title={c.humanWork} description={c.humanWorkBody} href="/human-tasks?view=work" icon={<UserRound size={20} />} />
        </>}
      </div>
    </section>
  );
}

interface HumanOverview {
  human_missions: number;
  pending_publication: number;
  active_human_missions: number;
  worker_profiles: number;
  pending_worker_verification: number;
}

function HumanOperations() {
  const { user } = useAuth();
  const { locale } = useTranslation();
  const c = dashboardActionsCopy[locale];
  const [data, setData] = useState<HumanOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setFailed(false);
    setData(null);
    try {
      const result = await apiGet<HumanOverview>("/v1/worker-portal/admin/overview", { signal });
      const keys: (keyof HumanOverview)[] = ["human_missions", "pending_publication", "active_human_missions", "worker_profiles", "pending_worker_verification"];
      if (!keys.every(key => Number.isSafeInteger(result?.[key]) && result[key] >= 0)) throw new Error("Invalid overview");
      if (!signal?.aborted) setData(result);
    } catch {
      if (!signal?.aborted) setFailed(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (user?.role !== "admin") return;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [user?.role, load]);
  if (user?.role !== "admin") return null;

  const metrics: { key: keyof HumanOverview; label: string }[] = [
    { key: "human_missions", label: c.humanMissions },
    { key: "pending_publication", label: c.pendingPublication },
    { key: "active_human_missions", label: c.activeHumanMissions },
    { key: "worker_profiles", label: c.workerProfiles },
    { key: "pending_worker_verification", label: c.pendingWorkerVerification },
  ];
  return (
    <section data-testid="human-operations" aria-labelledby="human-operations-title" className="min-w-0 rounded-xl border border-signal-500/30 bg-white p-5 shadow-panel">
      <h2 id="human-operations-title" className="flex items-center gap-2 text-lg font-semibold"><Handshake className="h-5 w-5 shrink-0 text-signal-600" aria-hidden="true" />{c.humanTasks}</h2>
      <p className="mt-2 text-sm leading-6 text-ink-400">{c.humanOperationsBody}</p>
      <div className="my-4" aria-live="polite" aria-busy={loading}>
        {loading ? <p role="status" className="flex items-center gap-2 text-sm text-ink-400"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{c.loading}</p>
          : failed ? <div role="alert" className="space-y-3"><p className="text-sm text-destructive">{c.loadError}</p><Button variant="outline" onClick={() => void load()}>{c.retry}</Button></div>
          : data && <>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              {metrics.map(metric => <div key={metric.key} className="min-w-0 border-l-2 border-ink-800 pl-3"><dt className="text-xs leading-5 text-ink-400">{metric.label}</dt><dd data-testid={metric.key} className="font-mono text-xl font-semibold text-ink-50">{new Intl.NumberFormat(locale).format(data[metric.key])}</dd></div>)}
            </dl>
            {data.human_missions === 0 && <p className="mt-3 text-sm text-ink-400">{c.noMissions}</p>}
          </>}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-ink-800 pt-2">
        <Link data-testid="review-human-missions" href="/human-tasks?view=review" className={actionClass}>{c.reviewHumanMissions}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link>
        <Link href="/human-tasks?view=review" className={actionClass}>{c.reviewWorkers}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link>
      </div>
    </section>
  );
}

export function AdminDashboardActions() {
  const { locale } = useTranslation();
  const c = dashboardActionsCopy[locale];
  return (
    <div data-testid="dashboard-actions" className="grid items-start gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <section data-testid="ai-operations" aria-labelledby="ai-operations-title" className="min-w-0 rounded-xl border border-ink-800 bg-white p-5 shadow-panel">
        <h2 id="ai-operations-title" className="flex items-center gap-2 text-lg font-semibold"><Bot className="h-5 w-5 shrink-0 text-signal-600" aria-hidden="true" />{c.aiOperations}</h2>
        <p className="my-2 text-sm leading-6 text-ink-400">{c.aiOperationsBody}</p>
        <div className="flex flex-col items-start">
          <Link href="/admin/jobs" className={actionClass}>{c.reviewAIJobs}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link>
          <Link href="/admin/tasks" className={actionClass}>{c.reviewAITasks}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link>
          <Link href="/admin/agents" className={actionClass}>{c.manageAIAgents}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link>
        </div>
      </section>
      <HumanOperations />
    </div>
  );
}
