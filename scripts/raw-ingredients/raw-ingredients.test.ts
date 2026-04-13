import { RAW_INGREDIENTS } from './raw-ingredients'
import { RawIngredientSchema } from './schema'

describe('RAW_INGREDIENTS catalog', () => {
  it('every entry passes RawIngredientSchema', () => {
    for (const entry of RAW_INGREDIENTS) {
      const result = RawIngredientSchema.safeParse(entry)
      if (!result.success) {
        throw new Error(`${entry.id} failed: ${result.error.message}`)
      }
    }
  })

  it('has unique ids', () => {
    const ids = RAW_INGREDIENTS.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every id matches raw_<baseSlug>_<state> convention', () => {
    for (const entry of RAW_INGREDIENTS) {
      expect(entry.id).toBe(`raw_${entry.baseSlug}_${entry.state}`)
    }
  })

  it('every entry has at least one serving size including 100g', () => {
    for (const entry of RAW_INGREDIENTS) {
      const sizes = JSON.parse(entry.servingSizesJson) as { grams: number }[]
      expect(sizes.some((s) => s.grams === 100)).toBe(true)
    }
  })

  it('macro grams stay within a physical sanity bound (p+f+c <= 100g)', () => {
    for (const entry of RAW_INGREDIENTS) {
      const sum = entry.proteinPer100g + entry.fatPer100g + entry.carbsPer100g
      expect(sum).toBeLessThanOrEqual(100)
    }
  })

  it('ships at least 70 protein+dairy entries (session 1 target)', () => {
    expect(RAW_INGREDIENTS.length).toBeGreaterThanOrEqual(70)
  })
})
