# Commercial launch operations

New missions use a prepaid EUR quote: task subtotal plus 10% platform fee. Provider
cost, orchestration, validation and a bounded retry allowance are included in the
task price. Accepted quotes and historical currencies are not rewritten.

## Provider configuration

`EXECUTION_PROVIDER` explicitly chooses the provider for new AI quotes (default
`openai`). Its enabled account and selected model must be usable and have verified
prices. The admin provider page refreshes account-visible, priced text models;
refreshing never enables a provider. A catalog response is not a generation test.
Planning still uses the separate global `LLM_MODEL` / `OPENAI_BASE_URL` settings.

Each accepted AI quote freezes provider, model, endpoint, rate version, USD/EUR
conversion, token limits, attempts and maximum EUR cost. Direct-provider rate
increases block execution for review; OpenRouter requests enforce price ceilings.
Review the configured FX assumption before changing future quote pricing.
No automatic switch to another provider or additional client charge occurs.

## Task execution and human work

The billing worker runs independent financial and task execution consumers.
Each task is an outbox operation. A failure leaves successful sibling results
intact. Retries have an expiring lease, fenced claim and task generation. Every
attempt reserves its worst-case cost before the network call; crashes and unknown
outcomes retain that reservation. The cumulative task counters survive revisions,
reassignment and manual retries. Maximum three provider calls per frozen budget.

Human tasks without existing ownership are assigned to the active admin account
`sega@taskmatch.ai` through the internal `human-sega` executor. Pending, submitted
and completed ownership is preserved. The assigned human deposits the real work
on the admin task detail page. Automated structure checks do not approve human
work. Hybrid AI work requires explicit Sega review. A human cannot approve their
own work; the client or another administrator reviews a manual human repair.
Platform-owned work produces no Stripe Connect transfer to Sega.

## Operator recovery

Use the task detail execution panel to inspect the operation and its safe error.
Refresh execution also refreshes submissions. The API execution state includes
per-attempt provider/model, reserved cost, outcome and returned usage.

- **Retry task** only resumes this unfinished task with remaining budget and valid
  funding. It cannot reset cumulative calls or costs.
- **Reassign** repairs a blocked/failed task with an active executor and an audit
  reason. It cancels prior active/pending ownership and fences old generations.
  An automated repair must retain the accepted provider route and remaining
  budget. Internal human repair may resolve exhausted AI work. External repair
  requires an existing priced bid within the unspent allocation. Work with an
  existing settlement allocation cannot silently change beneficiary.
- **Historical recovery** first previews a provider and exact maximum EUR cost,
  then requires explicit approval of that amount and accepted quote ID. It writes
  an operational snapshot, never changes the accepted quote, and never replays all
  old jobs. Non-EUR historical AI work requires a reviewed replacement quote or
  manual repair; no EUR/USD relabelling is allowed.
- **Cancel/refund** uses the existing full-mission refund flow. Partial deliveries
  and partial refunds are not offered at launch. Do not manually mark failed work
  complete to release money.

Funding is checked before reservation and before accepting a result. A refund or
payment dispute during a provider call prevents its output from entering delivery.
The reserved uncertain spend remains visible. Checkout return URLs alone never
fund work; verified server-side Stripe state does. Transfers require client
acceptance and an eligible Connect account; transfer creation is not a guarantee
of bank arrival.

## Release and rollback

Follow [OPERATIONS.md](OPERATIONS.md) and [STRIPE-OPERATIONS.md](STRIPE-OPERATIONS.md).
No new database migration is needed for this release: task snapshots and history
use existing JSON and outbox columns. Back up the database, provider volume,
environment, source and images before integration. Backend source is bind-mounted,
so update it only after worker/API shutdown and restart them on the same revision.
Preserve unrelated mobile work. Never restore a stale database over new payments
as an ordinary rollback. Restore compatible code/images first and reconcile any
uncertain operations using their durable evidence.

Before enabling new quotes, verify an active, admin-owned `llm-<EXECUTION_PROVIDER>`
agent exists. Updating provider settings synchronizes existing executor status;
it does not create a missing platform profile. Do not run demo seeding scripts
against production to provision it.
