/**
 * Meal Plan Generator — Tests.
 * Verifies template selection, scaling, and 7-day plan assembly.
 */

import type { MealTemplate, MealType } from '../types'
import { MACRO_TOLERANCE_PERCENT } from '../data/constants'
import { FOOD_MAP } from '../data/foods'
import { getTemplatesByMealType } from '../data/meal-templates'
import {
  calculateScaleFactor,
  calculateTemplateMacros,
  generateWeeklyMealPlan,
  isWithinTolerance,
  scaleTemplate,
  selectTemplate,
} from './meal-plan-generator'

// ── Helpers ─────────────────────────────────────────────────────────

function getFirstTemplate(mealType: MealType): MealTemplate {
  const templates = getTemplatesByMealType(mealType)
  if (templates.length === 0) throw new Error(`No templates for ${mealType}`)
  return templates[0]
}

// ── calculateTemplateMacros ─────────────────────────────────────────

describe('calculateTemplateMacros', () => {
  it('computes macros for a known breakfast template using food DB', () => {
    const template = getFirstTemplate('breakfast')
    const macros = calculateTemplateMacros(template, FOOD_MAP)

    expect(macros.calories).toBeGreaterThan(0)
    expect(macros.protein).toBeGreaterThan(0)
    expect(macros.fat).toBeGreaterThan(0)
    expect(macros.carbs).toBeGreaterThan(0)
  })

  it('computed macros are reasonably close to approx values', () => {
    const template = getFirstTemplate('lunch')
    const macros = calculateTemplateMacros(template, FOOD_MAP)

    // Should be within 20% of approximate values (approx are rounded estimates)
    expect(macros.calories).toBeGreaterThan(template.approxCalories * 0.8)
    expect(macros.calories).toBeLessThan(template.approxCalories * 1.2)
  })
})

// ── calculateScaleFactor ────────────────────────────────────────────

describe('calculateScaleFactor', () => {
  it('returns 1.0 when template matches target exactly', () => {
    const factor = calculateScaleFactor(500, 500)
    expect(factor).toBe(1.0)
  })

  it('returns 0.5 when target is half the template', () => {
    const factor = calculateScaleFactor(1000, 500)
    expect(factor).toBe(0.5)
  })

  it('returns 2.0 when target is double the template', () => {
    const factor = calculateScaleFactor(300, 600)
    expect(factor).toBe(2.0)
  })
})

// ── isWithinTolerance ───────────────────────────────────────────────

describe('isWithinTolerance', () => {
  it('returns true when values match exactly', () => {
    expect(isWithinTolerance(500, 500, MACRO_TOLERANCE_PERCENT)).toBe(true)
  })

  it('returns true at exactly 5% deviation', () => {
    expect(isWithinTolerance(525, 500, MACRO_TOLERANCE_PERCENT)).toBe(true)
    expect(isWithinTolerance(475, 500, MACRO_TOLERANCE_PERCENT)).toBe(true)
  })

  it('returns false at 5.1% deviation', () => {
    expect(isWithinTolerance(526, 500, MACRO_TOLERANCE_PERCENT)).toBe(false)
    expect(isWithinTolerance(474, 500, MACRO_TOLERANCE_PERCENT)).toBe(false)
  })
})

// ── scaleTemplate ───────────────────────────────────────────────────

describe('scaleTemplate', () => {
  it('returns unscaled items when factor is 1.0', () => {
    const template = getFirstTemplate('lunch')
    const items = scaleTemplate(template, 1.0, FOOD_MAP)

    expect(items.length).toBe(template.items.length)
    for (const item of items) {
      expect(item.calories).toBeGreaterThan(0)
      expect(item.gramsConsumed).toBeGreaterThan(0)
    }
  })

  it('scales scalable items by the factor', () => {
    const template = getFirstTemplate('lunch')
    const items1x = scaleTemplate(template, 1.0, FOOD_MAP)
    const items2x = scaleTemplate(template, 2.0, FOOD_MAP)

    // Find a scalable item (first one should be)
    const scalableIndex = template.items.findIndex((i) => i.scalable)
    if (scalableIndex >= 0) {
      expect(items2x[scalableIndex].gramsConsumed).toBeCloseTo(
        items1x[scalableIndex].gramsConsumed * 2,
        0,
      )
    }
  })

  it('does not scale non-scalable items', () => {
    const template = getFirstTemplate('lunch')
    const nonScalableIndex = template.items.findIndex((i) => !i.scalable)
    if (nonScalableIndex < 0) return // Skip if no non-scalable items

    const items1x = scaleTemplate(template, 1.0, FOOD_MAP)
    const items2x = scaleTemplate(template, 2.0, FOOD_MAP)

    expect(items2x[nonScalableIndex].gramsConsumed).toBe(items1x[nonScalableIndex].gramsConsumed)
  })
})

// ── selectTemplate ──────────────────────────────────────────────────

describe('selectTemplate', () => {
  it('picks the closest template within tolerance', () => {
    const target = { mealType: 'lunch' as MealType, calories: 650, protein: 50, fat: 20, carbs: 55 }
    const result = selectTemplate('lunch', target, new Set(), FOOD_MAP)

    expect(result).not.toBeNull()
    expect(result!.template.mealType).toBe('lunch')
    expect(result!.scaleFactor).toBeGreaterThan(0)
  })

  it('skips templates already in usedTemplateIds', () => {
    const target = { mealType: 'lunch' as MealType, calories: 650, protein: 50, fat: 20, carbs: 55 }
    const lunchTemplates = getTemplatesByMealType('lunch')

    // Mark all but one as used
    const usedIds = new Set(lunchTemplates.slice(0, -1).map((t) => t.id))
    const result = selectTemplate('lunch', target, usedIds, FOOD_MAP)

    if (result) {
      expect(usedIds.has(result.template.id)).toBe(false)
    }
  })

  it('returns null when no template fits within tolerance', () => {
    // Extremely low calorie target that no lunch template can scale down to
    const target = { mealType: 'lunch' as MealType, calories: 50, protein: 5, fat: 2, carbs: 5 }
    const result = selectTemplate('lunch', target, new Set(), FOOD_MAP)

    expect(result).toBeNull()
  })

  it('returns null for meal types with no templates (snack)', () => {
    const target = { mealType: 'snack' as MealType, calories: 300, protein: 20, fat: 10, carbs: 30 }
    const result = selectTemplate('snack', target, new Set(), FOOD_MAP)

    expect(result).toBeNull()
  })
})

// ── generateWeeklyMealPlan ──────────────────────────────────────────

describe('generateWeeklyMealPlan', () => {
  const baseParams = {
    proteinGrams: 180,
    fatGrams: 80,
    carbGrams: 200,
    mealsPerDay: 3 as const,
    trainingDays: [0, 2, 4] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[],
  }

  it('returns exactly 7 days', () => {
    const days = generateWeeklyMealPlan(baseParams)
    expect(days).toHaveLength(7)
  })

  it('each day has the correct number of meals', () => {
    const days = generateWeeklyMealPlan(baseParams)
    for (const day of days) {
      expect(day.meals.length).toBe(baseParams.mealsPerDay)
    }
  })

  it('training days are correctly flagged', () => {
    const days = generateWeeklyMealPlan(baseParams)
    expect(days[0].isTrainingDay).toBe(true) // Sunday
    expect(days[1].isTrainingDay).toBe(false) // Monday
    expect(days[2].isTrainingDay).toBe(true) // Tuesday
    expect(days[3].isTrainingDay).toBe(false) // Wednesday
    expect(days[4].isTrainingDay).toBe(true) // Thursday
  })

  it('dayOfWeek is set correctly for all 7 days', () => {
    const days = generateWeeklyMealPlan(baseParams)
    for (let i = 0; i < 7; i++) {
      expect(days[i].dayOfWeek).toBe(i)
    }
  })

  it('no duplicate templates within the same day', () => {
    const days = generateWeeklyMealPlan(baseParams)
    for (const day of days) {
      const templateIds = day.meals.filter((m) => m.templateId).map((m) => m.templateId)
      const unique = new Set(templateIds)
      expect(unique.size).toBe(templateIds.length)
    }
  })

  it('day totals reflect sum of meal macros', () => {
    const days = generateWeeklyMealPlan(baseParams)
    for (const day of days) {
      const mealCalories = day.meals.reduce((s, m) => s + m.totalCalories, 0)
      expect(day.totalCalories).toBeCloseTo(mealCalories, 0)
    }
  })

  it('daily calories are within reasonable range of targets', () => {
    const days = generateWeeklyMealPlan(baseParams)
    for (const day of days) {
      // Allow 15% tolerance (templates may not perfectly match)
      // Expected calories from macros: 180*4 + 80*9 + 200*4 = 2240
      const expectedCalories =
        baseParams.proteinGrams * 4 + baseParams.fatGrams * 9 + baseParams.carbGrams * 4
      expect(day.totalCalories).toBeGreaterThan(expectedCalories * 0.85)
      expect(day.totalCalories).toBeLessThan(expectedCalories * 1.15)
    }
  })

  it('works with 4 meals per day', () => {
    const days = generateWeeklyMealPlan({ ...baseParams, mealsPerDay: 4 })
    expect(days).toHaveLength(7)
    for (const day of days) {
      expect(day.meals.length).toBeGreaterThan(0)
    }
  })

  it('meal items have valid food data', () => {
    const days = generateWeeklyMealPlan(baseParams)
    for (const day of days) {
      for (const meal of day.meals) {
        for (const item of meal.items) {
          expect(item.foodId).toBeTruthy()
          expect(item.gramsConsumed).toBeGreaterThan(0)
          expect(item.calories).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })
})
