import { MEAL_TEMPLATES, getTemplatesByMealType, getTemplatesByTag } from './meal-templates'
import { FOOD_MAP } from './foods'
import type { MealType } from '../types'

describe('Meal Templates', () => {
  describe('template count', () => {
    it('should have at least 10 templates', () => {
      expect(MEAL_TEMPLATES.length).toBeGreaterThanOrEqual(10)
    })
  })

  describe('unique IDs', () => {
    it('should have no duplicate template IDs', () => {
      const ids = MEAL_TEMPLATES.map((t) => t.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('every template references valid foods', () => {
    it.each(MEAL_TEMPLATES.map((t) => [t.nameEn, t]))(
      '%s — all food IDs exist in FOOD_MAP',
      (_name, template) => {
        for (const item of template.items) {
          const food = FOOD_MAP.get(item.foodId)
          expect(food).toBeDefined()
        }
      },
    )
  })

  describe('every template has valid data', () => {
    it.each(MEAL_TEMPLATES.map((t) => [t.nameEn, t]))(
      '%s — has Hebrew and English names',
      (_name, template) => {
        expect(template.nameHe.length).toBeGreaterThan(0)
        expect(template.nameEn.length).toBeGreaterThan(0)
      },
    )

    it.each(MEAL_TEMPLATES.map((t) => [t.nameEn, t]))(
      '%s — has at least one item',
      (_name, template) => {
        expect(template.items.length).toBeGreaterThanOrEqual(1)
      },
    )

    it.each(MEAL_TEMPLATES.map((t) => [t.nameEn, t]))(
      '%s — has positive approximate macros',
      (_name, template) => {
        expect(template.approxCalories).toBeGreaterThan(0)
        expect(template.approxProtein).toBeGreaterThan(0)
        expect(template.approxFat).toBeGreaterThanOrEqual(0)
        expect(template.approxCarbs).toBeGreaterThanOrEqual(0)
      },
    )

    it.each(MEAL_TEMPLATES.map((t) => [t.nameEn, t]))(
      '%s — has at least one tag',
      (_name, template) => {
        expect(template.tags.length).toBeGreaterThanOrEqual(1)
      },
    )

    it.each(MEAL_TEMPLATES.map((t) => [t.nameEn, t]))(
      '%s — all items have positive serving amounts',
      (_name, template) => {
        for (const item of template.items) {
          expect(item.defaultServingAmount).toBeGreaterThan(0)
        }
      },
    )
  })

  describe('meal type coverage', () => {
    const requiredTypes: { type: MealType; minCount: number }[] = [
      { type: 'breakfast', minCount: 2 },
      { type: 'lunch', minCount: 2 },
      { type: 'dinner', minCount: 2 },
      { type: 'post_workout', minCount: 1 },
    ]

    it.each(requiredTypes)(
      'meal type "$type" has at least $minCount templates',
      ({ type, minCount }) => {
        const templates = getTemplatesByMealType(type)
        expect(templates.length).toBeGreaterThanOrEqual(minCount)
      },
    )
  })

  describe('helper functions', () => {
    it('getTemplatesByMealType returns only matching types', () => {
      const breakfasts = getTemplatesByMealType('breakfast')
      for (const t of breakfasts) {
        expect(t.mealType).toBe('breakfast')
      }
    })

    it('getTemplatesByMealType returns empty for unused type', () => {
      const preWorkout = getTemplatesByMealType('pre_workout')
      expect(preWorkout.length).toBe(0)
    })

    it('getTemplatesByTag returns matching templates', () => {
      const traditional = getTemplatesByTag('traditional')
      expect(traditional.length).toBeGreaterThanOrEqual(1)
      for (const t of traditional) {
        expect(t.tags).toContain('traditional')
      }
    })
  })
})
