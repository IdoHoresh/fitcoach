/**
 * Tests for food macro pure helpers.
 */

import { computeFoodMacros } from './foodSearch.helpers'
import type { FoodItem } from '@/types'

// ── Fixtures ──────────────────────────────────────────────────────

const MOCK_FOOD: FoodItem = {
  id: 'food_test_001',
  nameHe: 'חזה עוף בגריל',
  nameEn: 'Grilled Chicken Breast',
  category: 'protein',
  isUserCreated: false,
  caloriesPer100g: 165,
  proteinPer100g: 31,
  fatPer100g: 3.6,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [{ nameHe: 'מנה', nameEn: 'serving', unit: 'grams', grams: 150 }],
}

// ── computeFoodMacros ─────────────────────────────────────────────

describe('computeFoodMacros', () => {
  it('computes calories proportionally for given grams', () => {
    const result = computeFoodMacros(MOCK_FOOD, 100)
    expect(result.calories).toBeCloseTo(165, 0)
  })

  it('scales correctly for 150g serving', () => {
    const result = computeFoodMacros(MOCK_FOOD, 150)
    expect(result.calories).toBeCloseTo(247.5, 0)
    expect(result.protein).toBeCloseTo(46.5, 0)
  })

  it('returns zero macros for 0 grams', () => {
    const result = computeFoodMacros(MOCK_FOOD, 0)
    expect(result.calories).toBe(0)
    expect(result.protein).toBe(0)
    expect(result.fat).toBe(0)
    expect(result.carbs).toBe(0)
  })

  it('returns all four macro keys', () => {
    const result = computeFoodMacros(MOCK_FOOD, 100)
    expect(result).toHaveProperty('calories')
    expect(result).toHaveProperty('protein')
    expect(result).toHaveProperty('fat')
    expect(result).toHaveProperty('carbs')
  })
})
