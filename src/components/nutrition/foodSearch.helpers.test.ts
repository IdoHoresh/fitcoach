/**
 * Tests for food search pure helpers.
 * RED phase: written before the helpers exist.
 */

import { searchFoods, computeFoodMacros } from './foodSearch.helpers'
import { FOOD_MAP } from '@/data/foods'
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

const MOCK_MAP: ReadonlyMap<string, FoodItem> = new Map([['food_test_001', MOCK_FOOD]])

// ── searchFoods ───────────────────────────────────────────────────

describe('searchFoods', () => {
  it('returns all foods for empty query', () => {
    expect(searchFoods('', MOCK_MAP)).toEqual([MOCK_FOOD])
  })

  it('returns all foods for whitespace-only query', () => {
    expect(searchFoods('   ', MOCK_MAP)).toEqual([MOCK_FOOD])
  })

  it('finds food by Hebrew name (partial match)', () => {
    const results = searchFoods('עוף', MOCK_MAP)
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('food_test_001')
  })

  it('finds food by English name (case-insensitive)', () => {
    const results = searchFoods('chicken', MOCK_MAP)
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('food_test_001')
  })

  it('finds food by English name regardless of case', () => {
    const results = searchFoods('CHICKEN', MOCK_MAP)
    expect(results).toHaveLength(1)
  })

  it('returns empty when no match found', () => {
    const results = searchFoods('פיצה', MOCK_MAP)
    expect(results).toEqual([])
  })

  it('searches against the real FOOD_MAP for known Israeli foods', () => {
    const results = searchFoods('עוף', FOOD_MAP)
    expect(results.length).toBeGreaterThan(0)
    expect(
      results.every((f) => f.nameHe.includes('עוף') || f.nameEn.toLowerCase().includes('chicken')),
    ).toBe(true)
  })
})

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
