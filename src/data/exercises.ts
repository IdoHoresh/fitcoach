/**
 * Exercise Database — ~70 science-backed exercises.
 *
 * Every exercise is tagged with:
 * - Primary + secondary muscles (for volume tracking)
 * - Movement pattern (for balanced programming)
 * - Required equipment items (checklist-based, not tier-based)
 * - Whether it trains the muscle in a stretched position (2022-2024 research)
 * - Hebrew + English names
 *
 * Equipment system:
 * - Each exercise lists the SPECIFIC items it needs: ['barbell', 'bench']
 * - ['none'] = bodyweight only (always available)
 * - The generator checks if the user's equipment includes ALL required items
 * - This enables flexible home/garage/outdoor setups
 *
 * Exercise selection priorities (from research):
 * 1. Stretch-position exercises preferred as defaults (Maeo 2023, Pedrosa 2023)
 * 2. Compound movements before isolation
 * 3. Free weights before machines (more stabilizer activation)
 * 4. At least 2 exercises per muscle per week from different angles (Helms)
 *
 * Sources:
 * - EMG data: Contreras 2010, Schoenfeld 2010
 * - Stretch-position superiority: Maeo 2023, Pedrosa 2021/2023, Wolf 2023
 * - Exercise selection: Helms (3DMJ), Israetel (RP), Nippard, Norton, McDonald
 */

import type { Exercise, MuscleGroup } from '../types';
import type { EquipmentItem } from '../types/user';

// ── Exercise Position Tag ──────────────────────────────────────────
// Not part of the Exercise type (UI doesn't need it),
// but used internally by the workout generator for smart selection.

export type MusclePosition = 'stretched' | 'shortened' | 'neutral';

export interface ExerciseWithMeta extends Exercise {
  /** Does this exercise load the muscle in a stretched position? */
  readonly musclePosition: MusclePosition;
  /** Is this a compound (multi-joint) or isolation (single-joint) movement? */
  readonly isCompound: boolean;
}

// ── Helper to create exercises with type safety ────────────────────

let exerciseCounter = 0;

function createExercise(
  params: Omit<ExerciseWithMeta, 'id' | 'instructions'> & {
    instructions?: string;
  },
): ExerciseWithMeta {
  exerciseCounter += 1;
  return {
    ...params,
    id: `ex_${String(exerciseCounter).padStart(3, '0')}`,
    instructions: params.instructions ?? '',
  };
}

// ═══════════════════════════════════════════════════════════════════
// CHEST
// ═══════════════════════════════════════════════════════════════════

export const BARBELL_BENCH_PRESS = createExercise({
  nameEn: 'Barbell Bench Press',
  nameHe: 'לחיצת חזה עם מוט',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  movementPattern: 'horizontal_push',
  requiredEquipment: ['barbell', 'bench'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const INCLINE_DUMBBELL_PRESS = createExercise({
  nameEn: 'Incline Dumbbell Press',
  nameHe: 'לחיצת חזה משופע עם משקולות',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  movementPattern: 'horizontal_push',
  requiredEquipment: ['dumbbells', 'bench'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const DUMBBELL_BENCH_PRESS = createExercise({
  nameEn: 'Dumbbell Bench Press',
  nameHe: 'לחיצת חזה עם משקולות',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  movementPattern: 'horizontal_push',
  requiredEquipment: ['dumbbells', 'bench'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const DUMBBELL_FLY = createExercise({
  nameEn: 'Dumbbell Fly',
  nameHe: 'פרפר עם משקולות',
  primaryMuscle: 'chest',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['dumbbells', 'bench'],
  musclePosition: 'stretched',
  isCompound: false,
  substitutionIds: [],
});

export const CABLE_CROSSOVER = createExercise({
  nameEn: 'Cable Crossover',
  nameHe: 'קרוסאובר בכבלים',
  primaryMuscle: 'chest',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'shortened',
  isCompound: false,
  substitutionIds: [],
});

export const PUSH_UP = createExercise({
  nameEn: 'Push-Up',
  nameHe: 'שכיבות סמיכה',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  movementPattern: 'horizontal_push',
  requiredEquipment: ['none'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const MACHINE_CHEST_PRESS = createExercise({
  nameEn: 'Machine Chest Press',
  nameHe: 'לחיצת חזה במכונה',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  movementPattern: 'horizontal_push',
  requiredEquipment: ['leg_machines'],  // gym machines category
  musclePosition: 'neutral',
  isCompound: true,
  substitutionIds: [],
});

export const DECLINE_PUSH_UP = createExercise({
  nameEn: 'Decline Push-Up (Feet Elevated)',
  nameHe: 'שכיבות סמיכה עם רגליים מורמות',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  movementPattern: 'horizontal_push',
  requiredEquipment: ['none'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const BAND_CHEST_FLY = createExercise({
  nameEn: 'Resistance Band Chest Fly',
  nameHe: 'פרפר חזה עם גומיה',
  primaryMuscle: 'chest',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['resistance_bands'],
  musclePosition: 'stretched',
  isCompound: false,
  substitutionIds: [],
});

// ═══════════════════════════════════════════════════════════════════
// BACK
// ═══════════════════════════════════════════════════════════════════

export const BARBELL_ROW = createExercise({
  nameEn: 'Barbell Row',
  nameHe: 'חתירה עם מוט',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps'],
  movementPattern: 'horizontal_pull',
  requiredEquipment: ['barbell'],
  musclePosition: 'neutral',
  isCompound: true,
  substitutionIds: [],
});

export const SEATED_CABLE_ROW = createExercise({
  nameEn: 'Seated Cable Row',
  nameHe: 'חתירה בכבל ישיבה',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps'],
  movementPattern: 'horizontal_pull',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const DUMBBELL_ROW = createExercise({
  nameEn: 'Single-Arm Dumbbell Row',
  nameHe: 'חתירה חד-צדדית עם משקולת',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps'],
  movementPattern: 'horizontal_pull',
  requiredEquipment: ['dumbbells'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const LAT_PULLDOWN = createExercise({
  nameEn: 'Lat Pulldown',
  nameHe: 'משיכה עליונה',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps'],
  movementPattern: 'vertical_pull',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const PULL_UP = createExercise({
  nameEn: 'Pull-Up',
  nameHe: 'מתח',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps'],
  movementPattern: 'vertical_pull',
  requiredEquipment: ['pull_up_bar'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const CABLE_PULLOVER = createExercise({
  nameEn: 'Cable Pullover',
  nameHe: 'פולאובר בכבל',
  primaryMuscle: 'back',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'stretched',
  isCompound: false,
  substitutionIds: [],
});

export const CHEST_SUPPORTED_ROW = createExercise({
  nameEn: 'Chest-Supported Dumbbell Row',
  nameHe: 'חתירה עם תמיכת חזה',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps'],
  movementPattern: 'horizontal_pull',
  requiredEquipment: ['dumbbells', 'bench'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const T_BAR_ROW = createExercise({
  nameEn: 'T-Bar Row',
  nameHe: 'חתירת טי-בר',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps'],
  movementPattern: 'horizontal_pull',
  requiredEquipment: ['barbell'],
  musclePosition: 'neutral',
  isCompound: true,
  substitutionIds: [],
});

export const INVERTED_ROW = createExercise({
  nameEn: 'Inverted Row (Bodyweight)',
  nameHe: 'חתירה הפוכה',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps'],
  movementPattern: 'horizontal_pull',
  requiredEquipment: ['none'],  // Can use a sturdy table edge or low bar
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const BAND_PULL_APART = createExercise({
  nameEn: 'Band Pull-Apart',
  nameHe: 'משיכת גומיה',
  primaryMuscle: 'back',
  secondaryMuscles: ['shoulders'],
  movementPattern: 'horizontal_pull',
  requiredEquipment: ['resistance_bands'],
  musclePosition: 'neutral',
  isCompound: false,
  substitutionIds: [],
});

// ═══════════════════════════════════════════════════════════════════
// SHOULDERS
// ═══════════════════════════════════════════════════════════════════

export const OVERHEAD_PRESS = createExercise({
  nameEn: 'Overhead Press (Barbell)',
  nameHe: 'לחיצת כתפיים עם מוט',
  primaryMuscle: 'shoulders',
  secondaryMuscles: ['triceps'],
  movementPattern: 'vertical_push',
  requiredEquipment: ['barbell'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const DUMBBELL_SHOULDER_PRESS = createExercise({
  nameEn: 'Dumbbell Shoulder Press',
  nameHe: 'לחיצת כתפיים עם משקולות',
  primaryMuscle: 'shoulders',
  secondaryMuscles: ['triceps'],
  movementPattern: 'vertical_push',
  requiredEquipment: ['dumbbells'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const PIKE_PUSH_UP = createExercise({
  nameEn: 'Pike Push-Up',
  nameHe: 'שכיבות סמיכה פייק',
  primaryMuscle: 'shoulders',
  secondaryMuscles: ['triceps'],
  movementPattern: 'vertical_push',
  requiredEquipment: ['none'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const DUMBBELL_LATERAL_RAISE = createExercise({
  nameEn: 'Dumbbell Lateral Raise',
  nameHe: 'הרמה צידית עם משקולות',
  primaryMuscle: 'shoulders',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['dumbbells'],
  musclePosition: 'shortened',
  isCompound: false,
  substitutionIds: [],
});

export const CABLE_LATERAL_RAISE = createExercise({
  nameEn: 'Cable Lateral Raise',
  nameHe: 'הרמה צידית בכבל',
  primaryMuscle: 'shoulders',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'shortened',
  isCompound: false,
  substitutionIds: [],
});

export const BAND_LATERAL_RAISE = createExercise({
  nameEn: 'Resistance Band Lateral Raise',
  nameHe: 'הרמה צידית עם גומיה',
  primaryMuscle: 'shoulders',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['resistance_bands'],
  musclePosition: 'shortened',
  isCompound: false,
  substitutionIds: [],
});

export const CABLE_REAR_DELT_FLY = createExercise({
  nameEn: 'Cable Rear Delt Fly',
  nameHe: 'פרפר אחורי בכבל',
  primaryMuscle: 'shoulders',
  secondaryMuscles: ['back'],
  movementPattern: 'isolation',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'stretched',
  isCompound: false,
  substitutionIds: [],
});

export const FACE_PULL = createExercise({
  nameEn: 'Face Pull',
  nameHe: 'פייס פול',
  primaryMuscle: 'shoulders',
  secondaryMuscles: ['back'],
  movementPattern: 'isolation',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'stretched',
  isCompound: false,
  substitutionIds: [],
});

export const REVERSE_DUMBBELL_FLY = createExercise({
  nameEn: 'Reverse Dumbbell Fly',
  nameHe: 'פרפר הפוך עם משקולות',
  primaryMuscle: 'shoulders',
  secondaryMuscles: ['back'],
  movementPattern: 'isolation',
  requiredEquipment: ['dumbbells'],
  musclePosition: 'stretched',
  isCompound: false,
  substitutionIds: [],
});

export const BAND_FACE_PULL = createExercise({
  nameEn: 'Band Face Pull',
  nameHe: 'פייס פול עם גומיה',
  primaryMuscle: 'shoulders',
  secondaryMuscles: ['back'],
  movementPattern: 'isolation',
  requiredEquipment: ['resistance_bands'],
  musclePosition: 'stretched',
  isCompound: false,
  substitutionIds: [],
});

// ═══════════════════════════════════════════════════════════════════
// BICEPS
// ═══════════════════════════════════════════════════════════════════

export const INCLINE_DUMBBELL_CURL = createExercise({
  nameEn: 'Incline Dumbbell Curl',
  nameHe: 'כיפוף עם משקולות על ספסל משופע',
  primaryMuscle: 'biceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['dumbbells', 'bench'],
  musclePosition: 'stretched',  // Shoulder extended = bicep long head stretched
  isCompound: false,
  substitutionIds: [],
});

export const BARBELL_CURL = createExercise({
  nameEn: 'Barbell Curl',
  nameHe: 'כיפוף עם מוט',
  primaryMuscle: 'biceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['barbell'],
  musclePosition: 'neutral',
  isCompound: false,
  substitutionIds: [],
});

export const HAMMER_CURL = createExercise({
  nameEn: 'Hammer Curl',
  nameHe: 'כיפוף פטיש',
  primaryMuscle: 'biceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['dumbbells'],
  musclePosition: 'neutral',
  isCompound: false,
  substitutionIds: [],
});

export const CABLE_CURL = createExercise({
  nameEn: 'Cable Curl',
  nameHe: 'כיפוף בכבל',
  primaryMuscle: 'biceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'neutral',
  isCompound: false,
  substitutionIds: [],
});

export const PREACHER_CURL = createExercise({
  nameEn: 'Preacher Curl',
  nameHe: 'כיפוף סקוט',
  primaryMuscle: 'biceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['dumbbells', 'bench'],
  musclePosition: 'shortened',
  isCompound: false,
  substitutionIds: [],
});

export const CHIN_UP = createExercise({
  nameEn: 'Chin-Up (Underhand Grip)',
  nameHe: 'מתח אחיזה הפוכה',
  primaryMuscle: 'biceps',
  secondaryMuscles: ['back'],
  movementPattern: 'vertical_pull',
  requiredEquipment: ['pull_up_bar'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const BAND_CURL = createExercise({
  nameEn: 'Resistance Band Curl',
  nameHe: 'כיפוף עם גומיה',
  primaryMuscle: 'biceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['resistance_bands'],
  musclePosition: 'neutral',
  isCompound: false,
  substitutionIds: [],
});

export const BODYWEIGHT_BICEP_CURL = createExercise({
  nameEn: 'Self-Resisted Bicep Curl',
  nameHe: 'כיפוף ביספס עם התנגדות עצמית',
  primaryMuscle: 'biceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['none'],  // One arm resists the other, or use a towel
  musclePosition: 'neutral',
  isCompound: false,
  substitutionIds: [],
});

// ═══════════════════════════════════════════════════════════════════
// TRICEPS
// ═══════════════════════════════════════════════════════════════════

export const OVERHEAD_TRICEP_EXTENSION = createExercise({
  nameEn: 'Overhead Tricep Extension (Cable)',
  nameHe: 'הארכת טרייספס מעל הראש בכבל',
  primaryMuscle: 'triceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'stretched',  // Shoulder flexed = long head stretched
  isCompound: false,
  substitutionIds: [],
});

export const OVERHEAD_DUMBBELL_TRICEP_EXTENSION = createExercise({
  nameEn: 'Overhead Dumbbell Tricep Extension',
  nameHe: 'הארכת טרייספס מעל הראש עם משקולת',
  primaryMuscle: 'triceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['dumbbells'],
  musclePosition: 'stretched',
  isCompound: false,
  substitutionIds: [],
});

export const SKULL_CRUSHER = createExercise({
  nameEn: 'Skull Crusher (EZ Bar)',
  nameHe: 'סקאל קראשר',
  primaryMuscle: 'triceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['barbell', 'bench'],
  musclePosition: 'stretched',
  isCompound: false,
  substitutionIds: [],
});

export const TRICEP_PUSHDOWN = createExercise({
  nameEn: 'Tricep Pushdown (Cable)',
  nameHe: 'לחיצת טרייספס בכבל',
  primaryMuscle: 'triceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'shortened',
  isCompound: false,
  substitutionIds: [],
});

export const CLOSE_GRIP_BENCH_PRESS = createExercise({
  nameEn: 'Close-Grip Bench Press',
  nameHe: 'לחיצת חזה במרחק צר',
  primaryMuscle: 'triceps',
  secondaryMuscles: ['chest'],
  movementPattern: 'horizontal_push',
  requiredEquipment: ['barbell', 'bench'],
  musclePosition: 'neutral',
  isCompound: true,
  substitutionIds: [],
});

export const DIAMOND_PUSH_UP = createExercise({
  nameEn: 'Diamond Push-Up',
  nameHe: 'שכיבות סמיכה יהלום',
  primaryMuscle: 'triceps',
  secondaryMuscles: ['chest'],
  movementPattern: 'horizontal_push',
  requiredEquipment: ['none'],
  musclePosition: 'neutral',
  isCompound: true,
  substitutionIds: [],
});

export const BENCH_DIP = createExercise({
  nameEn: 'Bench Dip',
  nameHe: 'טבילה על ספסל',
  primaryMuscle: 'triceps',
  secondaryMuscles: ['chest', 'shoulders'],
  movementPattern: 'isolation',
  requiredEquipment: ['none'],  // Can use any elevated surface (chair, step)
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const BAND_TRICEP_PUSHDOWN = createExercise({
  nameEn: 'Band Tricep Pushdown',
  nameHe: 'לחיצת טרייספס בגומיה',
  primaryMuscle: 'triceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['resistance_bands'],
  musclePosition: 'shortened',
  isCompound: false,
  substitutionIds: [],
});

// ═══════════════════════════════════════════════════════════════════
// QUADS
// ═══════════════════════════════════════════════════════════════════

export const BARBELL_BACK_SQUAT = createExercise({
  nameEn: 'Barbell Back Squat',
  nameHe: 'סקוואט עם מוט',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes', 'hamstrings'],
  movementPattern: 'squat',
  requiredEquipment: ['barbell', 'squat_rack'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const LEG_PRESS = createExercise({
  nameEn: 'Leg Press',
  nameHe: 'לג פרס',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes'],
  movementPattern: 'squat',
  requiredEquipment: ['leg_machines'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const BULGARIAN_SPLIT_SQUAT = createExercise({
  nameEn: 'Bulgarian Split Squat',
  nameHe: 'סקוואט בולגרי',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes'],
  movementPattern: 'squat',
  requiredEquipment: ['dumbbells'],  // Can also do bodyweight, but DB version is standard
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const GOBLET_SQUAT = createExercise({
  nameEn: 'Goblet Squat',
  nameHe: 'סקוואט גובלט',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes'],
  movementPattern: 'squat',
  requiredEquipment: ['dumbbells'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const LEG_EXTENSION = createExercise({
  nameEn: 'Leg Extension',
  nameHe: 'לג אקסטנשן',
  primaryMuscle: 'quads',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['leg_machines'],
  musclePosition: 'shortened',
  isCompound: false,
  substitutionIds: [],
});

export const WALKING_LUNGE = createExercise({
  nameEn: 'Walking Lunge',
  nameHe: 'מכרע הליכה',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes', 'hamstrings'],
  movementPattern: 'squat',
  requiredEquipment: ['none'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const HACK_SQUAT = createExercise({
  nameEn: 'Hack Squat',
  nameHe: 'האק סקוואט',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes'],
  movementPattern: 'squat',
  requiredEquipment: ['leg_machines'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const BODYWEIGHT_SQUAT = createExercise({
  nameEn: 'Bodyweight Squat',
  nameHe: 'סקוואט ללא משקל',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes'],
  movementPattern: 'squat',
  requiredEquipment: ['none'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const PISTOL_SQUAT = createExercise({
  nameEn: 'Pistol Squat (Single-Leg)',
  nameHe: 'סקוואט חד-רגלי',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes'],
  movementPattern: 'squat',
  requiredEquipment: ['none'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const STEP_UP = createExercise({
  nameEn: 'Step-Up',
  nameHe: 'עליה על משטח',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes'],
  movementPattern: 'squat',
  requiredEquipment: ['none'],  // Any elevated surface
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

// ═══════════════════════════════════════════════════════════════════
// HAMSTRINGS
// ═══════════════════════════════════════════════════════════════════

export const ROMANIAN_DEADLIFT = createExercise({
  nameEn: 'Romanian Deadlift (RDL)',
  nameHe: 'מתה רומני',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: ['glutes', 'back'],
  movementPattern: 'hip_hinge',
  requiredEquipment: ['barbell'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const DUMBBELL_RDL = createExercise({
  nameEn: 'Dumbbell Romanian Deadlift',
  nameHe: 'מתה רומני עם משקולות',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: ['glutes', 'back'],
  movementPattern: 'hip_hinge',
  requiredEquipment: ['dumbbells'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const SEATED_LEG_CURL = createExercise({
  nameEn: 'Seated Leg Curl',
  nameHe: 'לג קרל בישיבה',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['leg_machines'],
  musclePosition: 'stretched',  // Hip flexed = hamstring stretched at proximal end
  isCompound: false,
  substitutionIds: [],
});

export const LYING_LEG_CURL = createExercise({
  nameEn: 'Lying Leg Curl',
  nameHe: 'לג קרל שכיבה',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['leg_machines'],
  musclePosition: 'neutral',
  isCompound: false,
  substitutionIds: [],
});

export const NORDIC_CURL = createExercise({
  nameEn: 'Nordic Hamstring Curl',
  nameHe: 'נורדיק קרל',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['none'],  // Anchor feet under couch/partner
  musclePosition: 'stretched',
  isCompound: false,
  substitutionIds: [],
});

export const BARBELL_DEADLIFT = createExercise({
  nameEn: 'Conventional Deadlift',
  nameHe: 'מתה קונבנציונלי',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: ['glutes', 'back', 'quads'],
  movementPattern: 'hip_hinge',
  requiredEquipment: ['barbell'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const SINGLE_LEG_RDL = createExercise({
  nameEn: 'Single-Leg Romanian Deadlift',
  nameHe: 'מתה רומני חד-רגלי',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: ['glutes', 'back'],
  movementPattern: 'hip_hinge',
  requiredEquipment: ['none'],  // Bodyweight or with DB
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

export const SLIDING_LEG_CURL = createExercise({
  nameEn: 'Sliding Leg Curl',
  nameHe: 'לג קרל גלישה',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: ['glutes'],
  movementPattern: 'isolation',
  requiredEquipment: ['none'],  // Towel on smooth floor or socks
  musclePosition: 'stretched',
  isCompound: false,
  substitutionIds: [],
});

// ═══════════════════════════════════════════════════════════════════
// GLUTES
// ═══════════════════════════════════════════════════════════════════

export const HIP_THRUST = createExercise({
  nameEn: 'Barbell Hip Thrust',
  nameHe: 'היפ ת\'ראסט עם מוט',
  primaryMuscle: 'glutes',
  secondaryMuscles: ['hamstrings'],
  movementPattern: 'hip_hinge',
  requiredEquipment: ['barbell', 'bench'],
  musclePosition: 'shortened',
  isCompound: true,
  substitutionIds: [],
});

export const GLUTE_BRIDGE = createExercise({
  nameEn: 'Glute Bridge',
  nameHe: 'גשר ישבן',
  primaryMuscle: 'glutes',
  secondaryMuscles: ['hamstrings'],
  movementPattern: 'hip_hinge',
  requiredEquipment: ['none'],
  musclePosition: 'shortened',
  isCompound: true,
  substitutionIds: [],
});

export const SINGLE_LEG_GLUTE_BRIDGE = createExercise({
  nameEn: 'Single-Leg Glute Bridge',
  nameHe: 'גשר ישבן חד-רגלי',
  primaryMuscle: 'glutes',
  secondaryMuscles: ['hamstrings'],
  movementPattern: 'hip_hinge',
  requiredEquipment: ['none'],
  musclePosition: 'shortened',
  isCompound: true,
  substitutionIds: [],
});

export const CABLE_PULL_THROUGH = createExercise({
  nameEn: 'Cable Pull-Through',
  nameHe: 'משיכת כבל בין הרגליים',
  primaryMuscle: 'glutes',
  secondaryMuscles: ['hamstrings'],
  movementPattern: 'hip_hinge',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'stretched',
  isCompound: true,
  substitutionIds: [],
});

// ═══════════════════════════════════════════════════════════════════
// CALVES
// ═══════════════════════════════════════════════════════════════════

export const STANDING_CALF_RAISE = createExercise({
  nameEn: 'Standing Calf Raise',
  nameHe: 'הרמת עקבים בעמידה',
  primaryMuscle: 'calves',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['leg_machines'],
  musclePosition: 'stretched',  // Straight leg = gastrocnemius stretched
  isCompound: false,
  substitutionIds: [],
});

export const SEATED_CALF_RAISE = createExercise({
  nameEn: 'Seated Calf Raise',
  nameHe: 'הרמת עקבים בישיבה',
  primaryMuscle: 'calves',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['leg_machines'],
  musclePosition: 'neutral',  // Targets soleus (bent knee)
  isCompound: false,
  substitutionIds: [],
});

export const BODYWEIGHT_CALF_RAISE = createExercise({
  nameEn: 'Single-Leg Calf Raise (Bodyweight)',
  nameHe: 'הרמת עקבים חד-רגלית',
  primaryMuscle: 'calves',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['none'],
  musclePosition: 'stretched',
  isCompound: false,
  substitutionIds: [],
});

// ═══════════════════════════════════════════════════════════════════
// ABS / CORE
// ═══════════════════════════════════════════════════════════════════

export const CABLE_CRUNCH = createExercise({
  nameEn: 'Cable Crunch',
  nameHe: 'כפיפת בטן בכבל',
  primaryMuscle: 'abs',
  secondaryMuscles: [],
  movementPattern: 'core',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'stretched',
  isCompound: false,
  substitutionIds: [],
});

export const HANGING_LEG_RAISE = createExercise({
  nameEn: 'Hanging Leg Raise',
  nameHe: 'הרמת רגליים בתליה',
  primaryMuscle: 'abs',
  secondaryMuscles: [],
  movementPattern: 'core',
  requiredEquipment: ['pull_up_bar'],
  musclePosition: 'stretched',
  isCompound: false,
  substitutionIds: [],
});

export const AB_WHEEL_ROLLOUT = createExercise({
  nameEn: 'Ab Wheel Rollout',
  nameHe: 'גלגל בטן',
  primaryMuscle: 'abs',
  secondaryMuscles: [],
  movementPattern: 'core',
  requiredEquipment: ['none'],  // Ab wheel is cheap and common
  musclePosition: 'stretched',
  isCompound: false,
  substitutionIds: [],
});

export const PLANK = createExercise({
  nameEn: 'Plank',
  nameHe: 'פלאנק',
  primaryMuscle: 'abs',
  secondaryMuscles: [],
  movementPattern: 'core',
  requiredEquipment: ['none'],
  musclePosition: 'neutral',
  isCompound: false,
  substitutionIds: [],
});

export const LYING_LEG_RAISE = createExercise({
  nameEn: 'Lying Leg Raise',
  nameHe: 'הרמת רגליים בשכיבה',
  primaryMuscle: 'abs',
  secondaryMuscles: [],
  movementPattern: 'core',
  requiredEquipment: ['none'],
  musclePosition: 'stretched',
  isCompound: false,
  substitutionIds: [],
});

export const MOUNTAIN_CLIMBER = createExercise({
  nameEn: 'Mountain Climber',
  nameHe: 'מטפס הרים',
  primaryMuscle: 'abs',
  secondaryMuscles: ['shoulders'],
  movementPattern: 'core',
  requiredEquipment: ['none'],
  musclePosition: 'neutral',
  isCompound: false,
  substitutionIds: [],
});

// ═══════════════════════════════════════════════════════════════════
// FULL EXERCISE CATALOG
// ═══════════════════════════════════════════════════════════════════

/** Complete exercise database — single source of truth */
export const EXERCISE_DATABASE: readonly ExerciseWithMeta[] = [
  // Chest
  BARBELL_BENCH_PRESS,
  INCLINE_DUMBBELL_PRESS,
  DUMBBELL_BENCH_PRESS,
  DUMBBELL_FLY,
  CABLE_CROSSOVER,
  PUSH_UP,
  MACHINE_CHEST_PRESS,
  DECLINE_PUSH_UP,
  BAND_CHEST_FLY,
  // Back
  BARBELL_ROW,
  SEATED_CABLE_ROW,
  DUMBBELL_ROW,
  LAT_PULLDOWN,
  PULL_UP,
  CABLE_PULLOVER,
  CHEST_SUPPORTED_ROW,
  T_BAR_ROW,
  INVERTED_ROW,
  BAND_PULL_APART,
  // Shoulders
  OVERHEAD_PRESS,
  DUMBBELL_SHOULDER_PRESS,
  PIKE_PUSH_UP,
  DUMBBELL_LATERAL_RAISE,
  CABLE_LATERAL_RAISE,
  BAND_LATERAL_RAISE,
  CABLE_REAR_DELT_FLY,
  FACE_PULL,
  REVERSE_DUMBBELL_FLY,
  BAND_FACE_PULL,
  // Biceps
  INCLINE_DUMBBELL_CURL,
  BARBELL_CURL,
  HAMMER_CURL,
  CABLE_CURL,
  PREACHER_CURL,
  CHIN_UP,
  BAND_CURL,
  BODYWEIGHT_BICEP_CURL,
  // Triceps
  OVERHEAD_TRICEP_EXTENSION,
  OVERHEAD_DUMBBELL_TRICEP_EXTENSION,
  SKULL_CRUSHER,
  TRICEP_PUSHDOWN,
  CLOSE_GRIP_BENCH_PRESS,
  DIAMOND_PUSH_UP,
  BENCH_DIP,
  BAND_TRICEP_PUSHDOWN,
  // Quads
  BARBELL_BACK_SQUAT,
  LEG_PRESS,
  BULGARIAN_SPLIT_SQUAT,
  GOBLET_SQUAT,
  LEG_EXTENSION,
  WALKING_LUNGE,
  HACK_SQUAT,
  BODYWEIGHT_SQUAT,
  PISTOL_SQUAT,
  STEP_UP,
  // Hamstrings
  ROMANIAN_DEADLIFT,
  DUMBBELL_RDL,
  SEATED_LEG_CURL,
  LYING_LEG_CURL,
  NORDIC_CURL,
  BARBELL_DEADLIFT,
  SINGLE_LEG_RDL,
  SLIDING_LEG_CURL,
  // Glutes
  HIP_THRUST,
  GLUTE_BRIDGE,
  SINGLE_LEG_GLUTE_BRIDGE,
  CABLE_PULL_THROUGH,
  // Calves
  STANDING_CALF_RAISE,
  SEATED_CALF_RAISE,
  BODYWEIGHT_CALF_RAISE,
  // Abs
  CABLE_CRUNCH,
  HANGING_LEG_RAISE,
  AB_WHEEL_ROLLOUT,
  PLANK,
  LYING_LEG_RAISE,
  MOUNTAIN_CLIMBER,
] as const;

// ── Lookup Helpers ─────────────────────────────────────────────────

/** Map of exercise ID → exercise for O(1) lookup */
export const EXERCISE_MAP = new Map<string, ExerciseWithMeta>(
  EXERCISE_DATABASE.map((ex) => [ex.id, ex]),
);

/** Get exercise by ID — throws if not found (dev error) */
export function getExerciseById(id: string): ExerciseWithMeta {
  const exercise = EXERCISE_MAP.get(id);
  if (!exercise) {
    throw new Error(`Exercise not found: ${id}. Check EXERCISE_DATABASE.`);
  }
  return exercise;
}

/** Get all exercises for a specific muscle group */
export function getExercisesByMuscle(muscle: MuscleGroup): readonly ExerciseWithMeta[] {
  return EXERCISE_DATABASE.filter(
    (ex) => ex.primaryMuscle === muscle,
  );
}

/**
 * Checks if the user has ALL equipment items required for an exercise.
 *
 * Example:
 *   Barbell Bench Press requires ['barbell', 'bench']
 *   User has ['dumbbells', 'bench', 'pull_up_bar']
 *   → Missing 'barbell' → returns false
 *
 *   Push-up requires ['none']
 *   → 'none' is always available → returns true
 */
export function canPerformExercise(
  exercise: ExerciseWithMeta,
  userEquipment: readonly EquipmentItem[],
): boolean {
  return exercise.requiredEquipment.every(
    (item) => item === 'none' || userEquipment.includes(item),
  );
}

/** Get exercises available with the user's specific equipment */
export function getExercisesForEquipment(
  userEquipment: readonly EquipmentItem[],
): readonly ExerciseWithMeta[] {
  return EXERCISE_DATABASE.filter((ex) => canPerformExercise(ex, userEquipment));
}

/** Get exercises for a muscle that match equipment AND prefer stretch position */
export function getBestExercisesForMuscle(
  muscle: MuscleGroup,
  userEquipment: readonly EquipmentItem[],
): readonly ExerciseWithMeta[] {
  const available = getExercisesForEquipment(userEquipment);
  const forMuscle = available.filter((ex) => ex.primaryMuscle === muscle);

  // Sort: stretch-position first, then compound before isolation
  return [...forMuscle].sort((a, b) => {
    const posOrder: Record<MusclePosition, number> = { stretched: 0, neutral: 1, shortened: 2 };
    const posDiff = posOrder[a.musclePosition] - posOrder[b.musclePosition];
    if (posDiff !== 0) return posDiff;

    // Compound before isolation
    if (a.isCompound && !b.isCompound) return -1;
    if (!a.isCompound && b.isCompound) return 1;

    return 0;
  });
}
