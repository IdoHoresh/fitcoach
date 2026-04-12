/**
 * Tests for normalize-rl-product.ts
 * Pure functions — no network, no DB.
 */

import { extractNutrient, parseNetContent, normalizeRLProduct } from './normalize-rl-product'
import type { RLProductDetail, RLNutritionalValue } from './rami-levy-types'

// ── Fixtures ──────────────────────────────────────────────────────────────

const makeNutritionalValues = (
  calories: number,
  protein: number,
  fat: number,
  carbs: number,
  fiber?: number,
): RLNutritionalValue[] => {
  const values: RLNutritionalValue[] = [
    {
      code: '79001',
      label: 'אנרגיה (קלוריות)',
      fields: [
        {
          field_name: 'Energy_per_100_grams',
          value: String(calories),
          UOM: 'קלוריות',
          col_label: 'ל-100 גרם',
        },
      ],
    },
    {
      code: '79002',
      label: 'חלבונים',
      fields: [
        {
          field_name: 'Proteins_per_100_grams',
          value: String(protein),
          UOM: 'גרם',
          col_label: 'ל-100 גרם',
        },
      ],
    },
    {
      code: '79003',
      label: 'שומנים',
      fields: [
        {
          field_name: 'Fats_per_100_grams',
          value: String(fat),
          UOM: 'גרם',
          col_label: 'ל-100 גרם',
        },
      ],
    },
    {
      code: '79004',
      label: 'פחמימות',
      fields: [
        {
          field_name: 'Carbohydrates_per_100_grams',
          value: String(carbs),
          UOM: 'גרם',
          col_label: 'ל-100 גרם',
        },
      ],
    },
  ]
  if (fiber !== undefined) {
    values.push({
      code: '79005',
      label: 'סיבים תזונתיים',
      fields: [
        {
          field_name: 'Dietary_Fiber_per_100_grams',
          value: String(fiber),
          UOM: 'גרם',
          col_label: 'ל-100 גרם',
        },
      ],
    })
  }
  return values
}

// Milk — liquid container (1 litre)
const MILK: RLProductDetail = {
  id: 3025,
  barcode: 7290004131074,
  name: "חלב תנובה 3% שומן 1 ל' קרטון",
  department_id: 50,
  gs: {
    BrandName: 'תנובה',
    Net_Content: { UOM: 'ליטר', text: '1 ליטר', value: '1' },
    Nutritional_Values: makeNutritionalValues(60, 3.3, 3.0, 4.7),
  },
}

// Yoghurt — solid container (215g)
const YOGHURT: RLProductDetail = {
  id: 9001,
  barcode: 7290119377411,
  name: 'דנונה פרו 25 גרם חלבון יוגורט',
  department_id: 50,
  gs: {
    BrandName: 'דנונה',
    Net_Content: { UOM: 'גרם', text: '215 גרם', value: '215' },
    Nutritional_Values: makeNutritionalValues(88, 11.6, 2.0, 4.1, 1.9),
  },
}

// Drink — millilitre container (500ml)
const DRINK: RLProductDetail = {
  id: 8001,
  barcode: 7290001234567,
  name: 'מיץ תפוזים טבעי 500 מ"ל',
  department_id: 57,
  gs: {
    BrandName: 'תנובה',
    Net_Content: { UOM: 'מ"ל', text: '500 מ"ל', value: '500' },
    Nutritional_Values: makeNutritionalValues(45, 0.5, 0.1, 10.5),
  },
}

// Minimal — no Net_Content
const MINIMAL: RLProductDetail = {
  id: 7001,
  barcode: 7290000099999,
  name: 'מוצר כלשהו',
  department_id: 54,
  gs: {
    BrandName: '',
    Net_Content: null,
    Nutritional_Values: makeNutritionalValues(100, 5, 3, 10),
  },
}

// No nutrition data
const NO_NUTRITION: RLProductDetail = {
  id: 5001,
  barcode: 7290000011111,
  name: 'מוצר ללא תזונה',
  department_id: 54,
  gs: {
    BrandName: '',
    Net_Content: null,
  },
}

// ── extractNutrient ───────────────────────────────────────────────────────

describe('extractNutrient', () => {
  const values = makeNutritionalValues(60, 3.3, 3.0, 4.7, 1.2)

  it('returns value for matching field_name', () => {
    expect(extractNutrient(values, 'Energy_per_100_grams')).toBe(60)
  })

  it('returns correct float for protein', () => {
    expect(extractNutrient(values, 'Proteins_per_100_grams')).toBe(3.3)
  })

  it('returns 0 when field_name not found', () => {
    expect(extractNutrient(values, 'Unknown_field')).toBe(0)
  })

  it('returns 0 when values array is empty', () => {
    expect(extractNutrient([], 'Energy_per_100_grams')).toBe(0)
  })

  it('parses string value to float correctly', () => {
    const custom: RLNutritionalValue[] = [
      {
        code: '1',
        label: 'test',
        fields: [{ field_name: 'Energy_per_100_grams', value: '11.6', UOM: 'קל', col_label: '' }],
      },
    ]
    expect(extractNutrient(custom, 'Energy_per_100_grams')).toBe(11.6)
  })

  it('returns 0 for non-numeric value string', () => {
    const custom: RLNutritionalValue[] = [
      {
        code: '1',
        label: 'test',
        fields: [{ field_name: 'Energy_per_100_grams', value: 'N/A', UOM: 'קל', col_label: '' }],
      },
    ]
    expect(extractNutrient(custom, 'Energy_per_100_grams')).toBe(0)
  })
})

// ── parseNetContent ───────────────────────────────────────────────────────

describe('parseNetContent', () => {
  it('parses גרם → { grams: N, unit: "grams" }', () => {
    expect(parseNetContent({ UOM: 'גרם', value: '215', text: '215 גרם' })).toEqual({
      grams: 215,
      unit: 'grams',
    })
  })

  it('parses ק"ג → { grams: N*1000, unit: "grams" }', () => {
    expect(parseNetContent({ UOM: 'ק"ג', value: '1', text: '1 ק"ג' })).toEqual({
      grams: 1000,
      unit: 'grams',
    })
  })

  it('parses מ"ל → { grams: N, unit: "ml" }', () => {
    expect(parseNetContent({ UOM: 'מ"ל', value: '500', text: '500 מ"ל' })).toEqual({
      grams: 500,
      unit: 'ml',
    })
  })

  it('parses ליטר → { grams: N*1000, unit: "ml" }', () => {
    expect(parseNetContent({ UOM: 'ליטר', value: '1', text: '1 ליטר' })).toEqual({
      grams: 1000,
      unit: 'ml',
    })
  })

  it('handles decimal values like "1.5 ליטר"', () => {
    expect(parseNetContent({ UOM: 'ליטר', value: '1.5', text: '1.5 ליטר' })).toEqual({
      grams: 1500,
      unit: 'ml',
    })
  })

  it('returns null for null input', () => {
    expect(parseNetContent(null)).toBeNull()
  })

  it('returns null for unrecognised UOM', () => {
    expect(parseNetContent({ UOM: 'יחידות', value: '6', text: '6 יחידות' })).toBeNull()
  })

  it('returns null when value is not numeric', () => {
    expect(parseNetContent({ UOM: 'גרם', value: 'N/A', text: 'N/A' })).toBeNull()
  })
})

// ── normalizeRLProduct ────────────────────────────────────────────────────

describe('normalizeRLProduct', () => {
  it('returns null when Nutritional_Values is absent', () => {
    expect(normalizeRLProduct(NO_NUTRITION)).toBeNull()
  })

  it('returns null when Nutritional_Values is empty array', () => {
    const raw: RLProductDetail = { ...MINIMAL, gs: { ...MINIMAL.gs, Nutritional_Values: [] } }
    expect(normalizeRLProduct(raw)).toBeNull()
  })

  it('returns null when calories are 0', () => {
    const raw: RLProductDetail = {
      ...MINIMAL,
      gs: { ...MINIMAL.gs, Nutritional_Values: makeNutritionalValues(0, 5, 3, 10) },
    }
    expect(normalizeRLProduct(raw)).toBeNull()
  })

  it('returns null when name is empty', () => {
    const raw: RLProductDetail = { ...MINIMAL, name: '' }
    expect(normalizeRLProduct(raw)).toBeNull()
  })

  it('returns null when name is whitespace only', () => {
    const raw: RLProductDetail = { ...MINIMAL, name: '   ' }
    expect(normalizeRLProduct(raw)).toBeNull()
  })

  it('assigns id as rl_<barcode>', () => {
    expect(normalizeRLProduct(YOGHURT)?.id).toBe('rl_7290119377411')
  })

  it('always includes 100g serving', () => {
    const result = normalizeRLProduct(MINIMAL)!
    const sizes = JSON.parse(result.servingSizesJson) as { grams: number }[]
    expect(sizes.some((s) => s.grams === 100)).toBe(true)
  })

  it('adds container serving when Net_Content is present (grams)', () => {
    const result = normalizeRLProduct(YOGHURT)!
    const sizes = JSON.parse(result.servingSizesJson) as { grams: number }[]
    expect(sizes.some((s) => s.grams === 215)).toBe(true)
  })

  it('uses unit "ml" for liquid Net_Content (ליטר)', () => {
    const result = normalizeRLProduct(MILK)!
    const sizes = JSON.parse(result.servingSizesJson) as { grams: number; unit: string }[]
    const container = sizes.find((s) => s.grams === 1000)
    expect(container?.unit).toBe('ml')
  })

  it('uses unit "ml" for מ"ל Net_Content', () => {
    const result = normalizeRLProduct(DRINK)!
    const sizes = JSON.parse(result.servingSizesJson) as { grams: number; unit: string }[]
    const container = sizes.find((s) => s.grams === 500)
    expect(container?.unit).toBe('ml')
  })

  it('returns only 100g serving when Net_Content is null', () => {
    const result = normalizeRLProduct(MINIMAL)!
    const sizes = JSON.parse(result.servingSizesJson) as unknown[]
    expect(sizes).toHaveLength(1)
  })

  it('maps calories correctly', () => {
    expect(normalizeRLProduct(MILK)?.caloriesPer100g).toBe(60)
  })

  it('maps protein correctly', () => {
    expect(normalizeRLProduct(MILK)?.proteinPer100g).toBe(3.3)
  })

  it('maps fat correctly', () => {
    expect(normalizeRLProduct(MILK)?.fatPer100g).toBe(3.0)
  })

  it('maps carbs correctly', () => {
    expect(normalizeRLProduct(MILK)?.carbsPer100g).toBe(4.7)
  })

  it('maps fiber correctly when present', () => {
    expect(normalizeRLProduct(YOGHURT)?.fiberPer100g).toBe(1.9)
  })

  it('defaults fiberPer100g to 0 when absent', () => {
    expect(normalizeRLProduct(MILK)?.fiberPer100g).toBe(0)
  })

  it('sets isUserCreated to false', () => {
    expect(normalizeRLProduct(YOGHURT)?.isUserCreated).toBe(false)
  })

  it('assigns dairy category for a yoghurt product', () => {
    expect(normalizeRLProduct(YOGHURT)?.category).toBe('dairy')
  })

  it('servingSizesJson is valid JSON', () => {
    const result = normalizeRLProduct(YOGHURT)!
    expect(() => JSON.parse(result.servingSizesJson)).not.toThrow()
  })

  it('returns a valid FoodSeed with all required fields', () => {
    const result = normalizeRLProduct(YOGHURT)
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
})
