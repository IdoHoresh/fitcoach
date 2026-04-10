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

import type { Exercise, MuscleGroup } from '../types'
import type { EquipmentItem } from '../types/user'

// ── Exercise Position Tag ──────────────────────────────────────────
// Not part of the Exercise type (UI doesn't need it),
// but used internally by the workout generator for smart selection.

export type MusclePosition = 'stretched' | 'shortened' | 'neutral'

export interface ExerciseWithMeta extends Exercise {
  /** Does this exercise load the muscle in a stretched position? */
  readonly musclePosition: MusclePosition
  /** Is this a compound (multi-joint) or isolation (single-joint) movement? */
  readonly isCompound: boolean
}

// ── Helper to create exercises with type safety ────────────────────

let exerciseCounter = 0

function createExercise(
  params: Omit<ExerciseWithMeta, 'id' | 'instructions' | 'gifUrl'> & {
    instructions?: string
    gifUrl?: string | null
  },
): ExerciseWithMeta {
  exerciseCounter += 1
  return {
    ...params,
    id: `ex_${String(exerciseCounter).padStart(3, '0')}`,
    instructions: params.instructions ?? '',
    gifUrl: params.gifUrl ?? null,
  }
}

// ═══════════════════════════════════════════════════════════════════
// CHEST
// ═══════════════════════════════════════════════════════════════════

export const BARBELL_BENCH_PRESS = createExercise({
  nameEn: 'Barbell Bench Press',
  gifUrl: 'https://static.exercisedb.dev/media/EIeI8Vf.gif',
  nameHe: 'לחיצת חזה עם מוט',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  movementPattern: 'horizontal_push',
  requiredEquipment: ['barbell', 'bench'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. שכב על ספסל שטוח, רגליים על הרצפה, גב צמוד לספסל.\n2. אחוז במוט במרחק רחב מעט מהכתפיים.\n3. הורד את המוט לאט לכיוון אמצע החזה, מרפקים ב-45 מעלות.\n4. דחוף חזרה למעלה עד ליישור מלא של הידיים.',
  substitutionIds: [],
})

export const INCLINE_DUMBBELL_PRESS = createExercise({
  nameEn: 'Incline Dumbbell Press',
  gifUrl: 'https://static.exercisedb.dev/media/8eqjhOl.gif',
  nameHe: 'לחיצת חזה משופע עם דמבלים',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  movementPattern: 'horizontal_push',
  requiredEquipment: ['dumbbells', 'bench'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. כוונן ספסל לזווית 45 מעלות, שב עם גב צמוד.\n2. החזק דמבל בכל יד בגובה הכתפיים, כפות ידיים קדימה.\n3. דחוף את הדמבלים למעלה עד ליישור מלא.\n4. הורד לאט חזרה לגובה הכתפיים.',
  substitutionIds: [],
})

export const DUMBBELL_BENCH_PRESS = createExercise({
  nameEn: 'Dumbbell Bench Press',
  gifUrl: 'https://static.exercisedb.dev/media/SpYC0Kp.gif',
  nameHe: 'לחיצת חזה עם דמבלים',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  movementPattern: 'horizontal_push',
  requiredEquipment: ['dumbbells', 'bench'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. שכב על ספסל שטוח עם דמבל בכל יד.\n2. התחל עם ידיים מורמות מעל החזה, כפות ידיים קדימה.\n3. הורד את הדמבלים לצדדי החזה, מרפקים ב-90 מעלות.\n4. דחוף חזרה למעלה עד ליישור.',
  substitutionIds: [],
})

export const DUMBBELL_FLY = createExercise({
  nameEn: 'Dumbbell Fly',
  gifUrl: 'https://static.exercisedb.dev/media/yz9nUhF.gif',
  nameHe: 'פרפר עם דמבלים',
  primaryMuscle: 'chest',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['dumbbells', 'bench'],
  musclePosition: 'stretched',
  isCompound: false,
  instructions:
    '1. שכב על ספסל שטוח עם דמבל בכל יד, ידיים מורמות מעל החזה.\n2. כפות ידיים פונות פנימה, עיקול קל במרפקים.\n3. פתח את הידיים לצדדים בקשת רחבה עד לתחושת מתיחה בחזה.\n4. חזור לאט למעלה באותה קשת.',
  substitutionIds: [],
})

export const CABLE_CROSSOVER = createExercise({
  nameEn: 'Cable Crossover',
  gifUrl: 'https://static.exercisedb.dev/media/UKWTJWR.gif',
  nameHe: 'קרוסאובר בכבלים',
  primaryMuscle: 'chest',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'shortened',
  isCompound: false,
  instructions:
    '1. עמוד באמצע מכונת הכבלים, ידית בכל יד.\n2. רגליים ברוחב כתפיים, גוף מעט קדימה.\n3. משוך את הידיות כלפי מטה ופנימה עד שהידיים נפגשות מול הגוף.\n4. חזור לאט לעמדת ההתחלה.',
  substitutionIds: [],
})

export const PUSH_UP = createExercise({
  nameEn: 'Push-Up',
  gifUrl: 'https://static.exercisedb.dev/media/I4hDWkc.gif',
  nameHe: 'שכיבות סמיכה',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  movementPattern: 'horizontal_push',
  requiredEquipment: ['none'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. התחל בעמדת פלאנק עליון, ידיים מעט רחבות מהכתפיים.\n2. גוף ישר מהראש עד לרגליים, בטן מכווצת.\n3. הורד את החזה לכיוון הרצפה על ידי כיפוף המרפקים.\n4. דחוף חזרה למעלה עד ליישור.',
  substitutionIds: [],
})

export const MACHINE_CHEST_PRESS = createExercise({
  nameEn: 'Machine Chest Press',
  gifUrl: 'https://static.exercisedb.dev/media/DOoWcnA.gif',
  nameHe: 'לחיצת חזה במכונה',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  movementPattern: 'horizontal_push',
  requiredEquipment: ['leg_machines'], // gym machines category
  musclePosition: 'neutral',
  isCompound: true,
  instructions:
    '1. שב במכונה עם גב צמוד לריפוד.\n2. אחוז בידיות בגובה החזה, מרפקים ב-90 מעלות.\n3. דחוף קדימה עד ליישור מלא של הידיים.\n4. חזור לאט לעמדת ההתחלה.',
  substitutionIds: [],
})

export const DECLINE_PUSH_UP = createExercise({
  nameEn: 'Decline Push-Up (Feet Elevated)',
  gifUrl: 'https://static.exercisedb.dev/media/i5cEhka.gif',
  nameHe: 'שכיבות סמיכה עם רגליים מורמות',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  movementPattern: 'horizontal_push',
  requiredEquipment: ['none'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. הנח רגליים על משטח מוגבה (ספסל, מדרגה).\n2. ידיים על הרצפה מעט רחבות מהכתפיים.\n3. הורד את החזה לכיוון הרצפה, גוף ישר.\n4. דחוף חזרה למעלה.',
  substitutionIds: [],
})

export const BAND_CHEST_FLY = createExercise({
  nameEn: 'Resistance Band Chest Fly',
  nameHe: 'פרפר חזה עם גומיה',
  primaryMuscle: 'chest',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['resistance_bands'],
  musclePosition: 'stretched',
  isCompound: false,
  instructions:
    '1. עגן גומיה מאחורי הגב בגובה החזה.\n2. אחוז בקצוות הגומיה, ידיים לצדדים.\n3. משוך את הידיים קדימה ופנימה עד שנפגשות.\n4. חזור לאט לעמדת ההתחלה.',
  substitutionIds: [],
})

// ═══════════════════════════════════════════════════════════════════
// BACK
// ═══════════════════════════════════════════════════════════════════

export const BARBELL_ROW = createExercise({
  nameEn: 'Barbell Row',
  gifUrl: 'https://static.exercisedb.dev/media/eZyBC3j.gif',
  nameHe: 'חתירה עם מוט',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps'],
  movementPattern: 'horizontal_pull',
  requiredEquipment: ['barbell'],
  musclePosition: 'neutral',
  isCompound: true,
  instructions:
    '1. עמוד עם רגליים ברוחב כתפיים, ברכיים מעט כפופות.\n2. התכופף קדימה מהמותניים, גב ישר.\n3. אחוז במוט ומשוך כלפי מעלה לכיוון הבטן התחתונה.\n4. לחץ את עצמות הכתף יחד בשיא, ואז הורד לאט.',
  substitutionIds: [],
})

export const SEATED_CABLE_ROW = createExercise({
  nameEn: 'Seated Cable Row',
  gifUrl: 'https://static.exercisedb.dev/media/fUBheHs.gif',
  nameHe: 'חתירה בישיבה בכבל',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps'],
  movementPattern: 'horizontal_pull',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. שב במכונת הכבל, רגליים על המשענת, ברכיים מעט כפופות.\n2. אחוז בידית, גב ישר, כתפיים לאחור.\n3. משוך את הידית לכיוון הבטן, לחץ את עצמות הכתף.\n4. חזור לאט לעמדת ההתחלה.',
  substitutionIds: [],
})

export const DUMBBELL_ROW = createExercise({
  nameEn: 'Single-Arm Dumbbell Row',
  gifUrl: 'https://static.exercisedb.dev/media/BJ0Hz5L.gif',
  nameHe: 'חתירה חד-צדדית עם דמבל',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps'],
  movementPattern: 'horizontal_pull',
  requiredEquipment: ['dumbbells'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. הנח יד וברך אחת על ספסל לתמיכה.\n2. החזק דמבל ביד השנייה, זרוע מושטת למטה.\n3. משוך את הדמבל כלפי מעלה לצד המותן.\n4. הורד לאט חזרה למטה.',
  substitutionIds: [],
})

export const LAT_PULLDOWN = createExercise({
  nameEn: 'Lat Pulldown',
  gifUrl: 'https://static.exercisedb.dev/media/qdRxqCj.gif',
  nameHe: 'משיכה עליונה',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps'],
  movementPattern: 'vertical_pull',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. שב במכונה, ירכיים מתחת לריפוד, רגליים שטוחות.\n2. אחוז במוט באחיזה רחבה מהכתפיים.\n3. משוך את המוט כלפי מטה לכיוון החזה העליון.\n4. חזור לאט למעלה עד ליישור מלא.',
  substitutionIds: [],
})

export const PULL_UP = createExercise({
  nameEn: 'Pull-Up',
  gifUrl: 'https://static.exercisedb.dev/media/lBDjFxJ.gif',
  nameHe: 'מתח',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps'],
  movementPattern: 'vertical_pull',
  requiredEquipment: ['pull_up_bar'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. אחוז במוט מתח, כפות ידיים קדימה, ידיים רחבות מהכתפיים.\n2. הימנע מנדנוד — בטן מכווצת.\n3. משוך את הגוף למעלה עד שהסנטר מעל המוט.\n4. הורד לאט חזרה ליישור מלא.',
  substitutionIds: [],
})

export const CABLE_PULLOVER = createExercise({
  nameEn: 'Cable Pullover',
  gifUrl: 'https://static.exercisedb.dev/media/Q2Eu1Ax.gif',
  nameHe: 'פול אובר בכבל',
  primaryMuscle: 'back',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'stretched',
  isCompound: false,
  instructions:
    '1. חבר חבל למכונת כבל בגובה גבוה.\n2. עמוד מול המכונה, ידיים ישרות מעל הראש.\n3. משוך את החבל כלפי מטה בקשת עד לירכיים.\n4. חזור לאט למעלה.',
  substitutionIds: [],
})

export const CHEST_SUPPORTED_ROW = createExercise({
  nameEn: 'Chest-Supported Dumbbell Row',
  gifUrl: 'https://static.exercisedb.dev/media/7vG5o25.gif',
  nameHe: 'חתירה עם תמיכת חזה',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps'],
  movementPattern: 'horizontal_pull',
  requiredEquipment: ['dumbbells', 'bench'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. כוונן ספסל ל-45 מעלות, שכב עם החזה על הספסל.\n2. החזק דמבל בכל יד, זרועות תלויות למטה.\n3. משוך את הדמבלים כלפי מעלה, לחץ עצמות כתף.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const T_BAR_ROW = createExercise({
  nameEn: 'T-Bar Row',
  gifUrl: 'https://static.exercisedb.dev/media/8d8qJQI.gif',
  nameHe: 'חתירת טי-בר',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps'],
  movementPattern: 'horizontal_pull',
  requiredEquipment: ['barbell'],
  musclePosition: 'neutral',
  isCompound: true,
  instructions:
    '1. עמוד מעל מוט הטי-בר, רגליים ברוחב כתפיים.\n2. התכופף קדימה, גב ישר, אחוז בידית.\n3. משוך את המשקל לכיוון החזה.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const INVERTED_ROW = createExercise({
  nameEn: 'Inverted Row (Bodyweight)',
  gifUrl: 'https://static.exercisedb.dev/media/bZGHsAZ.gif',
  nameHe: 'חתירה הפוכה',
  primaryMuscle: 'back',
  secondaryMuscles: ['biceps'],
  movementPattern: 'horizontal_pull',
  requiredEquipment: ['none'], // Can use a sturdy table edge or low bar
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. שכב מתחת למוט בגובה המותניים.\n2. אחוז במוט באחיזה רחבה, גוף ישר.\n3. משוך את החזה כלפי מעלה לכיוון המוט.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const BAND_PULL_APART = createExercise({
  nameEn: 'Band Pull-Apart',
  nameHe: 'משיכת גומיה',
  primaryMuscle: 'back',
  secondaryMuscles: ['shoulders'],
  movementPattern: 'horizontal_pull',
  requiredEquipment: ['resistance_bands'],
  musclePosition: 'neutral',
  isCompound: false,
  instructions:
    '1. אחוז בגומיה מול החזה, ידיים ישרות, ברוחב כתפיים.\n2. משוך את הגומיה לצדדים על ידי פתיחת הידיים.\n3. לחץ את עצמות הכתף יחד בשיא.\n4. חזור לאט לעמדת ההתחלה.',
  substitutionIds: [],
})

// ═══════════════════════════════════════════════════════════════════
// SHOULDERS
// ═══════════════════════════════════════════════════════════════════

export const OVERHEAD_PRESS = createExercise({
  nameEn: 'Overhead Press (Barbell)',
  gifUrl: 'https://static.exercisedb.dev/media/kTbSH9h.gif',
  nameHe: 'לחיצת כתפיים עם מוט',
  primaryMuscle: 'shoulders',
  secondaryMuscles: ['triceps'],
  movementPattern: 'vertical_push',
  requiredEquipment: ['barbell'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. עמוד עם רגליים ברוחב כתפיים, אחוז במוט בגובה הכתפיים.\n2. בטן מכווצת, גב ישר.\n3. דחוף את המוט ישר למעלה מעל הראש.\n4. הורד לאט חזרה לכתפיים.',
  substitutionIds: [],
})

export const DUMBBELL_SHOULDER_PRESS = createExercise({
  nameEn: 'Dumbbell Shoulder Press',
  gifUrl: 'https://static.exercisedb.dev/media/84RyJf8.gif',
  nameHe: 'לחיצת כתפיים עם דמבלים',
  primaryMuscle: 'shoulders',
  secondaryMuscles: ['triceps'],
  movementPattern: 'vertical_push',
  requiredEquipment: ['dumbbells'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. שב או עמוד עם דמבל בכל יד בגובה הכתפיים.\n2. כפות ידיים קדימה, מרפקים ב-90 מעלות.\n3. דחוף למעלה עד ליישור מלא מעל הראש.\n4. הורד לאט חזרה לכתפיים.',
  substitutionIds: [],
})

export const PIKE_PUSH_UP = createExercise({
  nameEn: 'Pike Push-Up',
  nameHe: 'שכיבות סמיכה פייק',
  primaryMuscle: 'shoulders',
  secondaryMuscles: ['triceps'],
  movementPattern: 'vertical_push',
  requiredEquipment: ['none'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. עמדת שכיבות סמיכה עם ישבן מורם גבוה — צורת V הפוך.\n2. ידיים ברוחב כתפיים, ראש בין הזרועות.\n3. כופף מרפקים והורד את הראש לכיוון הרצפה.\n4. דחוף חזרה למעלה.',
  substitutionIds: [],
})

export const DUMBBELL_LATERAL_RAISE = createExercise({
  nameEn: 'Dumbbell Lateral Raise',
  gifUrl: 'https://static.exercisedb.dev/media/DsgkuIt.gif',
  nameHe: 'הרמה צידית עם דמבלים',
  primaryMuscle: 'shoulders',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['dumbbells'],
  musclePosition: 'shortened',
  isCompound: false,
  instructions:
    '1. עמוד עם דמבל בכל יד לצד הגוף.\n2. גב ישר, עיקול קל במרפקים.\n3. הרם את הידיים לצדדים עד לגובה הכתפיים.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const CABLE_LATERAL_RAISE = createExercise({
  nameEn: 'Cable Lateral Raise',
  gifUrl: 'https://static.exercisedb.dev/media/goJ6ezq.gif',
  nameHe: 'הרמה צידית בכבל',
  primaryMuscle: 'shoulders',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'shortened',
  isCompound: false,
  instructions:
    '1. עמוד בצד מכונת הכבל, אחוז בידית ביד הרחוקה.\n2. יד ישרה עם עיקול קל במרפק.\n3. הרם את היד לצד עד לגובה הכתף.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const BAND_LATERAL_RAISE = createExercise({
  nameEn: 'Resistance Band Lateral Raise',
  nameHe: 'הרמה צידית עם גומיה',
  primaryMuscle: 'shoulders',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['resistance_bands'],
  musclePosition: 'shortened',
  isCompound: false,
  instructions:
    '1. עמוד על אמצע הגומיה, אחוז בקצוות.\n2. ידיים לצדי הגוף, עיקול קל במרפקים.\n3. הרם לצדדים עד גובה הכתפיים.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const CABLE_REAR_DELT_FLY = createExercise({
  nameEn: 'Cable Rear Delt Fly',
  nameHe: 'פרפר אחורי בכבל',
  primaryMuscle: 'shoulders',
  secondaryMuscles: ['back'],
  movementPattern: 'isolation',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'stretched',
  isCompound: false,
  instructions:
    '1. עמוד מול מכונת כבלים כפולה, אחוז בידיות מוצלבות.\n2. ידיים ישרות מולך בגובה הכתפיים.\n3. פתח את הידיים לצדדים, לחץ עצמות כתף.\n4. חזור לאט לעמדת ההתחלה.',
  substitutionIds: [],
})

export const FACE_PULL = createExercise({
  nameEn: 'Face Pull',
  nameHe: 'פייס פול',
  primaryMuscle: 'shoulders',
  secondaryMuscles: ['back'],
  movementPattern: 'isolation',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'stretched',
  isCompound: false,
  instructions:
    '1. חבר חבל לכבל גבוה, אחוז בשני קצוות.\n2. משוך לכיוון הפנים, מרפקים גבוהים ולצדדים.\n3. סובב ידיים החוצה בסוף התנועה.\n4. חזור לאט קדימה.',
  substitutionIds: [],
})

export const REVERSE_DUMBBELL_FLY = createExercise({
  nameEn: 'Reverse Dumbbell Fly',
  gifUrl: 'https://static.exercisedb.dev/media/EAs3xL9.gif',
  nameHe: 'פרפר הפוך עם דמבלים',
  primaryMuscle: 'shoulders',
  secondaryMuscles: ['back'],
  movementPattern: 'isolation',
  requiredEquipment: ['dumbbells'],
  musclePosition: 'stretched',
  isCompound: false,
  instructions:
    '1. התכופף קדימה מהמותניים, גב ישר, דמבל בכל יד.\n2. ידיים תלויות למטה, כפות ידיים פנימה.\n3. הרם את הידיים לצדדים, לחץ עצמות כתף.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const BAND_FACE_PULL = createExercise({
  nameEn: 'Band Face Pull',
  nameHe: 'פייס פול עם גומיה',
  primaryMuscle: 'shoulders',
  secondaryMuscles: ['back'],
  movementPattern: 'isolation',
  requiredEquipment: ['resistance_bands'],
  musclePosition: 'stretched',
  isCompound: false,
  instructions:
    '1. עגן גומיה בגובה הפנים.\n2. אחוז בשני קצוות ומשוך לכיוון הפנים.\n3. מרפקים גבוהים, סובב ידיים החוצה.\n4. חזור לאט קדימה.',
  substitutionIds: [],
})

// ═══════════════════════════════════════════════════════════════════
// BICEPS
// ═══════════════════════════════════════════════════════════════════

export const INCLINE_DUMBBELL_CURL = createExercise({
  nameEn: 'Incline Dumbbell Curl',
  gifUrl: 'https://static.exercisedb.dev/media/ae9UoXQ.gif',
  nameHe: 'כיפוף על ספסל משופע עם דמבלים',
  primaryMuscle: 'biceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['dumbbells', 'bench'],
  musclePosition: 'stretched', // Shoulder extended = bicep long head stretched
  isCompound: false,
  instructions:
    '1. שב על ספסל משופע ל-45 מעלות, דמבל בכל יד.\n2. ידיים תלויות למטה, כפות ידיים קדימה.\n3. כופף את המרפקים והרם את הדמבלים לכתפיים.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const BARBELL_CURL = createExercise({
  nameEn: 'Barbell Curl',
  gifUrl: 'https://static.exercisedb.dev/media/25GPyDY.gif',
  nameHe: 'כיפוף עם מוט',
  primaryMuscle: 'biceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['barbell'],
  musclePosition: 'neutral',
  isCompound: false,
  instructions:
    '1. עמוד עם רגליים ברוחב כתפיים, אחוז במוט באחיזת שוקת.\n2. מרפקים צמודים לגוף.\n3. כופף מרפקים והרם את המוט לכתפיים.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const HAMMER_CURL = createExercise({
  nameEn: 'Hammer Curl',
  gifUrl: 'https://static.exercisedb.dev/media/slDvUAU.gif',
  nameHe: 'כיפוף פטיש',
  primaryMuscle: 'biceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['dumbbells'],
  musclePosition: 'neutral',
  isCompound: false,
  instructions:
    '1. עמוד עם דמבל בכל יד, כפות ידיים פונות פנימה.\n2. מרפקים צמודים לגוף.\n3. כופף מרפקים והרם — כפות ידיים נשארות פונות פנימה.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const CABLE_CURL = createExercise({
  nameEn: 'Cable Curl',
  gifUrl: 'https://static.exercisedb.dev/media/G08RZcQ.gif',
  nameHe: 'כיפוף בכבל',
  primaryMuscle: 'biceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'neutral',
  isCompound: false,
  instructions:
    '1. עמוד מול מכונת כבל תחתונה, אחוז במוט.\n2. מרפקים צמודים לגוף, כפות ידיים למעלה.\n3. כופף מרפקים והרם לכתפיים.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const PREACHER_CURL = createExercise({
  nameEn: 'Preacher Curl',
  gifUrl: 'https://static.exercisedb.dev/media/jivWf8n.gif',
  nameHe: 'כיפוף סקוט',
  primaryMuscle: 'biceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['dumbbells', 'bench'],
  musclePosition: 'shortened',
  isCompound: false,
  instructions:
    '1. שב בכיסא סקוט, זרועות עליונות על הריפוד.\n2. אחוז בדמבלים, כפות ידיים למעלה.\n3. כופף מרפקים והרם לכתפיים.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const CHIN_UP = createExercise({
  nameEn: 'Chin-Up (Underhand Grip)',
  gifUrl: 'https://static.exercisedb.dev/media/T2mxWqc.gif',
  nameHe: 'מתח אחיזה הפוכה',
  primaryMuscle: 'biceps',
  secondaryMuscles: ['back'],
  movementPattern: 'vertical_pull',
  requiredEquipment: ['pull_up_bar'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. אחוז במוט מתח, כפות ידיים לכיוונך, ברוחב כתפיים.\n2. בטן מכווצת, גוף ישר.\n3. משוך למעלה עד שהסנטר מעל המוט.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const BAND_CURL = createExercise({
  nameEn: 'Resistance Band Curl',
  nameHe: 'כיפוף עם גומיה',
  primaryMuscle: 'biceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['resistance_bands'],
  musclePosition: 'neutral',
  isCompound: false,
  instructions:
    '1. עמוד על אמצע הגומיה, אחוז בקצוות.\n2. מרפקים צמודים לגוף.\n3. כופף מרפקים והרם ידיים לכתפיים.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const BODYWEIGHT_BICEP_CURL = createExercise({
  nameEn: 'Self-Resisted Bicep Curl',
  nameHe: 'כיפוף יד עם התנגדות עצמית',
  primaryMuscle: 'biceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['none'], // One arm resists the other, or use a towel
  musclePosition: 'neutral',
  isCompound: false,
  instructions:
    '1. שים יד אחת על פרק כף היד השנייה.\n2. כופף את היד התחתונה כלפי מעלה.\n3. היד העליונה מספקת התנגדות כלפי מטה.\n4. החלף ידיים.',
  substitutionIds: [],
})

// ═══════════════════════════════════════════════════════════════════
// TRICEPS
// ═══════════════════════════════════════════════════════════════════

export const OVERHEAD_TRICEP_EXTENSION = createExercise({
  nameEn: 'Overhead Tricep Extension (Cable)',
  gifUrl: 'https://static.exercisedb.dev/media/2IxROQ1.gif',
  nameHe: 'פשיטת טרייספס מעל הראש בכבל',
  primaryMuscle: 'triceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'stretched', // Shoulder flexed = long head stretched
  isCompound: false,
  instructions:
    '1. חבר חבל לכבל גבוה, עמוד עם הגב למכונה.\n2. אחוז בחבל מעל הראש, מרפקים ליד האוזניים.\n3. ישר את הידיים קדימה ולמעלה.\n4. חזור לאט לעמדת ההתחלה.',
  substitutionIds: [],
})

export const OVERHEAD_DUMBBELL_TRICEP_EXTENSION = createExercise({
  nameEn: 'Overhead Dumbbell Tricep Extension',
  nameHe: 'פשיטת טרייספס מעל הראש עם דמבל',
  primaryMuscle: 'triceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['dumbbells'],
  musclePosition: 'stretched',
  isCompound: false,
  instructions:
    '1. שב או עמוד, אחוז בדמבל בשתי ידיים מעל הראש.\n2. מרפקים ליד האוזניים, ידיים ישרות למעלה.\n3. כופף מרפקים והורד את הדמבל מאחורי הראש.\n4. ישר חזרה למעלה.',
  substitutionIds: [],
})

export const SKULL_CRUSHER = createExercise({
  nameEn: 'Skull Crusher (EZ Bar)',
  gifUrl: 'https://static.exercisedb.dev/media/yRLPCLu.gif',
  nameHe: 'מוחץ גולגולות',
  primaryMuscle: 'triceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['barbell', 'bench'],
  musclePosition: 'stretched',
  isCompound: false,
  instructions:
    '1. שכב על ספסל, אחוז במוט EZ ידיים ישרות מעל החזה.\n2. כופף רק את המרפקים, הורד את המוט לכיוון המצח.\n3. זרועות עליונות נשארות במקום.\n4. ישר מרפקים חזרה למעלה.',
  substitutionIds: [],
})

export const TRICEP_PUSHDOWN = createExercise({
  nameEn: 'Tricep Pushdown (Cable)',
  gifUrl: 'https://static.exercisedb.dev/media/3ZflifB.gif',
  nameHe: 'פשיטת מרפקים בכבל',
  primaryMuscle: 'triceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'shortened',
  isCompound: false,
  instructions:
    '1. עמוד מול מכונת כבל עליונה, אחוז במוט.\n2. מרפקים צמודים לגוף, כפופים ב-90 מעלות.\n3. דחוף את המוט כלפי מטה עד ליישור מלא.\n4. חזור לאט למעלה.',
  substitutionIds: [],
})

export const CLOSE_GRIP_BENCH_PRESS = createExercise({
  nameEn: 'Close-Grip Bench Press',
  gifUrl: 'https://static.exercisedb.dev/media/J6Dx1Mu.gif',
  nameHe: 'לחיצת חזה במרחק צר',
  primaryMuscle: 'triceps',
  secondaryMuscles: ['chest'],
  movementPattern: 'horizontal_push',
  requiredEquipment: ['barbell', 'bench'],
  musclePosition: 'neutral',
  isCompound: true,
  instructions:
    '1. שכב על ספסל שטוח, אחוז במוט במרחק צר (כרוחב כתפיים).\n2. הורד את המוט לחזה, מרפקים צמודים לגוף.\n3. דחוף למעלה עד ליישור.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const DIAMOND_PUSH_UP = createExercise({
  nameEn: 'Diamond Push-Up',
  gifUrl: 'https://static.exercisedb.dev/media/soIB2rj.gif',
  nameHe: 'שכיבות סמיכה יהלום',
  primaryMuscle: 'triceps',
  secondaryMuscles: ['chest'],
  movementPattern: 'horizontal_push',
  requiredEquipment: ['none'],
  musclePosition: 'neutral',
  isCompound: true,
  instructions:
    '1. עמדת שכיבות סמיכה, אצבעות מרכיבות צורת יהלום.\n2. גוף ישר, בטן מכווצת.\n3. הורד את החזה לכיוון הידיים, מרפקים צמודים.\n4. דחוף חזרה למעלה.',
  substitutionIds: [],
})

export const BENCH_DIP = createExercise({
  nameEn: 'Bench Dip',
  gifUrl: 'https://static.exercisedb.dev/media/Wgbn9qo.gif',
  nameHe: 'דיפס על ספסל',
  primaryMuscle: 'triceps',
  secondaryMuscles: ['chest', 'shoulders'],
  movementPattern: 'isolation',
  requiredEquipment: ['none'], // Can use any elevated surface (chair, step)
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. שב על קצה ספסל, ידיים אוחזות בקצה.\n2. החלק את הישבן קדימה מהספסל.\n3. כופף מרפקים והורד את הגוף למטה.\n4. דחוף חזרה למעלה.',
  substitutionIds: [],
})

export const BAND_TRICEP_PUSHDOWN = createExercise({
  nameEn: 'Band Tricep Pushdown',
  nameHe: 'פשיטת מרפקים עם גומיה',
  primaryMuscle: 'triceps',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['resistance_bands'],
  musclePosition: 'shortened',
  isCompound: false,
  instructions:
    '1. עגן גומיה למעלה (מוט מתח, דלת).\n2. אחוז בקצוות, מרפקים צמודים לגוף.\n3. דחוף כלפי מטה עד ליישור.\n4. חזור לאט למעלה.',
  substitutionIds: [],
})

// ═══════════════════════════════════════════════════════════════════
// QUADS
// ═══════════════════════════════════════════════════════════════════

export const BARBELL_BACK_SQUAT = createExercise({
  nameEn: 'Barbell Back Squat',
  gifUrl: 'https://static.exercisedb.dev/media/qXTaZnJ.gif',
  nameHe: 'סקוואט עם מוט',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes', 'hamstrings'],
  movementPattern: 'squat',
  requiredEquipment: ['barbell', 'squat_rack'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. המוט על הגב העליון, רגליים ברוחב כתפיים.\n2. בטן מכווצת, חזה מורם.\n3. שב למטה כאילו יושב על כיסא — ירכיים מקבילות לרצפה.\n4. דחוף דרך העקבים חזרה למעלה.',
  substitutionIds: [],
})

export const LEG_PRESS = createExercise({
  nameEn: 'Leg Press',
  gifUrl: 'https://static.exercisedb.dev/media/10Z2DXU.gif',
  nameHe: 'לחיצת רגליים',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes'],
  movementPattern: 'squat',
  requiredEquipment: ['leg_machines'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. שב במכונה, רגליים על המשטח ברוחב כתפיים.\n2. גב צמוד לריפוד.\n3. כופף ברכיים והורד את המשטח לכיוונך.\n4. דחוף חזרה עד ליישור (אל תנעל ברכיים).',
  substitutionIds: [],
})

export const BULGARIAN_SPLIT_SQUAT = createExercise({
  nameEn: 'Bulgarian Split Squat',
  nameHe: 'סקוואט בולגרי',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes'],
  movementPattern: 'squat',
  requiredEquipment: ['dumbbells'], // Can also do bodyweight, but DB version is standard
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. עמוד עם גב לספסל, הנח רגל אחורית על הספסל.\n2. רגל קדמית צעד אחד קדימה.\n3. שב למטה עד שהירך הקדמית מקבילה לרצפה.\n4. דחוף דרך העקב חזרה למעלה.',
  substitutionIds: [],
})

export const GOBLET_SQUAT = createExercise({
  nameEn: 'Goblet Squat',
  gifUrl: 'https://static.exercisedb.dev/media/yn8yg1r.gif',
  nameHe: 'סקוואט גביע',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes'],
  movementPattern: 'squat',
  requiredEquipment: ['dumbbells'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. החזק דמבל אנכית מול החזה בשתי ידיים.\n2. רגליים ברוחב כתפיים, אצבעות מעט החוצה.\n3. שב למטה, ברכיים בכיוון האצבעות.\n4. דחוף דרך העקבים חזרה למעלה.',
  substitutionIds: [],
})

export const LEG_EXTENSION = createExercise({
  nameEn: 'Leg Extension',
  gifUrl: 'https://static.exercisedb.dev/media/my33uHU.gif',
  nameHe: 'יישור ברכיים',
  primaryMuscle: 'quads',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['leg_machines'],
  musclePosition: 'shortened',
  isCompound: false,
  instructions:
    '1. שב במכונה, גב צמוד, רגליים מתחת לריפוד.\n2. אחוז בידיות לתמיכה.\n3. ישר את הברכיים והרם את המשקל למעלה.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const WALKING_LUNGE = createExercise({
  nameEn: 'Walking Lunge',
  gifUrl: 'https://static.exercisedb.dev/media/RRWFUcw.gif',
  nameHe: 'מכרע הליכה',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes', 'hamstrings'],
  movementPattern: 'squat',
  requiredEquipment: ['none'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. עמוד זקוף, רגליים יחד.\n2. צעד קדימה ושב למטה — שתי הברכיים ב-90 מעלות.\n3. דחוף מהרגל הקדמית והעבר לצעד הבא.\n4. המשך הליכה קדימה.',
  substitutionIds: [],
})

export const HACK_SQUAT = createExercise({
  nameEn: 'Hack Squat',
  gifUrl: 'https://static.exercisedb.dev/media/Qa55kX1.gif',
  nameHe: 'האק סקוואט',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes'],
  movementPattern: 'squat',
  requiredEquipment: ['leg_machines'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. עמוד במכונה, כתפיים מתחת לריפוד, רגליים על המשטח.\n2. שחרר את הנעילה.\n3. כופף ברכיים ושב למטה.\n4. דחוף חזרה למעלה.',
  substitutionIds: [],
})

export const BODYWEIGHT_SQUAT = createExercise({
  nameEn: 'Bodyweight Squat',
  gifUrl: 'https://static.exercisedb.dev/media/BReCuOn.gif',
  nameHe: 'סקוואט ללא משקל',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes'],
  movementPattern: 'squat',
  requiredEquipment: ['none'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. עמוד עם רגליים ברוחב כתפיים.\n2. ידיים מושטות קדימה לאיזון.\n3. שב למטה כאילו יושב על כיסא.\n4. דחוף דרך העקבים חזרה למעלה.',
  substitutionIds: [],
})

export const PISTOL_SQUAT = createExercise({
  nameEn: 'Pistol Squat (Single-Leg)',
  gifUrl: 'https://static.exercisedb.dev/media/nqs5HGV.gif',
  nameHe: 'סקוואט חד-רגלי',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes'],
  movementPattern: 'squat',
  requiredEquipment: ['none'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. עמוד על רגל אחת, השנייה מושטת קדימה.\n2. ידיים קדימה לאיזון.\n3. שב למטה על הרגל העומדת, רגל מורמת ישרה.\n4. דחוף חזרה למעלה.',
  substitutionIds: [],
})

export const STEP_UP = createExercise({
  nameEn: 'Step-Up',
  gifUrl: 'https://static.exercisedb.dev/media/aXtJhlg.gif',
  nameHe: 'עלייה על משטח',
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes'],
  movementPattern: 'squat',
  requiredEquipment: ['none'], // Any elevated surface
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. עמוד מול משטח מוגבה (ספסל, מדרגה).\n2. הנח רגל אחת על המשטח.\n3. דחוף דרך העקב ועלה למעלה.\n4. הורד חזרה והחלף רגליים.',
  substitutionIds: [],
})

// ═══════════════════════════════════════════════════════════════════
// HAMSTRINGS
// ═══════════════════════════════════════════════════════════════════

export const ROMANIAN_DEADLIFT = createExercise({
  nameEn: 'Romanian Deadlift (RDL)',
  gifUrl: 'https://static.exercisedb.dev/media/wQ2c4XD.gif',
  nameHe: 'מתה רומני',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: ['glutes', 'back'],
  movementPattern: 'hip_hinge',
  requiredEquipment: ['barbell'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. עמוד עם מוט בידיים, רגליים ברוחב כתפיים.\n2. גב ישר, ברכיים מעט כפופות.\n3. התכופף קדימה מהמותניים, המוט גולש על הרגליים.\n4. עצור כשמרגישים מתיחה באחורי הירך, חזור למעלה.',
  substitutionIds: [],
})

export const DUMBBELL_RDL = createExercise({
  nameEn: 'Dumbbell Romanian Deadlift',
  gifUrl: 'https://static.exercisedb.dev/media/rR0LJzx.gif',
  nameHe: 'מתה רומני עם דמבלים',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: ['glutes', 'back'],
  movementPattern: 'hip_hinge',
  requiredEquipment: ['dumbbells'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. עמוד עם דמבלים בידיים, רגליים ברוחב כתפיים.\n2. גב ישר, ברכיים מעט כפופות.\n3. התכופף קדימה, דמבלים גולשים על הרגליים.\n4. עצור במתיחה, חזור למעלה.',
  substitutionIds: [],
})

export const SEATED_LEG_CURL = createExercise({
  nameEn: 'Seated Leg Curl',
  gifUrl: 'https://static.exercisedb.dev/media/Zg3XY7P.gif',
  nameHe: 'כפיפת ברכיים בישיבה',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['leg_machines'],
  musclePosition: 'stretched', // Hip flexed = hamstring stretched at proximal end
  isCompound: false,
  instructions:
    '1. שב במכונה, רגליים מעל הריפוד.\n2. גב צמוד, אחוז בידיות.\n3. כופף ברכיים ומשוך את הריפוד כלפי מטה ולאחור.\n4. חזור לאט לעמדת ההתחלה.',
  substitutionIds: [],
})

export const LYING_LEG_CURL = createExercise({
  nameEn: 'Lying Leg Curl',
  gifUrl: 'https://static.exercisedb.dev/media/17lJ1kr.gif',
  nameHe: 'כפיפת ברכיים בשכיבה',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['leg_machines'],
  musclePosition: 'neutral',
  isCompound: false,
  instructions:
    '1. שכב על הבטן במכונה, עקבים מתחת לריפוד.\n2. אחוז בידיות לתמיכה.\n3. כופף ברכיים והרם את הריפוד כלפי מעלה.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const NORDIC_CURL = createExercise({
  nameEn: 'Nordic Hamstring Curl',
  nameHe: 'כפיפה נורדית',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['none'], // Anchor feet under couch/partner
  musclePosition: 'stretched',
  isCompound: false,
  instructions:
    '1. כרע על הרצפה, מישהו מחזיק את העקבים (או עגן).\n2. גוף ישר מהברכיים עד הראש.\n3. הורד את הגוף לאט קדימה, נגד הכוח.\n4. תפוס את עצמך ודחוף חזרה למעלה.',
  substitutionIds: [],
})

export const BARBELL_DEADLIFT = createExercise({
  nameEn: 'Conventional Deadlift',
  gifUrl: 'https://static.exercisedb.dev/media/ila4NZS.gif',
  nameHe: 'דדליפט קונבנציונלי',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: ['glutes', 'back', 'quads'],
  movementPattern: 'hip_hinge',
  requiredEquipment: ['barbell'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. עמוד מעל המוט, רגליים ברוחב כתפיים.\n2. התכופף ואחוז במוט, גב ישר, חזה מורם.\n3. דחוף דרך העקבים והרם — ישר גוף לעמידה.\n4. הורד לאט חזרה לרצפה.',
  substitutionIds: [],
})

export const SINGLE_LEG_RDL = createExercise({
  nameEn: 'Single-Leg Romanian Deadlift',
  gifUrl: 'https://static.exercisedb.dev/media/gKozT8X.gif',
  nameHe: 'מתה רומני חד-רגלי',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: ['glutes', 'back'],
  movementPattern: 'hip_hinge',
  requiredEquipment: ['none'], // Bodyweight or with DB
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. עמוד על רגל אחת, דמבל ביד הנגדית.\n2. התכופף קדימה, הרגל האחורית מתרוממת לאחור.\n3. גב ישר, הורד את הדמבל לכיוון הרצפה.\n4. חזור לעמידה.',
  substitutionIds: [],
})

export const SLIDING_LEG_CURL = createExercise({
  nameEn: 'Sliding Leg Curl',
  nameHe: 'כפיפת ברכיים בגלישה',
  primaryMuscle: 'hamstrings',
  secondaryMuscles: ['glutes'],
  movementPattern: 'isolation',
  requiredEquipment: ['none'], // Towel on smooth floor or socks
  musclePosition: 'stretched',
  isCompound: false,
  instructions:
    '1. שכב על הגב, עקבים על מגבת (רצפה חלקה).\n2. הרם ישבן מהרצפה.\n3. החלק את העקבים קדימה עד ליישור רגליים.\n4. משוך חזרה לעמדת ההתחלה.',
  substitutionIds: [],
})

// ═══════════════════════════════════════════════════════════════════
// GLUTES
// ═══════════════════════════════════════════════════════════════════

export const HIP_THRUST = createExercise({
  nameEn: 'Barbell Hip Thrust',
  nameHe: "היפ ת'ראסט עם מוט",
  primaryMuscle: 'glutes',
  secondaryMuscles: ['hamstrings'],
  movementPattern: 'hip_hinge',
  requiredEquipment: ['barbell', 'bench'],
  musclePosition: 'shortened',
  isCompound: true,
  instructions:
    '1. שב על הרצפה, גב עליון נשען על ספסל, מוט על המותניים.\n2. רגליים ברוחב כתפיים, כפות רגליים שטוחות.\n3. דחוף מותניים למעלה עד שהגוף ישר מכתפיים לברכיים.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const GLUTE_BRIDGE = createExercise({
  nameEn: 'Glute Bridge',
  gifUrl: 'https://static.exercisedb.dev/media/aWedzZX.gif',
  nameHe: 'גשר ישבני',
  primaryMuscle: 'glutes',
  secondaryMuscles: ['hamstrings'],
  movementPattern: 'hip_hinge',
  requiredEquipment: ['none'],
  musclePosition: 'shortened',
  isCompound: true,
  instructions:
    '1. שכב על הגב, ברכיים כפופות, רגליים שטוחות על הרצפה.\n2. ידיים לצדדים.\n3. הרם ישבן למעלה, לחץ את הישבן בשיא.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const SINGLE_LEG_GLUTE_BRIDGE = createExercise({
  nameEn: 'Single-Leg Glute Bridge',
  nameHe: 'גשר ישבני חד-רגלי',
  primaryMuscle: 'glutes',
  secondaryMuscles: ['hamstrings'],
  movementPattern: 'hip_hinge',
  requiredEquipment: ['none'],
  musclePosition: 'shortened',
  isCompound: true,
  instructions:
    '1. שכב על הגב, רגל אחת כפופה על הרצפה, השנייה מורמת.\n2. דחוף דרך העקב והרם ישבן למעלה.\n3. לחץ ישבן בשיא.\n4. הורד לאט והחלף רגליים.',
  substitutionIds: [],
})

export const CABLE_PULL_THROUGH = createExercise({
  nameEn: 'Cable Pull-Through',
  gifUrl: 'https://static.exercisedb.dev/media/OM46QHm.gif',
  nameHe: 'משיכת כבל בין הרגליים',
  primaryMuscle: 'glutes',
  secondaryMuscles: ['hamstrings'],
  movementPattern: 'hip_hinge',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'stretched',
  isCompound: true,
  instructions:
    '1. עמוד עם גב למכונת כבל תחתונה, אחוז בחבל בין הרגליים.\n2. רגליים רחבות מהכתפיים.\n3. התכופף קדימה מהמותניים, גב ישר.\n4. דחוף מותניים קדימה וחזור לעמידה.',
  substitutionIds: [],
})

// ═══════════════════════════════════════════════════════════════════
// CALVES
// ═══════════════════════════════════════════════════════════════════

export const STANDING_CALF_RAISE = createExercise({
  nameEn: 'Standing Calf Raise',
  gifUrl: 'https://static.exercisedb.dev/media/ykUOVze.gif',
  nameHe: 'הרמת עקבים בעמידה',
  primaryMuscle: 'calves',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['leg_machines'],
  musclePosition: 'stretched', // Straight leg = gastrocnemius stretched
  isCompound: false,
  instructions:
    '1. עמוד במכונה, כתפיים מתחת לריפוד.\n2. כפות רגליים על הקצה, עקבים באוויר.\n3. הרם עקבים למעלה ככל שאפשר.\n4. הורד לאט חזרה למתיחה.',
  substitutionIds: [],
})

export const SEATED_CALF_RAISE = createExercise({
  nameEn: 'Seated Calf Raise',
  gifUrl: 'https://static.exercisedb.dev/media/bOOdeyc.gif',
  nameHe: 'הרמת עקבים בישיבה',
  primaryMuscle: 'calves',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['leg_machines'],
  musclePosition: 'neutral', // Targets soleus (bent knee)
  isCompound: false,
  instructions:
    '1. שב במכונה, ברכיים מתחת לריפוד.\n2. כפות רגליים על המשטח, עקבים באוויר.\n3. הרם עקבים למעלה.\n4. הורד לאט למתיחה.',
  substitutionIds: [],
})

export const BODYWEIGHT_CALF_RAISE = createExercise({
  nameEn: 'Single-Leg Calf Raise (Bodyweight)',
  gifUrl: 'https://static.exercisedb.dev/media/1kB3Wmk.gif',
  nameHe: 'הרמת עקבים חד-רגלית',
  primaryMuscle: 'calves',
  secondaryMuscles: [],
  movementPattern: 'isolation',
  requiredEquipment: ['none'],
  musclePosition: 'stretched',
  isCompound: false,
  instructions:
    '1. עמוד על קצה מדרגה על רגל אחת.\n2. יד על קיר לאיזון.\n3. הרם עקב למעלה ככל שאפשר.\n4. הורד לאט למטה מקצה המדרגה.',
  substitutionIds: [],
})

// ═══════════════════════════════════════════════════════════════════
// ABS / CORE
// ═══════════════════════════════════════════════════════════════════

export const CABLE_CRUNCH = createExercise({
  nameEn: 'Cable Crunch',
  gifUrl: 'https://static.exercisedb.dev/media/WW95auq.gif',
  nameHe: 'כפיפת בטן בכבל',
  primaryMuscle: 'abs',
  secondaryMuscles: [],
  movementPattern: 'core',
  requiredEquipment: ['cable_machine'],
  musclePosition: 'stretched',
  isCompound: false,
  instructions:
    '1. כרע מול מכונת כבל עליונה, אחוז בחבל מאחורי הראש.\n2. מרפקים ליד האוזניים.\n3. כופף את הגוף כלפי מטה, לחץ בטן.\n4. חזור לאט למעלה.',
  substitutionIds: [],
})

export const HANGING_LEG_RAISE = createExercise({
  nameEn: 'Hanging Leg Raise',
  gifUrl: 'https://static.exercisedb.dev/media/I3tsCnC.gif',
  nameHe: 'הרמת רגליים בתליה',
  primaryMuscle: 'abs',
  secondaryMuscles: [],
  movementPattern: 'core',
  requiredEquipment: ['pull_up_bar'],
  musclePosition: 'stretched',
  isCompound: false,
  instructions:
    '1. תלה ממוט מתח, ידיים ישרות.\n2. רגליים ישרות למטה.\n3. הרם רגליים ישרות קדימה עד למקביל לרצפה.\n4. הורד לאט חזרה.',
  substitutionIds: [],
})

export const AB_WHEEL_ROLLOUT = createExercise({
  nameEn: 'Ab Wheel Rollout',
  nameHe: 'גלגל בטן',
  primaryMuscle: 'abs',
  secondaryMuscles: [],
  movementPattern: 'core',
  requiredEquipment: ['none'], // Ab wheel is cheap and common
  musclePosition: 'stretched',
  isCompound: false,
  instructions:
    '1. כרע על הרצפה, אחוז בגלגל בטן.\n2. גלגל קדימה לאט, גוף מתארך.\n3. עצור לפני שהגב מתקמר.\n4. משוך חזרה לעמדת ההתחלה.',
  substitutionIds: [],
})

export const PLANK = createExercise({
  nameEn: 'Plank',
  gifUrl: 'https://static.exercisedb.dev/media/VBAWRPG.gif',
  nameHe: 'פלאנק',
  primaryMuscle: 'abs',
  secondaryMuscles: [],
  movementPattern: 'core',
  requiredEquipment: ['none'],
  musclePosition: 'neutral',
  isCompound: false,
  instructions:
    '1. שכב על הבטן, הנח אמות ידיים על הרצפה.\n2. הרם גוף — נשען על אמות ואצבעות רגליים.\n3. גוף ישר מראש עד עקבים, בטן מכווצת.\n4. החזק בעמדה.',
  substitutionIds: [],
})

export const LYING_LEG_RAISE = createExercise({
  nameEn: 'Lying Leg Raise',
  gifUrl: 'https://static.exercisedb.dev/media/UGhRD1A.gif',
  nameHe: 'הרמת רגליים בשכיבה',
  primaryMuscle: 'abs',
  secondaryMuscles: [],
  movementPattern: 'core',
  requiredEquipment: ['none'],
  musclePosition: 'stretched',
  isCompound: false,
  instructions:
    '1. שכב על הגב, ידיים לצדדים או מתחת לישבן.\n2. רגליים ישרות.\n3. הרם רגליים למעלה עד 90 מעלות.\n4. הורד לאט חזרה (אל תיגע ברצפה).',
  substitutionIds: [],
})

export const MOUNTAIN_CLIMBER = createExercise({
  nameEn: 'Mountain Climber',
  gifUrl: 'https://static.exercisedb.dev/media/RJgzwny.gif',
  nameHe: 'מטפסי הרים',
  primaryMuscle: 'abs',
  secondaryMuscles: ['shoulders'],
  movementPattern: 'core',
  requiredEquipment: ['none'],
  musclePosition: 'neutral',
  isCompound: false,
  instructions:
    '1. התחל בעמדת פלאנק עליון, ידיים מתחת לכתפיים.\n2. משוך ברך ימין לכיוון החזה.\n3. החלף — ברך שמאל קדימה, ימין חזרה.\n4. המשך בקצב מהיר, כמו ריצה במקום.',
  substitutionIds: [],
})

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
] as const

// ── Lookup Helpers ─────────────────────────────────────────────────

/** Map of exercise ID → exercise for O(1) lookup */
export const EXERCISE_MAP = new Map<string, ExerciseWithMeta>(
  EXERCISE_DATABASE.map((ex) => [ex.id, ex]),
)

/** Get exercise by ID — throws if not found (dev error) */
export function getExerciseById(id: string): ExerciseWithMeta {
  const exercise = EXERCISE_MAP.get(id)
  if (!exercise) {
    throw new Error(`Exercise not found: ${id}. Check EXERCISE_DATABASE.`)
  }
  return exercise
}

/** Get all exercises for a specific muscle group */
export function getExercisesByMuscle(muscle: MuscleGroup): readonly ExerciseWithMeta[] {
  return EXERCISE_DATABASE.filter((ex) => ex.primaryMuscle === muscle)
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
  return exercise.requiredEquipment.every((item) => item === 'none' || userEquipment.includes(item))
}

/** Get exercises available with the user's specific equipment */
export function getExercisesForEquipment(
  userEquipment: readonly EquipmentItem[],
): readonly ExerciseWithMeta[] {
  return EXERCISE_DATABASE.filter((ex) => canPerformExercise(ex, userEquipment))
}

/** Get exercises for a muscle that match equipment AND prefer stretch position */
export function getBestExercisesForMuscle(
  muscle: MuscleGroup,
  userEquipment: readonly EquipmentItem[],
): readonly ExerciseWithMeta[] {
  const available = getExercisesForEquipment(userEquipment)
  const forMuscle = available.filter((ex) => ex.primaryMuscle === muscle)

  // Sort: stretch-position first, then compound before isolation
  return [...forMuscle].sort((a, b) => {
    const posOrder: Record<MusclePosition, number> = { stretched: 0, neutral: 1, shortened: 2 }
    const posDiff = posOrder[a.musclePosition] - posOrder[b.musclePosition]
    if (posDiff !== 0) return posDiff

    // Compound before isolation
    if (a.isCompound && !b.isCompound) return -1
    if (!a.isCompound && b.isCompound) return 1

    return 0
  })
}
