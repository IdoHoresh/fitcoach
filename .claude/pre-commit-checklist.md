# Pre-Commit Checklist

- [x] On a feature branch (NOT main) — fix/add-supermarket-seed
- [x] /review ran and findings fixed — data-only fix (seed JSON missed main due to merge timing)
- [x] lessons.md checked — no new patterns
- [x] REVIEW.md checked — no new patterns
- [x] git diff scanned for secrets/keys/tokens — no secrets (food data only)
- [x] npm run lint passes — clean
- [x] npm run typecheck passes — clean
- [x] npm test passes — 1,997 tests passing
- [x] Commit size checked — seed JSON + build script fix only
