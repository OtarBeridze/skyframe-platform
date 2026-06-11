# SkyFrame — Business Rules

## What SkyFrame does

Custom framing and fine art services for galleries, collectors, and individual clients.
Locations: NYC, NJ, Miami.

## Order flow

```
Client → Pricing Configurator → Quote → Save Configuration
  → QuickBooks Invoice created
  → Invoice sent to client (email + PDF)
  → Client pays invoice in QuickBooks
  → Payment detected (polling QB every 15s)
  → Order added to paidOrders list
  → Monday.com task created ("Working on it")
  → TrackPod delivery order created
  → Delivery dispatched
  → Delivery completed (ePOD)
```

## Pricing structure

The configurator has 16 pricing sections matching the Excel pricing file (V15.0):

1. Printing — Enhanced Matte, Glossy, Canvas, Metallic, etc.
2. Frame — Classic Black Oak, Walnut, Gold Metal, etc.
3. Matting — 4-ply White, Black, Colored
4. Glazing — Regular Glass, UV Glass, Museum Glass, Acrylic
5. Mounting — Drymount, Float Mount, Hinge
6. Backing — Foamcore, Gatorboard, Aluminum
7. Oversize surcharge
8. Rush order surcharge
9. Markup: **28%** on subtotal
10. NY Tax: **8.875%**

## Customer types

- Walk-in client (cash/card)
- Gallery (invoice, net-30)
- Corporate (invoice, PO required)

## Invoice rules

- All invoices created in QuickBooks Online (sandbox for POC, production later)
- Invoice number format: `SF-YYYY-NNNN`
- Payment terms: immediate (walk-in), Net-30 (gallery/corporate)

## Delivery rules

- Delivery orders sent to TrackPod after payment confirmed
- Delivery time window: 09:00-17:00 by default
- NYC delivery: same-day if order paid before 12:00
- NJ/Miami: next business day

## User roles (planned)

- **Admin** — full access, pricing configuration, user management
- **Sales Rep** — create orders, view clients, no pricing admin
- **Viewer** — read-only dashboard
