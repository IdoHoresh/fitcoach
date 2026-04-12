# Feature: Shufersal Full Seed — Schema v14

**Date:** 2026-04-12
**Status:** Approved
**GitHub Issue:** N/A

## What

Replace the 46 manual protein yoghurt SKUs in the foods table with the full
5,459-product Shufersal catalog scraped from shufersal.co.il.

## Why

v11 seeded only 46 hand-picked products as a proof-of-concept. The full scrape
(completed 2026-04-12) produced 5,459 products with real Hebrew names, barcodes,
and per-100g macros. This makes the food search actually useful for users —
covering dairy, meat, bakery, frozen, snacks, beverages, and more.

## Requirements

- [x] `supermarket-seed.json` generated (5,459 products) — DONE
- [ ] v14 migration: delete all `sh_` foods, re-seed from `supermarket-seed.json`
- [ ] `SCHEMA_VERSION` bumped to 14
- [ ] Migration test: `SCHEMA_VERSION` assertion updated to 14
- [ ] Migration test: v14 deletes old `sh_` rows and inserts new ones

## Design

### Architecture

Migration-only change. No UI, no algorithm, no store changes.

- v11 stays as-is (seeds 46 products on first install — replaced immediately by v14)
- v14: DELETE `sh_%` → INSERT all 5,459 from `supermarket-seed.json`
- Same batch INSERT pattern as v11 (BATCH_SIZE = 50, parameterized)

### Files to Create/Modify

| File                             | Action | Description                                                      |
| -------------------------------- | ------ | ---------------------------------------------------------------- |
| `src/db/schema.ts`               | Modify | `SCHEMA_VERSION` 13 → 14                                         |
| `src/db/database.ts`             | Modify | Add `migrateToV14`, wire into `runMigrations`                    |
| `src/db/food-repository.test.ts` | Modify | Update `SCHEMA_VERSION` assertion to 14, add v14 migration tests |

## Acceptance Criteria

- [ ] `SCHEMA_VERSION === 14`
- [ ] v14 migration deletes all `sh_` rows before re-seeding
- [ ] v14 migration inserts all 5,459 products from `supermarket-seed.json`
- [ ] All existing tests still pass
- [ ] `npm run typecheck` clean

## Implementation Plan

### Task 1: v14 migration — TDD (M)

**Files:** `src/db/schema.ts`, `src/db/database.ts`, `src/db/food-repository.test.ts`

**What:**

1. Bump `SCHEMA_VERSION` to 14 in `schema.ts`
2. Update `SCHEMA_VERSION` assertion in `food-repository.test.ts` (13 → 14)
3. Write failing tests for v14 behaviour:
   - deletes all existing `sh_` rows before seeding
   - seeds all products from `supermarket-seed.json` using batched INSERT OR IGNORE
   - skips silently if `supermarket-seed.json` is missing (same pattern as v11)
4. Implement `migrateToV14` in `database.ts`
5. Wire: `if (currentVersion < 14) await migrateToV14(db)` in `runMigrations`

**Test first:**

```ts
describe('schema v14 — full Shufersal seed', () => {
  it('SCHEMA_VERSION is 14', () => {
    expect(SCHEMA_VERSION).toBe(14)
  })

  it('v14 deletes sh_ rows before re-seeding', async () => {
    // mock db.runAsync, verify DELETE call precedes INSERT calls
  })

  it('v14 skips silently when supermarket-seed.json is missing', async () => {
    // mock require() to throw, verify no error thrown
  })
})
```

**Acceptance:**

- `npm test -- --silent 2>&1 | tail -5` → all tests green
- `npm run typecheck` → clean
- `SCHEMA_VERSION === 14`
