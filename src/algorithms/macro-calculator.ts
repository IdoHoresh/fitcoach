/**
 * Macronutrient Calculator.
 *
 * Follows the universal evidence-based approach used by every top pro:
 *   1. Set CALORIES (from TDEE ± goal adjustment)
 *   2. Set PROTEIN first (g/kg of adjusted body weight)
 *   3. Set FAT second (g/kg of actual body weight, with hard floor)
 *   4. CARBS = remaining calories (with minimum floor)
 *
 * This order is NOT arbitrary — it's the consensus from:
 * RP (Israetel), MacroFactor (Nuckols), 3DMJ (Helms), Carbon (Norton),
 * Aragon, McDonald, Nippard. Nobody uses percentage-based splits.
 *
 * Key decisions:
 * - Protein uses ADJUSTED body weight (overweight people don't need 250g+)
 * - Fat uses ACTUAL body weight but goal-specific ranges
 * - Carbs get whatever's left (min 100g for thyroid/performance)
 * - If carbs would drop below minimum, fat is reduced toward hard floor
 *
 * Pure functions only — no side effects, no state.
 */

import type { NutritionTargets, TrainingGoal } from '../types'
import {
  CALORIC_ADJUSTMENTS,
  CALORIES_PER_GRAM,
  CARB_MINIMUM_GRAMS,
  FAT_HARD_FLOOR_PER_KG,
  FAT_TARGETS,
  PROTEIN_TARGETS,
  PROTEIN_WEIGHT_ADJUSTMENT,
} from '../data/constants'

// ── Adjusted Body Weight ────────────────────────────────────────────

/**
 * Calculates adjusted body weight for protein targets.
 *
 * If body fat % is known → use lean mass × 1.1 (small buffer)
 * If unknown → BMI-based:
 *   BMI ≤ 25: use actual weight
 *   BMI > 25: ideal_weight + 0.4 × (actual - ideal)
 *
 * Matches Helms' formula (ideal + 0.25-0.5 × excess).
 *
 * Example (you: 189cm, 113kg):
 *   BMI = 31.6 → above 25
 *   Ideal weight at BMI 25 = 25 × 1.89² = 89.3 kg
 *   Adjusted = 89.3 + 0.4 × (113 - 89.3) = 98.8 kg
 */
export function calculateAdjustedWeight(
  weightKg: number,
  heightCm: number,
  bodyFatPercent: number | null,
): number {
  if (bodyFatPercent !== null) {
    const leanMass = weightKg * (1 - bodyFatPercent / 100)
    return leanMass * 1.1
  }

  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)

  if (bmi <= PROTEIN_WEIGHT_ADJUSTMENT.BMI_THRESHOLD) {
    return weightKg
  }

  const idealWeight = PROTEIN_WEIGHT_ADJUSTMENT.BMI_THRESHOLD * heightM * heightM
  const excessWeight = weightKg - idealWeight
  return idealWeight + PROTEIN_WEIGHT_ADJUSTMENT.ADJUSTMENT_FACTOR * excessWeight
}

// ── Individual Macro Calculations ───────────────────────────────────

/**
 * Calculates target calories based on TDEE and training goal.
 */
export function calculateTargetCalories(tdee: number, goal: TrainingGoal): number {
  const adjustment = CALORIC_ADJUSTMENTS[goal]
  const midpointAdjustment = (adjustment.min + adjustment.max) / 2
  return Math.round(tdee + midpointAdjustment)
}

/**
 * Step 2: Protein — calculated FIRST (non-negotiable).
 * Uses ADJUSTED body weight × goal-specific g/kg.
 */
export function calculateProteinGrams(adjustedWeightKg: number, goal: TrainingGoal): number {
  const range = PROTEIN_TARGETS[goal]
  const gramsPerKg = (range.min + range.max) / 2
  return Math.round(adjustedWeightKg * gramsPerKg)
}

/**
 * Step 3: Fat — calculated SECOND.
 * Uses ACTUAL body weight × goal-specific g/kg range.
 * Will be reduced toward hard floor if carbs would be too low.
 */
export function calculateFatGrams(actualWeightKg: number, goal: TrainingGoal): number {
  const range = FAT_TARGETS[goal]
  const gramsPerKg = (range.min + range.max) / 2
  return Math.round(actualWeightKg * gramsPerKg)
}

/**
 * Step 4: Carbs — fills remaining calories.
 */
export function calculateCarbGrams(
  targetCalories: number,
  proteinGrams: number,
  fatGrams: number,
): number {
  const proteinCalories = proteinGrams * CALORIES_PER_GRAM.PROTEIN
  const fatCalories = fatGrams * CALORIES_PER_GRAM.FAT
  const remainingCalories = targetCalories - proteinCalories - fatCalories
  return Math.max(0, Math.round(remainingCalories / CALORIES_PER_GRAM.CARBS))
}

// ── Main Entry Point ────────────────────────────────────────────────

/**
 * Calculates complete nutrition targets with the pro-consensus approach.
 *
 * Includes carb floor protection:
 * If carbs < 100g → reduce fat toward hard floor (0.5 g/kg) to free up calories.
 * If still < 100g after fat reduction → accept it (very aggressive cut).
 */
export function calculateNutritionTargets(
  bmr: number,
  tdee: number,
  weightKg: number,
  heightCm: number,
  bodyFatPercent: number | null,
  goal: TrainingGoal,
): NutritionTargets {
  const targetCalories = calculateTargetCalories(tdee, goal)
  const adjustedWeight = calculateAdjustedWeight(weightKg, heightCm, bodyFatPercent)

  // Step 2: Protein first (non-negotiable)
  const proteinGrams = calculateProteinGrams(adjustedWeight, goal)

  // Step 3: Fat second (initial target)
  let fatGrams = calculateFatGrams(weightKg, goal)

  // Step 4: Carbs = remainder
  let carbGrams = calculateCarbGrams(targetCalories, proteinGrams, fatGrams)

  // Carb floor protection: if carbs too low, reduce fat
  if (carbGrams < CARB_MINIMUM_GRAMS) {
    const hardFloorFat = Math.round(weightKg * FAT_HARD_FLOOR_PER_KG)
    fatGrams = Math.max(hardFloorFat, fatGrams)

    // Try reducing fat gradually toward floor
    while (carbGrams < CARB_MINIMUM_GRAMS && fatGrams > hardFloorFat) {
      fatGrams -= 1
      carbGrams = calculateCarbGrams(targetCalories, proteinGrams, fatGrams)
    }
  }

  return {
    bmr,
    tdee,
    targetCalories,
    proteinGrams,
    fatGrams,
    carbGrams,
  }
}
