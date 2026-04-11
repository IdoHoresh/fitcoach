/**
 * Tests for NutritionDashboard pure helpers.
 */

import { computeDayTotals, groupFoodsByMeal } from './nutritionDashboard.helpers'
import type { FoodLogEntry } from '@/types'

const makeEntry = (
  id: string,
  mealType: FoodLogEntry['mealType'],
  calories: number,
  protein = 10,
  carbs = 5,
  fat = 3,
): FoodLogEntry => ({
  id,
  foodId: 'food_001',
  nameHe: 'מוצר בדיקה',
  mealType,
  date: '2026-04-10',
  servingAmount: 100,
  servingUnit: 'grams',
  gramsConsumed: 100,
  calories,
  protein,
  fat,
  carbs,
})

// ── computeDayTotals ──────────────────────────────────────────────

describe('computeDayTotals', () => {
  it('returns zeros for empty entries', () => {
    expect(computeDayTotals([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  })

  it('sums calories from all entries', () => {
    const entries = [
      makeEntry('a', 'breakfast', 300),
      makeEntry('b', 'lunch', 500),
      makeEntry('c', 'dinner', 400),
    ]
    expect(computeDayTotals(entries).calories).toBe(1200)
  })

  it('sums protein from all entries', () => {
    const entries = [makeEntry('a', 'breakfast', 200, 30), makeEntry('b', 'lunch', 400, 20)]
    expect(computeDayTotals(entries).protein).toBe(50)
  })

  it('sums carbs and fat', () => {
    const entries = [
      makeEntry('a', 'breakfast', 200, 10, 40, 5),
      makeEntry('b', 'lunch', 200, 10, 60, 10),
    ]
    const totals = computeDayTotals(entries)
    expect(totals.carbs).toBe(100)
    expect(totals.fat).toBe(15)
  })

  it('handles single entry correctly', () => {
    const entry = makeEntry('a', 'snack', 100, 5, 10, 3)
    expect(computeDayTotals([entry])).toEqual({ calories: 100, protein: 5, carbs: 10, fat: 3 })
  })
})

// ── groupFoodsByMeal ──────────────────────────────────────────────

describe('groupFoodsByMeal', () => {
  it('returns map with all four meal types', () => {
    const result = groupFoodsByMeal([])
    expect(result.has('breakfast')).toBe(true)
    expect(result.has('lunch')).toBe(true)
    expect(result.has('dinner')).toBe(true)
    expect(result.has('snack')).toBe(true)
  })

  it('all buckets are empty for no entries', () => {
    const result = groupFoodsByMeal([])
    result.forEach((bucket) => expect(bucket).toHaveLength(0))
  })

  it('routes entries to correct meal bucket', () => {
    const entries = [
      makeEntry('a', 'breakfast', 200),
      makeEntry('b', 'lunch', 300),
      makeEntry('c', 'lunch', 400),
    ]
    const result = groupFoodsByMeal(entries)
    expect(result.get('breakfast')).toHaveLength(1)
    expect(result.get('lunch')).toHaveLength(2)
    expect(result.get('dinner')).toHaveLength(0)
  })

  it('preserves order within a meal bucket', () => {
    const entries = [makeEntry('first', 'dinner', 100), makeEntry('second', 'dinner', 200)]
    const bucket = groupFoodsByMeal(entries).get('dinner')!
    expect(bucket[0].id).toBe('first')
    expect(bucket[1].id).toBe('second')
  })

  it('ignores pre_workout / post_workout entries gracefully', () => {
    // These meal types are not in the V1 display set — should not crash
    const entries = [makeEntry('a', 'pre_workout', 100)]
    expect(() => groupFoodsByMeal(entries)).not.toThrow()
  })
})
