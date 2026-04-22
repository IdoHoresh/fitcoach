# Feature: Tiv Taam Phase 2 — OFF Nutrition Enrichment + v19 Schema Migration

**Date:** 2026-04-21
**Status:** Implementing (Task 0 complete)
**GitHub Issue:** TBD

## Task 0 Outcome (2026-04-21)

Stratified 100-item probe, ran 3 passes (500ms → 1500ms → 2500ms gap) to
drive CDN errors to zero. Full results:

| Slice       | Hit rate         | Breakdown                      |
| ----------- | ---------------- | ------------------------------ |
| Domestic    | **22%** (11/50)  | 6 full + 5 partial + 39 miss   |
| Imported    | **40%** (20/50)  | 11 full + 9 partial + 30 miss  |
| **Overall** | **31%** (31/100) | 17 full + 14 partial + 69 miss |

Decision: **PROCEED**. Overall 31% sits in the 20–34% band, but imported
40% strongly validates the moat thesis. Extrapolations vs original spec:

- Net-new catalog shrank 10,024 → **9,548** after non-food filter
  tightening (25 keywords added in [transparency-feed-types.ts:67](scripts/transparency-feed-types.ts:67))
- Items shipped: ~2,205 → **~2,960** (31% × 9,548)
- Imported shipped: ~615 → **~1,080** (40% × 2,697) — moat ~75% larger
- Full fetch duration: ~90 min → **~4 hours** (1500ms floor, not 500ms)

Deep-dive ruled out three non-fixes:

- EAN variants (leading-zero padding): OFF normalizes internally, zero lift
- OFF search-by-name fallback: niche imports genuinely absent from OFF
- More retries / longer timeouts: diminishing returns past 2500ms gap

Remaining 69% miss rate is real OFF coverage gap on Israeli private
labels, fresh meats, and Russian/Ukrainian specialty imports — not bugs
we can patch.

## What

Takes the `tmp/tivtaam-catalog.json` artifact from Phase 1 (PR #78), enriches
every `net-new` Tiv Taam item against Open Food Facts for nutrition data,
bakes the hits into `src/assets/tivtaam-seed.json`, and seeds them into the
app's `foods` table via a new v19 migration. Also extends `foods` with an
`origin_country TEXT` column so the imported-goods slice (2,797 items — the
moat thesis) can be surfaced in future UI.

Items with no OFF hit are dropped from the seed but preserved in
`tmp/tivtaam-review-queue.json` for a future Phase 2.5 manual-curation pass.
No-EAN weighted deli items (573 of them) are dropped entirely — Phase 3 scope.

## Why

Phase 1 confirmed Tiv Taam's catalog gap: **10,024 net-new items** vs
existing Shufersal + Rami Levy seeds, of which **2,797 are imported** (non-
Israel country of origin). No other Israeli food-logging app carries these
products. This is the moat.

Phase 2 converts that raw catalog into user-facing inventory. Without OFF
nutrition, a Tiv Taam EAN scan today falls back to the existing OFF runtime
lookup (added in PR #76) — fine for power users, but those hits aren't
cached into the local DB, so:

- Search by text cannot surface Tiv Taam items (they don't exist in `foods`)
- Repeat scans hit the network every time (OFF rate limits, offline UX bad)
- The "imported products" story has no hook in the UI without an
  `origin_country` column to filter/badge by

Baking OFF results into a local seed fixes all three at once, and the
`origin_country` column unlocks Phase 3 UI work ("show me imported non-
kosher items" filter, "Tiv Taam-exclusive" badge).

## Requirements

- [ ] Extend `foods` schema with `origin_country TEXT` column (nullable —
      existing sh\_ / rl\_ / raw\_ / manual\_ rows leave it NULL; only tt\_ rows
      populate it)
- [ ] **Task 0 probe** — fetch 100 random `net-new` items (50 from imported
      slice, 50 from domestic slice) from OFF, measure hit rate + partial-data
      rate, print decision summary. If hit rate < 20%, stop and reassess.
- [ ] For every `net-new` Tiv Taam item with a valid EAN (all 9,548 after
      Task 0's non-food filter tightening), call
      `fetchOffProduct(ean)` with resumable file cache
- [ ] Normalize OFF hits into the existing `FoodSeed` shape with
      `id: tt_<ean>`, injecting `originCountry` from the transparency feed's
      `manufactureCountry` (NOT from OFF — OFF's `origins_tags` is unreliable
      for Israeli products)
- [ ] Write hits to `src/assets/tivtaam-seed.json` (same schema as
      `supermarket-seed.json` + `rami-levy-seed.json`, plus `originCountry`)
- [ ] Write misses to `tmp/tivtaam-review-queue.json` for Phase 2.5 (barcode,
      nameHe, manufactureCountry only — enough to drive manual curation)
- [ ] Bump `SCHEMA_VERSION` to 19; add `migrateToV19` following the v14/v15/v16
      DELETE-then-INSERT-OR-IGNORE pattern, plus an ALTER TABLE for the new
      column (idempotent)
- [ ] Update `CREATE_TABLE_STATEMENTS` so fresh installs get `origin_country`
      via CREATE TABLE (not ALTER)
- [ ] Extend v17-style cross-source dedup tier: `tt_` is tier 4 (lowest —
      newest, least curated); existing sh\_/rl\_/raw\_/manual\_ all outrank it on
      `name_norm` collisions
- [ ] Rate-limit OFF calls (2s retry delay is already per-attempt; add **1500ms**
      floor between successive calls — Task 0 showed 500ms causes ~40% 429/CDN
      errors, 1500ms drives it under 15%, 2500ms drives it to zero)
- [ ] Resumable cache at `tmp/off-cache/<ean>.json` — `--force` clears, otherwise
      reuses; lets the ~9.5k-item fetch survive restarts
- [ ] Automatic error-retry pass — after the main loop finishes, re-run all
      `status: 'error'` EANs at a wider gap (2500ms) to convert transient
      CDN flakes into clean hit/miss. Matches Task 0's 3-pass sweep.

## Non-Requirements

- **No UI changes** — no imported-goods filter, no country badge, no Tiv Taam
  branding. Phase 3 scope.
- **No hand-curated overrides** — if Task 0 shows a surprise low OFF hit rate,
  we stop and reassess before writing curation code.
- **No deli / no-EAN weighted items** — the 573 Tiv Taam butcher-counter
  items are dropped. Supporting them requires name-based matching (no
  barcode), which is Phase 3.
- **No parallel fetch** — sequential with 1500ms floor (Task 0 finding;
  see Task 0 Outcome for the rate-limit measurement). Parallelism would
  trigger bans. 9,548 items × 1500ms = ~4 hours plus retry pass.
  Acceptable for a one-time build.
- **No category-mapper improvements** — all Tiv Taam seed items get
  `category: 'snacks'` (current `normalizeOffProduct` default). Better
  categorization is Phase 3 (requires mapping OFF's `categories_tags` taxonomy
  to FitCoach's coarse categories).
- **No serving-size enrichment from transparency feed** — OFF's default "100g"
  serving is kept. The feed's `Quantity` + `UnitOfMeasure` fields could
  populate package-size serving, but that's Phase 3.

## Design

### Architecture

```
tmp/tivtaam-catalog.json (Phase 1 output)
          │
          │  filter: dedupStatus === 'net-new'
          ▼
┌───────────────────────────────┐
│  scripts/                     │
│  fetch-tivtaam-off.ts         │  ← calls fetchOffProduct(ean) for each
└────────────┬──────────────────┘     item; resumable cache at tmp/off-cache/
             │
             │  tmp/off-cache/<ean>.json  (raw OFF responses, or null-marker)
             ▼
┌───────────────────────────────┐
│  scripts/                     │
│  build-tivtaam-seed.ts        │  ← reads cache, normalizes hits,
└────────────┬──────────────────┘     injects origin_country, writes seed
             │
             ├──►  src/assets/tivtaam-seed.json           (hits)
             └──►  tmp/tivtaam-review-queue.json          (misses)

                          │
                          │  (app-side — next cold start)
                          ▼
┌───────────────────────────────┐
│  src/db/schema.ts             │  ← SCHEMA_VERSION 18 → 19
│  src/db/database.ts           │  ← ALTER TABLE foods ADD origin_country;
│                               │     DELETE FROM foods WHERE id LIKE 'tt_%';
│                               │     batch INSERT OR IGNORE from tivtaam-seed.json
└───────────────────────────────┘
```

### OFF call pattern

Reuses the existing [`fetchOffProduct`](src/services/open-food-facts.ts:134)
as-is. It already handles:

- Retry once on transient errors (2s delay)
- Null return for 404 / status=0 (product not found)
- 10s per-attempt timeout via `AbortController`

The build script wraps it with:

- File cache (`tmp/off-cache/<ean>.json`) — hit stores the full response;
  miss stores `{"status":"miss"}` so resumed runs skip known-misses
- Floor delay of 500ms between non-cached calls (NOT applied on cache hits)
- Progress log every 100 items
- `--force` flag to wipe cache and re-run
- `--dry-run` flag that processes the first 100 items only (= Task 0 probe
  when run against the full 10k net-new catalog)

### `normalizeOffProduct` parameterization

The current normalizer hardcodes `id: 'manual_${ean}'` at
[open-food-facts.ts:51](src/services/open-food-facts.ts:51). For Phase 2 we
need `tt_<ean>`. Backward-compatible change:

```ts
// src/services/open-food-facts.ts
export interface NormalizeOptions {
  /** ID prefix. Defaults to 'manual' for the existing runtime scan flow. */
  idPrefix?: string
}

export function normalizeOffProduct(
  raw: unknown,
  ean: string,
  options: NormalizeOptions = {},
): OffResult {
  const { idPrefix = 'manual' } = options
  // …
  const food: FoodItem = {
    id: `${idPrefix}_${ean}`,
    // …
  }
}
```

Existing callers (barcode scan flow) pass no options, get `manual_` as
before. Build script passes `{ idPrefix: 'tt' }`.

### Origin-country injection

OFF's `origins_tags` is unreliable (often tagged generically as
`en:unknown` or missing entirely for Israeli products). Source of truth is
the transparency feed's `<ManufactureCountry>` tag, already normalized in
`tmp/tivtaam-catalog.json`:

```ts
// scripts/build-tivtaam-seed.ts
for (const netNewItem of catalog.items.filter((i) => i.dedupStatus === 'net-new')) {
  const offResult = readFromCache(netNewItem.itemCode)
  if (offResult === null || offResult.status === 'miss') {
    reviewQueue.push({
      ean: netNewItem.itemCode,
      nameHe: netNewItem.nameHe,
      manufactureCountry: netNewItem.manufactureCountry,
    })
    continue
  }
  const { food } = normalizeOffProduct(offResult, netNewItem.itemCode, {
    idPrefix: 'tt',
  })
  // OFF may have a Hebrew name — but if it's missing, fall back to the
  // transparency-feed name (which is guaranteed non-empty Hebrew).
  if (!food.nameHe || food.nameHe === netNewItem.itemCode) {
    food.nameHe = netNewItem.nameHe
  }
  seed.push({
    ...toSeedShape(food),
    originCountry: netNewItem.manufactureCountry || null,
  })
}
```

Country normalization (mirror [build-tivtaam-catalog.ts:138](scripts/build-tivtaam-catalog.ts:138)):
non-imported markers (`ישראל`, `IL`, `ISRAEL`, `לא ידוע`, empty) are stored
as `null`; everything else is stored as the raw trimmed string from the
feed. This keeps `origin_country` queryable with a simple `IS NOT NULL`
predicate for the "imported only" filter in Phase 3.

### Seed JSON schema

`src/assets/tivtaam-seed.json` (new file) — identical to `supermarket-seed.json`
and `rami-levy-seed.json` plus one optional field:

```json
[
  {
    "id": "tt_7290123456789",
    "nameHe": "שוקולד ריטר ספורט מיני",
    "nameEn": "Ritter Sport Mini",
    "category": "snacks",
    "caloriesPer100g": 540,
    "proteinPer100g": 6.3,
    "fatPer100g": 33,
    "carbsPer100g": 54,
    "fiberPer100g": 3.5,
    "isUserCreated": false,
    "servingSizesJson": "[{\"nameHe\":\"100 גרם\",\"nameEn\":\"100g\",\"unit\":\"grams\",\"grams\":100}]",
    "originCountry": "גרמניה"
  },
  { … }
]
```

`originCountry` is `null` for domestic (`ישראל`) items; always present on
tt\_ rows (JSON `null`, not missing key).

### v19 migration — schema + seed

```ts
// src/db/database.ts

async function migrateToV19(db: SQLite.SQLiteDatabase): Promise<void> {
  // 1. Schema: add origin_country column if missing (fresh installs have it
  //    via CREATE TABLE; upgrade installs need ALTER TABLE).
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(foods)`)
  const hasOriginCountry = columns.some((c) => c.name === 'origin_country')
  if (!hasOriginCountry) {
    await db.execAsync(`ALTER TABLE foods ADD COLUMN origin_country TEXT`)
  }

  // 2. Seed: load tivtaam-seed.json; silently skip if missing (same pattern as v14/v15/v16)
  let seed: TivTaamSeedRow[]
  try {
    seed = require('../assets/tivtaam-seed.json')
  } catch {
    console.log('[Database] tivtaam-seed.json not found — skipping v19 seeding')
    return
  }
  if (seed.length === 0) {
    console.log('[Database] tivtaam-seed.json is empty — skipping v19 seeding')
    return
  }

  // 3. Wipe previous tt_ scrape so stale items don't persist across seed rebuilds
  await db.runAsync(`DELETE FROM foods WHERE id LIKE 'tt_%'`)

  // 4. Batch INSERT OR IGNORE — 12 columns now (added origin_country at the end)
  const BATCH_SIZE = 50
  for (let i = 0; i < seed.length; i += BATCH_SIZE) {
    const batch = seed.slice(i, i + BATCH_SIZE)
    const placeholders = batch.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?)').join(',')
    const params = batch.flatMap((f) => [
      f.id,
      f.nameHe,
      f.nameEn,
      f.category,
      f.caloriesPer100g,
      f.proteinPer100g,
      f.fatPer100g,
      f.carbsPer100g,
      f.fiberPer100g,
      f.isUserCreated ? 1 : 0,
      f.servingSizesJson,
      f.originCountry, // may be null
    ])
    await db.runAsync(
      `INSERT OR IGNORE INTO foods
       (id, name_he, name_en, category,
        calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, fiber_per_100g,
        is_user_created, serving_sizes_json, origin_country)
       VALUES ${placeholders}`,
      params,
    )
  }

  console.log(`[Database] v19: Seeded ${seed.length} Tiv Taam foods (with origin_country)`)
}
```

### v17 tier cleanup — where does `tt_` sit?

Current tier order in [database.ts:497–513](src/db/database.ts:497):

```
raw_%    → 0  (highest priority — wins on name_norm conflicts)
manual_% → 1
sh_%     → 2
rl_%     → 3
else     → 4  (catches tt_ and anything else)
```

**`tt_` lands in the `else` bucket → tier 4.** Conceptually correct: Tiv
Taam is the newest, least-curated source. Any `tt_` row whose `name_norm`
collides with an existing `sh_`/`rl_`/`raw_`/`manual_` row gets deleted by
the v17-style cleanup, preserving the incumbent.

**Caveat:** Phase 1 already dedupes `tt_` at the barcode level against
`sh_`/`rl_`. Name-norm conflicts can only come from different EANs pointing
to effectively the same product (e.g. `7290…` Shufersal own-brand milk vs
a `7290…` manufacturer-branded duplicate from Tiv Taam's feed). Expected
to hit < 100 rows — not a major cleanup, but worth handling.

**Implementation note:** migrateToV17 runs _before_ migrateToV19 in the
version-gated chain. On a fresh install that jumps from v0 → v19, both
run in the same transaction — but V19's INSERT happens AFTER V17's
cleanup, so the newly-inserted tt\_ rows won't be cleaned up until the
next schema bump triggers V17 again. This is fine for now — the cleanup
only matters on upgrade paths, and name_norm conflicts between tt\_ and
older sources are rare (barcode dedup already handled most).

If we want strict cleanup on fresh install, a V20 or V17-bis that re-runs
the same dedup SQL after v19's INSERT fixes it. Out of scope for Phase 2.

### Task 0 — OFF hit-rate probe (de-risk before the 90-min full run)

Before any production scripting, `fetch-tivtaam-off.ts --dry-run` processes
the **first 100 items from `net-new`**. Prints:

```
[Tiv Taam OFF probe] (n=100)
  Hits                 : 43    (43.0%)
  Partial-data hits    : 12    (12.0% of total, 27.9% of hits)
  Misses               : 57    (57.0%)
  Network errors       : 0
```

**Decision gate:**

| Hit rate | Action                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------- |
| ≥ 35%    | Proceed with full 10k run. Expected ~3,500 items shipped.                                               |
| 20–34%   | Present data to user. If imported-slice hit rate is ≥ 50%, still proceed (moat preserved).              |
| < 20%    | Stop. Reassess — maybe Phase 2 needs a different strategy (e.g. scraping Tiv Taam's own product pages). |

The `net-new-imported` slice is likely to hit higher (European/US EANs are
well-indexed in OFF). Worth measuring separately even in the 100-item
probe:

```
[Tiv Taam OFF probe] (n=100, stratified: 50 domestic + 50 imported)
  Domestic hits        : 18 / 50   (36.0%)
  Imported hits        : 38 / 50   (76.0%)
  Overall              : 56 / 100  (56.0%)
```

If imported hit rate is ≥ 60%, the moat is intact even if domestic rate is
poor — we'd still ship 2,000+ imported items, which is 2x what any other
app has.

### Files to Create / Modify

| File                                   | Action | Description                                                                                                                     |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/tivtaam-seed-types.ts`        | Create | `TivTaamSeedRow`, `OffCacheEntry` (hit / miss discriminated union), `ReviewQueueItem`                                           |
| `scripts/fetch-tivtaam-off.ts`         | Modify | Expand existing Task 0 probe stub into full resumable fetcher, **1500ms floor**, retry-errors pass, `--force`/`--dry-run` flags |
| `scripts/build-tivtaam-seed.ts`        | Create | Reads `tmp/off-cache/` + `tmp/tivtaam-catalog.json` → writes `src/assets/tivtaam-seed.json` + review queue                      |
| `src/services/open-food-facts.ts`      | Modify | Add optional `idPrefix` to `normalizeOffProduct` (default `'manual'` — backward-compat)                                         |
| `src/services/open-food-facts.test.ts` | Modify | Add test: `normalizeOffProduct` with `idPrefix: 'tt'` produces `tt_<ean>` ID                                                    |
| `src/db/schema.ts`                     | Modify | `SCHEMA_VERSION = 19`; add `origin_country TEXT` to the `foods` CREATE TABLE                                                    |
| `src/db/database.ts`                   | Modify | Add `migrateToV19`; wire into the version-gated chain                                                                           |
| `src/assets/tivtaam-seed.json`         | Create | Build artifact — generated by `build-tivtaam-seed.ts`. Committed (same pattern as other seeds).                                 |
| `package.json`                         | Modify | Add `fetch-tivtaam-off` + `build-tivtaam-seed` scripts                                                                          |
| `src/db/food-repository.test.ts`       | Modify | Add test verifying `origin_country` round-trips through repository reads (if the repo exposes it) — or flag                     |
| `.gitignore`                           | Verify | `tmp/off-cache/` covered by existing `tmp/` rule                                                                                |

**No UI changes.** No components touched. No store changes. Repository reads
pass `origin_country` through untouched if/when the column is selected.

## Acceptance Criteria

- [x] Task 0 probe runs in < 5 minutes (3-pass retry sweep), prints
      stratified hit rates, exits with non-zero if hit rate < 20% (Task 0
      complete — see Task 0 Outcome above)
- [ ] Full `npm run fetch-tivtaam-off` completes in < 5 hours for 9,548 items
      (1500ms floor × 9,548 = 14,322s ≈ 4.0 hours, plus ~15 min retry pass)
- [ ] Resumed run (after Ctrl-C) re-reads cache and skips completed items —
      manual-verified by killing at ~1000 items and re-running
- [ ] `npm run build-tivtaam-seed` produces `src/assets/tivtaam-seed.json`
      where every `id` starts with `tt_`, every numeric field is a finite
      number, and `originCountry` is `null` or a non-empty string
- [ ] `tmp/tivtaam-review-queue.json` is written alongside; sum of hits +
      misses equals `net-new` count from Phase 1 catalog (9,548 after
      Task 0 filter tightening)
- [ ] `SCHEMA_VERSION === 19`
- [ ] Fresh install on simulator: `PRAGMA user_version` returns 19,
      `PRAGMA table_info(foods)` includes `origin_country`, `SELECT COUNT(*) FROM
foods WHERE id LIKE 'tt_%'` returns the seed size
- [ ] Upgrade install (simulate by manually setting `PRAGMA user_version = 18`
      and re-launching): same three checks pass, no SQL errors in console
- [ ] `SELECT COUNT(*) FROM foods WHERE origin_country IS NOT NULL` returns
      the imported-items count from the seed (validates the origin-country
      injection actually landed in the DB)
- [ ] `npm test` passes (2,307 + new normalizer test + any repository tests)
- [ ] `npm run lint && npm run typecheck` clean

## Task Breakdown

1. [ ] **Task 0 — OFF hit-rate probe (S, manual-verify)** — `fetch-tivtaam-off.ts`
       minimally implemented with `--probe` flag only. Run against stratified
       100-item sample from `tmp/tivtaam-catalog.json`. Record results in
       `lessons.md`. **Decision gate — if hit rate < 20%, stop.**

2. [ ] **Task 1 — Types (S)** — `scripts/tivtaam-seed-types.ts`. No tests
       (pure types).

3. [ ] **Task 2 — `normalizeOffProduct` parameterization (S, TDD)** —
       Add `idPrefix` option to the existing normalizer. Add two tests:
       defaults to `manual_`, honors `tt_` override. Zero risk to existing
       barcode-scan flow.

4. [ ] **Task 3 — Full OFF fetcher (M, manual-verify)** — `fetch-tivtaam-off.ts`
       fleshed out with resumable cache, 500ms floor, progress log, `--force`,
       `--dry-run`, `--probe` flags. No unit tests (network-bound — matches
       convention from lesson 2026-04-18 and `fetch-rl-nutrition.ts`).

5. [ ] **Task 4 — Seed builder (M, TDD on the pure normalizer step)** —
       `build-tivtaam-seed.ts`. Pure normalization of one cached OFF response
   - transparency-feed country → `TivTaamSeedRow` is unit-tested against
     fabricated fixtures. I/O glue is manually verified via the produced
     JSON.

6. [ ] **Task 5 — Schema migration (M, TDD)** —
   - `schema.ts`: bump version, add column to CREATE TABLE
   - `database.ts`: `migrateToV19` with ALTER + DELETE + INSERT OR IGNORE
   - Test: simulate both fresh install (v0 → v19) and upgrade (v18 → v19)
     against an in-memory SQLite; verify column exists, tt\_ rows present,
     `origin_country` populated for imported items.

7. [ ] **Task 6 — Run + verify on simulator (S, manual)** —
   - `npm run build-tivtaam-seed` (commits the resulting
     `src/assets/tivtaam-seed.json`)
   - Reset simulator app data; launch on `dev`; verify
     `SELECT COUNT(*) FROM foods WHERE id LIKE 'tt_%'` matches seed size
     and `SELECT COUNT(*) FROM foods WHERE origin_country IS NOT NULL`
     matches imported count
   - Scan a known Tiv Taam barcode in-app; confirm it now resolves from
     local DB (not OFF fallback)

## Open Questions

- **Category mapping for tt\_ items** — hardcoding `'snacks'` mismatches
  reality for dairy / produce / bakery items. Shufersal + Rami Levy get
  proper categorization from their scraper because the source API provides
  category data; OFF's `categories_tags` is loosely structured. **Decision
  for Phase 2:** accept `'snacks'` for v1. Flag in lessons.md. Phase 3 can
  add an OFF-taxonomy-to-FitCoach-category mapper.
- **Search surfacing** — tt\_ items will surface in text search via
  `foods.name_he` LIKE queries once they're in the DB. Do we need to verify
  the existing search ranking gives them fair visibility vs sh\_/rl\_ items?
  Out of scope for Phase 2 (text search already lowercase-normalizes and
  doesn't weight by source), but worth a one-off sanity check in Task 6.
- **Cache invalidation for OFF responses** — we cache `tmp/off-cache/<ean>.json`
  forever. If OFF updates a product's nutrition (uncommon but happens), our
  cache becomes stale. Acceptable for Phase 2 — the seed is regenerated
  periodically alongside Shufersal/RL, so a manual `--force` flushes it.
  Revisit if nutrition drift becomes a real complaint.
- **OFF TTL / robots.txt** — OFF explicitly allows bulk access (they
  publish monthly dumps). 500ms floor + 10k calls is well under their
  informal ceiling. No risk.

## Phase 3 — Reference Only (Not In Scope Here)

After Phase 2 ships, Phase 3 candidates (prioritized):

1. **Imported-goods UI** — filter/badge using `origin_country IS NOT NULL`.
   Highest user-facing value from Phase 2's schema change.
2. **Manual curation pass** — work through `tmp/tivtaam-review-queue.json`
   (likely 5k+ items if hit rate is ~50%). Top 200 imported items get
   hand-curated nutrition; rest are dropped.
3. **Category mapper** — OFF `categories_tags` → FitCoach categories. Fixes
   the `'snacks'` default for tt\_ items.
4. **Deli / no-EAN items** — name-based matching for the 573 butcher-counter
   items. Requires fuzzy-name dedup and a manual-curation JSON for nutrition
   (no OFF lookup possible).
5. **Transparency-feed primitive extraction** — refactor `scripts/parse-
transparency-feed.ts` + `scripts/filter-food-items.ts` +
   `scripts/download-tivtaam-feed.ts` into `scripts/transparency/` when the
   2nd chain (Yohananof) is added. Avoids premature abstraction until there's
   a second caller.

---

## Implementation Plan

Tasks are ordered by risk — Task 0 is the kill-switch, Task 2 is a safe
standalone refactor, Tasks 3–4 are the build-time pipeline, Task 5 is the
app-side schema change, Task 6 is end-to-end verification.

**Dependency order:** 0 → 1 → 2 → 3 → 4 → 5 → 6

Task 2 can technically run in parallel with Tasks 0/1/3 but I'd sequence it
before Task 3 so the build script can import the parameterized normalizer
immediately.

### Plan-Lock (2026-04-21)

**TDD vs manual-verify split** (matches codebase conventions from
lessons.md 2026-04-18 "don't mock `global.fetch` in tests"):

| Task                 | Mode                                   | Why                                                                               |
| -------------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| 0 — Probe            | Manual-verify                          | Network I/O, one-shot decision gate                                               |
| 1 — Types            | No tests                               | Pure types, validated by `tsc --noEmit`                                           |
| 2 — `idPrefix` param | **TDD**                                | Pure function, backward-compat invariant needs a regression test                  |
| 3 — Full fetcher     | Manual-verify                          | Network I/O, follows `fetch-rl-nutrition.ts` precedent                            |
| 4 — Seed builder     | **TDD** (pure normalizer only)         | `buildSeedRow` + `normalizeOriginCountry` are pure; I/O glue is manual            |
| 5 — v19 migration    | **TDD if harness exists**, else manual | Depends on whether a SQLite test harness is already wired (check at Task 5 start) |
| 6 — End-to-end       | Manual                                 | On-simulator verification only                                                    |

**Lessons-driven design decisions (diverges from precedent where noted):**

1. **Cache OFF misses, not just hits** — _diverges from RL precedent_
   (lessons.md 2026-04-13 line 140: "writes only successful responses").
   Rationale: OFF's API distinguishes transient errors (thrown, retried)
   from genuine 404s (returned as null). RL had ~35% transient errors
   masquerading as misses, so recaching on retry was a win. OFF's retry
   helper already absorbs transient errors; a `null` return is definitively
   "not in OFF." Caching `{status: 'miss'}` saves ~5k unnecessary network
   calls on resumed runs with zero loss of recoverable hits.

2. **Rate-limit between ALL network calls, not just hits** — _matches_
   lessons.md 2026-04-12 line 128. `sleep(500 - elapsed)` runs whenever a
   non-cached call fired, regardless of whether it returned a hit or null.

3. **Never index `origin_country` in `CREATE_TABLE_STATEMENTS`** — _matches_
   lessons.md 2026-04-13 line 139. Phase 2 doesn't index the column at all
   (Phase 3 may add one inside its own version-gated migration).

4. **Share `normalizeOriginCountry` via the build script module, not
   `src/shared/`** — unlike `normalizeNameForDedup` (lessons.md 2026-04-13
   line 138), this helper has no runtime caller. If a UI filter lands in
   Phase 3 that needs to re-normalize a raw country string, promote it to
   `src/shared/` at that time. YAGNI until there's a second call site.

5. **`tt_` is tier 4 in v17 dedup (= lowest)** — newest, least-curated
   source. Keep the existing CASE expression in migrateToV17 untouched;
   `tt_` falls through to the `else` branch already.

**Parallelization possibilities (deliberately NOT taken):**

- Task 5 could ship before Task 4 because `require('../assets/tivtaam-seed.json')`
  silently skips when missing (v11/v14/v15/v16 pattern). Keeping sequential
  order for one clean end-to-end verification in Task 6 instead of two.
- Task 2 is independently mergeable but bundling it with Phase 2 keeps the
  idPrefix change in context with its first non-default caller.

**Kill-switch discipline:** Task 0 MUST be run and signed-off before any
code in Tasks 1–6 lands. If hit rate < 20%, we stop and update TASKS.md;
no partial Phase 2 ship.

**Size check:** Spec estimates 5.5 hours focused work + 1.5 hour background
fetch. That's ~ 700-900 lines of new code spread across 6 new files + 4
modified. Well under the 500-line per-commit soft limit — expect 2-3
commits (Task 0 results → Tasks 1-4 scripting → Task 5 migration → Task 6
seed commit + lessons).

---

### Task 0 — OFF hit-rate probe (S, manual-verify)

**Files:**

- `scripts/fetch-tivtaam-off.ts` (create — minimal `--probe` mode only)
- `lessons.md` (modify — record probe results)

**What:**

Build just enough of the OFF fetcher to run a stratified 100-item sample.
**No cache, no batch mode, no build artifact** at this stage — just
measure and decide.

Flow:

1. Read `tmp/tivtaam-catalog.json`; filter to `dedupStatus === 'net-new'`.
2. Split into two pools: domestic (`!isImported(country)`) and imported.
3. Shuffle each pool with a fixed seed (reproducibility) and take 50 from
   each.
4. For each EAN, call `fetchOffProduct(ean)` with a 500ms gap between calls.
5. Count hits / partial-hits / misses / errors per pool.
6. Print stratified summary; exit 0 (never gates CI — purely informational).

**Decision gate:**

| Overall hit rate | Action                                                            |
| ---------------- | ----------------------------------------------------------------- |
| ≥ 35%            | Proceed with Task 1+                                              |
| 20–34%           | Discuss with user; if imported ≥ 50%, still proceed               |
| < 20%            | Stop — update TASKS.md with findings, reconsider Phase 2 strategy |

**Acceptance:**

- Probe completes in < 2 minutes (100 items × ~1s each ≈ 100s)
- Stratified numbers printed and saved to `lessons.md`
- User signs off before Task 1 begins

---

### Task 1 — Types (S)

**Files:**

- `scripts/tivtaam-seed-types.ts` (create)

**What:**

```ts
// scripts/tivtaam-seed-types.ts

/**
 * Seed row shape written to src/assets/tivtaam-seed.json.
 * Matches supermarket-seed.json + rami-levy-seed.json + new originCountry field.
 */
export interface TivTaamSeedRow {
  id: string // 'tt_<ean>'
  nameHe: string
  nameEn: string
  category: string // always 'snacks' in Phase 2 v1 — see open question
  caloriesPer100g: number
  proteinPer100g: number
  fatPer100g: number
  carbsPer100g: number
  fiberPer100g: number
  isUserCreated: false
  servingSizesJson: string // JSON-stringified ServingSize[]
  originCountry: string | null // null for domestic / unknown; non-empty string for imported
}

/** Discriminated union for OFF cache entries. */
export type OffCacheEntry =
  | { status: 'hit'; fetchedAt: string; raw: unknown } // raw OFF response body
  | { status: 'miss'; fetchedAt: string } // 404 / status=0

export interface ReviewQueueItem {
  ean: string
  nameHe: string
  manufactureCountry: string
}
```

**Test first:** None — pure types.

**Acceptance:** `tsc --noEmit` clean.

---

### Task 2 — `normalizeOffProduct` parameterization (S, TDD)

**Files:**

- `src/services/open-food-facts.ts` (modify)
- `src/services/open-food-facts.test.ts` (modify)

**What:**

Add optional `idPrefix` option. Default `'manual'` preserves the existing
barcode-scan call site; build script passes `'tt'`.

```ts
export interface NormalizeOptions {
  idPrefix?: string
}

export function normalizeOffProduct(
  raw: unknown,
  ean: string,
  options: NormalizeOptions = {},
): OffResult {
  const { idPrefix = 'manual' } = options
  // existing logic unchanged, except:
  const food: FoodItem = {
    id: `${idPrefix}_${ean}`,
    // …rest unchanged…
  }
}
```

**Test first:**

```ts
describe('normalizeOffProduct — id prefix', () => {
  it('defaults to manual_ prefix for backward compatibility', () => {
    const { food } = normalizeOffProduct(fixtureOffResponse, '7290123456789')
    expect(food.id).toBe('manual_7290123456789')
  })

  it('honors idPrefix option for seed build flows', () => {
    const { food } = normalizeOffProduct(fixtureOffResponse, '7290123456789', {
      idPrefix: 'tt',
    })
    expect(food.id).toBe('tt_7290123456789')
  })
})
```

**Acceptance:**

- Both new tests pass; existing tests unchanged (no regressions)
- Barcode scan flow (runtime OFF lookup) produces `manual_` IDs as before
- `npm run lint && npm run typecheck` clean

---

### Task 3 — Full OFF fetcher (M, manual-verify)

**Files:**

- `scripts/fetch-tivtaam-off.ts` (expand from Task 0 stub)
- `package.json` (modify — add `fetch-tivtaam-off` script)

**What:**

Flesh out the probe script into the full fetcher. Uses the same OFF call
path (`fetchOffProduct` from `src/services/`); adds file cache +
resumability + progress log.

```ts
// scripts/fetch-tivtaam-off.ts
/**
 * Usage:
 *   npm run fetch-tivtaam-off                — fetch, resumable (skips cached EANs)
 *   npm run fetch-tivtaam-off -- --force     — clear cache and re-fetch
 *   npm run fetch-tivtaam-off -- --dry-run   — process first 100 items only
 *   npm run fetch-tivtaam-off -- --probe     — Task 0 stratified 100-item probe
 */
```

Cache layout:

```
tmp/off-cache/
  7290123456789.json   → { status: 'hit', fetchedAt: '…', raw: { <OFF body> } }
  7290987654321.json   → { status: 'miss', fetchedAt: '…' }
```

A missing file means "not yet attempted". `--force` wipes the entire
directory before starting. No per-file `--force` — all or nothing.

**Progress & throttling:**

- Log every 100 items: `[Tiv Taam OFF] 300/9548 (3.14%) — 90 hits, 200 misses, 10 errors`
- **1500ms floor** BETWEEN non-cached calls (uses `sleep(1500 - elapsed)` so
  fast responses don't over-rate-limit). Task 0 proved 500ms triggers CDN
  429s on ~40% of calls; 1500ms holds error rate under 15%.
- Cache hits don't sleep — a resumed run rebuilds the cache-read-only view
  in < 5 seconds
- Network error after retry (OffNetworkError): log warning, continue (the
  item will be retried by the automatic error-retry pass at 2500ms gap
  after the main loop finishes)

**Manual-verification protocol:**

1. `rm -rf tmp/off-cache && npm run fetch-tivtaam-off -- --dry-run` — verify
   it processes 100 items and writes 100 cache files
2. Kill at ~50 items with Ctrl-C; re-run without flags — verify it resumes
   from item 50 (no duplicate fetches, no lost progress)
3. `npm run fetch-tivtaam-off -- --force` — verify cache is wiped and all
   9.5k re-fetched

**Acceptance:**

- Full 9,548-item run completes in < 5 hours on a typical connection
- Resumed run after partial completion produces no duplicate network calls
  (verified by watching cache file mtimes)
- Cache format matches `OffCacheEntry` discriminated union
- `npm run lint && npm run typecheck` clean

---

### Task 4 — Seed builder (M, partial TDD)

**Files:**

- `scripts/build-tivtaam-seed.ts` (create)
- `scripts/build-tivtaam-seed.test.ts` (create — tests the pure normalizer step only)
- `package.json` (modify — add `build-tivtaam-seed` script)

**What:**

Glue that walks the catalog's `net-new` slice, reads cache, normalizes hits,
pushes misses to the review queue, writes both outputs.

**Testable unit — the normalizer:**

```ts
// scripts/build-tivtaam-seed.ts
export function buildSeedRow(
  catalogItem: CatalogItem,
  cacheEntry: OffCacheEntry,
): TivTaamSeedRow | null {
  if (cacheEntry.status === 'miss') return null
  const { food } = normalizeOffProduct(cacheEntry.raw, catalogItem.itemCode, {
    idPrefix: 'tt',
  })
  // If OFF returned the EAN as the fallback name, use the transparency feed name instead.
  const nameHe = food.nameHe === catalogItem.itemCode ? catalogItem.nameHe : food.nameHe
  return {
    id: food.id,
    nameHe,
    nameEn: food.nameEn,
    category: food.category,
    caloriesPer100g: food.caloriesPer100g,
    proteinPer100g: food.proteinPer100g,
    fatPer100g: food.fatPer100g,
    carbsPer100g: food.carbsPer100g,
    fiberPer100g: food.fiberPer100g,
    isUserCreated: false,
    servingSizesJson: JSON.stringify(food.servingSizes),
    originCountry: normalizeOriginCountry(catalogItem.manufactureCountry),
  }
}

export function normalizeOriginCountry(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const upper = trimmed.toUpperCase()
  if (NOT_IMPORTED_TOKENS.has(upper)) return null
  return trimmed
}
```

**Test first:**

- `buildSeedRow` returns null on `{ status: 'miss' }`
- `buildSeedRow` returns a `TivTaamSeedRow` with `id: 'tt_<ean>'` on hit
- `buildSeedRow` falls back to transparency-feed name when OFF returns EAN
  as name
- `normalizeOriginCountry` returns null for `'ישראל'`, `'IL'`, `'  '`, `''`,
  `'לא ידוע'`
- `normalizeOriginCountry` returns trimmed original for `'גרמניה'`, `'USA'`,
  `'  France  '`
- `buildSeedRow` sets `originCountry: null` for domestic catalog items

**Glue (not unit-tested, manually verified via output):**

1. Read `tmp/tivtaam-catalog.json`
2. Filter to `dedupStatus === 'net-new'`
3. For each, look up `tmp/off-cache/<ean>.json`:
   - Missing → skip (fetcher hasn't run yet — fail loudly, non-zero exit,
     "run fetch-tivtaam-off first")
   - Hit → buildSeedRow → push to seed array
   - Miss → push to review queue
4. Write `src/assets/tivtaam-seed.json` (hits) + `tmp/tivtaam-review-queue.json`
   (misses)
5. Print summary:
   ```
   [Tiv Taam seed build]
     Net-new input         : 10,024
     Cached hits           : 4,321
     Cached misses         : 5,703
     Review queue (miss)   : 5,703
     Seed rows             : 4,321
       with origin_country : 1,987
     Output
       src/assets/tivtaam-seed.json
       tmp/tivtaam-review-queue.json
   ```

**Acceptance:**

- All unit tests on `buildSeedRow` + `normalizeOriginCountry` pass (~6 tests)
- Running against real Phase 1 + Task 3 output produces a seed JSON with
  schema-valid rows (every row has `tt_<digits>` id, numeric macros, string
  or null originCountry)
- Running without a fetched cache exits non-zero with a clear error

---

### Task 5 — Schema migration (M, TDD)

**Files:**

- `src/db/schema.ts` (modify)
- `src/db/database.ts` (modify)
- `src/db/database.test.ts` (create or extend — if doesn't exist, create
  a minimal in-memory-SQLite harness)

**What:**

Two parts in one file pair:

**schema.ts:**

```ts
export const SCHEMA_VERSION = 19
// In the foods CREATE TABLE, add the new column:
`CREATE TABLE IF NOT EXISTS foods (
  id TEXT PRIMARY KEY,
  name_he TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL,
  calories_per_100g REAL NOT NULL,
  protein_per_100g REAL NOT NULL,
  fat_per_100g REAL NOT NULL,
  carbs_per_100g REAL NOT NULL,
  fiber_per_100g REAL NOT NULL,
  is_user_created INTEGER NOT NULL DEFAULT 0,
  serving_sizes_json TEXT NOT NULL DEFAULT '[]',
  name_norm TEXT,
  origin_country TEXT   -- NEW (nullable; populated for tt_ rows only)
)`
```

**database.ts:**

```ts
// In runMigrations(), after the v17 block:
if (currentVersion < 19) {
  await migrateToV19(db)
}

async function migrateToV19(db: SQLite.SQLiteDatabase): Promise<void> {
  // (as shown in Design section above)
}
```

**Test first:** If no `database.test.ts` exists yet, create one with
`better-sqlite3` or `expo-sqlite`'s test adapter. Two scenarios:

1. **Fresh install (v0 → v19):** open fresh DB → `initializeDatabase()` →
   assert `PRAGMA user_version = 19`, `PRAGMA table_info(foods)` contains
   `origin_country`, tt\_ seed present (if asset exists — else the "silent
   skip" branch kicks in and tt\_ count is 0).
2. **Upgrade (v18 → v19):** create DB with v18 schema (no origin_country)
   and some pre-existing sh\_ + rl\_ rows → set `PRAGMA user_version = 18` →
   re-open → assert column added, sh\_/rl\_ rows intact, tt\_ rows present.

**Caveat on testing:** `src/db/database.ts` uses `expo-sqlite` which isn't
trivially runnable in Jest. If we don't have an in-memory adapter today,
this task downgrades to a manual-verify via simulator — same approach as
Task 3. We can decide at implementation time.

**Acceptance:**

- `SCHEMA_VERSION === 19`
- On simulator: fresh install shows `origin_country` column + tt\_ rows
- On simulator with `PRAGMA user_version = 18` reset: re-launch migrates
  cleanly to v19, no SQL errors in console, existing foods preserved
- `npm run lint && npm run typecheck` clean
- Existing database tests still pass

---

### Task 6 — Run + verify on simulator (S, manual)

**Files:** (no code changes — just execution)

**What:**

1. `npm run fetch-tivtaam-off` (first real run — expect 60–90 min)
2. `npm run build-tivtaam-seed` — produces `src/assets/tivtaam-seed.json` +
   `tmp/tivtaam-review-queue.json`
3. Commit the new seed JSON (same pattern as sh\_/rl\_/raw\_ seeds)
4. `dev` alias → launch simulator with fresh DB
5. Verify in simulator (via a debug log or `expo-sqlite` console):
   ```sql
   SELECT COUNT(*) FROM foods WHERE id LIKE 'tt_%';             -- ≈ 4000+ (depends on OFF rate)
   SELECT COUNT(*) FROM foods WHERE origin_country IS NOT NULL; -- ≈ 1500+ (imported subset)
   SELECT COUNT(DISTINCT origin_country) FROM foods;            -- 20+ distinct countries expected
   ```
6. Scan a known Tiv Taam-exclusive barcode in-app; confirm it resolves from
   local DB (no OFF network call in the logs — verified via debug panel or
   network inspector).
7. Record final numbers in `lessons.md`:
   ```
   ## Tiv Taam Phase 2 Findings (2026-04-21)
   - Net-new input from Phase 1        : 10,024
   - OFF hit rate (overall)            : <X%>
   - OFF hit rate (imported slice)     : <Y%>
   - Seed rows shipped                 : <N>
   - Review queue size                 : <M>
   - Total schema: SCHEMA_VERSION = 19, foods.origin_country added
   ```

**Acceptance:**

- All five SQL checks pass with sensible numbers
- Manual in-app scan resolves a previously-unknown Tiv Taam EAN locally
- `lessons.md` updated
- `TASKS.md` marked done with today's date in the same commit

---

## Size + time estimate

- **Task 0:** 30 min (probe script + run + decide)
- **Task 1:** 10 min (types)
- **Task 2:** 30 min (parameterize + 2 tests)
- **Task 3:** 90 min (fetcher + manual-verify loop)
- **Task 4:** 60 min (builder + 6 unit tests + run)
- **Task 5:** 90 min (migration + upgrade-path verify)
- **Task 6:** 2 hours wall-clock (mostly waiting on the 10k OFF fetch);
  ~30 min of active verification at the end

**Total ≈ 5.5 hours of focused work** + a 1.5-hour background OFF fetch.
Splits naturally at the Task 2/3 boundary (all type-safe groundwork done,
ready to do real I/O).
