/**
 * Pure helper functions for NutritionDashboard.
 * No side effects — all inputs are explicit parameters.
 */

import type { FoodLogEntry, MealType } from '@/types'

export interface DayTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

/**
 * Sums all macro values from a list of food log entries.
 * Returns zeros when entries is empty.
 */
export function computeDayTotals(entries: FoodLogEntry[]): DayTotals {
  return entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      fat: acc.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

/**
 * Groups food log entries by meal type.
 * Returns a Map in display order (breakfast → lunch → dinner → snack).
 */
export function groupFoodsByMeal(entries: FoodLogEntry[]): Map<MealType, FoodLogEntry[]> {
  const map = new Map<MealType, FoodLogEntry[]>(MEAL_ORDER.map((m) => [m, []]))
  for (const entry of entries) {
    const bucket = map.get(entry.mealType)
    if (bucket) {
      bucket.push(entry)
    }
  }
  return map
}
