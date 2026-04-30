/**
 * Israeli Food Database — ~120 foods with accurate nutritional data.
 *
 * Every food has:
 * - Hebrew + English names
 * - Category for browsing/filtering
 * - Macros per 100g (base unit for all calculations)
 * - Common serving sizes for quick-add
 *
 * Macro sources:
 * - USDA FoodData Central (fdc.nal.usda.gov)
 * - Israeli Ministry of Health nutrition tables
 * - Manufacturer labels for Israeli-specific products
 *
 * The meal plan generator picks from this database to build
 * personalized daily plans that hit the user's macro targets.
 */

import type { FoodCategory, FoodItem, ServingSize, ServingUnit } from '../types'

// ── Helper ──────────────────────────────────────────────────────────

let foodCounter = 0

function createFood(params: Omit<FoodItem, 'id' | 'isUserCreated'>): FoodItem {
  foodCounter += 1
  return {
    ...params,
    id: `food_${String(foodCounter).padStart(3, '0')}`,
    isUserCreated: false,
  }
}

function serving(nameHe: string, nameEn: string, unit: ServingUnit, grams: number): ServingSize {
  return { nameHe, nameEn, unit, grams }
}

// ═══════════════════════════════════════════════════════════════════
// PROTEIN SOURCES (~20)
// ═══════════════════════════════════════════════════════════════════

export const CHICKEN_BREAST_RAW = createFood({
  nameHe: 'חזה עוף (נא)',
  nameEn: 'Chicken Breast (raw)',
  slug: 'chicken_breast_raw',
  category: 'protein',
  caloriesPer100g: 120,
  proteinPer100g: 23,
  fatPer100g: 2.6,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [
    serving('חזה אחד', 'One breast', 'piece', 200),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const CHICKEN_BREAST = createFood({
  nameHe: 'חזה עוף (מבושל)',
  nameEn: 'Chicken Breast (cooked)',
  slug: 'chicken_breast_cooked',
  category: 'protein',
  caloriesPer100g: 165,
  proteinPer100g: 31,
  fatPer100g: 3.6,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [
    serving('חזה אחד', 'One breast', 'piece', 170),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const CHICKEN_THIGH = createFood({
  nameHe: 'ירך עוף',
  nameEn: 'Chicken Thigh',
  category: 'protein',
  caloriesPer100g: 209,
  proteinPer100g: 26,
  fatPer100g: 10.9,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [
    serving('ירך אחת', 'One thigh', 'piece', 130),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const TURKEY_BREAST = createFood({
  nameHe: 'חזה הודו',
  nameEn: 'Turkey Breast',
  category: 'protein',
  caloriesPer100g: 135,
  proteinPer100g: 30,
  fatPer100g: 1,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [serving('פרוסה', 'Slice', 'piece', 30), serving('100 גרם', '100g', 'grams', 100)],
})

export const GROUND_TURKEY = createFood({
  nameHe: 'הודו טחון',
  nameEn: 'Ground Turkey',
  category: 'protein',
  caloriesPer100g: 170,
  proteinPer100g: 27,
  fatPer100g: 7,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [serving('100 גרם', '100g', 'grams', 100)],
})

export const EGGS = createFood({
  nameHe: 'ביצה',
  nameEn: 'Egg (whole)',
  slug: 'egg',
  category: 'protein',
  caloriesPer100g: 155,
  proteinPer100g: 13,
  fatPer100g: 11,
  carbsPer100g: 1.1,
  fiberPer100g: 0,
  servingSizes: [
    serving('ביצה אחת', 'One egg', 'piece', 50),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const EGG_WHITES = createFood({
  nameHe: 'חלבון ביצה',
  nameEn: 'Egg Whites',
  category: 'protein',
  caloriesPer100g: 52,
  proteinPer100g: 11,
  fatPer100g: 0.2,
  carbsPer100g: 0.7,
  fiberPer100g: 0,
  servingSizes: [
    serving('חלבון אחד', 'One white', 'piece', 33),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const CANNED_TUNA = createFood({
  nameHe: 'טונה בקופסה (במים)',
  nameEn: 'Canned Tuna (in water)',
  slug: 'tuna_water',
  category: 'protein',
  caloriesPer100g: 116,
  proteinPer100g: 26,
  fatPer100g: 1,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [
    serving('קופסה', 'One can', 'piece', 160),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const SALMON_RAW = createFood({
  nameHe: 'סלמון (נא)',
  nameEn: 'Salmon Fillet (raw)',
  category: 'protein',
  caloriesPer100g: 142,
  proteinPer100g: 20,
  fatPer100g: 6.3,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [
    serving('פילה', 'One fillet', 'piece', 170),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const SALMON = createFood({
  nameHe: 'סלמון (מבושל)',
  nameEn: 'Salmon Fillet (cooked)',
  category: 'protein',
  caloriesPer100g: 208,
  proteinPer100g: 20,
  fatPer100g: 13,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [
    serving('פילה', 'One fillet', 'piece', 150),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const TILAPIA = createFood({
  nameHe: 'טילאפיה',
  nameEn: 'Tilapia Fillet',
  category: 'protein',
  caloriesPer100g: 96,
  proteinPer100g: 20,
  fatPer100g: 1.7,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [
    serving('פילה', 'One fillet', 'piece', 130),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const BEEF_SIRLOIN_RAW = createFood({
  nameHe: 'סינטה בקר (נא)',
  nameEn: 'Beef Sirloin (raw)',
  category: 'protein',
  caloriesPer100g: 150,
  proteinPer100g: 22,
  fatPer100g: 7,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [
    serving('סטייק', 'One steak', 'piece', 230),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const BEEF_SIRLOIN = createFood({
  nameHe: 'סינטה בקר (מבושל)',
  nameEn: 'Beef Sirloin (cooked)',
  category: 'protein',
  caloriesPer100g: 190,
  proteinPer100g: 27,
  fatPer100g: 8.7,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [
    serving('סטייק', 'One steak', 'piece', 200),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const GROUND_BEEF = createFood({
  nameHe: 'בשר בקר טחון',
  nameEn: 'Ground Beef (90% lean)',
  category: 'protein',
  caloriesPer100g: 176,
  proteinPer100g: 26,
  fatPer100g: 10,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [serving('100 גרם', '100g', 'grams', 100)],
})

export const TOFU = createFood({
  nameHe: 'טופו',
  nameEn: 'Tofu (firm)',
  category: 'protein',
  caloriesPer100g: 144,
  proteinPer100g: 17,
  fatPer100g: 8.7,
  carbsPer100g: 2.8,
  fiberPer100g: 1,
  servingSizes: [
    serving('קוביה', 'One block', 'piece', 120),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const COTTAGE_5 = createFood({
  nameHe: 'קוטג׳ 5%',
  nameEn: 'Cottage Cheese 5%',
  slug: 'cottage_5pct',
  category: 'protein',
  caloriesPer100g: 98,
  proteinPer100g: 11,
  fatPer100g: 5,
  carbsPer100g: 2,
  fiberPer100g: 0,
  servingSizes: [
    serving('גביע', 'One container', 'piece', 250),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const COTTAGE_9 = createFood({
  nameHe: 'קוטג׳ 9%',
  nameEn: 'Cottage Cheese 9%',
  category: 'protein',
  caloriesPer100g: 130,
  proteinPer100g: 11,
  fatPer100g: 9,
  carbsPer100g: 2.5,
  fiberPer100g: 0,
  servingSizes: [
    serving('גביע', 'One container', 'piece', 250),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const GREEK_YOGURT = createFood({
  nameHe: 'יוגורט יווני',
  nameEn: 'Greek Yogurt (0%)',
  slug: 'greek_yogurt_0pct',
  category: 'protein',
  caloriesPer100g: 59,
  proteinPer100g: 10,
  fatPer100g: 0.4,
  carbsPer100g: 3.6,
  fiberPer100g: 0,
  servingSizes: [
    serving('גביע', 'One container', 'piece', 200),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const WHEY_PROTEIN = createFood({
  nameHe: 'אבקת חלבון מי גבינה',
  nameEn: 'Whey Protein Powder',
  category: 'protein',
  caloriesPer100g: 380,
  proteinPer100g: 75,
  fatPer100g: 5,
  carbsPer100g: 10,
  fiberPer100g: 0,
  servingSizes: [
    serving('סקופ', 'One scoop', 'piece', 30),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const LABNEH = createFood({
  nameHe: 'לבנה',
  nameEn: 'Labneh',
  category: 'protein',
  caloriesPer100g: 160,
  proteinPer100g: 8,
  fatPer100g: 12,
  carbsPer100g: 4,
  fiberPer100g: 0,
  servingSizes: [
    serving('כף', 'Tablespoon', 'tablespoon', 20),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const WHITE_CHEESE_5 = createFood({
  nameHe: 'גבינה לבנה 5%',
  nameEn: 'White Cheese 5%',
  slug: 'white_cheese_5pct',
  category: 'protein',
  caloriesPer100g: 89,
  proteinPer100g: 12,
  fatPer100g: 5,
  carbsPer100g: 1,
  fiberPer100g: 0,
  servingSizes: [
    serving('כף', 'Tablespoon', 'tablespoon', 20),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const BEEF_SHAWARMA = createFood({
  nameHe: 'שווארמה בקר',
  nameEn: 'Beef Shawarma',
  category: 'protein',
  caloriesPer100g: 215,
  proteinPer100g: 20,
  fatPer100g: 14,
  carbsPer100g: 2,
  fiberPer100g: 0,
  servingSizes: [
    serving('מנה', 'One serving', 'serving', 150),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

// ═══════════════════════════════════════════════════════════════════
// CARB SOURCES (~20)
// ═══════════════════════════════════════════════════════════════════

export const WHITE_RICE = createFood({
  nameHe: 'אורז לבן (מבושל)',
  nameEn: 'White Rice (cooked)',
  slug: 'rice_cooked',
  category: 'carbs',
  caloriesPer100g: 130,
  proteinPer100g: 2.7,
  fatPer100g: 0.3,
  carbsPer100g: 28,
  fiberPer100g: 0.4,
  servingSizes: [serving('כוס', 'One cup', 'cup', 185), serving('100 גרם', '100g', 'grams', 100)],
})

export const BROWN_RICE = createFood({
  nameHe: 'אורז חום (מבושל)',
  nameEn: 'Brown Rice (cooked)',
  category: 'carbs',
  caloriesPer100g: 123,
  proteinPer100g: 2.7,
  fatPer100g: 1,
  carbsPer100g: 26,
  fiberPer100g: 1.6,
  servingSizes: [serving('כוס', 'One cup', 'cup', 195), serving('100 גרם', '100g', 'grams', 100)],
})

export const WHOLE_WHEAT_PASTA = createFood({
  nameHe: 'פסטה מלאה (מבושלת)',
  nameEn: 'Whole Wheat Pasta (cooked)',
  category: 'carbs',
  caloriesPer100g: 124,
  proteinPer100g: 5,
  fatPer100g: 0.5,
  carbsPer100g: 27,
  fiberPer100g: 3.9,
  servingSizes: [serving('כוס', 'One cup', 'cup', 140), serving('100 גרם', '100g', 'grams', 100)],
})

export const REGULAR_PASTA = createFood({
  nameHe: 'פסטה (מבושלת)',
  nameEn: 'Pasta (cooked)',
  slug: 'pasta_cooked',
  category: 'carbs',
  caloriesPer100g: 131,
  proteinPer100g: 5,
  fatPer100g: 1.1,
  carbsPer100g: 25,
  fiberPer100g: 1.8,
  servingSizes: [serving('כוס', 'One cup', 'cup', 140), serving('100 גרם', '100g', 'grams', 100)],
})

export const PITA_BREAD = createFood({
  nameHe: 'פיתה לבנה',
  nameEn: 'Pita Bread (white)',
  slug: 'pita',
  category: 'carbs',
  caloriesPer100g: 275,
  proteinPer100g: 9,
  fatPer100g: 1.2,
  carbsPer100g: 55,
  fiberPer100g: 2.2,
  servingSizes: [
    serving('פיתה אחת', 'One pita', 'piece', 60),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const WHOLE_WHEAT_PITA = createFood({
  nameHe: 'פיתה מקמח מלא',
  nameEn: 'Whole Wheat Pita',
  category: 'carbs',
  caloriesPer100g: 266,
  proteinPer100g: 10,
  fatPer100g: 2,
  carbsPer100g: 53,
  fiberPer100g: 7,
  servingSizes: [
    serving('פיתה אחת', 'One pita', 'piece', 60),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const CHALLAH = createFood({
  nameHe: 'חלה',
  nameEn: 'Challah Bread',
  category: 'carbs',
  caloriesPer100g: 290,
  proteinPer100g: 8,
  fatPer100g: 5,
  carbsPer100g: 52,
  fiberPer100g: 2,
  servingSizes: [
    serving('פרוסה', 'One slice', 'piece', 45),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const WHITE_BREAD = createFood({
  nameHe: 'לחם לבן',
  nameEn: 'White Bread',
  slug: 'bread_white',
  category: 'carbs',
  caloriesPer100g: 265,
  proteinPer100g: 9,
  fatPer100g: 3.2,
  carbsPer100g: 49,
  fiberPer100g: 2.7,
  servingSizes: [
    serving('פרוסה', 'One slice', 'piece', 30),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const WHOLE_WHEAT_BREAD = createFood({
  nameHe: 'לחם מקמח מלא',
  nameEn: 'Whole Wheat Bread',
  category: 'carbs',
  caloriesPer100g: 252,
  proteinPer100g: 12,
  fatPer100g: 3.5,
  carbsPer100g: 43,
  fiberPer100g: 6,
  servingSizes: [
    serving('פרוסה', 'One slice', 'piece', 35),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const OATS = createFood({
  nameHe: 'שיבולת שועל',
  nameEn: 'Oats (dry)',
  slug: 'oatmeal_dry',
  category: 'carbs',
  caloriesPer100g: 389,
  proteinPer100g: 17,
  fatPer100g: 7,
  carbsPer100g: 66,
  fiberPer100g: 10,
  servingSizes: [
    serving('חצי כוס', 'Half cup', 'cup', 40),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const COUSCOUS = createFood({
  nameHe: 'קוסקוס (מבושל)',
  nameEn: 'Couscous (cooked)',
  category: 'carbs',
  caloriesPer100g: 112,
  proteinPer100g: 3.8,
  fatPer100g: 0.2,
  carbsPer100g: 23,
  fiberPer100g: 1.4,
  servingSizes: [serving('כוס', 'One cup', 'cup', 160), serving('100 גרם', '100g', 'grams', 100)],
})

export const BULGUR = createFood({
  nameHe: 'בורגול (מבושל)',
  nameEn: 'Bulgur (cooked)',
  category: 'carbs',
  caloriesPer100g: 83,
  proteinPer100g: 3.1,
  fatPer100g: 0.2,
  carbsPer100g: 19,
  fiberPer100g: 4.5,
  servingSizes: [serving('כוס', 'One cup', 'cup', 182), serving('100 גרם', '100g', 'grams', 100)],
})

export const SWEET_POTATO = createFood({
  nameHe: 'בטטה (מבושלת)',
  nameEn: 'Sweet Potato (cooked)',
  category: 'carbs',
  caloriesPer100g: 90,
  proteinPer100g: 2,
  fatPer100g: 0.1,
  carbsPer100g: 21,
  fiberPer100g: 3,
  servingSizes: [
    serving('בטטה בינונית', 'Medium sweet potato', 'piece', 150),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const POTATO = createFood({
  nameHe: 'תפוח אדמה (מבושל)',
  nameEn: 'Potato (boiled)',
  category: 'carbs',
  caloriesPer100g: 87,
  proteinPer100g: 1.9,
  fatPer100g: 0.1,
  carbsPer100g: 20,
  fiberPer100g: 1.8,
  servingSizes: [
    serving('תפוח אדמה בינוני', 'Medium potato', 'piece', 170),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const QUINOA = createFood({
  nameHe: 'קינואה (מבושלת)',
  nameEn: 'Quinoa (cooked)',
  category: 'carbs',
  caloriesPer100g: 120,
  proteinPer100g: 4.4,
  fatPer100g: 1.9,
  carbsPer100g: 21,
  fiberPer100g: 2.8,
  servingSizes: [serving('כוס', 'One cup', 'cup', 185), serving('100 גרם', '100g', 'grams', 100)],
})

export const RICE_CAKES = createFood({
  nameHe: 'פריכיות אורז',
  nameEn: 'Rice Cakes',
  category: 'carbs',
  caloriesPer100g: 387,
  proteinPer100g: 8,
  fatPer100g: 2.8,
  carbsPer100g: 82,
  fiberPer100g: 1.6,
  servingSizes: [
    serving('פריכית אחת', 'One cake', 'piece', 9),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const CORN = createFood({
  nameHe: 'תירס',
  nameEn: 'Sweet Corn (cooked)',
  category: 'carbs',
  caloriesPer100g: 96,
  proteinPer100g: 3.4,
  fatPer100g: 1.5,
  carbsPer100g: 21,
  fiberPer100g: 2.4,
  servingSizes: [serving('קלח', 'One ear', 'piece', 150), serving('100 גרם', '100g', 'grams', 100)],
})

export const LENTILS = createFood({
  nameHe: 'עדשים (מבושלות)',
  nameEn: 'Lentils (cooked)',
  category: 'carbs',
  caloriesPer100g: 116,
  proteinPer100g: 9,
  fatPer100g: 0.4,
  carbsPer100g: 20,
  fiberPer100g: 7.9,
  servingSizes: [serving('כוס', 'One cup', 'cup', 200), serving('100 גרם', '100g', 'grams', 100)],
})

export const LACHUCH = createFood({
  nameHe: 'לחוח',
  nameEn: 'Lachuch (Yemenite pancake)',
  category: 'carbs',
  caloriesPer100g: 220,
  proteinPer100g: 6,
  fatPer100g: 2,
  carbsPer100g: 44,
  fiberPer100g: 1.5,
  servingSizes: [
    serving('יחידה', 'One piece', 'piece', 80),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

// ═══════════════════════════════════════════════════════════════════
// VEGETABLES (~15)
// ═══════════════════════════════════════════════════════════════════

export const CUCUMBER = createFood({
  nameHe: 'מלפפון',
  nameEn: 'Cucumber',
  category: 'vegetables',
  caloriesPer100g: 16,
  proteinPer100g: 0.7,
  fatPer100g: 0.1,
  carbsPer100g: 3.6,
  fiberPer100g: 0.5,
  servingSizes: [
    serving('מלפפון אחד', 'One cucumber', 'piece', 120),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const TOMATO = createFood({
  nameHe: 'עגבנייה',
  nameEn: 'Tomato',
  slug: 'tomato',
  category: 'vegetables',
  caloriesPer100g: 18,
  proteinPer100g: 0.9,
  fatPer100g: 0.2,
  carbsPer100g: 3.9,
  fiberPer100g: 1.2,
  servingSizes: [
    serving('עגבנייה אחת', 'One tomato', 'piece', 125),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const BELL_PEPPER = createFood({
  nameHe: 'פלפל',
  nameEn: 'Bell Pepper',
  category: 'vegetables',
  caloriesPer100g: 31,
  proteinPer100g: 1,
  fatPer100g: 0.3,
  carbsPer100g: 6,
  fiberPer100g: 2.1,
  servingSizes: [
    serving('פלפל אחד', 'One pepper', 'piece', 120),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const LETTUCE = createFood({
  nameHe: 'חסה',
  nameEn: 'Lettuce',
  category: 'vegetables',
  caloriesPer100g: 15,
  proteinPer100g: 1.4,
  fatPer100g: 0.2,
  carbsPer100g: 2.9,
  fiberPer100g: 1.3,
  servingSizes: [
    serving('כוס קצוצה', 'One cup shredded', 'cup', 50),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const ONION = createFood({
  nameHe: 'בצל',
  nameEn: 'Onion',
  category: 'vegetables',
  caloriesPer100g: 40,
  proteinPer100g: 1.1,
  fatPer100g: 0.1,
  carbsPer100g: 9.3,
  fiberPer100g: 1.7,
  servingSizes: [
    serving('בצל בינוני', 'Medium onion', 'piece', 110),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const CARROT = createFood({
  nameHe: 'גזר',
  nameEn: 'Carrot',
  category: 'vegetables',
  caloriesPer100g: 41,
  proteinPer100g: 0.9,
  fatPer100g: 0.2,
  carbsPer100g: 10,
  fiberPer100g: 2.8,
  servingSizes: [
    serving('גזר אחד', 'One carrot', 'piece', 70),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const BROCCOLI = createFood({
  nameHe: 'ברוקולי',
  nameEn: 'Broccoli',
  category: 'vegetables',
  caloriesPer100g: 35,
  proteinPer100g: 2.8,
  fatPer100g: 0.4,
  carbsPer100g: 7,
  fiberPer100g: 2.6,
  servingSizes: [serving('כוס', 'One cup', 'cup', 90), serving('100 גרם', '100g', 'grams', 100)],
})

export const CAULIFLOWER = createFood({
  nameHe: 'כרובית',
  nameEn: 'Cauliflower',
  category: 'vegetables',
  caloriesPer100g: 25,
  proteinPer100g: 1.9,
  fatPer100g: 0.3,
  carbsPer100g: 5,
  fiberPer100g: 2,
  servingSizes: [serving('כוס', 'One cup', 'cup', 110), serving('100 גרם', '100g', 'grams', 100)],
})

export const ZUCCHINI = createFood({
  nameHe: 'קישוא',
  nameEn: 'Zucchini',
  category: 'vegetables',
  caloriesPer100g: 17,
  proteinPer100g: 1.2,
  fatPer100g: 0.3,
  carbsPer100g: 3.1,
  fiberPer100g: 1,
  servingSizes: [
    serving('קישוא אחד', 'One zucchini', 'piece', 200),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const SPINACH = createFood({
  nameHe: 'תרד',
  nameEn: 'Spinach',
  category: 'vegetables',
  caloriesPer100g: 23,
  proteinPer100g: 2.9,
  fatPer100g: 0.4,
  carbsPer100g: 3.6,
  fiberPer100g: 2.2,
  servingSizes: [serving('כוס', 'One cup', 'cup', 30), serving('100 גרם', '100g', 'grams', 100)],
})

export const CABBAGE = createFood({
  nameHe: 'כרוב',
  nameEn: 'Cabbage',
  category: 'vegetables',
  caloriesPer100g: 25,
  proteinPer100g: 1.3,
  fatPer100g: 0.1,
  carbsPer100g: 6,
  fiberPer100g: 2.5,
  servingSizes: [
    serving('כוס קצוצה', 'One cup shredded', 'cup', 90),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const EGGPLANT = createFood({
  nameHe: 'חציל',
  nameEn: 'Eggplant',
  category: 'vegetables',
  caloriesPer100g: 25,
  proteinPer100g: 1,
  fatPer100g: 0.2,
  carbsPer100g: 6,
  fiberPer100g: 3,
  servingSizes: [
    serving('חציל בינוני', 'Medium eggplant', 'piece', 300),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const MUSHROOMS = createFood({
  nameHe: 'פטריות',
  nameEn: 'Mushrooms',
  category: 'vegetables',
  caloriesPer100g: 22,
  proteinPer100g: 3.1,
  fatPer100g: 0.3,
  carbsPer100g: 3.3,
  fiberPer100g: 1,
  servingSizes: [
    serving('כוס פרוסות', 'One cup sliced', 'cup', 70),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const GREEN_BEANS = createFood({
  nameHe: 'שעועית ירוקה',
  nameEn: 'Green Beans',
  category: 'vegetables',
  caloriesPer100g: 31,
  proteinPer100g: 1.8,
  fatPer100g: 0.1,
  carbsPer100g: 7,
  fiberPer100g: 3.4,
  servingSizes: [serving('כוס', 'One cup', 'cup', 100), serving('100 גרם', '100g', 'grams', 100)],
})

export const BEET = createFood({
  nameHe: 'סלק',
  nameEn: 'Beet (cooked)',
  category: 'vegetables',
  caloriesPer100g: 44,
  proteinPer100g: 1.7,
  fatPer100g: 0.2,
  carbsPer100g: 10,
  fiberPer100g: 2,
  servingSizes: [
    serving('סלק בינוני', 'Medium beet', 'piece', 80),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

// ═══════════════════════════════════════════════════════════════════
// FRUITS (~10)
// ═══════════════════════════════════════════════════════════════════

export const BANANA = createFood({
  nameHe: 'בננה',
  nameEn: 'Banana',
  slug: 'banana',
  category: 'fruits',
  caloriesPer100g: 89,
  proteinPer100g: 1.1,
  fatPer100g: 0.3,
  carbsPer100g: 23,
  fiberPer100g: 2.6,
  servingSizes: [
    serving('בננה בינונית', 'Medium banana', 'piece', 120),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const APPLE = createFood({
  nameHe: 'תפוח',
  nameEn: 'Apple',
  slug: 'apple',
  category: 'fruits',
  caloriesPer100g: 52,
  proteinPer100g: 0.3,
  fatPer100g: 0.2,
  carbsPer100g: 14,
  fiberPer100g: 2.4,
  servingSizes: [
    serving('תפוח בינוני', 'Medium apple', 'piece', 180),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const ORANGE = createFood({
  nameHe: 'תפוז',
  nameEn: 'Orange',
  category: 'fruits',
  caloriesPer100g: 47,
  proteinPer100g: 0.9,
  fatPer100g: 0.1,
  carbsPer100g: 12,
  fiberPer100g: 2.4,
  servingSizes: [
    serving('תפוז בינוני', 'Medium orange', 'piece', 150),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const WATERMELON = createFood({
  nameHe: 'אבטיח',
  nameEn: 'Watermelon',
  category: 'fruits',
  caloriesPer100g: 30,
  proteinPer100g: 0.6,
  fatPer100g: 0.2,
  carbsPer100g: 8,
  fiberPer100g: 0.4,
  servingSizes: [
    serving('כוס קוביות', 'One cup diced', 'cup', 150),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const DATES_MEDJOOL = createFood({
  nameHe: 'תמר מג׳הול',
  nameEn: 'Medjool Date',
  category: 'fruits',
  caloriesPer100g: 277,
  proteinPer100g: 1.8,
  fatPer100g: 0.2,
  carbsPer100g: 75,
  fiberPer100g: 6.7,
  servingSizes: [
    serving('תמר אחד', 'One date', 'piece', 24),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const GRAPES = createFood({
  nameHe: 'ענבים',
  nameEn: 'Grapes',
  category: 'fruits',
  caloriesPer100g: 69,
  proteinPer100g: 0.7,
  fatPer100g: 0.2,
  carbsPer100g: 18,
  fiberPer100g: 0.9,
  servingSizes: [serving('כוס', 'One cup', 'cup', 150), serving('100 גרם', '100g', 'grams', 100)],
})

export const STRAWBERRIES = createFood({
  nameHe: 'תותים',
  nameEn: 'Strawberries',
  category: 'fruits',
  caloriesPer100g: 32,
  proteinPer100g: 0.7,
  fatPer100g: 0.3,
  carbsPer100g: 7.7,
  fiberPer100g: 2,
  servingSizes: [serving('כוס', 'One cup', 'cup', 150), serving('100 גרם', '100g', 'grams', 100)],
})

export const MANGO = createFood({
  nameHe: 'מנגו',
  nameEn: 'Mango',
  category: 'fruits',
  caloriesPer100g: 60,
  proteinPer100g: 0.8,
  fatPer100g: 0.4,
  carbsPer100g: 15,
  fiberPer100g: 1.6,
  servingSizes: [
    serving('מנגו בינוני', 'Medium mango', 'piece', 200),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const PERSIMMON = createFood({
  nameHe: 'אפרסמון',
  nameEn: 'Persimmon',
  category: 'fruits',
  caloriesPer100g: 70,
  proteinPer100g: 0.6,
  fatPer100g: 0.2,
  carbsPer100g: 19,
  fiberPer100g: 3.6,
  servingSizes: [
    serving('אפרסמון אחד', 'One persimmon', 'piece', 170),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const POMEGRANATE = createFood({
  nameHe: 'רימון',
  nameEn: 'Pomegranate Seeds',
  category: 'fruits',
  caloriesPer100g: 83,
  proteinPer100g: 1.7,
  fatPer100g: 1.2,
  carbsPer100g: 19,
  fiberPer100g: 4,
  servingSizes: [
    serving('חצי כוס גרעינים', 'Half cup seeds', 'cup', 87),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

// ═══════════════════════════════════════════════════════════════════
// DAIRY (~8)
// ═══════════════════════════════════════════════════════════════════

export const MILK_3 = createFood({
  nameHe: 'חלב 3%',
  nameEn: 'Milk 3%',
  slug: 'milk_3pct',
  category: 'dairy',
  caloriesPer100g: 60,
  proteinPer100g: 3.2,
  fatPer100g: 3,
  carbsPer100g: 4.8,
  fiberPer100g: 0,
  servingSizes: [serving('כוס', 'One cup', 'cup', 240), serving('100 מ״ל', '100ml', 'ml', 100)],
})

export const MILK_1 = createFood({
  nameHe: 'חלב 1%',
  nameEn: 'Milk 1%',
  category: 'dairy',
  caloriesPer100g: 42,
  proteinPer100g: 3.4,
  fatPer100g: 1,
  carbsPer100g: 5,
  fiberPer100g: 0,
  servingSizes: [serving('כוס', 'One cup', 'cup', 240), serving('100 מ״ל', '100ml', 'ml', 100)],
})

export const CHOCOLATE_MILK = createFood({
  nameHe: 'חלב שוקו',
  nameEn: 'Chocolate Milk',
  category: 'dairy',
  caloriesPer100g: 83,
  proteinPer100g: 3.2,
  fatPer100g: 2,
  carbsPer100g: 13,
  fiberPer100g: 0.5,
  servingSizes: [serving('כוס', 'One cup', 'cup', 240), serving('קרטון', 'Carton', 'piece', 250)],
})

export const LEBEN = createFood({
  nameHe: 'לבן',
  nameEn: 'Leben (fermented milk)',
  category: 'dairy',
  caloriesPer100g: 55,
  proteinPer100g: 3.5,
  fatPer100g: 1.5,
  carbsPer100g: 6,
  fiberPer100g: 0,
  servingSizes: [serving('כוס', 'One cup', 'cup', 200), serving('100 גרם', '100g', 'grams', 100)],
})

export const YELLOW_CHEESE = createFood({
  nameHe: 'גבינה צהובה 28%',
  nameEn: 'Yellow Cheese 28%',
  category: 'dairy',
  caloriesPer100g: 350,
  proteinPer100g: 25,
  fatPer100g: 28,
  carbsPer100g: 0.5,
  fiberPer100g: 0,
  servingSizes: [
    serving('פרוסה', 'One slice', 'piece', 25),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const BUTTER = createFood({
  nameHe: 'חמאה',
  nameEn: 'Butter',
  category: 'dairy',
  caloriesPer100g: 717,
  proteinPer100g: 0.9,
  fatPer100g: 81,
  carbsPer100g: 0.1,
  fiberPer100g: 0,
  servingSizes: [
    serving('כפית', 'One teaspoon', 'teaspoon', 5),
    serving('כף', 'One tablespoon', 'tablespoon', 14),
  ],
})

export const CREAM_CHEESE = createFood({
  nameHe: 'גבינת שמנת',
  nameEn: 'Cream Cheese',
  category: 'dairy',
  caloriesPer100g: 342,
  proteinPer100g: 6,
  fatPer100g: 34,
  carbsPer100g: 4,
  fiberPer100g: 0,
  servingSizes: [
    serving('כף', 'One tablespoon', 'tablespoon', 15),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const HALLOUMI = createFood({
  nameHe: 'חלומי',
  nameEn: 'Halloumi Cheese',
  category: 'dairy',
  caloriesPer100g: 321,
  proteinPer100g: 22,
  fatPer100g: 25,
  carbsPer100g: 2,
  fiberPer100g: 0,
  servingSizes: [
    serving('פרוסה', 'One slice', 'piece', 30),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

// ═══════════════════════════════════════════════════════════════════
// FATS (~10)
// ═══════════════════════════════════════════════════════════════════

export const OLIVE_OIL = createFood({
  nameHe: 'שמן זית',
  nameEn: 'Olive Oil',
  slug: 'olive_oil',
  category: 'fats',
  caloriesPer100g: 884,
  proteinPer100g: 0,
  fatPer100g: 100,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [
    serving('כף', 'One tablespoon', 'tablespoon', 14),
    serving('כפית', 'One teaspoon', 'teaspoon', 5),
  ],
})

export const TAHINI = createFood({
  nameHe: 'טחינה גולמית',
  nameEn: 'Raw Tahini',
  slug: 'tahini',
  category: 'fats',
  caloriesPer100g: 595,
  proteinPer100g: 17,
  fatPer100g: 54,
  carbsPer100g: 21,
  fiberPer100g: 9,
  servingSizes: [
    serving('כף', 'One tablespoon', 'tablespoon', 15),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const TAHINI_PREPARED = createFood({
  nameHe: 'טחינה מוכנה',
  nameEn: 'Prepared Tahini (diluted)',
  category: 'fats',
  caloriesPer100g: 260,
  proteinPer100g: 8,
  fatPer100g: 22,
  carbsPer100g: 10,
  fiberPer100g: 3,
  servingSizes: [
    serving('כף', 'One tablespoon', 'tablespoon', 15),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const AVOCADO = createFood({
  nameHe: 'אבוקדו',
  nameEn: 'Avocado',
  slug: 'avocado',
  category: 'fats',
  caloriesPer100g: 160,
  proteinPer100g: 2,
  fatPer100g: 15,
  carbsPer100g: 9,
  fiberPer100g: 7,
  servingSizes: [
    serving('חצי אבוקדו', 'Half avocado', 'piece', 75),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const ALMONDS = createFood({
  nameHe: 'שקדים',
  nameEn: 'Almonds',
  slug: 'almonds',
  category: 'fats',
  caloriesPer100g: 579,
  proteinPer100g: 21,
  fatPer100g: 50,
  carbsPer100g: 22,
  fiberPer100g: 12,
  servingSizes: [
    serving('קומץ', 'One handful', 'piece', 25),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const PEANUTS = createFood({
  nameHe: 'בוטנים',
  nameEn: 'Peanuts',
  category: 'fats',
  caloriesPer100g: 567,
  proteinPer100g: 26,
  fatPer100g: 49,
  carbsPer100g: 16,
  fiberPer100g: 8.5,
  servingSizes: [
    serving('קומץ', 'One handful', 'piece', 25),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const PEANUT_BUTTER = createFood({
  nameHe: 'חמאת בוטנים',
  nameEn: 'Peanut Butter',
  category: 'fats',
  caloriesPer100g: 588,
  proteinPer100g: 25,
  fatPer100g: 50,
  carbsPer100g: 20,
  fiberPer100g: 6,
  servingSizes: [
    serving('כף', 'One tablespoon', 'tablespoon', 16),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const WALNUTS = createFood({
  nameHe: 'אגוזי מלך',
  nameEn: 'Walnuts',
  category: 'fats',
  caloriesPer100g: 654,
  proteinPer100g: 15,
  fatPer100g: 65,
  carbsPer100g: 14,
  fiberPer100g: 7,
  servingSizes: [
    serving('קומץ', 'One handful', 'piece', 25),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const SUNFLOWER_SEEDS = createFood({
  nameHe: 'גרעיני חמנייה',
  nameEn: 'Sunflower Seeds',
  category: 'fats',
  caloriesPer100g: 584,
  proteinPer100g: 21,
  fatPer100g: 51,
  carbsPer100g: 20,
  fiberPer100g: 8.6,
  servingSizes: [
    serving('קומץ', 'One handful', 'piece', 25),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const HUMMUS = createFood({
  nameHe: 'חומוס',
  nameEn: 'Hummus',
  category: 'fats',
  caloriesPer100g: 166,
  proteinPer100g: 8,
  fatPer100g: 10,
  carbsPer100g: 14,
  fiberPer100g: 6,
  servingSizes: [
    serving('כף', 'One tablespoon', 'tablespoon', 20),
    serving('מנה', 'One serving', 'serving', 100),
  ],
})

export const COCONUT_OIL = createFood({
  nameHe: 'שמן קוקוס',
  nameEn: 'Coconut Oil',
  category: 'fats',
  caloriesPer100g: 862,
  proteinPer100g: 0,
  fatPer100g: 100,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [
    serving('כף', 'One tablespoon', 'tablespoon', 14),
    serving('כפית', 'One teaspoon', 'teaspoon', 5),
  ],
})

// ═══════════════════════════════════════════════════════════════════
// SNACKS (~8)
// ═══════════════════════════════════════════════════════════════════

export const BAMBA = createFood({
  nameHe: 'במבה',
  nameEn: 'Bamba',
  category: 'snacks',
  caloriesPer100g: 546,
  proteinPer100g: 17.5,
  fatPer100g: 34,
  carbsPer100g: 43,
  fiberPer100g: 3,
  servingSizes: [serving('שקית', 'One bag', 'piece', 25), serving('100 גרם', '100g', 'grams', 100)],
})

export const BISLI = createFood({
  nameHe: 'ביסלי',
  nameEn: 'Bisli',
  category: 'snacks',
  caloriesPer100g: 480,
  proteinPer100g: 8,
  fatPer100g: 22,
  carbsPer100g: 66,
  fiberPer100g: 2,
  servingSizes: [serving('שקית', 'One bag', 'piece', 25), serving('100 גרם', '100g', 'grams', 100)],
})

export const ENERGY_BAR = createFood({
  nameHe: 'חטיף אנרגיה',
  nameEn: 'Energy Bar (average)',
  category: 'snacks',
  caloriesPer100g: 400,
  proteinPer100g: 10,
  fatPer100g: 15,
  carbsPer100g: 55,
  fiberPer100g: 4,
  servingSizes: [
    serving('חטיף אחד', 'One bar', 'piece', 45),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const PROTEIN_BAR = createFood({
  nameHe: 'חטיף חלבון',
  nameEn: 'Protein Bar',
  category: 'snacks',
  caloriesPer100g: 350,
  proteinPer100g: 30,
  fatPer100g: 12,
  carbsPer100g: 30,
  fiberPer100g: 5,
  servingSizes: [
    serving('חטיף אחד', 'One bar', 'piece', 60),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const DARK_CHOCOLATE = createFood({
  nameHe: 'שוקולד מריר 70%',
  nameEn: 'Dark Chocolate 70%',
  category: 'snacks',
  caloriesPer100g: 598,
  proteinPer100g: 8,
  fatPer100g: 43,
  carbsPer100g: 46,
  fiberPer100g: 11,
  servingSizes: [
    serving('קוביה', 'One square', 'piece', 10),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const HALVA = createFood({
  nameHe: 'חלווה',
  nameEn: 'Halva',
  category: 'snacks',
  caloriesPer100g: 520,
  proteinPer100g: 12,
  fatPer100g: 28,
  carbsPer100g: 55,
  fiberPer100g: 4,
  servingSizes: [
    serving('פרוסה', 'One slice', 'piece', 30),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const GRANOLA = createFood({
  nameHe: 'גרנולה',
  nameEn: 'Granola',
  category: 'snacks',
  caloriesPer100g: 471,
  proteinPer100g: 10,
  fatPer100g: 20,
  carbsPer100g: 64,
  fiberPer100g: 5,
  servingSizes: [
    serving('חצי כוס', 'Half cup', 'cup', 50),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const RICE_CAKE_CHOCOLATE = createFood({
  nameHe: 'פריכית אורז בשוקולד',
  nameEn: 'Chocolate Rice Cake',
  category: 'snacks',
  caloriesPer100g: 440,
  proteinPer100g: 6,
  fatPer100g: 16,
  carbsPer100g: 68,
  fiberPer100g: 2,
  servingSizes: [
    serving('פריכית אחת', 'One cake', 'piece', 13),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

// ═══════════════════════════════════════════════════════════════════
// TRADITIONAL ISRAELI DISHES (~12)
// ═══════════════════════════════════════════════════════════════════

export const FALAFEL = createFood({
  nameHe: 'פלאפל',
  nameEn: 'Falafel Ball',
  category: 'traditional',
  caloriesPer100g: 333,
  proteinPer100g: 13,
  fatPer100g: 18,
  carbsPer100g: 32,
  fiberPer100g: 5,
  servingSizes: [
    serving('כדור אחד', 'One ball', 'piece', 20),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const SHAKSHUKA = createFood({
  nameHe: 'שקשוקה',
  nameEn: 'Shakshuka (per serving)',
  category: 'traditional',
  caloriesPer100g: 90,
  proteinPer100g: 5.5,
  fatPer100g: 5,
  carbsPer100g: 6,
  fiberPer100g: 1.5,
  servingSizes: [
    serving('מנה', 'One serving', 'serving', 250),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const SABICH = createFood({
  nameHe: 'סביח',
  nameEn: 'Sabich (in pita)',
  category: 'traditional',
  caloriesPer100g: 210,
  proteinPer100g: 7,
  fatPer100g: 11,
  carbsPer100g: 22,
  fiberPer100g: 3,
  servingSizes: [
    serving('סביח שלם', 'One sabich', 'piece', 300),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const BUREKAS_CHEESE = createFood({
  nameHe: 'בורקס גבינה',
  nameEn: 'Cheese Burekas',
  category: 'traditional',
  caloriesPer100g: 320,
  proteinPer100g: 8,
  fatPer100g: 20,
  carbsPer100g: 27,
  fiberPer100g: 1,
  servingSizes: [
    serving('בורקס אחד', 'One burekas', 'piece', 90),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const SCHNITZEL = createFood({
  nameHe: 'שניצל עוף',
  nameEn: 'Chicken Schnitzel (breaded)',
  category: 'traditional',
  caloriesPer100g: 260,
  proteinPer100g: 22,
  fatPer100g: 14,
  carbsPer100g: 12,
  fiberPer100g: 0.5,
  servingSizes: [
    serving('שניצל אחד', 'One schnitzel', 'piece', 130),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const MUJADARA = createFood({
  nameHe: 'מג׳דרה',
  nameEn: 'Mujadara (lentils & rice)',
  category: 'traditional',
  caloriesPer100g: 130,
  proteinPer100g: 5,
  fatPer100g: 3,
  carbsPer100g: 22,
  fiberPer100g: 3.5,
  servingSizes: [serving('כוס', 'One cup', 'cup', 200), serving('100 גרם', '100g', 'grams', 100)],
})

export const KUBBEH = createFood({
  nameHe: 'קובה',
  nameEn: 'Kubbeh',
  category: 'traditional',
  caloriesPer100g: 180,
  proteinPer100g: 10,
  fatPer100g: 7,
  carbsPer100g: 20,
  fiberPer100g: 2,
  servingSizes: [
    serving('קובה אחת', 'One kubbeh', 'piece', 80),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const STUFFED_GRAPE_LEAVES = createFood({
  nameHe: 'עלי גפן ממולאים',
  nameEn: 'Stuffed Grape Leaves',
  category: 'traditional',
  caloriesPer100g: 150,
  proteinPer100g: 4,
  fatPer100g: 7,
  carbsPer100g: 18,
  fiberPer100g: 2,
  servingSizes: [
    serving('עלה אחד', 'One leaf', 'piece', 30),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const ISRAELI_SALAD = createFood({
  nameHe: 'סלט ישראלי',
  nameEn: 'Israeli Salad',
  category: 'traditional',
  caloriesPer100g: 45,
  proteinPer100g: 1,
  fatPer100g: 2.5,
  carbsPer100g: 5,
  fiberPer100g: 1.5,
  servingSizes: [
    serving('מנה', 'One serving', 'serving', 150),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const MALAWACH = createFood({
  nameHe: 'מלאווח',
  nameEn: 'Malawach',
  category: 'traditional',
  caloriesPer100g: 320,
  proteinPer100g: 6,
  fatPer100g: 18,
  carbsPer100g: 35,
  fiberPer100g: 1.5,
  servingSizes: [
    serving('מלאווח אחד', 'One malawach', 'piece', 120),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const JACHNUN = createFood({
  nameHe: 'ג׳חנון',
  nameEn: 'Jachnun',
  category: 'traditional',
  caloriesPer100g: 330,
  proteinPer100g: 6,
  fatPer100g: 15,
  carbsPer100g: 43,
  fiberPer100g: 1,
  servingSizes: [
    serving('יחידה', 'One piece', 'piece', 150),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

export const HUMMUS_WITH_MEAT = createFood({
  nameHe: 'חומוס עם בשר',
  nameEn: 'Hummus with Ground Meat',
  category: 'traditional',
  caloriesPer100g: 175,
  proteinPer100g: 10,
  fatPer100g: 10,
  carbsPer100g: 12,
  fiberPer100g: 4,
  servingSizes: [
    serving('מנה', 'One serving', 'serving', 250),
    serving('100 גרם', '100g', 'grams', 100),
  ],
})

// ═══════════════════════════════════════════════════════════════════
// DATABASE EXPORTS
// ═══════════════════════════════════════════════════════════════════

export const FOOD_DATABASE: readonly FoodItem[] = [
  // Protein (raw)
  CHICKEN_BREAST_RAW,
  SALMON_RAW,
  BEEF_SIRLOIN_RAW,
  // Protein (cooked)
  CHICKEN_BREAST,
  CHICKEN_THIGH,
  TURKEY_BREAST,
  GROUND_TURKEY,
  EGGS,
  EGG_WHITES,
  CANNED_TUNA,
  SALMON,
  TILAPIA,
  BEEF_SIRLOIN,
  GROUND_BEEF,
  TOFU,
  COTTAGE_5,
  COTTAGE_9,
  GREEK_YOGURT,
  WHEY_PROTEIN,
  LABNEH,
  WHITE_CHEESE_5,
  BEEF_SHAWARMA,
  // Carbs
  WHITE_RICE,
  BROWN_RICE,
  WHOLE_WHEAT_PASTA,
  REGULAR_PASTA,
  PITA_BREAD,
  WHOLE_WHEAT_PITA,
  CHALLAH,
  WHITE_BREAD,
  WHOLE_WHEAT_BREAD,
  OATS,
  COUSCOUS,
  BULGUR,
  SWEET_POTATO,
  POTATO,
  QUINOA,
  RICE_CAKES,
  CORN,
  LENTILS,
  LACHUCH,
  // Vegetables
  CUCUMBER,
  TOMATO,
  BELL_PEPPER,
  LETTUCE,
  ONION,
  CARROT,
  BROCCOLI,
  CAULIFLOWER,
  ZUCCHINI,
  SPINACH,
  CABBAGE,
  EGGPLANT,
  MUSHROOMS,
  GREEN_BEANS,
  BEET,
  // Fruits
  BANANA,
  APPLE,
  ORANGE,
  WATERMELON,
  DATES_MEDJOOL,
  GRAPES,
  STRAWBERRIES,
  MANGO,
  PERSIMMON,
  POMEGRANATE,
  // Dairy
  MILK_3,
  MILK_1,
  CHOCOLATE_MILK,
  LEBEN,
  YELLOW_CHEESE,
  BUTTER,
  CREAM_CHEESE,
  HALLOUMI,
  // Fats
  OLIVE_OIL,
  TAHINI,
  TAHINI_PREPARED,
  AVOCADO,
  ALMONDS,
  PEANUTS,
  PEANUT_BUTTER,
  WALNUTS,
  SUNFLOWER_SEEDS,
  HUMMUS,
  COCONUT_OIL,
  // Snacks
  BAMBA,
  BISLI,
  ENERGY_BAR,
  PROTEIN_BAR,
  DARK_CHOCOLATE,
  HALVA,
  GRANOLA,
  RICE_CAKE_CHOCOLATE,
  // Traditional
  FALAFEL,
  SHAKSHUKA,
  SABICH,
  BUREKAS_CHEESE,
  SCHNITZEL,
  MUJADARA,
  KUBBEH,
  STUFFED_GRAPE_LEAVES,
  ISRAELI_SALAD,
  MALAWACH,
  JACHNUN,
  HUMMUS_WITH_MEAT,
] as const

/** O(1) food lookup by ID */
export const FOOD_MAP: ReadonlyMap<string, FoodItem> = new Map(
  FOOD_DATABASE.map((food) => [food.id, food]),
)

/** Get all foods in a specific category */
export function getFoodsByCategory(category: FoodCategory): readonly FoodItem[] {
  return FOOD_DATABASE.filter((food) => food.category === category)
}
