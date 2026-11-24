"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import type { Locale } from "@/lib/locales";
import { getLocalizedRouteMetadata } from "@/lib/localized-page-copy";

import { SOCIAL_LOCALES, registerPreview } from "@/lib/share-metadata";
import { parsePublicIntent } from "@/lib/public-intent";

type PageMetadata = { title: string; description?: string };


function useLocalizedMetadata(metadata: PageMetadata | null, locale: Locale) {
  const title = metadata?.title;
  const description = metadata?.description;
  useEffect(() => {
    if (!title) return;
    const finalTitle = title.endsWith("TaskMatch.ai") ? title : `${title} — TaskMatch.ai`;
    function apply() {
      if (document.title !== finalTitle) document.title = finalTitle;
      for (const element of Array.from(document.querySelectorAll("title"))) {
        if (element.namespaceURI === "http://www.w3.org/1999/xhtml" && element.textContent !== finalTitle) element.textContent = finalTitle;
      }
      const values: [string, string | undefined][] = [
        ['meta[name="description"]', description],
        ['meta[property="og:title"]', finalTitle],
        ['meta[name="twitter:title"]', finalTitle],
        ['meta[property="og:description"]', description],
        ['meta[name="twitter:description"]', description],
        ['meta[property="og:locale"]', SOCIAL_LOCALES[locale]],
      ];
      for (const [selector, value] of values) {
        if (value === undefined) continue;
        for (const element of Array.from(document.querySelectorAll(selector))) {
          if (element.getAttribute("content") !== value) element.setAttribute("content", value);
        }
      }
    }
    apply();
    // Next can stream server metadata after a client navigation. Keep the selected
    // language's browser metadata when those default-language tags arrive,
    // including metadata streamed into the document body.
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["content"] });
    return () => observer.disconnect();
  }, [title, description, locale]);
}

/** Dynamic article and guide pages supply their own translated titles. */
export function LocalizedMetadata({ title, description }: PageMetadata) {
  const { locale } = useTranslation();
  useLocalizedMetadata({ title, description }, locale);
  return null;
}

export function RouteMetadata() {
  const pathname = usePathname();
  const { locale } = useTranslation();
  const params = useSearchParams();
  const dynamicArticle = /^\/(?:resources\/(?:blog|guides)|directory)\/[^/]+\/?$/.test(pathname);
  useLocalizedMetadata(dynamicArticle ? null : pathname === "/register" ? registerPreview(locale, parsePublicIntent(params.get("intent"))) : getLocalizedRouteMetadata(pathname, locale), locale);
  return null;
}
