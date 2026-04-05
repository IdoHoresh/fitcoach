/**
 * Workout Generator — Assembles personalized workout plans.
 *
 * Takes user profile → creates a complete weekly plan with:
 * 1. Split selection (from split-selector.ts)
 * 2. Template assignment (from split-templates.ts)
 * 3. Volume adjustment (from volume-manager.ts)
 * 4. Equipment-based exercise substitution
 *
 * This is the "orchestrator" — it doesn't contain its own logic,
 * it composes the specialized algorithms into a complete result.
 *
 * Flow:
 *   UserProfile
 *     → recommendSplitType()     → which split?
 *     → assignDayTypes()         → which days get which workout?
 *     → getTemplateForDay()      → base exercise template
 *     → adjustVolumeForWeek()    → scale sets for mesocycle week
 *     → substituteForEquipment() → swap exercises for equipment
 *     → GeneratedWorkoutPlan     → ready to display
 *
 * Pure functions only — no side effects, no state, fully testable.
 */

import type {
  DayOfWeek,
  ExperienceLevel,
  MuscleGroup,
  SplitType,
  WorkoutDayType,
  WorkoutTemplate,
} from '../types';
import type { EquipmentItem } from '../types/user';
// ExerciseWithMeta used indirectly via EXERCISE_MAP lookups
import type { WorkoutDayTemplate } from '../data/split-templates';
import { createSplitRecommendation } from './split-selector';
import type { ScheduleDay } from './split-selector';
import { calculateAllVolumeTargets } from './volume-manager';
import { getTemplateForDay } from '../data/split-templates';
import { EXERCISE_MAP, getBestExercisesForMuscle } from '../data/exercises';
import { MESOCYCLE } from '../data/constants';

// ── Output Types ───────────────────────────────────────────────────

/** A single day in the generated workout plan */
export interface GeneratedWorkoutDay {
  readonly dayOfWeek: DayOfWeek;
  readonly dayType: WorkoutDayType;
  readonly template: WorkoutTemplate | null; // null for rest days
}

/** Complete generated workout plan */
export interface GeneratedWorkoutPlan {
  readonly splitType: SplitType;
  readonly reasoning: string;
  readonly reasoningHe: string;
  readonly weeklySchedule: readonly GeneratedWorkoutDay[];
  readonly mesocycleWeek: number;
  readonly totalMesocycleWeeks: number;
}

// ── Volume Adjustment ──────────────────────────────────────────────

/**
 * Per-session set cap — prevents junk volume within a single workout.
 * Source: Israetel (RP) — beyond 8-12 direct sets per muscle per session,
 * fatigue degrades performance and stimulus quality drops.
 */
const MAX_DIRECT_SETS_PER_MUSCLE_PER_SESSION = 12;
const MIN_SETS_PER_EXERCISE = 2;

/**
 * Adjusts a template's volume based on the mesocycle week.
 *
 * Strategy:
 * - Calculate target weekly sets per muscle (from volume manager)
 * - Divide by number of sessions that hit that muscle per week
 * - Scale the template's prescribed sets proportionally
 * - Enforce per-session caps and minimums
 *
 * Example (chest, Upper/Lower, week 3 intermediate):
 *   Target weekly sets: 14
 *   Sessions hitting chest: 2 (Upper A + Upper B)
 *   Per session: 7 sets
 *   Template has 2 chest exercises → distribute ~3-4 sets each
 */
export function adjustTemplateVolume(
  template: WorkoutDayTemplate,
  weekNumber: number,
  totalWeeks: number,
  experience: ExperienceLevel,
  sessionsPerMusclePerWeek: ReadonlyMap<MuscleGroup, number>,
): WorkoutDayTemplate {
  const volumeTargets = calculateAllVolumeTargets(weekNumber, totalWeeks, experience);
  const targetMap = new Map(volumeTargets.map((v) => [v.muscleGroup, v.targetSets]));

  const adjustedExercises = template.exercises.map((prescription) => {
    const exercise = EXERCISE_MAP.get(prescription.exerciseId);
    if (!exercise) return prescription;

    const muscle = exercise.primaryMuscle;
    const weeklyTarget = targetMap.get(muscle);
    if (weeklyTarget === undefined) return prescription;

    const sessionsForMuscle = sessionsPerMusclePerWeek.get(muscle) ?? 1;
    const perSessionTarget = Math.ceil(weeklyTarget / sessionsForMuscle);

    // Count how many exercises in this template hit this muscle
    const exercisesForMuscle = template.exercises.filter((p) => {
      const ex = EXERCISE_MAP.get(p.exerciseId);
      return ex?.primaryMuscle === muscle;
    });

    // Distribute sets evenly across exercises for this muscle
    const setsPerExercise = Math.ceil(perSessionTarget / exercisesForMuscle.length);

    // Enforce bounds
    const clampedSets = Math.max(
      MIN_SETS_PER_EXERCISE,
      Math.min(setsPerExercise, MAX_DIRECT_SETS_PER_MUSCLE_PER_SESSION),
    );

    return {
      ...prescription,
      sets: clampedSets,
    };
  });

  return {
    ...template,
    exercises: adjustedExercises,
  };
}

// ── Equipment Substitution ─────────────────────────────────────────

/**
 * Substitutes exercises that require equipment the user doesn't have.
 *
 * Strategy:
 * - For each exercise, check if user has ALL required equipment items
 * - If not, find the best available alternative for the same muscle
 * - Preserves exercise order, sets, reps, rest
 * - Prefers stretch-position exercises as replacements (getBestExercisesForMuscle)
 *
 * Equipment is checklist-based:
 *   User has ['dumbbells', 'bench', 'pull_up_bar']
 *   Barbell Bench needs ['barbell', 'bench'] → missing barbell → swap to DB press
 *   Push-up needs ['none'] → always available
 */
export function substituteForEquipment(
  template: WorkoutDayTemplate,
  userEquipment: readonly EquipmentItem[],
): WorkoutDayTemplate {
  const usedExerciseIds = new Set<string>();

  const adjustedExercises = template.exercises.map((prescription) => {
    const exercise = EXERCISE_MAP.get(prescription.exerciseId);
    if (!exercise) return prescription;

    // Check if user has ALL required equipment for this exercise
    const canPerform = exercise.requiredEquipment.every(
      (item) => item === 'none' || userEquipment.includes(item),
    );

    if (canPerform && !usedExerciseIds.has(exercise.id)) {
      usedExerciseIds.add(exercise.id);
      return prescription;
    }

    // Need to substitute — find best alternative the user CAN do
    const alternatives = getBestExercisesForMuscle(exercise.primaryMuscle, userEquipment);
    const replacement = alternatives.find(
      (alt) => !usedExerciseIds.has(alt.id) && alt.id !== exercise.id,
    );

    if (replacement) {
      usedExerciseIds.add(replacement.id);
      return {
        ...prescription,
        exerciseId: replacement.id,
      };
    }

    // No alternative found — keep original (shouldn't happen with good exercise DB)
    usedExerciseIds.add(exercise.id);
    return prescription;
  });

  return {
    ...template,
    exercises: adjustedExercises,
  };
}

// ── Sessions-Per-Muscle Counter ────────────────────────────────────

/**
 * Counts how many sessions per week hit each muscle group.
 * Used by volume adjustment to split weekly targets across sessions.
 *
 * Example (Upper/Lower):
 *   chest → 2 sessions (Upper A + Upper B)
 *   quads → 2 sessions (Lower A + Lower B)
 */
export function countSessionsPerMuscle(
  schedule: readonly ScheduleDay[],
): ReadonlyMap<MuscleGroup, number> {
  const counts = new Map<MuscleGroup, number>();

  for (const day of schedule) {
    const template = getTemplateForDay(day.dayType);
    if (!template) continue; // Rest day

    // Track which muscles are hit in this session (avoid double-counting)
    const musclesInSession = new Set<MuscleGroup>();

    for (const prescription of template.exercises) {
      const exercise = EXERCISE_MAP.get(prescription.exerciseId);
      if (!exercise) continue;

      musclesInSession.add(exercise.primaryMuscle);
    }

    for (const muscle of musclesInSession) {
      counts.set(muscle, (counts.get(muscle) ?? 0) + 1);
    }
  }

  return counts;
}

// ── Main Entry Point ───────────────────────────────────────────────

/**
 * Generates a complete personalized workout plan.
 *
 * This is the main function — takes the user's profile data and returns
 * a fully built weekly workout plan with adjusted volume and exercises.
 *
 * @param trainingDays - Which days of the week the user trains (e.g., [0, 1, 3, 4])
 * @param experience - Beginner or intermediate
 * @param userEquipment - List of equipment items the user has available
 * @param mesocycleWeek - Current week in the mesocycle (1-based, default 1)
 * @param totalMesocycleWeeks - Total mesocycle length (default from constants)
 *
 * @returns Complete workout plan ready for display and logging
 */
export function generateWorkoutPlan(
  trainingDays: readonly DayOfWeek[],
  experience: ExperienceLevel,
  userEquipment: readonly EquipmentItem[],
  mesocycleWeek: number = 1,
  totalMesocycleWeeks: number = MESOCYCLE.DEFAULT_WEEKS,
): GeneratedWorkoutPlan {
  // Step 1: Determine split and schedule
  const recommendation = createSplitRecommendation(trainingDays, experience);

  // Step 2: Count sessions per muscle (for volume distribution)
  const sessionsPerMuscle = countSessionsPerMuscle(recommendation.schedule);

  // Step 3: Build each workout day
  const weeklySchedule: GeneratedWorkoutDay[] = buildFullWeekSchedule(
    recommendation.schedule,
    experience,
    userEquipment,
    mesocycleWeek,
    totalMesocycleWeeks,
    sessionsPerMuscle,
  );

  return {
    splitType: recommendation.splitType,
    reasoning: recommendation.reasoning,
    reasoningHe: recommendation.reasoningHe,
    weeklySchedule,
    mesocycleWeek,
    totalMesocycleWeeks,
  };
}

/**
 * Builds the full 7-day schedule with rest days filled in.
 * Training days get full workout templates; other days are rest.
 */
function buildFullWeekSchedule(
  trainingSchedule: readonly ScheduleDay[],
  experience: ExperienceLevel,
  userEquipment: readonly EquipmentItem[],
  mesocycleWeek: number,
  totalMesocycleWeeks: number,
  sessionsPerMuscle: ReadonlyMap<MuscleGroup, number>,
): GeneratedWorkoutDay[] {
  const DAYS_PER_WEEK = 7;

  // Create a map of dayOfWeek → scheduleDay for quick lookup
  const trainingDayMap = new Map<DayOfWeek, ScheduleDay>(
    trainingSchedule.map((day) => [day.dayOfWeek, day]),
  );

  const fullWeek: GeneratedWorkoutDay[] = [];

  for (let d = 0; d < DAYS_PER_WEEK; d++) {
    const dayOfWeek = d as DayOfWeek;
    const trainingDay = trainingDayMap.get(dayOfWeek);

    if (!trainingDay) {
      // Rest day
      fullWeek.push({
        dayOfWeek,
        dayType: 'rest',
        template: null,
      });
      continue;
    }

    // Training day — get base template, adjust volume, substitute equipment
    const baseTemplate = getTemplateForDay(trainingDay.dayType);

    if (!baseTemplate) {
      fullWeek.push({
        dayOfWeek,
        dayType: trainingDay.dayType,
        template: null,
      });
      continue;
    }

    // Adjust volume for current mesocycle week
    const volumeAdjusted = adjustTemplateVolume(
      baseTemplate,
      mesocycleWeek,
      totalMesocycleWeeks,
      experience,
      sessionsPerMuscle,
    );

    // Substitute exercises for user's available equipment
    const equipmentAdjusted = substituteForEquipment(volumeAdjusted, userEquipment);

    // Convert to WorkoutTemplate format
    const template: WorkoutTemplate = {
      id: `gen_${trainingDay.dayType}_w${mesocycleWeek}`,
      dayType: trainingDay.dayType,
      splitType: getSplitTypeFromDayType(trainingDay.dayType),
      nameEn: equipmentAdjusted.nameEn,
      nameHe: equipmentAdjusted.nameHe,
      exercises: equipmentAdjusted.exercises,
      estimatedMinutes: estimateWorkoutDuration(equipmentAdjusted),
    };

    fullWeek.push({
      dayOfWeek,
      dayType: trainingDay.dayType,
      template,
    });
  }

  return fullWeek;
}

// ── Helper Functions ───────────────────────────────────────────────

/** Derives split type from day type string */
function getSplitTypeFromDayType(dayType: WorkoutDayType): SplitType {
  if (dayType.startsWith('full_body')) return 'full_body';
  if (dayType.startsWith('upper') || dayType.startsWith('lower')) return 'upper_lower';
  return 'push_pull_legs';
}

/**
 * Estimates workout duration based on exercises, sets, and rest periods.
 *
 * Formula:
 *   duration = Σ (sets × (set_time + rest_time))
 *
 * Assumes ~40 seconds per working set (average across compounds and isolation).
 */
function estimateWorkoutDuration(template: WorkoutDayTemplate): number {
  const SECONDS_PER_SET = 40;
  const WARMUP_OVERHEAD_MINUTES = 5; // General warmup + setup

  let totalSeconds = 0;

  for (const prescription of template.exercises) {
    const setTime = SECONDS_PER_SET + prescription.restSeconds;
    totalSeconds += prescription.sets * setTime;
  }

  return Math.round(totalSeconds / 60) + WARMUP_OVERHEAD_MINUTES;
}

// ── Summary Helpers (for UI) ───────────────────────────────────────

/** Calculates weekly volume per muscle group from a generated plan */
export function calculatePlanWeeklyVolume(
  plan: GeneratedWorkoutPlan,
): ReadonlyMap<MuscleGroup, number> {
  const volumes = new Map<MuscleGroup, number>();

  for (const day of plan.weeklySchedule) {
    if (!day.template) continue;

    for (const prescription of day.template.exercises) {
      const exercise = EXERCISE_MAP.get(prescription.exerciseId);
      if (!exercise) continue;

      const current = volumes.get(exercise.primaryMuscle) ?? 0;
      volumes.set(exercise.primaryMuscle, current + prescription.sets);
    }
  }

  return volumes;
}

/** Gets a human-readable summary of the plan */
export function getPlanSummary(plan: GeneratedWorkoutPlan): {
  readonly trainingDaysCount: number;
  readonly restDaysCount: number;
  readonly totalWeeklySets: number;
  readonly estimatedWeeklyMinutes: number;
} {
  const trainingDays = plan.weeklySchedule.filter((d) => d.template !== null);
  const restDays = plan.weeklySchedule.filter((d) => d.template === null);

  let totalSets = 0;
  let totalMinutes = 0;

  for (const day of trainingDays) {
    if (!day.template) continue;
    totalMinutes += day.template.estimatedMinutes;
    for (const ex of day.template.exercises) {
      totalSets += ex.sets;
    }
  }

  return {
    trainingDaysCount: trainingDays.length,
    restDaysCount: restDays.length,
    totalWeeklySets: totalSets,
    estimatedWeeklyMinutes: totalMinutes,
  };
}
