/** Locale identifiers are wire values; endonyms stay in their own language. */
export const SUPPORTED_LOCALES = ["en", "fr", "zh", "es", "pt"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const LOCALES: { value: Locale; label: string; native: string; flag: string }[] = [
  { value: "en", label: "EN", native: "English", flag: "🇬🇧" },
  { value: "fr", label: "FR", native: "Français", flag: "🇫🇷" },
  { value: "zh", label: "中文", native: "中文", flag: "🇨🇳" },
  { value: "es", label: "ES", native: "Español", flag: "🇪🇸" },
  { value: "pt", label: "PT", native: "Português", flag: "🇵🇹" },
];

export function normalizeLocale(value: unknown): Locale | null {
  if (typeof value !== "string") return null;
  try {
    const language = new Intl.Locale(value.replace(/_/g, "-")).language;
    return SUPPORTED_LOCALES.find(locale => locale === language) ?? null;
  } catch { return null; }
}

export function resolveLocale(stored: unknown, preferences: readonly string[] = []): Locale {
  return normalizeLocale(stored) ?? preferences.map(normalizeLocale).find((value): value is Locale => value !== null) ?? "en";
}

/** Read preference for requests outside React; never access browser state on the server. */
export function currentLocale(): Locale {
  if (typeof window === "undefined") return "en";
  let stored: string | null = null;
  try { stored = localStorage.getItem("taskmatch_locale"); } catch { /* Storage may be disabled. */ }
  const preferences = typeof navigator === "undefined" ? [] : navigator.languages?.length ? navigator.languages : [navigator.language];
  return resolveLocale(stored, preferences);
}
