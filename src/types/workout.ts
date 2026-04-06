/**
 * Workout-related type definitions.
 * Covers exercises, sets, workout templates, and logging.
 */

import type { EquipmentItem } from './user'

/** Muscle groups tracked for volume management */
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'quads'
  | 'hamstrings'
  | 'biceps'
  | 'triceps'
  | 'glutes'
  | 'calves'
  | 'abs'

/** Movement pattern — used for balanced programming */
export type MovementPattern =
  | 'horizontal_push'
  | 'horizontal_pull'
  | 'vertical_push'
  | 'vertical_pull'
  | 'squat'
  | 'hip_hinge'
  | 'isolation'
  | 'core'

/** Training split type — determined by available training days */
export type SplitType = 'full_body' | 'upper_lower' | 'push_pull_legs'

/** Workout day type within a split */
export type WorkoutDayType =
  | 'full_body_a'
  | 'full_body_b'
  | 'full_body_c'
  | 'upper_a'
  | 'upper_b'
  | 'lower_a'
  | 'lower_b'
  | 'push_a'
  | 'push_b'
  | 'pull_a'
  | 'pull_b'
  | 'legs_a'
  | 'legs_b'
  | 'rest'

/** Single exercise definition in the database */
export interface Exercise {
  readonly id: string
  readonly nameHe: string
  readonly nameEn: string
  readonly primaryMuscle: MuscleGroup
  readonly secondaryMuscles: readonly MuscleGroup[]
  readonly movementPattern: MovementPattern
  readonly requiredEquipment: readonly EquipmentItem[]
  readonly substitutionIds: readonly string[] // IDs of alternative exercises
  readonly instructions: string
}

/** Exercise prescription within a workout template */
export interface ExercisePrescription {
  readonly exerciseId: string
  readonly sets: number
  readonly minReps: number
  readonly maxReps: number
  readonly restSeconds: number
  readonly order: number // Position in workout
}

/** Complete workout template for one day */
export interface WorkoutTemplate {
  readonly id: string
  readonly dayType: WorkoutDayType
  readonly splitType: SplitType
  readonly nameHe: string
  readonly nameEn: string
  readonly exercises: readonly ExercisePrescription[]
  readonly estimatedMinutes: number
}

/** A single logged set during a workout */
export interface LoggedSet {
  readonly setNumber: number
  readonly weightKg: number
  readonly reps: number
  readonly rpe: number | null // 1-10 scale, null if not tracked
  readonly isWarmup: boolean
}

/** A single logged exercise (contains multiple sets) */
export interface LoggedExercise {
  readonly exerciseId: string
  readonly sets: readonly LoggedSet[]
  readonly notes: string
}

/** Complete logged workout session */
export interface WorkoutLog {
  readonly id: string
  readonly date: string // ISO date
  readonly templateId: string
  readonly dayType: WorkoutDayType
  readonly startedAt: string // ISO datetime
  readonly completedAt: string | null // null if abandoned
  readonly exercises: readonly LoggedExercise[]
  readonly durationMinutes: number
}

/** Progressive overload recommendation for an exercise */
export interface ProgressionAdvice {
  readonly exerciseId: string
  readonly action: 'increase_weight' | 'stay' | 'deload'
  readonly suggestedWeightKg: number | null
  readonly reason: string
  readonly reasonHe: string
}

/** Mesocycle tracking — 4-6 week training block */
export interface Mesocycle {
  readonly id: string
  readonly startDate: string
  readonly endDate: string | null // null if active
  readonly weekNumber: number // Current week in the cycle (1-6)
  readonly totalWeeks: number
  readonly isDeloadWeek: boolean
}

/** Mesocycle state managed by the workout store */
export interface MesocycleState {
  readonly id: string
  readonly planId: string // SQLite UUID of the associated workout_plan
  readonly startDate: string
  readonly currentWeek: number
  readonly totalWeeks: number
  readonly isDeloadWeek: boolean
  readonly weekStartDate: string // ISO date of current week's start
}

/** Active in-progress workout session */
export interface ActiveSession {
  readonly templateId: string // SQLite UUID of the workout_template
  readonly workoutDayType: WorkoutDayType
  readonly startedAt: string // ISO datetime
  readonly currentExerciseIndex: number
  readonly loggedExercises: LoggedExercise[]
}

/** Archived plan snapshot for history */
export interface ArchivedPlan {
  readonly id: string
  readonly splitType: SplitType
  readonly mesocycleWeeks: number
  readonly workoutsCompleted: number
  readonly archivedAt: string // ISO datetime
}
