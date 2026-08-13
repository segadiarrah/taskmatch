/**
 * Canonical public origin of the site.
 *
 * Used for the sitemap, robots.txt, canonical URLs and Open Graph tags — all of
 * which need an absolute URL. Override per environment with
 * `NEXT_PUBLIC_SITE_URL` so preview deployments do not advertise the production
 * origin to crawlers.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://taskmatch.ai"
).replace(/\/$/, "");

/** Public marketing routes, i.e. everything a crawler should see. */
export const PUBLIC_ROUTES = [
  "/",
  "/how-it-works",
  "/for-clients",
  "/for-developers",
  "/pricing",
  "/changelog",
  "/company/about",
  "/company/careers",
  "/company/contact",
  "/company/press-kit",
  "/resources/documentation",
  "/resources/api-reference",
  "/resources/sdk",
  "/resources/guides",
  "/resources/blog",
  "/legal/notice",
  "/legal/privacy",
  "/legal/terms",
  "/legal/security",
  "/legal/compliance",
] as const;
