# SkyFrame Platform

Internal operations platform for SkyFrame — a custom framing and fine art business with locations in NYC, NJ, and Miami.

## Overview

SkyFrame Platform replaces manual Excel-based workflows with a modern web application for pricing configuration, invoice creation, order tracking, delivery dispatch, and third-party integrations.

**Status:** Phase 1 — Working prototype with live integrations  
**Timeline:** 13 weeks (3 months)  
**Budget:** ~$50K  
**Team:** 5 engineers (2 fullstack, UI designer, engineer, DevOps)

## Tech Stack

### Production target

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | React + TypeScript                  |
| Backend        | Node.js (Express → Fastify)         |
| Database       | PostgreSQL                          |
| Infrastructure | AWS (ECS or Lambda)                 |
| Integrations   | QuickBooks, Monday.com, TrackPod    |

### Current POC

| Component      | Implementation                      |
|----------------|-------------------------------------|
| Frontend       | Single-page HTML prototype (3858 lines) |
| Backend        | Express.js monolith (768 lines)     |
| Data storage   | In-memory (resets on restart)       |
| Email          | Nodemailer + Ethereal (test)        |
| PDF            | pdfkit                              |

## Architecture

```
Browser (localhost:3000)
    │
    ▼
Express.js Server (server.js)
    ├── OAuth 2.0 flow (/auth/quickbooks, /callback)
    ├── Invoice API (/api/create-invoice)
    ├── Quote email + PDF (/api/send-quote-email)
    ├── TrackPod routes (/api/send-to-trackpod, /api/trackpod-status)
    ├── Monday.com routes (/api/send-to-monday, /api/monday-status)
    ├── Orders tracking (/api/orders, /api/poll-now)
    └── Background polling
         ├── QuickBooks payment status (15s)
         ├── Monday.com task status (20s)
         └── TrackPod delivery status (20s)
    │
    ▼
External Services
    ├── QuickBooks Online (OAuth 2.0 + REST)
    ├── Monday.com (GraphQL API)
    ├── TrackPod (API Key + REST)
    └── Ethereal SMTP (test emails)
```

## Project Structure

```
skyframe-platform/
├── public/
│   └── SkyFrame_Prototype.html    # Full clickable prototype
├── server.js                      # Express server with all integrations
├── package.json                   # Dependencies: express, axios, pdfkit, nodemailer
├── .env.example                   # Environment variables template
├── .gitignore
├── integrations/
│   ├── quickbooks/
│   │   ├── quickbooks_integration.js   # Standalone QB POC script
│   │   └── QuickBooks_Setup_Guide.md
│   └── trackpod/
│       └── trackpod-api-test.js        # API endpoint test suite
├── docs/
│   ├── SkyFrame_Meeting_Summary_RU.docx
│   └── TrackPod_Integration_Guide_RU.docx
└── prototype/
    └── README.md
```

## Quick Start

```bash
git clone https://github.com/OtarBeridze/skyframe-platform.git
cd skyframe-platform
npm install
cp .env.example .env     # Fill in your credentials
node server.js
```

Open **http://localhost:3000**

## Working Integrations

### QuickBooks Online
- OAuth 2.0 authorization flow (`/auth/quickbooks` → `/callback`)
- Customer lookup/creation in QBO sandbox
- Invoice creation from configurator quote data
- Automatic payment status polling (every 15s)
- Order creation on payment detection
- **Status:** ✅ Working (sandbox)

### TrackPod
- API Key authentication (no OAuth required)
- Delivery order creation with randomized NYC addresses
- Route-based status polling + delivery outcome polling (every 20s)
- Auto-restore tracked orders on server restart
- **Status:** ✅ Working (production API)

### Monday.com
- GraphQL API integration
- Task creation on paid orders (`Working on it` status)
- Status change polling (every 20s)
- **Status:** ✅ Working

### Quote Emails
- PDF quote generation (pdfkit)
- HTML email with SkyFrame branding
- Ethereal test inbox for development
- **Status:** ✅ Working (test email)

## API Endpoints

| Method | Path                       | Description                          |
|--------|----------------------------|--------------------------------------|
| GET    | `/`                        | Serve prototype                      |
| GET    | `/auth/quickbooks`         | Start QuickBooks OAuth flow          |
| GET    | `/callback`                | OAuth callback (token exchange)      |
| GET    | `/api/qbo-status`          | Check QuickBooks connection          |
| POST   | `/api/create-invoice`      | Create invoice in QuickBooks         |
| POST   | `/api/send-quote-email`    | Send quote email with PDF            |
| GET    | `/api/orders`              | Get tracked paid orders              |
| POST   | `/api/poll-now`            | Trigger immediate payment check      |
| POST   | `/api/send-to-monday`      | Create Monday.com task               |
| GET    | `/api/monday-status`       | Get Monday.com tracked statuses      |
| POST   | `/api/send-to-trackpod`    | Create TrackPod delivery order       |
| GET    | `/api/trackpod-status`     | Get TrackPod tracked statuses        |

## Development Phases

| Phase | Focus                               | Weeks  |
|-------|-------------------------------------|--------|
| 1     | Auth + Pricing Configurator + QB    | 1–4    |
| 2     | Order Management + Monday.com       | 5–7    |
| 3     | Client Management + TrackPod        | 8–9    |
| 4     | Pricing Administration              | 10     |
| 5     | Analytics & Reporting               | 11–12  |
| 6     | Final Polish & QA                   | 13     |

## Production Roadmap

Steps to evolve the current POC into production:

1. **TypeScript migration** — convert `server.js` to TypeScript, add strict types
2. **Modularize routes** — split server.js into `/routes`, `/services`, `/middleware`
3. **Database** — PostgreSQL for orders, clients, invoices, tokens (replace in-memory)
4. **Environment config** — move all credentials from code to `.env` / AWS Secrets Manager
5. **Webhooks** — replace polling with TrackPod webhooks + Monday.com webhooks
6. **React frontend** — rewrite prototype as React + TypeScript components
7. **Auth** — JWT-based user authentication (invite-only system)
8. **AWS deployment** — ECS containers or Lambda + API Gateway
9. **CI/CD** — GitHub Actions for testing, building, deploying

## Environment Variables

See `.env.example` for required credentials. **Never commit `.env` to the repo.**

## Team

- **Technical Lead:** Otar — weekly updates, technical questions
- **Business Contact:** Jorge Morocho — organizational, business, financial
- **Stakeholders:** George, Johnny

## Documentation

Internal documentation (Russian):
- `docs/SkyFrame_Meeting_Summary_RU.docx` — meeting protocol with action items
- `docs/TrackPod_Integration_Guide_RU.docx` — TrackPod API feasibility research

---

*SkyFrame Platform — Phase 1*
