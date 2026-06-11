# Review current changes

Review the current branch diff before merging.

## Files changed

!git diff --name-only main...HEAD

## Full diff

!git diff main...HEAD

## Review checklist

Check for:

- **Bugs** — logic errors, off-by-one, null/undefined cases
- **Security** — hardcoded credentials, exposed secrets, missing auth checks
- **Integration correctness** — QB OAuth token handling, TrackPod API key header, Monday GraphQL
- **Performance** — unnecessary loops, blocking calls, missing async/await
- **Error handling** — unhandled promise rejections, missing try/catch
- **Missing tests** — critical paths without verification
- **Code style** — consistency with existing patterns in server.js

Return specific, actionable feedback per file with line numbers where possible.
