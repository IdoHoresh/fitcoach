# Feature: Rami Levy Native Nutrition Scraper

**Date:** 2026-04-12
**Status:** Approved
**GitHub Issue:** TBD

## What

A build-time pipeline that scrapes all food products from Rami Levy's REST API,
fetches per-product nutrition data from the same API (`/api/items/{id}` →
`gs.Nutritional_Values[]`), normalizes to FoodSeed schema, deduplicates against
the existing Shufersal seed, and outputs `src/assets/rami-levy-seed.json` — seeded
into the app via a v15 schema migration.

No Open Food Facts dependency — Rami Levy exposes GS1-standard structured nutrition
data natively. This gives higher data quality than OFF for Israeli products.

## Why

Shufersal covers ~5,459 products. Rami Levy is the 2nd-largest Israeli supermarket
(~6,755 products in catalog) carrying many products not sold at Shufersal. Users who
shop at Rami Levy get zero search results for brands unique to that chain.

The Rami Levy product detail API (`/api/items/{id}`) returns `gs.Nutritional_Values[]`
— a GS1-structured array with calories, protein, fat, carbs per 100g and per serving.
This is more reliable than community-edited OFF data for Israeli branded products.

OFF enrichment remains the strategy for Tiv Taam and Victory (those chains have no
native nutrition in their APIs). Rami Levy is the exception.

## Requirements

- [ ] Search sweep collects all ~6,755 RL product IDs using broad Hebrew query terms
- [ ] Nutrition fetch calls `/api/items/{id}` per unique product, rate-limited (500ms)
- [ ] Nutrition fetch is resumable — `tmp/rl-nutrition-cache/{id}.json` skips re-fetch
- [ ] Skip barcodes already in `supermarket-seed.json` (Shufersal) — before nutrition fetch
- [ ] Skip products where `gs.Nutritional_Values` is absent or calories = 0
- [ ] IDs use `rl_<barcode>` prefix
- [ ] Every product includes at least a 100g serving; adds per-serving when available
- [ ] `build-rami-levy-seed.ts` outputs `src/assets/rami-levy-seed.json`
- [ ] Schema v15 migration seeds `rami-levy-seed.json` via `INSERT OR IGNORE`

## Design

### Architecture

```
Rami Levy /api/search (broad Hebrew terms)
        │
        ▼
┌──────────────────────────┐
│  scripts/                │
│  scrape-rl-ids.ts        │  ← 14 paginated requests → all ~6,755 product IDs
└────────────┬─────────────┘
             │  tmp/rami-levy-ids.json  (id, barcode, name, department_id)
             ▼
┌──────────────────────────┐
│  scripts/                │
│  fetch-rl-nutrition.ts   │  ← /api/items/{id} per product, cached, resumable
└────────────┬─────────────┘
             │  tmp/rami-levy-raw.json  (full product detail with Nutritional_Values)
             ▼
┌──────────────────────────┐
│  scripts/                │
│  normalize-rl-product.ts │  ← Nutritional_Values[] → FoodSeed (pure fn, TDD)
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  scripts/                │
│  build-rami-levy-seed.ts │  ← dedup vs Shufersal, write rami-levy-seed.json
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  src/assets/             │
│  rami-levy-seed.json     │  ← seeded by migrateToV15()
└──────────────────────────┘
```

### Rami Levy API (confirmed via DevTools 2026-04-12)

#### Search — collect product IDs

```
GET https://www.rami-levy.co.il/api/search?q={term}&size=500&from={offset}

Response:
{
  "total": 6755,          // total matching products (not capped for small result sets)
  "data": [
    {
      "id": 3025,
      "barcode": 7290004131074,   // integer — stringify to "7290004131074"
      "name": "חלב תנובה 3%...", // Hebrew name
      "department_id": 50,
      "gs": {
        "BrandName": "תנובה",
        "Net_Content": { "UOM": "ליטר", "text": "1 ליטר", "value": "1" }
      }
    }
  ]
}
```

**Coverage strategy:** `q=ה` ("the" in Hebrew — prefix/suffix in ~90% of product names).
Paginate `from=0, 500, 1000, ...` until `from + 500 ≥ total`. Deduplicate by `id`
in memory. Run a second sweep with `q=א` to catch products with no "ה". Total: ~14–20
requests.

Note: `depId` filter is broken — filter in memory using `FOOD_DEPARTMENT_IDS` set.

#### Product detail — nutrition data

```
GET https://www.rami-levy.co.il/api/items/{id}

Response:
{
  "data": [{
    "id": 3025,
    "barcode": 7290004131074,
    "name": "חלב תנובה 3%...",
    "department_id": 50,
    "gs": {
      "Nutritional_Values": [
        {
          "code": "79001",
          "label": "אנרגיה (קלוריות)",
          "fields": [
            { "field_name": "Energy_per_100_grams", "value": "60", "UOM": "קלוריות" },
            { "field_name": "Energy_per_Serving",   "value": "120", "UOM": "קלוריות" }
          ]
        },
        {
          "label": "חלבונים",
          "fields": [
            { "field_name": "Proteins_per_100_grams", "value": "3.3", "UOM": "גרם" }
          ]
        }
        // ... Fats, Carbohydrates, Dietary_Fiber
      ],
      "Net_Content": { "UOM": "ליטר", "text": "1 ליטר", "value": "1" }
    }
  }]
}
```

Nutrient `field_name` → FoodSeed mapping:

- `Energy_per_100_grams` → `caloriesPer100g`
- `Proteins_per_100_grams` → `proteinPer100g`
- `Fats_per_100_grams` → `fatPer100g`
- `Carbohydrates_per_100_grams` → `carbsPer100g`
- `Dietary_Fiber_per_100_grams` → `fiberPer100g` (may be absent)

### Key Design Decisions

**Two-step scrape** (IDs first, nutrition second) for resumability. If nutrition fetch
crashes at product #3000, re-run reads from cache and skips already-fetched IDs.

**Cache design:** `tmp/rl-nutrition-cache/{id}.json` — one file per product ID.
Existence = already fetched. `--force` flag deletes cache and re-fetches all.

**Dedup before nutrition fetch:** extract barcodes from `supermarket-seed.json`
(`sh_<barcode>` → barcode set), skip any RL product whose barcode is already there.
Avoids ~812 redundant nutrition API calls (estimated overlap with Shufersal).

**Serving sizes from `Net_Content`:** `{ UOM: 'ליטר', value: '1' }` → container
serving 1000g/ml. Parse UOM: `ליטר` → 1000ml, `מ"ל` → Nml, `גרם` → Ng, `ק"ג` → N×1000g.
Use `unit: 'ml'` for liquid UOMs. Lesson from v11.

### Files to Create/Modify

| File                                   | Action | Description                                                             |
| -------------------------------------- | ------ | ----------------------------------------------------------------------- |
| `scripts/rami-levy-types.ts`           | Create | Raw types + food department ID set (from API research)                  |
| `scripts/scrape-rl-ids.ts`             | Create | Broad search sweep → tmp/rami-levy-ids.json                             |
| `scripts/fetch-rl-nutrition.ts`        | Create | /api/items/{id} per product, cached → tmp/rami-levy-raw.json            |
| `scripts/normalize-rl-product.ts`      | Create | Pure fn: Nutritional_Values[] → FoodSeed \| null (TDD)                  |
| `scripts/normalize-rl-product.test.ts` | Create | Unit tests for normalize-rl-product                                     |
| `scripts/build-rami-levy-seed.ts`      | Create | Orchestrator: normalize + dedup vs Shufersal, write rami-levy-seed.json |
| `src/assets/rami-levy-seed.json`       | Create | Generated output (gitignored until stable)                              |
| `src/db/schema.ts`                     | Modify | SCHEMA_VERSION 14 → 15                                                  |
| `src/db/database.ts`                   | Modify | Add migrateToV15()                                                      |
| `src/db/food-repository.test.ts`       | Modify | Update SCHEMA_VERSION assertion, add v15 migration tests                |
| `package.json`                         | Modify | Add scrape-rl-ids, fetch-rl-nutrition, build-rami-levy-seed scripts     |

## Acceptance Criteria

- [ ] `npm run scrape-rl-ids` outputs `tmp/rami-levy-ids.json` with ≥ 5,000 unique products
- [ ] `npm run fetch-rl-nutrition` completes, skips cached IDs on re-run
- [ ] `npm run build-rami-levy-seed` outputs `rami-levy-seed.json` with ≥ 500 unique products (distinct from Shufersal)
- [ ] Zero barcode overlap between `supermarket-seed.json` and `rami-levy-seed.json`
- [ ] Every product has at least a 100g serving
- [ ] `SCHEMA_VERSION === 15`
- [ ] v15 migration inserts all `rl_` products using `INSERT OR IGNORE`
- [ ] `npm test` passes (2,003 + new tests)
- [ ] App cold-start after v15: searching a known RL product returns a result (manual verification)

## Implementation Plan

### Task 1: Types File (S)

**Files:** `scripts/rami-levy-types.ts` (create)

**What:**
Create the shared types file based on API findings from 2026-04-12 DevTools research.
No network calls in this task — pure TypeScript definitions.

```ts
// Raw product from /api/search
export interface RLProductSummary {
  id: number
  barcode: number // integer — call .toString() when building id
  name: string // Hebrew product name
  department_id: number
  gs: {
    BrandName: string
    Net_Content: { UOM: string; text: string; value: string } | null
  }
}

// Nutrition field from /api/items/{id}
export interface RLNutritionalField {
  field_name: string // e.g. "Energy_per_100_grams"
  value: string // numeric as string
  UOM: string
  col_label: string
}

export interface RLNutritionalValue {
  code: string
  label: string // Hebrew label e.g. "אנרגיה (קלוריות)"
  fields: RLNutritionalField[]
}

// Full product from /api/items/{id}
export interface RLProductDetail extends RLProductSummary {
  gs: RLProductSummary['gs'] & {
    Nutritional_Values?: RLNutritionalValue[]
  }
}

// Food-only department IDs (confirmed 2026-04-12)
export const FOOD_DEPARTMENT_IDS = new Set([49, 50, 51, 52, 53, 54, 55, 56, 57, 59, 61, 85])

// Search terms for full catalog sweep
export const SWEEP_TERMS = ['ה', 'א'] // "ה" covers ~90% of Hebrew products
```

**Test first:** None — types + constants only. Acceptance: `tsc` compiles, both
`RLProductDetail` and `RLNutritionalValue` match the real API shape.

**Acceptance:**

- `rami-levy-types.ts` compiles with zero errors
- `FOOD_DEPARTMENT_IDS` contains exactly 12 IDs
- Comment block at top documents exact endpoint URLs and field names

---

### Task 2: ID Sweep Scraper (S)

**Files:** `scripts/scrape-rl-ids.ts` (create), `package.json` (modify)

**What:**
Sweeps the search API with broad terms to collect all food product IDs.
Outputs `tmp/rami-levy-ids.json` — array of `RLProductSummary`.

Strategy:

1. For each term in `SWEEP_TERMS` (`['ה', 'א']`):
   - Paginate `from=0, 500, 1000, ...` until `from ≥ total`
   - Filter each page in memory: keep only `FOOD_DEPARTMENT_IDS` members
   - Deduplicate by `id` across pages and terms
2. Write `tmp/rami-levy-ids.json`

Rate limit: 300ms between requests (RL has no strict limiting, but be polite).
Flags: `--dry-run` (first page of first term, print 3 products), `--force`.

Add to `package.json`:

```json
"scrape-rl-ids": "ts-node --project tsconfig.scripts.json scripts/scrape-rl-ids.ts"
```

**Test first:** None — network calls. Manual verification via `--dry-run`.

**Acceptance:**

- `--dry-run` prints ≥ 1 product within 3 seconds
- Full run outputs ≥ 5,000 unique food products
- No non-food products (`department_id` not in `FOOD_DEPARTMENT_IDS`)

---

### Task 3: Nutrition Fetcher (M)

**Files:** `scripts/fetch-rl-nutrition.ts` (create), `package.json` (modify)

**What:**
Reads `tmp/rami-levy-ids.json`. Loads Shufersal barcode set from
`src/assets/supermarket-seed.json` (extracts barcodes from `sh_<barcode>` IDs).
For each product whose barcode is NOT in the Shufersal set:

1. Check `tmp/rl-nutrition-cache/{id}.json` — if exists, read from cache
2. Otherwise: fetch `https://www.rami-levy.co.il/api/items/{id}`,
   write response to cache, sleep 500ms
3. Collect all fetched detail objects into `tmp/rami-levy-raw.json`

Cache: `tmp/rl-nutrition-cache/{id}.json` — one file per product ID.
Flags: `--dry-run` (first 5 products), `--force` (clear cache).

Summary log:

```
[RL Nutrition] ── Summary ──
  Total food products     : 5842
  Already in Shufersal    : 812
  New products to fetch   : 5030
  Cached (no re-fetch)    : 0
  Fetched from API        : 5030
  No nutrition data       : 1124
  Output                  : tmp/rami-levy-raw.json
```

Add to `package.json`:

```json
"fetch-rl-nutrition": "ts-node --project tsconfig.scripts.json scripts/fetch-rl-nutrition.ts"
```

**Test first:** None — network calls. Acceptance via `--dry-run` + cache check.

**Acceptance:**

- `--dry-run` shows a product with `gs.Nutritional_Values` populated
- Re-running skips all cached products (0 new requests)
- Output `tmp/rami-levy-raw.json` contains only products with `Nutritional_Values`

---

### Task 4: Normalization (M — TDD)

**Files:** `scripts/normalize-rl-product.ts` (create), `scripts/normalize-rl-product.test.ts` (create)

**What:**
Pure functions mapping a `RLProductDetail` into `FoodSeed | null`. No network calls.

```ts
// Extracts a single nutrient value per-100g from Nutritional_Values array.
// field_name to look for: "Energy_per_100_grams", "Proteins_per_100_grams", etc.
export function extractNutrient(values: RLNutritionalValue[], fieldName: string): number

// Parses Net_Content { UOM, value } into { grams, unit }.
// "ליטר" / "מ\"ל" → ml, "גרם" / "ק\"ג" → grams
export function parseNetContent(
  netContent: { UOM: string; value: string } | null,
): { grams: number; unit: 'grams' | 'ml' } | null

// Main normalizer
export function normalizeRLProduct(raw: RLProductDetail): FoodSeed | null
```

`normalizeRLProduct` returns null when:

- `gs.Nutritional_Values` is absent or empty
- calories (`Energy_per_100_grams`) = 0 or missing
- `name` is empty

ID: `rl_${raw.barcode}`. Reuses `inferContainerLabel()` + `assignCategory()` from
existing scripts. Use `unit: 'ml'` for liquid UOMs (ליטר, מ"ל) — lesson from v11.

**Test first:**

```ts
describe('extractNutrient', () => {
  it('returns value for matching field_name')
  it('returns 0 when field_name not found')
  it('returns 0 when values array is empty')
  it('parses string value to float correctly')
})

describe('parseNetContent', () => {
  it('parses גרם → { grams: N, unit: "grams" }')
  it('parses ק"ג → { grams: N*1000, unit: "grams" }')
  it('parses מ"ל → { grams: N, unit: "ml" }')
  it('parses ליטר → { grams: N*1000, unit: "ml" }')
  it('returns null for null input')
  it('returns null for unrecognised UOM')
})

describe('normalizeRLProduct', () => {
  it('returns null when Nutritional_Values is absent')
  it('returns null when calories are 0')
  it('returns null when name is empty')
  it('assigns id as rl_<barcode>')
  it('always includes 100g serving')
  it('adds container serving from Net_Content when present')
  it('uses unit "ml" for liquid Net_Content (ליטר)')
  it('maps all four macros correctly')
  it('fiberPer100g defaults to 0 when absent')
})
```

**Acceptance:** All tests pass. Sample milk product (barcode 7290004131074)
normalizes to a FoodSeed with caloriesPer100g = 60, proteinPer100g = 3.3.

---

### Task 5: Seed Builder + v15 Migration (S — TDD)

**Files:**

- `scripts/build-rami-levy-seed.ts` (create)
- `src/db/schema.ts` (modify — `SCHEMA_VERSION` 14 → 15)
- `src/db/database.ts` (modify — add `migrateToV15`)
- `src/db/food-repository.test.ts` (modify)
- `package.json` (modify)

**What:**

`build-rami-levy-seed.ts`:

```
1. Read tmp/rami-levy-raw.json
2. Normalize each → FoodSeed | null via normalizeRLProduct()
3. Deduplicate within Rami Levy (same rl_<barcode> seen twice)
4. Write src/assets/rami-levy-seed.json
5. Print summary
```

`migrateToV15()`:

- `DELETE FROM foods WHERE id LIKE 'rl_%'` — idempotent
- Batch `INSERT OR IGNORE` (BATCH_SIZE = 50, 11 cols = 550 params — within SQLite 999 limit)
- Silently skip if `rami-levy-seed.json` missing
- Guard: `if (currentVersion < 15) await migrateToV15(db)`
- Bare `currentVersion < 15` (no `> 0` guard) — seed migrations run on fresh installs too

Add to `package.json`:

```json
"build-rami-levy-seed": "ts-node --project tsconfig.scripts.json scripts/build-rami-levy-seed.ts"
```

**Test first:**

```ts
describe('schema v15 — Rami Levy seed', () => {
  it('SCHEMA_VERSION is 15')

  it('v15 deletes rl_ rows before re-seeding', async () => {
    // verify DELETE WHERE id LIKE 'rl_%' called before any INSERT
  })

  it('v15 seeds products from rami-levy-seed.json', async () => {
    // mock require() to return 3 fake rl_ products
    // verify INSERT OR IGNORE called with correct fields
  })

  it('v15 skips silently when rami-levy-seed.json is missing', async () => {
    // mock require() to throw MODULE_NOT_FOUND
    // no error, no INSERT
  })
})
```

**Acceptance:**

- All tests pass
- `npm run build-rami-levy-seed` produces `rami-levy-seed.json`
- `SCHEMA_VERSION === 15`
- `npm test -- --silent 2>&1 | tail -5` → all green (2,003 + new tests)

---

## Open Questions

- What is the OFF hit rate for Israeli barcodes? (Still relevant for Tiv Taam / Victory — not Rami Levy)
- Should `rami-levy-seed.json` be committed to git? (Probably gitignored like `supermarket-seed.json`)
- Fiber field name: is it `Dietary_Fiber_per_100_grams` or `Fiber_per_100_grams`? (Confirm in Task 4 with real data)
