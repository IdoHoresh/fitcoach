# Pre-Commit Checklist

- [x] On a feature branch (NOT main) — fix/qa-validation-gaps
- [x] /review ran and findings fixed — APPROVE, one NIT fixed
- [x] lessons.md checked — no new patterns (existing patterns already cover validation guards)
- [x] REVIEW.md checked — no new patterns
- [x] git diff scanned for secrets/keys/tokens — no secrets found
- [x] npm run lint passes — clean
- [x] npm run typecheck passes — clean
- [x] npm test passes — 1,696 / 1,696 (+6 new validation tests)
- [x] Commit size checked — 80 insertions / 6 deletions across 6 files
