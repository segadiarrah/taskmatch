"use client";
import { DirectorySettings } from "@/components/dashboard/directory-settings";
import { useState, type FormEvent } from "react";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { humanCopy } from "@/lib/human-copy";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  countries,
  countryLabel,
  labelFor,
  panel,
  selectStyle,
  StateTag,
  type Action,
  type Category,
  type Worker,
} from "./shared";
export function WorkerProfile({
  worker,
  categories,
  busy,
  act,
  onSaved,
}: {
  worker: Worker | null;
  categories: Category[];
  busy: boolean;
  act: Action;
  onSaved: (p: Worker) => void;
}) {
  const { t, locale } = useTranslation();
  const c = humanCopy[locale];
  const [skills, setSkills] = useState<string[]>(worker?.skills || []);
  const [validation, setValidation] = useState("");
  const languages = [
    ["en", c.languageEn],
    ["fr", c.languageFr],
    ["es", c.languageEs],
    ["zh", c.languageZh],
    ["pt", c.languagePt],
  ];
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!skills.length) {
      setValidation(c.chooseSkill);
      return;
    }
    setValidation("");
    const f = new FormData(e.currentTarget);
    void act(async () => {
      const profile = await apiPut<Worker>("/v1/workers/me", {
        country: f.get("country"),
        languages: f.getAll("languages"),
        timezone: f.get("timezone"),
        service_area: f.get("service_area"),
        skills,
        desired_rate_minor: Math.round(Number(f.get("rate")) * 100),
        available: f.has("available"),
        data_consent: f.has("consent"),
      });
      onSaved(profile);
    });
  }
  const reasons: Record<string, string> = {
    payment_onboarding_required: c.payment_pending,
    identity_verification_required: c.identity_pending,
    attested_skills_required: c.skill_pending,
    skills_mismatch: c.skill_pending,
    consent_required: c.consent_pending,
    service_area_mismatch: c.area_pending,
    worker_profile_required: c.profile_pending,
    language_mismatch: c.language_pending,
    executor_unavailable: c.unavailable,
    unavailable: c.unavailable,
  };
  return (
    <section className={`${panel} space-y-6`}>
      <div>
        <h2 className="text-xl font-semibold">{t("human.profile")}</h2>
        <p className="mt-2 text-sm leading-6 text-ink-400">{t("human.free")}</p>
      </div>
      <form onSubmit={save} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={c.country}>
            <select
              name="country"
              defaultValue={worker?.country || "FR"}
              className={selectStyle}
            >
              {countries.map((code) => (
                <option key={code} value={code}>
                  {countryLabel(code, locale)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("human.timezone")}>
            <Input
              name="timezone"
              defaultValue={
                worker?.timezone ||
                Intl.DateTimeFormat().resolvedOptions().timeZone ||
                "Europe/Paris"
              }
              required
            />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-3 text-sm font-medium">{c.languages}</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            {languages.map(([code, label]) => (
              <label key={code} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="languages"
                  value={code}
                  defaultChecked={(worker?.languages || [locale]).includes(
                    code,
                  )}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-3 text-sm font-medium">{c.skills}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.map((category) => {
              const capabilities = category.required_capabilities || [
                category.id,
              ];
              return (
                <label
                  key={category.id}
                  className="flex items-start gap-2 rounded-lg border border-ink-800 p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={capabilities.every((v) => skills.includes(v))}
                    onChange={(e) =>
                      setSkills((old) =>
                        e.target.checked
                          ? Array.from(new Set([...old, ...capabilities]))
                          : old.filter((x) => !capabilities.includes(x)),
                      )
                    }
                  />
                  {labelFor(category, locale)}
                </label>
              );
            })}
          </div>
          {validation && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {validation}
            </p>
          )}
        </fieldset>
        <Field label={t("human.area")}>
          <Input
            name="service_area"
            defaultValue={worker?.service_area || ""}
            maxLength={500}
          />
        </Field>
        <Field label={t("human.rate")}>
          <Input
            name="rate"
            type="number"
            min={0}
            max={10000}
            step=".01"
            defaultValue={(worker?.desired_rate_minor || 0) / 100}
          />
        </Field>
        <label className="flex items-start gap-3 text-sm">
          <input
            name="available"
            type="checkbox"
            className="mt-1"
            defaultChecked={worker?.available ?? true}
          />
          {t("human.available")}
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input
            name="consent"
            type="checkbox"
            required
            className="mt-1"
            defaultChecked={worker?.data_consent ?? false}
          />
          {t("human.consent")}
        </label>
        <Button type="submit" disabled={busy}>
          {t("human.save")}
        </Button>
      </form>
      <details className="border-t border-ink-800 pt-5">
        <summary className="cursor-pointer text-sm font-semibold">
          {c.paymentDetails}
        </summary>
        <div className="mt-4 space-y-4">
          <p className="text-sm text-ink-400">{c.setupLater}</p>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>{c.verification}</span>
            <StateTag value={worker?.verification_status || "pending"} />
          </div>
          <p className="text-xs leading-5 text-ink-400">{c.independent}</p>
          {!!worker?.eligibility_reasons?.length && (
            <ul className="space-y-2 text-xs text-ink-400">
              {worker.eligibility_reasons.map((reason) => (
                <li key={reason}>{reasons[reason] || c.identity_pending}</li>
              ))}
            </ul>
          )}
          <p className="text-xs text-ink-400">
            {t(
              worker?.payment_eligible ? "human.eligible" : "human.notEligible",
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={busy || !worker}
              onClick={() =>
                void act(async () => {
                  const r = await apiPost<{ url: string }>(
                    "/v1/billing/connect/onboarding",
                    { country: worker?.country },
                  );
                  window.location.assign(r.url);
                })
              }
            >
              {t("human.payments")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy || !worker}
              onClick={() =>
                void act(async () => {
                  await apiPost("/v1/billing/connect/sync");
                  onSaved(await apiGet<Worker>("/v1/workers/me"));
                })
              }
            >
              {t("human.sync")}
            </Button>
          </div>
        </div>
      </details>
      {worker?.agent_id && <DirectorySettings key={worker.agent_id} agentId={worker.agent_id} />}
    </section>
  );
}
