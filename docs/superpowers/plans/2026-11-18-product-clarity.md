# Product clarity and visible backoffice integration

> Execute using subagent-driven-development and independent review. Prior user autonomous authorization applies; no additional approval gate.

**Goal:** preserve TaskMatch marketplace and make the added human capability understandable and usable.
**Architecture:** existing routes, role-aware auth intents and shared localized action components; one read-only admin aggregate endpoint.
**Stack:** Next.js/TypeScript/Playwright, FastAPI/SQLAlchemy/PostgreSQL.

- [x] Inspect production, permissions, public destinations and unchanged dashboards; isolate worktree.
- [x] Public: revise five-language landing/company/metadata copy, restore distinct AI project and AI executor paths with compatible auth intents; retain human deep links and add human feature section. Test routing and registration roles.
- [x] Backoffice: shared five-language action surfaces in client/developer/admin; clear sidebar links, admin counts and review destinations; test real navigation and empty/error states on mobile.
- [x] Backend: admin-only Human Tasks counts with no PII or financial mutations; regression tests for counts and permissions.
- [x] Independent requirement/code review, localization contracts, checks and complete browser regression on built image (216 passed, 4 optional skipped).
- [x] Back up, build, candidate deployment, live five-language and authenticated smoke, canonical switch and cleanup. Full backend: 595 passed/exit 0; production: 25 public + 10 admin views across five languages, zero writes.
- [ ] Publish code/release evidence and send authorized delivery report.
