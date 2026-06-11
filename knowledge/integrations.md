# SkyFrame — Integrations Reference

## QuickBooks Online

- **Environment:** Sandbox (`sandbox-quickbooks.api.intuit.com`)
- **Auth:** OAuth 2.0
- **Client ID:** `AB5rzyr0kAxWrTNQHzlNiriDy7IR9g6kvAsQAvgEkf98PAveO2`
- **Redirect URI:** `http://localhost:3000/callback`
- **Scopes:** `com.intuit.quickbooks.accounting`
- **Token URL:** `https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer`
- **Auth URL:** `https://appcenter.intuit.com/connect/oauth2`
- **Access token lifetime:** 1 hour
- **Refresh token lifetime:** 100 days

### Key endpoints used

```
GET  /v3/company/{realmId}/query?query=SELECT * FROM Customer WHERE DisplayName = '{name}'
POST /v3/company/{realmId}/customer
POST /v3/company/{realmId}/invoice
GET  /v3/company/{realmId}/invoice/{id}
```

### Invoice line item structure

```javascript
{
  DetailType: 'SalesItemLineDetail',
  Amount: 120.00,
  Description: 'Frame - Classic Black Oak',
  SalesItemLineDetail: {
    ItemRef: { value: '1', name: 'Services' },
    Qty: 1,
    UnitPrice: 120.00
  }
}
```

---

## TrackPod

- **Base URL:** `https://api.track-pod.com`
- **Auth:** API Key in header `Authorization: <key>` (no Bearer)
- **API Key:** `019e6dc3-64d3-7f95-85cd-654902a8f516`
- **Rate limits:** 20 req/sec, 400 req/min

### Key endpoints used

```
POST   /Order          → Create delivery order
GET    /Order?dateFrom=&dateTo=  → List orders
GET    /Order/{number} → Get order status
DELETE /Order/{id}     → Delete order
GET    /Route          → List routes
GET    /Driver         → List drivers
```

### Order creation payload

```javascript
{
  number: 'SF-2026-0847',
  date: '2026-06-11',
  clientName: 'Gagosian Gallery',
  clientPhone: '+1-212-555-0180',
  address: '980 Madison Ave, New York, NY 10075',
  timeFrom: '10:00',
  timeTo: '17:00',
  comment: 'Custom framing delivery. Handle with care.',
  goods: [
    { article: 'FRM-OAK-24x36', description: 'Classic Black Oak Frame', quantity: 1 }
  ]
}
```

### Delivery statuses

- `Assigned` → assigned to driver
- `In Progress` → on the way
- `Arrived` → at location
- `Completed` → delivered (ePOD signed)
- `Failed` → delivery failed

---

## Monday.com

- **API URL:** `https://api.monday.com/v2`
- **Auth:** `Authorization: <api_key>` header
- **Protocol:** GraphQL
- **Board:** SkyFrame Operations Board

### Task creation mutation

```graphql
mutation {
  create_item(
    board_id: BOARD_ID,
    item_name: "Order SF-2026-0847 — Gagosian Gallery",
    column_values: "{\"status\": \"Working on it\"}"
  ) {
    id
  }
}
```

### Status values

- `Working on it` — order in production
- `Done` — completed
- `Stuck` — issue, needs attention

---

## Ethereal Email (Test)

- **Purpose:** Test email sending without real SMTP
- **Inbox:** https://ethereal.email/messages
- **Account:** Created dynamically on server start (`nodemailer.createTestAccount()`)
- **Note:** Each server restart creates a new test account — check console for inbox URL
