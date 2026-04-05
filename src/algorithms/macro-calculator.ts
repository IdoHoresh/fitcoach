/**
 * Macronutrient Calculator.
 *
 * Calculates daily protein, fat, and carb targets based on:
 * - TDEE (from tdee-calculator)
 * - Training goal
 * - Body weight
 *
 * Priority order (Helms, Muscle & Strength Pyramids):
 * 1. Protein — calculated first, based on g/kg body weight
 * 2. Fat — minimum for hormone health, based on g/kg
 * 3. Carbs — fills remaining calories
 *
 * Pure functions only — no side effects, no state.
 */

import type { NutritionTargets, TrainingGoal } from '../types';
import {
  CALORIC_ADJUSTMENTS,
  CALORIES_PER_GRAM,
  FAT_TARGETS,
  PROTEIN_TARGETS,
} from '../data/constants';

/**
 * Calculates target calories based on TDEE and training goal.
 * Uses the midpoint of the adjustment range for each goal.
 */
export function calculateTargetCalories(
  tdee: number,
  goal: TrainingGoal,
): number {
  const adjustment = CALORIC_ADJUSTMENTS[goal];
  const midpointAdjustment = (adjustment.min + adjustment.max) / 2;

  return Math.round(tdee + midpointAdjustment);
}

/**
 * Calculates daily protein target in grams.
 * Uses midpoint of the evidence-based range for the goal.
 */
export function calculateProteinGrams(
  weightKg: number,
  goal: TrainingGoal,
): number {
  const range = PROTEIN_TARGETS[goal];
  const gramsPerKg = (range.min + range.max) / 2;

  return Math.round(weightKg * gramsPerKg);
}

/**
 * Calculates daily fat target in grams.
 * Uses midpoint of the healthy range.
 */
export function calculateFatGrams(weightKg: number): number {
  const gramsPerKg = (FAT_TARGETS.MIN_PER_KG + FAT_TARGETS.MAX_PER_KG) / 2;

  return Math.round(weightKg * gramsPerKg);
}

/**
 * Calculates daily carb target in grams.
 * Carbs fill the remaining calories after protein and fat.
 */
export function calculateCarbGrams(
  targetCalories: number,
  proteinGrams: number,
  fatGrams: number,
): number {
  const proteinCalories = proteinGrams * CALORIES_PER_GRAM.PROTEIN;
  const fatCalories = fatGrams * CALORIES_PER_GRAM.FAT;
  const remainingCalories = targetCalories - proteinCalories - fatCalories;

  // Safety: carbs can't be negative (would mean caloric target is too low)
  return Math.max(0, Math.round(remainingCalories / CALORIES_PER_GRAM.CARBS));
}

/**
 * Calculates complete nutrition targets from user stats and goals.
 * This is the main entry point — combines TDEE + macros into one result.
 */
export function calculateNutritionTargets(
  bmr: number,
  tdee: number,
  weightKg: number,
  goal: TrainingGoal,
): NutritionTargets {
  const targetCalories = calculateTargetCalories(tdee, goal);
  const proteinGrams = calculateProteinGrams(weightKg, goal);
  const fatGrams = calculateFatGrams(weightKg);
  const carbGrams = calculateCarbGrams(targetCalories, proteinGrams, fatGrams);

  return {
    bmr,
    tdee,
    targetCalories,
    proteinGrams,
    fatGrams,
    carbGrams,
  };
}
