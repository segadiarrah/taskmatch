export const LOCALES = ["en", "fr", "es", "zh"];

const resourcesLegal = [
  "src/app/(public)/resources/documentation/page.tsx",
  "src/app/(public)/resources/api-reference/page.tsx",
  "src/app/(public)/resources/sdk/page.tsx",
  "src/app/(public)/resources/guides/page.tsx",
  "src/app/(public)/resources/guides/[slug]/page.tsx",
  "src/app/(public)/resources/blog/page.tsx",
  "src/app/(public)/resources/blog/[slug]/page.tsx",
  "src/app/(public)/legal/notice/page.tsx",
  "src/app/(public)/legal/privacy/page.tsx",
  "src/app/(public)/legal/terms/page.tsx",
  "src/app/(public)/legal/security/page.tsx",
  "src/app/(public)/legal/compliance/page.tsx",
  "src/components/public/legal-shell.tsx",
  "src/content/blog.ts",
  "src/content/guides.ts",
  // Route layouts. Each one exists only to attach a server-rendered title,
  // description and canonical URL to a client-rendered page; the copy itself
  // lives in src/lib/page-metadata.ts, which is crawler-facing and
  // single-locale by design.
  "src/app/(public)/resources/documentation/layout.tsx",
  "src/app/(public)/resources/api-reference/layout.tsx",
  "src/app/(public)/resources/sdk/layout.tsx",
  "src/app/(public)/resources/guides/layout.tsx",
  "src/app/(public)/resources/guides/[slug]/layout.tsx",
  "src/app/(public)/resources/blog/layout.tsx",
  "src/app/(public)/resources/blog/[slug]/layout.tsx",
  "src/app/(public)/legal/notice/layout.tsx",
  "src/app/(public)/legal/privacy/layout.tsx",
  "src/app/(public)/legal/terms/layout.tsx",
  "src/app/(public)/legal/security/layout.tsx",
  "src/app/(public)/legal/compliance/layout.tsx",
];

const publicAuth = [
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/app/loading.tsx",
  "src/app/not-found.tsx",
  "src/app/(public)/layout.tsx",
  "src/app/(public)/how-it-works/page.tsx",
  "src/app/(public)/for-clients/page.tsx",
  "src/app/(public)/for-developers/page.tsx",
  "src/app/(public)/pricing/page.tsx",
  "src/app/(public)/changelog/page.tsx",
  "src/app/(public)/company/about/page.tsx",
  "src/app/(public)/company/careers/page.tsx",
  "src/app/(public)/company/contact/page.tsx",
  "src/app/(public)/company/press-kit/page.tsx",
  "src/app/(auth)/layout.tsx",
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/register/page.tsx",
  "src/components/public/site-chrome.tsx",
  "src/components/public/page-shell.tsx",
  "src/components/public/motion.tsx",
  "src/components/language-switcher.tsx",
  "src/components/gdpr/data-rights-panel.tsx",
  "src/lib/landing-copy.ts",
  // Route layouts. Each one exists only to attach a server-rendered title,
  // description and canonical URL to a client-rendered page; the copy itself
  // lives in src/lib/page-metadata.ts, which is crawler-facing and
  // single-locale by design.
  "src/app/(public)/how-it-works/layout.tsx",
  "src/app/(public)/for-clients/layout.tsx",
  "src/app/(public)/for-developers/layout.tsx",
  "src/app/(public)/pricing/layout.tsx",
  "src/app/(public)/changelog/layout.tsx",
  "src/app/(public)/company/about/layout.tsx",
  "src/app/(public)/company/careers/layout.tsx",
  "src/app/(public)/company/contact/layout.tsx",
  "src/app/(public)/company/press-kit/layout.tsx",
];

const dashboardShared = [
  "src/app/(dashboard)/layout.tsx",
  "src/app/(dashboard)/error.tsx",
  "src/app/(dashboard)/client/page.tsx",
  "src/app/(dashboard)/client/jobs/page.tsx",
  "src/app/(dashboard)/client/jobs/new/page.tsx",
  "src/app/(dashboard)/client/jobs/[id]/page.tsx",
  "src/app/(dashboard)/client/jobs/[id]/execution-plan.tsx",
  "src/app/(dashboard)/client/jobs/[id]/quote-panel.tsx",
  "src/app/(dashboard)/client/jobs/[id]/delivery-panel.tsx",
  "src/app/(dashboard)/developer/page.tsx",
  "src/app/(dashboard)/developer/earnings/page.tsx",
  "src/app/(dashboard)/developer/tasks/page.tsx",
  "src/app/(dashboard)/developer/tasks/[id]/page.tsx",
  "src/app/(dashboard)/developer/agents/page.tsx",
  "src/app/(dashboard)/developer/agents/new/page.tsx",
  "src/app/(dashboard)/developer/agents/[id]/page.tsx",
  "src/app/(dashboard)/admin/page.tsx",
  "src/app/(dashboard)/admin/providers/page.tsx",
  "src/app/(dashboard)/admin/audit/page.tsx",
  "src/app/(dashboard)/admin/learning/page.tsx",
  "src/app/(dashboard)/admin/payments/page.tsx",
  "src/app/(dashboard)/admin/validations/page.tsx",
  "src/app/(dashboard)/admin/tasks/page.tsx",
  "src/app/(dashboard)/admin/tasks/[id]/page.tsx",
  "src/app/(dashboard)/admin/jobs/page.tsx",
  "src/app/(dashboard)/admin/jobs/[id]/page.tsx",
  "src/app/(dashboard)/admin/agents/page.tsx",
  "src/app/(dashboard)/admin/agents/[id]/page.tsx",
  "src/components/ui/avatar.tsx",
  "src/components/ui/badge.tsx",
  "src/components/ui/button.tsx",
  "src/components/ui/card.tsx",
  "src/components/ui/dialog.tsx",
  "src/components/ui/dropdown-menu.tsx",
  "src/components/ui/input.tsx",
  "src/components/ui/progress.tsx",
  "src/components/ui/select.tsx",
  "src/components/ui/table.tsx",
  "src/components/ui/tabs.tsx",
  "src/components/ui/textarea.tsx",
  "src/lib/i18n.tsx",
  "src/lib/utils.ts",
];

export const localizationManifest = [
  ...resourcesLegal.map((path) => ({ path, scope: "resources-legal", localization: "inline" })),
  ...publicAuth.map((path) => ({ path, scope: "public-auth", localization: "inline" })),
  ...dashboardShared.map((path) => ({ path, scope: "dashboard-shared", localization: "central" })),
  ...LOCALES.map((locale) => ({
    path: `src/i18n/${locale}.ts`,
    scope: "dashboard-shared",
    localization: "dictionary",
  })),
];

// Every exemption is deliberately narrow and records the kind of literal it protects.
export const reviewedLiteralAllowlist = {
  productAndProtocols: new Set([
    "TaskMatch",
    "TaskMatch.ai",
    "API",
    "SDK",
    "OAuth",
    "Webhook",
    "HTTP",
    "HTTPS",
    "JSON",
    "REST",
    "TypeScript",
    "Python",
    "GitHub",
    "Stripe",
    // Publisher name and French statutory identifiers. Proper nouns and
    // registry acronyms are written identically in every language, so
    // translating them would be wrong rather than merely unnecessary.
    "Tauraco",
    "SIREN",
    "SIRET",
    "RCS",
    "TVA",
    "CNIL",
  ]),
  // Endonyms: each language's name written in that language. A language picker
  // that translated them would show "Chinese" to someone who cannot read
  // English — the one string on the page that must not follow the current
  // locale is the name of the locale you are trying to switch to.
  languageEndonyms: new Set(["English", "Fran\u00e7ais", "Espa\u00f1ol", "\u4e2d\u6587"]),
  httpMethods: new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]),
  // Code, URLs, identifiers, status codes, and dynamic-data selectors are structural, not prose.
  patterns: [
    /^(?:https?:\/\/|mailto:|tel:)/,
    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    /^\/?(?:api\/)?v\d+(?:\/|$)/i,
    /^\/[A-Za-z0-9_?&=./:[\]-]+$/,
    /^\d{3}$/,
    /^&(?:[A-Z]+|#\d+);$/i,
    /^[A-Z]{2,4}$/,
    /^(?:[a-z][a-z0-9]*)(?:_[a-z0-9]+)+$/,
    /^(?:npm|npx|pnpm|yarn|curl|pip)\s/,
    /^@[a-z0-9._/-]+$/i,
    /^(?:application\/json|Bearer|Content-Type|Authorization)$/,
    // BCP-47 language tags ("fr", "fr_FR", "zh-CN") — metadata for crawlers and
    // Open Graph, never rendered to a reader.
    /^[a-z]{2}(?:[_-][A-Za-z]{2,4})?$/,
  ],
};

export const forbiddenMetaDesignPhrases = [
  "obsidian surface",
  "obsidian surfaces",
  "brand-native",
  "visual system",
  "design system",
  "editorial layout",
  "interface grammar",
  "developer tooling",
];
