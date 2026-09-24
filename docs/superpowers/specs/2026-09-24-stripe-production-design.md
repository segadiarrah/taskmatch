# Stripe production design

Owner request: real Stripe payments, consistent with Tauraco applications, production grade. Existing owner mandate delegates technical decisions and deployment; no additional design approval gate is needed.

## Architecture and alternatives

Use hosted Checkout, collect the server-priced quote on the platform, and use separate Connect transfers after client acceptance. This supports multiple eventual developers per job. Destination charges require a known single recipient too early; long card authorizations can expire before delivery. Funds on the platform are not advertised as legal escrow. Hosted Stripe onboarding collects identity and bank details.

Keep Stripe API calls in an async HTTP gateway (same underlying pattern as Kankele/Tauraco), pin API 2024-06-20, namespace metadata `app=taskmatch`, namespace idempotency keys. New TaskMatch webhook endpoints/secrets; never reuse another application's signing secret. Existing Stripe account/credentials are reused privately, without changing other applications.

## Records and state

- Job.billing_mode: `stripe` for every newly created production job, `legacy_manual` only explicit migrated existing records. No inference from missing payment data. Config `PAYMENT_MODE` defaults stripe; legacy manual only development/test.
- JobFunding: immutable priced quote snapshot (unique quote_id), job/client ids, amount_minor, currency, livemode, status, generation, checkout_session_id/url/expires_at, payment_intent_id, charge_id, refunded_minor, last_error. Job stays quoted until verified payment. A pending checkout freezes repricing/delivery changes. Explicit cancellation expires the session at Stripe first.
- PaymentRecord remains task allocation/payout ledger; add funding_id, transfer_id, reversal_id, payout_error. Unique (funding_id, task_id). Internal admin-owned platform work is platform revenue, never transferred to an admin Connect account.
- StripeConnectAccount keyed user_id, Stripe account ID, country, transfers/payouts/detail flags and requirements. No bank or identity documents stored by TaskMatch.
- StripeEvent keyed Stripe event_id; valid signature, correct mode and known local object before processing. Raw body size and timestamp bounded. Other-app events ignored.
- BillingOperation: durable unique key, kind (stripe_event, execute, transfer, refund), entity_id, status, attempts, available_at, locked_until, last_error, payload. PostgreSQL worker uses SKIP LOCKED and leases; database commit precedes external side effects. Outbox and domain transition commit together.

## Checkout and execution

POST existing `/jobs/{id}/quote/accept` returns Stripe checkout session instead of opening tasks for stripe jobs. Also expose POST `/billing/jobs/{id}/checkout`. No client-supplied amount, currency, recipient, or return URL. Repeated click reuses an active session and stable idempotency key. Replay after unknown remote outcome uses same attempt; never blindly recreate money operations beyond Stripe's idempotency retention window.

GET `/billing/jobs/{id}` returns funding and payout state. POST `/billing/jobs/{id}/sync` retrieves the known Checkout/PaymentIntent from Stripe; redirect URL alone is never evidence. Signed webhook and sync share the same locked confirmation function: verify session ID, quote/client/app metadata, amount/currency/mode, actual paid payment intent. Then accept exact quote, set job bidding, open tasks and enqueue execution atomically. Worker retries execution after restart. All execution/assignment paths independently require this funding and follow Job-before-Task lock order. Missing configuration fails closed.

Cards only initially: authenticated hosted Checkout supports SCA; no delayed payment method is advertised. Relevant async events still handled defensively. Supported presentment currencies match product USD/EUR/GBP, with exact integer conversion and no float arithmetic.

## Payouts, refunds, disputes

Client acceptance enqueues each eligible external developer transfer, after verified paid funding and completed job. Transfers use the captured charge as source_transaction, fixed net amount and metadata; account transfers capability must be active. Incomplete onboarding leaves an explicit blocked payout, retried after onboarding. Platform work stays platform revenue. A transfer means credit to a connected Stripe balance, not proof of a bank payout.

Full refund is an admin operation with confirmation: lock/freeze funding and work first, prevent new transfers, reconcile/reverse existing transfers before refund, use persistent idempotent operation IDs. Refund is confirmed only by Stripe. Externally initiated partial refunds or charge disputes freeze future work/transfers and require review; do not invent automated dispute resolution. Existing legacy manual records remain clearly marked and cannot fabricate Stripe settlement.

Worker reports pending/failed/blocked operations and errors to admin without exposing provider secrets. Refund/transfer races serialize on funding reservation; network calls occur outside long transactions. Reconcile known Stripe IDs before replay; uncertain operations older than 20 hours fail closed for explicit reconciliation rather than risking duplication after key expiration.

## UI contracts

All paths below prefixed `/api/v1`:
- GET `/billing/config`: {enabled, mode: live|test|unconfigured, currencies:[USD,EUR,GBP], connect_enabled}.
- POST `/jobs/{id}/quote/accept` or `/billing/jobs/{id}/checkout`: {checkout_url:string|null, session_id:string|null, status:string, amount_minor:number, currency:string}. Legacy response remains supported explicitly.
- GET `/billing/jobs/{id}`: {billing_mode, status, amount_minor, currency, refunded_minor, receipt_url, checkout_url, can_checkout, can_cancel, payouts:[{id,status,amount_minor,currency,recipient_name,error}], error}. No funding yields unpaid for stripe, legacy_manual for legacy. Only owner/admin can read.
- POST `/billing/jobs/{id}/sync`: same funding status DTO; body empty.
- POST `/billing/jobs/{id}/cancel`: expire unpaid Checkout; same DTO.
- GET `/billing/connect`: {account_id|null, country|null, details_submitted, transfers_enabled, payouts_enabled, requirements:string[], enabled, mode}.
- POST `/billing/connect/onboarding`: body {country:string (ISO2, required on creation)} -> {url}; returns to `/developer/earnings?connect=return|refresh`.
- POST `/billing/connect/sync`: refresh account and retry blocked transfers -> same status DTO.
- POST `/billing/connect/dashboard`: authenticated Express dashboard link {url} where supported.
- POST `/billing/payments/{id}/retry`: admin, retry a blocked/failed Stripe transfer; no manual success mutation.
- POST `/billing/jobs/{id}/refund`: admin full refund only; {status}; queues real reversal/refund. Idempotent per funding.
- GET `/billing/admin/fundings?skip&limit`: funding rows with job title, payer, amounts, state, error, can_refund.
- GET `/billing/admin/operations?skip&limit`: durable operation status/error, excluding secret payloads.

Existing admin ledger adds funding_id, transfer_id, payout_error; UI retains manual controls only for provider manual. Client amount display uses minor units accurately; server-retrieved receipt links. Connect onboarding/checkout redirects allow only Stripe HTTPS hosts. Locales EN/FR/ES/ZH.

## Validation and release

Isolated PostgreSQL tests for gates, invalid signatures, mode/amount/currency mismatch, duplicate/out-of-order events, retries, durable recovery, concurrent checkout, refund/transfer safety, unauthorized reads, legacy preservation. Mock Stripe at HTTP boundary; no mocks of domain state. Browser tests cover redirect/cancel/return without trust, incomplete onboarding and failures. Run existing 200 backend/69 browser/SDK checks too.

Verify live account read-only. Use existing valid test keys for actual sandbox Checkout and webhook/reconciliation, with no live charge/refund/payout. Create dedicated live webhook configuration only after implementation/tests; activate via reversible deploy with backup, migrations and worker health. Document any account-side activation requirement that cannot be completed using existing authorized API access.

References: https://docs.stripe.com/checkout/fulfillment ; https://docs.stripe.com/connect/separate-charges-and-transfers ; https://docs.stripe.com/webhooks ; https://docs.stripe.com/api/idempotent_requests .
