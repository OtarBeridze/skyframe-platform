# SkyFrame — Architecture

## Current (POC)

```
Browser
  └── HTTP → Express.js (server.js, port 3000)
               ├── Static: public/SkyFrame_Prototype.html
               ├── QuickBooks OAuth + Invoice API
               ├── TrackPod Delivery API
               ├── Monday.com GraphQL API
               ├── PDF generation (pdfkit)
               ├── Email (nodemailer + Ethereal)
               └── In-memory state
                    ├── tokens (QB OAuth)
                    ├── sentInvoices []
                    ├── paidOrders []
                    └── trackpodTracked {}
```

**Key constraint:** All state resets on server restart.

## Target (Production)

```
React + TypeScript (SPA)
  └── HTTPS → Fastify API (Node.js)
               ├── /routes
               │    ├── auth.ts        (JWT + QB OAuth)
               │    ├── orders.ts
               │    ├── clients.ts
               │    ├── pricing.ts
               │    └── integrations.ts
               ├── /services
               │    ├── quickbooks.ts
               │    ├── trackpod.ts
               │    ├── monday.ts
               │    └── email.ts
               ├── /middleware
               │    ├── auth.ts
               │    └── validate.ts
               └── PostgreSQL (via Prisma or pg)
                    ├── users
                    ├── clients
                    ├── orders
                    ├── invoices
                    └── oauth_tokens (encrypted)
```

## Data flow: Order lifecycle

```
Configurator → POST /api/create-invoice
  → QuickBooks: create customer (if new) + create invoice
  → Store in sentInvoices[]
  → Poll QB every 15s for payment
  → On payment detected:
      → Add to paidOrders[]
      → POST /api/send-to-monday → Monday task created
      → POST /api/send-to-trackpod → Delivery order created
      → Add to trackpodTracked{}
  → Poll TrackPod every 20s for delivery status
  → Poll Monday every 20s for task status
```

## Known architectural debt

1. Credentials hardcoded in server.js (lines ~18-22)
2. No input validation on any route
3. No authentication on any /api/* route
4. Polling can stack if API calls are slow
5. No error recovery if QB token expires mid-poll
6. PDFDocument stream may not close properly on error
