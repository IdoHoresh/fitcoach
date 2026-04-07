/**
 * Weekly Recalibration Engine.
 *
 * Analyzes weekly weight trends and adjusts calorie targets to keep
 * the user progressing toward their goal at a healthy, sustainable rate.
 *
 * Algorithm:
 * 1. Check data quality (minimum weeks, adherence threshold)
 * 2. Calculate weight change from last two weekly averages
 * 3. Compare to expected range for goal
 * 4. Determine action and severity
 * 5. Calculate calorie adjustment (±100-300 kcal in steps)
 * 6. Recalculate macros from new calorie target
 * 7. Return coach message key for i18n
 *
 * Conservative approach — small adjustments prevent yo-yo dieting.
 *
 * Sources:
 * - Helms ER et al. (2014), Evidence-based recommendations for contest prep
 * - Israetel M, RP Strength — rate of weight change guidelines
 * - Aragon AA et al. (2017), ISSN position stand on diets
 *
 * Pure functions only — no side effects, no state.
 */

import type {
  BiologicalSex,
  RecalibrationAction,
  RecalibrationResult,
  RecalibrationSeverity,
  TrainingGoal,
} from '../types'
import {
  CALORIE_ADJUSTMENT_STEP,
  CALORIE_FLOOR,
  EXPECTED_WEEKLY_CHANGE,
  MAX_CALORIE_ADJUSTMENT,
  MIN_ADHERENCE_FOR_RECALIBRATION,
  MIN_WEEKS_BEFORE_RECALIBRATION,
} from '../data/constants'
import { calculateCarbGrams, calculateFatGrams, calculateProteinGrams } from './macro-calculator'

// ── Public Functions ────────────────────────────────────────────────

/**
 * Calculates weight change from weekly averages.
 * Returns null if insufficient data (fewer than MIN_WEEKS_BEFORE_RECALIBRATION).
 */
export function calculateWeightTrend(weeklyAverages: number[]): number | null {
  if (weeklyAverages.length < MIN_WEEKS_BEFORE_RECALIBRATION) {
    return null
  }
  const last = weeklyAverages[weeklyAverages.length - 1]
  const prev = weeklyAverages[weeklyAverages.length - 2]
  return Math.round((last - prev) * 100) / 100
}

/**
 * Determines what action to take based on weight change vs expected range.
 */
export function determineAction(weightChange: number, goal: TrainingGoal): RecalibrationAction {
  const range = EXPECTED_WEEKLY_CHANGE[goal]

  if (weightChange >= range.min && weightChange <= range.max) {
    return 'stay_course'
  }

  switch (goal) {
    case 'fat_loss':
      if (weightChange < range.min) return 'increase_calories' // Losing too fast
      if (weightChange > 0) return 'decrease_calories' // Gaining weight
      return 'increase_deficit' // Not losing enough

    case 'muscle_gain':
      if (weightChange > range.max) return 'reduce_surplus' // Gaining too fast
      return 'increase_calories' // Not gaining enough or losing

    case 'maintenance':
      if (weightChange > range.max) return 'decrease_calories'
      return 'increase_calories'
  }
}

/**
 * Determines how significant the deviation is from the expected range.
 */
export function determineSeverity(
  action: RecalibrationAction,
  weightChange: number,
  expectedRange: { min: number; max: number },
): RecalibrationSeverity {
  if (action === 'stay_course') return 'on_track'

  // Calculate how far outside the range the weight change is
  const rangeSpan = Math.abs(expectedRange.max - expectedRange.min)
  const nearestBound = weightChange < expectedRange.min ? expectedRange.min : expectedRange.max
  const deviation = Math.abs(weightChange - nearestBound)
  const deviationRatio = rangeSpan > 0 ? deviation / rangeSpan : 0

  if (deviationRatio >= 2.0) return 'concern'
  if (deviationRatio >= 1.0) return 'significant_adjust'
  return 'minor_adjust'
}

/**
 * Calculates the signed calorie adjustment based on action and severity.
 * Positive = add calories, negative = subtract.
 */
export function calculateCalorieAdjustment(
  action: RecalibrationAction,
  severity: RecalibrationSeverity,
): number {
  if (action === 'stay_course' || action === 'log_more' || action === 'goal_achieved') {
    return 0
  }

  let steps: number
  switch (severity) {
    case 'on_track':
      steps = 0
      break
    case 'minor_adjust':
      steps = 1
      break
    case 'significant_adjust':
      steps = 2
      break
    case 'concern':
      steps = 3
      break
  }

  const magnitude = Math.min(steps * CALORIE_ADJUSTMENT_STEP, MAX_CALORIE_ADJUSTMENT)

  // Determine sign: increase_calories is positive, everything else is negative
  const isIncrease = action === 'increase_calories'
  return isIncrease ? magnitude : -magnitude
}

/**
 * Returns the i18n key for the coach message.
 */
export function getCoachMessageKey(
  action: RecalibrationAction,
  severity: RecalibrationSeverity,
): string {
  // Simple actions have no severity variant
  if (action === 'stay_course') return 'recalibration.stay_course'
  if (action === 'log_more') return 'recalibration.log_more'
  if (action === 'goal_achieved') return 'recalibration.goal_achieved'

  return `recalibration.${action}.${severity}`
}

/**
 * Main entry point: analyze weight trend and recalibrate targets.
 */
export function recalibrate(params: {
  weeklyAverages: number[]
  adherenceRate: number
  currentCalories: number
  goal: TrainingGoal
  sex: BiologicalSex
  adjustedWeightKg: number
  actualWeightKg: number
}): RecalibrationResult {
  const {
    weeklyAverages,
    adherenceRate,
    currentCalories,
    goal,
    sex,
    adjustedWeightKg,
    actualWeightKg,
  } = params

  const expectedRange = EXPECTED_WEEKLY_CHANGE[goal]
  const expectedChange = (expectedRange.min + expectedRange.max) / 2

  // Check data quality
  if (
    adherenceRate < MIN_ADHERENCE_FOR_RECALIBRATION ||
    weeklyAverages.length < MIN_WEEKS_BEFORE_RECALIBRATION
  ) {
    return buildLogMoreResult(
      currentCalories,
      expectedChange,
      goal,
      adjustedWeightKg,
      actualWeightKg,
    )
  }

  const weightChange = calculateWeightTrend(weeklyAverages)!
  const action = determineAction(weightChange, goal)
  const severity = determineSeverity(action, weightChange, expectedRange)
  const calorieAdjustment = calculateCalorieAdjustment(action, severity)

  // Apply adjustment with floor protection
  const floor = CALORIE_FLOOR[sex]
  const newTargetCalories = Math.max(floor, currentCalories + calorieAdjustment)

  // Recalculate macros from new target
  const newProteinGrams = calculateProteinGrams(adjustedWeightKg, goal)
  const newFatGrams = calculateFatGrams(actualWeightKg, goal)
  const newCarbGrams = calculateCarbGrams(newTargetCalories, newProteinGrams, newFatGrams)

  return {
    weightChange,
    expectedChange,
    isOnTrack: action === 'stay_course',
    calorieAdjustment: newTargetCalories - currentCalories,
    newTargetCalories,
    newProteinGrams,
    newFatGrams,
    newCarbGrams,
    action,
    severity,
    coachMessageKey: getCoachMessageKey(action, severity),
  }
}

// ── Internal Helpers ────────────────────────────────────────────────

function buildLogMoreResult(
  currentCalories: number,
  expectedChange: number,
  goal: TrainingGoal,
  adjustedWeightKg: number,
  actualWeightKg: number,
): RecalibrationResult {
  const newProteinGrams = calculateProteinGrams(adjustedWeightKg, goal)
  const newFatGrams = calculateFatGrams(actualWeightKg, goal)
  const newCarbGrams = calculateCarbGrams(currentCalories, newProteinGrams, newFatGrams)

  return {
    weightChange: 0,
    expectedChange,
    isOnTrack: false,
    calorieAdjustment: 0,
    newTargetCalories: currentCalories,
    newProteinGrams,
    newFatGrams,
    newCarbGrams,
    action: 'log_more',
    severity: 'on_track',
    coachMessageKey: getCoachMessageKey('log_more', 'on_track'),
  }
}
