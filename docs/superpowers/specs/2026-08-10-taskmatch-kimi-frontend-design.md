# TaskMatch Kimi Frontend Design

## Approved direction

Finalize the existing Kimi redesign under the **Dispatch Ledger** concept. The interface combines a warm near-black operations console with editorial paper sections, signal-orange accents, Fraunces display typography, Archivo interface copy, and JetBrains Mono for operational data.

## Scope

- Preserve the current information architecture and backend contracts.
- Apply the approved visual language consistently across public, authentication, client, developer, and admin routes.
- Keep the public experience editorial and expressive while keeping dashboards dense, legible, and operational.
- Finish responsive behavior, keyboard/focus states, reduced-motion behavior, semantic status colors, and empty/loading/error states.
- Remove visual leftovers from the previous light/zinc theme.
- Validate TypeScript, linting, and the production build without changing product behavior.

## Acceptance criteria

1. Every route emitted in the Next.js production build table compiles successfully; route coverage is checked from the route manifest rather than a hard-coded count.
2. TypeScript reports no errors.
3. ESLint runs non-interactively and reports no errors.
4. No previous-theme surface utilities (`bg-zinc-*`, `border-zinc-*`, `bg-gray-*`, `border-gray-*`, or `bg-white`) remain under `frontend/src/**/*.tsx`. Semantic white/gray text is allowed only where contrast requires it.
5. The shared design tokens remain the source of truth for color, typography, radius, and motion.
6. Animation respects `prefers-reduced-motion` and interactive controls expose visible focus treatment.
7. Existing Kimi changes remain intact unless a change is required for consistency or correctness.
8. Representative public, authentication, client, developer, and admin routes have no horizontal clipping at 390 px, expose visible keyboard focus, and retain legible loading, empty, success, and error states. Reduced-motion mode removes decorative movement.
