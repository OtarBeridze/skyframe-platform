# SkyFrame — Roadmap

## Current state (Phase 1 POC)

✅ HTML prototype with pricing configurator  
✅ QuickBooks OAuth 2.0 + invoice creation  
✅ QuickBooks payment polling → order tracking  
✅ Monday.com task creation on payment  
✅ TrackPod delivery order creation  
✅ TrackPod status polling  
✅ Quote email with PDF  

## Phase roadmap

| Phase | Focus                                | Weeks | Status      |
|-------|--------------------------------------|-------|-------------|
| 1     | Auth + Pricing Configurator + QB     | 1–4   | ✅ POC done |
| 2     | Order Management + Monday.com        | 5–7   | 🔄 In POC  |
| 3     | Client Management + TrackPod         | 8–9   | 🔄 In POC  |
| 4     | Pricing Administration               | 10    | ⬜ Planned  |
| 5     | Analytics & Reporting                | 11–12 | ⬜ Planned  |
| 6     | Final Polish & QA                    | 13    | ⬜ Planned  |

## Production migration steps

1. **Move credentials to .env** (security — high priority)
2. **TypeScript migration** — convert server.js + add types
3. **Modularize routes** — split into `/routes`, `/services`, `/middleware`
4. **PostgreSQL** — replace in-memory store (orders, clients, invoices, tokens)
5. **Replace polling with webhooks** — TrackPod + Monday.com both support webhooks
6. **React frontend** — rewrite prototype as components
7. **JWT auth** — invite-only user system (Admin / Sales Rep / Viewer)
8. **AWS deployment** — ECS containers or Lambda + API Gateway
9. **CI/CD** — GitHub Actions for test + build + deploy

## Future features (post-Phase 6)

- Client portal (view order status, download invoices)
- Visualization tools (frame preview on artwork)
- Product catalog with pricing table
- Mobile app for delivery drivers (or TrackPod native app)
- Analytics dashboard (revenue by location, top clients, popular frame styles)
