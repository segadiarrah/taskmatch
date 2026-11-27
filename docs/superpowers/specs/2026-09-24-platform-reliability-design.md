# Platform reliability refactor

The owner delegated technical decisions and completion of TaskMatch.ai. Keep the existing Next.js/FastAPI/PostgreSQL architecture and data, and repair the complete supported marketplace workflow incrementally. A rewrite would risk existing behavior and data; cosmetic changes alone would not establish functionality.

## Baseline

- Clean checkout at `38d2230`; work branch `refactor/platform-reliability-2026-09-24`.
- Running Docker services and `/health` respond successfully.
- Existing backend suite: 146 passing tests, mostly services without database integration.
- Frontend TypeScript passes; UI checks fail (549 localization findings plus outdated or missing accessibility contracts).

## Boundaries and acceptance

1. Authentication and authorization: existing admin login, client/developer registration, role boundaries, meaningful session errors.
2. Marketplace: job creation/planning/quote, bidding/assignment/submission/review/delivery with consistent persisted transitions. Test using a separate PostgreSQL database; do not turn production records into test fixtures.
3. Interface: every routed dashboard loads, controls call valid endpoints, errors remain actionable, selected locale and accessible labels remain coherent.
4. Developer integration: published SDKs build and agree with actual endpoint contracts.
5. Operations: reproducible checks/build, fresh-database migrations, deployable images, honest health checks and current run instructions.

Payment integrations and external AI/agent providers must report their actual configured capabilities. Internal bookkeeping is not proof of a real financial transfer. No external payments or messages are necessary for testing. Keep production data and credentials out of version control and test reports.

Validate with unit and isolated-database integration tests, TypeScript and production build, browser navigation/workflow checks, SDK tests/build, then deploy the verified application to the existing Compose services and recheck public health/login/navigation. Record any unmet external dependency explicitly.
