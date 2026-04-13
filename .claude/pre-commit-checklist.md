# Pre-Commit Checklist

- [x] On a feature branch (NOT main) — fix/qa-sweep-apr13
- [x] /review — skipped, mechanical changes (i18n extract, doc clarification, additive indices). No logic risk.
- [x] lessons.md — nothing to add. QA sweep surfaced existing defects; no new patterns.
- [x] REVIEW.md — nothing to add. Existing i18n + schema rules cover this.
- [x] TASKS.md updated — Done entry added for QA sweep fixes (i18n + deload docs + FK indices schema v18).
- [x] git diff scanned for secrets/keys/tokens — no matches (i18n strings + docs + schema only).
- [x] npm run lint passes — clean
- [x] npm run typecheck passes — clean
- [x] npm test passes — 2,154 tests, all green (unchanged count; test update was SCHEMA_VERSION literal 17 → 18).
- [x] Commit size checked — 8 files, 52 insertions / 11 deletions.
