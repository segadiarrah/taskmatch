"use client";

import { useTranslation, LOCALES, type Locale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();
  return (
    <select
      aria-label={t("publicUi.selectLanguage")}
      value={locale}
      onChange={(event) => setLocale(event.target.value as Locale)}
      className="rounded-md border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs font-medium text-ink-300 hover:border-ink-500"
    >
      {LOCALES.map((option) => <option key={option.value} value={option.value}>{option.native}</option>)}
    </select>
  );
}
