"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTranslation, LOCALES, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ publicPage = false }: { publicPage?: boolean }) {
  const { locale, setLocale, t } = useTranslation();
  const pathname = usePathname();
  const params = useSearchParams();
  const label = t("publicUi.selectLanguage");
  // The native form also works in the initial HTML. Carry only public campaign
  // and journey parameters into the address of the translated page.
  const preserved = Array.from(params.entries()).filter(([key]) =>
    ["intent", "ref", "referral", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].includes(key));
  const select = (
    <select name="lang" aria-label={label} value={locale}
      onChange={event => {
        setLocale(event.target.value as Locale);
        if (publicPage) event.currentTarget.form?.requestSubmit();
      }}
      className="min-h-10 rounded-md border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs font-medium text-ink-300 hover:border-ink-500">
      {LOCALES.map(option => <option key={option.value} value={option.value}>{option.native}</option>)}
    </select>
  );
  if (!publicPage) return select;
  return <form action={pathname} method="get" className="flex flex-wrap items-center gap-1">
    {preserved.map(([key, value], index) => <input type="hidden" key={index} name={key} value={value} />)}
    {select}
    <noscript><button type="submit" className="rounded-md border border-ink-700 px-2 py-1 text-xs">{label}</button></noscript>
  </form>;
}
