import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getGuideBySlug, guides } from "@/content/guides";
import { buildArticleMetadata, buildUnknownArticleMetadata } from "@/lib/page-metadata";
import { SITE_URL } from "@/lib/site";
import { serializeJsonLd } from "@/lib/json-ld";
import { LEGAL_ENTITY } from "@/lib/legal-entity";

/**
 * As for blog posts: each guide needs its own title, description and canonical,
 * or the whole set collapses into one indexable URL.
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const guide = getGuideBySlug(params.slug);
  if (!guide) return buildUnknownArticleMetadata("Guide");

  return buildArticleMetadata({
    route: `/resources/guides/${guide.slug}`,
    title: guide.title,
    description: guide.excerpt,
  });
}

/** Prerender the known guides; unknown slugs still render on demand. */
export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export default function GuideLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { slug: string };
}) {
  const guide = getGuideBySlug(params.slug);

  const guideJsonLd = guide && {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: guide.title,
    description: guide.excerpt,
    url: `${SITE_URL}/resources/guides/${guide.slug}`,
    mainEntityOfPage: `${SITE_URL}/resources/guides/${guide.slug}`,
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
