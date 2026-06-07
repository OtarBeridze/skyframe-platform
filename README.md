# SkyFrame Platform

Internal operations platform for SkyFrame — a custom framing and fine art business with locations in NYC, NJ, and Miami.

## Overview

SkyFrame Platform replaces manual Excel-based workflows with a modern web application for pricing configuration, invoice creation, order tracking, and third-party integrations.

**Status:** Phase 1 — Prototype & POC Integrations  
**Timeline:** 13 weeks (3 months)  
**Budget:** ~$50K  
**Team:** 5 engineers (2 fullstack, UI designer, engineer, DevOps)

## Tech Stack

| Layer          | Technology       |
|----------------|------------------|
| Frontend       | React + TypeScript |
| Backend        | .NET             |
| Infrastructure | AWS              |
| Integrations   | QuickBooks, Monday.com, TrackPod |

## Project Structure

```
skyframe-platform/
├── prototype/               # HTML prototype (clickable SPA)
│   └── SkyFrame_Prototype.html
├── integrations/
│   ├── quickbooks/          # QuickBooks OAuth + invoice creation POC
│   │   ├── quickbooks_integration.js
│   │   └── QuickBooks_Setup_Guide.md
│   └── trackpod/            # TrackPod delivery API test
│       └── trackpod-api-test.js
├── docs/                    # Project documentation (RU)
│   ├── SkyFrame_Meeting_Summary_RU.docx
│   └── TrackPod_Integration_Guide_RU.docx
├── scripts/                 # Utility scripts
├── .env.example             # Environment variables template
└── README.md
```

## Prototype

The HTML prototype demonstrates the full UI flow:

- **Dashboard** — recent orders, activity feed, "+ New Order" button
- **Pricing Configurator** — 16 sections matching Excel pricing logic with live quote panel
- **Order Detail** — full field coverage (artwork, frames, matboards, glazing, backing, mounting)
- **Client Detail** — editable fields with save/cancel
- **Integrations** — QuickBooks, Monday.com, TrackPod status

Open `prototype/SkyFrame_Prototype.html` in a browser to explore.

## Integrations

### QuickBooks Online
- OAuth 2.0 flow for authorization
- Invoice creation from configurator quote data
- Payment status synchronization
- See: `integrations/quickbooks/QuickBooks_Setup_Guide.md`

### TrackPod
- REST API with simple API Key auth (no OAuth)
- Order creation for delivery dispatch
- Webhook-based status updates (ePOD)
- See: `docs/TrackPod_Integration_Guide_RU.docx`

### Monday.com
- Order status board integration
- Triggered on payment confirmation
- Planned for Phase 2

## Development Phases

| Phase | Focus                               | Weeks  |
|-------|-------------------------------------|--------|
| 1     | Auth + Pricing Configurator + QB    | 1–4    |
| 2     | Order Management + Monday.com       | 5–7    |
| 3     | Client Management                   | 8–9    |
| 4     | Pricing Administration              | 10     |
| 5     | Analytics & Reporting               | 11–12  |
| 6     | Final Polish & QA                   | 13     |

## Setup

```bash
# Clone
git clone https://github.com/<your-org>/skyframe-platform.git
cd skyframe-platform

# Copy environment template
cp .env.example .env
# Edit .env with your credentials

# QuickBooks POC
cd integrations/quickbooks
npm install
node quickbooks_integration.js

# TrackPod API Test
cd integrations/trackpod
node trackpod-api-test.js
```

## Environment Variables

See `.env.example` for required credentials. **Never commit `.env` to the repo.**

## Team Contacts

- **Technical Lead:** Otar — weekly updates, technical questions
- **Business Contact:** Jorge Morocho — organizational, business, financial
- **Stakeholder:** George (+ Johnny)

## Documentation

All internal documentation is in Russian:
- `docs/SkyFrame_Meeting_Summary_RU.docx` — meeting protocol
- `docs/TrackPod_Integration_Guide_RU.docx` — TrackPod API research

---

*SkyFrame Platform — Phase 1*
