/**
 * Input validation schemas using Zod.
 * EVERY piece of user input passes through these schemas before being processed.
 * This is the single gateway — no raw input ever reaches business logic.
 */

import { z } from 'zod'
import { VALIDATION } from '../data/constants'

// ── Primitive validators ────────────────────────────────────────────

const heightSchema = z
  .number()
  .min(VALIDATION.HEIGHT_CM.min, `Height must be at least ${VALIDATION.HEIGHT_CM.min}cm`)
  .max(VALIDATION.HEIGHT_CM.max, `Height must be at most ${VALIDATION.HEIGHT_CM.max}cm`)

const weightSchema = z
  .number()
  .min(VALIDATION.WEIGHT_KG.min, `Weight must be at least ${VALIDATION.WEIGHT_KG.min}kg`)
  .max(VALIDATION.WEIGHT_KG.max, `Weight must be at most ${VALIDATION.WEIGHT_KG.max}kg`)

const ageSchema = z
  .number()
  .int('Age must be a whole number')
  .min(VALIDATION.AGE.min, `Age must be at least ${VALIDATION.AGE.min}`)
  .max(VALIDATION.AGE.max, `Age must be at most ${VALIDATION.AGE.max}`)

const bodyFatSchema = z
  .number()
  .min(VALIDATION.BODY_FAT_PERCENT.min)
  .max(VALIDATION.BODY_FAT_PERCENT.max)
  .nullable()

const repsSchema = z.number().int().min(VALIDATION.REPS.min).max(VALIDATION.REPS.max)

/** Exported for use in workout template validation */
export const setsSchema = z.number().int().min(VALIDATION.SETS.min).max(VALIDATION.SETS.max)

const rpeSchema = z.number().min(VALIDATION.RPE.min).max(VALIDATION.RPE.max).nullable()

const loggedWeightSchema = z
  .number()
  .min(VALIDATION.WEIGHT_LOGGED_KG.min)
  .max(VALIDATION.WEIGHT_LOGGED_KG.max)

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => !isNaN(new Date(date).getTime()), 'Invalid date')

// ── Enum validators ─────────────────────────────────────────────────

const sexSchema = z.enum(['male', 'female'])
const goalSchema = z.enum(['muscle_gain', 'fat_loss', 'maintenance'])
const experienceSchema = z.enum(['beginner', 'intermediate'])
const equipmentItemSchema = z.enum([
  'none',
  'barbell',
  'squat_rack',
  'dumbbells',
  'bench',
  'pull_up_bar',
  'cable_machine',
  'leg_machines',
  'resistance_bands',
])
const trainingLocationSchema = z.enum(['full_gym', 'home', 'bodyweight_only'])
const userEquipmentSchema = z.object({
  location: trainingLocationSchema,
  availableEquipment: z
    .array(equipmentItemSchema)
    .min(1, 'Must have at least one equipment option'),
})
const dayOfWeekSchema = z.number().int().min(0).max(6)

// Lifestyle / activity component schemas
const occupationSchema = z.enum(['desk', 'mixed', 'active', 'physical_labor'])
const lifestyleActivitySchema = z.enum(['sedentary', 'moderate', 'active'])
const exerciseIntensitySchema = z.enum(['light', 'moderate', 'intense'])
const exerciseTypeSchema = z.enum(['strength', 'cardio', 'both'])
const sessionDurationSchema = z.union([
  z.literal(30),
  z.literal(45),
  z.literal(60),
  z.literal(75),
  z.literal(90),
])

const dailyStepsSchema = z
  .number()
  .int()
  .min(VALIDATION.DAILY_STEPS.min)
  .max(VALIDATION.DAILY_STEPS.max)
  .nullable()

const sleepHoursSchema = z.number().min(VALIDATION.SLEEP_HOURS.min).max(VALIDATION.SLEEP_HOURS.max)

const exerciseDaysSchema = z
  .number()
  .int()
  .min(VALIDATION.EXERCISE_DAYS.min)
  .max(VALIDATION.EXERCISE_DAYS.max)

const mealTypeSchema = z.enum([
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'pre_workout',
  'post_workout',
])

// ── Composite schemas ───────────────────────────────────────────────

/** Validates lifestyle questionnaire from onboarding */
export const lifestyleProfileSchema = z.object({
  occupation: occupationSchema,
  dailySteps: dailyStepsSchema,
  afterWorkActivity: lifestyleActivitySchema,
  exerciseDaysPerWeek: exerciseDaysSchema,
  exerciseType: exerciseTypeSchema,
  sessionDurationMinutes: sessionDurationSchema,
  exerciseIntensity: exerciseIntensitySchema,
  sleepHoursPerNight: sleepHoursSchema,
})

/** Validates complete user profile from onboarding */
export const userProfileSchema = z.object({
  heightCm: heightSchema,
  weightKg: weightSchema,
  age: ageSchema,
  sex: sexSchema,
  bodyFatPercent: bodyFatSchema,
  goal: goalSchema,
  experience: experienceSchema,
  trainingDays: z
    .array(dayOfWeekSchema)
    .min(2, 'Select at least 2 training days')
    .max(6, 'Maximum 6 training days'),
  equipment: userEquipmentSchema,
  lifestyle: lifestyleProfileSchema,
})

/** Validates a single logged set */
export const loggedSetSchema = z.object({
  setNumber: z.number().int().positive(),
  weightKg: loggedWeightSchema,
  reps: repsSchema,
  rpe: rpeSchema,
  isWarmup: z.boolean(),
})

/** Validates a logged exercise (one or more sets) */
export const loggedExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.array(loggedSetSchema).min(1, 'Must log at least 1 set'),
  notes: z.string().max(500).default(''),
})

/** Validates a food log entry */
export const foodLogEntrySchema = z.object({
  foodId: z.string().min(1),
  mealType: mealTypeSchema,
  date: isoDateSchema,
  servingAmount: z.number().positive().max(100),
  servingUnit: z.enum(['grams', 'ml', 'piece', 'tablespoon', 'teaspoon', 'cup', 'serving']),
})

/** Validates a body measurement entry */
export const bodyMeasurementSchema = z.object({
  date: isoDateSchema,
  weightKg: weightSchema,
  bodyFatPercent: bodyFatSchema,
  notes: z.string().max(500).default(''),
})

// ── Validation helper ───────────────────────────────────────────────

export interface ValidationResult<T> {
  success: boolean
  data: T | null
  errors: string[]
}

/**
 * Validates input against a Zod schema and returns a typed result.
 * Use this instead of calling schema.parse() directly — it never throws.
 */
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): ValidationResult<T> {
  const result = schema.safeParse(input)

  if (result.success) {
    return { success: true, data: result.data, errors: [] }
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
    return `${path}${issue.message}`
  })

  return { success: false, data: null, errors }
}

// ── SQL Safety ──────────────────────────────────────────────────────

/**
 * Sanitizes a string for safe logging (strips potential PII patterns).
 * This is NOT for SQL — always use parameterized queries for SQL.
 */
export function sanitizeForLog(value: string): string {
  return value
    .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[EMAIL]')
    .replace(/\b\d{9,}\b/g, '[PHONE]')
    .replace(/\b\d{3}-\d{7}\b/g, '[PHONE]')
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[CARD]')
}
