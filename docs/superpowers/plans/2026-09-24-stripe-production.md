# Stripe Production Implementation Plan

> Use Superpowers TDD, independent bounded parallel implementation and review, then verification-before-completion. Owner delegates decisions and deployment.

**Goal:** Replace new-job manual payment claims with real Stripe funding, Connect payouts and verified refund/reconciliation flows.
**Architecture:** Dedicated records and PostgreSQL outbox, async Stripe HTTP gateway, existing job lifecycle gates, hosted UI flows.
**Tech Stack:** FastAPI, SQLAlchemy/PostgreSQL, httpx, Next.js, Playwright, Docker Compose.

- [ ] Root: models `billing.py`, migration004, config, billing routes and funding DTO/service; tests first for checkout/webhook/idempotency.
- [ ] SDK/contracts agent: Stripe gateway and Connect service/routes in separate modules; gateway signature/currency/error/idempotency tests and Connect isolated integration tests.
- [ ] Backend lifecycle agent: Job billing policy, guarded quote/execution/matching/assignment, frozen checkout edits, ledger allocations and outbox payout hooks; explicit legacy fixtures + negative funding gate tests.
- [ ] Frontend agent: client Checkout and verified return, Connect onboarding/status, real admin funding/refund/transfer states, translations and browser regressions.
- [ ] Root: durable worker, payment confirmation, transfer/refund/reversal processors; concurrency and restart tests.
- [ ] Review combined money flow independently; migrations from actual prior schema and round trip; full backend/frontend/browser/SDK checks.
- [ ] Provision private Stripe test/live configuration and dedicated webhook; actual sandbox checks without live money movement.
- [ ] Backup, merge verified branch, deploy API/web/worker, public health/webhook/admin/client/developer read-only checks, delivery evidence and commit.
