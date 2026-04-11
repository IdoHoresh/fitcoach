/**
 * Maps a Tzameret food to a FoodCategory.
 * Pure function — no imports, no side effects.
 *
 * Rules applied in priority order:
 * 1. Hebrew keyword matching (most reliable — reflects what the food actually is)
 * 2. Macro ratio fallback (catches unlabelled high-protein/fat/carb items)
 * 3. Default: 'snacks'
 */

export type FoodCategory =
  | 'protein'
  | 'carbs'
  | 'vegetables'
  | 'fruits'
  | 'dairy'
  | 'fats'
  | 'snacks'
  | 'traditional'
  | 'restaurant'
  | 'custom'

const DAIRY_KEYWORDS = ['חלב', 'גבינה', 'יוגורט', 'קוטג', 'שמנת', 'גבינת']
const PROTEIN_KEYWORDS = ['עוף', 'הודו', 'בקר', 'כבש', 'דג', 'טונה', 'סלמון', 'ביצה', 'ביצים']
const CARB_KEYWORDS = [
  'אורז',
  'פסטה',
  'לחם',
  'פיתה',
  'קינואה',
  'בורגול',
  'קוסקוס',
  'תפוח אדמה',
  'לחמניה',
]
const VEG_KEYWORDS = [
  'חסה',
  'עגבנ',
  'מלפפון',
  'גזר',
  'ברוקולי',
  'כרוב',
  'פלפל',
  'קישוא',
  'שעועית ירוקה',
  'תרד',
  'סלרי',
  'כרובית',
]
const FRUIT_KEYWORDS = [
  'בננה',
  'תפוח ',
  'תפוח-',
  'אפרסק',
  'ענב',
  'תמר',
  'תות',
  'מנגו',
  'אבטיח',
  'מלון',
  'אננס',
  'קיווי',
  'דובדבן',
  'שזיף',
  'אגס',
  'תפוז',
  'לימון',
  'אשכולית',
]
const FAT_KEYWORDS = ['שמן', 'אבוקדו', 'אגוז', 'שקד', 'טחינה', 'חמאה', 'זית', 'אגוזי']
const TRADITIONAL_KEYWORDS = [
  'חומוס',
  'פלאפל',
  'שקשוקה',
  'שניצל',
  'בורקס',
  'שווארמה',
  'קובה',
  'מוסקה',
  'עדשים',
  "מג'דרה",
  'טבולה',
  'פסטל',
  'סמבוסק',
]

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw))
}

export function assignCategory(
  nameHe: string,
  protein: number,
  fat: number,
  carbs: number,
): FoodCategory {
  // Priority 1: keyword matching
  if (containsAny(nameHe, DAIRY_KEYWORDS)) return 'dairy'
  if (containsAny(nameHe, TRADITIONAL_KEYWORDS)) return 'traditional'
  if (containsAny(nameHe, PROTEIN_KEYWORDS)) return 'protein'
  if (containsAny(nameHe, CARB_KEYWORDS)) return 'carbs'
  if (containsAny(nameHe, VEG_KEYWORDS)) return 'vegetables'
  if (containsAny(nameHe, FRUIT_KEYWORDS)) return 'fruits'
  if (containsAny(nameHe, FAT_KEYWORDS)) return 'fats'

  // Priority 2: macro ratio fallback
  if (protein > 15) return 'protein'
  if (fat > 25) return 'fats'
  if (carbs > 40) return 'carbs'

  // Default
  return 'snacks'
}
