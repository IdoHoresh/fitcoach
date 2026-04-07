/**
 * Macro Distributor.
 *
 * Splits daily macro targets into per-meal targets for N meals (3-6).
 *
 * Key decisions:
 * - PROTEIN is split EVENLY across all meals (leucine threshold ~30-40g/meal
 *   maximizes muscle protein synthesis per meal).
 * - FAT and CARBS follow proportional distribution from MEAL_CALORIE_DISTRIBUTION.
 * - On TRAINING DAYS with 5-6 meals: 15% of carbs shift to pre/post-workout meals.
 *   For 3-4 meal plans (no workout-specific slots), no shifting.
 *
 * Sources:
 * - Schoenfeld & Aragon (2018) — protein distribution and MPS
 * - Mamerow et al. (2014) — even protein distribution superiority
 * - Kerksick et al. (2017) — ISSN position stand on nutrient timing
 *
 * Pure functions only — no side effects, no state.
 */

import type { MealType, MealsPerDay } from '../types'
import {
  CALORIES_PER_GRAM,
  MEAL_CALORIE_DISTRIBUTION,
  TRAINING_DAY_CARB_SHIFT,
} from '../data/constants'

// ── Types ───────────────────────────────────────────────────────────

export interface MealMacroTarget {
  readonly mealType: MealType
  readonly calories: number
  readonly protein: number
  readonly fat: number
  readonly carbs: number
}

// ── Meal type ordering ──────────────────────────────────────────────

const MEAL_TYPE_ORDER: readonly MealType[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'pre_workout',
  'post_workout',
]

const WORKOUT_MEAL_TYPES: ReadonlySet<MealType> = new Set(['pre_workout', 'post_workout'])

// ── Public Functions ────────────────────────────────────────────────

/**
 * Returns the active meal types for a given meal count.
 * Derived from MEAL_CALORIE_DISTRIBUTION — only types with proportion > 0.
 */
export function getMealTypesForCount(mealsPerDay: MealsPerDay): MealType[] {
  const distribution = MEAL_CALORIE_DISTRIBUTION[mealsPerDay]
  return MEAL_TYPE_ORDER.filter((type) => distribution[type] > 0)
}

/**
 * Main entry point: distribute daily macros across N meals.
 *
 * @param totalProtein  - Daily protein grams
 * @param totalFat      - Daily fat grams
 * @param totalCarbs    - Daily carb grams
 * @param mealsPerDay   - Number of meals (3-6)
 * @param isTrainingDay - Whether to shift carbs to workout meals
 * @returns Array of per-meal macro targets, sorted by meal order
 */
export function distributeMacros(
  totalProtein: number,
  totalFat: number,
  totalCarbs: number,
  mealsPerDay: MealsPerDay,
  isTrainingDay: boolean,
): MealMacroTarget[] {
  const mealTypes = getMealTypesForCount(mealsPerDay)
  const distribution = MEAL_CALORIE_DISTRIBUTION[mealsPerDay]

  const proteinPerMeal = distributeEvenly(totalProtein, mealTypes)
  const fatPerMeal = distributeProportionally(totalFat, mealTypes, distribution)
  const carbsPerMeal = distributeCarbs(totalCarbs, mealTypes, distribution, isTrainingDay)

  return mealTypes.map((type, i) => {
    const protein = proteinPerMeal[i]
    const fat = fatPerMeal[i]
    const carbs = carbsPerMeal[i]
    const calories =
      protein * CALORIES_PER_GRAM.PROTEIN +
      carbs * CALORIES_PER_GRAM.CARBS +
      fat * CALORIES_PER_GRAM.FAT

    return { mealType: type, calories, protein, fat, carbs }
  })
}

// ── Internal Helpers ────────────────────────────────────────────────

/**
 * Adds an amount evenly across the given indices in a result array.
 * Mutates `result` in place. Remainder goes to the last index to ensure exact sum.
 */
function distributeAmongIndices(result: number[], indices: number[], amount: number): void {
  const perIndex = Math.round(amount / indices.length)
  let totalAdded = 0
  for (let i = 0; i < indices.length; i++) {
    const toAdd = i === indices.length - 1 ? amount - totalAdded : perIndex
    result[indices[i]] += toAdd
    totalAdded += toAdd
  }
}

/**
 * Distributes a total evenly across N meals.
 * Remainder goes to the last meal to ensure exact sum.
 */
function distributeEvenly(total: number, mealTypes: MealType[]): number[] {
  const count = mealTypes.length
  const perMeal = Math.round(total / count)
  const result = new Array(count).fill(perMeal) as number[]

  // Adjust last meal to absorb rounding error
  const currentSum = perMeal * count
  result[count - 1] += total - currentSum

  return result
}

/**
 * Distributes a total proportionally based on calorie distribution percentages.
 * Remainder goes to the last meal to ensure exact sum.
 */
function distributeProportionally(
  total: number,
  mealTypes: MealType[],
  distribution: Record<MealType, number>,
): number[] {
  const result = mealTypes.map((type) => Math.round(total * distribution[type]))

  // Adjust last meal for rounding remainder
  const currentSum = result.reduce((a, b) => a + b, 0)
  result[result.length - 1] += total - currentSum

  return result
}

/**
 * Distributes carbs with optional training-day shift.
 * Shift only applies when mealsPerDay >= 5 (workout slots exist).
 */
function distributeCarbs(
  totalCarbs: number,
  mealTypes: MealType[],
  distribution: Record<MealType, number>,
  isTrainingDay: boolean,
): number[] {
  // Start with proportional distribution
  const result = distributeProportionally(totalCarbs, mealTypes, distribution)

  // Only shift if training day AND workout meal slots exist
  const hasWorkoutSlots = mealTypes.some((type) => WORKOUT_MEAL_TYPES.has(type))
  if (!isTrainingDay || !hasWorkoutSlots) {
    return result
  }

  // Calculate carbs to shift (15% of total)
  const carbsToShift = Math.round(totalCarbs * TRAINING_DAY_CARB_SHIFT)

  // Find workout and non-workout meal indices
  const workoutIndices: number[] = []
  const nonWorkoutIndices: number[] = []
  mealTypes.forEach((type, i) => {
    if (WORKOUT_MEAL_TYPES.has(type)) {
      workoutIndices.push(i)
    } else {
      nonWorkoutIndices.push(i)
    }
  })

  // Add carbs to workout meals (split evenly, remainder to last)
  distributeAmongIndices(result, workoutIndices, carbsToShift)

  // Remove carbs from non-workout meals (proportional to their share)
  const nonWorkoutCarbTotal = nonWorkoutIndices.reduce(
    (sum, i) => sum + Math.round(totalCarbs * distribution[mealTypes[i]]),
    0,
  )
  let totalRemoved = 0
  for (let i = 0; i < nonWorkoutIndices.length; i++) {
    const idx = nonWorkoutIndices[i]
    const originalValue = Math.round(totalCarbs * distribution[mealTypes[idx]])
    const toRemove =
      i === nonWorkoutIndices.length - 1
        ? carbsToShift - totalRemoved
        : Math.round(carbsToShift * (originalValue / nonWorkoutCarbTotal))
    result[idx] -= toRemove
    totalRemoved += toRemove
  }

  return result
}
