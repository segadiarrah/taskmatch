import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

// Registration URLs allow link previews and declare noindex in their own metadata.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/client/", "/developer/", "/admin/", "/login", "/human-tasks"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
