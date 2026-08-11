# Complete Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver complete English, French, Spanish, and Simplified Chinese interface copy across every TaskMatch route and prevent untranslated or meta-design text from returning.

**Architecture:** Content-heavy public routes keep typed route-local copy bundles so long-form text stays close to its layout. Shared and application UI uses the central `t()` dictionaries, whose four locale files must have identical shapes without English inheritance. A static contract validates parity, forbidden editorial phrases, and localization coverage.

**Tech Stack:** Next.js 14, React 18, TypeScript, Node.js validation scripts, ESLint

**Command working directory:** Run every `npm`, Playwright, lint, type-check, and build command from `frontend/`.

---

### Task 1: Localization regression contract

**Files:**
- Create: `frontend/scripts/check-localization.mjs`
- Create: `frontend/scripts/check-localization-fixtures.mjs`
- Create: `frontend/scripts/localization-manifest.mjs`
- Create: `frontend/e2e/locales.spec.ts`
- Create: `frontend/playwright.config.ts`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `frontend/scripts/check-ui-contracts.mjs`

- [ ] Define a source manifest covering every in-scope route, layout, state component, GDPR component, language control, and static content module. Define a reviewed allowlist for code samples, identifiers, URLs, protocol names, status codes, and dynamic data.
- [ ] Write positive and negative fixtures for dictionary parity, forbidden meta-design prose, English inheritance, untranslated JSX/attributes, untranslated strings in objects/arrays, and allowlisted literals; use the TypeScript AST rather than regex for source inspection.
- [ ] Write a failing localization check that consumes the manifest and fixtures and reports failures grouped by scope (`resources-legal`, `public-auth`, `dashboard-shared`).
- [ ] Run `npm run check:localization` and confirm it fails on the current documentation prose, incomplete Spanish/Chinese dictionaries, and dashboard coverage.
- [ ] Add only the package/UI-check wiring required for the new contract.
- [ ] Add `@playwright/test`, install Chromium with `npx playwright install chromium`, and configure Playwright with three explicit modes: default local dev (`npm run dev -- --hostname 127.0.0.1 --port 3100`), local production when `PLAYWRIGHT_SERVER_COMMAND` is set, and external when `PLAYWRIGHT_BASE_URL` is set. In external mode omit `webServer`; otherwise use Playwright's URL readiness check and automatic teardown.
- [ ] Write the initially failing four-locale matrix for `/`, `/resources/documentation`, `/login`, `/client`, `/developer`, and `/admin`. Before navigation, set `taskmatch_locale`; for dashboard cases set `auth_token`, intercept `/api/v1/auth/me` with role-specific users, and fulfill each page's API requests with minimal deterministic fixtures.
- [ ] Test GDPR by clearing consent storage, loading by delaying a dashboard fixture, and error UI by returning an HTTP 500. Assert representative visible translations and `document.documentElement.lang` for every locale.
- [ ] Run `npx playwright test e2e/locales.spec.ts` and confirm failures identify the current untranslated UI and incorrect initial HTML language.
- [ ] Keep the check failing until the content tasks satisfy it.

### Task 2: Public resources and legal content

**Files:**
- Modify: `frontend/src/app/(public)/resources/documentation/page.tsx`
- Modify: `frontend/src/app/(public)/resources/api-reference/page.tsx`
- Modify: `frontend/src/app/(public)/resources/sdk/page.tsx`
- Modify: `frontend/src/app/(public)/resources/guides/page.tsx`
- Modify: `frontend/src/app/(public)/resources/guides/[slug]/page.tsx`
- Modify: `frontend/src/app/(public)/resources/blog/page.tsx`
- Modify: `frontend/src/app/(public)/resources/blog/[slug]/page.tsx`
- Modify: `frontend/src/content/blog.ts`
- Modify: `frontend/src/content/guides.ts`
- Modify: `frontend/src/app/(public)/legal/privacy/page.tsx`
- Modify: `frontend/src/app/(public)/legal/terms/page.tsx`
- Modify: `frontend/src/app/(public)/legal/security/page.tsx`
- Modify: `frontend/src/app/(public)/legal/compliance/page.tsx`

- [ ] Move every static explanatory string and control label into each route's typed four-locale copy bundle.
- [ ] Convert static blog and guide titles, excerpts, bylines/roles, reading labels, headings, paragraphs, bullets, and tags into four-locale content structures.
- [ ] Replace the documentation hero with user-focused onboarding copy in all four languages.
- [ ] Preserve code, API identifiers, URLs, legal contact addresses, and dynamic content verbatim.
- [ ] Run `npm run check:localization -- --scope=resources-legal` and type-check; confirm this route group is clean while later scopes may remain red.

### Task 3: Remaining public and authentication content

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/(public)/**/page.tsx` not covered by Task 2
- Modify: `frontend/src/app/(auth)/login/page.tsx`
- Modify: `frontend/src/app/(auth)/register/page.tsx`
- Modify: `frontend/src/app/(auth)/layout.tsx`
- Modify: `frontend/src/app/loading.tsx`
- Modify: `frontend/src/app/not-found.tsx`
- Modify: `frontend/src/components/public/site-chrome.tsx`
- Modify: `frontend/src/components/language-switcher.tsx`
- Modify: `frontend/src/components/gdpr/cookie-banner.tsx`
- Modify: `frontend/src/components/gdpr/data-rights-panel.tsx`

- [ ] Audit every visible string, title, placeholder, button, aria-label, empty state, and error state.
- [ ] Add missing idiomatic translations to the existing typed copy bundles.
- [ ] Remove any remaining commentary about the design or implementation itself.
- [ ] Run `npm run check:localization -- --scope=public-auth` and type-check; confirm this route group is clean while the dashboard scope may remain red.

### Task 4: Dashboard and shared application content

**Files:**
- Modify: `frontend/src/i18n/en.ts`
- Modify: `frontend/src/i18n/fr.ts`
- Modify: `frontend/src/i18n/es.ts`
- Modify: `frontend/src/i18n/zh.ts`
- Modify: `frontend/src/lib/i18n.tsx`
- Modify: `frontend/src/app/(dashboard)/**/page.tsx`
- Modify: `frontend/src/app/(dashboard)/layout.tsx`
- Modify: `frontend/src/app/(dashboard)/error.tsx`
- Modify: `frontend/src/app/(dashboard)/client/jobs/[id]/execution-plan.tsx`
- Modify: dashboard-facing files under `frontend/src/components/`
- Modify: `frontend/src/lib/utils.ts` when status labels require locale-aware formatting

- [ ] Define an identical explicit key tree for shared, client, developer, and admin UI in all four dictionaries.
- [ ] Type `t()` with `TranslationKey`, remove arbitrary-key and English-fallback behavior, and support named interpolation tokens needed by dynamic dashboard labels.
- [ ] Replace dashboard static JSX strings and state messages with `t()` lookups.
- [ ] Make formatted statuses and shared controls locale-aware without translating dynamic user/API data.
- [ ] Run `npm run check:localization -- --scope=dashboard-shared` and type-check; confirm every dashboard and shared route is covered.

### Task 5: Complete the four-locale behavioral smoke matrix

**Files:**
- Modify only localization or fixture files required by failures in `frontend/e2e/locales.spec.ts`.

- [ ] Run `npm run build`, then `PLAYWRIGHT_SERVER_COMMAND='npm run start -- --hostname 127.0.0.1 --port 3100' npx playwright test e2e/locales.spec.ts`; Playwright must wait for the configured URL and terminate the production server after the run.
- [ ] Confirm all locale/route combinations, shared states, and HTML language assertions pass against that production build.
- [ ] Keep API/auth fixtures minimal and deterministic; do not weaken assertions to accommodate untranslated output.

### Task 6: Full verification and release

**Files:**
- Modify only files required by issues found during verification.

- [ ] Run `npm run check:localization`, `npm run check:contrast`, and `npm run check:ui`.
- [ ] Run `npm run lint`, `npm run type-check`, `npm run build`, and the four-locale smoke matrix.
- [ ] Inspect the diff for accidental translation of code, identifiers, or dynamic data.
- [ ] Confirm `git status`, record the current local/remote `main` hashes, fetch, and stop if the remote diverged; commit the complete localization correction intentionally and push `main`.
- [ ] Before push/deploy, verify the actual cache path: `curl -fsSI https://taskmatch.ai/` must show Cloudflare is dynamic/non-caching, while `curl --resolve taskmatch.ai:443:127.0.0.1 -fsSI https://taskmatch.ai/` must identify the host LiteSpeed layer. If these facts differ, stop rather than invent a purge endpoint.
- [ ] Before rebuilding, record `OLD_SHA=$(git rev-parse HEAD^)`, resolve the current frontend image ID with `docker compose images -q frontend`, resolve its Compose image name with `docker compose config --images`, and tag it as `<compose-image>:rollback-$OLD_SHA`.
- [ ] Run `docker compose build --no-cache frontend`, `docker compose up -d --no-deps --force-recreate frontend`, and `docker compose restart nginx`.
- [ ] Do not flush Redis: locale state is browser-local and the repository has no localization cache keys. Recreating the image/container replaces the compiled Next cache; remove no shared host or Redis data.
- [ ] Because Cloudflare is verified dynamic, issue no Cloudflare purge. Purge only the verified host LiteSpeed entries with `curl --resolve taskmatch.ai:443:127.0.0.1 -fsS -X PURGE https://taskmatch.ai/` and repeat for `/resources/documentation`; require successful HTTP responses and do not issue wildcard/domain-wide purges. The Compose Nginx service on `127.0.0.1:8091` is not the purge target.
- [ ] Verify `https://taskmatch.ai/`, `https://taskmatch.ai/resources/documentation`, and `https://taskmatch.ai/health` externally plus the four-locale Playwright matrix with `PLAYWRIGHT_BASE_URL=https://taskmatch.ai` and web-server startup disabled.
- [ ] If health or locale verification fails, retag `<compose-image>:rollback-$OLD_SHA` as `<compose-image>:latest`, run `docker compose up -d --no-deps --force-recreate frontend`, restart nginx, repeat the two scoped PURGE requests, and report the failed check.
