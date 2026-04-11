/**
 * Tests for deduplicate.ts
 * Pure functions — no network, no DB.
 */

import { deduplicateScraped, filterAgainstExisting } from './deduplicate'
import type { FoodSeed } from './tzameret-overrides'

// ── Helpers ───────────────────────────────────────────────────────────────

function makeFood(id: string, nameHe = 'מוצר'): FoodSeed {
  return {
    id,
    nameHe,
    nameEn: nameHe,
    category: 'snacks',
    caloriesPer100g: 100,
    proteinPer100g: 5,
    fatPer100g: 3,
    carbsPer100g: 10,
    fiberPer100g: 0,
    isUserCreated: false,
    servingSizesJson: '[]',
  }
}

// ── deduplicateScraped ────────────────────────────────────────────────────

describe('deduplicateScraped', () => {
  it('returns all products when no duplicates exist', () => {
    const products = [makeFood('sh_111'), makeFood('sh_222'), makeFood('sh_333')]
    expect(deduplicateScraped(products)).toHaveLength(3)
  })

  it('removes products with duplicate IDs, keeps first occurrence', () => {
    const first = makeFood('sh_111', 'ראשון')
    const duplicate = makeFood('sh_111', 'כפול')
    const result = deduplicateScraped([first, duplicate])
    expect(result).toHaveLength(1)
    expect(result[0].nameHe).toBe('ראשון')
  })

  it('removes multiple duplicates', () => {
    const products = [
      makeFood('sh_111'),
      makeFood('sh_222'),
      makeFood('sh_111'), // dup
      makeFood('sh_333'),
      makeFood('sh_222'), // dup
    ]
    expect(deduplicateScraped(products)).toHaveLength(3)
  })

  it('preserves order of unique items', () => {
    const products = [makeFood('sh_333'), makeFood('sh_111'), makeFood('sh_222')]
    const result = deduplicateScraped(products)
    expect(result.map((p) => p.id)).toEqual(['sh_333', 'sh_111', 'sh_222'])
  })

  it('returns empty array for empty input', () => {
    expect(deduplicateScraped([])).toEqual([])
  })

  it('handles 100 products with 20 duplicates — returns 80', () => {
    const products: FoodSeed[] = []
    for (let i = 0; i < 80; i++) products.push(makeFood(`sh_${i}`))
    // add 20 duplicates of the first 20
    for (let i = 0; i < 20; i++) products.push(makeFood(`sh_${i}`))
    expect(deduplicateScraped(products)).toHaveLength(80)
  })
})

// ── filterAgainstExisting ─────────────────────────────────────────────────

describe('filterAgainstExisting', () => {
  it('removes product whose ID is in the exclusion set', () => {
    const products = [makeFood('sh_111'), makeFood('sh_222')]
    const existing = new Set(['sh_111'])
    expect(filterAgainstExisting(products, existing)).toHaveLength(1)
    expect(filterAgainstExisting(products, existing)[0].id).toBe('sh_222')
  })

  it('keeps all products when exclusion set is empty', () => {
    const products = [makeFood('sh_111'), makeFood('sh_222')]
    expect(filterAgainstExisting(products, new Set())).toHaveLength(2)
  })

  it('removes all products when all IDs are in exclusion set', () => {
    const products = [makeFood('sh_111'), makeFood('sh_222')]
    const existing = new Set(['sh_111', 'sh_222'])
    expect(filterAgainstExisting(products, existing)).toHaveLength(0)
  })

  it('returns empty array for empty input', () => {
    expect(filterAgainstExisting([], new Set(['sh_111']))).toEqual([])
  })

  it('exclusion set with different prefix does not remove items', () => {
    // Tzameret IDs use tz_ prefix — should not accidentally match sh_ items
    const products = [makeFood('sh_7290119377411')]
    const tzameretIds = new Set(['tz_12345', 'tz_67890'])
    expect(filterAgainstExisting(products, tzameretIds)).toHaveLength(1)
  })

  it('preserves order of remaining items', () => {
    const products = [makeFood('sh_1'), makeFood('sh_2'), makeFood('sh_3'), makeFood('sh_4')]
    const existing = new Set(['sh_2'])
    const result = filterAgainstExisting(products, existing)
    expect(result.map((p) => p.id)).toEqual(['sh_1', 'sh_3', 'sh_4'])
  })
})
