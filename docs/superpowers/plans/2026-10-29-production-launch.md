# Taskmatch Production Launch Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. Independent frontend and model work may run alongside workflow work with exclusive file ownership.

**Goal:** Ship the approved current-model, resilient-workflow, Sega-human-fallback and prepaid EUR launch scope.

**Architecture:** Retain PostgreSQL billing outbox, funding gates and Stripe contracts. Extend durable operations to individual tasks with fenced attempts and bounded cost reservations. Bind quotes to actual provider routes; expose human execution in existing administration.

**Tech Stack:** FastAPI, SQLAlchemy async/PostgreSQL, HTTPX/OpenAI, Next.js 14, pytest and Playwright.

## Task 1 — Provider routes and quote economics
Files: services/providers.py, llm_service.py, pricing_service.py, quote_service.py; new model_catalog.py; schemas/job.py; provider admin endpoints only; focused tests.
- [x] Add failing tests for recent catalog coverage, invalid selection rejection, provider-specific requests, unknown cost refusal, immutable execution snapshots and EUR quoting.
- [x] Verify current official IDs/prices, access capabilities and reasoning parameters. Retain legacy model rates for historical compatibility.
- [x] Preserve the last valid catalog and verification timestamps on failed refresh; never enable disabled providers as a side effect. Add failed-refresh regression.
- [x] Implement provider discovery with bounded HTTP timeouts and safe error/status fields; route calls through configured provider, return genuine results and usage.
- [x] Snapshot provider/model/rates/FX/max token and cost budget per task quote. New stripe jobs/devis in EUR; preserve historical accepted snapshots.
- [x] Run provider, LLM, pricing, quote and schema regressions. Commit owned files.

## Task 2 — Independent task execution and Sega fallback
Files: new services/task_execution.py; endpoints/jobs.py, submissions.py; services/billing_worker.py, workflow_service.py, mcp_service.py; tests/test_task_execution.py and related tests.
- [x] Add failing integration cases: successful siblings survive one provider failure; human assignment without LLM; admin-owned human submission; retries and funding freeze.
- [x] Both worker lane filters classify execute and execute_task as execution, with regression proving slow task work cannot block Stripe events/refunds.
- [x] Add a read-only eligibility preview for explicitly selected historical recovery. Legacy quotes without snapshots need an explicit operator route/budget reservation at the existing accepted price before re-execution; never infer funding or auto-replay history.
- [x] Job execution schedules one durable execute_task operation per task/generation. Reuse existing outbox leases and attempt fencing; isolate long provider work from DB transactions.
- [x] Reserve provider-call budget before network; store usage/results after generation only if task, funding and fencing still valid. Unknown outcomes retain reservation. Retry only unfinished work within bounded attempts/budget.
- [x] Assign eligible human work to active Sega profile idempotently. Preserve prior assignments and completed tasks. Hybrid producer and reviewer stay distinct; structure validation cannot approve hybrid work.
- [x] Expose owner-only admin submission and operation retry, review and explicit failure resolution via existing refund flows. Never auto-charge historical jobs.
- [x] Run funding, lifecycle, worker, review and concurrency regressions. Commit owned files.

## Task 3 — Public and admin UI
Files: frontend only, principally pricing, landing-copy, new-job currency, admin task detail and providers page; browser tests.
- [x] Replace subscription/seat/unlimited claims with prepaid mission quotes and 10% itemized fees across locales. Default new requests to EUR.
- [x] Add real admin human submission form using task/agent/assignment ownership, pending review and failures. Show per-task execution/retry information from backend.
- [x] Keep existing design, expose provider discovery/check failures, align payment wording with verified capture/acceptance/transfers.
- [x] Run npm check, production build and focused Playwright tests. Commit owned files.

## Task 4 — Integration, review and release
- [x] Spec compliance review followed by code quality review; resolve every material finding.
- [x] Run full backend suite on dedicated *_test DB with dummy Stripe credentials and LLM disabled. Run frontend checks/build and meaningful browser regressions.
- [x] Verify migration/schema compatibility, run bounded real-provider smoke calls only with synthetic content, verify Stripe configuration read-only; use sandbox for monetary scenarios.
- [x] Save release evidence and operational recovery instructions. Prepare code/env/database backup and artifact builds before requesting any final release approval that is necessary.
- [x] Integrate without disturbing mobile files. No live payment/transfer/refund smoke, no historical replay without explicit operator selection.

## Test commands
Use the existing backend Docker image with this checkout mounted at /app, taskmatch network and env file; invoke `python -m scripts.run_isolated --database taskmatch_launch_<scope>_test <test paths>` (dummy financial keys and isolated application/test URLs). Never run bare integration pytest with production DATABASE_URL.
Frontend: `npm run check`, `npm run build`, `npx playwright test <focused spec>` against an isolated local frontend.

## Review contracts
Provider execution function must accept provider/model and return output plus actual usage; task quote breakdown contains execution snapshot. Workflow owner coordinates exact names with model owner before integration. Frontend owner coordinates admin task response additions with workflow owner. No concurrent edits to shared files or shared test databases.
