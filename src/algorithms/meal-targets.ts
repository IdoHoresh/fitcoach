/**
 * Per-Meal Macro Targets.
 *
 * Computes per-meal {calories, protein, fat, carbs} for the 4 named meals
 * (breakfast, lunch, dinner, snack) based on when the user works out.
 *
 * Key decisions:
 * - PROTEIN starts even (daily/4), then boosted ×1.2 for post-workout/light
 *   roles; non-boosted meals are scaled down so the total stays exact.
 * - FAT starts even (daily/4), then capped at <15% of meal calories for
 *   pre-workout roles; excess redistributed proportionally to other meals.
 * - CARBS fill remaining calories: (mealCal - protein×4 - fat×9) / 4.
 * - Rounding drift is absorbed by the highest-calorie meal.
 *
 * Sources:
 * - Mamerow et al. (2014) — even protein distribution maximizes 24h MPS
 * - Kerksick et al. (2017) — ISSN nutrient timing position stand
 * - Schoenfeld & Aragon (2018) — post-exercise protein timing
 *
 * Pure functions only — no side effects, no state.
 */

import type { NutritionTargets, TrainingGoal, WorkoutTime } from '../types'
import {
  CALORIES_PER_GRAM,
  FAT_CAP_PRE_WORKOUT,
  MEAL_CALORIE_SPLIT_BY_GOAL,
  PROTEIN_BOOST_MULTIPLIER,
} from '../data/constants'

// ── Types ────────────────────────────────────────────────────────────

export type MealName = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealMacroTargetByName {
  readonly calories: number
  readonly protein: number
  readonly fat: number
  readonly carbs: number
}

type MealRole = 'pre_workout' | 'post_workout' | 'normal_am' | 'normal_pm' | 'light' | 'even'

// ── Internal constants ───────────────────────────────────────────────

const MEAL_NAMES: readonly MealName[] = ['breakfast', 'lunch', 'dinner', 'snack']

const MEAL_ROLE_MAP: Record<Exclude<WorkoutTime, 'flexible'>, Record<MealName, MealRole>> = {
  morning: {
    breakfast: 'pre_workout',
    lunch: 'post_workout',
    dinner: 'normal_pm',
    snack: 'light',
  },
  evening: {
    breakfast: 'normal_am',
    lunch: 'normal_am',
    dinner: 'pre_workout',
    snack: 'post_workout',
  },
}

const BOOSTED_ROLES: ReadonlySet<MealRole> = new Set(['post_workout', 'light'])

// ── Public function ──────────────────────────────────────────────────

/**
 * Compute per-meal macro targets for the 4 named meals.
 *
 * @param dailyTargets - Daily nutrition targets (calories, protein, fat, carbs)
 * @param workoutTime  - When the user typically trains ('morning' | 'evening' | 'flexible')
 * @param goal         - Training goal that drives the calorie split
 * @returns Record mapping each meal name to its macro target
 * @throws RangeError if targetCalories is zero or negative
 */
export function computeMealTargets(
  dailyTargets: NutritionTargets,
  workoutTime: WorkoutTime,
  goal: TrainingGoal,
): Record<MealName, MealMacroTargetByName> {
  if (dailyTargets.targetCalories <= 0) {
    throw new RangeError(`targetCalories must be positive, got ${dailyTargets.targetCalories}`)
  }

  const split = MEAL_CALORIE_SPLIT_BY_GOAL[goal]
  const roles = assignRoles(workoutTime)

  const mealCalories = distributeMealCalories(dailyTargets.targetCalories, split)
  const mealProtein = distributeMealProtein(dailyTargets.proteinGrams, roles)
  const mealFat = distributeMealFat(dailyTargets.fatGrams, roles, mealCalories)
  const mealCarbs = deriveMealCarbs(dailyTargets.carbGrams, mealCalories, mealProtein, mealFat)

  return {
    breakfast: {
      calories: mealCalories.breakfast,
      protein: mealProtein.breakfast,
      fat: mealFat.breakfast,
      carbs: mealCarbs.breakfast,
    },
    lunch: {
      calories: mealCalories.lunch,
      protein: mealProtein.lunch,
      fat: mealFat.lunch,
      carbs: mealCarbs.lunch,
    },
    dinner: {
      calories: mealCalories.dinner,
      protein: mealProtein.dinner,
      fat: mealFat.dinner,
      carbs: mealCarbs.dinner,
    },
    snack: {
      calories: mealCalories.snack,
      protein: mealProtein.snack,
      fat: mealFat.snack,
      carbs: mealCarbs.snack,
    },
  }
}

// ── Internal helpers ─────────────────────────────────────────────────

function assignRoles(workoutTime: WorkoutTime): Record<MealName, MealRole> {
  if (workoutTime === 'flexible') {
    return { breakfast: 'even', lunch: 'even', dinner: 'even', snack: 'even' }
  }
  return MEAL_ROLE_MAP[workoutTime]
}

function distributeMealCalories(
  totalCalories: number,
  split: Record<MealName, number>,
): Record<MealName, number> {
  const raw = MEAL_NAMES.map((name) => split[name] * totalCalories)
  return roundWithDriftAdjustment(raw, totalCalories)
}

function distributeMealProtein(
  totalProtein: number,
  roles: Record<MealName, MealRole>,
): Record<MealName, number> {
  const basePerMeal = totalProtein / MEAL_NAMES.length
  const boostedCount = MEAL_NAMES.filter((n) => BOOSTED_ROLES.has(roles[n])).length
  const nonBoostedCount = MEAL_NAMES.length - boostedCount

  // Boosted meals take extra protein; non-boosted are scaled down to compensate.
  // total = boostedCount×base×1.2 + nonBoostedCount×base×scale = totalProtein
  // → scale = (totalProtein - boostedCount×base×1.2) / (nonBoostedCount×base)
  let nonBoostedShare = basePerMeal
  if (boostedCount > 0 && nonBoostedCount > 0) {
    const boostedTotal = boostedCount * basePerMeal * PROTEIN_BOOST_MULTIPLIER
    nonBoostedShare = (totalProtein - boostedTotal) / nonBoostedCount
  }

  const raw = MEAL_NAMES.map((name) =>
    BOOSTED_ROLES.has(roles[name]) ? basePerMeal * PROTEIN_BOOST_MULTIPLIER : nonBoostedShare,
  )
  return roundWithDriftAdjustment(raw, totalProtein)
}

function distributeMealFat(
  totalFat: number,
  roles: Record<MealName, MealRole>,
  mealCalories: Record<MealName, number>,
): Record<MealName, number> {
  const basePerMeal = totalFat / MEAL_NAMES.length

  // Calculate how much fat each pre_workout meal can hold, and the excess.
  let excessFat = 0
  const initial = MEAL_NAMES.map((name) => {
    if (roles[name] === 'pre_workout') {
      // Use Math.ceil(cap) - 1 to get the largest integer gram count that is
      // strictly less than the 15% threshold (handles the exact-integer edge case).
      const cap = Math.max(
        0,
        Math.ceil((mealCalories[name] * FAT_CAP_PRE_WORKOUT) / CALORIES_PER_GRAM.FAT) - 1,
      )
      const allocated = Math.min(basePerMeal, cap)
      excessFat += basePerMeal - allocated
      return allocated
    }
    return basePerMeal
  })

  // Redistribute excess fat proportionally to non-capped meals.
  if (excessFat > 0) {
    const nonCappedIndices = MEAL_NAMES.map((name, i) =>
      roles[name] !== 'pre_workout' ? i : -1,
    ).filter((i) => i >= 0)

    const addPerMeal = excessFat / nonCappedIndices.length
    nonCappedIndices.forEach((i) => {
      initial[i] += addPerMeal
    })
  }

  return roundWithDriftAdjustment(initial, totalFat)
}

function deriveMealCarbs(
  totalCarbs: number,
  mealCalories: Record<MealName, number>,
  mealProtein: Record<MealName, number>,
  mealFat: Record<MealName, number>,
): Record<MealName, number> {
  const raw = MEAL_NAMES.map((name) => {
    const remaining =
      mealCalories[name] -
      mealProtein[name] * CALORIES_PER_GRAM.PROTEIN -
      mealFat[name] * CALORIES_PER_GRAM.FAT
    return Math.max(0, remaining / CALORIES_PER_GRAM.CARBS)
  })
  return roundWithDriftAdjustment(raw, totalCarbs)
}

/**
 * Round an array of floats to integers, then adjust the highest-value
 * entry so the sum exactly matches the target.
 */
function roundWithDriftAdjustment(values: number[], target: number): Record<MealName, number> {
  const rounded = values.map(Math.round)
  const sum = rounded.reduce((a, b) => a + b, 0)
  const drift = Math.round(target) - sum

  if (drift !== 0) {
    // Absorb rounding drift in the largest meal.
    const maxIdx = rounded.indexOf(Math.max(...rounded))
    rounded[maxIdx] += drift
  }

  return MEAL_NAMES.reduce<Record<MealName, number>>(
    (acc, name, i) => ({ ...acc, [name]: rounded[i] }),
    {} as Record<MealName, number>,
  )
}
