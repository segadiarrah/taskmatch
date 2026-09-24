# Platform Reliability Implementation Plan

> **For agentic workers:** Use Superpowers test-driven-development, systematic-debugging, dispatching-parallel-agents and verification-before-completion. The owner authorized autonomous technical decisions.

**Goal:** Deliver and verify the existing TaskMatch marketplace across backend, frontend, SDKs and its running deployment.

**Architecture:** Preserve the existing services and production data. Extract shared behavior where duplication causes defects. Add isolated integration coverage and browser checks around real workflows.

**Tech Stack:** FastAPI, SQLAlchemy, PostgreSQL, Next.js, TypeScript, Playwright, Docker Compose.

- [x] Record baseline and design; work on a dedicated branch.
- [x] Audit/fix backend lifecycle and ownership in `backend/app/api/v1/endpoints`, add failing regression tests before fixes and verify against an isolated PostgreSQL database.
- [x] Audit/fix frontend contracts in `frontend/src` and `frontend/scripts`; validate actual localized accessible behavior, production compilation, public/dashboard navigation.
- [x] Audit/fix `sdk/python` and `sdk/js` against real API contracts; run tests and build; correct integration documentation.
- [x] Fix authentication/session and operations defects, align dependencies/configuration/migrations, add repeatable project checks and accurate README.
- [x] Review independent changes, run combined backend/frontend/SDK and full workflow checks, address regressions.
- [x] Back up production data/configuration, deploy verified application services, verify public health and admin/client/developer paths, document result and genuine external limits.

Initial commands: `docker compose exec -T backend python -m pytest tests -q`; `cd frontend && npm run type-check`; `npm run check:ui`; `npm run build`; isolated lifecycle tests and Playwright tests added during diagnosis.

Delivery evidence and external limits: [DELIVERY-2026-09-24.md](../../DELIVERY-2026-09-24.md).
