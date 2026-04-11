/**
 * Tests for shufersal-overrides.ts
 * Verifies all protein yoghurt SKUs are present with correct data.
 */

import { PROTEIN_YOGHURT_OVERRIDES } from './shufersal-overrides'
import type { FoodSeed } from './tzameret-overrides'

// ── Helpers ───────────────────────────────────────────────────────────────

function getByBrand(prefix: string): FoodSeed[] {
  return PROTEIN_YOGHURT_OVERRIDES.filter((f) => f.id.startsWith(prefix))
}

function getById(id: string): FoodSeed | undefined {
  return PROTEIN_YOGHURT_OVERRIDES.find((f) => f.id === id)
}

function parseServings(food: FoodSeed) {
  return JSON.parse(food.servingSizesJson) as { nameHe: string; nameEn: string; grams: number }[]
}

// ── Coverage ──────────────────────────────────────────────────────────────

describe('PROTEIN_YOGHURT_OVERRIDES — coverage', () => {
  it('contains at least 45 SKUs total', () => {
    expect(PROTEIN_YOGHURT_OVERRIDES.length).toBeGreaterThanOrEqual(45)
  })

  it('contains at least 14 Danone PRO SKUs', () => {
    expect(getByBrand('manual_danone_pro').length).toBeGreaterThanOrEqual(14)
  })

  it('contains at least 12 Müller SKUs', () => {
    expect(getByBrand('manual_muller').length).toBeGreaterThanOrEqual(12)
  })

  it('contains at least 15 Yoplait GO SKUs', () => {
    expect(getByBrand('manual_yoplait_go').length).toBeGreaterThanOrEqual(15)
  })
})

// ── Data integrity ────────────────────────────────────────────────────────

describe('PROTEIN_YOGHURT_OVERRIDES — data integrity', () => {
  it('no duplicate IDs', () => {
    const ids = PROTEIN_YOGHURT_OVERRIDES.map((f) => f.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('every SKU has all required fields', () => {
    const required = [
      'id',
      'nameHe',
      'nameEn',
      'category',
      'caloriesPer100g',
      'proteinPer100g',
      'fatPer100g',
      'carbsPer100g',
      'fiberPer100g',
      'isUserCreated',
      'servingSizesJson',
    ] as const
    for (const food of PROTEIN_YOGHURT_OVERRIDES) {
      for (const field of required) {
        expect(food[field]).toBeDefined()
      }
    }
  })

  it('every SKU has category = dairy', () => {
    for (const food of PROTEIN_YOGHURT_OVERRIDES) {
      expect(food.category).toBe('dairy')
    }
  })

  it('every SKU has isUserCreated = false', () => {
    for (const food of PROTEIN_YOGHURT_OVERRIDES) {
      expect(food.isUserCreated).toBe(false)
    }
  })

  it('every SKU has at least 2 serving sizes (100g + container)', () => {
    for (const food of PROTEIN_YOGHURT_OVERRIDES) {
      const servings = parseServings(food)
      expect(servings.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('every SKU includes a 100g serving', () => {
    for (const food of PROTEIN_YOGHURT_OVERRIDES) {
      const servings = parseServings(food)
      const has100g = servings.some((s) => s.grams === 100)
      expect(has100g).toBe(true)
    }
  })

  it('every SKU has positive calories', () => {
    for (const food of PROTEIN_YOGHURT_OVERRIDES) {
      expect(food.caloriesPer100g).toBeGreaterThan(0)
    }
  })

  it('every SKU has positive protein', () => {
    for (const food of PROTEIN_YOGHURT_OVERRIDES) {
      expect(food.proteinPer100g).toBeGreaterThan(0)
    }
  })

  it('servingSizesJson is valid JSON for every SKU', () => {
    for (const food of PROTEIN_YOGHURT_OVERRIDES) {
      expect(() => JSON.parse(food.servingSizesJson)).not.toThrow()
    }
  })
})

// ── Spot checks — key products ────────────────────────────────────────────

describe('PROTEIN_YOGHURT_OVERRIDES — macro spot checks', () => {
  it('Danone PRO Natural 25g (2%) has protein ≥ 11.5g/100g', () => {
    const food = getById('manual_danone_pro_natural_2pct_25g')
    expect(food).toBeDefined()
    expect(food!.proteinPer100g).toBeGreaterThanOrEqual(11.5)
  })

  it('Danone PRO Natural 25g (2%) has 215g container serving', () => {
    const food = getById('manual_danone_pro_natural_2pct_25g')!
    const servings = parseServings(food)
    expect(servings.some((s) => s.grams === 215)).toBe(true)
  })

  it('Müller Protein plain 0% has protein = 12.5g/100g', () => {
    const food = getById('manual_muller_protein_plain_0pct')
    expect(food).toBeDefined()
    expect(food!.proteinPer100g).toBe(12.5)
  })

  it('Müller Protein plain 0% has 200g container serving', () => {
    const food = getById('manual_muller_protein_plain_0pct')!
    const servings = parseServings(food)
    expect(servings.some((s) => s.grams === 200)).toBe(true)
  })

  it('Yoplait GO Natural 2% has protein = 10.0g/100g', () => {
    const food = getById('manual_yoplait_go_natural_2pct')
    expect(food).toBeDefined()
    expect(food!.proteinPer100g).toBe(10.0)
  })

  it('Yoplait GO Natural 2% has 200g container serving', () => {
    const food = getById('manual_yoplait_go_natural_2pct')!
    const servings = parseServings(food)
    expect(servings.some((s) => s.grams === 200)).toBe(true)
  })

  it('Yoplait GO 25g Natural has protein = 12.5g/100g', () => {
    const food = getById('manual_yoplait_go_25g_natural_2pct')
    expect(food).toBeDefined()
    expect(food!.proteinPer100g).toBe(12.5)
  })

  it('Müller Protein drinkable coffee has container = 350g', () => {
    const food = getById('manual_muller_protein_drink_coffee_0pct')!
    const servings = parseServings(food)
    expect(servings.some((s) => s.grams === 350)).toBe(true)
  })
})
