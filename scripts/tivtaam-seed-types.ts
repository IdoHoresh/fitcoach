/**
 * Types for the Tiv Taam Phase 2 OFF-enrichment pipeline.
 *
 * Flow: Phase 1 `tmp/tivtaam-catalog.json` (net-new slice) →
 *       `fetch-tivtaam-off.ts` (caches OFF responses per EAN) →
 *       `build-tivtaam-seed.ts` (writes `src/assets/tivtaam-seed.json` + review queue)
 *       → `migrateToV19` consumes the seed at app cold-start.
 *
 * See docs/specs/2026-04-21-tiv-taam-phase2-off-enrichment.md
 */

/**
 * One row in `src/assets/tivtaam-seed.json`. Shape matches the rows
 * consumed by migrateToV14/V15/V16 — same 11 column order — plus a
 * trailing `originCountry` that lands in `foods.origin_country` (v19).
 *
 * `id` is always `tt_<ean>`. `originCountry` is `null` for domestic /
 * unknown / 'ישראל' / 'IL' / 'לא ידוע'; otherwise the trimmed, raw-cased
 * country string from the transparency feed's `<ManufactureCountry>` tag.
 */
export interface TivTaamSeedRow {
  id: string
  nameHe: string
  nameEn: string
  category: string
  caloriesPer100g: number
  proteinPer100g: number
  fatPer100g: number
  carbsPer100g: number
  fiberPer100g: number
  isUserCreated: false
  servingSizesJson: string
  originCountry: string | null
}

/**
 * Discriminated union for cache entries at `tmp/off-cache/<ean>.json`.
 *
 * `hit` stores the raw OFF response body unchanged so re-runs of the
 * seed builder can re-normalize without re-fetching. `miss` is a tiny
 * marker that lets the main loop skip known 404/status=0 EANs on resume.
 *
 * Rationale for caching misses (diverges from fetch-rl-nutrition.ts):
 * OFF's retry helper already absorbs transient errors; a `null` return
 * means OFF definitively doesn't have the EAN. Persisting the miss
 * saves re-fetching ~5k known-absent products on every resumed run.
 */
export type OffCacheEntry =
  | { status: 'hit'; fetchedAt: string; raw: unknown }
  | { status: 'miss'; fetchedAt: string }

/**
 * One row in `tmp/tivtaam-review-queue.json`. Written for every `net-new`
 * Tiv Taam item whose EAN returned `status: 'miss'` from OFF. Phase 2.5
 * (not this phase) may work through the queue with hand curation.
 */
export interface ReviewQueueItem {
  ean: string
  nameHe: string
  manufactureCountry: string
}
