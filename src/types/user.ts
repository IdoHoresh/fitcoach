/**
 * User-related type definitions.
 * All types are immutable interfaces — data flows through the app as plain objects.
 */

/** Biological sex — affects BMR calculation (Mifflin-St Jeor uses different constants) */
export type BiologicalSex = 'male' | 'female';

/** Training goal — determines caloric adjustment and volume bias */
export type TrainingGoal = 'muscle_gain' | 'fat_loss' | 'maintenance';

/** Training experience — determines starting volume and progression speed */
export type ExperienceLevel = 'beginner' | 'intermediate';

/** Available equipment — determines exercise selection and substitutions */
export type EquipmentAccess = 'full_gym' | 'home_gym' | 'minimal';

/** Days of the week (0 = Sunday, matching JS Date.getDay()) */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Activity level — multiplier for TDEE calculation */
export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

/** Complete user profile collected during onboarding */
export interface UserProfile {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;

  // Body stats
  readonly heightCm: number;
  readonly weightKg: number;
  readonly age: number;
  readonly sex: BiologicalSex;
  readonly bodyFatPercent: number | null; // null = unknown, use Mifflin-St Jeor

  // Training preferences
  readonly goal: TrainingGoal;
  readonly experience: ExperienceLevel;
  readonly trainingDays: readonly DayOfWeek[];
  readonly equipment: EquipmentAccess;
  readonly activityLevel: ActivityLevel;
}

/** Calculated nutrition targets — output of TDEE + macro algorithms */
export interface NutritionTargets {
  readonly bmr: number;
  readonly tdee: number;
  readonly targetCalories: number;
  readonly proteinGrams: number;
  readonly fatGrams: number;
  readonly carbGrams: number;
}

/** User body measurement entry for progress tracking */
export interface BodyMeasurement {
  readonly id: string;
  readonly date: string; // ISO date: "2026-04-05"
  readonly weightKg: number;
  readonly bodyFatPercent: number | null;
  readonly notes: string;
}
