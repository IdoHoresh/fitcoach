import type { FoodItem, ServingTickEntry } from '@/types/nutrition'
import { detectTickCrossings, getCookedVariant, getServingTicks } from './serving-ticks.helpers'

// ── Test fixtures ───────────────────────────────────────────────

const chickenRaw: FoodItem = {
  id: 'food_001',
  slug: 'chicken_breast_raw',
  nameHe: 'חזה עוף (נא)',
  nameEn: 'Chicken Breast (raw)',
  category: 'protein',
  isUserCreated: false,
  caloriesPer100g: 120,
  proteinPer100g: 23,
  fatPer100g: 2.6,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [
    { nameHe: 'חזה אחד', nameEn: 'One breast', unit: 'piece', grams: 200 },
    { nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 },
  ],
}

const chickenCooked: FoodItem = {
  ...chickenRaw,
  id: 'food_002',
  slug: 'chicken_breast_cooked',
  nameHe: 'חזה עוף (מבושל)',
  nameEn: 'Chicken Breast (cooked)',
  caloriesPer100g: 165,
  proteinPer100g: 31,
  fatPer100g: 3.6,
}

const orphanFood: FoodItem = {
  id: 'food_999',
  // no slug — non-curated SQLite-seeded row
  nameHe: 'פרי לא מזוהה',
  nameEn: 'Unknown Fruit',
  category: 'fruits',
  isUserCreated: false,
  caloriesPer100g: 50,
  proteinPer100g: 0,
  fatPer100g: 0,
  carbsPer100g: 12,
  fiberPer100g: 2,
  servingSizes: [{ nameHe: 'פרי אחד', nameEn: 'One fruit', unit: 'piece', grams: 150 }],
}

const emptyServingsFood: FoodItem = {
  ...orphanFood,
  id: 'food_998',
  servingSizes: [],
}

const eggFood: FoodItem = {
  id: 'food_006',
  slug: 'egg',
  nameHe: 'ביצה',
  nameEn: 'Egg (whole)',
  category: 'protein',
  isUserCreated: false,
  caloriesPer100g: 155,
  proteinPer100g: 13,
  fatPer100g: 11,
  carbsPer100g: 1.1,
  fiberPer100g: 0,
  servingSizes: [],
}

const tickMapWithChicken: Record<string, ServingTickEntry> = {
  chicken_breast_raw: {
    ticks: [
      { grams: 50, nameHe: '¼ חזה', nameEn: 'quarter breast', isPrimary: false },
      { grams: 125, nameHe: '½ חזה', nameEn: 'half breast', isPrimary: true },
      { grams: 200, nameHe: 'חזה אחד', nameEn: 'one breast', isPrimary: true },
    ],
    handPortion: 'palm',
    cookedVariantSlug: 'chicken_breast_cooked',
  },
  chicken_breast_cooked: {
    ticks: [
      { grams: 50, nameHe: '¼ חזה', nameEn: 'quarter breast', isPrimary: false },
      { grams: 125, nameHe: '½ חזה', nameEn: 'half breast', isPrimary: true },
      { grams: 200, nameHe: 'חזה אחד', nameEn: 'one breast', isPrimary: true },
    ],
    handPortion: 'palm',
    cookedVariantSlug: 'chicken_breast_raw',
  },
}

const tickMapNoSibling: Record<string, ServingTickEntry> = {
  egg: {
    ticks: [{ grams: 50, nameHe: 'ביצה', nameEn: 'one egg', isPrimary: true }],
    handPortion: 'unit',
    cookedVariantSlug: null,
  },
}

// ── Tests ───────────────────────────────────────────────────────

describe('detectTickCrossings', () => {
  it('detects single crossing on increase', () => {
    expect(detectTickCrossings(100, 130, [50, 125, 200])).toEqual([125])
  })

  it('detects single crossing on decrease', () => {
    expect(detectTickCrossings(150, 80, [50, 125, 200])).toEqual([125])
  })

  it('detects no crossings between ticks', () => {
    expect(detectTickCrossings(60, 100, [50, 125, 200])).toEqual([])
  })

  it('detects multiple crossings on big jump', () => {
    expect(detectTickCrossings(40, 250, [50, 125, 200])).toEqual([50, 125, 200])
  })

  it('handles boundary equality (landing exactly on tick)', () => {
    expect(detectTickCrossings(100, 125, [50, 125, 200])).toEqual([125])
  })

  it('handles empty tick array', () => {
    expect(detectTickCrossings(100, 200, [])).toEqual([])
  })

  it('handles same prev and new (no movement)', () => {
    expect(detectTickCrossings(100, 100, [50, 125, 200])).toEqual([])
  })
})

describe('getServingTicks', () => {
  it('returns curated ticks when food has slug in tickMap', () => {
    const ticks = getServingTicks(chickenRaw, tickMapWithChicken)
    expect(ticks).toHaveLength(3)
    expect(ticks[0].grams).toBe(50)
    expect(ticks[1].nameHe).toBe('½ חזה')
    expect(ticks[2].grams).toBe(200)
  })

  it('falls back to deriving ticks from servingSizes when slug is missing', () => {
    const ticks = getServingTicks(orphanFood, tickMapWithChicken)
    expect(ticks).toHaveLength(1)
    expect(ticks[0].grams).toBe(150)
    // First few servingSizes are flagged primary so they show as quick-pills
    expect(ticks[0].isPrimary).toBe(true)
  })

  it('falls back when slug exists but no map entry, sorted ascending', () => {
    // chickenRaw has slug `chicken_breast_raw` but the empty map doesn't know it.
    // servingSizes were declared in [200, 100] order; helper must sort them.
    const ticks = getServingTicks(chickenRaw, {})
    expect(ticks.map((t) => t.grams)).toEqual([100, 200])
  })

  it('returns empty array when food has no slug match and no servingSizes', () => {
    const ticks = getServingTicks(emptyServingsFood, {})
    expect(ticks).toEqual([])
  })
})

describe('getCookedVariant', () => {
  it('returns sibling food when cookedVariantSlug resolves to a food in allFoods', () => {
    const result = getCookedVariant(chickenRaw, [chickenRaw, chickenCooked], tickMapWithChicken)
    expect(result).toBe(chickenCooked)
  })

  it('returns null when entry has no cookedVariantSlug', () => {
    const result = getCookedVariant(eggFood, [eggFood], tickMapNoSibling)
    expect(result).toBeNull()
  })

  it('returns null when input food has no slug', () => {
    const result = getCookedVariant(
      orphanFood,
      [orphanFood, chickenRaw, chickenCooked],
      tickMapWithChicken,
    )
    expect(result).toBeNull()
  })
})
