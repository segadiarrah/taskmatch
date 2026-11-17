import { clsx, type ClassValue } from "clsx";
import { displayCopy } from "@/lib/display-copy";
import type { Locale } from "@/lib/locales";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "EUR", locale: Locale = "en"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function validDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  const parsed = typeof date === "string" ? new Date(date) : date;
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export function formatDate(date: string | Date | null | undefined, locale: Locale = "en"): string {
  const d = validDate(date);
  if (!d) return "—";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatStatus(status: string, locale: Locale = "en"): string {
  const labels: Record<string, string> = displayCopy[locale];
  return labels[status] ?? (locale === "en" ? status.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase()) : `${labels.unknown} (${status})`);
}

export function formatDateTime(date: string | Date | null | undefined, locale: Locale = "en"): string {
  const d = validDate(date);
  if (!d) return "—";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function timeAgo(date: string | Date | null | undefined, locale: Locale = "en"): string {
  const d = validDate(date);
  if (!d) return "—";
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (Math.abs(seconds) < 60) return displayCopy[locale].now;
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(seconds) < 3600) return relative.format(-Math.floor(seconds / 60), "minute");
  if (Math.abs(seconds) < 86400) return relative.format(-Math.floor(seconds / 3600), "hour");
  if (Math.abs(seconds) < 604800) return relative.format(-Math.floor(seconds / 86400), "day");
  return formatDate(date, locale);
}

/** These six descriptions come from the delivery API; user-provided text stays intact. */
export function formatDeliveryRequirement(value: string, locale: Locale = "en"): string {
  const codes: Record<string, keyof typeof displayCopy.en> = {
    "Host or cluster endpoint": "delivery_host",
    "Deploy credentials (SSH key or console login)": "delivery_credentials",
    "Target environment name": "delivery_environment",
    "Domain name (optional)": "delivery_domain",
    "Any third-party API keys to configure": "delivery_api_keys",
    "Repository URL and write access": "delivery_repository",
  };
  const key = codes[value];
  return key ? displayCopy[locale][key] : value;
}
