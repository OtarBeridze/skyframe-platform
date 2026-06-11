---
paths:
  - "integrations/**/*.js"
  - "server.js"
---

# Integration Rules

## QuickBooks Online

- Environment: `sandbox` (sandbox-quickbooks.api.intuit.com) — never switch to production without explicit confirmation
- OAuth state parameter must be validated on callback to prevent CSRF
- Access token lifetime: 1 hour. Refresh token lifetime: 100 days
- All QB API responses must check for `Fault` object before processing
- Invoice line items require `ItemRef` — default to `{ value: '1', name: 'Services' }`

## TrackPod

- Auth header: `Authorization: <API_KEY>` — no "Bearer", no "Token" prefix
- Rate limits: 20 req/sec, 400 req/min — do not fire bulk requests without delay
- Order number format: `SF-YYYY-NNNN` for production orders, `SF-TEST-NNNN` for tests
- Always DELETE test orders after creation in test scripts
- Webhook endpoint: `POST /api/trackpod/webhook` — must return HTTP 200 immediately

## Monday.com

- GraphQL mutations must include `id` in the response to confirm creation
- Board ID must match the correct SkyFrame operations board
- Task status values: `Working on it` (in progress), `Done` (completed), `Stuck` (blocked)
- Never hardcode board column IDs — document them in `knowledge/integrations.md`

## General rules

- All polling intervals must use `setInterval` with clearable references
- External API calls must have a timeout (suggest: 10 seconds)
- Log all integration events with prefix: `[QB]`, `[TrackPod]`, `[Monday]`
- Never log full API response bodies — they may contain PII or tokens
