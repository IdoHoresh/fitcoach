import { FOOD_DATABASE, FOOD_MAP, getFoodsByCategory } from './foods'
import type { FoodCategory } from '../types'

describe('Food Database', () => {
  describe('database size', () => {
    it('should have between 90 and 200 foods', () => {
      expect(FOOD_DATABASE.length).toBeGreaterThanOrEqual(90)
      expect(FOOD_DATABASE.length).toBeLessThanOrEqual(200)
    })
  })

  describe('unique IDs', () => {
    it('should have no duplicate IDs', () => {
      const ids = FOOD_DATABASE.map((f) => f.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('FOOD_MAP', () => {
    it('should have the same number of entries as FOOD_DATABASE', () => {
      expect(FOOD_MAP.size).toBe(FOOD_DATABASE.length)
    })

    it('should look up any food by ID', () => {
      for (const food of FOOD_DATABASE) {
        expect(FOOD_MAP.get(food.id)).toBe(food)
      }
    })

    it('should return undefined for unknown IDs', () => {
      expect(FOOD_MAP.get('food_999')).toBeUndefined()
    })
  })

  describe('every food has valid data', () => {
    it.each(FOOD_DATABASE.map((f) => [f.nameEn, f]))(
      '%s — has positive calories',
      (_name, food) => {
        expect(food.caloriesPer100g).toBeGreaterThan(0)
      },
    )

    it.each(FOOD_DATABASE.map((f) => [f.nameEn, f]))(
      '%s — macros are non-negative',
      (_name, food) => {
        expect(food.proteinPer100g).toBeGreaterThanOrEqual(0)
        expect(food.fatPer100g).toBeGreaterThanOrEqual(0)
        expect(food.carbsPer100g).toBeGreaterThanOrEqual(0)
        expect(food.fiberPer100g).toBeGreaterThanOrEqual(0)
      },
    )

    it.each(FOOD_DATABASE.map((f) => [f.nameEn, f]))(
      '%s — macro calories roughly match stated calories (within 30%%)',
      (_name, food) => {
        // P*4 + F*9 + C*4 should be close to stated calories
        // Allow 30% tolerance: fiber has ~2 kcal/g (not 4), vegetables have
        // high water content, and USDA rounds differently than simple math
        const calculatedCal = food.proteinPer100g * 4 + food.fatPer100g * 9 + food.carbsPer100g * 4
        const ratio = calculatedCal / food.caloriesPer100g
        expect(ratio).toBeGreaterThan(0.7)
        expect(ratio).toBeLessThan(1.3)
      },
    )

    it.each(FOOD_DATABASE.map((f) => [f.nameEn, f]))(
      '%s — has Hebrew and English names',
      (_name, food) => {
        expect(food.nameHe.length).toBeGreaterThan(0)
        expect(food.nameEn.length).toBeGreaterThan(0)
      },
    )

    it.each(FOOD_DATABASE.map((f) => [f.nameEn, f]))(
      '%s — has at least one serving size',
      (_name, food) => {
        expect(food.servingSizes.length).toBeGreaterThanOrEqual(1)
      },
    )

    it.each(FOOD_DATABASE.map((f) => [f.nameEn, f]))(
      '%s — all serving sizes have positive grams',
      (_name, food) => {
        for (const s of food.servingSizes) {
          expect(s.grams).toBeGreaterThan(0)
          expect(s.nameHe.length).toBeGreaterThan(0)
          expect(s.nameEn.length).toBeGreaterThan(0)
        }
      },
    )

    it.each(FOOD_DATABASE.map((f) => [f.nameEn, f]))('%s — is not user-created', (_name, food) => {
      expect(food.isUserCreated).toBe(false)
    })
  })

  describe('category coverage', () => {
    const requiredCategories: FoodCategory[] = [
      'protein',
      'carbs',
      'vegetables',
      'fruits',
      'dairy',
      'fats',
      'snacks',
      'traditional',
    ]

    it.each(requiredCategories)('category "%s" has at least 5 foods', (category) => {
      const foods = getFoodsByCategory(category)
      expect(foods.length).toBeGreaterThanOrEqual(5)
    })
  })
})
