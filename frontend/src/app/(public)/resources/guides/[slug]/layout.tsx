import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getGuideBySlug, guides } from "@/content/guides";
import { buildUnknownArticleMetadata } from "@/lib/page-metadata";
import { requestLanguage } from "@/lib/request-locale";
import { shareMetadata, languageUrls } from "@/lib/share-metadata";
import { serializeJsonLd } from "@/lib/json-ld";
import { LEGAL_ENTITY } from "@/lib/legal-entity";

/**
 * As for blog posts: each guide needs its own title, description and canonical,
 * or the whole set collapses into one indexable URL.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { locale } = await requestLanguage();
  const guide = getGuideBySlug((await params).slug, locale);
  if (!guide) return buildUnknownArticleMetadata("Guide");

  const title = `${guide.title} — TaskMatch.ai`;
  return shareMetadata(`/resources/guides/${guide.slug}`, locale, {
    title, description: guide.excerpt,
  }, {});
}

/** Prerender the known guides; unknown slugs still render on demand. */
export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export default async function GuideLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { locale } = await requestLanguage();
  const guide = getGuideBySlug((await params).slug, locale);

  const guideJsonLd = guide && {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: guide.title,
    description: guide.excerpt,
    url: languageUrls(`/resources/guides/${guide.slug}`)[locale],
    mainEntityOfPage: languageUrls(`/resources/guides/${guide.slug}`)[locale],
    proficiencyLevel: guide.level,
    audience: { "@type": "Audience", audienceType: guide.audience },
    publisher: { "@type": "Organization", name: LEGAL_ENTITY.name },
  };

  return (
    <>
      {guideJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(guideJsonLd) }}
        />
      ) : null}
      {children}
    </>
  );
}
