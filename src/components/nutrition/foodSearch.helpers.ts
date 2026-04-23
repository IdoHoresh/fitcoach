/**
 * Pure helper functions for food macro calculation.
 * No side effects — all inputs are explicit parameters.
 */

import type { FoodItem } from '@/types'

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
