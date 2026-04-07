/**
 * Meal Templates — pre-built meal combinations for the plan generator.
 *
 * Each template is a real Israeli meal with food items from the food database.
 * The plan generator picks templates that fit the user's macro targets,
 * then SCALES the serving sizes proportionally to hit exact numbers.
 *
 * Template macros are approximate (at default serving sizes).
 * Actual macros are recalculated after scaling.
 *
 * Design priorities:
 * - Every meal is something a real Israeli would eat
 * - Balance of traditional and modern meals
 * - Each meal type has enough variety to avoid repetition
 * - Templates cover a range of calorie levels (light → heavy)
 *
 * Food references use imported constants (not string IDs) to prevent
 * ID mismatch bugs when foods are reordered.
 */

import type { MealTemplate, MealTemplateTag, MealType, ServingUnit } from '../types'
import {
  AVOCADO,
  BANANA,
  BROCCOLI,
  CHICKEN_BREAST,
  CHOCOLATE_MILK,
  COTTAGE_5,
  CUCUMBER,
  EGGS,
  GRANOLA,
  GREEK_YOGURT,
  GROUND_BEEF,
  HUMMUS,
  BELL_PEPPER,
  ISRAELI_SALAD,
  LETTUCE,
  OATS,
  OLIVE_OIL,
  ONION,
  PEANUT_BUTTER,
  PITA_BREAD,
  QUINOA,
  RICE_CAKES,
  SALMON,
  SCHNITZEL,
  SHAKSHUKA,
  STRAWBERRIES,
  SWEET_POTATO,
  TAHINI,
  BEEF_SHAWARMA,
  CANNED_TUNA,
  TOMATO,
  WHEY_PROTEIN,
  WHITE_CHEESE_5,
  WHITE_RICE,
  WHOLE_WHEAT_BREAD,
} from './foods'

// ── Helper ──────────────────────────────────────────────────────────

let templateCounter = 0

interface TemplateItemInput {
  foodId: string
  defaultServingAmount: number
  servingUnit: ServingUnit
  scalable: boolean
}

function createTemplate(params: {
  nameHe: string
  nameEn: string
  mealType: MealType
  tags: MealTemplateTag[]
  items: TemplateItemInput[]
  approxCalories: number
  approxProtein: number
  approxFat: number
  approxCarbs: number
}): MealTemplate {
  templateCounter += 1
  return {
    id: `tmpl_${String(templateCounter).padStart(3, '0')}`,
    nameHe: params.nameHe,
    nameEn: params.nameEn,
    mealType: params.mealType,
    tags: params.tags,
    items: params.items,
    approxCalories: params.approxCalories,
    approxProtein: params.approxProtein,
    approxFat: params.approxFat,
    approxCarbs: params.approxCarbs,
  }
}

// ═══════════════════════════════════════════════════════════════════
// BREAKFAST TEMPLATES (4)
// ═══════════════════════════════════════════════════════════════════

// Israeli Breakfast: 2 eggs (100g) + Israeli salad (150g) + 2 WW bread (70g) + white cheese (40g)
// Macros: eggs=155cal/13P/11F/1C, salad=68cal/2P/4F/8C, bread=176cal/8P/2F/30C, cheese=36cal/5P/2F/0C
const ISRAELI_BREAKFAST = createTemplate({
  nameHe: 'ארוחת בוקר ישראלית',
  nameEn: 'Israeli Breakfast',
  mealType: 'breakfast',
  tags: ['balanced', 'traditional'],
  items: [
    { foodId: EGGS.id, defaultServingAmount: 2, servingUnit: 'piece', scalable: true },
    { foodId: ISRAELI_SALAD.id, defaultServingAmount: 1, servingUnit: 'serving', scalable: true },
    { foodId: WHOLE_WHEAT_BREAD.id, defaultServingAmount: 2, servingUnit: 'piece', scalable: true },
    {
      foodId: WHITE_CHEESE_5.id,
      defaultServingAmount: 2,
      servingUnit: 'tablespoon',
      scalable: true,
    },
  ],
  approxCalories: 435,
  approxProtein: 28,
  approxFat: 19,
  approxCarbs: 39,
})

// Oatmeal Power Bowl: oats half cup (40g) + banana (120g) + whey scoop (30g) + PB 1tbsp (16g)
// Macros: oats=156cal/7P/3F/26C, banana=107cal/1P/0F/28C, whey=114cal/23P/2F/3C, PB=94cal/4P/8F/3C
const OATMEAL_POWER_BOWL = createTemplate({
  nameHe: 'קערת שיבולת שועל',
  nameEn: 'Oatmeal Power Bowl',
  mealType: 'breakfast',
  tags: ['high_protein', 'quick'],
  items: [
    { foodId: OATS.id, defaultServingAmount: 1, servingUnit: 'cup', scalable: true },
    { foodId: BANANA.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: false },
    { foodId: WHEY_PROTEIN.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: true },
    {
      foodId: PEANUT_BUTTER.id,
      defaultServingAmount: 1,
      servingUnit: 'tablespoon',
      scalable: true,
    },
  ],
  approxCalories: 471,
  approxProtein: 35,
  approxFat: 13,
  approxCarbs: 60,
})

// Quick Yogurt Bowl: greek yogurt (200g) + granola half cup (50g) + strawberries (150g)
// Macros: yogurt=118cal/20P/1F/7C, granola=236cal/5P/10F/32C, strawberries=48cal/1P/0F/12C
const QUICK_YOGURT_BOWL = createTemplate({
  nameHe: 'קערת יוגורט מהירה',
  nameEn: 'Quick Yogurt Bowl',
  mealType: 'breakfast',
  tags: ['high_protein', 'quick'],
  items: [
    { foodId: GREEK_YOGURT.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: true },
    { foodId: GRANOLA.id, defaultServingAmount: 1, servingUnit: 'cup', scalable: true },
    { foodId: STRAWBERRIES.id, defaultServingAmount: 1, servingUnit: 'cup', scalable: false },
  ],
  approxCalories: 402,
  approxProtein: 26,
  approxFat: 11,
  approxCarbs: 51,
})

// Shakshuka Plate: shakshuka serving (250g) + pita (60g) + Israeli salad (100g)
// Macros: shakshuka=225cal/14P/13F/15C, pita=165cal/5P/1F/33C, salad=45cal/1P/3F/5C
const SHAKSHUKA_PLATE = createTemplate({
  nameHe: 'שקשוקה עם פיתה',
  nameEn: 'Shakshuka Plate',
  mealType: 'breakfast',
  tags: ['traditional', 'balanced'],
  items: [
    { foodId: SHAKSHUKA.id, defaultServingAmount: 1, servingUnit: 'serving', scalable: true },
    { foodId: PITA_BREAD.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: true },
    { foodId: ISRAELI_SALAD.id, defaultServingAmount: 100, servingUnit: 'grams', scalable: true },
  ],
  approxCalories: 435,
  approxProtein: 20,
  approxFat: 17,
  approxCarbs: 53,
})

// ═══════════════════════════════════════════════════════════════════
// LUNCH TEMPLATES (4)
// ═══════════════════════════════════════════════════════════════════

// Chicken Rice Bowl: chicken breast (170g) + white rice cup (185g) + broccoli cup (90g) + olive oil tbsp (14g)
// Macros: chicken=281cal/53P/6F/0C, rice=241cal/5P/1F/52C, broccoli=32cal/3P/0F/6C, oil=124cal/0P/14F/0C
const CHICKEN_RICE_BOWL = createTemplate({
  nameHe: 'קערת עוף ואורז',
  nameEn: 'Chicken Rice Bowl',
  mealType: 'lunch',
  tags: ['high_protein', 'balanced'],
  items: [
    { foodId: CHICKEN_BREAST.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: true },
    { foodId: WHITE_RICE.id, defaultServingAmount: 1, servingUnit: 'cup', scalable: true },
    { foodId: BROCCOLI.id, defaultServingAmount: 1, servingUnit: 'cup', scalable: false },
    { foodId: OLIVE_OIL.id, defaultServingAmount: 1, servingUnit: 'tablespoon', scalable: true },
  ],
  approxCalories: 678,
  approxProtein: 61,
  approxFat: 21,
  approxCarbs: 58,
})

// Schnitzel in Pita: schnitzel (130g) + pita (60g) + Israeli salad (150g) + tahini tbsp (15g)
// Macros: schnitzel=338cal/29P/18F/16C, pita=165cal/5P/1F/33C, salad=68cal/2P/4F/8C, tahini=89cal/3P/8F/3C
const SCHNITZEL_PITA = createTemplate({
  nameHe: 'שניצל בפיתה',
  nameEn: 'Schnitzel in Pita',
  mealType: 'lunch',
  tags: ['traditional', 'balanced'],
  items: [
    { foodId: SCHNITZEL.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: true },
    { foodId: PITA_BREAD.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: true },
    { foodId: ISRAELI_SALAD.id, defaultServingAmount: 1, servingUnit: 'serving', scalable: true },
    { foodId: TAHINI.id, defaultServingAmount: 1, servingUnit: 'tablespoon', scalable: true },
  ],
  approxCalories: 660,
  approxProtein: 39,
  approxFat: 31,
  approxCarbs: 60,
})

// Tuna & Quinoa Salad: tuna can (160g) + quinoa cup (185g) + cucumber (120g) + tomato (125g) + olive oil (14g)
// Macros: tuna=186cal/42P/2F/0C, quinoa=222cal/8P/4F/39C, cucumber=19cal/1P/0F/4C, tomato=23cal/1P/0F/5C, oil=124cal/0P/14F/0C
const TUNA_SALAD_PLATE = createTemplate({
  nameHe: 'צלחת טונה וקינואה',
  nameEn: 'Tuna & Quinoa Salad',
  mealType: 'lunch',
  tags: ['high_protein', 'light'],
  items: [
    { foodId: CANNED_TUNA.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: true },
    { foodId: QUINOA.id, defaultServingAmount: 1, servingUnit: 'cup', scalable: true },
    { foodId: CUCUMBER.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: false },
    { foodId: TOMATO.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: false },
    { foodId: OLIVE_OIL.id, defaultServingAmount: 1, servingUnit: 'tablespoon', scalable: true },
  ],
  approxCalories: 574,
  approxProtein: 52,
  approxFat: 20,
  approxCarbs: 48,
})

// Shawarma Plate: beef shawarma (150g) + hummus (100g) + pita (60g) + Israeli salad (100g)
// Macros: shawarma=323cal/30P/21F/3C, hummus=166cal/8P/10F/14C, pita=165cal/5P/1F/33C, salad=45cal/1P/3F/5C
const SHAWARMA_PLATE = createTemplate({
  nameHe: 'צלחת שווארמה',
  nameEn: 'Shawarma Plate',
  mealType: 'lunch',
  tags: ['traditional', 'high_protein'],
  items: [
    { foodId: BEEF_SHAWARMA.id, defaultServingAmount: 1, servingUnit: 'serving', scalable: true },
    { foodId: HUMMUS.id, defaultServingAmount: 1, servingUnit: 'serving', scalable: true },
    { foodId: PITA_BREAD.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: true },
    { foodId: ISRAELI_SALAD.id, defaultServingAmount: 100, servingUnit: 'grams', scalable: true },
  ],
  approxCalories: 699,
  approxProtein: 44,
  approxFat: 35,
  approxCarbs: 55,
})

// ═══════════════════════════════════════════════════════════════════
// DINNER TEMPLATES (3)
// ═══════════════════════════════════════════════════════════════════

// Salmon & Sweet Potato: salmon fillet (150g) + sweet potato (150g) + broccoli (90g) + olive oil (14g)
// Macros: salmon=312cal/30P/20F/0C, sweet potato=135cal/3P/0F/32C, broccoli=32cal/3P/0F/6C, oil=124cal/0P/14F/0C
const SALMON_SWEET_POTATO = createTemplate({
  nameHe: 'סלמון עם בטטה',
  nameEn: 'Salmon & Sweet Potato',
  mealType: 'dinner',
  tags: ['balanced'],
  items: [
    { foodId: SALMON.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: true },
    { foodId: SWEET_POTATO.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: true },
    { foodId: BROCCOLI.id, defaultServingAmount: 1, servingUnit: 'cup', scalable: false },
    { foodId: OLIVE_OIL.id, defaultServingAmount: 1, servingUnit: 'tablespoon', scalable: true },
  ],
  approxCalories: 603,
  approxProtein: 36,
  approxFat: 34,
  approxCarbs: 38,
})

// Ground Beef Stir Fry: ground beef (150g) + white rice cup (185g) + bell pepper (120g) + onion half (55g) + olive oil (14g)
// Macros: beef=264cal/39P/15F/0C, rice=241cal/5P/1F/52C, pepper=37cal/1P/0F/7C, onion=22cal/1P/0F/5C, oil=124cal/0P/14F/0C
const BEEF_STIR_FRY = createTemplate({
  nameHe: 'מוקפץ בקר עם אורז',
  nameEn: 'Ground Beef Stir Fry & Rice',
  mealType: 'dinner',
  tags: ['high_protein', 'balanced'],
  items: [
    { foodId: GROUND_BEEF.id, defaultServingAmount: 150, servingUnit: 'grams', scalable: true },
    { foodId: WHITE_RICE.id, defaultServingAmount: 1, servingUnit: 'cup', scalable: true },
    { foodId: BELL_PEPPER.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: false },
    { foodId: ONION.id, defaultServingAmount: 0.5, servingUnit: 'piece', scalable: false },
    { foodId: OLIVE_OIL.id, defaultServingAmount: 1, servingUnit: 'tablespoon', scalable: true },
  ],
  approxCalories: 688,
  approxProtein: 46,
  approxFat: 30,
  approxCarbs: 64,
})

// Light Chicken Salad: chicken breast (150g) + lettuce cup (50g) + tomato (125g) + cucumber (120g) + avocado half (75g) + olive oil (14g)
// Macros: chicken=248cal/47P/5F/0C, lettuce=8cal/1P/0F/1C, tomato=23cal/1P/0F/5C, cucumber=19cal/1P/0F/4C, avocado=120cal/2P/11F/7C, oil=124cal/0P/14F/0C
const LIGHT_CHICKEN_SALAD = createTemplate({
  nameHe: 'סלט עוף קל',
  nameEn: 'Light Chicken Salad',
  mealType: 'dinner',
  tags: ['high_protein', 'light'],
  items: [
    { foodId: CHICKEN_BREAST.id, defaultServingAmount: 150, servingUnit: 'grams', scalable: true },
    { foodId: LETTUCE.id, defaultServingAmount: 1, servingUnit: 'cup', scalable: false },
    { foodId: TOMATO.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: false },
    { foodId: CUCUMBER.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: false },
    { foodId: AVOCADO.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: true },
    { foodId: OLIVE_OIL.id, defaultServingAmount: 1, servingUnit: 'tablespoon', scalable: true },
  ],
  approxCalories: 542,
  approxProtein: 52,
  approxFat: 30,
  approxCarbs: 17,
})

// ═══════════════════════════════════════════════════════════════════
// POST-WORKOUT TEMPLATES (2)
// ═══════════════════════════════════════════════════════════════════

// Quick Recovery: whey scoop (30g) + banana (120g) + 3 rice cakes (27g)
// Macros: whey=114cal/23P/2F/3C, banana=107cal/1P/0F/28C, rice cakes=105cal/2P/1F/22C
const QUICK_RECOVERY = createTemplate({
  nameHe: 'התאוששות מהירה',
  nameEn: 'Quick Recovery Shake & Snack',
  mealType: 'post_workout',
  tags: ['high_carb', 'quick'],
  items: [
    { foodId: WHEY_PROTEIN.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: true },
    { foodId: BANANA.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: false },
    { foodId: RICE_CAKES.id, defaultServingAmount: 3, servingUnit: 'piece', scalable: true },
  ],
  approxCalories: 326,
  approxProtein: 26,
  approxFat: 3,
  approxCarbs: 53,
})

// Chocolate Milk Recovery: choco milk carton (250g) + pita (60g) + cottage 5% (125g)
// Macros: choco=208cal/8P/5F/33C, pita=165cal/5P/1F/33C, cottage=123cal/14P/6F/3C
const CHOCOLATE_RECOVERY = createTemplate({
  nameHe: 'התאוששות שוקו',
  nameEn: 'Chocolate Milk Recovery',
  mealType: 'post_workout',
  tags: ['high_carb', 'quick'],
  items: [
    { foodId: CHOCOLATE_MILK.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: true },
    { foodId: PITA_BREAD.id, defaultServingAmount: 1, servingUnit: 'piece', scalable: true },
    { foodId: COTTAGE_5.id, defaultServingAmount: 125, servingUnit: 'grams', scalable: true },
  ],
  approxCalories: 496,
  approxProtein: 27,
  approxFat: 12,
  approxCarbs: 69,
})

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export const MEAL_TEMPLATES: readonly MealTemplate[] = [
  // Breakfast
  ISRAELI_BREAKFAST,
  OATMEAL_POWER_BOWL,
  QUICK_YOGURT_BOWL,
  SHAKSHUKA_PLATE,
  // Lunch
  CHICKEN_RICE_BOWL,
  SCHNITZEL_PITA,
  TUNA_SALAD_PLATE,
  SHAWARMA_PLATE,
  // Dinner
  SALMON_SWEET_POTATO,
  BEEF_STIR_FRY,
  LIGHT_CHICKEN_SALAD,
  // Post-workout
  QUICK_RECOVERY,
  CHOCOLATE_RECOVERY,
] as const

/** Get templates for a specific meal type */
export function getTemplatesByMealType(mealType: MealType): readonly MealTemplate[] {
  return MEAL_TEMPLATES.filter((t) => t.mealType === mealType)
}

/** Get templates matching any of the given tags */
export function getTemplatesByTag(tag: MealTemplateTag): readonly MealTemplate[] {
  return MEAL_TEMPLATES.filter((t) => t.tags.includes(tag))
}
