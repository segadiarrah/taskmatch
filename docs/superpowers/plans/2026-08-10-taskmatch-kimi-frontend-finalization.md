# TaskMatch Kimi Frontend Finalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish and verify the approved Kimi “Dispatch Ledger” redesign across the complete TaskMatch frontend.

**Architecture:** Preserve the current Next.js App Router structure and API behavior. Finalization is performed through shared Tailwind/CSS tokens and shared UI/public-shell components first, followed by route-level consistency checks and production validation.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide React, native Next.js ESLint integration.

**Working directory for all npm commands:** `frontend/`

---

### Task 1: Establish executable quality gates

**Files:**
- Create: `frontend/.eslintrc.json`
- Modify: `frontend/next.config.js`

- [ ] Capture the complete approved frontend patch as `/tmp/taskmatch-kimi-approved-baseline.patch` and a SHA-256 manifest of `frontend/src` as `/tmp/taskmatch-kimi-approved-baseline.sha256`, in addition to `git status --short` and `git diff --stat`. Use the baseline patch to distinguish finalization edits inside already-modified files.
- [ ] Run `npm run lint` and confirm it stops at the interactive configuration prompt.
- [ ] Add a checked-in Next.js ESLint configuration.
- [ ] Run `npm run lint` and record all actionable errors and warnings.
- [ ] Keep build-time linting enabled once the lint gate is deterministic.

### Task 2: Audit shared design-system consistency

**Files:**
- Modify as required: `frontend/src/app/globals.css`
- Modify as required: `frontend/tailwind.config.ts`
- Modify as required: `frontend/src/components/ui/*.tsx`
- Modify as required: `frontend/src/components/public/*.tsx`
- Modify as required: `frontend/src/components/gdpr/*.tsx`
- Modify as required: `frontend/src/components/language-switcher.tsx`
- Modify as required: `frontend/src/app/layout.tsx`
- Modify as required: `frontend/src/app/loading.tsx`
- Modify as required: `frontend/src/app/not-found.tsx`
- Modify as required: `frontend/src/app/page.tsx`
- Modify as required: `frontend/src/app/(dashboard)/error.tsx`

- [ ] Scan all `frontend/src/**/*.tsx` for `bg-zinc-*`, `border-zinc-*`, `bg-gray-*`, `border-gray-*`, and `bg-white`; review any semantic `text-white`/`text-gray-*` separately rather than banning it automatically.
- [ ] Check focus-visible, reduced-motion, status colors, typography, and surface contrast.
- [ ] Correct only concrete inconsistencies found by the audit.
- [ ] Run `npm run type-check` after shared changes.

### Task 3: Audit route-level completion

**Files:**
- Modify as required: `frontend/src/app/(auth)/**/*.tsx`
- Modify as required: `frontend/src/app/(public)/**/*.tsx`
- Modify as required: `frontend/src/app/(dashboard)/**/*.tsx`

- [ ] Inspect public, authentication, client, developer, and admin route families.
- [ ] Fix missing accessible labels, invalid nesting, clipped responsive layouts, and inconsistent state treatments.
- [ ] Smoke-check `/`, `/login`, `/client`, `/developer`, and `/admin` at 390×844 and 1440×900 where authentication permits; require no horizontal document overflow and no clipped primary action.
- [ ] Keyboard-check navbar/menu, dialog close, form controls, and one disclosure: every actionable element must have a visible focus indicator and an accessible name.
- [ ] Check reduced-motion mode on `/`: reveal content must remain visible and marquee/scan/counter animation must not continue perceptibly.
- [ ] Measure primary text/surface and status text/surface color pairs with the WCAG relative-luminance formula; require at least 4.5:1 for normal text and 3:1 for large text/UI boundaries.
- [ ] Check states using exact fallbacks: global loading in `src/app/loading.tsx`; dashboard error in `src/app/(dashboard)/error.tsx`; empty collections in `/client/jobs`, `/developer/agents`, and `/admin/tasks`; form success/error in `/company/contact` and auth pages. When the backend/seed state cannot reach a branch, inspect that branch at source level and record it as source-verified rather than browser-verified.
- [ ] Re-run the static legacy-theme scan.
- [ ] Run `npm run lint` and `npm run type-check`.

### Task 4: Production verification

**Files:**
- Verify: `frontend/src/**/*`

- [ ] Run `npm run lint` with zero errors.
- [ ] Run `npm run type-check` with zero errors.
- [ ] Run `npm run build` and confirm every route listed in the generated route table succeeds.
- [ ] Generate a final patch, subtract/review it against `/tmp/taskmatch-kimi-approved-baseline.patch`, and inspect every finalization-only hunk. Explain every newly touched file and confirm no API request shape, route destination, or form workflow was intentionally changed.
- [ ] Review `git diff --check` and the final diff summary for accidental whitespace or unrelated changes.
