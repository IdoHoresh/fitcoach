/**
 * Meal Generation Algorithm.
 *
 * Generates a 2-3 item meal that hits a macro target while staying within
 * the calorie budget. Uses a calorie-aware budget approach:
 *
 *   1. Pick a protein food → calculate grams from protein target
 *   2. Deduct those calories from budget
 *   3. Pick a carb food → grams capped by both carb target AND remaining budget
 *   4. Pick a fat food  → grams capped by both fat target AND remaining budget
 *
 * Carb sources are limited to real meal foods (rice, pasta, bread, traditional)
 * — NOT vegetables, fruits, or snacks which shouldn't be a primary carb source
 * in a generated meal.
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

// ── Category sets for meal generation ───────────────────────────────
// These are NARROWER than the search tabs — only proper meal foods.

/** Whole-food protein sources suitable as a main meal protein. */
const MEAL_PROTEIN_CATS: ReadonlySet<FoodCategory> = new Set(['protein', 'dairy'])

/**
 * Real meal carb sources: grains, breads, legumes, traditional foods.
 * Excludes fruits, vegetables, and snacks — not suitable as primary
 * carb sources in a generated meal (cucumber ≠ carb course).
 */
const MEAL_CARB_CATS: ReadonlySet<FoodCategory> = new Set(['carbs', 'traditional'])

/** Healthy fat sources: avocado, olive oil, nuts, seeds. */
const MEAL_FAT_CATS: ReadonlySet<FoodCategory> = new Set(['fats'])

/** Minimum remaining fat (g) to justify adding a dedicated fat food. */
const FAT_ITEM_THRESHOLD_G = 5

/** Minimum grams for any food item (avoid 3g of rice). */
const MIN_GRAMS = 10

// ── Public function ──────────────────────────────────────────────────

/**
 * Generate a meal from the food map that approximately hits the macro target
 * without exceeding the calorie budget.
 *
 * @param target     - Per-meal macro target (calories, protein, fat, carbs)
 * @param foodMap    - All available foods keyed by ID
 * @param excludeIds - Food IDs to skip (used for regenerate to get different picks)
 * @returns 2 or 3 GeneratedMealItems
 */
export function generateMeal(
  target: MealMacroTargetByName,
  foodMap: ReadonlyMap<string, FoodItem>,
  excludeIds?: ReadonlySet<string>,
): GeneratedMealItem[] {
  const foods = [...foodMap.values()]

  // ── Step 1: Protein food ─────────────────────────────────────────────
  const proteinFood =
    pickRandom(foods, MEAL_PROTEIN_CATS, excludeIds) ?? pickRandom(foods, MEAL_PROTEIN_CATS)
  if (!proteinFood) throw new RangeError('No protein foods available in food map')

  // Cap protein grams at 60% of calorie budget — leaves room for carbs + fat.
  // Without this cap, a low-density protein food (eggs: 13g/100g) would need
  // 300+ grams to hit the protein target, consuming the entire budget alone.
  const gramsByProtein = gramsForMacro(target.protein, proteinFood.proteinPer100g)
  const maxGramsBy60Pct = Math.max(
    MIN_GRAMS,
    Math.round(((target.calories * 0.6) / proteinFood.caloriesPer100g) * 100),
  )
  const proteinGrams = Math.min(gramsByProtein, maxGramsBy60Pct)

  const calFromProtein = (proteinGrams / 100) * proteinFood.caloriesPer100g
  const fatFromProtein = (proteinGrams / 100) * proteinFood.fatPer100g
  const carbsFromProtein = (proteinGrams / 100) * proteinFood.carbsPer100g

  const items: GeneratedMealItem[] = [{ food: proteinFood, grams: proteinGrams }]

  // Remaining budget after protein
  let remainingCal = target.calories - calFromProtein
  let remainingCarbs = Math.max(0, target.carbs - carbsFromProtein)
  let remainingFat = Math.max(0, target.fat - fatFromProtein)

  // ── Step 2: Carb food ────────────────────────────────────────────────
  const carbFood =
    pickRandom(foods, MEAL_CARB_CATS, excludeIds) ?? pickRandom(foods, MEAL_CARB_CATS)

  if (carbFood && remainingCarbs > 5) {
    // Reserve a minimum budget for a fat item before allocating to carbs
    const fatReserve = FAT_ITEM_THRESHOLD_G * 9 // ~45 kcal minimum for a fat food
    const calBudgetForCarbs = Math.max(0, remainingCal - fatReserve)

    const gramsByCarbs = gramsForMacro(remainingCarbs, carbFood.carbsPer100g)
    const maxGramsByCal = Math.max(
      MIN_GRAMS,
      Math.round((calBudgetForCarbs / carbFood.caloriesPer100g) * 100),
    )
    const carbGrams = Math.min(gramsByCarbs, maxGramsByCal)

    const calFromCarbs = (carbGrams / 100) * carbFood.caloriesPer100g
    const fatFromCarbs = (carbGrams / 100) * carbFood.fatPer100g

    items.push({ food: carbFood, grams: carbGrams })
    remainingCal -= calFromCarbs
    remainingFat = Math.max(0, remainingFat - fatFromCarbs)
  }

  // ── Step 3: Fat food ─────────────────────────────────────────────────
  if (remainingFat > FAT_ITEM_THRESHOLD_G && remainingCal > 50) {
    const fatFood = pickRandom(foods, MEAL_FAT_CATS, excludeIds) ?? pickRandom(foods, MEAL_FAT_CATS)
    if (fatFood) {
      // Cap grams by BOTH the fat target and the remaining calorie budget
      const gramsByFat = gramsForMacro(remainingFat, fatFood.fatPer100g)
      const maxGramsByCal = Math.max(
        MIN_GRAMS,
        Math.round((remainingCal / fatFood.caloriesPer100g) * 100),
      )
      const fatGrams = Math.min(gramsByFat, maxGramsByCal)
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
  return Math.max(MIN_GRAMS, Math.round((targetMacroG / macroPer100g) * 100))
}
