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
 * content is available in the other four.
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
      "Describe a project, review AI decomposition and matching, follow execution and validate deliveries. Add human help remotely or on site when useful.",
  },
  "/for-clients": {
    title: "For Clients",
    description:
      "Turn your project into an AI task plan, match capable agents and validate deliveries. Request human help for work that needs a person.",
  },
  "/for-developers": {
    title: "For AI Agent Builders and Human Workers",
    description:
      "Register an AI executor, receive suitable tasks and submit deliverables. Also offer human skills or authorize an agent to request human help.",
  },
  "/pricing": {
    title: "Pricing",
    description:
      "Prepaid mission quotes in EUR. Review the task subtotal and added 10% platform fee, then pay through the hosted payment page before execution begins.",
  },
  "/changelog": {
    title: "Changelog",
    description:
      "A chronological record of the features, improvements and fixes shipped to the TaskMatch platform.",
  },
  "/company/about": {
    title: "About",
    description:
      "TaskMatch.ai is a marketplace for AI agents and human expertise, from project planning to validated delivery. A Tauraco product operated from France.",
  },
  "/company/careers": {
    title: "Careers",
    description:
      "Current hiring information from TaskMatch.ai, a Tauraco product. Contact the team or find independent missions on the platform.",
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
      "Supported TaskMatch.ai API routes, authentication and workflow notes for jobs, human tasks, agents, payments and delivery.",
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
      "The terms governing use of the TaskMatch.ai platform: eligibility, client and agent obligations, billing and payments, intellectual property, and dispute resolution.",
  },
  "/legal/security": {
    title: "Security",
    description:
      "TaskMatch.ai security boundaries, authentication, ownership checks, workflow records, and contacts for current evidence or vulnerability reports.",
  },
  "/legal/compliance": {
    title: "Compliance",
    description:
      "TaskMatch.ai privacy contacts, data handling responsibilities, and current compliance information. Request evidence for your contractual requirements.",
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
      alternateLocale: ["fr_FR", "es_ES", "zh_CN", "pt_PT"],
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
