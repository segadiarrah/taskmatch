# Human Tasks agent protocols

The REST Human Tasks contract, MCP tools and A2A messages use the same account,
principal, delegation, task, quote and payment records. A delegation bearer token
can access only its own tasks and cannot configure payment methods, create a
webhook, raise a spending ceiling or approve publication.

These endpoints require `HUMAN_TASKS_ENABLED=true`. Authenticate with the account
JWT or the scoped `human_tasks` JWT returned when the owner creates a delegation.
Acquire credentials through the existing account and delegation flow.

## MCP Streamable HTTP

`POST /api/v1/protocols/mcp` implements **2026-07-28**. It uses per-request metadata,
with no initialize handshake or server session. Older protocol revisions are not
advertised. Responses are JSON; there is no SSE notification subscription or MCP
long-running task extension.

Every request requires these headers:

```http
Authorization: Bearer <account-or-delegation-token>
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/list
```

```json
{
  "jsonrpc": "2.0",
  "id": "list-1",
  "method": "tools/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

Supported methods are `server/discover`, `ping`, `tools/list` and `tools/call`.
Discovery advertises only the implemented tools capability. The tool listing declares private cache scope and a zero-millisecond TTL. Each successful result
includes `resultType: "complete"`. `tools/call` also requires the `Mcp-Name` header
to match `params.name`. Tool names with Base64 sentinel header encoding are decoded
before comparison. Invalid or missing mirrored headers return HTTP 400 with
`HeaderMismatch` (`-32020`); unsupported protocol versions return `-32022` and the
supported versions. Unknown RPC methods return HTTP 404 / `-32601`.

| Tool | Arguments |
| --- | --- |
| `human_task_create` | `contract` (the `tm.human-task.v1` request), `idempotency_key` |
| `human_task_get` | `task_id` |
| `human_task_result` | `task_id` |
| `human_task_events` | `task_id`, optional `skip` and `limit` (1–100) |
| `human_task_fund` | `task_id` |

For example, use `Mcp-Method: tools/call`, `Mcp-Name: human_task_result` and:

```json
{
  "jsonrpc": "2.0",
  "id": "result-1",
  "method": "tools/call",
  "params": {
    "name": "human_task_result",
    "arguments": {"task_id": "<task UUID>"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

Domain failures return a tool result with `isError: true`, redacted text and
`structuredContent`. A failed call rolls back any partial spending reservation.
Repeating a create key with the same contract returns the same task; changing its
content returns a conflict. Funding queues the existing durable payment operation;
`creating` is not proof of receipt. A bank challenge requires owner intervention.

Untrusted browser `Origin` values are rejected even before authentication. JSON
request bodies are limited to 256 KiB. Batches and client response objects are
rejected. A `notifications/cancelled` notification for an already finished or
unknown request is accepted as a harmless no-op with HTTP 202 and an empty body;
other client notifications are rejected.

## A2A JSON-RPC

`GET /.well-known/agent-card.json` and
`GET /api/v1/protocols/a2a/agent-card.json` describe the implemented **0.3.0** binding.
Use `POST /api/v1/protocols/a2a` with the same bearer authentication and
`Content-Type: application/json`. `A2A-Version: 0.3.0` may be provided. This endpoint
does not claim A2A 1.0 support.

Create a task with one structured data part:

```json
{
  "jsonrpc": "2.0",
  "id": "send-1",
  "method": "message/send",
  "params": {
    "message": {
      "kind": "message",
      "role": "user",
      "messageId": "stable-client-message-id",
      "parts": [{"kind": "data", "data": {"contract": {"schema_version": "tm.human-task.v1"}}}]
    }
  }
}
```

Supply the complete contract from `GET /api/v1/human-tasks/schema`; the shortened
contract above shows the envelope only. A stable `messageId` binds creation
idempotency. The returned Task uses the Human Task UUID as `id`, its job UUID as
`contextId`, and its current execution state. Poll with `tasks/get` and
`params: {"id": "<task UUID>"}`. Approved results appear as data artifacts.

`message/send` also accepts data objects `{"operation": "result", "task_id": "…"}`,
`{"operation": "events", "task_id": "…", "skip": 0, "limit": 30}` and
`{"operation": "fund", "task_id": "…"}`. These return an agent Message containing
the existing result, event page or funding state.

`tasks/cancel` verifies access then returns `TaskNotCancelableError` (`-32002`):
there is no cancellation of an already quoted or funded mission through this
adapter. The card advertises no streaming, push configuration or transition
history. Unsupported streaming methods return `-32601`; push configuration in a
send request returns `PushNotificationNotSupportedError` (`-32003`). Principal
webhooks below are a separate TaskMatch API, not A2A push notifications.

## Explicit owner webhooks

Only a full account session owned by the principal can manage subscriptions:

| Method | Path |
| --- | --- |
| `POST` | `/api/v1/principals/{principal_id}/webhooks` |
| `GET` | `/api/v1/principals/{principal_id}/webhooks` |
| `DELETE` | `/api/v1/principals/{principal_id}/webhooks/{subscription_id}` |
| `GET` | `/api/v1/principals/{principal_id}/webhooks/{subscription_id}/deliveries` |

The creation body is `{"url": "https://hooks.example.com/events"}` with an optional
`delegation_id` belonging to that principal. A principal subscription covers that
principal's Human Tasks; a delegation subscription covers only that mandate.
Creation returns the signing `secret` once. Listing never returns it. Secrets are
encrypted at rest using the existing vault key. Configure `VAULT_SECRET_KEY`, or a
real `SECRET_KEY`, before enabling subscriptions. Keep that key stable across
restarts; rotation requires replacing affected subscriptions.

No subscription is created implicitly. Existing events are not replayed to newly
created subscriptions. A principal can have at most ten active subscriptions.
Deletion disables delivery and preserves its history. Inactive owners, revoked or
expired mandates and disabled delegated agents suppress queued deliveries.
Authorization locks serialize a revocation with an already active outbound send.

Destinations must use HTTPS on port 443 without credentials or fragments. Literal
and DNS addresses must all be public. DNS is checked at creation and before each
attempt. The actual TCP connection is pinned to the vetted numeric address while
TLS and Host use the original hostname. Redirects and environment proxies are
never followed or used.

The worker collects committed task and job lifecycle audit entries into durable
events, excluding unrelated audits and their private payloads. Collection uses a
deduplicated anti-join, so a late transaction commit cannot fall behind a cursor.
The immutable payload contains event identity/time and a small state snapshot;
`snapshot_observed_at` identifies when that state was observed. It does not pretend
to reconstruct an earlier state from a later database read. Instructions,
administrative notes, result evidence and payment credentials are omitted. Fetch
details or approved results through the authenticated APIs.

Delivery is at least once. The subscription/event pair is unique and payload bytes
remain stable across retries. A delivery gets at most six persisted attempts with
exponential delays beginning at 30 seconds. Success is any 2xx response; redirects
and permanent client errors are terminal. Network failures, 408/425/429 and server
errors are retried within the bound. Delivery history reports redacted failures.
Each attempt is reserved and committed before sending. A crashed worker leaves a
60-second processing lease; recovery preserves the attempt budget, including when
the last attempt was interrupted.

The request includes:

```http
X-TaskMatch-Timestamp: <Unix seconds>
X-TaskMatch-Signature: v1=<lowercase HMAC-SHA256 hex>
X-TaskMatch-Event-Id: <event UUID>
Idempotency-Key: <stable delivery UUID>
```

Verify the raw request bytes before parsing JSON. The signed message is
`timestamp + "." + raw_body`, encoded as bytes. Compare signatures in constant time,
reject timestamps outside your chosen tolerance (for example five minutes), and
store the delivery UUID in a durable deduplication table together with your local
processing transaction. Repeated delivery should return a 2xx acknowledgment.

The existing billing worker runs an independent notification loop through
`app.services.protocol_webhooks.run_once(async_session_factory)`. The outbox is
committed before outbound requests. A crash after receipt and before the local
delivery commit may cause another attempt, which is why receiver deduplication is
required.

## Reproduce the independent client check

Run the paid journey fixture with the candidate backend and its seeded accounts.
The standalone test in [tools/journey-tests/protocol-clients/check.mjs](../tools/journey-tests/protocol-clients/check.mjs)
uses the official MCP JS client 2.4.0 and A2A JS SDK 0.3.14. Install the
locked dependencies with Node.js 20 or later from the repository root.

```sh
npm ci --ignore-scripts --prefix tools/journey-tests/protocol-clients
npm test --prefix tools/journey-tests/protocol-clients -- http://127.0.0.1:3172
```

The test checks the fixture control endpoint before account login. It discovers
the MCP tools, creates and reads an unfunded human task, reads that task via
A2A, and sends and polls a second task via A2A. It also checks that the new
principal starts with no webhook subscriptions. It creates no charge and sends
no webhook delivery. The A2A card's reserved example hostname is mapped to the
same loopback API for transport.

## Protocol references

- [MCP 2026-07-28 Streamable HTTP](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/basic/transports/streamable-http.mdx)
- [MCP discovery and versioning](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/server/discover.mdx)
- [A2A 0.3.0 specification](https://a2a-protocol.org/v0.3.0/specification/)
- [Current A2A specification, for comparison](https://a2a-protocol.org/latest/specification/)
