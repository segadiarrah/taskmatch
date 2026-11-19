# All journey verification

**Goal:** test every web product journey, report the actual coverage and fix regressions.
**Approach:** preserve production data and existing marketplace; use the deployed application images with isolated PostgreSQL/Redis, real HTTP and browser sessions. Provider payment/LLM boundaries remain explicit fixtures. Production browsing is read-only. Prior autonomous correction/deployment authorization persists.

- [x] Inspect current deployed revision, instructions, routes, test inventory and optional skipped journeys.
- [x] Map public/auth/client/developer/human/admin/protocol/SDK journeys to concrete tests and evidence; identify gaps.
- [x] Provision disposable databases, accounts, legacy API and paid Human Tasks API. Guard fixture tooling against production URLs/settings.
- [x] Execute the previously skipped real API/browser AI lifecycle and all role dashboards.
- [x] Execute direct and delegated Human Tasks through real APIs/browser, including verification, funding, delivery/rework/review/acceptance and privacy/permission denials.
- [x] Execute full backend and browser regression, frontend checks, SDK suites and route coverage in five languages.
- [x] Read-only production verification of public and authenticated route families; inspect failures and create regression tests before fixing code.
- [x] Finish transaction-boundary correction revealed by the real Next proxy: function-scoped database dependencies, commit/serialization rollback regressions, full backend/browser rerun.
- [x] Review evidence, deploy any necessary fixes with backups and candidate verification, and repeat affected journeys.
- [x] Save docs/testing/ALL_JOURNEYS_2026-11-18.md with clear passed/failed/unverified/provider-simulated distinctions, publish and send authorized report; remove fixtures.
