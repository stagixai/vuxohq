---
trigger: always_on
---
# Self-Correction & Verification Workflow

Whenever making modifications to the backend or API services:
1. Run `ruff check .` to catch syntax/lint issues immediately.
2. Run `ruff format .` to maintain uniform formatting.
3. Test endpoints using `Invoke-RestMethod` or internal test scripts to verify 200 OK responses.
4. If an error occurs, inspect the server logs, fix the root cause, and re-test until fully resolved.
