/**
 * Deduplication utilities for the supermarket food scraper pipeline.
 * Pure functions — no network calls, no side effects.
 */

import type { FoodSeed } from './tzameret-overrides'

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

// ── Content-based dedup ───────────────────────────────────────────────────
//
// Barcode is not identity. The same product can ship under multiple EANs
// (relabels, package variants, factory runs). Content-based dedup collapses
// rows that share a normalized name + full macro tuple.

const SIZE_TOKEN_PATTERN = /\d+(?:\.\d+)?\s*(?:גרם|גר|ג'|ק"ג|קג|מ"ל|מל|ליטר|ל')/g
const PUNCT_PATTERN = /['",.\-()\\/]+/g
const WHITESPACE_PATTERN = /\s+/g

// Known Hebrew food-shape descriptors: map plural → singular.
// Intentionally narrow — general Hebrew stemming risks false merges.
const PLURAL_MAP: Record<string, string> = {
  פרוסות: 'פרוסה',
  מגורדות: 'מגורדת',
  טחונות: 'טחונה',
  קצוצות: 'קצוצה',
  פרוסים: 'פרוס',
  חתוכים: 'חתוך',
  טריים: 'טרי',
}

// Modifiers that are semantically empty when they appear as the final token
// (e.g. `גבינה פרוסה 28% שומן` == `גבינה פרוסה 28%`).
const ORPHAN_TRAILING_MODIFIERS = new Set<string>(['שומן', 'ביתית', 'מצונן'])

/**
 * Normalizes a Hebrew product name into a dedup key.
 * Strips package-size tokens, punctuation, whitespace, and collapses
 * singular/plural forms of known food descriptors. Drops trailing orphan
 * modifiers that add no semantic information.
 * Percentage numbers (fat %) are preserved — they are semantic, not packaging.
 */
export function normalizeNameForDedup(name: string): string {
  const cleaned = name
    .replace(SIZE_TOKEN_PATTERN, ' ')
    .replace(PUNCT_PATTERN, ' ')
    .replace(WHITESPACE_PATTERN, ' ')
    .trim()
    .toLowerCase()

  if (cleaned === '') return ''

  const tokens = cleaned.split(' ').map((t) => PLURAL_MAP[t] ?? t)

  // Drop trailing orphan modifier (only at the tail — mid-name tokens preserved)
  while (tokens.length > 1 && ORPHAN_TRAILING_MODIFIERS.has(tokens[tokens.length - 1])) {
    tokens.pop()
  }

  return tokens.join(' ')
}

/**
 * Builds a content hash for a food seed. Two foods with the same hash are
 * considered the same product regardless of id/barcode.
 * Key = normalized name + calories + protein + fat + carbs (per 100g).
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

// ── Fuzzy (window-based) dedup ────────────────────────────────────────────
//
// Strict content hash misses near-duplicates: same product, slightly different
// macros (measurement drift, factory variation). Fuzzy dedup groups by
// normalized name, then within each group collapses rows whose macros fall
// inside a small tolerance window.

const CAL_WINDOW = 15
const MACRO_WINDOW = 2

function withinMacroWindow(a: FoodSeed, b: FoodSeed): boolean {
  return (
    Math.abs(a.caloriesPer100g - b.caloriesPer100g) <= CAL_WINDOW &&
    Math.abs(a.proteinPer100g - b.proteinPer100g) <= MACRO_WINDOW &&
    Math.abs(a.fatPer100g - b.fatPer100g) <= MACRO_WINDOW &&
    Math.abs(a.carbsPer100g - b.carbsPer100g) <= MACRO_WINDOW
  )
}

/**
 * Fuzzy deduplication: groups by normalized name, then clusters within each
 * group on a macro tolerance window. First occurrence wins. Preserves input
 * order for kept items.
 *
 * Tolerance: ±15 kcal, ±2g protein/fat/carbs per 100g. Tight enough to keep
 * "light" vs "full" variants distinct; loose enough to absorb 3% measurement
 * drift between stores.
 */
export function deduplicateFuzzy(foods: FoodSeed[]): FoodSeed[] {
  const keptByGroup = new Map<string, FoodSeed[]>()
  const keptOrdered: FoodSeed[] = []

  for (const food of foods) {
    const groupKey = normalizeNameForDedup(food.nameHe)
    const kept = keptByGroup.get(groupKey) ?? []

    const collides = kept.some((k) => withinMacroWindow(food, k))
    if (collides) continue

    kept.push(food)
    keptByGroup.set(groupKey, kept)
    keptOrdered.push(food)
  }

  return keptOrdered
}
