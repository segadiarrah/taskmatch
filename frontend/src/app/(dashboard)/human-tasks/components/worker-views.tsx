"use client";
import { apiPost } from "@/lib/api";
import { humanCopy } from "@/lib/human-copy";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  labelFor,
  LoadError,
  money,
  Pagination,
  panel,
  StateTag,
  usePage,
  type Action,
  type Category,
  type Worker,
} from "./shared";
interface Opportunity {
  task_id: string;
  title: string;
  objective: string;
  worker_amount_minor: number;
  expected_duration: number;
  execution_mode: "remote" | "physical" | "hybrid";
  deadline: string;
  task_category: string;
}
export function Opportunities({
  worker,
  busy,
  act,
  onClaim,
  refresh,
}: {
  worker: Worker | null;
  busy: boolean;
  act: Action;
  onClaim: (id: string) => Promise<void>;
  refresh: number;
}) {
  const { t, locale } = useTranslation();
  const c = humanCopy[locale];
  const data = usePage<Opportunity>("/v1/worker-portal/opportunities", refresh);
  return (
    <section className={panel}>
      <h2 className="text-xl font-semibold">{t("human.opportunities")}</h2>
      {!worker?.payment_eligible && (
        <p className="mt-3 rounded-lg bg-ink-950 p-4 text-sm leading-6 text-ink-400">
          {worker ? t("human.notEligible") : c.profileNeeded}
        </p>
      )}
      {data.error ? (
        <LoadError error={data.error} retry={data.retry} />
      ) : data.loading ? (
        <p className="mt-5 text-sm text-ink-400">{t("human.loading")}</p>
      ) : !data.items.length ? (
        <p className="mt-5 text-sm text-ink-400">{t("human.empty")}</p>
      ) : (
        <div className="divide-y divide-ink-800">
          {data.items.map((o) => (
            <article className="space-y-3 py-5" key={o.task_id}>
              <div className="flex justify-between gap-4">
                <h3 className="font-medium">{o.title}</h3>
                <span className="shrink-0 font-mono text-signal-700">
                  {money(o.worker_amount_minor, "EUR", locale)}
                </span>
              </div>
              <p className="text-sm leading-6 text-ink-400">{o.objective}</p>
              <p className="text-xs text-ink-400">
                {o.expected_duration} {t("human.duration")} ·{" "}
                {c[o.execution_mode] || c.remote}
              </p>
              <Button
                disabled={busy || !worker?.payment_eligible}
                onClick={() =>
                  void act(async () => {
                    await apiPost(`/v1/human-tasks/${o.task_id}/claim`);
                    await onClaim(o.task_id);
                  })
                }
              >
                {t("human.claim")}
              </Button>
            </article>
          ))}
        </div>
      )}
      <Pagination {...data} onPage={data.setSkip} busy={data.loading} />
    </section>
  );
}
interface Earnings {
  id: string;
  task_title: string;
  net_amount_minor: number;
  currency: string;
  status: string;
  created_at: string;
}
export function EarningsView({ refresh }: { refresh: number }) {
  const { t, locale } = useTranslation();
  const c = humanCopy[locale];
  const data = usePage<Earnings>("/v1/worker-portal/earnings", refresh);
  return (
    <section className={panel}>
      <h2 className="text-xl font-semibold">{c.earnings}</h2>
      {data.error ? (
        <LoadError error={data.error} retry={data.retry} />
      ) : data.loading ? (
        <p className="mt-5 text-sm">{t("human.loading")}</p>
      ) : !data.items.length ? (
        <p className="mt-5 text-sm leading-6 text-ink-400">{c.emptyEarnings}</p>
      ) : (
        <div className="mt-4 divide-y divide-ink-800">
          {data.items.map((e) => (
            <article
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 py-5"
            >
              <div>
                <h3 className="font-medium">{e.task_title}</h3>
                <p className="mt-2 text-xs text-ink-400">
                  {new Date(e.created_at).toLocaleDateString(locale)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <strong className="font-mono text-signal-700">
                  {money(e.net_amount_minor, e.currency, locale)}
                </strong>
                <StateTag value={e.status} />
              </div>
            </article>
          ))}
        </div>
      )}
      <Pagination {...data} onPage={data.setSkip} busy={data.loading} />
    </section>
  );
}
export function WorkerReviews({
  categories,
  userId,
  busy,
  act,
  refresh,
  onSaved,
}: {
  categories: Category[];
  userId: string;
  busy: boolean;
  act: Action;
  refresh: number;
  onSaved: () => void;
}) {
  const { t, locale } = useTranslation();
  const c = humanCopy[locale];
  const data = usePage<Worker>("/v1/worker-portal/workers", refresh);
  return (
    <section className={panel}>
      <h2 className="text-xl font-semibold">{c.reviewWorkers}</h2>
      <p className="mt-3 text-sm leading-6 text-ink-400">{c.independent}</p>
      {data.error ? (
        <LoadError error={data.error} retry={data.retry} />
      ) : data.loading ? (
        <p className="mt-5 text-sm">{t("human.loading")}</p>
      ) : !data.items.length ? (
        <p className="mt-5 text-sm text-ink-400">{c.noWorkers}</p>
      ) : (
        <div className="mt-5 space-y-6">
          {data.items.map((w) => (
            <form
              key={`${w.user_id}-${w.verification_status}-${refresh}`}
              className="space-y-4 border-t border-ink-800 pt-5"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const decision =
                  (e.nativeEvent as SubmitEvent).submitter?.getAttribute(
                    "value",
                  ) || "verified";
                void act(async () => {
                  await apiPost(`/v1/workers/${w.user_id}/verify`, {
                    verification_status: decision,
                    attested_skills:
                      decision === "verified"
                        ? Array.from(new Set(f.getAll("attested").map(String)))
                        : [],
                    notes: f.get("notes"),
                  });
                  onSaved();
                });
              }}
            >
              <div className="flex justify-between gap-3">
                <h3 className="font-semibold">{w.full_name}</h3>
                <StateTag value={w.verification_status} />
              </div>
              <p className="text-xs text-ink-400">
                {w.country} · {w.languages.join(", ")}
              </p>
              <fieldset>
                <legend className="mb-3 text-sm font-medium">{c.skills}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {categories
                    .filter((x) =>
                      (x.required_capabilities || [x.id]).some((v) =>
                        w.skills.includes(v),
                      ),
                    )
                    .map((category) => (
                      <label
                        key={category.id}
                        className="flex items-start gap-3 text-sm"
                      >
                        <input
                          className="mt-1"
                          type="checkbox"
                          name="attested"
                          value={
                            (category.required_capabilities || [category.id])[0]
                          }
                          defaultChecked={(
                            category.required_capabilities || [category.id]
                          ).every((v) => w.attested_skills.includes(v))}
                        />
                        {labelFor(category, locale)}
                      </label>
                    ))}
                </div>
              </fieldset>
              <Field label={c.verificationNotes}>
                <Textarea
                  name="notes"
                  required
                  minLength={5}
                  maxLength={2000}
                />
              </Field>
              <div className="flex flex-wrap gap-3">
                <Button
                  value="verified"
                  type="submit"
                  disabled={busy || w.user_id === userId}
                >
                  {c.verifyWorker}
                </Button>
                <Button
                  value="rejected"
                  type="submit"
                  variant="outline"
                  disabled={busy || w.user_id === userId}
                >
                  {c.rejectWorker}
                </Button>
              </div>
            </form>
          ))}
        </div>
      )}
      <Pagination {...data} onPage={data.setSkip} busy={data.loading} />
    </section>
  );
}
