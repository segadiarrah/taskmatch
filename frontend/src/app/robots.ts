import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * Robots policy.
 *
 * The site previously shipped no robots.txt and no sitemap at all, which leaves
 * a crawler to guess: nothing states that the public marketing pages are meant
 * to be indexed, and nothing marks the authenticated areas as off-limits.
 *
 * Dashboard, auth and API routes are excluded — they are behind a login, carry
 * no public content, and indexing them only produces dead search results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/client/", "/developer/", "/admin/", "/login", "/register"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
