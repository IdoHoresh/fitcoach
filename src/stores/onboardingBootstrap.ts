/**
 * Post-onboarding orchestration.
 *
 * Flow:
 *   completeOnboarding → generate workout plan → generate weekly meal plan.
 *   Each step is gated on the previous one succeeding (no error in its store).
 *
 * Lives outside the Zustand stores to keep them decoupled — `useUserStore` can
 * not import `useWorkoutStore` / `useNutritionStore` without creating a cycle,
 * since both of those already depend on `useUserStore` for profile + TDEE.
 *
 * The function takes its store actions as parameters so it can be unit-tested
 * without pulling in `expo-sqlite` or real algorithm runs.
 */

import type { MealsPerDay } from '../types'

/** Default meals per day — matches the nutrition store / dev seed button. */
const DEFAULT_MEALS_PER_DAY: MealsPerDay = 4

export type FinishOnboardingDeps = {
  completeOnboarding: () => Promise<void>
  getUserError: () => string | null
  generateWorkoutPlan: () => Promise<void>
  getWorkoutError: () => string | null
  generateMealPlan: (mealsPerDay: MealsPerDay) => Promise<void>
  getNutritionError: () => string | null
}

export type FinishOnboardingResult = { ok: true } | { ok: false; error: string }

/**
 * Runs the full post-onboarding sequence. Short-circuits on the first error
 * surfaced through any store's `error` field.
 */
export async function finishOnboarding(
  deps: FinishOnboardingDeps,
): Promise<FinishOnboardingResult> {
  await deps.completeOnboarding()
  const userErr = deps.getUserError()
  if (userErr) return { ok: false, error: userErr }

  await deps.generateWorkoutPlan()
  const workoutErr = deps.getWorkoutError()
  if (workoutErr) return { ok: false, error: workoutErr }

  await deps.generateMealPlan(DEFAULT_MEALS_PER_DAY)
  const nutritionErr = deps.getNutritionError()
  if (nutritionErr) return { ok: false, error: nutritionErr }

  return { ok: true }
}

export type RehydratePlansDeps = {
  isOnboarded: boolean
  loadWorkoutPlan: () => Promise<void>
  loadActiveMealPlan: () => Promise<void>
  loadTodaysLog: () => Promise<void>
  refreshMealTargets: () => void
}

/**
 * Re-hydrates workout + nutrition stores from SQLite on cold start. No-op for
 * users who haven't finished onboarding (the router will send them to
 * `/(onboarding)/welcome` anyway).
 *
 * Loaders run in parallel — they read independent tables. Meal targets are
 * computed AFTER the loaders resolve because they depend on the profile being
 * in `useUserStore` (already loaded by the caller before this runs).
 */
export async function rehydratePlans(deps: RehydratePlansDeps): Promise<void> {
  if (!deps.isOnboarded) return

  await Promise.all([deps.loadWorkoutPlan(), deps.loadActiveMealPlan(), deps.loadTodaysLog()])

  deps.refreshMealTargets()
}
