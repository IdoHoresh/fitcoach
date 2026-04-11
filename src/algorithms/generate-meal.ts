/**
 * Meal Generation Algorithm.
 *
 * Generates a 2-3 item meal that approximately hits a macro target by:
 *   1. Picking a protein food  → grams from target.protein
 *   2. Picking a carb food     → grams from remaining carbs
 *   3. Picking a fat food      → grams from remaining fat (only when > 5g left)
 *
 * All picks are random; pass `excludeIds` to force different choices (regenerate).
 * Falls back to the full pool when all candidates are excluded.
 *
 * Pure function — no side effects, no state.
 */

import type { FoodItem, FoodCategory } from '../types'
import type { MealMacroTargetByName } from './meal-targets'

// ── Types ────────────────────────────────────────────────────────────

export interface GeneratedMealItem {
  readonly food: FoodItem
  readonly grams: number
}

// ── Constants ────────────────────────────────────────────────────────

const PROTEIN_CATEGORIES: ReadonlySet<FoodCategory> = new Set(['protein', 'dairy'])
const CARB_CATEGORIES: ReadonlySet<FoodCategory> = new Set([
  'carbs',
  'fruits',
  'vegetables',
  'traditional',
  'snacks',
])
const FAT_CATEGORIES: ReadonlySet<FoodCategory> = new Set(['fats'])

/** Minimum remaining fat (grams) to justify adding a dedicated fat food */
const FAT_ITEM_THRESHOLD_G = 5

// ── Public function ──────────────────────────────────────────────────

/**
 * Generate a meal from the food map that approximately hits the macro target.
 *
 * @param target    - Per-meal macro target (calories, protein, fat, carbs)
 * @param foodMap   - All available foods keyed by ID
 * @param excludeIds - Food IDs to skip (used for regenerate to get different picks)
 * @returns 2 or 3 GeneratedMealItems
 */
export function generateMeal(
  target: MealMacroTargetByName,
  foodMap: ReadonlyMap<string, FoodItem>,
  excludeIds?: ReadonlySet<string>,
): GeneratedMealItem[] {
  const foods = [...foodMap.values()]

  // Step 1: protein food → grams cover target.protein
  const proteinFood =
    pickRandom(foods, PROTEIN_CATEGORIES, excludeIds) ?? pickRandom(foods, PROTEIN_CATEGORIES)
  if (!proteinFood) throw new RangeError('No protein foods available in food map')
  const proteinGrams = gramsForMacro(target.protein, proteinFood.proteinPer100g)
  const fatFromProtein = (proteinGrams / 100) * proteinFood.fatPer100g
  const carbsFromProtein = (proteinGrams / 100) * proteinFood.carbsPer100g

  const items: GeneratedMealItem[] = [{ food: proteinFood, grams: proteinGrams }]

  // Step 2: carb food → grams cover remaining carbs
  const remainingCarbs = Math.max(0, target.carbs - carbsFromProtein)
  const carbFood =
    pickRandom(foods, CARB_CATEGORIES, excludeIds) ?? pickRandom(foods, CARB_CATEGORIES)
  if (!carbFood) throw new RangeError('No carb foods available in food map')
  const carbGrams = gramsForMacro(remainingCarbs, carbFood.carbsPer100g)
  const fatFromCarbs = (carbGrams / 100) * carbFood.fatPer100g

  items.push({ food: carbFood, grams: carbGrams })

  // Step 3: fat food → only when remaining fat > threshold
  const remainingFat = target.fat - fatFromProtein - fatFromCarbs
  if (remainingFat > FAT_ITEM_THRESHOLD_G) {
    const fatFood =
      pickRandom(foods, FAT_CATEGORIES, excludeIds) ?? pickRandom(foods, FAT_CATEGORIES)
    if (fatFood) {
      const fatGrams = gramsForMacro(remainingFat, fatFood.fatPer100g)
      items.push({ food: fatFood, grams: fatGrams })
    }
  }

  return items
}

// ── Internal helpers ─────────────────────────────────────────────────

/**
 * Pick a random food matching the given categories.
 * Respects excludeIds when provided; returns undefined if no candidates.
 */
function pickRandom(
  foods: FoodItem[],
  categories: ReadonlySet<FoodCategory>,
  excludeIds?: ReadonlySet<string>,
): FoodItem | undefined {
  const candidates = foods.filter(
    (f) => categories.has(f.category) && (!excludeIds || !excludeIds.has(f.id)),
  )
  if (candidates.length === 0) return undefined
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/**
 * Calculate how many grams of a food are needed to hit a macro target.
 * Falls back to 100g when the food has none of that macro.
 */
function gramsForMacro(targetMacroG: number, macroPer100g: number): number {
  if (macroPer100g <= 0) return 100
  return Math.max(10, Math.round((targetMacroG / macroPer100g) * 100))
}
