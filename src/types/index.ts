/**
 * Central type exports.
 * Import from '@/types' instead of individual files.
 */

export type {
  BiologicalSex,
  TrainingGoal,
  ExperienceLevel,
  EquipmentItem,
  TrainingLocation,
  UserEquipment,
  DayOfWeek,
  OccupationType,
  LifestyleActivity,
  ExerciseIntensity,
  ExerciseType,
  SessionDuration,
  LifestyleProfile,
  UserProfile,
  NutritionTargets,
  TdeeBreakdown,
  BodyMeasurement,
} from './user'

export type {
  MuscleGroup,
  MovementPattern,
  SplitType,
  WorkoutDayType,
  Exercise,
  ExercisePrescription,
  WorkoutTemplate,
  LoggedSet,
  LoggedExercise,
  WorkoutLog,
  ProgressionAdvice,
  Mesocycle,
} from './workout'

export type {
  FoodCategory,
  MealType,
  ServingUnit,
  FoodItem,
  ServingSize,
  FoodLogEntry,
  SavedMeal,
  SavedMealItem,
  DailyNutritionSummary,
} from './nutrition'
