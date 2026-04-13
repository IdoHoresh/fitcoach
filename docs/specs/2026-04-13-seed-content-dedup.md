# Bug: Duplicate food search results across seed sources

**Date:** 2026-04-13
**Status:** Approved — merged scope (v2), plan ready
**GitHub Issue:** N/A

## Symptoms

Two reports, one root cause:

1. **Identical-macro dupes.** Food search for `גאודה` shows 4 visually identical rows: same name, same 352 kcal, same 25g protein. Same pattern in `גבינה לבנה 5%`, etc.
2. **Near-identical dupes with drifted macros.** Food search for `אורז` shows 3× `אורז פרסי` at 348 / 350 / 336 kcal — same product under 3 barcodes, Shufersal logged each with slightly different nutrition. One has `0g protein` (garbage row).
3. **Raw-ingredient v16 surfaces correctly for narrow queries** (`אורז לבן` → `raw_rice_white_raw` ranks #1), but broader queries buried under duplicate sh\_% noise.

## Expected Behavior

One row per distinct food, regardless of source (raw v16 / Shufersal v14 / Rami Levy v15). Zero visible duplicates in search. Invariant: `SELECT name_norm, COUNT(*) FROM foods GROUP BY name_norm HAVING COUNT(*) > 1` returns an empty set post-cleanup.

## Root Cause

Three compounding gaps:

1. **No content-level dedup at build time.** `scripts/deduplicate.ts::deduplicateScraped` and `scripts/build-rami-levy-seed.ts` dedup by `id` only (= barcode). Same product under multiple EANs survives.
2. **No cross-source dedup.** v14/v15/v16 migrations each `INSERT OR IGNORE`, which only catches PK (`id`) collisions. A raw ingredient and a Shufersal row with the same normalized name co-exist.
3. **No runtime enforcement.** Schema has `id TEXT PRIMARY KEY` only (`src/db/schema.ts:261`). No `name_norm` column, no uniqueness guard, no cleanup pass.

### Measured dup counts (pre-fix)

| Seed          | Rows  | Distinct (name+macros) | Redundant | Groups ≥2 |
| ------------- | ----- | ---------------------- | --------- | --------- |
| Shufersal v14 | 5,459 | 5,312                  | 147       | 127       |
| Rami Levy v15 | 7,180 | 7,136                  | 44        | 39        |
| Cross-source  | —     | —                      | unknown   | unknown   |

## Design

Defense in depth: dedup at build time (per-source + cross-source), then again at runtime (v17 migration) with tier-based winner selection. New `name_norm` column persists the normalization so search and future seeds stay consistent.

### Normalization rule (`normalizeNameForDedup`)

Applied to every `name_he` before hashing or comparison:

1. Trim, lowercase (no-op for Hebrew, applies to nameEn fallbacks)
2. Strip nikud (U+0591..U+05C7)
3. Strip size tokens with preceding digits: `גר|גרם|ג'|ק"ג|קג|מ"ל|מל|ליטר|ל'`
4. Strip percentage tokens: `\d+%`
5. Strip punctuation: `()[]"'״`,.-/`
6. Collapse whitespace
7. Tokenize; apply plural map (`פרוסות→פרוסה`, `מגורדות→מגורדת`, `טחונות→טחונה`, `קצוצות→קצוצה`, `פרוסים→פרוס`, `חתוכים→חתוך`, `טריים→טרי`)
8. Drop trailing orphan modifiers if last token: `שומן`, `ביתית`, `מצונן`

Narrow by design — Hebrew morphology is hard; aggressive stemming risks false merges.

### Dedup strategy (three passes)

**Pass 1 — within-source strict (build-time, per seed builder)**
Key = `normalizeNameForDedup(name) | cals | protein | fat | carbs`. Collapses exact content dupes. First occurrence wins.

**Pass 2 — within-source fuzzy (build-time, per seed builder)**
Group survivors by `normalizeNameForDedup(name)`. Single-pass clustering within each group: a row collides with a kept row if all four macros are within window (`±15 kcal`, `±2g` protein/fat/carbs). First occurrence wins **unless** the kept row has a garbage marker (`kcal = 0`, or `protein = 0 AND kcal > 100`), in which case the new row replaces it. Tie-break on non-null field count, then lowest id.

Handles `אורז פרסי 348/350/336` — all collapse; `336 kcal / 0g protein` replaced by richer `348 kcal / 6g protein`.

**Pass 3 — cross-source tier cleanup (runtime, v17 migration)**
After v14/v15/v16 have all loaded, delete rows where a higher-tier row with the same `name_norm` exists. Tier order: `raw_% = 0` (keep) > `manual_% = 1` > `sh_% = 2` > `rl_% = 3`. SQL:

```sql
DELETE FROM foods WHERE id IN (
  SELECT f.id FROM foods f
  WHERE EXISTS (
    SELECT 1 FROM foods f2
    WHERE f2.name_norm = f.name_norm
      AND source_tier(f2.id) < source_tier(f.id)
  )
)
```

(`source_tier` inlined as `CASE WHEN id LIKE 'raw_%' THEN 0 ... END`.)

### Schema change (v17)

| Column      | Type | Purpose                                                      |
| ----------- | ---- | ------------------------------------------------------------ |
| `name_norm` | TEXT | Normalized name for dedup + search. NOT NULL after backfill. |

Non-unique index: `CREATE INDEX idx_foods_name_norm ON foods(name_norm)`.

Migration steps:

1. `ALTER TABLE foods ADD COLUMN name_norm TEXT`
2. Backfill: `UPDATE foods SET name_norm = <computed>` — done in TypeScript loop since SQLite can't call JS normalization.
3. Create index.
4. Run Pass 3 cross-source cleanup.
5. Re-log row counts.

Not `UNIQUE` — tolerant of legitimate same-name distinct foods (e.g. two genuinely different brand variants that survive fuzzy clustering because their macros diverge >window).

### Search integration

`food-repository.ts::search` keeps current ranker (start-match → source tier → name_he ASC). No change needed — with dedup done, the existing tier tiebreak becomes mostly decorative but stays as belt-and-suspenders.

Optional win: use `name_norm LIKE ?` as an additional OR match to catch queries with nikud / alternate punctuation. Deferred — not in scope unless retro-test shows misses.

## Files to Create/Modify

| File                                    | Action | Description                                                                                                                                                                              |
| --------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/deduplicate.ts`                | Modify | Add `normalizeNameForDedup`, `deduplicateByContent`, `deduplicateFuzzy`, plural/orphan constants.                                                                                        |
| `scripts/deduplicate.test.ts`           | Modify | Tests for normalization, strict content dedup, fuzzy window, garbage-row replacement, first-wins.                                                                                        |
| `scripts/build-supermarket-seed.ts`     | Modify | Pipe through `deduplicateByContent` → `deduplicateFuzzy` after existing id dedup. Log collapse counts.                                                                                   |
| `scripts/build-rami-levy-seed.ts`       | Modify | Same pipeline. Cross-seed strict-hash filter against Shufersal seed. Log all three counts.                                                                                               |
| `scripts/build-raw-ingredients-seed.ts` | Modify | (If exists) also run the dedup pipeline for symmetry. Raw seed is curated so collapses should be zero.                                                                                   |
| `src/assets/supermarket-seed.json`      | Modify | Regenerated.                                                                                                                                                                             |
| `src/assets/rami-levy-seed.json`        | Modify | Regenerated.                                                                                                                                                                             |
| `src/db/schema.ts`                      | Modify | Bump `CURRENT_SCHEMA_VERSION` to 17. Add `name_norm` column + index to CREATE TABLE.                                                                                                     |
| `src/db/database.ts`                    | Modify | Add `migrateToV17` — ALTER TABLE, backfill, create index, run cross-source cleanup. Write Hebrew normalization helper in TS (shared with scripts via `src/shared/normalizeFoodName.ts`). |
| `src/shared/normalizeFoodName.ts`       | Create | Single source of truth for `normalizeNameForDedup`. Imported by both scripts and db migration.                                                                                           |
| `src/shared/normalizeFoodName.test.ts`  | Create | Unit tests for the shared helper.                                                                                                                                                        |
| `src/db/food-repository.test.ts`        | Modify | Integration test: load real seeds, assert zero-dup invariant via `name_norm` group-by.                                                                                                   |
| `lessons.md`                            | Modify | "Barcode is not identity; content hash is not identity either — plural/orphan/macro drift needs fuzzy window + runtime tier cleanup."                                                    |

## Acceptance Criteria

- [ ] `normalizeNameForDedup` unit tests pass: plural collapse, orphan drop, size-token strip, nikud strip, punctuation strip, whitespace collapse
- [ ] `deduplicateByContent` collapses exact content dupes, first-wins
- [ ] `deduplicateFuzzy` collapses `אורז פרסי 348/350/336` → 1 row; keeps `חלב 3% 62kcal` and `חלב 9% 100kcal` separate; garbage row (0g protein, >100kcal) replaced by richer row
- [ ] `build-supermarket-seed` logs within-source dedup counts; regenerated JSON has zero strict-hash collisions
- [ ] `build-rami-levy-seed` logs within-source + cross-seed counts; regenerated JSON has zero cross-Shufersal strict collisions
- [ ] v17 migration runs on cold start, logs cross-source delete count
- [ ] Integration test: load all 3 seeds + run v17, assert `SELECT name_norm, COUNT(*) FROM foods GROUP BY name_norm HAVING COUNT(*)>1` returns empty
- [ ] Device verification (Task 7 re-scoped): cold-start app, search `חזה עוף`, `שמן זית`, `ביצה`, `תפוח`, `אורז לבן`, `גאודה` — each shows zero visible duplicates; top result for each raw-covered query is a `raw_%` row
- [ ] Portion picker for chosen raw row shows natural unit + logs successfully
- [ ] Lesson added to `lessons.md`

## Task Breakdown

1. [ ] **T1 — Shared normalization helper** (S). Create `src/shared/normalizeFoodName.ts` + tests. Covers rules 1-8 above.
2. [ ] **T2 — `deduplicateByContent` strict hash** (S). `scripts/deduplicate.ts` + tests.
3. [ ] **T3 — `deduplicateFuzzy` window + garbage replacement** (M). `scripts/deduplicate.ts` + tests. Covers garbage-row replace logic.
4. [ ] **T4 — Wire Shufersal builder** (S). Regenerate `supermarket-seed.json`. Spot-check gouda + persian rice.
5. [ ] **T5 — Wire Rami Levy builder + cross-seed filter** (M). Regenerate `rami-levy-seed.json`.
6. [ ] **T6 — Wire raw-ingredients builder** (XS). Curated seed; expect 0 collapses but run pipeline for symmetry.
7. [ ] **T7 — Schema v17 + name_norm column** (S). `schema.ts` bump, `database.ts` migrate helper skeleton.
8. [ ] **T8 — v17 migration: backfill + cleanup** (M). Backfill loop (TS-side normalization), cross-source tier delete, index creation, logging.
9. [ ] **T9 — Integration test: zero-dup invariant** (S). Load all 3 seeds in test env, run migration, assert.
10. [ ] **T10 — Device cold-start verification** (S). Re-do Task 7 acceptance list with 6 search terms; screenshot each.
11. [ ] **T11 — Lessons + TASKS.md update** (XS).

Total: ~11 tasks. TDD mandatory for T1-T3 + T8 (business logic).

## Implementation Plan

Dependency order locked: T1 → (T2, T3) → (T4, T5, T6) → T7 → T8 → T9 → T10 → T11. T4/T5/T6 independent once T2+T3 land. T7 can start in parallel with T4-T6 since it only touches schema.

### Task 1: Shared normalization helper (S)

**Files:** `src/shared/normalizeFoodName.ts` (create), `src/shared/normalizeFoodName.test.ts` (create)
**What:** Pure function `normalizeNameForDedup(name: string): string`. Rules 1-8 from Design. Export `PLURAL_MAP` and `ORPHAN_TRAILING_MODIFIERS` constants. Shared module so both scripts and the v17 db migration import the same implementation — avoids drift between build-time and runtime normalization.
**Test first (RED):**

- `normalize('אורז לבן יבש')` === `'אורז לבן יבש'` (no-op baseline)
- Nikud: `normalize('חָלָב')` === `'חלב'`
- Size tokens: `normalize('גבינה 400 גר')` === `normalize("גבינה 400 ג'")` === `'גבינה'`
- Percent: `normalize('חלב 3%')` === `'חלב'` — **and assert this is intentional** (downstream fuzzy clustering uses macro window to re-separate 3% from 9%)
- Punctuation: `normalize('גבינה (פרוסה)')` === `normalize('גבינה פרוסה')`
- Plural: `normalize('גבינה פרוסות')` === `normalize('גבינה פרוסה')`
- Orphan tail: `normalize('גבינת גאודה 28% שומן')` === `normalize('גבינת גאודה 28%')` === `'גבינת גאודה'`
- Orphan NOT dropped mid-string: `normalize('חלב שומן מלא')` retains `שומן`
- Whitespace: `normalize('  חלב   מלא  ')` === `'חלב מלא'`
- Empty / whitespace-only → `''`
  **Acceptance:** All tests green. Function is pure (no side effects, no I/O).

### Task 2: `deduplicateByContent` strict hash (S)

**Files:** `scripts/deduplicate.ts` (modify), `scripts/deduplicate.test.ts` (modify)
**What:** `deduplicateByContent(foods: FoodSeed[]): FoodSeed[]`. Key = `${normalizeNameForDedup(nameHe)}|${cals}|${pro}|${fat}|${carbs}`. First occurrence wins. Imports helper from `src/shared/normalizeFoodName.ts`.
**Test first (RED):**

- Two entries same name + identical macros → length 1, first id preserved
- Two entries same name + different kcal → length 2 (strict hash keeps both)
- Empty array → empty array
- Single entry → unchanged
- Order preserved for survivors
- Null/missing macros treated consistently (spec: coerce `null → 0` for hash)
  **Acceptance:** Tests green. Pure function.

### Task 3: `deduplicateFuzzy` window + garbage replacement (M)

**Files:** `scripts/deduplicate.ts` (modify), `scripts/deduplicate.test.ts` (modify)
**What:** `deduplicateFuzzy(foods: FoodSeed[]): FoodSeed[]`. Two-step:

1. Group by normalized name.
2. Within each group, single-pass: for each row, if any kept row is within window (`|Δkcal| ≤ 15 AND |Δp| ≤ 2 AND |Δf| ≤ 2 AND |Δc| ≤ 2`) → collision. On collision, the **richer** row wins (replace kept if new row has strictly more non-null fields OR `kept.isGarbage && !new.isGarbage`). `isGarbage(row) := kcal === 0 || (protein === 0 && kcal > 100)`. Tie-break: lowest id.

**Test first (RED):**

- `אורז פרסי 348 / 350 / 336` all with valid macros → collapses to 1 (the one with most non-null fields)
- `אורז פרסי 336 kcal, protein=0` + `אורז פרסי 348 kcal, protein=6` → garbage row dropped, richer row kept regardless of order
- `חלב 3% 62kcal` + `חלב 9% 100kcal` → both kept (post-normalization same name, but Δkcal = 38 > 15)
- Two different normalized names with identical macros → both kept
- Three rows within window → collapse to 1, first-wins on tie
- First occurrence preserved when all rows equally rich
- Empty group → empty
- Stress: 100 rows, 20 dup clusters → exactly 80 survivors
  **Acceptance:** All tests green. Pure function. `אורז פרסי 348/350/336` case explicitly asserted.

### Task 4: Wire Shufersal builder (S)

**Files:** `scripts/build-supermarket-seed.ts` (modify), `src/assets/supermarket-seed.json` (regenerate)
**What:** After existing `deduplicateScraped` (id dedup), pipe through `deduplicateByContent` → `deduplicateFuzzy`. Log three counts: `id-dedup dropped N`, `content-dedup dropped N`, `fuzzy-dedup dropped N`. Regenerate seed.
**Test first:** N/A (orchestration script — Task 1-3 cover the pure logic).
**Acceptance:** Run `npm run build-supermarket-seed` (or equivalent). Output shows collapse counts. Spot-check in node REPL: zero exact-hash collisions, `אורז פרסי` appears once, `גבינת גאודה פרוסה 28% שומן` appears once. Row count drops by ~147 + fuzzy-collapse delta.

### Task 5: Wire Rami Levy builder + cross-seed strict filter (M)

**Files:** `scripts/build-rami-levy-seed.ts` (modify), `src/assets/rami-levy-seed.json` (regenerate)
**What:** Same pipeline as Task 4 for within-source. Then: load regenerated `supermarket-seed.json`, build a `Set<contentHash>` from it using the **strict** hash (not fuzzy — per existing lessons.md rule), drop any Rami Levy row whose content hash matches. Log three counts + cross-seed drop count.
**Test first:** N/A (orchestration). Relies on T1-T3.
**Acceptance:** Run builder. Output shows all four counts. Regenerated JSON has zero within-source strict-hash collisions AND zero Shufersal strict-hash overlaps.

### Task 6: Wire raw-ingredients builder symmetry (XS)

**Files:** `scripts/build-raw-ingredients-seed.ts` (modify if exists; else document why skipped), `src/assets/raw-ingredients-seed.json` (regenerate if changed)
**What:** Run the same `deduplicateByContent → deduplicateFuzzy` pipeline for safety. Raw is curated; expect 0 collapses. If no builder exists (seed is hand-maintained), add a one-line test in `scripts/deduplicate.test.ts` that loads the current JSON and asserts `deduplicateFuzzy(raw).length === raw.length`.
**Acceptance:** Either pipeline runs with 0 collapses, or test asserts raw seed is already clean.

### Task 7: Schema v17 + name_norm column skeleton (S)

**Files:** `src/db/schema.ts` (modify), `src/db/database.ts` (modify — add empty `migrateToV17` stub + version bump), `src/db/schema.test.ts` (modify if exists)
**What:** Bump `CURRENT_SCHEMA_VERSION` to 17. Add `name_norm TEXT` to the `foods` CREATE TABLE definition (so fresh installs get it). Add the index DDL (`CREATE INDEX IF NOT EXISTS idx_foods_name_norm ON foods(name_norm)`). Add empty `migrateToV17(db)` function + wire into migration switch with the seed-guard pattern (`currentVersion < 17`, not `> 0 && < 17` — fresh installs must run cleanup too because they load all 3 seeds).
**Test first (RED):** Update existing schema test to assert:

- `CURRENT_SCHEMA_VERSION === 17`
- `foods` CREATE statement contains `name_norm TEXT`
- Index DDL exists in schema file
  **Acceptance:** Tests green. v17 migration is a no-op stub; T8 fills it.

### Task 8: v17 migration — backfill + tier cleanup + index (M)

**Files:** `src/db/database.ts` (modify), `src/db/database.test.ts` (modify) or `src/db/food-repository.test.ts` (modify)
**What:** Fill `migrateToV17`:

1. `ALTER TABLE foods ADD COLUMN name_norm TEXT` (guarded — skip if column exists, since fresh installs already have it via T7 CREATE TABLE)
2. Backfill loop: `SELECT id, name_he FROM foods WHERE name_norm IS NULL` → batch `UPDATE foods SET name_norm = ? WHERE id = ?` using `normalizeNameForDedup` from `src/shared/normalizeFoodName.ts`. Batch size ≤ 100 rows per transaction.
3. `CREATE INDEX IF NOT EXISTS idx_foods_name_norm ON foods(name_norm)`
4. Cross-source tier cleanup via inline CASE (`raw_% → 0`, `manual_% → 1`, `sh_% → 2`, `rl_% → 3`). DELETE rows where a same-`name_norm` row with lower tier number exists.
5. Log: `[Database] v17: backfilled N name_norm, deleted M cross-source dups`

**Test first (RED):**

- Seed test DB with: `sh_test1 = 'אורז פרסי'`, `rl_test1 = 'אורז פרסי'`, `raw_rice_persian = 'אורז פרסי'`, all different kcal → after migration, only `raw_rice_persian` survives
- Seed test DB with all rows having `name_norm = NULL` → after migration, all rows have non-null `name_norm`
- Seed test DB with no cross-source collisions → delete count = 0
- Seed test DB with two distinct raw rows same name → both survive (only cross-tier deletes, same-tier kept)
- Fresh install (v0 → v17) runs migration successfully
- Upgrade install (v16 → v17) runs migration successfully
  **Acceptance:** All tests green. Migration is idempotent (re-running v17 on already-migrated DB is safe no-op).

### Task 9: Integration test — zero-dup invariant (S)

**Files:** `src/db/food-repository.test.ts` (modify) or new `src/db/dedup.integration.test.ts` (create)
**What:** Load actual regenerated `raw-ingredients-seed.json`, `supermarket-seed.json`, `rami-levy-seed.json` via `require`. Seed a fresh in-memory SQLite db using the same code path as v14/v15/v16 migrations + v17. Query `SELECT name_norm, COUNT(*) FROM foods GROUP BY name_norm HAVING COUNT(*) > 1`. Assert zero rows.

Also assert the raw-search invariant: `SELECT * FROM foods WHERE name_he LIKE '%אורז%' ORDER BY <full ranker>` returns a `raw_%` id as position 1.

**Test first (RED):** This test IS the failing spec — it should fail on main today and pass after T1-T8 ship.
**Acceptance:** Test green. Catches any future seed regression.

### Task 10: Device cold-start verification (S)

**Files:** none (manual)
**What:** Uninstall Expo Go app on device. `npx expo start -c`. Reload. Metro log must show: `v14: Seeded ... v15: Seeded ... v16: Seeded ... v17: backfilled N name_norm, deleted M cross-source dups`. Then in-app search each term: `חזה עוף`, `שמן זית`, `ביצה`, `תפוח`, `אורז לבן`, `גאודה`. For each:

- Screenshot top 5 results
- Assert zero visually-identical rows
- For `חזה עוף`, `שמן זית`, `ביצה`, `תפוח`, `אורז לבן`: assert top row has `raw_%` source (check via selecting + inspecting stored id in food log, or add temporary dev badge)
  Then pick one raw result → portion picker → log it → check food log shows Hebrew name persisted.
  **Acceptance:** All 6 searches dup-free. 5 raw-covered queries surface raw row at #1. Portion picker + log flow works end-to-end.

### Task 11: Lessons + TASKS.md update (XS)

**Files:** `lessons.md` (modify), `TASKS.md` (modify — mark Task 7 of raw-ingredients spec + this bugfix as done with date 2026-04-13)
**What:** Extend the existing "Seed Dedup" lesson block:

- Add: "Content hash is not identity either — plural/orphan-modifier/small-drift noise survives strict hashing. Fuzzy window (±15 kcal, ±2g macros) with garbage-row replacement catches the residual."
- Add: "Defense in depth: build-time dedup can drift from runtime dedup if they diverge. Share one `normalizeNameForDedup` module between scripts and db migration."
- Add: "Runtime migration enforcement (v17 cross-source tier cleanup) catches what seed builders miss — and catches future regressions from new sources."
  **Acceptance:** Lines added. TASKS.md reflects state. Same commit as the feature per workflow.md.

## Open Questions

None blocking. Deferred for later:

- Cross-seed _fuzzy_ dedup (currently only strict-hash across stores — risk of false merges higher when product names drift across chains). Revisit if users report cross-store visible dupes post-ship.
- `name_norm` as search column (currently only dedup key). Add if users report nikud/punct search misses.
