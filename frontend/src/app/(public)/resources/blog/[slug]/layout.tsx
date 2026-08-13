import type { Metadata } from "next";
import type { ReactNode } from "react";

import { blogPosts, getPostBySlug } from "@/content/blog";
import { buildArticleMetadata, buildUnknownArticleMetadata } from "@/lib/page-metadata";
import { SITE_URL } from "@/lib/site";
import { serializeJsonLd } from "@/lib/json-ld";
import { LEGAL_ENTITY } from "@/lib/legal-entity";

/**
 * Article pages are client components rendered from a slug, so without this the
 * whole blog shared one title and one canonical pointing at the home page. Each
 * post now carries its own title, description, canonical and publication date.
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return buildUnknownArticleMetadata("Article");

  return buildArticleMetadata({
    route: `/resources/blog/${post.slug}`,
    title: post.title,
    description: post.excerpt,
    publishedTime: post.date,
    authors: [post.author.name],
  });
}

/** Prerender the known posts; unknown slugs still render on demand. */
export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default function BlogPostLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { slug: string };
}) {
  const post = getPostBySlug(params.slug);

  // Article structured data. A search engine can attribute the writing to a
  // named author and a named publisher instead of treating it as loose text.
  const articleJsonLd = post && {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    url: `${SITE_URL}/resources/blog/${post.slug}`,
    mainEntityOfPage: `${SITE_URL}/resources/blog/${post.slug}`,
    author: { "@type": "Person", name: post.author.name, jobTitle: post.author.role },
    publisher: { "@type": "Organization", name: LEGAL_ENTITY.name },
  };

  return (
    <>
      {articleJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
        />
      ) : null}
      {children}
    </>
  );
}
