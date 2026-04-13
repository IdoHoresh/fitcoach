# Bug: Duplicate food search results from different barcodes

**Date:** 2026-04-13
**Status:** Root Cause Found
**GitHub Issue:** N/A

## Symptoms

Food search for "גאודה" shows 4 visually identical rows: same name, same 352 kcal, same 25g protein. Noise pushes real variants off-screen. Same pattern exists for many other common products (גבינה לבנה 5%, etc.).

## Expected Behavior

One row per distinct food. Rows that share name + full macro profile collapse into a single entry.

## Reproduction Steps

1. Cold start app (seed v14 + v15 loaded)
2. Open food search, type `גאודה`
3. See 4× "גבינת גאודה פרוסה 28% שומן" at 352 kcal

## Investigation

### Measurements

| Seed          | Rows  | Distinct (name+macros) | Redundant | Groups with 2+ |
| ------------- | ----- | ---------------------- | --------- | -------------- |
| Shufersal v14 | 5,459 | 5,312                  | 147       | 127            |
| Rami Levy v15 | 7,180 | 7,136                  | 44        | 39             |

### Hypotheses

1. **Scraper double-ingested a category** — ruled out. `deduplicateScraped` catches exact `id` dupes; counts are 0.
2. **Same product under multiple barcodes** — confirmed. Gouda example:
   - `sh_7296073731832`, `sh_7296073731849`, `sh_7296073731856`, `sh_7296073731863` — 4 distinct EANs, identical `nameHe` + 352 kcal
   - Rami Levy: `rl_7290120861022`, `rl_7290020036414`, `rl_7290019363392` — 3 distinct EANs, identical name + 340 kcal
   - Cause: manufacturer assigns new EAN on relabel / package change / factory run; Shufersal and Rami Levy track each as a separate SKU.

### Root Cause

`scripts/deduplicate.ts::deduplicateScraped` and `scripts/build-rami-levy-seed.ts` both dedupe by `id` only. ID = `sh_<barcode>` or `rl_<barcode>`. Different barcode = different id, no collapse. Content-identical duplicates survive into the final seed and show up in search.

Cross-seed dedup (Rami Levy vs Shufersal) also runs only on barcode (`fetch-rl-nutrition.ts::loadShufersalBarcodes`). Same product under Rami Levy brand name with a different barcode passes through into v15.

## Fix

Add content-hash dedup alongside existing ID dedup. Apply in both seed builders and cross-seed.

### Dedup key

```
normalizeName(nameHe) | calories | protein | fat | carbs
```

`normalizeName` strips:

- Size tokens: `גר`, `גרם`, `ג'`, `ק"ג`, `קג`, `מ"ל`, `מל`, `ליטר`, `ל'` (with preceding digits)
- Percentage tokens: `NN%`
- Punctuation: `' " , . - ( )`
- Collapsed whitespace, lowercased

### Collision strategy

Keep the first occurrence. Existing seeds are category-ordered (Shufersal) or dept-ordered (Rami Levy) — earlier categories have higher data confidence. No merge of alternate barcodes (no barcode-scan feature yet; revisit when scanner ships).

### Changes

| File                                | Change                                                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `scripts/deduplicate.ts`            | Add `normalizeNameForDedup(name)` + `deduplicateByContent(foods)`; add content-set variant of `filterAgainstExisting`. |
| `scripts/deduplicate.test.ts`       | Add tests: exact dupe, size-token variant, punctuation variant, distinct-macros no-collapse, first-wins.               |
| `scripts/build-supermarket-seed.ts` | Call `deduplicateByContent` after existing ID dedup.                                                                   |
| `scripts/build-rami-levy-seed.ts`   | Call `deduplicateByContent` after existing ID dedup; cross-filter against Shufersal content hashes.                    |
| `src/assets/supermarket-seed.json`  | Regenerated (127 groups collapsed → ~147 fewer rows).                                                                  |
| `src/assets/rami-levy-seed.json`    | Regenerated (39 groups collapsed + cross-seed trim).                                                                   |

### Regression Test

`scripts/deduplicate.test.ts`:

- `deduplicateByContent` with 3 entries, 2 identical after name-normalization → returns 2
- Different calories with identical normalized name → both kept
- First-occurrence wins (assert first id preserved)
- Punctuation + size-token robustness (`400 גר` vs `400 ג'` collapse)

## Lessons Learned

Add to `lessons.md`: "Barcode is not identity. Same product ships under multiple EANs — always dedupe seed data by content hash (normalized name + full macro tuple), not just by id."

## Implementation Plan

### Task 1: `normalizeNameForDedup` + `deduplicateByContent` (S)

**Files:** `scripts/deduplicate.ts`, `scripts/deduplicate.test.ts`
**What:** Pure utility functions. `normalizeNameForDedup(name: string): string` and `deduplicateByContent(foods: FoodSeed[]): FoodSeed[]`. Key format `${normName}|${cals}|${pro}|${fat}|${carbs}`.
**Test first:**

- `normalizeNameForDedup('גבינה 400 גר')` === `normalizeNameForDedup("גבינה 400 ג'")`
- `deduplicateByContent` with two entries sharing normalized name + macros → length 1, first id preserved
- Different calories → no collapse
- Case/punctuation/whitespace invariance
  **Acceptance:** Tests pass, function is pure (no side effects).

### Task 2: Wire into Shufersal seed builder (S)

**Files:** `scripts/build-supermarket-seed.ts`
**What:** After existing `deduplicateScraped`, pipe through `deduplicateByContent`. Log count of content-collapsed rows in summary. Regenerate `src/assets/supermarket-seed.json`.
**Test first:** N/A (orchestration script — relies on Task 1 unit tests).
**Acceptance:** Run `npm run build-supermarket-seed`. Output shows ~147 fewer rows. Spot-check: `גבינת גאודה פרוסה 28% שומן` appears once.

### Task 3: Wire into Rami Levy seed builder + cross-seed content filter (M)

**Files:** `scripts/build-rami-levy-seed.ts`
**What:** After existing ID dedup, pipe through `deduplicateByContent`. Then load the Shufersal seed, build a content-hash `Set`, and drop any Rami Levy row whose hash already exists. Log both counts in summary. Regenerate `src/assets/rami-levy-seed.json`.
**Test first:** N/A (orchestration). Cross-seed filter uses the same pure function as Task 1.
**Acceptance:** Run `npm run build-rami-levy-seed`. Summary shows within-store content dupes + cross-seed content dupes. Final row count drops ~44 + cross-seed hits. `node -e "..."` spot-check: 0 groups with 2+ identical rows.

### Task 4: Verification + app cold-start test (S)

**Files:** none
**What:** Uninstall app → `npx expo start -c` → reinstall → search `גאודה`, `גבינה לבנה`, `יוגורט` — each search shows no visually identical rows. Metro log: `v15: Seeded <N> foods from Rami Levy catalog`.
**Acceptance:** Screenshots of each search show deduped results. No duplicate test plan item for PR.

### Task 5: Update lessons.md (XS)

**Files:** `lessons.md`
**What:** Add the "barcode is not identity" lesson.
**Acceptance:** Line added under the data-seeding section.

---

Total new logic surface: one pure function, ~30 LOC. Two script wire-ups, ~20 LOC each. Tests: ~80 LOC. Regenerated JSON seeds are the bulk of the diff.

## Phase 2 — Near-duplicate refinement

### Symptoms (phase 2)

After Phase 1 strict content dedup ships, residual duplicates remain:

- `גבינת גאודה פרוסה 28% שומן` @ 352 kcal, 25g protein
- `גבינת גאודה פרוסות 28%` @ 352 kcal, 25g protein (plural + missing trailing "שומן")
- `גבינת גאודה פרוסות 28%` @ 341 kcal, 23g protein (same name, ~3% calorie drift)

Same product. Strict hash fails because:

1. `פרוסה` (singular) vs `פרוסות` (plural) → different normalized name
2. Trailing orphan modifier `שומן` after `%` → different normalized name
3. 352 vs 341 kcal → different hash even when name matches

### Fix (phase 2)

Three-layer tightening of the content-hash key:

1. **Singular/plural whitelist** — a small map of known food-shape descriptors:
   - `פרוסות` → `פרוסה`
   - `מגורדות` → `מגורדת`
   - `טחונות` → `טחונה`
   - `קצוצות` → `קצוצה`
   - `פרוסים` → `פרוס`
   - `חתוכים` → `חתוך`
   - `טריים` → `טרי`
     Whitelist is intentionally narrow — Hebrew morphology is hard and general stemming risks false merges.

2. **Trailing orphan modifier drop** — after `normalizeNameForDedup` strips size tokens and punctuation, if the last word is a known orphan modifier (`שומן`, `ביתית`, `מצונן`), drop it. Applied only at the tail — keeps `חלב 3% שומן` distinct from `חלב 9% שומן` because the % is preserved.

3. **Macro bucketing** — round for the hash key only (original values preserved in the seed):
   - calories: nearest 10 (so 341 and 352 → both bucket to `340/350`, still distinct; but 349 and 352 both bucket to `350`)
   - protein, fat, carbs: nearest 1g
   - Risk bound: 10-kcal buckets only collapse items within ~3% of each other. Real "light" vs "full" variants usually diverge by more than 10 kcal per 100g.

For the problem case: after plural collapse + orphan drop, both rows normalize to `גבינת גאודה פרוסה 28` — identical. Then one buckets at 350 kcal, the other at 340 — **still distinct**. Acceptance criterion: bucketing must be to nearest 15 or based on a ±tolerance window to collapse 341↔352.

**Refined bucketing:** window-based, not round-to-nearest. Two foods collide if `|a.calories − b.calories| ≤ 15` AND `|a.protein − b.protein| ≤ 2` AND `|a.fat − b.fat| ≤ 2` AND `|a.carbs − b.carbs| ≤ 2` AND normalized names match. Window-based means we need a different data structure than a `Set<string>` hash.

### Implementation approach

Switch from hash-set dedup to a grouped pass:

```
1. Group foods by normalized name (post plural + orphan collapse)
2. Within each group, run single-pass clustering:
   for each food, check if any kept item is within the macro window.
   If yes, discard (keep first occurrence).
   If no, add to kept.
```

O(n·k) where k is group size (typically ≤ 10).

### Changes (phase 2)

| File                                | Change                                                                                                                                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/deduplicate.ts`            | Add `PLURAL_MAP`, `ORPHAN_TRAILING_MODIFIERS`, extend `normalizeNameForDedup`; add `deduplicateFuzzy` (window-based clustering); keep strict `deduplicateByContent` as a sub-step. |
| `scripts/deduplicate.test.ts`       | New tests: plural collapse, orphan drop, 352↔341 collision, 85↔100 no-collision (light vs full), cross-group isolation.                                                            |
| `scripts/build-supermarket-seed.ts` | Replace `deduplicateByContent` call with `deduplicateFuzzy`.                                                                                                                       |
| `scripts/build-rami-levy-seed.ts`   | Replace `deduplicateByContent` call with `deduplicateFuzzy`; cross-seed filter still uses strict content hash (cross-store fuzzy is riskier, deferred).                            |
| `src/assets/supermarket-seed.json`  | Regenerated.                                                                                                                                                                       |
| `src/assets/rami-levy-seed.json`    | Regenerated.                                                                                                                                                                       |

## Implementation Plan — Phase 2

### Task 6: Plural + orphan modifier normalization (S)

**Files:** `scripts/deduplicate.ts`, `scripts/deduplicate.test.ts`
**What:** Add `PLURAL_MAP` constant (7 entries above), add `ORPHAN_TRAILING_MODIFIERS` constant (`שומן`, `ביתית`, `מצונן`). Extend `normalizeNameForDedup`: after current cleanup, tokenize on whitespace, map each token via `PLURAL_MAP`, then drop the last token if it's in `ORPHAN_TRAILING_MODIFIERS`.
**Test first:**

- `normalizeNameForDedup('גבינת גאודה פרוסות 28%')` === `normalizeNameForDedup('גבינת גאודה פרוסה 28% שומן')`
- Keeps non-trailing `שומן` intact (e.g. `חלב שומן מלא 3%` — `שומן` is not last)
- Keeps distinct products distinct (`גבינה לבנה 5%` ≠ `גבינה צהובה 5%`)
  **Acceptance:** Existing 32 tests still pass, 3+ new plural/orphan tests pass.

### Task 7: Window-based fuzzy clustering (M)

**Files:** `scripts/deduplicate.ts`, `scripts/deduplicate.test.ts`
**What:** Add `deduplicateFuzzy(foods: FoodSeed[]): FoodSeed[]`. Step 1: group by normalized name. Step 2: within each group, single-pass clustering — keep a food if no already-kept food in the same group is within the macro window (±15 kcal, ±2g protein, ±2g fat, ±2g carbs). First occurrence wins.
**Test first:**

- Two rows same normalized name, calories 352 vs 341 → collapse to 1
- Two rows same normalized name, calories 62 vs 85 (light vs full) → keep both
- Two rows different normalized names, same macros → keep both
- First occurrence preserved on collision
- Empty array → empty array
- 100-row stress test with known dup pattern
  **Acceptance:** Tests pass. Function is pure.

### Task 8: Wire `deduplicateFuzzy` into seed builders (S)

**Files:** `scripts/build-supermarket-seed.ts`, `scripts/build-rami-levy-seed.ts`
**What:** Replace the current `deduplicateByContent` call with `deduplicateFuzzy`. Update log labels to `Fuzzy dedup`. Cross-seed step in Rami Levy builder continues to use strict `buildContentHash` (cross-store fuzzy is higher-risk, deferred).
**Acceptance:** `npm run build-supermarket-seed` shows additional collapses vs Phase 1. `npm run build-rami-levy-seed` likewise. Spot-check: `גאודה` search in the merged seed shows no trivially-identical pairs.

### Task 9: Verification (S)

**Files:** none
**What:** Compile a list of 10 common search terms (גאודה, גבינה לבנה, יוגורט, לחם, חלב, שמנת, קוטג', חומוס, טונה, שוקולד). For each, run node one-liner that filters the merged seed and prints name + kcal + protein. Eyeball for residual near-dupes. Cold-start app, search each term, screenshot.
**Acceptance:** No pair of rows in the same search result share a normalized name. Residual duplicates, if any, are documented as genuinely distinct (e.g., different brands with meaningfully different macros).

### Task 10: Update lessons.md + commit Phase 1+2 as one PR (S)

**Files:** `lessons.md`
**What:** Extend the Phase 1 lesson: "Barcode is not identity — AND neither is a strict content hash when supermarket data has plural-form, trailing-modifier, and small-drift noise. Fuzzy dedup with singular/plural whitelist + macro window is needed for clean Hebrew product lists."
**Acceptance:** Line added. Ship both phases in one PR — scope is still a single bugfix (duplicate food search).
