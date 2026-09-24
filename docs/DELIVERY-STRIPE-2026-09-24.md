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

Deployed commit `de2dc4c` to https://taskmatch.ai with schema 004. Backend and
billing worker containers are healthy; `/health/ready` returns 200. Production
Alembic metadata check reports no missing changes. Authenticated billing config
reports live Checkout and Connect enabled; administrator funding, operation and
ledger endpoints return 200. Both public webhook routes accept valid dedicated
signatures and reject invalid ones with 400; the synthetic probes were ignored
without financial operations. Stripe confirms both dedicated live endpoints are
enabled at the pinned API version. All 30 historical jobs remain `legacy_manual`;
there were zero Stripe funding/operation rows at the post-deployment smoke check.

Private deployment backups and verification logs:
`/home/almalinux/taskmatch-backups/2026-09-24-stripe/`. Prior source, environment,
database and images are retained for reviewed recovery.
See [Stripe operations](STRIPE-OPERATIONS.md) for recovery procedures.


Post-deployment data verification found Decimal strings affecting admin totals and
historical `provider=stripe` labels hiding manual actions. Patch `79d729c` explicitly
serializes numeric amounts, exposes the job's billing policy, preserves historical
manual actions, rejects invalid UI amounts and counts only confirmed platform
revenue. Its targeted backend suite passed **57 tests**; **16 browser cases** and
the frontend checks passed, and production Docker images built successfully.

The final real-browser production smoke confirms no NaN totals or JavaScript
exceptions, 18 historical labels, five manual record-payment actions and two
manual release actions. No settlement button was clicked. The temporary frontend
server on port 3111 was stopped. The production Connect endpoint correctly denies
an administrator acting as a developer. The live financial account remains
unchanged by smoke tests.
