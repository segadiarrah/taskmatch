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

/** A fallback string, or values to interpolate into `{tokens}`. */
export type TranslateOptions = string | Record<string, string | number>;

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, options?: TranslateOptions) => any;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key: string, options?: TranslateOptions) => (typeof options === "string" ? options : key),
});

/* -------------------------------------------------------------------------- */
/*  Provider                                                                  */
/* -------------------------------------------------------------------------- */

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

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

  /*
   * Translation function.
   *
   * The second argument is either a fallback string (the original signature) or
   * a bag of values to interpolate into `{tokens}` in the translated string.
   *
   * Interpolation rather than string concatenation, because word order is not
   * universal: "Welcome back, {name}" can put the name first, last or in the
   * middle depending on the language, and a sentence assembled in JSX from two
   * halves forces English order on every locale. `{year}` keeps working with no
   * argument, as it did before.
   */
  const t = useCallback(
    (key: string, options?: string | Record<string, string | number>): any => {
      const value = resolve(dictionaries[locale], key);
      const fallback = typeof options === "string" ? options : undefined;
      /* If resolve returned the key itself (not found), use fallback if provided. */
      let resolved = value === key && fallback !== undefined ? fallback : value;
      const params = typeof options === "object" && options !== null ? options : undefined;

      /*
       * Plural selection. A dictionary entry may be an object of plural
       * categories instead of a string; passing a `count` picks the right one
       * through Intl.PluralRules, which knows that English needs two forms,
       * French treats zero as singular, and Chinese needs one form for
       * everything. Writing `job{count !== 1 ? "s" : ""}` in JSX encodes
       * English grammar into every locale at once.
       */
      if (resolved && typeof resolved === "object" && params?.count !== undefined) {
        const category = new Intl.PluralRules(locale).select(Number(params.count));
        resolved = resolved[category] ?? resolved.other ?? resolved.one;
      }

      if (typeof resolved !== "string") return resolved;
      return resolved.replace(/\{(\w+)\}/g, (match, token: string) => {
        if (token === "year") return String(new Date().getFullYear());
        const replacement = params?.[token];
        return replacement === undefined ? match : String(replacement);
      });
    },
    [locale],
  );

  /*
   * Render on the server with the default locale rather than withholding the
   * tree until mount.
   *
   * This used to `return null` while `mounted` was false, to avoid a hydration
   * mismatch. The mismatch it guarded against cannot happen: `locale` starts at
   * "en" and only changes inside an effect, so the server render and the first
   * client render agree by construction — the stored or detected locale is
   * applied afterwards, in a normal re-render.
   *
   * What the guard did instead was ship every page with an empty <body>. The
   * markup existed only after JavaScript ran, which costs nothing for a browser
   * and everything for anything that reads HTML without executing it: link
   * previews, non-rendering crawlers, reader modes, and a mandatory legal notice
   * that has to be readable to be worth publishing. A site whose pages are blank
   * until hydration is exactly a site that looks like it was never published.
   */
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
