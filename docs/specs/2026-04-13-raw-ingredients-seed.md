# Feature: Raw ingredient seed (USDA + Hebrew cross-sourced)

**Date:** 2026-04-13
**Status:** Draft
**Author:** Claude (with Ido)

## Problem

Current food database is supermarket-only: 12,109 branded/packaged SKUs from Shufersal + Rami Levy. Users who cook lose: a plate of grilled chicken breast + rice + tomato cannot be logged with real ingredient granularity because those items have no barcode and no supermarket SKU. Search for "חזה עוף" returns packaged products (breaded schnitzel, marinated kebab, etc.), not the raw cut.

This blocks the most basic "I cooked dinner" workflow, which is the primary use case in the Israeli beginner audience.

## Goal

Ship ~200 raw-ingredient entries covering the building blocks of everyday Israeli cooking: meat cuts, fish, eggs, legumes, rice/grains, bread staples, vegetables, fruits, dairy basics, oils, nuts, and a handful of cross-cutting condiments. Each entry has:

- Accurate per-100g macros (cross-sourced, ±5% between sources max)
- Hebrew name that matches how Israelis actually refer to the item
- 2–4 useful serving sizes (always including 100g + a natural unit like "1 ביצה", "כוס אורז מבושל", "כף שמן זית")
- Research citation for each macro source

## Non-goals

- Not a restaurant/chain food database (Burgeranch, Aroma, Cofix) — separate effort.
- Not brand-specific items (those go through supermarket scrapers).
- Not Israeli prepared dishes like חומוס, פלאפל — those should be their own curated "Israeli dishes" list, not raw ingredients.

## Source strategy

**Primary source:** USDA FoodData Central, specifically the **SR Legacy** dataset (not FNDDS). SR Legacy is the most accurate per-100g nutrient database for raw / minimally-processed foods — it's what every serious nutrition tool uses for building blocks.

**Cross-source verification (mandatory for accuracy):**

1. **Tzameret** (Israeli Ministry of Health, Hebrew food composition table) — authoritative for the Israeli market, includes Hebrew names and region-specific data for products like olive oil, tahini, labneh. We already removed its SKUs in v12, but the nutrition composition table (~2,500 foods) is still a reference source.
2. **USDA Foundation Foods** — the newest USDA dataset with higher-quality lab data for common items. Cross-check against SR Legacy when values disagree.
3. **Open Food Facts** — not authoritative, but useful as a sanity check for anything that looks off.

**Accuracy rule:** for each of the 200 items, Claude pulls macros from at least **two** sources. If they disagree by more than ±5% on any of {calories, protein, fat, carbs}, flag the item, use the SR Legacy value as default, and add a comment in the source data explaining the discrepancy. Items with Hebrew-market specifics (olive oil, tahini, dates) default to Tzameret.

**Hebrew translation:** not machine translation. Either (a) Tzameret already has the Hebrew name, or (b) Claude uses the most common colloquial Hebrew term, cross-checked against what Shufersal/Rami Levy use for similar items in the existing seed. For items with multiple valid names (e.g. `כוסברה` vs `גדגדן`), pick the supermarket-common one.

## Serving sizes

Every raw-ingredient entry must ship with 2–4 serving sizes. Minimum pattern:

- **Always:** `100 גרם / 100g`
- **Natural unit** when applicable: `1 ביצה גדולה (50g)`, `תפוח בינוני (180g)`, `פרוסה (30g)`, `כוס מבושלת (158g)`
- **Cooking unit** when relevant: `כף (14g)` for oils and nut butters, `כפית (5g)` for spices

Serving sizes come from USDA's `foodPortions` table and Tzameret's household measures. Use round Israeli numbers when USDA gives awkward grams (e.g. USDA says 1 egg = 50g — use 50g, not 46g).

## Scope: ~200 items, by category

| Category         | Items | Examples                                                         |
| ---------------- | ----: | ---------------------------------------------------------------- |
| Poultry & eggs   |    15 | חזה עוף, שוק עוף, ביצה, חזה הודו, כבד עוף                        |
| Meat             |    15 | אנטריקוט, סינטה, כתף בקר, טחון 5%/20%, כבש, כבד                  |
| Fish & seafood   |    12 | סלמון, טונה, דניס, אמנון, סרדין, פילה מקרל                       |
| Dairy (generic)  |    15 | חלב 1/3/5%, יוגורט 0/1.5/3%, קוטג' 5/9%, לבן, גבינה לבנה, חמאה   |
| Legumes          |    10 | עדשים, חומוס יבש, שעועית לבנה, שעועית שחורה, פול, מש             |
| Grains & bread   |    20 | אורז לבן/בסמטי/מלא, פסטה, קינואה, בורגול, שיבולת שועל, לחם אחיד  |
| Vegetables       |    30 | עגבנייה, מלפפון, פלפל, חציל, קישוא, ברוקולי, כרובית, תרד, גזר    |
| Fruits           |    25 | תפוח, בננה, תפוז, אגס, אבטיח, מלון, ענבים, תות, מנגו, אבוקדו     |
| Oils & fats      |     8 | שמן זית, שמן חמניות, שמן קנולה, טחינה גולמית, מיונז, חמאת בוטנים |
| Nuts & seeds     |    12 | אגוזי מלך, שקדים, בוטנים, קשיו, פיסטוק, גרעינים שחורים/לבנים     |
| Condiments basic |    10 | סוכר, דבש, סילאן, חומץ, סויה, רוטב עגבניות, קטשופ                |
| Dry staples      |    15 | קורנפלקס, גרנולה, פתיתים, תירס משומר, פיצוחים                    |
| Prepared basics  |    13 | פופקורן, חטיף אורז, קרקרים, רוטב פסטה מוכן                       |

Total target: **~200 items**.

## Architecture

- **Raw source data** lives in `scripts/raw-ingredients/raw-ingredients.ts` — hand-curated array of `FoodSeed` objects with inline source citations (comments above each block referencing USDA food IDs or Tzameret row numbers).
- **Optional helper:** a one-time `scripts/fetch-usda-macros.ts` that hits USDA's public API (`api.nal.usda.gov/fdc/v1/foods/search`) to pull SR Legacy values for a list of English food names. Requires a free API key in `.env.local` (never committed). Output goes into `tmp/usda-raw.json` for manual review before being copied into the curated `raw-ingredients.ts`.
- **Seed builder:** `scripts/build-raw-ingredients-seed.ts` reads the curated TS, validates every entry with a Zod schema (ensures name, macros, at least 1 serving size, 100g serving present), and emits `src/assets/raw-ingredients-seed.json` with `id: raw_<slug>` format.
- **Migration:** v16 seeds raw ingredients. Follows the same pattern as v14/v15: wipe old `raw_%` rows, batch insert, respect SQLite's 999 parameter limit.
- **Search integration:** raw ingredients surface in the same search that already handles `sh_` and `rl_` rows — no new UI. Starts-with match still orders results correctly because raw ingredient names are short and canonical.

## Cross-source verification workflow (per item)

```
1. Look up English name in USDA SR Legacy (via API or static dump)
2. Grab per-100g: calories, protein, fat, carbs, fiber
3. Look up Hebrew equivalent in Tzameret (if listed)
4. If both sources exist: compare. If any macro diverges >5%, flag + default to SR Legacy
   (Israeli-specific items default to Tzameret)
5. Third source (Open Food Facts / Cronometer spot check) only for flagged items
6. Record the winning source in a per-entry comment: `// source: USDA SR Legacy 05062`
```

This is slow but non-negotiable: the whole point of raw ingredients is accuracy.

## What's NOT in this spec

- No UI changes. Food search already exists; raw ingredients plug into the existing pipeline.
- No algorithm changes. Macros flow through the same `logSavedMeal` and `computeMealTargets` paths.
- No i18n strings. All text is in the seed data itself (`nameHe` / `nameEn`).
- No tests for the JSON blob. The seed Zod schema + build-time validation is enough — writing a test per food is noise.

## Risks

- **Translation accuracy.** Hebrew food terms have regional variation. Mitigated by checking Shufersal/Rami Levy canonical names before coining a term.
- **USDA API rate limit.** 1,000 requests/hour with free key. Plenty for 200 items.
- **Portion size heuristics.** USDA's "1 medium apple = 182g" doesn't match how Israelis weigh food. Prefer round Israeli numbers (180g, 50g, etc.) and mark the source when overriding.
- **Scope creep.** Easy to slide from 200 → 500 → 1,000. Hard stop at ~220.

## Implementation Plan

### Task 1: Raw source data schema + Zod validation (S)

**Files:** `scripts/raw-ingredients/raw-ingredients.ts`, `scripts/raw-ingredients/schema.ts`, `scripts/raw-ingredients/schema.test.ts`
**What:** Define the curated data structure (extends `FoodSeed` from `tzameret-overrides`). Zod schema that enforces: `id` starts with `raw_`, `nameHe` non-empty, `nameEn` non-empty, macros all `>= 0`, `caloriesPer100g > 0`, at least 1 serving size, 100g serving always present, each serving has `grams > 0`. Create the empty `raw-ingredients.ts` file with a `RAW_INGREDIENTS: RawIngredient[]` export ready for population.
**Test first:**

- Valid entry passes schema
- Missing 100g serving fails
- Zero calories fails
- Negative macros fail
- Non-`raw_` prefix id fails
  **Acceptance:** Tests pass. Schema ready for Task 3 to build against.

### Task 2: USDA fetch helper (S)

**Files:** `scripts/raw-ingredients/fetch-usda.ts`, `.env.local.example`
**What:** One-shot script that reads a list of English food names from `scripts/raw-ingredients/usda-targets.json`, queries USDA SR Legacy via `api.nal.usda.gov/fdc/v1/foods/search`, extracts per-100g macros + serving portions, writes to `tmp/usda-raw.json`. Requires `USDA_API_KEY` env var. Rate-limit 1 req/sec. Resumable (skips items already in output).
**Test first:** N/A — network-bound one-shot script. Manual verification only.
**Acceptance:** `USDA_API_KEY=... npm run fetch-usda-raw` produces `tmp/usda-raw.json` with ≥150 entries (200 minus flagged/missing). Each entry has: fdcId, description, calories, protein, fat, carbs, fiber, foodPortions. No API key committed.

### Task 3: Populate ~200 raw ingredients across categories (L)

**Files:** `scripts/raw-ingredients/raw-ingredients.ts`
**What:** Fill `RAW_INGREDIENTS` array with ~200 items following the category table above. For each item:

1. Pull USDA macros from `tmp/usda-raw.json` (Task 2 output).
2. Cross-check with Tzameret — grep the existing Tzameret reference data or manually verify against the MoH PDF.
3. Write Hebrew name (Tzameret → supermarket-common → dictionary, in that order).
4. Add 2–4 serving sizes including 100g.
5. Inline a source comment: `// USDA SR Legacy 05062 (chicken breast raw) — cross-verified Tzameret`.
6. If USDA and Tzameret disagree >5%: flag with `// FLAG: USDA says X, Tzameret says Y — using USDA`.

Breakdown is too big for a single Claude session in practice — split into 2–3 sub-sessions by category (protein+dairy, grains+vegetables, fruits+condiments+misc). Ido runs each sub-session fresh.

**Test first:** N/A — data entry. Zod schema from Task 1 validates on import.
**Acceptance:** `raw-ingredients.ts` exports 190–220 validated entries. Running `npm run build-raw-ingredients-seed` (Task 4) succeeds. Manual spot check: 20 random entries match USDA or Tzameret to within ±5%.

### Task 4: Seed builder + Zod validation at build time (S)

**Files:** `scripts/raw-ingredients/build-raw-ingredients-seed.ts`, `scripts/raw-ingredients/build-raw-ingredients-seed.test.ts`, `package.json`
**What:** Orchestration script: read `RAW_INGREDIENTS`, validate each entry with the Zod schema from Task 1, emit `src/assets/raw-ingredients-seed.json`. Error on first invalid entry with a descriptive message. Also runs `deduplicateFuzzy` against itself as a safety net (should catch zero, since the curated list is unique by definition). Add `build-raw-ingredients-seed` to `package.json` scripts.
**Test first:**

- Valid input → valid output file written
- Invalid entry → process exits with error message citing the item
- Integration with Zod schema — calls `raw-ingredients.ts` import
  **Acceptance:** Tests pass. `npm run build-raw-ingredients-seed` emits a JSON file identical in shape to `rami-levy-seed.json`.

### Task 5: Schema v16 migration (M)

**Files:** `src/db/database.ts`, `src/db/database.test.ts`
**What:** Add `migrateToV16` following the v14/v15 pattern: try to load `src/assets/raw-ingredients-seed.json`, wipe old `raw_%` rows, batch insert (50 rows × 11 columns = 550 params, safe under SQLite's 999 limit). Bump `SCHEMA_VERSION` to 16. Add version gate in the migration runner.
**Test first:**

- Fresh DB v0 → v16 seeds raw ingredients
- Existing v15 DB → adds raw ingredients
- Re-running v16 on already-at-v16 DB → idempotent (early return on version gate)
- Migration is atomic — fails the whole transaction on any insert error
  **Acceptance:** Tests pass. Cold-start app with empty device DB: Metro log shows `v16: Seeded ~200 foods from raw ingredient catalog`. Food search for `חזה עוף` returns a `raw_chicken_breast` entry above the supermarket noise.

### Task 6: Search ranking adjustment (S)

**Files:** `src/db/food-repository.ts`, `src/db/food-repository.test.ts`
**What:** When search returns multiple matches, prioritize `raw_%` rows over `sh_%` and `rl_%` when the user's query is short and generic (e.g. "חזה עוף"). Strategy: after the existing starts-with ordering, add a secondary sort key: `raw > manual > sh > rl`. Alternatively just inject a boost score in the SQL ORDER BY. Keep the existing starts-with ordering as the primary signal — this is a tiebreaker only.
**Test first:**

- Search "חזה עוף" returns `raw_chicken_breast` first, even though sh\_ rows also match
- Search for a branded term (e.g. "עוף אחלה") still returns the branded sh\_ row first
- Existing test cases still pass
  **Acceptance:** Food search feels "ingredient-first" for generic queries and "brand-first" for specific queries. Manual verification across 10 common terms.

### Task 7: App cold-start verification + lessons.md (S)

**Files:** `lessons.md`
**What:** Uninstall app, cold-start, verify: (a) v16 migration runs, (b) search `חזה עוף` / `אורז לבן` / `תפוח` / `ביצה` / `שמן זית` each return a `raw_%` row first, (c) tap one, portion picker shows the natural unit serving size, (d) log it, Hebrew name persists. Add any lesson learned to `lessons.md` (expect 1–2 entries: USDA serving-size Israeli override pattern, Hebrew translation source-priority rule).
**Acceptance:** All search terms surface raw ingredients as first hit. No Metro errors. lessons.md updated.

---

Size estimate: Task 3 is the bulk of the work (~6–8 hours of data entry across 2–3 sessions). Everything else is ~1 hour each. TDD-applicable for tasks 1, 4, 5, 6.
