/**
 * Workout Split Templates — 13 science-backed workout day blueprints.
 *
 * Each template defines the exercises, sets, reps, rest, and order for one
 * workout day. Templates come in A/B pairs to provide exercise variation
 * within the same week (Helms: 2+ exercises per muscle per week).
 *
 * Templates are split-agnostic — they define the CONTENT of a workout day,
 * and the workout generator assigns them to days based on the user's split.
 *
 * Design decisions:
 * - Compound exercises come first (Simão 2012: order affects performance)
 * - Stretch-position exercises are the default choice (Maeo 2023, Pedrosa 2023)
 * - Pull volume ≥ Push volume (shoulder health — Norton, Nippard)
 * - Sets shown are STARTING volume (MEV) — volume manager increases weekly
 * - Per-session cap: 8-12 direct sets per muscle (Israetel's junk volume concept)
 *
 * Split structures:
 * - Full Body (×3): A, B, C — each session hits every muscle group
 * - Upper/Lower (×4): UA, LA, UB, LB — alternating upper and lower
 * - PPL (×6): Push A/B, Pull A/B, Legs A/B — body part focus
 *
 * Sources: RP Strength, 3DMJ, Jeff Nippard, Layne Norton, Lyle McDonald
 */

import type { ExercisePrescription, WorkoutDayType } from '../types'
import { REST_PERIODS, REP_RANGES } from './constants'
import {
  // Chest
  BARBELL_BENCH_PRESS,
  INCLINE_DUMBBELL_PRESS,
  DUMBBELL_BENCH_PRESS,
  DUMBBELL_FLY,
  CABLE_CROSSOVER,
  MACHINE_CHEST_PRESS,
  // Back
  BARBELL_ROW,
  SEATED_CABLE_ROW,
  LAT_PULLDOWN,
  PULL_UP,
  CABLE_PULLOVER,
  CHEST_SUPPORTED_ROW,
  // Shoulders
  OVERHEAD_PRESS,
  DUMBBELL_SHOULDER_PRESS,
  DUMBBELL_LATERAL_RAISE,
  CABLE_LATERAL_RAISE,
  CABLE_REAR_DELT_FLY,
  FACE_PULL,
  // Biceps
  INCLINE_DUMBBELL_CURL,
  BARBELL_CURL,
  HAMMER_CURL,
  CABLE_CURL,
  // Triceps
  OVERHEAD_TRICEP_EXTENSION,
  SKULL_CRUSHER,
  // Quads
  BARBELL_BACK_SQUAT,
  LEG_PRESS,
  BULGARIAN_SPLIT_SQUAT,
  LEG_EXTENSION,
  WALKING_LUNGE,
  HACK_SQUAT,
  // Hamstrings
  ROMANIAN_DEADLIFT,
  SEATED_LEG_CURL,
  LYING_LEG_CURL,
  // Glutes
  HIP_THRUST,
  CABLE_PULL_THROUGH,
  // Calves
  STANDING_CALF_RAISE,
  SEATED_CALF_RAISE,
  // Abs
  CABLE_CRUNCH,
  HANGING_LEG_RAISE,
  AB_WHEEL_ROLLOUT,
} from './exercises'

// ── Helper ─────────────────────────────────────────────────────────

/** Creates an exercise prescription with explicit order */
function rx(
  exercise: { id: string },
  sets: number,
  minReps: number,
  maxReps: number,
  restSeconds: number,
  order: number,
): ExercisePrescription {
  return {
    exerciseId: exercise.id,
    sets,
    minReps,
    maxReps,
    restSeconds,
    order,
  }
}

// ── Template Interface ─────────────────────────────────────────────

export interface WorkoutDayTemplate {
  readonly dayType: WorkoutDayType
  readonly nameEn: string
  readonly nameHe: string
  readonly exercises: readonly ExercisePrescription[]
  readonly estimatedMinutes: number
}

// ═══════════════════════════════════════════════════════════════════
// FULL BODY TEMPLATES (3 days/week)
// Each session hits all major muscle groups.
// Volume is lower per muscle per session, but frequency is 3×/week.
// ═══════════════════════════════════════════════════════════════════

const FULL_BODY_A: WorkoutDayTemplate = {
  dayType: 'full_body_a',
  nameEn: 'Full Body A — Squat Focus',
  nameHe: 'פול בודי A — דגש סקוואט',
  estimatedMinutes: 70,
  exercises: [
    // Quad compound (primary lower)
    rx(
      BARBELL_BACK_SQUAT,
      3,
      REP_RANGES.COMPOUND_PRIMARY.min,
      REP_RANGES.COMPOUND_PRIMARY.max,
      REST_PERIODS.COMPOUND_HEAVY,
      1,
    ),
    // Horizontal push (chest)
    rx(
      BARBELL_BENCH_PRESS,
      3,
      REP_RANGES.COMPOUND_PRIMARY.min,
      REP_RANGES.COMPOUND_PRIMARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      2,
    ),
    // Horizontal pull (back)
    rx(
      BARBELL_ROW,
      3,
      REP_RANGES.COMPOUND_PRIMARY.min,
      REP_RANGES.COMPOUND_PRIMARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      3,
    ),
    // Hamstring (stretch position)
    rx(
      SEATED_LEG_CURL,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION,
      4,
    ),
    // Shoulder isolation (side delt)
    rx(
      DUMBBELL_LATERAL_RAISE,
      2,
      REP_RANGES.ENDURANCE.min,
      REP_RANGES.ENDURANCE.max,
      REST_PERIODS.ISOLATION_LIGHT,
      5,
    ),
    // Bicep (stretch position)
    rx(
      INCLINE_DUMBBELL_CURL,
      2,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      6,
    ),
    // Tricep (stretch position)
    rx(
      OVERHEAD_TRICEP_EXTENSION,
      2,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      7,
    ),
  ],
}

const FULL_BODY_B: WorkoutDayTemplate = {
  dayType: 'full_body_b',
  nameEn: 'Full Body B — Hinge Focus',
  nameHe: "פול בודי B — דגש הינג'",
  estimatedMinutes: 70,
  exercises: [
    // Hip hinge (hamstrings + glutes)
    rx(
      ROMANIAN_DEADLIFT,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_HEAVY,
      1,
    ),
    // Vertical push (shoulders)
    rx(
      OVERHEAD_PRESS,
      3,
      REP_RANGES.COMPOUND_PRIMARY.min,
      REP_RANGES.COMPOUND_PRIMARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      2,
    ),
    // Vertical pull (back width)
    rx(
      LAT_PULLDOWN,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      3,
    ),
    // Chest (stretch position)
    rx(
      DUMBBELL_FLY,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION,
      4,
    ),
    // Quad isolation
    rx(
      LEG_EXTENSION,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION,
      5,
    ),
    // Rear delt (shoulder health)
    rx(
      FACE_PULL,
      2,
      REP_RANGES.ENDURANCE.min,
      REP_RANGES.ENDURANCE.max,
      REST_PERIODS.ISOLATION_LIGHT,
      6,
    ),
    // Calves
    rx(
      STANDING_CALF_RAISE,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      7,
    ),
  ],
}

const FULL_BODY_C: WorkoutDayTemplate = {
  dayType: 'full_body_c',
  nameEn: 'Full Body C — Upper Emphasis',
  nameHe: 'פול בודי C — דגש עליון',
  estimatedMinutes: 70,
  exercises: [
    // Chest (variation)
    rx(
      INCLINE_DUMBBELL_PRESS,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      1,
    ),
    // Back (variation)
    rx(
      SEATED_CABLE_ROW,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      2,
    ),
    // Quad (unilateral)
    rx(
      BULGARIAN_SPLIT_SQUAT,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_LIGHT,
      3,
    ),
    // Glute (direct)
    rx(
      HIP_THRUST,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_LIGHT,
      4,
    ),
    // Shoulder isolation (side delt variation)
    rx(
      CABLE_LATERAL_RAISE,
      2,
      REP_RANGES.ENDURANCE.min,
      REP_RANGES.ENDURANCE.max,
      REST_PERIODS.ISOLATION_LIGHT,
      5,
    ),
    // Hammer curl (brachialis + long head)
    rx(
      HAMMER_CURL,
      2,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      6,
    ),
    // Abs
    rx(
      HANGING_LEG_RAISE,
      2,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      7,
    ),
  ],
}

// ═══════════════════════════════════════════════════════════════════
// UPPER / LOWER TEMPLATES (4 days/week)
// Each muscle hit 2×/week. More volume per muscle per session than FB.
// ═══════════════════════════════════════════════════════════════════

const UPPER_A: WorkoutDayTemplate = {
  dayType: 'upper_a',
  nameEn: 'Upper A — Horizontal Focus',
  nameHe: 'עליון A — דגש אופקי',
  estimatedMinutes: 75,
  exercises: [
    // Horizontal push (main chest compound)
    rx(
      BARBELL_BENCH_PRESS,
      4,
      REP_RANGES.COMPOUND_PRIMARY.min,
      REP_RANGES.COMPOUND_PRIMARY.max,
      REST_PERIODS.COMPOUND_HEAVY,
      1,
    ),
    // Horizontal pull (main back compound)
    rx(
      BARBELL_ROW,
      4,
      REP_RANGES.COMPOUND_PRIMARY.min,
      REP_RANGES.COMPOUND_PRIMARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      2,
    ),
    // Vertical push (shoulders)
    rx(
      OVERHEAD_PRESS,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      3,
    ),
    // Vertical pull (back width)
    rx(
      LAT_PULLDOWN,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      4,
    ),
    // Bicep (stretch position — long head)
    rx(
      INCLINE_DUMBBELL_CURL,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      5,
    ),
    // Tricep (stretch position — long head)
    rx(
      OVERHEAD_TRICEP_EXTENSION,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      6,
    ),
    // Side delt (high reps, low rest)
    rx(
      DUMBBELL_LATERAL_RAISE,
      3,
      REP_RANGES.ENDURANCE.min,
      REP_RANGES.ENDURANCE.max,
      REST_PERIODS.ISOLATION_LIGHT,
      7,
    ),
  ],
}

const UPPER_B: WorkoutDayTemplate = {
  dayType: 'upper_b',
  nameEn: 'Upper B — Vertical Focus',
  nameHe: 'עליון B — דגש אנכי',
  estimatedMinutes: 75,
  exercises: [
    // Vertical pull (bodyweight — different stimulus)
    rx(
      PULL_UP,
      3,
      REP_RANGES.COMPOUND_PRIMARY.min,
      REP_RANGES.COMPOUND_PRIMARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      1,
    ),
    // Incline push (upper chest variation)
    rx(
      INCLINE_DUMBBELL_PRESS,
      4,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      2,
    ),
    // Horizontal pull (variation)
    rx(
      SEATED_CABLE_ROW,
      4,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      3,
    ),
    // Vertical push (DB variation — more ROM)
    rx(
      DUMBBELL_SHOULDER_PRESS,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      4,
    ),
    // Bicep (variation — brachialis)
    rx(
      HAMMER_CURL,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      5,
    ),
    // Tricep (variation — skull crusher = stretch position)
    rx(
      SKULL_CRUSHER,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      6,
    ),
    // Rear delt (shoulder health — pull ≥ push)
    rx(
      CABLE_REAR_DELT_FLY,
      3,
      REP_RANGES.ENDURANCE.min,
      REP_RANGES.ENDURANCE.max,
      REST_PERIODS.ISOLATION_LIGHT,
      7,
    ),
  ],
}

const LOWER_A: WorkoutDayTemplate = {
  dayType: 'lower_a',
  nameEn: 'Lower A — Squat Focus',
  nameHe: 'תחתון A — דגש סקוואט',
  estimatedMinutes: 65,
  exercises: [
    // Main quad compound
    rx(
      BARBELL_BACK_SQUAT,
      4,
      REP_RANGES.COMPOUND_PRIMARY.min,
      REP_RANGES.COMPOUND_PRIMARY.max,
      REST_PERIODS.COMPOUND_HEAVY,
      1,
    ),
    // Hamstring (stretch position — seated > lying)
    rx(
      SEATED_LEG_CURL,
      4,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION,
      2,
    ),
    // Unilateral quad (fixes imbalances)
    rx(
      BULGARIAN_SPLIT_SQUAT,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_LIGHT,
      3,
    ),
    // Direct glute work
    rx(
      HIP_THRUST,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_LIGHT,
      4,
    ),
    // Calves (straight leg = gastrocnemius stretch)
    rx(
      STANDING_CALF_RAISE,
      4,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      5,
    ),
  ],
}

const LOWER_B: WorkoutDayTemplate = {
  dayType: 'lower_b',
  nameEn: 'Lower B — Hinge Focus',
  nameHe: "תחתון B — דגש הינג'",
  estimatedMinutes: 65,
  exercises: [
    // Main hip hinge (hamstrings + glutes stretch position)
    rx(
      ROMANIAN_DEADLIFT,
      4,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_HEAVY,
      1,
    ),
    // Quad compound (machine variation)
    rx(
      LEG_PRESS,
      4,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      2,
    ),
    // Quad isolation
    rx(
      LEG_EXTENSION,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION,
      3,
    ),
    // Unilateral (lunge variation)
    rx(
      WALKING_LUNGE,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_LIGHT,
      4,
    ),
    // Calves (bent knee = soleus)
    rx(
      SEATED_CALF_RAISE,
      4,
      REP_RANGES.ENDURANCE.min,
      REP_RANGES.ENDURANCE.max,
      REST_PERIODS.ISOLATION_LIGHT,
      5,
    ),
  ],
}

// ═══════════════════════════════════════════════════════════════════
// PUSH / PULL / LEGS TEMPLATES (5-6 days/week)
// Most volume per muscle per session. Each session is dedicated.
// ═══════════════════════════════════════════════════════════════════

const PUSH_A: WorkoutDayTemplate = {
  dayType: 'push_a',
  nameEn: 'Push A — Flat Bench Focus',
  nameHe: 'דחיפה A — דגש לחיצה שטוחה',
  estimatedMinutes: 65,
  exercises: [
    // Main chest compound
    rx(
      BARBELL_BENCH_PRESS,
      4,
      REP_RANGES.COMPOUND_PRIMARY.min,
      REP_RANGES.COMPOUND_PRIMARY.max,
      REST_PERIODS.COMPOUND_HEAVY,
      1,
    ),
    // Shoulder compound
    rx(
      DUMBBELL_SHOULDER_PRESS,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      2,
    ),
    // Incline chest (stretch position, upper pec)
    rx(
      INCLINE_DUMBBELL_PRESS,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      3,
    ),
    // Side delt isolation
    rx(
      CABLE_LATERAL_RAISE,
      3,
      REP_RANGES.ENDURANCE.min,
      REP_RANGES.ENDURANCE.max,
      REST_PERIODS.ISOLATION_LIGHT,
      4,
    ),
    // Tricep (stretch position — overhead)
    rx(
      OVERHEAD_TRICEP_EXTENSION,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      5,
    ),
    // Chest isolation (stretch)
    rx(
      DUMBBELL_FLY,
      2,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION,
      6,
    ),
  ],
}

const PUSH_B: WorkoutDayTemplate = {
  dayType: 'push_b',
  nameEn: 'Push B — Overhead Focus',
  nameHe: 'דחיפה B — דגש כתפיים',
  estimatedMinutes: 65,
  exercises: [
    // Main shoulder compound
    rx(
      OVERHEAD_PRESS,
      4,
      REP_RANGES.COMPOUND_PRIMARY.min,
      REP_RANGES.COMPOUND_PRIMARY.max,
      REST_PERIODS.COMPOUND_HEAVY,
      1,
    ),
    // Chest (machine for variation)
    rx(
      MACHINE_CHEST_PRESS,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      2,
    ),
    // Incline chest (stretch position)
    rx(
      DUMBBELL_BENCH_PRESS,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      3,
    ),
    // Side delt (DB variation)
    rx(
      DUMBBELL_LATERAL_RAISE,
      3,
      REP_RANGES.ENDURANCE.min,
      REP_RANGES.ENDURANCE.max,
      REST_PERIODS.ISOLATION_LIGHT,
      4,
    ),
    // Tricep (skull crusher — stretch position variation)
    rx(
      SKULL_CRUSHER,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      5,
    ),
    // Chest isolation
    rx(
      CABLE_CROSSOVER,
      2,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION,
      6,
    ),
  ],
}

const PULL_A: WorkoutDayTemplate = {
  dayType: 'pull_a',
  nameEn: 'Pull A — Row Focus',
  nameHe: 'משיכה A — דגש חתירה',
  estimatedMinutes: 65,
  exercises: [
    // Main horizontal pull
    rx(
      BARBELL_ROW,
      4,
      REP_RANGES.COMPOUND_PRIMARY.min,
      REP_RANGES.COMPOUND_PRIMARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      1,
    ),
    // Vertical pull (lat width)
    rx(
      LAT_PULLDOWN,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      2,
    ),
    // Back detail (chest-supported — removes lower back fatigue)
    rx(
      CHEST_SUPPORTED_ROW,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_LIGHT,
      3,
    ),
    // Rear delt (shoulder health)
    rx(
      FACE_PULL,
      3,
      REP_RANGES.ENDURANCE.min,
      REP_RANGES.ENDURANCE.max,
      REST_PERIODS.ISOLATION_LIGHT,
      4,
    ),
    // Bicep (stretch position — incline)
    rx(
      INCLINE_DUMBBELL_CURL,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      5,
    ),
    // Bicep variation (hammer = brachialis)
    rx(
      HAMMER_CURL,
      2,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      6,
    ),
  ],
}

const PULL_B: WorkoutDayTemplate = {
  dayType: 'pull_b',
  nameEn: 'Pull B — Vertical Focus',
  nameHe: 'משיכה B — דגש אנכי',
  estimatedMinutes: 65,
  exercises: [
    // Vertical pull (bodyweight)
    rx(
      PULL_UP,
      4,
      REP_RANGES.COMPOUND_PRIMARY.min,
      REP_RANGES.COMPOUND_PRIMARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      1,
    ),
    // Horizontal pull (cable — constant tension)
    rx(
      SEATED_CABLE_ROW,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      2,
    ),
    // Lat isolation (stretch position — pullover)
    rx(
      CABLE_PULLOVER,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION,
      3,
    ),
    // Rear delt (cable variation)
    rx(
      CABLE_REAR_DELT_FLY,
      3,
      REP_RANGES.ENDURANCE.min,
      REP_RANGES.ENDURANCE.max,
      REST_PERIODS.ISOLATION_LIGHT,
      4,
    ),
    // Bicep (barbell — heavier load)
    rx(
      BARBELL_CURL,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      5,
    ),
    // Bicep (cable — constant tension)
    rx(
      CABLE_CURL,
      2,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      6,
    ),
  ],
}

const LEGS_A: WorkoutDayTemplate = {
  dayType: 'legs_a',
  nameEn: 'Legs A — Squat Focus',
  nameHe: 'רגליים A — דגש סקוואט',
  estimatedMinutes: 70,
  exercises: [
    // Main quad compound
    rx(
      BARBELL_BACK_SQUAT,
      4,
      REP_RANGES.COMPOUND_PRIMARY.min,
      REP_RANGES.COMPOUND_PRIMARY.max,
      REST_PERIODS.COMPOUND_HEAVY,
      1,
    ),
    // Hamstring (stretch position)
    rx(
      SEATED_LEG_CURL,
      4,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION,
      2,
    ),
    // Quad (machine — high volume after squat)
    rx(
      LEG_PRESS,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      3,
    ),
    // Glute direct
    rx(
      HIP_THRUST,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_LIGHT,
      4,
    ),
    // Quad isolation (finishing)
    rx(
      LEG_EXTENSION,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION,
      5,
    ),
    // Calves (gastrocnemius)
    rx(
      STANDING_CALF_RAISE,
      4,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      6,
    ),
    // Abs
    rx(
      CABLE_CRUNCH,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      7,
    ),
  ],
}

const LEGS_B: WorkoutDayTemplate = {
  dayType: 'legs_b',
  nameEn: 'Legs B — Hinge Focus',
  nameHe: "רגליים B — דגש הינג'",
  estimatedMinutes: 70,
  exercises: [
    // Main hip hinge
    rx(
      ROMANIAN_DEADLIFT,
      4,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_HEAVY,
      1,
    ),
    // Quad compound (variation)
    rx(
      HACK_SQUAT,
      4,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_MODERATE,
      2,
    ),
    // Hamstring (lying — variation from seated in Legs A)
    rx(
      LYING_LEG_CURL,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION,
      3,
    ),
    // Unilateral (walking lunge)
    rx(
      WALKING_LUNGE,
      3,
      REP_RANGES.COMPOUND_SECONDARY.min,
      REP_RANGES.COMPOUND_SECONDARY.max,
      REST_PERIODS.COMPOUND_LIGHT,
      4,
    ),
    // Glute (cable variation)
    rx(
      CABLE_PULL_THROUGH,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION,
      5,
    ),
    // Calves (soleus — seated)
    rx(
      SEATED_CALF_RAISE,
      4,
      REP_RANGES.ENDURANCE.min,
      REP_RANGES.ENDURANCE.max,
      REST_PERIODS.ISOLATION_LIGHT,
      6,
    ),
    // Abs
    rx(
      AB_WHEEL_ROLLOUT,
      3,
      REP_RANGES.ISOLATION.min,
      REP_RANGES.ISOLATION.max,
      REST_PERIODS.ISOLATION_LIGHT,
      7,
    ),
  ],
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE LOOKUP
// ═══════════════════════════════════════════════════════════════════

/** All workout templates indexed by day type — O(1) lookup */
export const WORKOUT_TEMPLATES: Readonly<Record<WorkoutDayType, WorkoutDayTemplate | null>> = {
  // Full Body
  full_body_a: FULL_BODY_A,
  full_body_b: FULL_BODY_B,
  full_body_c: FULL_BODY_C,
  // Upper/Lower
  upper_a: UPPER_A,
  upper_b: UPPER_B,
  lower_a: LOWER_A,
  lower_b: LOWER_B,
  // Push/Pull/Legs
  push_a: PUSH_A,
  push_b: PUSH_B,
  pull_a: PULL_A,
  pull_b: PULL_B,
  legs_a: LEGS_A,
  legs_b: LEGS_B,
  // Rest days have no template
  rest: null,
} as const

/** Get template for a given day type */
export function getTemplateForDay(dayType: WorkoutDayType): WorkoutDayTemplate | null {
  return WORKOUT_TEMPLATES[dayType]
}

/** Get all templates for a split type */
export function getTemplatesForSplit(
  splitType: 'full_body' | 'upper_lower' | 'push_pull_legs',
): readonly WorkoutDayTemplate[] {
  const splitDayTypes: Record<string, WorkoutDayType[]> = {
    full_body: ['full_body_a', 'full_body_b', 'full_body_c'],
    upper_lower: ['upper_a', 'lower_a', 'upper_b', 'lower_b'],
    push_pull_legs: ['push_a', 'pull_a', 'legs_a', 'push_b', 'pull_b', 'legs_b'],
  }

  return splitDayTypes[splitType]
    .map((dt) => WORKOUT_TEMPLATES[dt])
    .filter((t): t is WorkoutDayTemplate => t !== null)
}
