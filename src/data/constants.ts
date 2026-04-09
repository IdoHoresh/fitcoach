/**
 * Application-wide constants.
 * EVERY number and string used across the app is defined here.
 * No magic numbers. No duplicated values. Single source of truth.
 *
 * Sources cited inline — see docs/research/workout-programming.md for full references.
 */

import type {
  BiologicalSex,
  ExerciseIntensity,
  ExerciseType,
  ExperienceLevel,
  LifestyleActivity,
  MealsPerDay,
  MealType,
  MuscleGroup,
  OccupationType,
  TrainingGoal,
} from '../types'

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
} as const

/**
 * Katch-McArdle BMR formula coefficients.
 * BMR = BASE + LBM_COEFF × lean_body_mass(kg)
 * Used when body fat % is known (more accurate for athletes).
 */
export const KATCH_MCARDLE = {
  BASE: 370,
  LBM_COEFFICIENT: 21.6,
} as const

// ── Component-Based TDEE Constants ──────────────────────────────────
// Replaces the old single-dropdown activity multiplier system.
// Source: Levine 2005 (NEAT), Ainsworth 2011 (Compendium), Tudor-Locke 2011 (steps)

/**
 * NEAT from occupation — extra daily kcal above BMR from work activity.
 * Based on Ainsworth Compendium MET values × average 8-hour workday.
 *
 * These are ADDITIONAL calories beyond BMR (not multipliers).
 * Source: Ainsworth BE et al. (2011), Compendium of Physical Activities
 */
export const OCCUPATION_NEAT: Record<OccupationType, number> = {
  desk: 150, // ~1.3 MET, mostly sitting (programmer, accountant)
  mixed: 350, // ~2.0 MET, half sitting half moving (teacher, retail)
  active: 550, // ~3.0 MET, walking/standing most of day (nurse, waiter)
  physical_labor: 900, // ~4.5 MET, heavy manual work (construction, farming)
} as const

/**
 * NEAT from after-work lifestyle — extra daily kcal from non-work, non-exercise activity.
 * Source: Levine JA (2005), Science — NEAT variation research
 */
export const LIFESTYLE_NEAT: Record<LifestyleActivity, number> = {
  sedentary: 50, // TV, gaming, couch — minimal movement
  moderate: 200, // Errands, walking, chores, cooking
  active: 400, // Kids, physical hobbies, gardening, DIY projects
} as const

/**
 * Estimated daily steps by occupation type — used as fallback when user
 * doesn't know their step count.
 * Source: Tudor-Locke C et al. (2011), step-based activity classification
 */
export const ESTIMATED_STEPS_BY_OCCUPATION: Record<OccupationType, number> = {
  desk: 3500,
  mixed: 7000,
  active: 12000,
  physical_labor: 15000,
} as const

/**
 * Additional NEAT calories per 1,000 steps above a baseline of 3,000.
 * Source: Creasy SA et al. (2016) — walking energy expenditure
 * ~0.04 kcal/step for 75kg person → ~40 kcal per 1,000 steps.
 * We use 35 to be conservative (varies by weight/speed).
 */
export const NEAT_KCAL_PER_1000_STEPS = 35

/**
 * Baseline steps for NEAT step calculation.
 * Below this, step-based NEAT adds nothing (already counted in BMR/occupation).
 */
export const NEAT_STEP_BASELINE = 3000

/**
 * Exercise calorie burn rates per minute of ACTIVE movement by intensity.
 * Source: Ainsworth Compendium, ACSM metabolic equations
 * Values are kcal/min for a ~75kg person — scaled by weight in the algorithm.
 *
 * IMPORTANT: These are per minute of actual movement, NOT per minute of session.
 * The active time ratio below accounts for rest periods.
 */
export const EXERCISE_KCAL_PER_ACTIVE_MIN: Record<ExerciseIntensity, number> = {
  light: 4, // ~3-4 METs (yoga, easy walk, stretching)
  moderate: 7, // ~5-7 METs (brisk walk, moderate lifting, cycling)
  intense: 10, // ~8-10 METs (HIIT, heavy lifting, sprinting)
} as const

/**
 * What fraction of a session is actual movement vs. resting.
 *
 * Strength training reality:
 *   - A set takes ~30-45 seconds
 *   - Rest between sets: 1-3 minutes
 *   - Walking between machines, setup, water breaks
 *   - In a 90-min session, you're actively moving ~35-40% of the time
 *
 * Cardio is continuous movement — nearly 100% active time.
 *
 * This is the #1 reason other apps overestimate strength training calories.
 */
export const ACTIVE_TIME_RATIO: Record<ExerciseType, number> = {
  strength: 0.35, // ~35% active (rest periods are the majority of time)
  cardio: 0.95, // ~95% active (continuous movement)
  both: 0.6, // ~60% active (mix of both)
} as const

/** Reference body weight for exercise calorie scaling (kg) */
export const EXERCISE_REFERENCE_WEIGHT_KG = 75

/**
 * EPOC (Excess Post-Exercise Oxygen Consumption) multiplier by exercise type.
 * Strength training has higher post-exercise calorie burn than cardio.
 * Source: LaForgia J et al. (2006), Sports Medicine — EPOC review
 */
export const EPOC_MULTIPLIER: Record<ExerciseType, number> = {
  strength: 1.15, // 15% extra burn from EPOC (resistance training)
  cardio: 1.05, // 5% extra burn from EPOC (steady-state)
  both: 1.1, // Average of both
} as const

/**
 * Diminishing returns cap — exercise beyond this weekly duration (minutes)
 * has reduced caloric impact. Based on Pontzer's Constrained Energy model.
 * Source: Pontzer H et al. (2021), Science — "Constrained Total Energy Expenditure"
 */
export const EXERCISE_DIMINISHING_RETURNS = {
  FULL_EFFECT_MINUTES_PER_WEEK: 300, // Full caloric credit up to 5 hours/week
  REDUCED_EFFECT_MULTIPLIER: 0.5, // Beyond that, only 50% caloric credit
} as const

/**
 * TEF (Thermic Effect of Food) — percentage of caloric intake.
 * Source: Westerterp KR (2004), Nutrition & Metabolism
 */
export const TEF_PERCENTAGE = 0.1 // 10% of total intake

/**
 * Sleep health thresholds.
 * Source: Spaeth AM et al. (2015), Markwald RR et al. (2013)
 */
export const SLEEP = {
  LOW_WARNING_HOURS: 6, // Below this: show health warning
  OPTIMAL_MIN_HOURS: 7,
  OPTIMAL_MAX_HOURS: 9,
} as const

/** Caloric adjustments by goal (kcal/day relative to TDEE) */
export const CALORIC_ADJUSTMENTS: Record<TrainingGoal, { min: number; max: number }> = {
  muscle_gain: { min: 200, max: 300 },
  fat_loss: { min: -500, max: -300 },
  maintenance: { min: 0, max: 0 },
} as const

/**
 * Protein targets in g/kg of ADJUSTED body weight by goal.
 *
 * Applied to adjusted body weight (not total) for overweight individuals.
 * Every major evidence-based pro (Helms, Aragon, Norton, Israetel, McDonald)
 * agrees: don't multiply g/kg by total weight when excess body fat is present.
 *
 * Sources:
 * - Helms 2014 meta-analysis: 2.3-3.1 g/kg of LBM during deficit
 * - Aragon: 2.2-3.3 g/kg of target body weight
 * - RP (Israetel): 1.6-2.2 g/kg with diminishing rate at higher BF%
 * - Norton: goal bodyweight or LBM
 * - McDonald: 2.2 g/kg of LBM as baseline
 *
 * We use midpoint of range → fat_loss: (1.8+2.2)/2 = 2.0 g/kg adjusted
 */
export const PROTEIN_TARGETS: Record<TrainingGoal, { min: number; max: number }> = {
  muscle_gain: { min: 1.6, max: 2.2 },
  fat_loss: { min: 1.8, max: 2.2 },
  maintenance: { min: 1.6, max: 2.0 },
} as const

/**
 * Adjusted body weight formula for protein calculation.
 *
 * When body fat % is unknown, we use BMI-based adjustment:
 * - If BMI ≤ 25 (healthy range): use actual weight (no adjustment needed)
 * - If BMI > 25: adjusted = ideal_weight + ADJUSTMENT_FACTOR × (actual - ideal)
 *
 * This matches Helms' recommended formula: ideal + 0.25-0.5 × excess.
 * We use 0.4 (middle of his range).
 * Source: Helms (Muscle & Strength Pyramids), clinical nutrition practice
 */
export const PROTEIN_WEIGHT_ADJUSTMENT = {
  BMI_THRESHOLD: 25,
  /** How much of the "extra" weight to count (40% = assume 40% of excess is lean mass) */
  ADJUSTMENT_FACTOR: 0.4,
} as const

/**
 * Fat targets in g/kg of ACTUAL body weight by goal.
 *
 * Fat uses actual weight (not adjusted) — hormonal needs scale with total mass.
 * During a cut: lower end to free up calories for carbs (training performance).
 * Hard floor: 0.5 g/kg — below this, hormones suffer.
 *
 * Sources:
 * - Helms (3DMJ): 0.5-1.0 g/kg, floor 0.5 g/kg
 * - RP (Israetel): 0.7-0.9 g/kg during cut, floor 0.6-0.7 g/kg
 * - Norton: 20-35% of calories, floor 0.5-0.7 g/kg
 * - McDonald: 0.6-0.8 g/kg during cut, floor 0.6 g/kg
 * - Aragon: 20-35% of calories, floor 0.5 g/kg
 */
export const FAT_TARGETS: Record<TrainingGoal, { min: number; max: number }> = {
  fat_loss: { min: 0.7, max: 0.9 },
  muscle_gain: { min: 0.8, max: 1.2 },
  maintenance: { min: 0.8, max: 1.0 },
} as const

/** Absolute minimum fat — never go below this regardless of goal */
export const FAT_HARD_FLOOR_PER_KG = 0.5

/**
 * Minimum carbs in grams — protects thyroid function and training performance.
 * If carbs would drop below this, reduce fat toward the hard floor first.
 * Source: McDonald (The Protein Book), general sports nutrition consensus
 */
export const CARB_MINIMUM_GRAMS = 100

/** Calorie content per gram of macronutrient */
export const CALORIES_PER_GRAM = {
  PROTEIN: 4,
  CARBS: 4,
  FAT: 9,
} as const

// ── Volume Landmarks (per muscle group, weekly sets) ────────────────
// Source: Mike Israetel, RP Strength — Scientific Principles of Hypertrophy Training

interface VolumeLandmarks {
  readonly mv: number // Maintenance Volume
  readonly mev: number // Minimum Effective Volume
  readonly mavLow: number // MAV lower bound
  readonly mavHigh: number // MAV upper bound
  readonly mrv: number // Maximum Recoverable Volume
}

export const VOLUME_LANDMARKS: Record<MuscleGroup, VolumeLandmarks> = {
  chest: { mv: 4, mev: 6, mavLow: 12, mavHigh: 18, mrv: 22 },
  back: { mv: 4, mev: 8, mavLow: 14, mavHigh: 20, mrv: 25 },
  shoulders: { mv: 3, mev: 6, mavLow: 12, mavHigh: 18, mrv: 22 },
  quads: { mv: 4, mev: 6, mavLow: 12, mavHigh: 18, mrv: 20 },
  hamstrings: { mv: 3, mev: 4, mavLow: 10, mavHigh: 14, mrv: 18 },
  biceps: { mv: 2, mev: 4, mavLow: 10, mavHigh: 14, mrv: 18 },
  triceps: { mv: 2, mev: 4, mavLow: 8, mavHigh: 12, mrv: 16 },
  glutes: { mv: 0, mev: 2, mavLow: 8, mavHigh: 12, mrv: 16 },
  calves: { mv: 2, mev: 4, mavLow: 8, mavHigh: 12, mrv: 16 },
  abs: { mv: 0, mev: 2, mavLow: 8, mavHigh: 14, mrv: 16 },
} as const

// ── Progressive Overload Constants ──────────────────────────────────

/** Weight increment when all sets hit top of rep range (kg) */
export const WEIGHT_INCREMENT = {
  UPPER_BODY: 2.5,
  LOWER_BODY: 5,
  SMALL_MUSCLE_UPPER: 1.25, // Biceps, triceps, lateral raises
  SMALL_MUSCLE_LOWER: 2.5, // Calves
} as const

/**
 * RPE/RIR targets by experience level.
 * Beginners train further from failure to build form.
 * Source: Helms, Muscle & Strength Pyramids
 */
export const RPE_TARGETS: Record<ExperienceLevel, { min: number; max: number }> = {
  beginner: { min: 6, max: 7 }, // 3-4 RIR
  intermediate: { min: 7, max: 9 }, // 1-3 RIR
} as const

// ── Mesocycle Constants ─────────────────────────────────────────────

export const MESOCYCLE = {
  DEFAULT_WEEKS: 6,
  MIN_WEEKS: 4,
  MAX_WEEKS: 8,
  DELOAD_VOLUME_REDUCTION: 0.5, // Cut volume by 50% during deload
  DELOAD_WEIGHT_REDUCTION: 0.1, // Reduce weight by 10% during deload
  /** Number of consecutive declining sessions before auto-deload trigger */
  DECLINE_THRESHOLD: 2,
} as const

// ── Rest Periods (seconds) ──────────────────────────────────────────
// Source: ACSM Position Stand, Schoenfeld 2016

export const REST_PERIODS = {
  COMPOUND_HEAVY: 180, // 3 min — squats, deadlifts, bench (3-6 reps)
  COMPOUND_MODERATE: 150, // 2.5 min — compound (6-10 reps)
  COMPOUND_LIGHT: 120, // 2 min — compound (10-15 reps)
  ISOLATION: 90, // 1.5 min — isolation exercises
  ISOLATION_LIGHT: 60, // 1 min — light isolation (laterals, curls)
} as const

// ── Rep Ranges ──────────────────────────────────────────────────────

export const REP_RANGES = {
  STRENGTH: { min: 3, max: 6 },
  HYPERTROPHY: { min: 6, max: 12 },
  ENDURANCE: { min: 12, max: 20 },
  COMPOUND_PRIMARY: { min: 6, max: 10 },
  COMPOUND_SECONDARY: { min: 8, max: 12 },
  ISOLATION: { min: 10, max: 15 },
} as const

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
} as const

// ── Warm-up Protocol ────────────────────────────────────────────────

export const WARMUP_SETS = [
  { percentOfWorking: 0.4, reps: 10 },
  { percentOfWorking: 0.6, reps: 6 },
  { percentOfWorking: 0.8, reps: 3 },
] as const

// ── Validation Boundaries ───────────────────────────────────────────

export const VALIDATION = {
  NAME_LENGTH: { min: 1, max: 50 },
  HEIGHT_CM: { min: 100, max: 250 },
  WEIGHT_KG: { min: 30, max: 300 },
  AGE: { min: 14, max: 100 },
  BODY_FAT_PERCENT: { min: 3, max: 60 },
  DAILY_STEPS: { min: 0, max: 100_000 },
  SLEEP_HOURS: { min: 2, max: 14 },
  EXERCISE_DAYS: { min: 0, max: 7 },
  WEIGHT_LOGGED_KG: { min: 0, max: 500 },
  REPS: { min: 0, max: 100 },
  RPE: { min: 1, max: 10 },
  SETS: { min: 1, max: 10 },
} as const

// ── Sex-specific BMR offset lookup ──────────────────────────────────

export const BMR_SEX_OFFSET: Record<BiologicalSex, number> = {
  male: BMR_COEFFICIENTS.MALE_OFFSET,
  female: BMR_COEFFICIENTS.FEMALE_OFFSET,
} as const

// ── Meal Planning Constants ────────────────────────────────────────
// How daily calories/macros are distributed across meals.
// Based on sports nutrition best practices (Aragon, Schoenfeld, Helms).

/**
 * Calorie distribution across meals by meal count.
 * Protein is distributed ~evenly (leucine threshold: 30-40g per meal).
 * Carbs and fat follow calorie distribution, adjusted on training days.
 *
 * Source: Aragon AA & Schoenfeld BJ (2013), Nutrient timing revisited
 */
export const MEAL_CALORIE_DISTRIBUTION: Record<MealsPerDay, Record<MealType, number>> = {
  3: {
    breakfast: 0.3,
    lunch: 0.35,
    dinner: 0.35,
    snack: 0,
    pre_workout: 0,
    post_workout: 0,
  },
  4: {
    breakfast: 0.25,
    lunch: 0.3,
    dinner: 0.3,
    snack: 0.15,
    pre_workout: 0,
    post_workout: 0,
  },
  5: {
    breakfast: 0.2,
    lunch: 0.25,
    dinner: 0.25,
    snack: 0.15,
    pre_workout: 0.15,
    post_workout: 0,
  },
  6: {
    breakfast: 0.18,
    lunch: 0.22,
    dinner: 0.22,
    snack: 0.12,
    pre_workout: 0.12,
    post_workout: 0.14,
  },
} as const

/**
 * On training days, shift this fraction of total carbs toward peri-workout meals.
 * Pre/post workout carbs improve performance and recovery.
 *
 * Source: Kerksick CM et al. (2017), ISSN position stand on nutrient timing
 */
export const TRAINING_DAY_CARB_SHIFT = 0.15

/**
 * Tolerance when matching meal templates to macro targets.
 * A template within ±5% of the target is considered a good match.
 */
export const MACRO_TOLERANCE_PERCENT = 0.05

/**
 * Scale factor bounds for template portion scaling.
 * Below 0.3 = unrealistically tiny portions (half a bite of chicken).
 * Above 2.5 = unrealistically large (5 chicken breasts in one meal).
 */
export const MIN_SCALE_FACTOR = 0.3
export const MAX_SCALE_FACTOR = 2.5

// ── Weekly Recalibration Constants ─────────────────────────────────
// How the app adjusts calories based on weekly weight change.
// Conservative approach — small adjustments prevent yo-yo dieting.
//
// Source: Helms ER et al. (2014), Evidence-based recommendations for contest prep
// Source: Israetel M, RP Strength — rate of weight change guidelines

/**
 * Expected weekly weight change by goal (kg/week).
 * Fat loss: 0.5-1% of body weight → ~0.3-0.7 kg for most users.
 * Muscle gain: slower to prevent excess fat gain.
 */
export const EXPECTED_WEEKLY_CHANGE: Record<TrainingGoal, { min: number; max: number }> = {
  fat_loss: { min: -0.7, max: -0.3 },
  muscle_gain: { min: 0.1, max: 0.3 },
  maintenance: { min: -0.3, max: 0.3 },
} as const

/**
 * How much to adjust calories per recalibration step (kcal).
 * Small steps prevent overshooting — patience beats aggression.
 */
export const CALORIE_ADJUSTMENT_STEP = 100

/** Maximum calorie adjustment in a single recalibration (kcal) */
export const MAX_CALORIE_ADJUSTMENT = 300

/**
 * Minimum weeks of data before the first recalibration.
 * Week 1 weight is unreliable (water shifts from diet change).
 */
export const MIN_WEEKS_BEFORE_RECALIBRATION = 2

/**
 * Minimum food logging adherence to make a recalibration decision.
 * Below this, we ask the user to log more consistently.
 */
export const MIN_ADHERENCE_FOR_RECALIBRATION = 0.6

/**
 * Absolute calorie floors — never go below these (hormonal health).
 * Source: ACSM position stand, clinical nutrition guidelines
 */
export const CALORIE_FLOOR: Record<BiologicalSex, number> = {
  male: 1500,
  female: 1200,
} as const
