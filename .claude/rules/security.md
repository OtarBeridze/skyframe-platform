# Security Rules

## Credentials

- NEVER hardcode API keys, secrets, or tokens in source files
- All credentials go in `.env` (gitignored)
- Document all required credentials in `.env.example` with placeholder values
- If a credential is accidentally committed: rotate it immediately, then remove from git history

## Currently hardcoded (known tech debt — must be moved to .env)

- `CLIENT_ID` in server.js → `process.env.QB_CLIENT_ID`
- `CLIENT_SECRET` in server.js → `process.env.QB_CLIENT_SECRET`
- `TRACKPOD_API_KEY` in server.js → `process.env.TRACKPOD_API_KEY`
- Monday.com API key → `process.env.MONDAY_API_KEY`

## Route security

- All `/api/*` routes are currently public (POC) — before production, add auth middleware
- Never expose internal error details to client responses
- Validate all `req.body` fields before using them in external API calls

## Token handling

- OAuth tokens must never be logged
- Refresh tokens must never be sent to the frontend
- In-memory token store (current POC) must be replaced with encrypted DB storage in production

## Input validation

- Sanitize `clientName` before using in QB customer search (SQL-injection style attacks via GraphQL)
- Validate numeric fields (amounts, quantities) are actually numbers before sending to APIs
- Never trust `req.body` directly — always validate shape and types
