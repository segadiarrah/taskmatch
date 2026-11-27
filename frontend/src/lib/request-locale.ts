import { headers } from "next/headers";
import { normalizeLocale } from "@/lib/locales";

export async function requestLanguage() {
  const request = await headers();
  return {
    locale: normalizeLocale(request.get("x-taskmatch-language")) ?? "en" as const,
    explicit: request.get("x-taskmatch-preference") === "explicit",
  };
}
