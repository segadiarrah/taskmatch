import type { MetadataRoute } from "next";

import { blogPosts } from "@/content/blog";
import { guides } from "@/content/guides";
import { PUBLIC_ROUTES, SITE_URL } from "@/lib/site";

/**
 * Sitemap for the public marketing and legal pages.
 *
 * Legal pages are included deliberately: mentions légales and the privacy
 * policy are the pages a prospect, a partner or a regulator looks for first,
 * and leaving them out of the sitemap is part of why the site reads as opaque
 * from a search engine's point of view.
 *
 * Blog posts and guides are listed one by one rather than only through their
 * index pages. They are the site's actual written content — the part that shows
 * a real team publishing under its own name — and a crawler has no way to reach
 * them otherwise, since the article pages are rendered client-side from a slug.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Static generation has no request clock to read, and a build-time timestamp
  // would churn the whole sitemap on every deploy. A fixed publication date is
  // the honest signal: it changes when the content does — so move it when you
  // change a public page, and leave it alone when you do not. A sitemap that
  // claims every page changed on every deploy teaches a crawler to ignore the
  // field; one that never moves teaches it the pages are stale.
  //
  // 2026-08-16: the terms, the privacy policy, the careers page and the press
  // kit were rewritten.
  const lastModified = new Date("2026-08-16");

  const pages: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route === "/" ? "" : route}`,
    lastModified,
    changeFrequency: route === "/" ? ("weekly" as const) : ("monthly" as const),
    priority: route === "/" ? 1 : route.startsWith("/legal") ? 0.3 : 0.7,
  }));

  const posts: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/resources/blog/${post.slug}`,
    // An article's own publication date is more accurate than a site-wide one.
    lastModified: new Date(post.date),
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  const guidePages: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: `${SITE_URL}/resources/guides/${guide.slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...pages, ...posts, ...guidePages];
}
