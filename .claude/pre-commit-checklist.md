# Pre-Commit Checklist

- [x] On a feature branch (NOT main) — feat/user-name-field
- [x] /review ran and findings fixed — APPROVE, no blocking issues
- [x] lessons.md checked — no new patterns (change follows established schema/migration/Zod patterns)
- [x] REVIEW.md checked — no new patterns
- [x] git diff scanned for secrets/keys/tokens — no secrets
- [x] npm run lint passes — clean
- [x] npm run typecheck passes — clean
- [x] npm test passes — 1,690 / 1,690 (added 10 new tests: 7 validation + 3 HomeHeader)
- [x] Commit size checked — ~188 insertions / 18 deletions across 18 files (well under 500 LOC guideline)
