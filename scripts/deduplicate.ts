/**
 * Deduplication utilities for the supermarket food scraper pipeline.
 * Pure functions — no network calls, no side effects.
 */

import type { FoodSeed } from './tzameret-overrides'
import { normalizeNameForDedup } from '../src/shared/normalizeFoodName'

export { normalizeNameForDedup }

/**
 * Removes within-batch duplicates from a scraped product list.
 * The same product can appear in multiple Shufersal categories — keep the first
 * occurrence (categories are scraped in whitelist order, so earlier = higher priority).
 */
export function deduplicateScraped(products: FoodSeed[]): FoodSeed[] {
  const seen = new Set<string>()
  const result: FoodSeed[] = []
  for (const product of products) {
    if (!seen.has(product.id)) {
      seen.add(product.id)
      result.push(product)
    }
  }
  return result
}

/**
 * Removes products whose IDs are already in an existing set.
 * Used to filter Shufersal items that duplicate entries from Tzameret or
 * manual overrides (which have higher data confidence).
 */
export function filterAgainstExisting(products: FoodSeed[], existingIds: Set<string>): FoodSeed[] {
  return products.filter((p) => !existingIds.has(p.id))
}

// ── Content hash (cross-seed strict filter) ───────────────────────────────
//
// Strict hash: normalized name + full macro tuple. Used ONLY for cross-store
// filtering (Rami Levy against Shufersal) where collapsing near-matches is
// riskier than within a single store.

/**
 * Builds a content hash for a food seed. Two foods with the same hash are
 * byte-identical (same normalized name + same macros).
 */
export function buildContentHash(food: FoodSeed): string {
  return [
    normalizeNameForDedup(food.nameHe),
    food.caloriesPer100g,
    food.proteinPer100g,
    food.fatPer100g,
    food.carbsPer100g,
  ].join('|')
}

/**
 * Removes foods whose content hash is already in the provided set.
 * Used for cross-seed dedup (e.g. skip Rami Levy rows that duplicate Shufersal).
 */
export function filterAgainstContentHashes(foods: FoodSeed[], hashes: Set<string>): FoodSeed[] {
  return foods.filter((f) => !hashes.has(buildContentHash(f)))
}

// ── Within-source name-based dedup ────────────────────────────────────────
//
// Within a single supermarket catalog, the same product can be listed under
// multiple barcodes with drifted macros (Shufersal had 3× "אורז פרסי" at
// 348/350/336 kcal with protein 6/8.7/0 — all the same Persian rice, the
// 0g-protein row is a garbage entry). Strict macro-window clustering misses
// these because legitimate measurement drift exceeds any safe window.
//
// Aggressive name-only clustering is safer within a single store: if two rows
// share the same normalized name (with percentage tokens preserved, so
// "חלב 3%" stays distinct from "חלב 9%"), they are the same product. Pick the
// best representative using garbage filter → richness score → first-occurrence.

function isGarbageRow(f: FoodSeed): boolean {
  if (f.caloriesPer100g === 0) return true
  if (f.proteinPer100g === 0 && f.caloriesPer100g > 100) return true
  return false
}

function richnessScore(f: FoodSeed): number {
  let score = 0
  if (f.caloriesPer100g > 0) score++
  if (f.proteinPer100g > 0) score++
  if (f.fatPer100g > 0) score++
  if (f.carbsPer100g > 0) score++
  if ((f.fiberPer100g ?? 0) > 0) score++
  return score
}

/**
 * Name-based dedup within a single source. Groups rows by normalized name;
 * within each group picks the best representative (prefer non-garbage, then
 * highest richness, ties broken by first occurrence).
 *
 * Output preserves the relative order of first-seen groups.
 */
export function deduplicateFuzzy(foods: FoodSeed[]): FoodSeed[] {
  const groups = new Map<string, FoodSeed[]>()
  const keyOrder: string[] = []

  for (const food of foods) {
    const key = normalizeNameForDedup(food.nameHe)
    const existing = groups.get(key)
    if (existing) {
      existing.push(food)
    } else {
      groups.set(key, [food])
      keyOrder.push(key)
    }
  }

  const result: FoodSeed[] = []
  for (const key of keyOrder) {
    const group = groups.get(key)!
    result.push(pickBestInGroup(group))
  }
  return result
}

function pickBestInGroup(group: FoodSeed[]): FoodSeed {
  if (group.length === 1) return group[0]!

  // Prefer non-garbage rows. If all are garbage, fall back to the full group.
  const nonGarbage = group.filter((f) => !isGarbageRow(f))
  const pool = nonGarbage.length > 0 ? nonGarbage : group

  let best = pool[0]!
  let bestScore = richnessScore(best)
  for (let i = 1; i < pool.length; i++) {
    const score = richnessScore(pool[i]!)
    if (score > bestScore) {
      best = pool[i]!
      bestScore = score
    }
  }
  return best
}
