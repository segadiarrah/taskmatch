import type { Metadata } from "next";
import { shareMetadata } from "@/lib/share-metadata";
import { requestLanguage } from "@/lib/request-locale";

export async function buildPageMetadata(route: string) {
  return shareMetadata(route, (await requestLanguage()).locale);
}

export function buildUnknownArticleMetadata(kind: "Article" | "Guide"): Metadata {
  return { title: `${kind} not found — TaskMatch.ai`, robots: { index: false, follow: true } };
}
