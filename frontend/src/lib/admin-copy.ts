"use client";

import { useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import { adminCopy } from "@/i18n/admin/copy";
import { ApiError } from "@/lib/api";

export type AdminCopyKey = keyof typeof adminCopy.en;

/** Mark a catalogue key stored for later translation, without freezing its current locale. */
export function adminSource<K extends AdminCopyKey>(key: K): K { return key; }

/** Keep structured server reasons available to the administrator's locale-aware renderer. */
export function adminError(cause: unknown, fallback: AdminCopyKey): string {
  if (cause instanceof ApiError) {
    const body = cause.body;
    if (body && typeof body === "object" && "detail" in body && typeof body.detail === "string") return body.detail;
    return fallback;
  }
  return cause instanceof Error ? cause.message : fallback;
}

type Parameters = Record<string, string | number>;
type AdminLocale = keyof typeof adminCopy;
const intlLocales: Record<AdminLocale, string> = { en: "en-GB", fr: "fr-FR", zh: "zh-CN", es: "es-ES", pt: "pt-BR" };
const statusAliases: Record<string, string> = {
  ai: adminSource("AI"), llm: adminSource("AI"), mcp: adminSource("MCP"), platform: adminSource("Platform revenue"), platform_revenue: adminSource("Platform revenue"),
  rework_requested: adminSource("Rework Requested"), formatting: adminSource("Formatting"), decompose: adminSource("Decompose"),
  decomposition: adminSource("Decompose"), matching: adminSource("Match"), ranking: adminSource("Rank Bids"), validation: adminSource("Validate"),
  format: adminSource("Format"), match: adminSource("Match"), assign: adminSource("Assign"), flag: adminSource("Flag"), validate: adminSource("Validate"),
  task_reassigned: adminSource("Reassigned"), pending_validation: adminSource("Pending Validation"),
  task_retry_requested: adminSource("Retry task"), task_historical_recovery_approved: adminSource("Recover historical task"),
  ml: adminSource("Machine Learning"), api_design: adminSource("API Design"), devops: adminSource("DevOps"),
  react: adminSource("React"), nextjs: adminSource("Next.js"), nodejs: adminSource("Node.js"), python: adminSource("Python"), typescript: adminSource("TypeScript"), postgresql: adminSource("PostgreSQL"), aws: adminSource("AWS"), docker: adminSource("Docker"),

};

const resourceNotFound: Record<string, AdminCopyKey> = {
  Agent: adminSource("Agent not found."), Task: adminSource("Task not found."),
  Job: adminSource("Job not found."), Submission: adminSource("Submission not found."),
};

function validDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

/** Translate only platform-owned copy; unknown server details and user content remain intact. */
export function useAdminCopy() {
  const { locale } = useTranslation();
  return useMemo(() => {
    const dict: Record<string, string> = adminCopy[locale as AdminLocale];
    const language = intlLocales[locale as AdminLocale];
    const a = (key: string, parameters?: Parameters): string => {
      // Backend prose is translated only when it matches a known platform template.
      // Identifiers, user notes and unknown diagnostic details are preserved.
      if (!(key in dict)) {
        const notFound = /^(Agent|Task|Job|Submission) not found$/.exec(key);
        if (notFound) return a(resourceNotFound[notFound[1]]);
        const requestFailure = /^Request failed: (\d+)$/.exec(key);
        if (requestFailure) return a("Request failed: {status}", { status: requestFailure[1] });
        const unavailableModel = /^Unavailable or unpriced model: (.+)$/.exec(key);
        if (unavailableModel) return a("Unavailable or unpriced model: {model}", { model: unavailableModel[1] });
        const unverifiedRate = /^No verified model rate for (.+)$/.exec(key);
        if (unverifiedRate) return a("No verified model rate for {model}", { model: unverifiedRate[1] });
        const taskType = /^Supports task type '([^']+)'$/.exec(key);
        if (taskType) return a("Supports task type '{type}'", { type: formatStatus(taskType[1]) });
        const history = /^Completed (\d+) tasks with (\d+)% success rate$/.exec(key);
        if (history) return a("Completed {count} tasks with {rate} success rate", { count: formatNumber(history[1]), rate: formatPercent(Number(history[2]) / 100) });
        const taskState = /^Task is in '([^']+)' status and (cannot be assigned|cannot accept submissions)$/.exec(key);
        if (taskState) return a(`Task is in '{status}' status and ${taskState[2]}`, { status: formatStatus(taskState[1]) });
        const paymentState = /^Payment is in '([^']+)' status and cannot be released$/.exec(key);
        if (paymentState) return a("Payment is in '{status}' status and cannot be released", { status: formatStatus(paymentState[1]) });
        const completeState = /^Payment must be in 'releasable' status to be completed; current status is '([^']+)'$/.exec(key);
        if (completeState) return a("Payment must be in 'releasable' status to be completed; current status is '{status}'", { status: formatStatus(completeState[1]) });
        const outputField = /^Missing required output field: '([^']+)' not found in output_json$/.exec(key);
        if (outputField) return a("Missing required output field: '{field}' not found in output_json", { field: outputField[1] });
        if (key.startsWith("MCP automated validation. Issues: ")) return a("MCP automated validation. Issues: {issues}", { issues: key.slice(34).split("; ").map(issue => a(issue)).join("; ") });
        if (key.startsWith("output_field:")) return a("Required output field: {field}", { field: key.slice(13) });
      }
      const singularKeys: Record<string, string> = { "{count} payments": adminSource("{count} payment"), "{count} decisions": adminSource("{count} decision"), "{count} tasks": adminSource("{count} task"), "{count} attempts": adminSource("{count} attempt"), "{count} approved submissions": adminSource("{count} approved submission") };
      const selected = typeof parameters?.count === "number" && new Intl.PluralRules(language).select(parameters.count) === "one" ? singularKeys[key] ?? key : key;
      const text = dict[selected] ?? key;
      return text.replace(/\{(\w+)\}/g, (token, name: string) => {
        const value = parameters?.[name];
        return value === undefined ? token : typeof value === "number" ? formatNumber(value) : value;
      });
    };
    const formatNumber = (value: number | string, digits?: number) => new Intl.NumberFormat(language, digits === undefined ? {} : { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value));
    const formatPercent = (value: number, digits = 0) => new Intl.NumberFormat(language, { style: "percent", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
    const formatCurrency = (amount: number, currency = "EUR") => new Intl.NumberFormat(language, { style: "currency", currency: currency || "EUR", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
    const formatMinor = (amount: number, currency: string) => new Intl.NumberFormat(language, { style: "currency", currency }).format(amount / 100);
    const formatDate = (value: string | Date | null | undefined) => {
      const parsed = validDate(value);
      return parsed ? new Intl.DateTimeFormat(language, { year: "numeric", month: "short", day: "numeric" }).format(parsed) : "—";
    };
    const formatDateTime = (value: string | Date | null | undefined) => {
      const parsed = validDate(value);
      return parsed ? new Intl.DateTimeFormat(language, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(parsed) : "—";
    };
    const timeAgo = (value: string | Date | null | undefined) => {
      const parsed = validDate(value);
      if (!parsed) return "—";
      const seconds = (parsed.getTime() - Date.now()) / 1000;
      const relative = new Intl.RelativeTimeFormat(language, { numeric: "auto" });
      if (Math.abs(seconds) < 60) return relative.format(0, "second");
      if (Math.abs(seconds) < 3600) return relative.format(Math.trunc(seconds / 60), "minute");
      if (Math.abs(seconds) < 86400) return relative.format(Math.trunc(seconds / 3600), "hour");
      if (Math.abs(seconds) < 604800) return relative.format(Math.trunc(seconds / 86400), "day");
      return formatDate(parsed);
    };
    const formatStatus = (value: string) => {
      const normalized = value.toLowerCase().replace(/[. -]/g, "_");
      const title = statusAliases[normalized] ?? normalized.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
      return a(title);
    };
    return { a, formatStatus, formatDate, formatDateTime, formatCurrency, formatMinor, formatNumber, formatPercent, timeAgo };
  }, [locale]);
}
