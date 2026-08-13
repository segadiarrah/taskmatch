import type { MetadataRoute } from "next";

import { PUBLIC_ROUTES, SITE_URL } from "@/lib/site";

/**
 * Sitemap for the public marketing and legal pages.
 *
 * Legal pages are included deliberately: mentions légales and the privacy
 * policy are the pages a prospect, a partner or a regulator looks for first,
 * and leaving them out of the sitemap is part of why the site reads as opaque
 * from a search engine's point of view.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Static generation has no request clock to read, and a build-time timestamp
  // would churn the whole sitemap on every deploy. A fixed publication date is
  // the honest signal: it changes when the content does.
  const lastModified = new Date("2026-08-13");

  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route === "/" ? "" : route}`,
    lastModified,
    changeFrequency: route === "/" ? ("weekly" as const) : ("monthly" as const),
    priority: route === "/" ? 1 : route.startsWith("/legal") ? 0.3 : 0.7,
  }));
}
