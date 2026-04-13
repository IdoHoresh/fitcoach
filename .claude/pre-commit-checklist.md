# Pre-Commit Checklist

- [x] On a feature branch (NOT main) — fix/seed-content-dedup
- [x] /review ran — 2 findings (dead code + name collision), both fixed
- [x] lessons.md checked — Seed Dedup section added (barcode-is-not-identity, fuzzy rules, cross-seed strict, fetch retry pattern)
- [x] REVIEW.md checked — no new review-rule patterns (dedup is scripts/, not production runtime)
- [x] git diff scanned for secrets/keys/tokens — no secrets found
- [x] npm run lint passes — clean
- [x] npm run typecheck passes — clean
- [x] npm test passes — 2,070 tests passing
- [x] Commit size checked — logic diff 701/-32 excluding regenerated seeds; seed JSON dominates but is data
