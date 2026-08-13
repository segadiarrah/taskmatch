import type { Metadata } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * Title and description for each public route.
 *
 * Why this file exists: every public page is a client component, so none of
 * them can export `metadata`. The result was that all twenty public URLs
 * inherited the root layout's title, description *and* its
 * `alternates: { canonical: "/" }` — every page declaring itself a duplicate of
 * the home page. A crawler that believes the site is twenty copies of one page
 * indexes one page, which is most of the reason the site reads as a private
 * project rather than a published product.
 *
 * Each route gets a `layout.tsx` that exports `buildPageMetadata(route)`, which
 * is how a server-rendered title and a self-referencing canonical get attached
 * to a client-rendered page.
 *
 * These strings are deliberately **not** part of the localization contract. The
 * page copy is translated in the browser by `LanguageProvider`, but metadata is
 * resolved on the server before any language preference exists, so one HTML
 * document serves every locale. Translating it here would only mean shipping a
 * title that contradicts what the crawler reads. English is the site default,
 * and `openGraph.alternateLocale` in the root layout already declares that the
 * content is available in the other three.
 */

export interface PageMeta {
  /** Page title, without the site-name suffix — `buildPageMetadata` adds it. */
  title: string;
  /** Meta description. Aim for 110–160 characters: shorter reads as a stub. */
  description: string;
}

export const PAGE_METADATA: Record<string, PageMeta> = {
  "/how-it-works": {
    title: "How It Works",
    description:
      "Four steps from a plain-language brief to a verified deliverable: structured intake, dependency-aware decomposition, agent matching, and automated validation.",
  },
  "/for-clients": {
    title: "For Clients",
    description:
      "Turn a rough idea into an unambiguous specification, get it executed by matched agents, and receive work that has already been validated against your acceptance criteria.",
  },
  "/for-developers": {
    title: "For Agent Developers",
    description:
      "Register an AI agent or your own expertise and let structured, well-specified work come to you. Merit-based matching, clear acceptance criteria, escrowed payment.",
  },
  "/pricing": {
    title: "Pricing",
    description:
      "Transparent platform pricing for AI task execution: start free, scale by usage. No per-seat charges and no hidden fees — TaskMatch quotes the price before work begins.",
  },
  "/changelog": {
    title: "Changelog",
    description:
      "A chronological record of the features, improvements and fixes shipped to the TaskMatch platform.",
  },
  "/company/about": {
    title: "About",
    description:
      "TaskMatch.ai is built to remove the friction between intent and execution — decomposing any business request into structured, verifiable tasks matched to the right executor.",
  },
  "/company/careers": {
    title: "Careers",
    description:
      "Open roles at TaskMatch.ai. A small team working at the intersection of AI orchestration, marketplace design and developer tooling.",
  },
  "/company/contact": {
    title: "Contact",
    description:
      "Reach the TaskMatch.ai team about product questions, enterprise support, partnerships, privacy requests or security disclosures.",
  },
  "/company/press-kit": {
    title: "Press Kit",
    description:
      "Logos, brand assets and key facts about TaskMatch.ai for journalists, analysts and partners.",
  },
  "/resources/documentation": {
    title: "Documentation",
    description:
      "Integrate with TaskMatch.ai: quickstart guides, authentication, the job lifecycle, and the concepts behind decomposition, matching and validation.",
  },
  "/resources/api-reference": {
    title: "API Reference",
    description:
      "Complete REST API reference for TaskMatch.ai — endpoints, request and response schemas, authentication and error handling for jobs, tasks, bids and deliveries.",
  },
  "/resources/sdk": {
    title: "SDK",
    description:
      "Client libraries for the TaskMatch.ai API: install, authenticate, submit a job and follow it to validated delivery in a few lines of code.",
  },
  "/resources/guides": {
    title: "Guides",
    description:
      "Step-by-step guides for clients and agent developers, each walking a full workflow end to end against the real TaskMatch.ai API.",
  },
  "/resources/blog": {
    title: "Blog",
    description:
      "Engineering and product writing from the TaskMatch.ai team on AI-powered work, marketplace design and the mechanics of task execution.",
  },
  "/legal/notice": {
    title: "Legal Notice",
    description:
      "Mentions légales for TaskMatch.ai: publisher, registration, director of publication, hosting providers and contact details, as required by French law.",
  },
  "/legal/privacy": {
    title: "Privacy Policy",
    description:
      "How TaskMatch.ai collects, uses, stores and protects personal data, the legal bases for each processing purpose, and how to exercise your GDPR rights.",
  },
  "/legal/terms": {
    title: "Terms of Service",
    description:
      "The terms governing use of the TaskMatch.ai platform: eligibility, client and agent obligations, escrow and payments, intellectual property, and dispute resolution.",
  },
  "/legal/security": {
    title: "Security",
    description:
      "How TaskMatch.ai secures the platform: encryption in transit and at rest, access control, isolation of agent execution, logging, and how to report a vulnerability.",
  },
  "/legal/compliance": {
    title: "Compliance",
    description:
      "TaskMatch.ai's compliance posture: GDPR, data-subject requests, sub-processors, data residency in the European Union, and the control objectives we are working toward.",
  },
};

/** The site name appended to every page title. */
const SITE_NAME = "TaskMatch.ai";

/**
 * Metadata for one public route.
 *
 * The canonical URL is the point of the exercise: it overrides the root
 * layout's `canonical: "/"`, so each page claims its own URL instead of
 * pointing every crawler back at the home page.
 */
export function buildPageMetadata(route: string): Metadata {
  const meta = PAGE_METADATA[route];
  if (!meta) {
    // A route with no entry would silently fall back to the root metadata —
    // the exact failure this module exists to prevent. Fail at build time.
    throw new Error(`No page metadata declared for route "${route}"`);
  }

  const title = `${meta.title} — ${SITE_NAME}`;

  return {
    title,
    description: meta.description,
    alternates: { canonical: route },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description: meta.description,
      url: `${SITE_URL}${route}`,
      locale: "en_US",
      alternateLocale: ["fr_FR", "es_ES", "zh_CN"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: meta.description,
    },
  };
}

/**
 * Metadata for a page whose content is data-driven — a blog post, a guide —
 * where the title and description come from the content module rather than
 * from the table above.
 */
export function buildArticleMetadata(options: {
  route: string;
  title: string;
  description: string;
  publishedTime?: string;
  authors?: string[];
}): Metadata {
  const title = `${options.title} — ${SITE_NAME}`;

  return {
    title,
    description: options.description,
    alternates: { canonical: options.route },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title,
      description: options.description,
      url: `${SITE_URL}${options.route}`,
      locale: "en_US",
      publishedTime: options.publishedTime,
      authors: options.authors,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: options.description,
    },
  };
}

/**
 * Metadata for an article route whose slug matches no content.
 *
 * The page renders its own "not found" state, which is right for a reader who
 * followed a stale link — but it is an empty page, and letting it into an index
 * puts a dead end in front of the next reader. `follow` stays on so the links
 * back into the site are still worth something.
 */
export function buildUnknownArticleMetadata(kind: "Article" | "Guide"): Metadata {
  return {
    title: `${kind} not found — ${SITE_NAME}`,
    robots: { index: false, follow: true },
  };
}
