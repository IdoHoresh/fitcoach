/**
 * Tests for normalize-food.ts
 * Pure functions — no network, no DB.
 */

import { normalizeProduct, extractServingSizes, inferContainerLabel } from './normalize-food'
import type { RawShufersalProduct } from './shufersal-types'

// ── Fixtures ──────────────────────────────────────────────────────────────

const YOGHURT: RawShufersalProduct = {
  productCode: 'P_7290119377411',
  barcode: '7290119377411',
  nameHe: 'דנונה פרו 25 גרם חלבון יוגורט',
  containerGrams: 215,
  servingSizeGrams: 215,
  per100g: { calories: 88, protein: 11.6, fat: 2.0, carbs: 4.1, fiber: 1.9 },
  perServing: { calories: 189, protein: 24.9, fat: 4.3, carbs: 8.8, fiber: 4.1 },
}

const BREAD: RawShufersalProduct = {
  productCode: 'P_7290000012345',
  barcode: '7290000012345',
  nameHe: 'לחם אנגל חיטה מלאה פרוס',
  containerGrams: 750,
  servingSizeGrams: 30,
  per100g: { calories: 235, protein: 9.0, fat: 2.5, carbs: 44.0, fiber: 6.0 },
  perServing: { calories: 71, protein: 2.7, fat: 0.8, carbs: 13.2, fiber: 1.8 },
}

const MINIMAL: RawShufersalProduct = {
  productCode: 'P_7290000099999',
  barcode: '7290000099999',
  nameHe: 'מוצר כלשהו',
  containerGrams: null,
  servingSizeGrams: null,
  per100g: { calories: 100, protein: 5, fat: 3, carbs: 10, fiber: 0 },
  perServing: null,
}

// ── normalizeProduct ──────────────────────────────────────────────────────

describe('normalizeProduct', () => {
  it('returns null when calories are zero', () => {
    const raw: RawShufersalProduct = {
      ...MINIMAL,
      per100g: { ...MINIMAL.per100g, calories: 0 },
    }
    expect(normalizeProduct(raw)).toBeNull()
  })

  it('returns null when nameHe is empty', () => {
    const raw: RawShufersalProduct = { ...MINIMAL, nameHe: '' }
    expect(normalizeProduct(raw)).toBeNull()
  })

  it('returns null when nameHe is whitespace only', () => {
    const raw: RawShufersalProduct = { ...MINIMAL, nameHe: '   ' }
    expect(normalizeProduct(raw)).toBeNull()
  })

  it('assigns id as sh_<barcode>', () => {
    const result = normalizeProduct(YOGHURT)
    expect(result?.id).toBe('sh_7290119377411')
  })

  it('maps calories correctly', () => {
    expect(normalizeProduct(YOGHURT)?.caloriesPer100g).toBe(88)
  })

  it('maps protein correctly', () => {
    expect(normalizeProduct(YOGHURT)?.proteinPer100g).toBe(11.6)
  })

  it('maps fat correctly', () => {
    expect(normalizeProduct(YOGHURT)?.fatPer100g).toBe(2.0)
  })

  it('maps carbs correctly', () => {
    expect(normalizeProduct(YOGHURT)?.carbsPer100g).toBe(4.1)
  })

  it('maps fiber correctly', () => {
    expect(normalizeProduct(YOGHURT)?.fiberPer100g).toBe(1.9)
  })

  it('sets isUserCreated to false', () => {
    expect(normalizeProduct(YOGHURT)?.isUserCreated).toBe(false)
  })

  it('uses nameHe trimmed', () => {
    const raw = { ...MINIMAL, nameHe: '  מוצר  ' }
    expect(normalizeProduct(raw)?.nameHe).toBe('מוצר')
  })

  it('sets nameEn to nameHe when no English name available', () => {
    const result = normalizeProduct(MINIMAL)
    expect(result?.nameEn).toBe(MINIMAL.nameHe)
  })

  it('assigns dairy category for a yoghurt product', () => {
    expect(normalizeProduct(YOGHURT)?.category).toBe('dairy')
  })

  it('assigns carbs category for a bread product', () => {
    expect(normalizeProduct(BREAD)?.category).toBe('carbs')
  })

  it('returns a valid FoodSeed with all required fields', () => {
    const result = normalizeProduct(YOGHURT)
    expect(result).not.toBeNull()
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
    ]
    for (const field of required) {
      expect(result).toHaveProperty(field)
    }
  })

  it('servingSizesJson is valid JSON', () => {
    const result = normalizeProduct(YOGHURT)!
    expect(() => JSON.parse(result.servingSizesJson)).not.toThrow()
  })
})

// ── extractServingSizes ───────────────────────────────────────────────────

describe('extractServingSizes', () => {
  it('always includes 100g serving', () => {
    const sizes = extractServingSizes(MINIMAL)
    const has100g = sizes.some((s) => s.grams === 100)
    expect(has100g).toBe(true)
  })

  it('100g serving has correct nameHe', () => {
    const sizes = extractServingSizes(MINIMAL)
    const s = sizes.find((s) => s.grams === 100)!
    expect(s.nameHe).toBe('100 גרם')
  })

  it('100g serving has correct nameEn', () => {
    const sizes = extractServingSizes(MINIMAL)
    const s = sizes.find((s) => s.grams === 100)!
    expect(s.nameEn).toBe('100g')
  })

  it('adds container serving when containerGrams is present', () => {
    const sizes = extractServingSizes(YOGHURT)
    const hasContainer = sizes.some((s) => s.grams === 215)
    expect(hasContainer).toBe(true)
  })

  it('does not add duplicate 100g entry when containerGrams is 100', () => {
    const raw: RawShufersalProduct = { ...MINIMAL, containerGrams: 100 }
    const sizes = extractServingSizes(raw)
    const count100g = sizes.filter((s) => s.grams === 100).length
    expect(count100g).toBe(1)
  })

  it('adds per-serving when servingSizeGrams differs from containerGrams', () => {
    const sizes = extractServingSizes(BREAD)
    const hasSlice = sizes.some((s) => s.grams === 30)
    expect(hasSlice).toBe(true)
  })

  it('does not add per-serving duplicate when servingSizeGrams equals containerGrams', () => {
    // YOGHURT has containerGrams=215 and servingSizeGrams=215 — same size, add only once
    const sizes = extractServingSizes(YOGHURT)
    const count215 = sizes.filter((s) => s.grams === 215).length
    expect(count215).toBe(1)
  })

  it('returns only 100g serving when all size fields are null', () => {
    const sizes = extractServingSizes(MINIMAL)
    expect(sizes).toHaveLength(1)
  })

  it('bread gets 3 serving sizes: 100g + slice + loaf', () => {
    const sizes = extractServingSizes(BREAD)
    expect(sizes).toHaveLength(3)
  })

  it('container serving grams matches containerGrams', () => {
    const sizes = extractServingSizes(YOGHURT)
    const container = sizes.find((s) => s.grams === 215)!
    expect(container.grams).toBe(215)
  })
})

// ── inferContainerLabel ───────────────────────────────────────────────────

describe('inferContainerLabel', () => {
  it('returns גביע שלם for yoghurt (יוגורט)', () => {
    const label = inferContainerLabel('יוגורט חלבון טבעי')
    expect(label.nameHe).toBe('גביע שלם')
    expect(label.nameEn).toBe('Full container')
  })

  it('returns גביע שלם for גבינה', () => {
    const label = inferContainerLabel('גבינה לבנה 5%')
    expect(label.nameHe).toBe('גביע שלם')
  })

  it('returns כיכר for bread (לחם)', () => {
    const label = inferContainerLabel('לחם חיטה מלאה')
    expect(label.nameHe).toBe('כיכר')
    expect(label.nameEn).toBe('Loaf')
  })

  it('returns בקבוק for bottle products (בקבוק)', () => {
    const label = inferContainerLabel('בקבוק שמן זית')
    expect(label.nameHe).toBe('בקבוק')
    expect(label.nameEn).toBe('Bottle')
  })

  it('returns אריזה שלמה for unknown products', () => {
    const label = inferContainerLabel('מוצר כלשהו')
    expect(label.nameHe).toBe('אריזה שלמה')
    expect(label.nameEn).toBe('Full package')
  })

  it('is case-insensitive for Hebrew keyword matching', () => {
    // Hebrew doesn't have uppercase, but test with mixed spacing
    const label = inferContainerLabel('  יוגורט  פרוטאין  ')
    expect(label.nameHe).toBe('גביע שלם')
  })
})
