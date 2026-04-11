/**
 * Deficit Redistribution Algorithm.
 *
 * After a user marks meal adherence, any macro deficit (or surplus) for that
 * meal is silently redistributed across the remaining unfilled meals for the
 * day. A toast is shown only when the adjustment is meaningful (> 5g macro
 * or > 50 kcal) so small rounding diffs don't clutter the UI.
 *
 * Pure function — no side effects, no state.
 */

import type { MealMacroTargetByName, MealName } from './meal-targets'

// ── Types ────────────────────────────────────────────────────────────

export type ToastMacro = 'protein' | 'fat' | 'carbs' | 'calories' | null

export interface RedistributionResult {
  /** Updated targets for all 4 meals (only remaining meals change). */
  readonly updatedTargets: Record<MealName, MealMacroTargetByName>
  /** Which macro to mention in the toast, or null if no toast needed. */
  readonly toastMacro: ToastMacro
  /** Amount (grams) redistributed per meal for the toast macro. */
  readonly toastAmount: number
  /** First remaining meal — shown as the destination in the toast. */
  readonly toastMealName: MealName | null
}

export interface LoggedMacros {
  readonly calories: number
  readonly protein: number
  readonly fat: number
  readonly carbs: number
}

// ── Constants ────────────────────────────────────────────────────────

const MACRO_TOAST_THRESHOLD_G = 5
const CALORIE_TOAST_THRESHOLD_KCAL = 50

// ── Public function ──────────────────────────────────────────────────

/**
 * Compute how to redistribute a meal's deficit/surplus to remaining meals.
 *
 * @param logged         - What the user actually logged for the completed meal
 * @param mealTarget     - The original target for the completed meal
 * @param remainingMeals - Meal names that still have no adherence today
 * @param currentTargets - Current targets for all 4 meals
 * @returns Updated targets + toast info (toastMacro null = no toast)
 */
export function computeRedistribution(
  logged: LoggedMacros,
  mealTarget: MealMacroTargetByName,
  remainingMeals: MealName[],
  currentTargets: Record<MealName, MealMacroTargetByName>,
): RedistributionResult {
  // No remaining meals → nothing to redistribute
  if (remainingMeals.length === 0) {
    return {
      updatedTargets: currentTargets,
      toastMacro: null,
      toastAmount: 0,
      toastMealName: null,
    }
  }

  const count = remainingMeals.length

  // deficit = target - logged (positive = user ate less than planned)
  const deficitProtein = mealTarget.protein - logged.protein
  const deficitFat = mealTarget.fat - logged.fat
  const deficitCarbs = mealTarget.carbs - logged.carbs
  const deficitCalories = mealTarget.calories - logged.calories

  // Per-meal adjustment (split evenly, rounded to 1 decimal for precision)
  const addProtein = deficitProtein / count
  const addFat = deficitFat / count
  const addCarbs = deficitCarbs / count
  const addCalories = deficitCalories / count

  // Build updated targets — only modify remaining meals, floor at 0
  const updatedTargets = { ...currentTargets }
  for (const meal of remainingMeals) {
    const t = currentTargets[meal]
    updatedTargets[meal] = {
      calories: Math.max(0, Math.round(t.calories + addCalories)),
      protein: Math.max(0, Math.round(t.protein + addProtein)),
      fat: Math.max(0, Math.round(t.fat + addFat)),
      carbs: Math.max(0, Math.round(t.carbs + addCarbs)),
    }
  }

  // Decide toast: pick the macro with the biggest absolute deficit
  const toastMacro = pickToastMacro(deficitProtein, deficitFat, deficitCarbs, deficitCalories)
  const toastAmount =
    toastMacro === 'protein'
      ? Math.abs(Math.round(deficitProtein))
      : toastMacro === 'fat'
        ? Math.abs(Math.round(deficitFat))
        : toastMacro === 'carbs'
          ? Math.abs(Math.round(deficitCarbs))
          : toastMacro === 'calories'
            ? Math.abs(Math.round(deficitCalories))
            : 0

  return {
    updatedTargets,
    toastMacro,
    toastAmount,
    toastMealName: toastMacro ? remainingMeals[0] : null,
  }
}

// ── Internal helpers ─────────────────────────────────────────────────

/**
 * Pick which macro to mention in the toast.
 * Returns the macro with the largest absolute deficit above its threshold,
 * or null if no macro/calorie exceeds the threshold.
 * Priority: protein → fat → carbs → calories.
 */
function pickToastMacro(
  deficitProtein: number,
  deficitFat: number,
  deficitCarbs: number,
  deficitCalories: number,
): ToastMacro {
  if (Math.abs(deficitProtein) > MACRO_TOAST_THRESHOLD_G) return 'protein'
  if (Math.abs(deficitFat) > MACRO_TOAST_THRESHOLD_G) return 'fat'
  if (Math.abs(deficitCarbs) > MACRO_TOAST_THRESHOLD_G) return 'carbs'
  if (Math.abs(deficitCalories) > CALORIE_TOAST_THRESHOLD_KCAL) return 'calories'
  return null
}
