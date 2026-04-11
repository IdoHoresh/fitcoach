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
