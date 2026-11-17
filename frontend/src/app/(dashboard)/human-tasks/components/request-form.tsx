"use client";
import { useRef, useState, type FormEvent } from "react";
import { apiPost } from "@/lib/api";
import { humanCopy } from "@/lib/human-copy";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  countries,
  countryLabel,
  labelFor,
  panel,
  requirement,
  selectStyle,
  type Action,
  type Category,
} from "./shared";
export function RequestForm({
  categories,
  name,
  busy,
  act,
  onSaved,
  parentJobId,
  amendmentJobId,
  principalId,
}: {
  categories: Category[];
  name: string;
  busy: boolean;
  act: Action;
  onSaved: () => void;
  parentJobId?: string;
  amendmentJobId?: string;
  principalId?: string;
}) {
  const { t, locale } = useTranslation();
  const c = humanCopy[locale];
  const [step, setStep] = useState(0);
  const [categoryId, setCategoryId] = useState(
    categories.find((x) => x.id === "translation_review")?.id ||
      categories[0]?.id ||
      "",
  );
  const category = categories.find((x) => x.id === categoryId);
  const formRef = useRef<HTMLFormElement>(null);
  const key = useRef<{ body: string; key: string } | null>(null);
  function next() {
    const fields = formRef.current?.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >(
      `[data-step="${step}"] input,[data-step="${step}"] textarea,[data-step="${step}"] select`,
    );
    if (fields && Array.from(fields).some((f) => !f.reportValidity())) return;
    setStep((x) => Math.min(2, x + 1));
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < 2) {
      next();
      return;
    }
    const visibleFields = formRef.current?.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>('[data-step="2"] input,[data-step="2"] textarea,[data-step="2"] select');
    if (visibleFields && Array.from(visibleFields).some(field=>!field.reportValidity())) return;
    const form = new FormData(e.currentTarget);
    void act(async () => {
      if (!category) throw new Error(c.error);
      const p = principalId ? {id:principalId} : await apiPost<{ id: string }>("/v1/principals", {
        kind: "individual",
        display_name: name,
      });
      const body = {
        ...(parentJobId ? {parent_job_id:parentJobId} : {}),
        schema_version: "tm.human-task.v1",
        principal_id: p.id,
        requester_type: "HUMAN_REQUESTER",
        title: form.get("title"),
        objective: form.get("objective"),
        instructions: form.get("instructions"),
        task_category: category.id,
        execution_mode: category.execution_mode,
        required_capabilities: category.required_capabilities || [category.id],
        language: form.get("language"),
        deadline: new Date(String(form.get("deadline"))).toISOString(),
        expected_duration: Number(form.get("duration")),
        budget: {
          amount_minor: Math.round(Number(form.get("budget")) * 100),
          currency: "EUR",
        },
        evidence_requirements: category.evidence,
        authorizations: category.authorizations,
        ...(category.execution_mode !== "remote"
          ? {
              location: {
                country: form.get("country"),
                city: form.get("city"),
                address: form.get("address") || null,
              },
              service_area: form.get("service_area") || null,
            }
          : {}),
      };
      const serialized = JSON.stringify(body);
      if (key.current?.body !== serialized)
        key.current = { body: serialized, key: crypto.randomUUID() };
      await apiPost(amendmentJobId ? `/v1/jobs/${amendmentJobId}/amendments` : "/v1/human-tasks", body, {
        headers: { "Idempotency-Key": key.current!.key },
      });
      key.current = null;
      formRef.current?.reset();
      setStep(0);
      onSaved();
    });
  }
  if (!category) return null;
  return (
    <form noValidate ref={formRef} onSubmit={submit} className={`${panel} space-y-6`}>
      <div>
        <h2 className="text-xl font-semibold">{c.request}</h2>
        <ol className="mt-5 flex gap-2" aria-label={c.request}>
          {[c.brief, c.details, c.price].map((label, i) => (
            <li
              key={label}
              className={`flex-1 border-t-2 pt-3 text-xs ${i === step ? "border-signal-600 font-semibold text-signal-700" : "border-ink-800 text-ink-400"}`}
              aria-current={i === step ? "step" : undefined}
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>
      </div>
      <div data-step="0" hidden={step !== 0} className="space-y-5">
        <Field label={t("human.titleField")}>
          <Input name="title" required minLength={3} maxLength={512} />
        </Field>
        <Field label={t("human.objective")}>
          <Textarea name="objective" required minLength={5} maxLength={4000} />
        </Field>
        <Field label={c.category}>
          <select
            name="category"
            className={selectStyle}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((x) => (
              <option key={x.id} value={x.id}>
                {labelFor(x, locale)}
              </option>
            ))}
          </select>
        </Field>
        <p className="rounded-lg bg-ink-950 px-4 py-3 text-sm text-ink-400">
          {c.mode}:{" "}
          <strong className="text-ink-200">{c[category.execution_mode]}</strong>
        </p>
      </div>
      <div data-step="1" hidden={step !== 1} className="space-y-5">
        <Field label={t("human.instructions")}>
          <Textarea
            name="instructions"
            required
            minLength={5}
            maxLength={16000}
          />
        </Field>
        {category.execution_mode !== "remote" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={c.country}>
                <select
                  name="country"
                  className={selectStyle}
                  defaultValue="FR"
                >
                  {countries.map((code) => (
                    <option key={code} value={code}>
                      {countryLabel(code, locale)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={c.city}>
                <Input name="city" required maxLength={120} />
              </Field>
            </div>
            <Field label={c.address}>
              <Input name="address" maxLength={500} />
            </Field>
            <Field label={t("human.area")}>
              <Input name="service_area" maxLength={500} />
            </Field>
          </>
        )}
        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-semibold">
            {c.permissions}
          </legend>
          <p className="text-xs leading-5 text-ink-400">{c.permissionNote}</p>
          {category.authorizations.map((a) => (
            <label key={a} className="flex items-start gap-3 text-sm">
              <input type="checkbox" required className="mt-1" />
              {requirement(a, locale)}
            </label>
          ))}
        </fieldset>
        <div className="rounded-lg border border-ink-800 p-4">
          <h3 className="text-sm font-semibold">{c.evidence}</h3>
          <ul className="mt-2 space-y-1 text-sm text-ink-400">
            {category.evidence.map((e) => (
              <li key={e}>{requirement(e, locale)}</li>
            ))}
          </ul>
        </div>
      </div>
      <div data-step="2" hidden={step !== 2} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("human.language")}>
            <select
              name="language"
              className={selectStyle}
              defaultValue={locale}
            >
              {[
                ["en", c.languageEn],
                ["fr", c.languageFr],
                ["es", c.languageEs],
                ["zh", c.languageZh],
    ["pt", c.languagePt],
              ].map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={c.duration}>
            <Input
              name="duration"
              type="number"
              min={5}
              max={43200}
              defaultValue={30}
              required
            />
          </Field>
        </div>
        <Field label={t("human.budget")}>
          <Input
            name="budget"
            type="number"
            min="1.10"
            max="1000000"
            step="0.01"
            defaultValue="11"
            required
          />
        </Field>
        <Field label={t("human.deadline")}>
          <Input name="deadline" type="datetime-local" required />
        </Field>
        <p className="text-xs leading-5 text-ink-400">{t("human.pending")}</p>
      </div>
      <div className="flex justify-between gap-3">
        {step > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((x) => x - 1)}
          >
            {c.previous}
          </Button>
        ) : (
          <span />
        )}
        {step < 2 ? (
          <Button type="submit" disabled={busy}>
            {c.next}
          </Button>
        ) : (
          <Button type="submit" disabled={busy}>
            {busy ? c.busy : t("human.create")}
          </Button>
        )}
      </div>
    </form>
  );
}
