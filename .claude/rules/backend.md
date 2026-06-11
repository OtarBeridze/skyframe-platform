# Backend Rules (Node.js / Express)

## API patterns

- All route handlers must be `async` with `try/catch`
- Always return JSON: `res.json({ success: true, data })` or `res.json({ success: false, error: message })`
- Never send stack traces to client — log internally, return generic message externally
- Use `req.body` only after validating required fields exist

## Integration patterns

### QuickBooks
- Always check token exists before QB API call
- Token refresh must happen before calls when `expiresAt - Date.now() < 5min`
- QB errors come in `Fault.Error[0].Detail` — always extract this for logging

### TrackPod
- Authorization header: `Authorization: <API_KEY>` — NO "Bearer" prefix
- Base URL: `https://api.track-pod.com`
- API Key is stored in env: `process.env.TRACKPOD_API_KEY`

### Monday.com
- Use GraphQL: `POST https://api.monday.com/v2` with `Content-Type: application/json`
- API Key header: `Authorization: <key>` (no Bearer)
- Always check `data.errors` in response even on HTTP 200

## Async / error handling

```javascript
// ✅ Correct pattern
app.post('/api/endpoint', async (req, res) => {
  try {
    const result = await someApiCall();
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Module] Operation failed:', err.message);
    res.json({ success: false, error: err.message });
  }
});

// ❌ Never do this
app.post('/api/endpoint', (req, res) => {
  someApiCall().then(result => res.json(result)); // unhandled rejection
});
```

## Environment variables

- Never hardcode credentials in source code
- Access via `process.env.VARIABLE_NAME`
- Document all new vars in `.env.example`
