/**
 * Tests for build-raw-ingredients-seed.
 *
 * The builder is a pure function: it takes a RawIngredient[] and returns a
 * FoodSeed[] ready to write to src/assets/raw-ingredients-seed.json.
 * File I/O lives in the CLI wrapper and is not under test.
 */

import { buildSeed, mapRawCategory, type BuiltFoodSeed } from './build-raw-ingredients-seed'
import type { RawIngredient } from './schema'

const g100 = { nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 }
const j = (arr: unknown) => JSON.stringify(arr)

function validEntry(overrides: Partial<RawIngredient> = {}): RawIngredient {
  return {
    id: 'raw_chicken_breast_raw',
    baseSlug: 'chicken_breast',
    state: 'raw',
    priority: 'P0',
    nameHe: 'חזה עוף נא',
    nameEn: 'Chicken breast, raw',
    category: 'poultry',
    caloriesPer100g: 120,
    proteinPer100g: 22.5,
    fatPer100g: 2.62,
    carbsPer100g: 0,
    fiberPer100g: 0,
    isUserCreated: false,
    servingSizesJson: j([g100]),
    sourceComment: 'USDA SR Legacy 171077',
    ...overrides,
  }
}

describe('mapRawCategory', () => {
  test.each([
    ['poultry', 'protein'],
    ['meat', 'protein'],
    ['fish', 'protein'],
    ['eggs', 'protein'],
    ['legumes', 'protein'],
    ['nuts', 'protein'],
    ['grains', 'carbs'],
    ['fats', 'fats'],
    ['dairy', 'dairy'],
    ['vegetables', 'vegetables'],
    ['fruits', 'fruits'],
    ['condiments', 'snacks'],
    ['beverages', 'snacks'],
  ])('maps %s → %s', (input, expected) => {
    expect(mapRawCategory(input)).toBe(expected)
  })

  it('throws on unknown raw category', () => {
    expect(() => mapRawCategory('bogus')).toThrow(/unknown raw category/i)
  })
})

describe('buildSeed', () => {
  it('returns FoodSeed[] with only DB columns', () => {
    const out = buildSeed([validEntry()])
    expect(out).toHaveLength(1)
    const row = out[0] as BuiltFoodSeed
    expect(row).toEqual({
      id: 'raw_chicken_breast_raw',
      nameHe: 'חזה עוף נא',
      nameEn: 'Chicken breast, raw',
      category: 'protein',
      caloriesPer100g: 120,
      proteinPer100g: 22.5,
      fatPer100g: 2.62,
      carbsPer100g: 0,
      fiberPer100g: 0,
      isUserCreated: false,
      servingSizesJson: j([g100]),
    })
    // explicit strip check — fields that must not leak into the DB JSON
    expect(row).not.toHaveProperty('priority')
    expect(row).not.toHaveProperty('baseSlug')
    expect(row).not.toHaveProperty('state')
    expect(row).not.toHaveProperty('sourceComment')
  })

  it('maps categories across a mixed batch', () => {
    const out = buildSeed([
      validEntry({ id: 'raw_a', category: 'poultry' }),
      validEntry({ id: 'raw_b', category: 'grains' }),
      validEntry({ id: 'raw_c', category: 'vegetables' }),
    ])
    expect(out.map((r) => r.category)).toEqual(['protein', 'carbs', 'vegetables'])
  })

  it('throws on schema-invalid entry with item id in the message', () => {
    const bad = validEntry({ id: 'raw_bad', caloriesPer100g: -5 })
    expect(() => buildSeed([bad])).toThrow(/raw_bad/)
  })

  it('throws on non-raw_ id prefix', () => {
    const bad = { ...validEntry(), id: 'sh_chicken' } as RawIngredient
    expect(() => buildSeed([bad])).toThrow()
  })

  it('throws on duplicate ids', () => {
    const a = validEntry({ id: 'raw_dup' })
    const b = validEntry({ id: 'raw_dup' })
    expect(() => buildSeed([a, b])).toThrow(/duplicate/i)
  })

  it('throws on servings without a 100g entry', () => {
    const bad = validEntry({
      id: 'raw_no100',
      servingSizesJson: j([{ nameHe: 'חצי', nameEn: 'half', unit: 'grams', grams: 50 }]),
    })
    expect(() => buildSeed([bad])).toThrow(/raw_no100/)
  })
})
