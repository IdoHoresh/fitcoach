import { RawIngredientSchema, type RawIngredient } from './schema'

const validEntry: RawIngredient = {
  id: 'raw_chicken_breast_raw',
  baseSlug: 'chicken_breast',
  state: 'raw',
  priority: 'P0',
  nameHe: 'חזה עוף',
  nameEn: 'Chicken breast, raw',
  category: 'protein',
  caloriesPer100g: 120,
  proteinPer100g: 22.5,
  fatPer100g: 2.6,
  carbsPer100g: 0,
  fiberPer100g: 0,
  isUserCreated: false,
  servingSizesJson: JSON.stringify([
    { nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 },
    { nameHe: 'חזה בינוני', nameEn: 'Medium breast', unit: 'piece', grams: 170 },
  ]),
  sourceComment: 'USDA SR Legacy 05062',
}

describe('RawIngredientSchema', () => {
  it('accepts a valid entry', () => {
    expect(() => RawIngredientSchema.parse(validEntry)).not.toThrow()
  })

  it('rejects id without raw_ prefix', () => {
    expect(() => RawIngredientSchema.parse({ ...validEntry, id: 'sh_foo' })).toThrow()
  })

  it('rejects empty nameHe', () => {
    expect(() => RawIngredientSchema.parse({ ...validEntry, nameHe: '' })).toThrow()
  })

  it('rejects empty nameEn', () => {
    expect(() => RawIngredientSchema.parse({ ...validEntry, nameEn: '' })).toThrow()
  })

  it('rejects zero calories', () => {
    expect(() => RawIngredientSchema.parse({ ...validEntry, caloriesPer100g: 0 })).toThrow()
  })

  it('rejects negative protein', () => {
    expect(() => RawIngredientSchema.parse({ ...validEntry, proteinPer100g: -1 })).toThrow()
  })

  it('rejects negative fat', () => {
    expect(() => RawIngredientSchema.parse({ ...validEntry, fatPer100g: -0.1 })).toThrow()
  })

  it('rejects negative carbs', () => {
    expect(() => RawIngredientSchema.parse({ ...validEntry, carbsPer100g: -1 })).toThrow()
  })

  it('rejects invalid state', () => {
    expect(() => RawIngredientSchema.parse({ ...validEntry, state: 'grilled' as never })).toThrow()
  })

  it('accepts cooked state', () => {
    expect(() =>
      RawIngredientSchema.parse({
        ...validEntry,
        state: 'cooked',
        id: 'raw_chicken_breast_cooked',
      }),
    ).not.toThrow()
  })

  it('rejects invalid priority', () => {
    expect(() => RawIngredientSchema.parse({ ...validEntry, priority: 'P3' as never })).toThrow()
  })

  it('rejects empty baseSlug', () => {
    expect(() => RawIngredientSchema.parse({ ...validEntry, baseSlug: '' })).toThrow()
  })

  it('rejects servingSizesJson missing 100g entry', () => {
    const bad = JSON.stringify([
      { nameHe: 'חזה בינוני', nameEn: 'Medium breast', unit: 'piece', grams: 170 },
    ])
    expect(() => RawIngredientSchema.parse({ ...validEntry, servingSizesJson: bad })).toThrow()
  })

  it('rejects empty serving sizes array', () => {
    expect(() =>
      RawIngredientSchema.parse({ ...validEntry, servingSizesJson: JSON.stringify([]) }),
    ).toThrow()
  })

  it('rejects serving size with zero grams', () => {
    const bad = JSON.stringify([
      { nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 },
      { nameHe: 'בד', nameEn: 'bad', unit: 'piece', grams: 0 },
    ])
    expect(() => RawIngredientSchema.parse({ ...validEntry, servingSizesJson: bad })).toThrow()
  })

  it('rejects malformed servingSizesJson', () => {
    expect(() =>
      RawIngredientSchema.parse({ ...validEntry, servingSizesJson: 'not json' }),
    ).toThrow()
  })

  it('allows omitted sourceComment', () => {
    const { sourceComment: _unused, ...rest } = validEntry
    void _unused
    expect(() => RawIngredientSchema.parse(rest)).not.toThrow()
  })
})
