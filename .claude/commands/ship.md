# Prepare feature for production

Run through this checklist before merging to main.

## Current status

!git status
!git log main...HEAD --oneline

## Pre-ship checklist

1. **No hardcoded credentials** — scan for QB keys, TrackPod key, Monday key in code
   !grep -rn "CLIENT_ID\|CLIENT_SECRET\|TRACKPOD_API_KEY\|monday_api_key" --include="*.js" . | grep -v ".env" | grep -v "node_modules"

2. **No console.log left** (clean up debug output)
   !grep -rn "console.log" --include="*.js" . | grep -v "node_modules" | grep -v "server.js" | head -20

3. **Dependencies up to date**
   !npm outdated 2>/dev/null || echo "All up to date"

4. **Check .env.example is updated** — new env vars documented?
   !cat .env.example

---

After running checks, report:
- ✅ / ❌ for each checklist item
- Specific issues found with file + line number
- What needs to be fixed before merging
