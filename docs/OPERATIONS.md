# Operations and verification

## Services and configuration

`docker compose` serves the web application and `/api/v1` through nginx on
`127.0.0.1:8091` by default. The public HTTPS proxy forwards to this port.
The same database URL is used by FastAPI and Alembic. Set `ENV=production`, a
random `SECRET_KEY` of at least 32 characters, and explicit CORS origins for a
production installation. Internal health hosts remain allowed by TrustedHost.

Frontend public variables and the internal API rewrite are build-time arguments.
Changing `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_SITE_URL` requires rebuilding the
frontend. Keep the API base at `/api`, without `/v1`.

PostgreSQL and Redis data use named volumes. Provider settings, uploads and access
grant material depend on `backend_appdata` and the configured encryption key.
Preserve both the volume and environment during backup/restore.

## Checks

- `make test`: backend unit tests; PostgreSQL integration cases explicitly skip
  when no `TEST_DATABASE_URL` is supplied.
- `make test-integration`: creates `taskmatch_integration_test`, runs all backend
  tests, and refuses to use the application's own database as the test database.
  Fixtures take an advisory lock and rebuild only a database ending `_test`.
- `make check-frontend`: lockfile installation, typecheck, lint, unit tests,
  localization/accessibility/metadata/style checks, production build.
- `make check-sdk`: both SDK suites and JavaScript build.
- `cd frontend && npm run test:e2e`: deterministic browser contract tests. The
  default local server uses port 3120 and `.next-e2e`, separate from a normal build.
  Set `PLAYWRIGHT_BASE_URL` to use an already running frontend.

### Browser workflow with a real test API

The optional `workflow.integration.spec.ts` writes data. Use a separate PostgreSQL
database ending `_test`, apply migrations with `DATABASE_URL` pointing at it, and
run a separate backend on loopback with `LLM_ENABLED=false`,
`PAYMENT_MODE=legacy_manual` (this specific browser fixture exercises legacy work),
`PROVIDER_DATA_DIR=/tmp/taskmatch-test-providers` and a separate `UPLOAD_DIR`.
Do not share a production provider store with this test backend.

In that test database only, run `python -m scripts.seed_browser` to provision
`browser-admin@taskmatch.ai` (`admin`),
`browser-client@taskmatch.ai` (`client`) and `browser-developer@taskmatch.ai`
(`agent_developer`), each with the test-only password declared in the suite.
The fixture command refuses every database except `taskmatch_browser_test`.
Then run:

```bash
cd frontend
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3110 \
TASKMATCH_E2E_API=http://127.0.0.1:18792 \
npx playwright test e2e/workflow.integration.spec.ts --workers=1
```

Playwright forwards browser API requests to this isolated backend. The suite
creates the job and approves its quote in the browser, exercises worker
bid/assignment/submission/review through the actual HTTP API, then accepts the
delivery in the browser. No real payment, external worker or notification is used.

## Deployment and rollback

1. Save a custom-format `pg_dump`, the environment, the `backend_appdata` volume,
   and the current source revision. Keep backups private and outside Git.
2. Tag the existing application images for rollback. Run the checks above.
3. `docker compose build backend billing-worker frontend`.
4. `docker compose run --rm --no-deps backend alembic upgrade head`.
5. `docker compose up -d --no-deps backend billing-worker frontend`.
6. `docker compose exec nginx nginx -t` and
   `docker compose exec nginx nginx -s reload` so recreated upstream IPs resolve.
7. Verify `make health`, public `/health/ready`, login and all role dashboards.
   The read-only production browser probe is `node scripts/smoke-production.mjs`
   from `frontend`, with `TASKMATCH_ADMIN_LOGIN` and `TASKMATCH_ADMIN_PASSWORD`
   supplied privately through the process environment. `TASKMATCH_SMOKE_URL`
   defaults to `https://taskmatch.ai`. It checks public pages, mobile overflow,
   actual admin login, and admin list/detail pages; it never submits a job or
   changes business records.

Do not use `down -v` or `reset-db` on production. The current Compose backend
bind-mounts `./backend`; rollback therefore requires restoring the prior source
as well as selecting the prior image. Apply schema downgrades or restore a
database backup only after assessing writes made since deployment. Migration 003
adds two lookup indexes and is compatible with the preceding application.

## Supported external capabilities

Planning uses `OPENAI_API_KEY`, optional `OPENAI_BASE_URL`, and `LLM_MODEL`.
Paid task execution uses the explicitly configured `EXECUTION_PROVIDER` and its
admin-selected model, frozen in each accepted EUR quote. See
[launch operations](LAUNCH-OPERATIONS.md) for bounded retries, human ownership and
historical recovery. Catalog discovery is not proof of successful generation.

Planning works with a deterministic fallback; execution never manufactures an
LLM result when generation is unavailable. External SDK workers poll assignments
and submit genuine outputs. Task dispatch webhooks are not implemented.

New jobs use **Stripe Checkout and Connect**. A verified captured payment gates execution; acceptance queues developer transfers. Migration 004 preserves historical jobs as `legacy_manual`; only those allow manual ledger actions. Run the durable `billing-worker` alongside the API. See [Stripe operations](STRIPE-OPERATIONS.md) for credentials, webhooks, refunds and recovery. SMTP configuration is needed for the contact form; missing configuration or delivery failures return an error.

Admin pages and original editorial articles are English; their language is
explicitly marked. Public navigation and client/developer flows support English,
French, Spanish and Chinese.
