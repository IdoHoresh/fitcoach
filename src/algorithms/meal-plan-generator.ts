/**
 * Meal Plan Generator.
 *
 * Assembles 7-day meal plans by selecting templates from the Israeli food DB,
 * scaling portions uniformly to hit per-meal macro targets (±5% tolerance).
 *
 * Algorithm:
 * 1. Distribute daily macros into per-meal targets (via macro-distributor)
 * 2. For each meal slot: find best-fit template, scale uniformly
 * 3. If no template fits: return stub meal (user fills manually)
 * 4. Track used templates to maximize variety across the week
 *
 * Key decisions:
 * - Uniform scaling (all scalable items × same factor) — keeps meals proportional
 * - Scale factor bounded to [0.3, 2.5] — prevents unrealistic portions
 * - Meals with no matching template get templateId: null (UI shows "customize")
 *
 * Sources:
 * - Meal template design: real Israeli meals with USDA/MoH nutrition data
 * - Scaling approach: same as commercial meal prep services
 *
 * Pure functions only — no side effects, no state.
 */

import type {
  DayOfWeek,
  FoodItem,
  MealPlanDay,
  MealTemplate,
  MealType,
  MealsPerDay,
  PlannedMeal,
  PlannedMealItem,
  ServingUnit,
} from '../types'
import { MACRO_TOLERANCE_PERCENT, MAX_SCALE_FACTOR, MIN_SCALE_FACTOR } from '../data/constants'
import { getTemplatesByMealType } from '../data/meal-templates'
import { FOOD_MAP } from '../data/foods'
import { distributeMacros, type MealMacroTarget } from './macro-distributor'

// ── Public Functions ────────────────────────────────────────────────

/**
 * Calculates actual macros for a template using the food DB.
 * More accurate than the approx values stored on the template.
 */
export function calculateTemplateMacros(
  template: MealTemplate,
  foods: ReadonlyMap<string, FoodItem>,
): { calories: number; protein: number; fat: number; carbs: number } {
  let calories = 0
  let protein = 0
  let fat = 0
  let carbs = 0

  for (const item of template.items) {
    const food = foods.get(item.foodId)
    if (!food) continue

    const grams = resolveGrams(food, item.defaultServingAmount, item.servingUnit)
    const factor = grams / 100
    calories += food.caloriesPer100g * factor
    protein += food.proteinPer100g * factor
    fat += food.fatPer100g * factor
    carbs += food.carbsPer100g * factor
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
  }
}

/**
 * Calculates the uniform scale factor to match a calorie target.
 */
export function calculateScaleFactor(templateCalories: number, targetCalories: number): number {
  if (templateCalories === 0) return 1
  return targetCalories / templateCalories
}

/**
 * Checks if an actual value is within ±tolerance of a target.
 */
export function isWithinTolerance(
  actual: number,
  target: number,
  tolerancePercent: number,
): boolean {
  if (target === 0) return actual === 0
  return Math.abs(actual - target) / target <= tolerancePercent
}

/**
 * Scales a template's items by a uniform factor.
 * Scalable items get multiplied; non-scalable stay the same.
 */
export function scaleTemplate(
  template: MealTemplate,
  scaleFactor: number,
  foods: ReadonlyMap<string, FoodItem>,
): PlannedMealItem[] {
  return template.items.map((item) => {
    const food = foods.get(item.foodId)
    if (!food) {
      return emptyItem(item.foodId, item.servingUnit)
    }

    const effectiveAmount = item.scalable
      ? item.defaultServingAmount * scaleFactor
      : item.defaultServingAmount

    const grams = resolveGrams(food, effectiveAmount, item.servingUnit)
    const factor = grams / 100

    return {
      foodId: item.foodId,
      servingAmount: Math.round(effectiveAmount * 10) / 10,
      servingUnit: item.servingUnit,
      gramsConsumed: Math.round(grams),
      calories: Math.round(food.caloriesPer100g * factor),
      protein: Math.round(food.proteinPer100g * factor),
      fat: Math.round(food.fatPer100g * factor),
      carbs: Math.round(food.carbsPer100g * factor),
    }
  })
}

/**
 * Selects the best-fit template for a meal type within tolerance.
 * Returns null if no template can be scaled to fit.
 */
export function selectTemplate(
  mealType: MealType,
  target: MealMacroTarget,
  usedTemplateIds: Set<string>,
  foods: ReadonlyMap<string, FoodItem>,
): { template: MealTemplate; scaleFactor: number } | null {
  const templates = getTemplatesByMealType(mealType)

  let bestMatch: { template: MealTemplate; scaleFactor: number; diff: number } | null = null

  for (const template of templates) {
    if (usedTemplateIds.has(template.id)) continue

    const macros = calculateTemplateMacros(template, foods)
    const scaleFactor = calculateScaleFactor(macros.calories, target.calories)

    // Reject if scale factor is out of bounds
    if (scaleFactor < MIN_SCALE_FACTOR || scaleFactor > MAX_SCALE_FACTOR) continue

    // Check if scaled result is within tolerance
    const scaledCalories = macros.calories * scaleFactor
    if (!isWithinTolerance(scaledCalories, target.calories, MACRO_TOLERANCE_PERCENT)) continue

    const diff = Math.abs(scaledCalories - target.calories)
    if (!bestMatch || diff < bestMatch.diff) {
      bestMatch = { template, scaleFactor, diff }
    }
  }

  return bestMatch ? { template: bestMatch.template, scaleFactor: bestMatch.scaleFactor } : null
}

/**
 * Generates a complete 7-day meal plan.
 *
 * @param params.proteinGrams    - Daily protein grams
 * @param params.fatGrams        - Daily fat grams
 * @param params.carbGrams       - Daily carb grams
 * @param params.mealsPerDay     - Meals per day (3-6)
 * @param params.trainingDays    - Days with training (0=Sun..6=Sat)
 * @returns 7 MealPlanDay objects
 */
export function generateWeeklyMealPlan(params: {
  proteinGrams: number
  fatGrams: number
  carbGrams: number
  mealsPerDay: MealsPerDay
  trainingDays: DayOfWeek[]
}): MealPlanDay[] {
  const { proteinGrams, fatGrams, carbGrams, mealsPerDay, trainingDays } = params
  const trainingDaySet = new Set(trainingDays)

  // Track used templates per meal type across the week for variety
  const usedByMealType = new Map<MealType, Set<string>>()

  // Cache template counts to avoid repeated filtering in the inner loop
  const templateCountByType = new Map<MealType, number>()

  const days: MealPlanDay[] = []

  for (let day = 0; day < 7; day++) {
    const dayOfWeek = day as DayOfWeek
    const isTrainingDay = trainingDaySet.has(dayOfWeek)

    const mealTargets = distributeMacros(
      proteinGrams,
      fatGrams,
      carbGrams,
      mealsPerDay,
      isTrainingDay,
    )

    const dayMeals: PlannedMeal[] = []
    const dayTemplateIds = new Set<string>()

    for (let i = 0; i < mealTargets.length; i++) {
      const target = mealTargets[i]

      // Combine day-level and week-level used sets
      const usedIds = new Set([...dayTemplateIds, ...(usedByMealType.get(target.mealType) ?? [])])

      const match = selectTemplate(target.mealType, target, usedIds, FOOD_MAP)

      let meal: PlannedMeal

      if (match) {
        const items = scaleTemplate(match.template, match.scaleFactor, FOOD_MAP)
        meal = buildPlannedMeal(target.mealType, items, match.template.id, i, dayOfWeek)

        dayTemplateIds.add(match.template.id)

        // Track for weekly variety — reset when all templates for this type are used
        if (!usedByMealType.has(target.mealType)) {
          usedByMealType.set(target.mealType, new Set())
        }
        const weekSet = usedByMealType.get(target.mealType)!
        weekSet.add(match.template.id)

        if (!templateCountByType.has(target.mealType)) {
          templateCountByType.set(target.mealType, getTemplatesByMealType(target.mealType).length)
        }
        if (weekSet.size >= templateCountByType.get(target.mealType)!) {
          weekSet.clear()
        }
      } else {
        // No template fits — create stub meal for user to fill
        meal = buildStubMeal(target, i, dayOfWeek)
      }

      dayMeals.push(meal)
    }

    days.push({
      dayOfWeek,
      isTrainingDay,
      meals: dayMeals,
      totalCalories: dayMeals.reduce((s, m) => s + m.totalCalories, 0),
      totalProtein: dayMeals.reduce((s, m) => s + m.totalProtein, 0),
      totalFat: dayMeals.reduce((s, m) => s + m.totalFat, 0),
      totalCarbs: dayMeals.reduce((s, m) => s + m.totalCarbs, 0),
    })
  }

  return days
}

// ── Internal Helpers ────────────────────────────────────────────────

/**
 * Resolves serving amount + unit into grams using the food's serving sizes.
 * Falls back to treating the amount as grams if no matching serving size found.
 */
function resolveGrams(food: FoodItem, amount: number, unit: ServingUnit): number {
  if (unit === 'grams') return amount
  // Known approximation: 1ml ≈ 1g. Accurate for water/milk (~1.03 g/ml),
  // less so for oil (~0.92 g/ml). No current templates use ml units.
  if (unit === 'ml') return amount

  const servingSize = food.servingSizes.find((s) => s.unit === unit)
  if (servingSize) {
    return amount * servingSize.grams
  }

  // Fallback: treat as grams
  return amount
}

function buildPlannedMeal(
  mealType: MealType,
  items: PlannedMealItem[],
  templateId: string,
  orderIndex: number,
  dayOfWeek: DayOfWeek,
): PlannedMeal {
  return {
    id: `planned_d${dayOfWeek}_${orderIndex}`,
    mealType,
    orderIndex,
    timeSlot: null,
    templateId,
    items,
    totalCalories: items.reduce((s, i) => s + i.calories, 0),
    totalProtein: items.reduce((s, i) => s + i.protein, 0),
    totalFat: items.reduce((s, i) => s + i.fat, 0),
    totalCarbs: items.reduce((s, i) => s + i.carbs, 0),
  }
}

function buildStubMeal(
  target: MealMacroTarget,
  orderIndex: number,
  dayOfWeek: DayOfWeek,
): PlannedMeal {
  return {
    id: `planned_d${dayOfWeek}_${orderIndex}`,
    mealType: target.mealType,
    orderIndex,
    timeSlot: null,
    templateId: null,
    items: [],
    totalCalories: target.calories,
    totalProtein: target.protein,
    totalFat: target.fat,
    totalCarbs: target.carbs,
  }
}

function emptyItem(foodId: string, servingUnit: ServingUnit): PlannedMealItem {
  return {
    foodId,
    servingAmount: 0,
    servingUnit,
    gramsConsumed: 0,
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  }
}
