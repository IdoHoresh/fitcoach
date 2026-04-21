/**
 * Food filter for transparency-feed items. Drops obvious non-food rows
 * (plastic wrap, cleaning supplies, cigarettes, etc.) using Hebrew keyword
 * substring matching against `nameHe`.
 *
 * Policy: soft-keep. When in doubt, the item passes through — barcode
 * dedup + Phase 2 OFF lookup filter further. Growing the blacklist is
 * strictly additive; spot-check the summary output after each pipeline
 * run and add new entries to `NON_FOOD_KEYWORDS` in
 * `transparency-feed-types.ts`.
 *
 * Note: does NOT filter by `itemType`. Weighted deli items (type 0)
 * include legitimate food (meat counter, cheese counter, produce) — they
 * pass through and get tagged with `dedupStatus: 'no-ean'` downstream
 * when their `itemCode` isn't a valid EAN.
 */

import type { TransparencyItem } from './transparency-feed-types'
import { NON_FOOD_KEYWORDS } from './transparency-feed-types'

/** True when `nameHe` contains any keyword from `NON_FOOD_KEYWORDS`. */
export function isNonFood(nameHe: string): boolean {
  if (nameHe === '') return false
  for (const keyword of NON_FOOD_KEYWORDS) {
    if (nameHe.includes(keyword)) return true
  }
  return false
}

/** Returns only items whose `nameHe` is food (i.e. does not match the blacklist). */
export function filterFoodItems(items: TransparencyItem[]): TransparencyItem[] {
  return items.filter((item) => !isNonFood(item.nameHe))
}
