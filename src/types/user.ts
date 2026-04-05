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

// ── Component-Based Activity (replaces single ActivityLevel dropdown) ──

/**
 * Occupation type — determines NEAT from work activity.
 * Source: Ainsworth Compendium of Physical Activities (2011)
 */
export type OccupationType =
  | 'desk'           // Programmer, accountant, call center — sitting almost all day
  | 'mixed'          // Teacher, retail, chef — half sitting, half standing/walking
  | 'active'         // Nurse, postal carrier, waiter — walking/standing most of the day
  | 'physical_labor'; // Construction, farming, moving — heavy manual work

/**
 * After-work lifestyle — captures non-occupational NEAT.
 * Source: Levine JA (2005), NEAT variation research
 */
export type LifestyleActivity =
  | 'sedentary'   // Mostly home, TV, computer, gaming
  | 'moderate'    // Errands, walking, household chores, cooking
  | 'active';     // Kids, physical hobbies, gardening, DIY

/**
 * Exercise intensity self-report.
 * Source: IPAQ categories (Craig et al., 2003)
 */
export type ExerciseIntensity =
  | 'light'    // Can hold a full conversation (yoga, easy walk)
  | 'moderate' // Breathing hard but can talk in short sentences
  | 'intense'; // All-out effort, can barely talk

/** Exercise type — affects EPOC (post-exercise calorie burn) */
export type ExerciseType = 'strength' | 'cardio' | 'both';

/** Session duration category in minutes */
export type SessionDuration = 30 | 45 | 60 | 75 | 90;

/**
 * Lifestyle questionnaire — collected during onboarding via simple, conversational questions.
 * Replaces the old single ActivityLevel dropdown with component-based estimation.
 *
 * Source: Component TDEE model (BMR + NEAT + EAT + TEF)
 * - NEAT: Levine 2005, Tudor-Locke 2011
 * - EAT: ACSM, Ainsworth Compendium
 * - TEF: Westerterp 2004
 */
export interface LifestyleProfile {
  // NEAT — occupational
  readonly occupation: OccupationType;

  // NEAT — daily movement (steps)
  readonly dailySteps: number | null; // null = unknown, estimate from occupation + lifestyle

  // NEAT — after-work lifestyle
  readonly afterWorkActivity: LifestyleActivity;

  // EAT — exercise details
  readonly exerciseDaysPerWeek: number;
  readonly exerciseType: ExerciseType;
  readonly sessionDurationMinutes: SessionDuration;
  readonly exerciseIntensity: ExerciseIntensity;

  // Sleep — health flag + minor NEAT impact
  readonly sleepHoursPerNight: number;
}

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

  // Lifestyle (component-based TDEE estimation)
  readonly lifestyle: LifestyleProfile;
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

/**
 * Detailed TDEE breakdown — shows the user exactly where their calories go.
 * Educational + builds trust (transparency).
 */
export interface TdeeBreakdown {
  readonly bmr: number;
  readonly neat: number;
  readonly eat: number;
  readonly tef: number;
  readonly total: number;
}

/** User body measurement entry for progress tracking */
export interface BodyMeasurement {
  readonly id: string;
  readonly date: string; // ISO date: "2026-04-05"
  readonly weightKg: number;
  readonly bodyFatPercent: number | null;
  readonly notes: string;
}
