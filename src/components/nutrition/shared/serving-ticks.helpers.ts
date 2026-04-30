/**
 * Pure helpers for the portion-slider primitive (A2).
 *
 * - detectTickCrossings: which tick anchors lie between two slider positions?
 *   Used to gate haptic firing and sparse onChange callbacks during drag.
 * - getServingTicks: resolves the tick anchors for a food, falling back to
 *   food.servingSizes when no curated entry exists.
 * - getCookedVariant: resolves the raw/cooked sibling food for a curated food.
 *
 * All three accept the tick map as an injectable parameter (default = the
 * shipped const) for testability and to match the codebase's DI-helper
 * pattern (lessons.md:163, 2026-04-18).
 */

import type { FoodItem, ServingTick, ServingTickEntry } from '@/types/nutrition'
import { SERVING_TICKS } from '@/data/serving-ticks'

/**
 * Returns the list of tick grams that lie between prev and new.
 * Direction-agnostic — works for both increases and decreases.
 *
 * A "crossing" includes landing exactly on a tick: the slider snapping to a
 * tick on touch-end should still fire one haptic.
 */
export function detectTickCrossings(
  prevGrams: number,
  newGrams: number,
  ticks: readonly number[],
): readonly number[] {
  if (prevGrams === newGrams) return []
  const lo = Math.min(prevGrams, newGrams)
  const hi = Math.max(prevGrams, newGrams)
  return ticks.filter((t) => t > lo && t <= hi)
}

/**
 * Resolves the slider's tick anchors for a given food.
 *
 * Priority:
 *   1. Curated entry in tickMap (when food.slug matches a key)
 *   2. Derived from food.servingSizes (first 3 marked primary, sorted by grams)
 *   3. Empty array if neither source has data
 */
export function getServingTicks(
  food: FoodItem,
  tickMap: Record<string, ServingTickEntry> = SERVING_TICKS,
): readonly ServingTick[] {
  if (food.slug) {
    const entry = tickMap[food.slug]
    if (entry) return entry.ticks
  }
  return food.servingSizes
    .map<ServingTick>((s, i) => ({
      grams: s.grams,
      nameHe: s.nameHe,
      nameEn: s.nameEn,
      isPrimary: i < 3,
    }))
    .sort((a, b) => a.grams - b.grams)
}

/**
 * Resolves the cooked/raw sibling food (if one exists) for a given food.
 *
 * Returns null when:
 *   - food has no slug, OR
 *   - slug isn't in tickMap, OR
 *   - tickMap entry has cookedVariantSlug = null, OR
 *   - sibling slug doesn't resolve to any food in allFoods
 */
export function getCookedVariant(
  food: FoodItem,
  allFoods: readonly FoodItem[],
  tickMap: Record<string, ServingTickEntry> = SERVING_TICKS,
): FoodItem | null {
  if (!food.slug) return null
  const entry = tickMap[food.slug]
  if (!entry?.cookedVariantSlug) return null
  return allFoods.find((f) => f.slug === entry.cookedVariantSlug) ?? null
}
