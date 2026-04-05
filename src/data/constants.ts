/**
 * Application-wide constants.
 * EVERY number and string used across the app is defined here.
 * No magic numbers. No duplicated values. Single source of truth.
 *
 * Sources cited inline — see docs/research/workout-programming.md for full references.
 */

import type {
  ActivityLevel,
  BiologicalSex,
  ExperienceLevel,
  MuscleGroup,
  TrainingGoal,
} from '../types';

// ── Nutrition Constants ──────────────────────────────────────────────

/**
 * Mifflin-St Jeor BMR formula coefficients (1990).
 * BMR = WEIGHT_COEFF × weight(kg) + HEIGHT_COEFF × height(cm) - AGE_COEFF × age + sexOffset
 */
export const BMR_COEFFICIENTS = {
  WEIGHT: 10,
  HEIGHT: 6.25,
  AGE: 5,
  MALE_OFFSET: -5,
  FEMALE_OFFSET: -161,
} as const;

/**
 * Katch-McArdle BMR formula coefficients.
 * BMR = BASE + LBM_COEFF × lean_body_mass(kg)
 * Used when body fat % is known (more accurate for athletes).
 */
export const KATCH_MCARDLE = {
  BASE: 370,
  LBM_COEFFICIENT: 21.6,
} as const;

/** Activity level multipliers for TDEE calculation */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
} as const;

/** Caloric adjustments by goal (kcal/day relative to TDEE) */
export const CALORIC_ADJUSTMENTS: Record<TrainingGoal, { min: number; max: number }> = {
  muscle_gain: { min: 200, max: 300 },
  fat_loss: { min: -500, max: -300 },
  maintenance: { min: 0, max: 0 },
} as const;

/**
 * Protein targets in g/kg body weight by goal.
 * Source: Helms 2014, Iraki 2019
 */
export const PROTEIN_TARGETS: Record<TrainingGoal, { min: number; max: number }> = {
  muscle_gain: { min: 1.6, max: 2.2 },
  fat_loss: { min: 2.0, max: 2.4 },
  maintenance: { min: 1.6, max: 2.0 },
} as const;

/**
 * Fat targets in g/kg body weight.
 * Minimum for hormone health: ~0.8 g/kg
 */
export const FAT_TARGETS = {
  MIN_PER_KG: 0.8,
  MAX_PER_KG: 1.0,
} as const;

/** Calorie content per gram of macronutrient */
export const CALORIES_PER_GRAM = {
  PROTEIN: 4,
  CARBS: 4,
  FAT: 9,
} as const;

// ── Volume Landmarks (per muscle group, weekly sets) ────────────────
// Source: Mike Israetel, RP Strength — Scientific Principles of Hypertrophy Training

interface VolumeLandmarks {
  readonly mv: number;  // Maintenance Volume
  readonly mev: number; // Minimum Effective Volume
  readonly mavLow: number;  // MAV lower bound
  readonly mavHigh: number; // MAV upper bound
  readonly mrv: number; // Maximum Recoverable Volume
}

export const VOLUME_LANDMARKS: Record<MuscleGroup, VolumeLandmarks> = {
  chest:      { mv: 4, mev: 6,  mavLow: 12, mavHigh: 18, mrv: 22 },
  back:       { mv: 4, mev: 8,  mavLow: 14, mavHigh: 20, mrv: 25 },
  shoulders:  { mv: 3, mev: 6,  mavLow: 12, mavHigh: 18, mrv: 22 },
  quads:      { mv: 4, mev: 6,  mavLow: 12, mavHigh: 18, mrv: 20 },
  hamstrings: { mv: 3, mev: 4,  mavLow: 10, mavHigh: 14, mrv: 18 },
  biceps:     { mv: 2, mev: 4,  mavLow: 10, mavHigh: 14, mrv: 18 },
  triceps:    { mv: 2, mev: 4,  mavLow: 8,  mavHigh: 12, mrv: 16 },
  glutes:     { mv: 0, mev: 2,  mavLow: 8,  mavHigh: 12, mrv: 16 },
  calves:     { mv: 2, mev: 4,  mavLow: 8,  mavHigh: 12, mrv: 16 },
  abs:        { mv: 0, mev: 2,  mavLow: 8,  mavHigh: 14, mrv: 16 },
} as const;

// ── Progressive Overload Constants ──────────────────────────────────

/** Weight increment when all sets hit top of rep range (kg) */
export const WEIGHT_INCREMENT = {
  UPPER_BODY: 2.5,
  LOWER_BODY: 5,
  SMALL_MUSCLE_UPPER: 1.25, // Biceps, triceps, lateral raises
  SMALL_MUSCLE_LOWER: 2.5,  // Calves
} as const;

/**
 * RPE/RIR targets by experience level.
 * Beginners train further from failure to build form.
 * Source: Helms, Muscle & Strength Pyramids
 */
export const RPE_TARGETS: Record<ExperienceLevel, { min: number; max: number }> = {
  beginner: { min: 6, max: 7 },     // 3-4 RIR
  intermediate: { min: 7, max: 9 },  // 1-3 RIR
} as const;

// ── Mesocycle Constants ─────────────────────────────────────────────

export const MESOCYCLE = {
  DEFAULT_WEEKS: 6,
  MIN_WEEKS: 4,
  MAX_WEEKS: 8,
  DELOAD_VOLUME_REDUCTION: 0.5, // Cut volume by 50% during deload
  DELOAD_WEIGHT_REDUCTION: 0.1, // Reduce weight by 10% during deload
  /** Number of consecutive declining sessions before auto-deload trigger */
  DECLINE_THRESHOLD: 2,
} as const;

// ── Rest Periods (seconds) ──────────────────────────────────────────
// Source: ACSM Position Stand, Schoenfeld 2016

export const REST_PERIODS = {
  COMPOUND_HEAVY: 180,   // 3 min — squats, deadlifts, bench (3-6 reps)
  COMPOUND_MODERATE: 150, // 2.5 min — compound (6-10 reps)
  COMPOUND_LIGHT: 120,    // 2 min — compound (10-15 reps)
  ISOLATION: 90,           // 1.5 min — isolation exercises
  ISOLATION_LIGHT: 60,     // 1 min — light isolation (laterals, curls)
} as const;

// ── Rep Ranges ──────────────────────────────────────────────────────

export const REP_RANGES = {
  STRENGTH: { min: 3, max: 6 },
  HYPERTROPHY: { min: 6, max: 12 },
  ENDURANCE: { min: 12, max: 20 },
  COMPOUND_PRIMARY: { min: 6, max: 10 },
  COMPOUND_SECONDARY: { min: 8, max: 12 },
  ISOLATION: { min: 10, max: 15 },
} as const;

// ── Split Selection Thresholds ──────────────────────────────────────

export const SPLIT_THRESHOLDS = {
  /** Max training days for Full Body recommendation */
  FULL_BODY_MAX_DAYS: 3,
  /** Exact training days for Upper/Lower recommendation */
  UPPER_LOWER_DAYS: 4,
  /** Min training days for PPL recommendation */
  PPL_MIN_DAYS: 5,
  /** Min experience (months) before recommending PPL */
  PPL_MIN_EXPERIENCE_MONTHS: 6,
} as const;

// ── Warm-up Protocol ────────────────────────────────────────────────

export const WARMUP_SETS = [
  { percentOfWorking: 0.4, reps: 10 },
  { percentOfWorking: 0.6, reps: 6 },
  { percentOfWorking: 0.8, reps: 3 },
] as const;

// ── Validation Boundaries ───────────────────────────────────────────

export const VALIDATION = {
  HEIGHT_CM: { min: 100, max: 250 },
  WEIGHT_KG: { min: 30, max: 300 },
  AGE: { min: 14, max: 100 },
  BODY_FAT_PERCENT: { min: 3, max: 60 },
  STEPS: { min: 0, max: 500_000 },
  WEIGHT_LOGGED_KG: { min: 0, max: 500 },
  REPS: { min: 0, max: 100 },
  RPE: { min: 1, max: 10 },
  SETS: { min: 1, max: 10 },
} as const;

// ── Sex-specific BMR offset lookup ──────────────────────────────────

export const BMR_SEX_OFFSET: Record<BiologicalSex, number> = {
  male: BMR_COEFFICIENTS.MALE_OFFSET,
  female: BMR_COEFFICIENTS.FEMALE_OFFSET,
} as const;
