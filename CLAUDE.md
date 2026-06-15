# SkyFrame Platform — Claude Code Guide

## Project Overview

Internal operations platform for SkyFrame — a custom framing and fine art business
with locations in NYC, NJ, and Miami. Replaces manual Excel workflows.

**Tech lead:** Otar  
**Business contact:** Jorge Morocho  
**Stakeholders:** George, Johnny

## Architecture

- **Frontend:** Single-page HTML prototype (`public/SkyFrame_Prototype.html`) → Production: React + TypeScript
- **Backend:** Node.js + Express (`server.js`) → Production: Node.js + Fastify
- **Database:** In-memory (POC) → Production: PostgreSQL
- **Infrastructure:** AWS (ECS / Lambda)
- **Email:** Nodemailer + Ethereal (test)
- **PDF:** pdfkit

## Integrations

| Service      | Auth         | Status      | Key endpoint                  |
|--------------|--------------|-------------|-------------------------------|
| QuickBooks   | OAuth 2.0    | ✅ Working  | `POST /api/create-invoice`    |
| TrackPod     | API Key      | ✅ Working  | `POST /api/send-to-trackpod`  |
| Monday.com   | API Key      | ✅ Working  | `POST /api/send-to-monday`    |
| Ethereal     | SMTP         | ✅ Working  | `POST /api/send-quote-email`  |

## API Routes

```
GET  /                        → Serve prototype HTML
GET  /auth/quickbooks         → Start QB OAuth flow
GET  /callback                → QB OAuth callback
GET  /api/qbo-status          → QuickBooks connection status
POST /api/create-invoice      → Create QB invoice from quote
POST /api/send-quote-email    → Send quote email with PDF
POST /api/preview-pdf         → Generate PDF preview
GET  /api/orders              → Get tracked paid orders
POST /api/poll-now            → Trigger immediate QB payment check
POST /api/send-to-monday      → Create Monday.com task
GET  /api/monday-status       → Monday.com tracked statuses
POST /api/send-to-trackpod    → Create TrackPod delivery order
GET  /api/trackpod-status     → TrackPod tracked statuses
```

## Commands

```bash
# Run server
node server.js

# Run with auto-restart (Node 18+)
node --watch server.js

# Test TrackPod API
node integrations/trackpod/trackpod-api-test.js

# Test QuickBooks POC
node integrations/quickbooks/quickbooks_integration.js

# Install dependencies
npm install
```

## Development Rules

1. **Plan before coding** — always outline the approach before writing code
2. **Minimal changes** — modify only what's explicitly requested, nothing extra
3. **No secrets in code** — credentials go in `.env`, never hardcoded
4. **In-memory is OK for POC** — we know it resets on restart, don't over-engineer
5. **Comment integrations** — external API calls must have inline comments explaining the flow
6. **Test the happy path** — before finishing, confirm the main flow works end-to-end
7. **Keep functions focused** — one function, one responsibility, under 50 lines preferred

## Important Constraints

- QuickBooks uses OAuth 2.0 — tokens expire in 1 hour, refresh token lasts 100 days
- TrackPod uses simple API Key (`Authorization: <key>`, no Bearer prefix)
- Monday.com uses GraphQL API
- Polling intervals: QB=15s, Monday=20s, TrackPod=20s
- All credentials must be in `.env` file (see `.env.example`)
- Port: 3000 (configurable via `PORT` env var)

## File Structure

```
skyframe-platform/
├── CLAUDE.md                          ← You are here
├── server.js                          ← Main Express server (768 lines)
├── package.json
├── .env.example                       ← Copy to .env and fill credentials
├── public/
│   └── SkyFrame_Prototype.html        ← Full UI prototype (3858 lines)
├── integrations/
│   ├── quickbooks/
│   │   ├── quickbooks_integration.js  ← Standalone QB POC
│   │   └── QuickBooks_Setup_Guide.md
│   └── trackpod/
│       └── trackpod-api-test.js       ← API test suite
├── docs/
│   ├── SkyFrame_Meeting_Summary_RU.docx
│   └── TrackPod_Integration_Guide_RU.docx
├── knowledge/                         ← Project knowledge base
│   ├── architecture.md
│   ├── business-rules.md
│   ├── integrations.md
│   └── roadmap.md
└── .claude/
    ├── commands/                      ← Slash commands
    ├── agents/                        ← Sub-agents
    └── rules/                         ← Scoped rules
```

## When Unsure

Ask questions before implementing. A wrong assumption costs more time than clarification.
