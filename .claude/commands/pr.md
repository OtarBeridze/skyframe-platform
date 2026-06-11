# Generate Pull Request description

## Branch info

!git log main...HEAD --oneline

## Files changed

!git diff --name-only main...HEAD

## Diff summary

!git diff --stat main...HEAD

---

Generate a clear PR description including:

- **What changed** — summary of modifications in plain English
- **Why** — the business reason or problem being solved
- **Integration impact** — which of QB / TrackPod / Monday.com is affected (if any)
- **Risks** — what could break, edge cases to watch
- **Testing** — how to verify this works locally (steps to test)
- **Screenshots** — note if UI changed in the prototype

Keep it concise. A developer who hasn't seen this branch should understand it in 60 seconds.
