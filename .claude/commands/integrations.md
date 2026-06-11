# Check all integrations health

Scan server.js and verify all three integrations are correctly configured.

## Current server.js integration config

!grep -n "CLIENT_ID\|TRACKPOD\|monday\|MONDAY\|REDIRECT_URI\|polling\|setInterval" server.js | head -40

## .env file (if exists)

!cat .env 2>/dev/null || echo ".env not found — using hardcoded values"

---

Check and report:

### QuickBooks
- Is CLIENT_ID / CLIENT_SECRET set correctly?
- Is redirect URI configured for localhost:3000?
- Is it pointing to sandbox (not production)?
- Is the OAuth polling interval set?

### TrackPod
- Is API key present?
- Is base URL correct (api.track-pod.com)?
- Is the Authorization header format correct (no Bearer prefix)?
- Is status polling active?

### Monday.com
- Is API key present?
- Is board ID configured?
- Is GraphQL endpoint correct?
- Is status polling active?

### Polling status
- What are the current polling intervals?
- Are any polling loops potentially overlapping?

Return a clear ✅ / ⚠️ / ❌ status for each integration with specific issues.
