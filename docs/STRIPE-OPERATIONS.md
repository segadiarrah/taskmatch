# Stripe operations

TaskMatch uses Checkout for upfront capture and Connect separate charges/transfers
for external developers. Money stays on the platform Stripe balance until an
eligible transfer; this is not a regulated escrow product. Stripe bank payouts
are distinct from application transfer status. USD, EUR and GBP are supported.

## Configuration and deployment

Configure `PAYMENT_MODE=stripe`, `STRIPE_MODE=live`, a mode-matched
`STRIPE_SECRET_KEY`, `BILLING_SITE_URL=https://taskmatch.ai`, and dedicated
`STRIPE_WEBHOOK_SECRET` / `STRIPE_CONNECT_WEBHOOK_SECRET`. Runtime secrets belong
in private environment configuration, never source control. The API version is
pinned to `2024-06-20` and requires compatibility testing before changing it.

Create two Stripe webhook endpoints:

- Platform: `https://taskmatch.ai/api/v1/billing/webhook`; events
  `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `checkout.session.async_payment_failed`, `checkout.session.expired`,
  `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`,
  `charge.dispute.created`, `charge.dispute.closed`, `refund.updated`, `refund.failed`.
- Connected accounts: `https://taskmatch.ai/api/v1/billing/webhook/connect`;
  `account.updated`, with Connect events enabled.

On the shared Stripe platform all TaskMatch objects carry `metadata.app=taskmatch`
and `taskmatch_*` identifiers. Checkout client references are `taskmatch:<UUID>`.
Never use another application's metadata namespace or webhook signing secret.

Back up the database and private environment, build backend/worker/frontend, run
`alembic upgrade head`, then start `backend billing-worker frontend` and reload
nginx. API readiness includes a billing heartbeat no older than 90 seconds in
production. The worker also has a container health check. Monitor failed/blocked
operations in Admin → Payments and container health/logs. Alert on sustained
unhealthy containers or an increasing oldest pending operation age.

Migration 004 marks all existing jobs `legacy_manual` without inventing Stripe
payments. New jobs default to Stripe. The old manual actions reject Stripe jobs.
Downgrade refuses to drop any persisted billing proof: after billing activity,
restore compatible application code or perform a reviewed forward migration.
Never roll back the database over new payments.

## Contracts and recovery

Checkout prices and metadata come from an immutable persisted quote snapshot.
Neither return URL parameters nor browser-supplied amounts prove payment. Signed
webhooks are deduplicated and durably queued, and the worker retrieves current
Stripe objects before applying them. Refunds/disputes freeze execution/transfers.

The worker claims operations with PostgreSQL locks and leases fenced by claim attempt. Separate consumers keep long AI execution from occupying the financial queue. Stripe mutations
use stable idempotency keys; unknown responses remain reserved. Do not clear
references, operation payloads or `external_started_at` manually. After 20 hours
unknown mutations fail closed rather than risk a new charge/transfer after Stripe
idempotency expiry. Transfers reconcile against canonical remote evidence.

For an unknown Checkout creation, retry within 20 hours reuses the exact original
request. After that, locate its Checkout Session in Stripe by TaskMatch metadata.
An authenticated administrator can POST `/api/v1/billing/jobs/<job-id>/reconcile`
with `{"session_id":"cs_live_..."}`. The server retrieves Stripe and validates
amount, currency, mode, ownership and generation before binding it. This operation
cannot charge a card. A client cannot use the administrator reconciliation route.

For an unknown Connect account creation, locate the account by TaskMatch metadata and POST `/api/v1/billing/connect/<user-id>/reconcile` as an administrator with `{"account_id":"acct_..."}`. This GET-only Stripe reconciliation validates the existing local reservation, developer metadata, country and mode; it neither creates an account nor resets the replay clock.

After fixing a failed/blocked operation, use Admin → Payments → Retry. Retries
preserve proof and the original reservation. Connect onboarding collects identity
and banking details on Stripe, not in TaskMatch. A developer's transfer stays
blocked until both transfers and payouts are enabled. Stripe country eligibility,
KYC, platform review and bank payout timing remain controlled by Stripe.

Full refunds are administrator-only. They freeze work, reverse existing developer
transfers, then request the customer refund. Processing transfers must reconcile
first. Failed refunds require a verified terminal failure before a new attempt;
pending or uncertain outcomes keep their existing identity. Insufficient connected
account funds or Stripe restrictions leave a visible blocked operation. Partial
external refunds and disputes require operator review; never silently resume work.

## Verification

Use `python -m scripts.run_isolated --database taskmatch_stripe_verify_test` in the
backend container with this checkout mounted. It injects dummy Stripe credentials,
disables LLM calls and isolates both application/test database URLs. The database
name must end in `_test`; schema recreation never targets the production database.
Gateway/Connect/Checkout/processor/worker tests use the real HTTP serialization and
PostgreSQL boundary with controlled Stripe responses. Browser regression tests
cover Checkout redirects, failure/retry states, Connect and operator actions.

Real Stripe sandbox tests must use a separate test key and test objects. Never use
a live card, transfer or refund as a smoke test. Live verification is limited to
account/configuration health, signed endpoint delivery and read-only status checks.

References: [fulfillment](https://docs.stripe.com/checkout/fulfillment),
[separate charges/transfers](https://docs.stripe.com/connect/separate-charges-and-transfers),
[webhooks](https://docs.stripe.com/webhooks),
[idempotency](https://docs.stripe.com/api/idempotent_requests).
