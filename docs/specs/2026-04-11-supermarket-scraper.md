# Feature: Supermarket Food Database — Shufersal Scraper

**Date:** 2026-04-11
**Status:** Approved
**GitHub Issue:** #45

## What

A build-time scraper pipeline that fetches nutritional data for all food products
from Shufersal's website, normalizes it to FitCoach's `FoodItem` schema, deduplicates
against the existing Tzameret database (by barcode), and outputs an enriched seed JSON
baked into the app. Every product includes at minimum a per-100g serving and a
whole-container serving (e.g. "200g yoghurt cup"). Also adds the 45 manually-researched
Israeli protein yoghurt SKUs (Danone PRO, Müller, Yoplait GO) as high-confidence
manual overrides.

Users running the app after a schema migration will automatically have ~15,000–25,000
real branded Israeli products available in food search — the same products they buy at
the supermarket, with the exact macros from the packaging.

## Why

The current Tzameret database (4,609 items) is accurate for generic Israeli ingredients
but has no branded products. A user searching for "דנונה PRO" gets nothing. A user
logging "מולר פרוטאין" gets nothing. Most Israeli fitness app users buy packaged
products at supermarkets — this is what they actually eat and need to log.

No Israeli fitness app competitor has accurate, comprehensive branded food data.
This is a moat.

## Requirements

- [ ] Scraper visits only food categories (whitelist approach — no cleaning products, cosmetics, pet food)
- [ ] Extracts per-100g macros (calories, protein, fat, carbs, fiber) from nutrition label
- [ ] Extracts serving size from packaging (e.g. "1 container = 200g", "1 slice = 30g")
- [ ] Always adds a "100 גרם" default serving in addition to any package serving
- [ ] Deduplicates by barcode — if Tzameret already has the item (by barcode), skip it
- [ ] Deduplicates within Shufersal — same barcode seen twice = keep first, skip second
- [ ] Product IDs use barcode: `sh_<barcode>` for Shufersal, `manual_<slug>` for hand-entered
- [ ] All 45 protein yoghurt SKUs (Danone PRO, Müller, Yoplait GO) added as manual overrides with verified macros
- [ ] Output merged with Tzameret into single `supermarket-seed.json` (or replace tzameret-seed.json)
- [ ] Scraper is rate-limited (1 request per second max) to avoid overloading Shufersal
- [ ] Script is re-runnable — always produces consistent output from same input

## Architecture

### Pipeline Overview

```
Shufersal website
      │
      ▼
┌─────────────────────┐
│  scripts/           │
│  scrape-shufersal.ts│  ← visits category pages, extracts products
└─────────┬───────────┘
          │  raw JSON (name, barcode, macros per 100g, servings)
          ▼
┌─────────────────────┐
│  scripts/           │
│  normalize-food.ts  │  ← maps to FoodItem schema, assigns category
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  scripts/           │
│  deduplicate.ts     │  ← barcode lookup against tzameret-seed.json
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  scripts/           │
│  shufersal-overrides│  ← manual corrections + 45 protein yoghurts
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  src/assets/        │
│  supermarket-seed   │  ← merged output, imported by migrateToV11()
│  .json              │
└─────────────────────┘
```

### Shufersal Category Whitelist

Only these category URLs will be scraped. Everything else is ignored.

```
/online/he/c/El_100000 — Dairy & Eggs (חלב וביצים)
/online/he/c/El_100001 — Meat, Poultry & Fish (בשר, עוף ודגים)
/online/he/c/El_100002 — Produce (פירות וירקות)
/online/he/c/El_100003 — Bakery & Bread (מאפים ולחם)
/online/he/c/El_100004 — Grains, Legumes & Pasta (דגנים, קטניות ופסטה)
/online/he/c/El_100005 — Breakfast & Spreads (ארוחת בוקר וממרחים)
/online/he/c/El_100006 — Snacks & Nuts (חטיפים ואגוזים)
/online/he/c/El_100007 — Canned & Preserved (שימורים ומזון שמור)
/online/he/c/El_100008 — Frozen Food (מזון קפוא)
/online/he/c/El_100009 — Deli & Ready Meals (מוצרי דלי ומנות מוכנות)
/online/he/c/El_100010 — Beverages — non-alcohol (משקאות ללא אלכוהול)
/online/he/c/El_100011 — Condiments & Sauces (רטבים ותבלינים)
```

### Serving Size Extraction Strategy

For each product, extract up to 3 serving sizes:

1. **Per 100g** — always present (computed from nutrition label)
2. **Per serving** — if the label lists "מנה = X גרם" or "Serving size = Xg"
3. **Whole container** — if the label lists "גביע" / "אריזה" / "בקבוק" and a total weight

Example — Danone PRO 215g yoghurt:

```json
"servingSizes": [
  { "nameHe": "100 גרם",    "nameEn": "100g",          "unit": "grams", "grams": 100 },
  { "nameHe": "גביע שלם",   "nameEn": "Full container", "unit": "grams", "grams": 215 }
]
```

Example — sliced bread loaf (30g slice):

```json
"servingSizes": [
  { "nameHe": "100 גרם",  "nameEn": "100g",   "unit": "grams", "grams": 100 },
  { "nameHe": "פרוסה",    "nameEn": "1 slice", "unit": "piece", "grams": 30  }
]
```

### Deduplication Logic

```
For each scraped product:
  1. Look up barcode in tzameret-seed.json barcodes list
     → If found: SKIP (Tzameret data is MoH-verified, higher authority)
  2. Look up barcode in already-processed Shufersal items
     → If found: SKIP (duplicate category listing)
  3. Add to output with id = "sh_<barcode>"
```

### Manual Overrides — Protein Yoghurts

All 45 protein yoghurt SKUs researched on 2026-04-11 are added as
`manual_<slug>` entries with `isUserCreated: false`. These override any
Shufersal-scraped version of the same product (higher data confidence —
sourced directly from brand websites and cross-verified across 5+ sources).

Brands covered:

- Danone PRO — 19 SKUs (classic, sugar-free, layered, drinkable)
- Müller Protein / PROTEIN — 14 SKUs (plain, flavored, topping, drinks)
- Yoplait GO — 17 SKUs (classic, airy, thick, light, 25g line)

Each includes a whole-container serving size.

### Schema Migration

`SCHEMA_VERSION` bumps from 10 → 11.

`migrateToV11()` in `database.ts`:

- Seeds `supermarket-seed.json` using the same batch-INSERT pattern as v10
- Uses `INSERT OR IGNORE` — safe to re-run
- Tzameret foods remain in place (v10 migration already ran)

### Technology Choice: Playwright

Shufersal's website is a React SPA — nutritional data is loaded via XHR/fetch
after the page renders. Simple `fetch + cheerio` won't see the nutrition table.

**Playwright** (headless browser) is the right tool:

- Navigates to product page, waits for nutrition table to render
- Intercepts the underlying API calls if available (faster than DOM scraping)
- Already in the Node.js ecosystem (TypeScript-friendly)
- Free, open source

Alternative considered: intercept Shufersal's internal API directly
(inspect Network tab → find the product JSON endpoint → call it directly).
This is 10x faster than DOM scraping and more reliable. We attempt this first;
fall back to DOM scraping if the API is not stable.

## Files to Create/Modify

| File                                | Action | Description                                                                         |
| ----------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| `scripts/scrape-shufersal.ts`       | Create | Playwright scraper — visits category pages, extracts product data                   |
| `scripts/normalize-food.ts`         | Create | Maps raw scraped data → FoodItem schema + category assignment                       |
| `scripts/deduplicate.ts`            | Create | Barcode-based dedup against existing seed                                           |
| `scripts/shufersal-overrides.ts`    | Create | Manual corrections + all 45 protein yoghurt SKUs                                    |
| `scripts/build-supermarket-seed.ts` | Create | Orchestrator — runs all steps, writes output JSON                                   |
| `src/assets/supermarket-seed.json`  | Create | Generated output (gitignored until stable)                                          |
| `src/db/schema.ts`                  | Modify | SCHEMA_VERSION 10 → 11                                                              |
| `src/db/database.ts`                | Modify | Add migrateToV11()                                                                  |
| `package.json`                      | Modify | Add `scrape-shufersal` and `build-supermarket-seed` scripts, add playwright dev dep |

## Acceptance Criteria

- [ ] `npm run scrape-shufersal` completes without crashing, produces raw JSON
- [ ] `npm run build-supermarket-seed` produces a valid `supermarket-seed.json`
- [ ] Output contains ≥ 10,000 unique food products
- [ ] Zero duplicate barcodes in final output
- [ ] Every product has at least 2 serving sizes (100g + container/serving)
- [ ] All 45 protein yoghurt SKUs are present with correct macros
- [ ] App cold-start after v11 migration: food search returns "דנונה PRO" results
- [ ] Searching "מולר פרוטאין" returns all Müller variants
- [ ] Searching "לחם" returns real Shufersal bread products with barcode IDs

## Task Breakdown

1. [ ] Task 1: Investigate Shufersal's internal API (S) — inspect Network tab, find product/category endpoints, confirm they return nutrition data. If yes, no Playwright needed.
2. [ ] Task 2: Build `scrape-shufersal.ts` (L) — category whitelist, pagination, raw product extraction with rate limiting
3. [ ] Task 3: Build `normalize-food.ts` + `deduplicate.ts` (M) — schema mapping, serving size extraction, barcode dedup
4. [ ] Task 4: Build `shufersal-overrides.ts` (M) — all 45 protein yoghurt SKUs with verified macros + container serving sizes
5. [ ] Task 5: Build `build-supermarket-seed.ts` orchestrator + schema v11 migration (S)
6. [ ] Task 6: Validate output + fix data quality issues (M) — spot-check 20 products against real packaging

## Open Questions

- Does Shufersal expose a public-facing product API? (check Network tab before building DOM scraper)
- Should `supermarket-seed.json` be committed to git? (it will be large — maybe gitignore + generate in CI)
- Do we replace `tzameret-seed.json` entirely or keep both and merge at migration time?
- What is the total product count after deduplication? (estimate: 15,000–25,000 unique food items)

---

## Implementation Plan

### Architecture Notes (before reading tasks)

- `supermarket-seed.json` contains **only** Shufersal + manual override items (Tzameret stays in v10).
  v11 migration seeds the new file on top — both databases coexist in the `foods` table.
- Output format is **identical** to `tzameret-seed.json` (same 11 fields) — same migration pattern reused.
- Barcode is used internally for dedup only; the ID `sh_<barcode>` encodes it — no extra DB column needed.
- `FoodSeed` type already exists in `scripts/tzameret-overrides.ts` — reuse it across all scripts.
- `assignCategory()` already exists in `scripts/category-mapper.ts` — reuse it in normalization.

---

### Task 1: API Discovery + Shared Types (S)

**Files:** `scripts/shufersal-types.ts` (create)

**What:**
Before writing a single scraper line, open Shufersal's website in Chrome DevTools (Network tab, filter XHR/Fetch), navigate a category page, and find the underlying API calls. Document:

- Category listing endpoint (returns paginated product list)
- Product detail endpoint (returns nutrition table, serving size, barcode)
- Auth headers required (if any — usually none for product catalog)
- Response shape (JSON fields for name_he, name_en, barcode, calories, protein, fat, carbs, fiber, serving_size_g, container_g)

Then create `scripts/shufersal-types.ts` with:

```ts
// Raw shape returned by Shufersal's API
export interface RawShufersalProduct { ... }

// Category entry in Shufersal's whitelist
export interface ShufersalCategory {
  id: string
  nameHe: string
  url: string
}

export const FOOD_CATEGORIES: ShufersalCategory[] = [...]
```

**Test first:** No automated test — this is a research + types task.
Document findings in a comment block at the top of `shufersal-types.ts`.

**Acceptance:**

- `shufersal-types.ts` compiles with `tsc`
- Comment block documents the exact API endpoint URLs and response shapes
- Confirmed: API returns nutrition data (calories, protein, fat, carbs) per product

---

### Task 2: Normalization Pipeline (M)

**Files:** `scripts/normalize-food.ts` (create), `scripts/normalize-food.test.ts` (create)

**What:**
Pure functions that convert a raw Shufersal API response into a `FoodSeed` object.
No network calls — input is a plain JS object, output is `FoodSeed | null`.

Functions to implement:

- `normalizeProduct(raw: RawShufersalProduct): FoodSeed | null`
  — returns null if missing required fields (no name, no calories)
  — assigns id as `sh_<barcode>`
  — calls `assignCategory()` from existing `category-mapper.ts`
- `extractServingSizes(raw: RawShufersalProduct): ServingSize[]`
  — always includes `{ nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 }`
  — adds per-serving if `raw.servingSizeG` is present and > 0
  — adds container serving if `raw.containerG` is present and > 0
  — labels container by product type: "גביע שלם" for dairy, "אריזה" default
- `inferContainerLabel(nameHe: string): { nameHe: string, nameEn: string }`
  — "יוגורט" / "גבינה" → "גביע שלם" / "Full container"
  — "לחם" / "פרוסה" → "כיכר" / "Loaf"
  — default → "אריזה שלמה" / "Full package"

**Test first:**

```ts
// normalize-food.test.ts
describe('normalizeProduct', () => {
  it('returns null when calories are missing')
  it('returns null when name is empty')
  it('assigns id as sh_<barcode>')
  it('always includes 100g serving')
  it('adds container serving when containerG is present')
  it('adds per-serving when servingSizeG is present')
  it('maps protein/fat/carbs/fiber correctly')
})

describe('inferContainerLabel', () => {
  it('returns גביע שלם for yoghurt products')
  it('returns אריזה שלמה for unknown products')
})
```

**Acceptance:** All tests pass. `normalizeProduct` correctly maps a sample Shufersal
yoghurt API response into a `FoodSeed` with 3 serving sizes.

---

### Task 3: Deduplication Logic (S)

**Files:** `scripts/deduplicate.ts` (create), `scripts/deduplicate.test.ts` (create)

**What:**
Pure function that removes duplicates from a list of scraped products.
Two sources of duplicates:

1. Same product appearing in multiple Shufersal categories
2. Product that already exists in Tzameret (by barcode extracted from `tz_<code>` IDs
   — note: Tzameret items don't have real barcodes, so cross-dedup is by name similarity
   for Tzameret, and by barcode for Shufersal-vs-Shufersal)

```ts
export function deduplicateScraped(products: FoodSeed[]): FoodSeed[]
// Removes within-Shufersal duplicates (same sh_<barcode> ID appears twice)

export function filterAgainstTzameret(products: FoodSeed[], tzameretIds: Set<string>): FoodSeed[]
// Removes any Shufersal product whose barcode matches a known Tzameret barcode
// (Tzameret items use tz_ prefix; Shufersal use sh_ — direct ID collision is impossible,
//  so this filters by a barcode lookup map built from the overrides file)
```

**Test first:**

```ts
describe('deduplicateScraped', () => {
  it('removes products with duplicate IDs, keeps first occurrence')
  it('keeps all products when no duplicates exist')
  it('preserves order of unique items')
})

describe('filterAgainstTzameret', () => {
  it('removes product whose barcode is in the exclusion set')
  it('keeps product whose barcode is not in the exclusion set')
  it('handles empty exclusion set — returns all products')
})
```

**Acceptance:** All tests pass. Running dedup on a list of 100 mock products
with 20 duplicates produces exactly 80 unique results.

---

### Task 4: Protein Yoghurt Overrides (M)

**Files:** `scripts/shufersal-overrides.ts` (create), `scripts/shufersal-overrides.test.ts` (create)

**What:**
All 45 protein yoghurt SKUs entered as `FoodSeed[]` with verified macros (researched
2026-04-11 from brand websites and cross-verified across 5+ sources).

Every SKU must include:

- `id: 'manual_<slug>'` (e.g. `manual_danone_pro_natural_2pct`)
- Container serving size (e.g. 200g or 215g for Danone PRO 25g variant)
- `100g` serving always present

Brands:

- Danone PRO — 19 SKUs (classic plain/vanilla/berries/strawberry, sugar-free line ×5, layered ×2, drinkable ×2)
- Müller Protein / PROTEIN — 14 SKUs (plain 0%/2%, vanilla, lactose-free, flavored ×5, topping, drinks ×4)
- Yoplait GO — 17 SKUs (classic ×4, airy ×3, thick ×4, light ×2, 25g line ×3, refined sweetness)

**Test first:**

```ts
describe('PROTEIN_YOGHURT_OVERRIDES', () => {
  it('contains exactly 45 or more SKUs')
  it('every SKU has required fields: id, nameHe, nameEn, category, macros')
  it('every SKU has at least 2 serving sizes (100g + container)')
  it('every SKU has category = dairy')
  it('no duplicate IDs within the overrides list')
  it('Danone PRO 25g variant has protein ≥ 11.5g per 100g')
  it('Müller plain 0% has protein = 12.5g per 100g')
  it('Yoplait GO natural 2% has protein = 10.0g per 100g')
})
```

**Acceptance:** All tests pass. Every brand is represented with correct macros
matching the values from the April 2026 research.

---

### Task 5: Shufersal Scraper (L)

**Files:** `scripts/scrape-shufersal.ts` (create), `package.json` (modify)

**What:**
Fetches all food products from Shufersal's API (using the endpoints found in Task 1).
Outputs `tmp/shufersal-raw.json` — an array of `RawShufersalProduct`.

Key requirements:

- Iterates over all categories in `FOOD_CATEGORIES` whitelist
- Paginates each category until all products are fetched
- Rate limit: 1 request per second (use `await sleep(1000)` between requests)
- Progress logging: `[Shufersal] Dairy: 847/2300 products...`
- Skips products with no nutrition data (log count at end)
- Re-runnable: if `tmp/shufersal-raw.json` already exists and `--force` flag not set, skip scrape
- Adds `npm run scrape-shufersal` to `package.json`

**Test first:** No automated unit test — scraper makes real network calls.
Instead, add a `--dry-run` flag that fetches only the first page of the first
category and prints the first product to stdout. Manual verification.

**Acceptance:**

- `npm run scrape-shufersal` completes without crashing
- Output `tmp/shufersal-raw.json` contains ≥ 5,000 products
- Each product has `nameHe`, `barcode`, `caloriesPer100g`, `proteinPer100g`
- `--dry-run` mode shows a sample product within 5 seconds

---

### Task 6: Orchestrator + v11 Migration (S)

**Files:**

- `scripts/build-supermarket-seed.ts` (create)
- `src/db/schema.ts` (modify — SCHEMA_VERSION 10 → 11)
- `src/db/database.ts` (modify — add migrateToV11)
- `src/db/database.test.ts` (create — or extend food-repository.test.ts)
- `package.json` (modify)

**What:**

`build-supermarket-seed.ts` orchestrates the full pipeline:

```
1. Read tmp/shufersal-raw.json (must exist — run scrape-shufersal first)
2. Normalize each raw product → FoodSeed | null (filter nulls)
3. Deduplicate within Shufersal
4. Merge PROTEIN_YOGHURT_OVERRIDES (overrides win — remove any Shufersal
   version of the same product matched by nameHe similarity)
5. Write src/assets/supermarket-seed.json
6. Print summary: X products scraped, Y nulls filtered, Z duplicates removed,
   45 manual overrides added, total = N
```

`migrateToV11()` in `database.ts`:

- Same batch-INSERT pattern as v10 (50 rows × 11 params = 550)
- Uses `INSERT OR IGNORE` — safe if re-run
- Seeds `supermarket-seed.json`

`SCHEMA_VERSION` bumps 10 → 11.

**Test first:**

```ts
// In food-repository.test.ts, add new describe block:
describe('schema v11 — supermarket foods', () => {
  it('SCHEMA_VERSION is 11')
})

// In a new describe block for build output:
describe('supermarket-seed.json', () => {
  it('has at least 5000 foods')
  it('every entry has required fields')
  it('contains Danone PRO manual_danone_pro_natural_2pct')
  it('contains Müller plain manual_muller_protein_plain_0pct')
  it('no duplicate IDs')
})
```

**Acceptance:**

- `npm run build-supermarket-seed` runs end-to-end without errors
- `supermarket-seed.json` produced with ≥ 5,000 items
- All 45 protein yoghurts present
- Zero duplicate IDs
- `npm test` passes (1,932 + new tests)
- App cold-start: searching "דנונה PRO" returns results
