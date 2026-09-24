# Stripe delivery — 2026-09-24

Implemented Checkout capture before execution, immutable funding snapshots,
Connect hosted onboarding, separate transfers after client acceptance, signed
webhook ingestion and a PostgreSQL outbox with independent execution/finance
consumers. Refunds reverse transfers first. Historical jobs remain explicitly
manual. New production work fails closed without verified funding.

Recovery covers repeated Checkout creation, stale responses, lost transfer
responses, refund failures, worker lease replacement and process restarts.
Operators can retry blocked operations and reconcile canonical Checkout/Connect
references. All actions validate amount/currency/mode/ownership and preserve
billing proof. Earnings separate currencies and distinguish bank payouts from
Stripe transfers.

Verification evidence is archived privately alongside deployment backups.
Backend: **374 tests passed** in the final integrated suite. Frontend: 81 browser
cases passed, 4 real-API browser cases skipped without their isolated instance;
10 unit cases passed, with types/lint/accessibility/copy contracts and production
builds passing. PostgreSQL migrations verified legacy backfill, constraints,
upgrade/downgrade and refusal to erase financial evidence.

A real Stripe sandbox Checkout completed through the hosted browser with the
official test card. Canonical Stripe objects confirmed 100 USD cents captured,
then a full successful refund. Connect account creation and hosted onboarding link
succeeded in sandbox; browser onboarding stopped at Stripe's CAPTCHA. No claim of
a real Connect bank payout is made. Transfer/reversal/recovery paths were tested
against controlled Stripe HTTP responses and PostgreSQL.

Production uses the verified existing platform Stripe account with dedicated
TaskMatch platform and Connect webhook endpoints/signing secrets. Other
applications' handlers ignore the TaskMatch namespace. Credentials are private;
no keys or full Checkout URLs belong in this report. No live charge, transfer or
refund was made as a test. Developer KYC and bank-account activation remain steps
performed by the developer with Stripe before funds can be transferred.

Deployment and live read-only verification are recorded after the final gate.
See [Stripe operations](STRIPE-OPERATIONS.md) for recovery procedures.
