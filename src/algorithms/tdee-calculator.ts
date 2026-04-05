/**
 * TDEE (Total Daily Energy Expenditure) Calculator.
 *
 * Implements two evidence-based BMR formulas:
 * 1. Mifflin-St Jeor (1990) — when body fat % is unknown
 * 2. Katch-McArdle — when body fat % is known (more accurate for athletes)
 *
 * Pure functions only — no side effects, no state, fully testable.
 */

import type { ActivityLevel, BiologicalSex } from '../types';
import {
  ACTIVITY_MULTIPLIERS,
  BMR_COEFFICIENTS,
  BMR_SEX_OFFSET,
  KATCH_MCARDLE,
} from '../data/constants';

/**
 * Calculates BMR using the Mifflin-St Jeor equation.
 *
 * Formula:
 *   Male:   10 × weight(kg) + 6.25 × height(cm) - 5 × age - 5
 *   Female: 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
 *
 * @returns BMR in kcal/day
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
    BMR_SEX_OFFSET[sex];

  return Math.round(baseBmr);
}

/**
 * Calculates BMR using the Katch-McArdle equation.
 * More accurate when body fat % is known.
 *
 * Formula: 370 + 21.6 × lean_body_mass(kg)
 *
 * @returns BMR in kcal/day
 */
export function calculateBmrKatchMcArdle(
  weightKg: number,
  bodyFatPercent: number,
): number {
  const leanBodyMass = weightKg * (1 - bodyFatPercent / 100);
  const bmr = KATCH_MCARDLE.BASE + KATCH_MCARDLE.LBM_COEFFICIENT * leanBodyMass;

  return Math.round(bmr);
}

/**
 * Selects the best BMR formula based on available data.
 * If body fat % is known → Katch-McArdle (more accurate).
 * If not → Mifflin-St Jeor.
 *
 * @returns BMR in kcal/day
 */
export function calculateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: BiologicalSex,
  bodyFatPercent: number | null,
): number {
  if (bodyFatPercent !== null) {
    return calculateBmrKatchMcArdle(weightKg, bodyFatPercent);
  }
  return calculateBmrMifflin(weightKg, heightCm, age, sex);
}

/**
 * Calculates TDEE by multiplying BMR by activity level.
 *
 * @returns TDEE in kcal/day
 */
export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}
