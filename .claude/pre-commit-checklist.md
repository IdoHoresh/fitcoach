# Pre-Commit Checklist

- [x] On a feature branch (NOT main) — feat/raw-ingredients-protein-dairy
- [x] /review skipped — pure data entry (nutrient tables + Hebrew names), no logic/algorithm change. Schema-side validation already covered by RawIngredientSchema + new catalog test.
- [x] lessons.md — nothing to add. Task 3 session 1 is data entry following the validated schema from Task 1 and fetch fixes from the recent PRs. No new patterns or pitfalls beyond what's already documented.
- [x] REVIEW.md — nothing to add. No new cross-cutting pattern; the catalog file is a flat array consumed by the Task 4 seed builder.
- [x] TASKS.md updated — Done entry added for Task 3 session 1 with the 71-entry breakdown and Tzameret-only list.
- [x] git diff scanned for secrets/keys/tokens — no secrets found (only `USDA_API_KEY` env var refs in sibling file fetch-usda.ts, which is unchanged).
- [x] npm run lint passes — clean
- [x] npm run typecheck passes — clean
- [x] npm test passes — 2,093 tests (6 new in raw-ingredients.test.ts)
- [x] Commit size checked — 3 files, +1397 lines, bulk is data entries in raw-ingredients.ts (expected per spec)
