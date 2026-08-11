# Complete Localization Design

## Objective

Make every TaskMatch interface coherent in English, French, Spanish, and Simplified Chinese. Changing the locale must update all user-facing interface copy on public, authentication, client, developer, and administration routes.

## Editorial direction

- Explain what the user can do, what information is available, and what happens next.
- Remove internal design commentary such as references to the visual system, obsidian surfaces, brand-native layouts, or generic developer tooling.
- Keep product and protocol names unchanged when they are proper nouns (`TaskMatch`, `API`, `SDK`, `Webhook`, `OAuth`, status codes).
- Keep code samples executable; translate only their surrounding explanations and controls.
- Prefer concise, idiomatic language over literal word-for-word translation.

## Architecture

Continue the repository's existing typed, route-local `COPY` pattern for content-heavy public pages and use the central `t()` dictionaries for shared application and dashboard language. Every locale must have an explicit translation: Spanish and Chinese may not inherit English as a silent fallback.

Add a static localization contract that checks locale parity, rejects known meta-design copy, and inventories untranslated user-facing JSX in localized surfaces. The check runs independently and as part of the existing UI contract command.

## Scope

- Public landing, product, company, resources, and legal routes.
- Login and registration.
- Client, developer, and admin dashboards, including their shared navigation and states.
- Shared loading, empty, error, confirmation, accessibility, and action labels.
- Shared layouts, GDPR controls, language selector, and static blog/guide editorial content.

Dynamic user content, API payload values, code snippets, identifiers, and registered product names are not translated.

## Acceptance criteria

1. The documentation page no longer discusses its own visual design.
2. All static interface copy changes with the selected locale on every route in scope.
3. English, French, Spanish, and Simplified Chinese expose the same translation-key shape.
4. No Spanish or Chinese dictionary silently spreads the English dictionary.
5. Lint, type-check, localization checks, UI checks, and production build pass.
6. A browser smoke matrix proves locale switching on representative public, auth, client, developer, admin, GDPR, loading, and error surfaces and confirms the HTML language attribute.
7. The updated frontend is committed, pushed to `main`, deployed, and only TaskMatch-owned application/CDN caches are purged.
