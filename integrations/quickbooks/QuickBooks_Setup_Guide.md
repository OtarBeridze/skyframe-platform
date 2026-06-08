# QuickBooks Integration Setup Guide

## Overview
This guide explains how to set up the SkyFrame → QuickBooks integration to automatically create invoices from configurator orders.

---

## Prerequisites

1. **QuickBooks Online Account** (not QuickBooks Desktop)
2. **QuickBooks Developer Account** (free) — [developer.intuit.com](https://developer.intuit.com)
3. **Node.js 18+**

---

## Step 1: Create a QuickBooks App

1. Go to [developer.intuit.com](https://developer.intuit.com)
2. Sign in → My Apps → Create an App
3. Select **QuickBooks Online and Payments**
4. App name: `SkyFrame Platform`
5. Scope: **Accounting** (read/write)

## Step 2: Configure OAuth

1. In your app settings → Keys & OAuth
2. Add Redirect URI: `http://localhost:3000/callback`
3. Copy **Client ID** and **Client Secret**
4. Save to `.env`:
   ```
   QB_CLIENT_ID=your_client_id
   QB_CLIENT_SECRET=your_client_secret
   QB_REDIRECT_URI=http://localhost:3000/callback
   QB_ENVIRONMENT=sandbox
   ```

## Step 3: Get OAuth Tokens

For the POC, use the OAuth Playground:
1. Go to [developer.intuit.com/app/developer/playground](https://developer.intuit.com/app/developer/playground)
2. Select your app
3. Authorize → copy Access Token and Realm ID
4. Add to `.env`:
   ```
   QB_ACCESS_TOKEN=your_access_token
   QB_REALM_ID=your_realm_id
   ```

> ⚠ Access tokens expire in 1 hour. Refresh tokens last 100 days.

## Step 4: Run the Integration

```bash
cd integrations/quickbooks
node quickbooks_integration.js
```

Expected output:
```
===========================================
  SKYFRAME → QUICKBOOKS INTEGRATION POC
===========================================

Order Details:
  Order ID: SF-2026-0847
  Client: Gagosian Gallery
  Total: $425.12

[1/3] Finding customer: Gagosian Gallery...
  ✓ Created customer (ID: 58)
[2/3] Creating invoice for order SF-2026-0847...
  ✓ Invoice created (ID: 147, #SF-2026-0847)
[3/3] Sending invoice email...
  ✓ Invoice email sent

  ✓ ORDER PROCESSED SUCCESSFULLY!
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `401 AuthenticationFailed` | Token expired — refresh via OAuth Playground |
| `3200 Invalid Reference Id` | ItemRef ID doesn't exist in QBO — create the item first |
| `6000 Invalid customer` | Customer ID invalid — use findOrCreateCustomer |
| Rate limiting (429) | Sandbox: 100 req/min, Production: 500 req/min |

---

## Security

- **Never commit credentials** — use `.env` (already in `.gitignore`)
- **Rotate keys** if exposed in chat or logs
- **Use HTTPS** in production redirect URIs
- **Encrypt refresh tokens** at rest in database

---

## Production Checklist

- [ ] OAuth flow works end-to-end
- [ ] Customer creation/lookup works
- [ ] Invoice creation with all line items
- [ ] Invoice email sending
- [ ] Token auto-refresh before expiry
- [ ] Error handling for all scenarios
- [ ] Rate limiting respected
- [ ] Webhook handler for payment notifications
- [ ] Monday.com trigger on payment (Phase 2)
