import type { Metadata } from "next";
import type { ReactNode } from "react";

import { blogPosts, getPostBySlug } from "@/content/blog";
import { buildUnknownArticleMetadata } from "@/lib/page-metadata";
import { requestLanguage } from "@/lib/request-locale";
import { shareMetadata, languageUrls } from "@/lib/share-metadata";
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
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { locale } = await requestLanguage();
  const post = getPostBySlug((await params).slug, locale);
  if (!post) return buildUnknownArticleMetadata("Article");

  const title = `${post.title} — TaskMatch.ai`;
  return shareMetadata(`/resources/blog/${post.slug}`, locale, {
    title, description: post.excerpt,
  }, { publishedTime: post.date, authors: [post.author.name] });
}

/** Prerender the known posts; unknown slugs still render on demand. */
export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { locale } = await requestLanguage();
  const post = getPostBySlug((await params).slug, locale);

  // Article structured data. A search engine can attribute the writing to a
  // named author and a named publisher instead of treating it as loose text.
  const articleJsonLd = post && {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    url: languageUrls(`/resources/blog/${post.slug}`)[locale],
    mainEntityOfPage: languageUrls(`/resources/blog/${post.slug}`)[locale],
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
