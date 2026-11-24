import type { Metadata } from "next";
import { COPY } from "@/lib/landing-copy";
import { getLocalizedRouteMetadata } from "@/lib/localized-page-copy";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/locales";
import type { PublicIntent } from "@/lib/public-intent";
import { SITE_URL } from "@/lib/site";

export const SOCIAL_LOCALES: Record<Locale, string> = {
  en: "en_US", fr: "fr_FR", zh: "zh_CN", es: "es_ES", pt: "pt_BR",
};

export function languageUrls(route: string) {
  const url = new URL(route, SITE_URL);
  const languages: Record<string, string> = { "x-default": url.href };
  for (const locale of SUPPORTED_LOCALES) {
    url.searchParams.set("lang", locale);
    languages[locale] = url.href;
  }
  return languages;
}

export function registerPreview(locale: Locale, intent: PublicIntent | null) {
  if (!intent) return getLocalizedRouteMetadata("/register", locale);
  const c = COPY[locale];
  const description = {
    project: c.paths[0].body, work: c.paths[1].body, executor: c.paths[2].body,
    mission: c.humanDirectBody, agent: c.humanAgentBody,
  }[intent];
  return { title: `${c[intent]} — TaskMatch.ai`, description };
}

export function shareMetadata(
  route: string, locale: Locale, copy = getLocalizedRouteMetadata(route, locale),
  article?: { publishedTime?: string; authors?: string[] },
): Metadata {
  const languages = languageUrls(route);
  const canonical = languages[locale];
  const image = { url: `${SITE_URL}/taskmatch-share.png`, width: 1200, height: 630, alt: "TaskMatch.ai" };
  return {
    ...copy,
    alternates: { canonical, languages },
    openGraph: {
      ...copy, type: article ? "article" : "website", ...article,
      siteName: "TaskMatch.ai", url: canonical, locale: SOCIAL_LOCALES[locale],
      alternateLocale: SUPPORTED_LOCALES.filter(other => other !== locale).map(other => SOCIAL_LOCALES[other]),
      images: [image],
    },
    twitter: { ...copy, card: "summary_large_image", images: [image] },
  };
}
