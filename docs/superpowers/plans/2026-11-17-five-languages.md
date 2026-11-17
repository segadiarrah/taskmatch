# Five-language localization implementation plan

> For agentic workers: use superpowers:subagent-driven-development and independent review. Prior autonomous execution authorization applies; implement without a new approval gate.

**Goal:** every TaskMatch page and interface state is available in EN/FR/ZH/ES/PT.
**Architecture:** existing typed locale dictionaries and local content bundles; complete editorial/admin translations and stricter static contracts.
**Tech Stack:** Next.js 16, React 19, TypeScript, AST localization checks, Playwright, FastAPI taxonomy.

- [x] Inspect the current production source, instructions and localization exclusions; isolate changes in taskmatch-languages from production's mobile/README changes.
- [x] Core: add pt locale/dictionary, preserve storage/browser detection, add Portuguese Human Tasks labels and language choices, localize shared states and visible metadata.
- [x] Public/auth/legal: add explicit Portuguese text to all existing public bundles outside resources/changelog; maintain the neutral payment wording.
- [x] Resources/editorial: translate full articles and changelog into all five languages, add Portuguese to guides/docs/API/SDK/security bundles, remove English-only rendering notices.
- [x] Administration: localize all admin routes, confirmations, statuses and known server errors in five languages, using a dedicated dictionary without changing wire values or permissions.
- [x] Contracts: remove deliberate English-only exemptions, require five-locale parity, add focused failing tests for pt support/complete content and extend browser coverage.
- [x] Review: verify coverage against route inventory and independently review translation completeness and implementation quality.
- [x] Validate: frontend checks, production build, full browser regression on built image, and backend catalog/contract regressions if changed.
- [x] Release: back up source/images/config, publish the branch, deploy a candidate frontend, verify all five languages, replace canonical frontend and reload the directory-mounted proxy, drain candidates.
- [x] Record final evidence and deployed checks in docs/architecture/FIVE_LANGUAGES_RELEASE.md.
- [ ] Send the authorized delivery report and notify user.
