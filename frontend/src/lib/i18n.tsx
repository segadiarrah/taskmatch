"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import en from "@/i18n/en";
import fr from "@/i18n/fr";
import zh from "@/i18n/zh";
import es from "@/i18n/es";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type Locale = "en" | "fr" | "zh" | "es";

export const LOCALES: { value: Locale; label: string; native: string; flag: string }[] = [
  { value: "en", label: "EN", native: "English", flag: "🇬🇧" },
  { value: "fr", label: "FR", native: "Français", flag: "🇫🇷" },
  { value: "es", label: "ES", native: "Español", flag: "🇪🇸" },
  { value: "zh", label: "中文", native: "中文", flag: "🇨🇳" },
];

/** Recursively extract dot-notation paths from a nested object type. */
type NestedKeyOf<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? T[K] extends unknown[]
          ? `${Prefix}${K}`
          : NestedKeyOf<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<typeof en>;

/* -------------------------------------------------------------------------- */
/*  Translation dictionaries                                                  */
/* -------------------------------------------------------------------------- */

/** Deep-readonly record type that allows any string values (not literal). */
type DeepRecord = { readonly [key: string]: string | readonly any[] | DeepRecord };

const dictionaries: Record<Locale, DeepRecord> = { en, fr, zh, es };

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "taskmatch_locale";

/** Detect browser language and return a supported locale (defaults to "en"). */
function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language || (navigator as any).userLanguage || "en";
  const prefix = lang.slice(0, 2).toLowerCase();
  const supported: Locale[] = ["en", "fr", "zh", "es"];
  return (supported as string[]).includes(prefix) ? (prefix as Locale) : "en";
}

/**
 * Resolve a dot-notation key against a nested dictionary.
 * Returns the value at the path, or the key itself if not found.
 */
function resolve(dict: Record<string, any>, key: string): any {
  const parts = key.split(".");
  let current: any = dict;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return key;
    current = current[part];
  }
  return current === undefined ? key : current;
}

/* -------------------------------------------------------------------------- */
/*  Context                                                                   */
/* -------------------------------------------------------------------------- */

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, fallback?: string) => any;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key: string, fallback?: string) => fallback ?? key,
});

/* -------------------------------------------------------------------------- */
/*  Provider                                                                  */
/* -------------------------------------------------------------------------- */

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  /* Initialise locale from localStorage or browser detection (client only). */
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* localStorage unavailable (SSR or privacy mode) */
    }
    if (stored === "en" || stored === "fr" || stored === "es" || stored === "zh") {
      setLocaleState(stored);
    } else {
      const detected = detectBrowserLocale();
      setLocaleState(detected);
      try {
        localStorage.setItem(STORAGE_KEY, detected);
      } catch {
        /* noop */
      }
    }
    setMounted(true);
  }, []);

  /* Persist locale changes. */
  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* noop */
    }
    /* Update the html lang attribute so assistive tech picks up the change. */
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
  }, []);

  /* Translation function. Accepts an optional fallback for backward compat. */
  const t = useCallback(
    (key: string, fallback?: string): any => {
      const value = resolve(dictionaries[locale], key);
      /* If resolve returned the key itself (not found), use fallback if provided. */
      const resolved = value === key && fallback !== undefined ? fallback : value;
      /* Lightweight token interpolation for dynamic values (e.g. {year}). */
      if (typeof resolved === "string" && resolved.includes("{year}")) {
        return resolved.replace(/\{year\}/g, String(new Date().getFullYear()));
      }
      return resolved;
    },
    [locale],
  );

  /* Avoid hydration mismatch – render children only after locale is resolved. */
  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hook                                                                      */
/* -------------------------------------------------------------------------- */

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return ctx;
}
