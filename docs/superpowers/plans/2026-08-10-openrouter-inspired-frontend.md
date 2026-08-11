# OpenRouter-Inspired Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework TaskMatch into a polished, light, minimal interface inspired by OpenRouter while preserving the current content and application flows.

**Architecture:** Use the existing Tailwind token layer as the main migration boundary, then refine the shared public, auth, dashboard, and UI shell components. Keep page-level business components and copy intact so the visual change remains low risk and globally consistent.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Playwright, Node-based UI contract checks.

---

### Task 1: Visual contract

**Files:**
- Create: `frontend/scripts/check-visual-style.mjs`
- Modify: `frontend/package.json`

- [ ] Add source-level assertions for the neutral light palette, violet accent, typography, radii, and shared shell markers.
- [ ] Run `npm run check:visual` and confirm it fails against the previous dark console theme.

### Task 2: Global design system

**Files:**
- Modify: `frontend/tailwind.config.ts`
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/scripts/check-design-contrast.mjs`

- [ ] Replace the warm near-black/orange system with a neutral near-white/graphite/violet system.
- [ ] Replace the editorial serif pairing with a crisp sans pairing and restrained mono face.
- [ ] Reduce decorative grids, glow, grain, and heavy shadows while retaining accessible focus and motion behavior.
- [ ] Run the visual and contrast contracts.

### Task 3: Shared surfaces and navigation

**Files:**
- Modify: `frontend/src/components/public/site-chrome.tsx`
- Modify: `frontend/src/components/public/page-shell.tsx`
- Modify: `frontend/src/app/(auth)/layout.tsx`
- Modify: `frontend/src/app/(dashboard)/layout.tsx`
- Modify: `frontend/src/components/ui/button.tsx`
- Modify: `frontend/src/components/ui/card.tsx`
- Modify: `frontend/src/components/ui/badge.tsx`
- Modify: `frontend/src/components/ui/input.tsx`
- Modify: `frontend/src/components/ui/select.tsx`
- Modify: `frontend/src/components/ui/table.tsx`

- [ ] Make navigation compact and quiet, with a clean wordmark and restrained active states.
- [ ] Flatten cards and fields into white surfaces with precise gray borders and subtle shadows.
- [ ] Simplify auth and dashboard chrome without changing routes, role filtering, or actions.
- [ ] Run UI and localization contracts.

### Task 4: Verification

**Files:**
- No production files expected.

- [ ] Run `npm run type-check`, `npm run check:ui`, `npm run check:contrast`, and `npm run check:visual`.
- [ ] Run `npm run build`.
- [ ] Capture representative public, auth, and dashboard views with Playwright and inspect them at desktop and mobile widths.

