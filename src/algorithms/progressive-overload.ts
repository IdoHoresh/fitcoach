/**
 * Progressive Overload Algorithm — Double Progression.
 *
 * The core progression model:
 * 1. User has a rep range target (e.g., 3×8-12)
 * 2. When ALL sets hit the TOP of the range → increase weight
 * 3. Weight increase depends on muscle group size
 * 4. If performance declines for consecutive sessions → suggest deload
 *
 * Sources: Helms (Muscle & Strength Pyramids), ACSM Position Stand
 * Pure functions only.
 */

import type { LoggedSet, MuscleGroup, ProgressionAdvice } from '../types';
import { MESOCYCLE, WEIGHT_INCREMENT } from '../data/constants';

/** Muscles classified as "small" for smaller weight increments */
const SMALL_UPPER_MUSCLES: ReadonlySet<MuscleGroup> = new Set([
  'biceps', 'triceps', 'shoulders',
]);

const SMALL_LOWER_MUSCLES: ReadonlySet<MuscleGroup> = new Set([
  'calves',
]);

const UPPER_MUSCLES: ReadonlySet<MuscleGroup> = new Set([
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
]);

/**
 * Determines the appropriate weight increment for a muscle group.
 * Smaller muscles get smaller increments to avoid overloading.
 */
export function getWeightIncrement(primaryMuscle: MuscleGroup): number {
  if (SMALL_UPPER_MUSCLES.has(primaryMuscle)) {
    return WEIGHT_INCREMENT.SMALL_MUSCLE_UPPER;
  }
  if (SMALL_LOWER_MUSCLES.has(primaryMuscle)) {
    return WEIGHT_INCREMENT.SMALL_MUSCLE_LOWER;
  }
  if (UPPER_MUSCLES.has(primaryMuscle)) {
    return WEIGHT_INCREMENT.UPPER_BODY;
  }
  return WEIGHT_INCREMENT.LOWER_BODY;
}

/**
 * Checks if all working sets hit the top of the prescribed rep range.
 * Warm-up sets are excluded from the check.
 */
export function allSetsAtTopOfRange(
  sets: readonly LoggedSet[],
  maxReps: number,
): boolean {
  const workingSets = sets.filter((s) => !s.isWarmup);

  if (workingSets.length === 0) return false;

  return workingSets.every((s) => s.reps >= maxReps);
}

/**
 * Checks if performance has declined (reps dropped below minimum range).
 */
export function hasPerfDeclined(
  sets: readonly LoggedSet[],
  minReps: number,
): boolean {
  const workingSets = sets.filter((s) => !s.isWarmup);

  if (workingSets.length === 0) return false;

  // If more than half of working sets are below min range, performance has declined
  const belowMin = workingSets.filter((s) => s.reps < minReps).length;
  return belowMin > workingSets.length / 2;
}

/**
 * Generates progression advice for an exercise based on recent performance.
 *
 * @param currentWeightKg - The weight used in the most recent session
 * @param recentSets - Sets from the most recent session
 * @param _minReps - Bottom of the prescribed rep range (reserved for future use)
 * @param maxReps - Top of the prescribed rep range
 * @param primaryMuscle - Primary muscle for weight increment calculation
 * @param consecutiveDeclines - Number of sessions with declining performance
 */
export function getProgressionAdvice(
  currentWeightKg: number,
  recentSets: readonly LoggedSet[],
  _minReps: number,
  maxReps: number,
  primaryMuscle: MuscleGroup,
  consecutiveDeclines: number,
): ProgressionAdvice {
  const exerciseId = ''; // Caller sets this

  // Priority 1: Check for deload trigger
  if (consecutiveDeclines >= MESOCYCLE.DECLINE_THRESHOLD) {
    const deloadWeight = Math.round(
      currentWeightKg * (1 - MESOCYCLE.DELOAD_WEIGHT_REDUCTION) * 2
    ) / 2; // Round to nearest 0.5kg

    return {
      exerciseId,
      action: 'deload',
      suggestedWeightKg: deloadWeight,
      reason: `Performance declined ${consecutiveDeclines} sessions in a row. Time for a deload week — reduce weight and volume.`,
      reasonHe: `הביצועים ירדו ${consecutiveDeclines} אימונים ברצף. הגיע הזמן לשבוע דילואד — הורדת משקל ונפח.`,
    };
  }

  // Priority 2: Check if ready to increase weight
  if (allSetsAtTopOfRange(recentSets, maxReps)) {
    const increment = getWeightIncrement(primaryMuscle);
    const newWeight = currentWeightKg + increment;

    return {
      exerciseId,
      action: 'increase_weight',
      suggestedWeightKg: newWeight,
      reason: `All sets hit ${maxReps} reps! Increase weight by ${increment}kg to ${newWeight}kg.`,
      reasonHe: `כל הסטים הגיעו ל-${maxReps} חזרות! העלה משקל ב-${increment} ק"ג ל-${newWeight} ק"ג.`,
    };
  }

  // Priority 3: Stay at current weight and build reps
  return {
    exerciseId,
    action: 'stay',
    suggestedWeightKg: currentWeightKg,
    reason: `Keep working at ${currentWeightKg}kg. Aim to hit ${maxReps} reps on all sets.`,
    reasonHe: `המשך לעבוד עם ${currentWeightKg} ק"ג. נסה להגיע ל-${maxReps} חזרות בכל הסטים.`,
  };
}
