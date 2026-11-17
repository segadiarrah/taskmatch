"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { humanCopy } from "@/lib/human-copy";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  LoadError,
  money,
  panel,
  requirement,
  safeError,
  StateTag,
  type Action,
  type Mission,
} from "./shared";
import { EvidenceField, EvidenceValue } from "./evidence-field";
import { WorkflowTools, FundingActions } from "./workflow-tools";
interface Submission {
  id: string;
  summary: string;
  output_json: Record<string, unknown>;
  status: string;
}
export function MissionDetail({
  id,
  role,
  busy,
  act,
  refresh,
  onChanged,
  onClose,
}: {
  id: string;
  role: string;
  busy: boolean;
  act: Action;
  refresh: number;
  onChanged: () => void;
  onClose: () => void;
}) {
  const { t, locale } = useTranslation();
  const c = humanCopy[locale];
  const [task, setTask] = useState<Mission | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  useEffect(() => {
    let current = true;
    setError("");
    setTask(null);
    Promise.all([
      apiGet<Mission>(`/v1/human-tasks/${id}`),
      apiGet<Submission[]>(`/v1/tasks/${id}/submissions`),
    ])
      .then(([mission, subs]) => {
        if (current) {
          setTask(mission);
          setSubmissions(subs);
        }
      })
      .catch((e) => {
        if (current) setError(safeError(e, c.error));
      });
    return () => {
      current = false;
    };
  }, [id, refresh, version, c.error]);
  if (error)
    return (
      <section className={panel}>
        <LoadError error={error} retry={() => setVersion((x) => x + 1)} />
        <Button variant="ghost" onClick={onClose}>
          {c.previous}
        </Button>
      </section>
    );
  if (!task) return <section className={panel}>{t("human.loading")}</section>;
  return (
    <section className={`${panel} space-y-6`} aria-label={task.title}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{task.title}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <StateTag
              value={task.policy_status === "pending" ? "pending" : task.status}
            />
            <span className="text-xs text-ink-400">
              {task.expected_duration} {t("human.duration")} ·{" "}
              {money(task.budget.amount_minor, "EUR", locale)}
            </span>
          </div>
        </div>
        <Button variant="ghost" onClick={onClose}>
          {c.previous}
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold">{t("human.objective")}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-400">
            {task.objective}
          </p>
          <h3 className="mt-5 text-sm font-semibold">
            {t("human.instructions")}
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-400">
            {task.instructions}
          </p>
        </div>
        <div className="space-y-4 rounded-lg bg-ink-950 p-5 text-sm">
          <p>
            <strong>{t("human.deadline")}</strong>
            <br />
            {new Date(task.deadline).toLocaleString(locale)}
          </p>
          {task.location && (
            <p>
              <strong>{c.address}</strong>
              <br />
              {[
                task.location.address,
                task.location.city,
                task.location.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          <div>
            <strong>{c.evidence}</strong>
            <ul className="mt-2 space-y-1 text-ink-400">
              {task.evidence_requirements.map((key) => (
                <li key={key}>{requirement(key, locale)}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>{c.permissions}</strong>
            <ul className="mt-2 space-y-1 text-ink-400">
              {task.authorizations.map((key) => (
                <li key={key}>{requirement(key, locale)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {task.policy_status === "pending" && (
        <p className="text-sm text-ink-400">{c.pendingReview}</p>
      )}
      {(task.actions?.can_edit_plan || task.actions?.can_amend) && <WorkflowTools task={task} busy={busy} act={act} onChanged={onChanged}/>}
      {task.actions?.can_fund && <FundingActions task={task} busy={busy} act={act} onChanged={onChanged}/>}
      {role === "admin" && task.policy_status === "pending" && (
        <form
          className="grid gap-4 border-t border-ink-800 pt-5"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void act(async () => {
              await apiPost(`/v1/human-tasks/${id}/publish`, {
                authorizations_verified: true,
                qualifications_verified: true,
                notes: f.get("notes"),
              });
              onChanged();
            });
          }}
        >
          <h3 className="font-semibold">{t("human.review")}</h3>
          <Field label={t("human.notes")}>
            <Textarea name="notes" required minLength={5} maxLength={2000} />
          </Field>
          <label className="flex items-start gap-3 text-sm">
            <input className="mt-1" type="checkbox" required />
            {t("human.checked")}
          </label>
          <Button className="justify-self-start" disabled={busy}>
            {t("human.publish")}
          </Button>
        </form>
      )}
      {task.actions?.can_submit && (
        <form
          className="grid gap-4 border-t border-ink-800 pt-5"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void act(async () => {
              await apiPost(`/v1/human-tasks/${id}/result`, {
                summary: f.get("summary"),
                evidence,
              });
              setEvidence({});
              onChanged();
            });
          }}
        >
          <Field label={t("human.summary")}>
            <Textarea name="summary" required minLength={5} maxLength={4000} />
          </Field>
          {task.evidence_requirements.map((key) => (
            <EvidenceField key={key} taskId={id} label={requirement(key, locale)}
              value={evidence[key] || ""} busy={busy}
              onChange={value => setEvidence(old => ({...old, [key]: value}))}/>
          ))}
          <Button className="justify-self-start" disabled={busy}>
            {t("human.submit")}
          </Button>
        </form>
      )}
      {submissions.map((s) => (
        <article className="space-y-4 border-t border-ink-800 pt-5" key={s.id}>
          <div className="flex flex-wrap justify-between gap-3">
            <h3 className="font-semibold">{s.summary}</h3>
            <StateTag value={s.status} />
          </div>
          {Object.entries(s.output_json).map(([key, value]) => (
            <div key={key}>
              <p className="text-sm font-medium">{requirement(key, locale)}</p>
              <EvidenceValue taskId={id} value={typeof value === "string" ? value : JSON.stringify(value)}/>
            </div>
          ))}
          {task.actions?.can_review &&
            ["submitted", "under_review"].includes(s.status) && (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const decision =
                    (e.nativeEvent as SubmitEvent).submitter?.getAttribute(
                      "value",
                    ) || "rework_requested";
                  void act(async () => {
                    await apiPost(`/v1/submissions/${s.id}/reviews`, {
                      submission_id: s.id,
                      decision,
                      notes: f.get("notes") || null,
                    });
                    onChanged();
                  });
                }}
              >
                <p className="text-xs text-ink-400">
                  {t("human.reviewNotice")}
                </p>
                <Field label={c.reviewComment}>
                  <Textarea name="notes" maxLength={4096} />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <Button value="approved" disabled={busy}>
                    {t("human.approve")}
                  </Button>
                  <Button
                    variant="outline"
                    value="rework_requested"
                    disabled={busy}
                  >
                    {t("human.rework")}
                  </Button>
                </div>
              </form>
            )}
        </article>
      ))}
      {task.actions?.can_accept && (
        <Button
          disabled={busy}
          onClick={() =>
            void act(async () => {
              await apiPost(`/v1/jobs/${task.parent_job_id}/accept`);
              onChanged();
            })
          }
        >
          {t("human.accept")}
        </Button>
      )}
    </section>
  );
}
