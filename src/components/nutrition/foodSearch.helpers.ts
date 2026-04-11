/**
 * Pure helper functions for food search and macro calculation.
 * No side effects — all inputs are explicit parameters.
 */

import type { FoodItem } from '@/types'

/**
 * Searches foods by Hebrew or English name (case-insensitive, partial match).
 * Returns empty array for empty/whitespace queries.
 *
 * @deprecated Use `foodRepository.search()` (SQLite, 4600+ foods) instead of this in-memory helper.
 */
export function searchFoods(query: string, foods: ReadonlyMap<string, FoodItem>): FoodItem[] {
  const all = Array.from(foods.values())
  const q = query.trim().toLowerCase()
  if (!q) return all

  return all.filter((food) => food.nameHe.includes(q) || food.nameEn.toLowerCase().includes(q))
}

/**
 * Computes macros for a given food at a specific gram amount.
 * All values are proportional to per-100g values.
 */
export function computeFoodMacros(
  food: FoodItem,
  grams: number,
): { calories: number; protein: number; fat: number; carbs: number } {
  const factor = grams / 100
  return {
    calories: food.caloriesPer100g * factor,
    protein: food.proteinPer100g * factor,
    fat: food.fatPer100g * factor,
    carbs: food.carbsPer100g * factor,
  }
}
