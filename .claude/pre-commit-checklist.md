# Pre-Commit Checklist

- [x] On a feature branch (NOT main) — fix/usda-slug-pins-and-beverages
- [x] /review ran — 1 WARN found (Hebrew typo `בטטה נאה` → `בטטה`), fixed. No other findings at confidence ≥ 80.
- [x] lessons.md — added two entries: (1) schema validators encode physical reality not data-quality heuristics (`.positive()` → `.min(0)` for legit 0-kcal foods), (2) Hebrew `נא` vs `נאה` silent typo trap.
- [x] REVIEW.md — nothing to add. Existing i18n + schema rules already cover both findings at rule-of-thumb level.
- [x] TASKS.md updated — Done entry added summarizing 4 broken-slug pins, 5 beverage targets, schema relax, 181 → 191 entries, 2,094 tests.
- [x] git diff scanned for secrets/keys/tokens — no matches (data + schema only; USDA_API_KEY only used via env var, never written to a file).
- [x] npm run lint passes — clean
- [x] npm run typecheck passes — clean
- [x] npm test passes — 2,094 tests (prev 2,093 + 1 new "accepts zero calories" test)
- [x] Commit size checked — 6 files, ~278 insertions / 28 deletions, bulk is data.
