/**
 * Open Food Facts service tests.
 *
 * normalizeOffProduct is a pure function — tested directly.
 * fetchOffProduct does network I/O — verified manually on device.
 */

import { normalizeOffProduct } from './open-food-facts'

// ── Fixtures ──────────────────────────────────────────────────────────

const FULL_OFF_RESPONSE = {
  status: 1,
  product: {
    product_name_he: 'עוגיות שוקולד',
    product_name_en: 'Chocolate Cookies',
    product_name: 'Chocolate Cookies',
    nutriments: {
      'energy-kcal_100g': 480,
      proteins_100g: 6,
      fat_100g: 22,
      carbohydrates_100g: 64,
      fiber_100g: 2,
    },
  },
}

const EAN = '7290000066318'

// ── normalizeOffProduct ───────────────────────────────────────────────

describe('normalizeOffProduct()', () => {
  it('maps a full OFF response to a valid FoodItem', () => {
    const { food, isPartial } = normalizeOffProduct(FULL_OFF_RESPONSE, EAN)

    expect(food.id).toBe(`manual_${EAN}`)
    expect(food.nameHe).toBe('עוגיות שוקולד')
    expect(food.nameEn).toBe('Chocolate Cookies')
    expect(food.caloriesPer100g).toBe(480)
    expect(food.proteinPer100g).toBe(6)
    expect(food.fatPer100g).toBe(22)
    expect(food.carbsPer100g).toBe(64)
    expect(food.fiberPer100g).toBe(2)
    expect(food.category).toBe('snacks')
    expect(food.isUserCreated).toBe(false)
    expect(isPartial).toBe(false)
  })

  it('sets id to manual_<ean>', () => {
    const { food } = normalizeOffProduct(FULL_OFF_RESPONSE, '1234567890123')
    expect(food.id).toBe('manual_1234567890123')
  })

  it('includes a default 100g serving size', () => {
    const { food } = normalizeOffProduct(FULL_OFF_RESPONSE, EAN)
    expect(food.servingSizes).toHaveLength(1)
    expect(food.servingSizes[0]).toMatchObject({ grams: 100, unit: 'grams' })
  })

  it('isPartial = true when protein is missing', () => {
    const response = {
      ...FULL_OFF_RESPONSE,
      product: {
        ...FULL_OFF_RESPONSE.product,
        nutriments: { ...FULL_OFF_RESPONSE.product.nutriments, proteins_100g: undefined },
      },
    }
    const { isPartial } = normalizeOffProduct(response, EAN)
    expect(isPartial).toBe(true)
  })

  it('isPartial = true when fat is missing', () => {
    const response = {
      ...FULL_OFF_RESPONSE,
      product: {
        ...FULL_OFF_RESPONSE.product,
        nutriments: { ...FULL_OFF_RESPONSE.product.nutriments, fat_100g: undefined },
      },
    }
    const { isPartial } = normalizeOffProduct(response, EAN)
    expect(isPartial).toBe(true)
  })

  it('isPartial = true when carbs are missing', () => {
    const response = {
      ...FULL_OFF_RESPONSE,
      product: {
        ...FULL_OFF_RESPONSE.product,
        nutriments: { ...FULL_OFF_RESPONSE.product.nutriments, carbohydrates_100g: undefined },
      },
    }
    const { isPartial } = normalizeOffProduct(response, EAN)
    expect(isPartial).toBe(true)
  })

  it('falls back nameHe to product_name_en when product_name_he is absent', () => {
    const response = {
      ...FULL_OFF_RESPONSE,
      product: {
        ...FULL_OFF_RESPONSE.product,
        product_name_he: undefined,
      },
    }
    const { food } = normalizeOffProduct(response, EAN)
    expect(food.nameHe).toBe('Chocolate Cookies')
  })

  it('falls back nameHe to product_name when product_name_he and product_name_en are absent', () => {
    const response = {
      ...FULL_OFF_RESPONSE,
      product: {
        ...FULL_OFF_RESPONSE.product,
        product_name_he: undefined,
        product_name_en: undefined,
      },
    }
    const { food } = normalizeOffProduct(response, EAN)
    expect(food.nameHe).toBe('Chocolate Cookies')
  })

  it('falls back nameHe to EAN string when no name fields present', () => {
    const response = {
      ...FULL_OFF_RESPONSE,
      product: {
        ...FULL_OFF_RESPONSE.product,
        product_name_he: undefined,
        product_name_en: undefined,
        product_name: undefined,
      },
    }
    const { food } = normalizeOffProduct(response, EAN)
    expect(food.nameHe).toBe(EAN)
  })

  it('defaults fiber to 0 when absent', () => {
    const response = {
      ...FULL_OFF_RESPONSE,
      product: {
        ...FULL_OFF_RESPONSE.product,
        nutriments: { ...FULL_OFF_RESPONSE.product.nutriments, fiber_100g: undefined },
      },
    }
    const { food } = normalizeOffProduct(response, EAN)
    expect(food.fiberPer100g).toBe(0)
  })

  it('defaults missing macros to 0 (partial flag still set)', () => {
    const response = {
      status: 1,
      product: {
        product_name_he: 'מוצר חסר',
        nutriments: { 'energy-kcal_100g': 100 },
      },
    }
    const { food, isPartial } = normalizeOffProduct(response, EAN)
    expect(food.proteinPer100g).toBe(0)
    expect(food.fatPer100g).toBe(0)
    expect(food.carbsPer100g).toBe(0)
    expect(isPartial).toBe(true)
  })
})
