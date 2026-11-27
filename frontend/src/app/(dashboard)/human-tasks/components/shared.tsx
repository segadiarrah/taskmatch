"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { QuotedAmounts } from "@/components/quote-fee-waiver";
import { apiGet } from "@/lib/api";
import { humanCopy, requirementCopy } from "@/lib/human-copy";
import { useTranslation, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
export interface Category {
  labels?: Record<string, string>;
  required_capabilities?: string[];
  id: string;
  execution_mode: "remote" | "physical" | "hybrid";
  evidence: string[];
  authorizations: string[];
}
export interface Mission {
  task_id: string;
  parent_job_id: string;
  title: string;
  objective: string;
  instructions: string;
  status: string;
  policy_status: string;
  task_category: string;
  execution_mode: string;
  expected_duration: number;
  deadline: string;
  location?: { country: string; city: string; address?: string };
  service_area?: string;
  principal_id: string;
  evidence_requirements: string[];
  authorizations: string[];
  budget: { amount_minor: number };
  quote?: QuotedAmounts | null;
  actions?: {
    can_submit: boolean;
    can_review: boolean;
    can_fund: boolean;
    can_accept: boolean;
    can_edit_plan?: boolean;
    can_amend?: boolean;
  };
}
export interface Worker {
  agent_id?: string;
  user_id: string;
  full_name?: string;
  country: string;
  languages: string[];
  timezone: string;
  skills: string[];
  attested_skills: string[];
  available: boolean;
  data_consent: boolean;
  service_area: string;
  desired_rate_minor: number;
  payment_eligible: boolean;
  verification_status: string;
  eligibility_reasons: string[];
}
export type Action = (action: () => Promise<void>) => Promise<void>;
export const panel = "rounded-xl border border-ink-800 bg-white p-5 sm:p-7";
export const selectStyle =
  "h-10 w-full min-w-0 rounded-lg border border-ink-700 bg-white px-3 text-sm";
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium text-ink-200">
      {label}
      {children}
    </label>
  );
}
export function labelFor(category: Category, locale: Locale) {
  return (
    category.labels?.[locale] ||
    category.labels?.en ||
    humanCopy[locale].category
  );
}
export const countries = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");
export function countryLabel(country: string, locale: Locale) {
  return (
    new Intl.DisplayNames([locale], { type: "region" }).of(country) || country
  );
}
export function requirement(key: string, locale: Locale) {
  return requirementCopy[locale][key] || humanCopy[locale].evidence;
}
export function money(minor: number, currency = "EUR", locale: Locale = "en") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    minor / 100,
  );
}
export function safeError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  return /stripe|api_key|secret|traceback|sqlalchemy/i.test(message)
    ? fallback
    : message;
}
export function StateTag({ value }: { value: string }) {
  const { locale } = useTranslation();
  const c = humanCopy[locale];
  const labels: Record<string, string> = {
    assigned: c.assigned,
    in_progress: c.inProgress,
    submitted: c.submitted,
    under_review: c.submitted,
    validation_failed: c.rework,
    rework_requested: c.rework,
    completed: c.completed,
    cancelled: c.cancelled,
    releasable: c.waiting,
    processing: c.waiting,
    authorized: c.waiting,
    failed: c.rejected,
    blocked: c.rejected,
    pending: c.pending,
    approved: c.verified,
    verified: c.verified,
    rejected: c.rejected,
    open_for_bids: c.ready,
    paid: c.paid,
    pending_payment: c.waiting,
    active: c.active,
    expired: c.expired,
    revoked: c.revoked,
  };
  return (
    <span className="inline-flex rounded-full border border-ink-800 bg-ink-950 px-2.5 py-1 text-xs text-ink-300">
      {labels[value] || c.unknownStatus}
    </span>
  );
}
export function Pagination({
  skip,
  total,
  limit = 12,
  onPage,
  busy = false,
}: {
  skip: number;
  total: number;
  limit?: number;
  onPage: (skip: number) => void;
  busy?: boolean;
}) {
  const { locale } = useTranslation();
  const c = humanCopy[locale];
  if (total <= limit) return null;
  return (
    <nav
      aria-label={c.page}
      className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink-800 pt-4 text-xs text-ink-400"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || skip === 0}
        onClick={() => onPage(Math.max(0, skip - limit))}
      >
        {c.previousPage}
      </Button>
      <span>
        {c.page} {Math.floor(skip / limit) + 1} {c.of}{" "}
        {Math.ceil(total / limit)}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || skip + limit >= total}
        onClick={() => onPage(skip + limit)}
      >
        {c.nextPage}
      </Button>
    </nav>
  );
}
export function usePage<T>(path: string, refresh = 0) {
  const { locale } = useTranslation();
  const [skip, setSkip] = useState(0);
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => setVersion((x) => x + 1), []);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    apiGet<{ items: T[]; total?: number }>(
      `${path}${path.includes("?") ? "&" : "?"}skip=${skip}&limit=12`,
    )
      .then((r) => {
        if (current) {
          setItems(r.items);
          setTotal(
            r.total ?? skip + r.items.length + (r.items.length === 12 ? 1 : 0),
          );
        }
      })
      .catch((e) => {
        if (current) setError(safeError(e, humanCopy[locale].error));
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [path, skip, refresh, version, locale]);
  return { items, total, skip, setSkip, loading, error, retry };
}
export function LoadError({
  error,
  retry,
}: {
  error: string;
  retry: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <p>{error}</p>
      <Button variant="outline" onClick={retry}>
        {t("human.retry")}
      </Button>
    </div>
  );
}
export function MissionList({
  view,
  refresh,
  onOpen,
}: {
  view: "request" | "work" | "review";
  refresh: number;
  onOpen: (id: string) => void;
}) {
  const { t, locale } = useTranslation();
  const c = humanCopy[locale];
  const data = usePage<Mission>(
    `/v1/worker-portal/missions?view=${view}`,
    refresh,
  );
  return (
    <section className={panel}>
      <h2 className="text-xl font-semibold">
        {view === "review"
          ? c.reviewMissions
          : view === "work"
            ? c.myWork
            : t("human.mine")}
      </h2>
      {data.error ? (
        <LoadError error={data.error} retry={data.retry} />
      ) : data.loading ? (
        <p className="mt-5 text-sm text-ink-400">{t("human.loading")}</p>
      ) : !data.items.length ? (
        <p className="mt-5 text-sm leading-6 text-ink-400">
          {view === "work" ? c.emptyWork : t("human.empty")}
        </p>
      ) : (
        <div className="mt-2 divide-y divide-ink-800">
          {data.items.map((m) => (
            <button
              key={m.task_id}
              onClick={() => onOpen(m.task_id)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="min-w-0 font-medium">{m.title}</span>
              <StateTag
                value={m.policy_status === "pending" ? "pending" : m.status}
              />
            </button>
          ))}
        </div>
      )}
      <Pagination {...data} onPage={data.setSkip} busy={data.loading} />
    </section>
  );
}
