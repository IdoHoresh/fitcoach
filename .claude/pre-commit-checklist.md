# Pre-Commit Checklist

- [x] On a feature branch (NOT main) — feat/supermarket-scraper
- [x] /review ran and findings fixed — sDrink unit bug, null check, JSON parse error handling, dry-run cleanup, redundant test removed
- [x] lessons.md checked — migration guard pattern documented below
- [x] REVIEW.md checked — no new patterns to add
- [x] git diff scanned for secrets/keys/tokens — no secrets found
- [x] npm run lint passes — clean
- [x] npm run typecheck passes — clean
- [x] npm test passes — 1,997 tests passing
- [x] Commit size checked — 2,666 insertions (large but expected: 46 SKUs + scraper + tests)
