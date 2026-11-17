"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Handshake, CheckCircle2 } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { humanCopy } from "@/lib/human-copy";
import { Button } from "@/components/ui/button";
import { AgentsPanel } from "./components/agents-panel";
import { MissionDetail } from "./components/mission-detail";
import { RequestForm } from "./components/request-form";
import { WorkerProfile } from "./components/worker-profile";
import {
  EarningsView,
  Opportunities,
  WorkerReviews,
} from "./components/worker-views";
import {
  LoadError,
  MissionList,
  safeError,
  type Category,
  type Worker,
} from "./components/shared";
type View = "request" | "work" | "earnings" | "agents" | "review";
function HumanTasksContent() {
  const searchParams=useSearchParams();
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const c = humanCopy[locale];
  const [view, setView] = useState<View>("request");
  const [categories, setCategories] = useState<Category[]>([]);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const v = searchParams.get("view");
    if (["request", "work", "earnings", "agents", "review"].includes(v || ""))
      setView(v as View);
    setSelected(null);
  }, [searchParams]);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [taxonomy, profile] = await Promise.all([
        apiGet<{ categories: Category[] }>("/v1/human-tasks/taxonomy"),
        apiGet<Worker | null>("/v1/workers/me"),
      ]);
      setCategories(taxonomy.categories);
      setWorker(profile);
    } catch (e) {
      setError(safeError(e, c.error));
    } finally {
      setLoading(false);
    }
  }, [c.error]);
  useEffect(() => {
    void load();
  }, [load]);
  const changed = () => setRefresh((x) => x + 1);
  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(t("human.saved"));
    } catch (e) {
      setError(safeError(e, c.error));
    } finally {
      setBusy(false);
    }
  }
  function navigate(v: View) {
    setView(v);
    setSelected(null);
    setNotice("");
    window.history.replaceState(null, "", `/human-tasks?view=${v}`);
  }
  const views: { id: View; label: string }[] = [
    { id: "request", label: c.request },
    { id: "work", label: c.work },
    { id: "earnings", label: c.earnings },
    { id: "agents", label: c.agents },
    ...(user?.role === "admin" ? [{ id: "review" as const, label: c.review }] : []),
  ];
  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 pb-10">
      <header className="border-b border-ink-800 pb-6">
        <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-signal-600">
          <Handshake size={18} />
          TaskMatch
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {c.workspace}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-400">{c.intro}</p>
        <p className="mt-1 text-xs leading-5 text-ink-500">{c.personal}</p>
      </header>
      <nav className="flex flex-wrap gap-2" aria-label={c.workspace}>
        {views.map((v) => (
          <Button
            key={v.id}
            type="button"
            aria-current={view === v.id ? "page" : undefined}
            variant={view === v.id ? "default" : "outline"}
            onClick={() => navigate(v.id)}
          >
            {v.label}
          </Button>
        ))}
      </nav>
      {error && <LoadError error={error} retry={() => void load()} />}
      <div role="status" aria-live="polite">
        {notice && (
          <p className="flex items-center gap-2 text-sm text-signal-700">
            <CheckCircle2 size={16} />
            {notice}
          </p>
        )}
      </div>
      {loading ? (
        <p className="text-sm text-ink-400">{t("human.loading")}</p>
      ) : (
        <>
          {selected && (
            <MissionDetail
              id={selected}
              role={user?.role || ""}
              busy={busy}
              act={act}
              refresh={refresh}
              onChanged={changed}
              onClose={() => setSelected(null)}
            />
          )}
          {view === "request" && (
            <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
              <RequestForm
                categories={categories}
                name={user?.full_name || "TaskMatch"}
                busy={busy}
                act={act}
                onSaved={changed}
              />
              <MissionList
                view="request"
                refresh={refresh}
                onOpen={setSelected}
              />
            </div>
          )}
          {view === "work" && (
            <div className="grid items-start gap-6 xl:grid-cols-[1.1fr_1fr]">
              <WorkerProfile
                worker={worker}
                categories={categories}
                busy={busy}
                act={act}
                onSaved={(p) => {
                  setWorker(p);
                  changed();
                }}
              />
              <div className="space-y-6">
                <Opportunities
                  worker={worker}
                  busy={busy}
                  act={act}
                  refresh={refresh}
                  onClaim={async (id) => {
                    changed();
                    setSelected(id);
                  }}
                />
                <MissionList
                  view="work"
                  refresh={refresh}
                  onOpen={setSelected}
                />
              </div>
            </div>
          )}
          {view === "earnings" && <EarningsView refresh={refresh} />}
          {view === "agents" && (
            <AgentsPanel
              categories={categories}
              name={user?.full_name || "TaskMatch"}
              busy={busy}
              act={act}
            />
          )}
          {view === "review" && user?.role === "admin" && (
            <div className="grid items-start gap-6 lg:grid-cols-2">
              <MissionList
                view="review"
                refresh={refresh}
                onOpen={setSelected}
              />
              <WorkerReviews
                categories={categories}
                userId={user.id}
                busy={busy}
                act={act}
                refresh={refresh}
                onSaved={changed}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function HumanTasksLoading() {const {t}=useTranslation();return <p>{t("human.loading")}</p>;}
export default function HumanTasksPage() {return <Suspense fallback={<HumanTasksLoading/>}><HumanTasksContent/></Suspense>;}
