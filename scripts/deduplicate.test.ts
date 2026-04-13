/**
 * Tests for deduplicate.ts
 * Pure functions — no network, no DB.
 */

import {
  deduplicateScraped,
  filterAgainstExisting,
  normalizeNameForDedup,
  buildContentHash,
  filterAgainstContentHashes,
  deduplicateFuzzy,
} from './deduplicate'
import type { FoodSeed } from './tzameret-overrides'

// ── Helpers ───────────────────────────────────────────────────────────────

interface MakeFoodOverrides {
  nameHe?: string
  caloriesPer100g?: number
  proteinPer100g?: number
  fatPer100g?: number
  carbsPer100g?: number
}

function makeFood(id: string, overrides: MakeFoodOverrides = {}): FoodSeed {
  return {
    id,
    nameHe: overrides.nameHe ?? 'מוצר',
    nameEn: overrides.nameHe ?? 'מוצר',
    category: 'snacks',
    caloriesPer100g: overrides.caloriesPer100g ?? 100,
    proteinPer100g: overrides.proteinPer100g ?? 5,
    fatPer100g: overrides.fatPer100g ?? 3,
    carbsPer100g: overrides.carbsPer100g ?? 10,
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
    const first = makeFood('sh_111', { nameHe: 'ראשון' })
    const duplicate = makeFood('sh_111', { nameHe: 'כפול' })
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

// ── normalizeNameForDedup ─────────────────────────────────────────────────

describe('normalizeNameForDedup', () => {
  it('returns empty string for empty input', () => {
    expect(normalizeNameForDedup('')).toBe('')
  })

  it('collapses size-token variants to the same key', () => {
    const a = normalizeNameForDedup('גבינה צהובה גאודה 28% פרוסה 400 גר')
    const b = normalizeNameForDedup("גבינה צהובה גאודה 28% פרוסה 400 ג'")
    const c = normalizeNameForDedup('גבינה צהובה גאודה 28% פרוסה 400 גרם')
    expect(a).toBe(b)
    expect(a).toBe(c)
  })

  it('strips ml / liter size tokens', () => {
    const a = normalizeNameForDedup('חלב 3% 1 ליטר')
    const b = normalizeNameForDedup('חלב 3% 1000 מ"ל')
    expect(a).toBe(b)
  })

  it('strips kg size token', () => {
    const a = normalizeNameForDedup('אורז בסמטי 1 ק"ג')
    const b = normalizeNameForDedup('אורז בסמטי 1000 גרם')
    expect(a).toBe(b)
  })

  it('collapses whitespace and punctuation', () => {
    const a = normalizeNameForDedup('גבינה   לבנה  5%')
    const b = normalizeNameForDedup("גבינה'לבנה,5%")
    expect(a).toBe(b)
  })

  it('is case-insensitive for ASCII characters', () => {
    expect(normalizeNameForDedup('Milk 3%')).toBe(normalizeNameForDedup('milk 3%'))
  })

  it('keeps distinct percentages distinct', () => {
    const a = normalizeNameForDedup('גבינה לבנה 5% שומן')
    const b = normalizeNameForDedup('גבינה לבנה 9% שומן')
    expect(a).not.toBe(b)
  })

  it('keeps unrelated product names distinct', () => {
    expect(normalizeNameForDedup('חלב 3%')).not.toBe(normalizeNameForDedup('שמנת 15%'))
  })

  // Phase 2: plural + orphan modifier
  it('collapses singular/plural Hebrew food descriptors', () => {
    expect(normalizeNameForDedup('גבינת גאודה פרוסות 28%')).toBe(
      normalizeNameForDedup('גבינת גאודה פרוסה 28%'),
    )
    expect(normalizeNameForDedup('גבינה מגורדות')).toBe(normalizeNameForDedup('גבינה מגורדת'))
    expect(normalizeNameForDedup('בשר טחונות')).toBe(normalizeNameForDedup('בשר טחונה'))
  })

  it('drops trailing orphan modifier "שומן" after %', () => {
    expect(normalizeNameForDedup('גבינת גאודה פרוסה 28% שומן')).toBe(
      normalizeNameForDedup('גבינת גאודה פרוסה 28%'),
    )
  })

  it('does NOT drop non-trailing שומן', () => {
    // שומן embedded mid-name should stay
    const a = normalizeNameForDedup('שומן בקר טהור')
    expect(a).toContain('שומן')
  })

  it('keeps distinct percentages distinct after normalization', () => {
    expect(normalizeNameForDedup('גבינה לבנה 5% שומן')).not.toBe(
      normalizeNameForDedup('גבינה לבנה 9% שומן'),
    )
  })

  it('combines plural collapse + orphan drop + size strip', () => {
    const a = normalizeNameForDedup('גבינת גאודה פרוסה 28% שומן')
    const b = normalizeNameForDedup('גבינת גאודה פרוסות 28%')
    const c = normalizeNameForDedup('גבינת גאודה פרוסות 28% 400 גר')
    expect(a).toBe(b)
    expect(b).toBe(c)
  })
})

// ── buildContentHash ──────────────────────────────────────────────────────

describe('buildContentHash', () => {
  it('produces same hash for identical name + macros under different ids', () => {
    const a = makeFood('sh_111', { nameHe: 'גבינה לבנה 5%', caloriesPer100g: 62 })
    const b = makeFood('sh_222', { nameHe: 'גבינה לבנה 5%', caloriesPer100g: 62 })
    expect(buildContentHash(a)).toBe(buildContentHash(b))
  })

  it('produces different hashes when calories differ', () => {
    const a = makeFood('sh_111', { nameHe: 'גבינה לבנה 5%', caloriesPer100g: 62 })
    const b = makeFood('sh_222', { nameHe: 'גבינה לבנה 5%', caloriesPer100g: 75 })
    expect(buildContentHash(a)).not.toBe(buildContentHash(b))
  })

  it('produces different hashes when protein differs', () => {
    const a = makeFood('sh_111', { proteinPer100g: 10 })
    const b = makeFood('sh_222', { proteinPer100g: 20 })
    expect(buildContentHash(a)).not.toBe(buildContentHash(b))
  })

  it('treats size-token variants as the same product', () => {
    const a = makeFood('sh_111', { nameHe: "גבינה צהובה 400 ג'" })
    const b = makeFood('sh_222', { nameHe: 'גבינה צהובה 400 גר' })
    expect(buildContentHash(a)).toBe(buildContentHash(b))
  })
})

// ── filterAgainstContentHashes ────────────────────────────────────────────

describe('filterAgainstContentHashes', () => {
  it('removes rows whose content hash is in the set', () => {
    const reference = makeFood('sh_111', { nameHe: 'גבינה לבנה 5%', caloriesPer100g: 62 })
    const hashes = new Set([buildContentHash(reference)])
    const candidate = makeFood('rl_xxx', { nameHe: 'גבינה לבנה 5%', caloriesPer100g: 62 })
    const result = filterAgainstContentHashes([candidate], hashes)
    expect(result).toHaveLength(0)
  })

  it('keeps rows with different macros even if name matches', () => {
    const reference = makeFood('sh_111', { nameHe: 'גבינה לבנה 5%', caloriesPer100g: 62 })
    const hashes = new Set([buildContentHash(reference)])
    const candidate = makeFood('rl_xxx', { nameHe: 'גבינה לבנה 5%', caloriesPer100g: 75 })
    expect(filterAgainstContentHashes([candidate], hashes)).toHaveLength(1)
  })

  it('returns all rows when hash set is empty', () => {
    const products = [makeFood('rl_1'), makeFood('rl_2')]
    expect(filterAgainstContentHashes(products, new Set())).toHaveLength(2)
  })
})

// ── deduplicateFuzzy (name-based, garbage-aware) ──────────────────────────

describe('deduplicateFuzzy', () => {
  it('returns empty array for empty input', () => {
    expect(deduplicateFuzzy([])).toEqual([])
  })

  it('returns single entry unchanged', () => {
    const products = [makeFood('sh_1', { nameHe: 'אורז' })]
    expect(deduplicateFuzzy(products)).toEqual(products)
  })

  it('collapses plural/orphan variants to one row (gouda case)', () => {
    const products = [
      makeFood('sh_111', {
        nameHe: 'גבינת גאודה פרוסה 28% שומן',
        caloriesPer100g: 352,
        proteinPer100g: 25,
        fatPer100g: 28,
        carbsPer100g: 1,
      }),
      makeFood('sh_222', {
        nameHe: 'גבינת גאודה פרוסות 28%',
        caloriesPer100g: 341,
        proteinPer100g: 23,
        fatPer100g: 27,
        carbsPer100g: 1,
      }),
    ]
    const result = deduplicateFuzzy(products)
    expect(result).toHaveLength(1)
    // Both equally rich — first occurrence wins
    expect(result[0].id).toBe('sh_111')
  })

  it('collapses אורז פרסי 348/350/336 and drops the 0g-protein garbage row', () => {
    // The exact case user reported on device
    const products = [
      makeFood('sh_7296073705291', {
        nameHe: 'אורז פרסי',
        caloriesPer100g: 348,
        proteinPer100g: 6,
        fatPer100g: 1,
        carbsPer100g: 78,
      }),
      makeFood('sh_7290108509700', {
        nameHe: 'אורז פרסי',
        caloriesPer100g: 350,
        proteinPer100g: 8.7,
        fatPer100g: 1.2,
        carbsPer100g: 76,
      }),
      makeFood('sh_7296073747000', {
        nameHe: 'אורז פרסי',
        caloriesPer100g: 336,
        proteinPer100g: 0, // garbage: protein=0 with kcal>100
        fatPer100g: 0,
        carbsPer100g: 0,
      }),
    ]
    const result = deduplicateFuzzy(products)
    expect(result).toHaveLength(1)
    // Garbage row dropped; among non-garbage, first occurrence wins on tie
    expect(result[0].id).toBe('sh_7296073705291')
  })

  it('picks the non-garbage row even when garbage appears first', () => {
    const products = [
      makeFood('sh_garbage', {
        nameHe: 'אורז',
        caloriesPer100g: 300,
        proteinPer100g: 0,
        fatPer100g: 0,
        carbsPer100g: 0,
      }),
      makeFood('sh_good', {
        nameHe: 'אורז',
        caloriesPer100g: 365,
        proteinPer100g: 7,
        fatPer100g: 1,
        carbsPer100g: 80,
      }),
    ]
    const result = deduplicateFuzzy(products)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('sh_good')
  })

  it('picks the richer row (more non-null macros) on tie', () => {
    const products = [
      makeFood('sh_sparse', {
        nameHe: 'טונה',
        caloriesPer100g: 120,
        proteinPer100g: 25,
        fatPer100g: 0,
        carbsPer100g: 0,
      }),
      makeFood('sh_rich', {
        nameHe: 'טונה',
        caloriesPer100g: 125,
        proteinPer100g: 26,
        fatPer100g: 2,
        carbsPer100g: 1,
      }),
    ]
    const result = deduplicateFuzzy(products)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('sh_rich')
  })

  it('keeps "חלב 3%" and "חלב 9%" distinct (percentage is semantic)', () => {
    const products = [
      makeFood('sh_1', { nameHe: 'חלב 3%', caloriesPer100g: 62 }),
      makeFood('sh_2', { nameHe: 'חלב 9%', caloriesPer100g: 100 }),
    ]
    expect(deduplicateFuzzy(products)).toHaveLength(2)
  })

  it('keeps distinct products when normalized names differ', () => {
    const products = [
      makeFood('sh_1', { nameHe: 'גבינה לבנה 5%', caloriesPer100g: 62 }),
      makeFood('sh_2', { nameHe: 'יוגורט 5%', caloriesPer100g: 62 }),
    ]
    expect(deduplicateFuzzy(products)).toHaveLength(2)
  })

  it('preserves first occurrence on full tie', () => {
    const products = [
      makeFood('sh_first', {
        nameHe: 'מוצר',
        caloriesPer100g: 100,
        proteinPer100g: 5,
        fatPer100g: 3,
        carbsPer100g: 10,
      }),
      makeFood('sh_second', {
        nameHe: 'מוצר',
        caloriesPer100g: 108,
        proteinPer100g: 5,
        fatPer100g: 3,
        carbsPer100g: 10,
      }),
    ]
    const result = deduplicateFuzzy(products)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('sh_first')
  })

  it('preserves cross-group order', () => {
    const products = [
      makeFood('sh_a', { nameHe: 'אלף' }),
      makeFood('sh_b', { nameHe: 'בית' }),
      makeFood('sh_c', { nameHe: 'גימל' }),
    ]
    expect(deduplicateFuzzy(products).map((p) => p.id)).toEqual(['sh_a', 'sh_b', 'sh_c'])
  })

  it('falls back to group when all rows are garbage', () => {
    const products = [
      makeFood('sh_1', {
        nameHe: 'מוצר',
        caloriesPer100g: 0,
        proteinPer100g: 0,
        fatPer100g: 0,
        carbsPer100g: 0,
      }),
      makeFood('sh_2', {
        nameHe: 'מוצר',
        caloriesPer100g: 0,
        proteinPer100g: 0,
        fatPer100g: 0,
        carbsPer100g: 0,
      }),
    ]
    const result = deduplicateFuzzy(products)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('sh_1')
  })
})
