/**
 * TDEE (Total Daily Energy Expenditure) Calculator — Component-Based.
 *
 * Instead of BMR × single activity multiplier, we calculate each component:
 *   TDEE = BMR + NEAT + EAT + TEF
 *
 *   BMR  = Basal Metabolic Rate (keeping you alive)          ~60-70%
 *   NEAT = Non-Exercise Activity Thermogenesis (daily life)   ~15-30%
 *   EAT  = Exercise Activity Thermogenesis (gym sessions)     ~5-10%
 *   TEF  = Thermic Effect of Food (digesting food)            ~10%
 *
 * Why component-based?
 *   A nurse and a programmer who both gym 3x/week have VERY different TDEE.
 *   The old 5-tier dropdown (sedentary → very active) misses this by 500+ kcal/day.
 *   Our approach captures occupation, daily steps, lifestyle, AND exercise separately.
 *
 * Sources:
 *   - BMR: Mifflin-St Jeor (1990), Katch-McArdle
 *   - NEAT: Levine JA (2005, Science), Tudor-Locke (2011), Ainsworth (2011)
 *   - EAT: ACSM metabolic equations, LaForgia (2006) EPOC review
 *   - TEF: Westerterp (2004, Nutrition & Metabolism)
 *   - Diminishing returns: Pontzer (2021, Science)
 *
 * Pure functions only — no side effects, no state, fully testable.
 */

import type {
  BiologicalSex,
  ExerciseIntensity,
  ExerciseType,
  LifestyleActivity,
  LifestyleProfile,
  OccupationType,
  TdeeBreakdown,
} from '../types'
import {
  BMR_COEFFICIENTS,
  BMR_SEX_OFFSET,
  ACTIVE_TIME_RATIO,
  EPOC_MULTIPLIER,
  ESTIMATED_STEPS_BY_OCCUPATION,
  EXERCISE_DIMINISHING_RETURNS,
  EXERCISE_KCAL_PER_ACTIVE_MIN,
  EXERCISE_REFERENCE_WEIGHT_KG,
  KATCH_MCARDLE,
  LIFESTYLE_NEAT,
  NEAT_KCAL_PER_1000_STEPS,
  NEAT_STEP_BASELINE,
  OCCUPATION_NEAT,
  TEF_PERCENTAGE,
} from '../data/constants'

// ── BMR Calculations ────────────────────────────────────────────────

/**
 * Calculates BMR using the Mifflin-St Jeor equation.
 *
 * Formula:
 *   Male:   10 × weight(kg) + 6.25 × height(cm) - 5 × age - 5
 *   Female: 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
 */
export function calculateBmrMifflin(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: BiologicalSex,
): number {
  const baseBmr =
    BMR_COEFFICIENTS.WEIGHT * weightKg +
    BMR_COEFFICIENTS.HEIGHT * heightCm -
    BMR_COEFFICIENTS.AGE * age +
    BMR_SEX_OFFSET[sex]

  return Math.round(baseBmr)
}

/**
 * Calculates BMR using the Katch-McArdle equation.
 * More accurate when body fat % is known.
 *
 * Formula: 370 + 21.6 × lean_body_mass(kg)
 */
export function calculateBmrKatchMcArdle(weightKg: number, bodyFatPercent: number): number {
  const leanBodyMass = weightKg * (1 - bodyFatPercent / 100)
  const bmr = KATCH_MCARDLE.BASE + KATCH_MCARDLE.LBM_COEFFICIENT * leanBodyMass

  return Math.round(bmr)
}

/**
 * Selects the best BMR formula based on available data.
 * If body fat % is known → Katch-McArdle. If not → Mifflin-St Jeor.
 */
export function calculateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: BiologicalSex,
  bodyFatPercent: number | null,
): number {
  if (bodyFatPercent !== null) {
    return calculateBmrKatchMcArdle(weightKg, bodyFatPercent)
  }
  return calculateBmrMifflin(weightKg, heightCm, age, sex)
}

// ── NEAT Calculation ────────────────────────────────────────────────

/**
 * Calculates NEAT from occupation type.
 * This is the extra calories burned at work above resting.
 */
export function calculateOccupationNeat(occupation: OccupationType): number {
  return OCCUPATION_NEAT[occupation]
}

/**
 * Calculates NEAT from daily steps.
 * Only counts steps ABOVE the baseline (first 3,000 are already in BMR + occupation).
 *
 * Example:
 *   10,000 steps → (10,000 - 3,000) / 1,000 × 35 = 245 kcal
 *    4,000 steps → (4,000 - 3,000) / 1,000 × 35 = 35 kcal
 *    2,000 steps → 0 kcal (below baseline)
 */
export function calculateStepNeat(dailySteps: number): number {
  const stepsAboveBaseline = Math.max(0, dailySteps - NEAT_STEP_BASELINE)
  return Math.round((stepsAboveBaseline / 1000) * NEAT_KCAL_PER_1000_STEPS)
}

/**
 * Calculates NEAT from after-work lifestyle activity.
 */
export function calculateLifestyleNeat(activity: LifestyleActivity): number {
  return LIFESTYLE_NEAT[activity]
}

/**
 * Gets estimated daily steps when user doesn't know their actual count.
 * Falls back to occupation-based estimate + lifestyle adjustment.
 */
export function estimateDailySteps(
  occupation: OccupationType,
  afterWorkActivity: LifestyleActivity,
): number {
  const baseSteps = ESTIMATED_STEPS_BY_OCCUPATION[occupation]

  // Lifestyle adjustment: sedentary people walk less after work, active more
  const lifestyleAdjustments: Record<LifestyleActivity, number> = {
    sedentary: -1500,
    moderate: 0,
    active: 2500,
  }

  return Math.max(0, baseSteps + lifestyleAdjustments[afterWorkActivity])
}

/**
 * Calculates total NEAT (Non-Exercise Activity Thermogenesis).
 * Combines occupation + steps + lifestyle, avoiding double-counting.
 */
export function calculateTotalNeat(
  occupation: OccupationType,
  dailySteps: number | null,
  afterWorkActivity: LifestyleActivity,
): number {
  // If user provides actual steps, use step-based NEAT (more accurate)
  // and skip occupation NEAT (steps already capture work walking)
  if (dailySteps !== null) {
    const stepNeat = calculateStepNeat(dailySteps)
    const lifestyleNeat = calculateLifestyleNeat(afterWorkActivity)
    return stepNeat + lifestyleNeat
  }

  // No steps data: use occupation + lifestyle estimates
  const occupationNeat = calculateOccupationNeat(occupation)
  const lifestyleNeat = calculateLifestyleNeat(afterWorkActivity)
  return occupationNeat + lifestyleNeat
}

// ── EAT Calculation ─────────────────────────────────────────────────

/**
 * Calculates daily exercise calorie burn (EAT).
 * Averages weekly exercise over 7 days for daily estimate.
 *
 * Includes:
 * - Active time ratio (strength = ~35% active, cardio = ~95% active)
 * - Weight scaling (heavier = more calories per minute of movement)
 * - EPOC (post-exercise burn, higher for strength training)
 * - Diminishing returns (Pontzer: body compensates above ~5 hrs/week)
 *
 * Why active time ratio matters:
 *   A 90-min strength session ≠ 90 min of movement.
 *   ~60% is rest between sets (standing, sitting, on phone).
 *   Only ~35% is actual lifting. Most apps ignore this and overestimate.
 */
export function calculateEat(
  exerciseDaysPerWeek: number,
  sessionMinutes: number,
  intensity: ExerciseIntensity,
  exerciseType: ExerciseType,
  weightKg: number,
): number {
  if (exerciseDaysPerWeek === 0) return 0

  // Convert session time to ACTIVE minutes (accounts for rest periods)
  const activeRatio = ACTIVE_TIME_RATIO[exerciseType]
  const activeMinutesPerSession = sessionMinutes * activeRatio
  const weeklyActiveMinutes = exerciseDaysPerWeek * activeMinutesPerSession

  // Scale calorie burn by body weight relative to reference
  const weightScale = weightKg / EXERCISE_REFERENCE_WEIGHT_KG

  // Burn per minute of ACTIVE movement, scaled by weight
  const kcalPerActiveMinute = EXERCISE_KCAL_PER_ACTIVE_MIN[intensity] * weightScale

  // Apply diminishing returns for high volume (Pontzer's model)
  // Note: cap is based on ACTIVE minutes, not total session time
  const fullEffectMin = Math.min(
    weeklyActiveMinutes,
    EXERCISE_DIMINISHING_RETURNS.FULL_EFFECT_MINUTES_PER_WEEK,
  )
  const reducedEffectMin = Math.max(
    0,
    weeklyActiveMinutes - EXERCISE_DIMINISHING_RETURNS.FULL_EFFECT_MINUTES_PER_WEEK,
  )

  const weeklyBurn =
    fullEffectMin * kcalPerActiveMinute +
    reducedEffectMin * kcalPerActiveMinute * EXERCISE_DIMINISHING_RETURNS.REDUCED_EFFECT_MULTIPLIER

  // Apply EPOC multiplier
  const weeklyBurnWithEpoc = weeklyBurn * EPOC_MULTIPLIER[exerciseType]

  // Convert to daily average
  const daysPerWeek = 7
  return Math.round(weeklyBurnWithEpoc / daysPerWeek)
}

// ── TEF Calculation ─────────────────────────────────────────────────

/**
 * Calculates TEF (Thermic Effect of Food).
 * TEF = ~10% of total caloric intake.
 *
 * Since we don't know intake yet (chicken-and-egg problem),
 * we estimate TEF as 10% of (BMR + NEAT + EAT).
 * This is mathematically equivalent to the iterative approach.
 */
export function calculateTef(bmr: number, neat: number, eat: number): number {
  // TEF = 0.10 × intake ≈ 0.10 × (BMR + NEAT + EAT) / (1 - 0.10)
  // Simplified: TEF ≈ (BMR + NEAT + EAT) × TEF% / (1 - TEF%)
  const baseExpenditure = bmr + neat + eat
  return Math.round((baseExpenditure * TEF_PERCENTAGE) / (1 - TEF_PERCENTAGE))
}

// ── Complete TDEE ───────────────────────────────────────────────────

/**
 * Calculates complete TDEE with full breakdown.
 * This is the main entry point — takes user profile and returns detailed result.
 *
 * Example for a 75kg male programmer who gyms 4x/week:
 *   BMR  = 1,735 kcal
 *   NEAT = 150 (desk) + 200 (moderate lifestyle) = 350 kcal
 *   EAT  = 400 kcal (averaged over 7 days)
 *   TEF  = 276 kcal (10% of intake)
 *   TDEE = 2,761 kcal
 *
 * Compare to old method: 1,735 × 1.55 = 2,689 (72 kcal off — close here,
 * but for a nurse: old = 2,689, new = 3,200+ — huge difference!)
 */
export function calculateTdeeBreakdown(
  bmr: number,
  weightKg: number,
  lifestyle: LifestyleProfile,
): TdeeBreakdown {
  const neat = calculateTotalNeat(
    lifestyle.occupation,
    lifestyle.dailySteps,
    lifestyle.afterWorkActivity,
  )

  const eat = calculateEat(
    lifestyle.exerciseDaysPerWeek,
    lifestyle.sessionDurationMinutes,
    lifestyle.exerciseIntensity,
    lifestyle.exerciseType,
    weightKg,
  )

  const tef = calculateTef(bmr, neat, eat)

  return {
    bmr,
    neat,
    eat,
    tef,
    total: bmr + neat + eat + tef,
  }
}
