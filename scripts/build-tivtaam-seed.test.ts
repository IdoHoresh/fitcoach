/**
 * Tests for the pure functions in build-tivtaam-seed.ts.
 * I/O glue (file reads/writes, summary print) is manually verified against
 * the real cache + catalog after Task 3's fetch completes.
 */

import { buildSeedRow, normalizeOriginCountry } from './build-tivtaam-seed'
import type { OffCacheEntry } from './tivtaam-seed-types'

// ── Fixtures ──

const EAN = '7290115201703'

interface CatalogItemFixture {
  itemCode: string
  nameHe: string
  manufactureName: string
  manufactureCountry: string
  unitOfMeasure: string
  quantity: number
  isWeighted: boolean
  itemType: number
  dedupStatus: 'net-new'
}

const domesticCatalogItem: CatalogItemFixture = {
  itemCode: EAN,
  nameHe: 'ביסלי ברביקיו 200 גרם',
  manufactureName: 'אוסם',
  manufactureCountry: 'ישראל',
  unitOfMeasure: '100 גרם',
  quantity: 200,
  isWeighted: false,
  itemType: 1,
  dedupStatus: 'net-new',
}

const importedCatalogItem: CatalogItemFixture = {
  ...domesticCatalogItem,
  itemCode: '5420066384084',
  nameHe: 'שוקולד מריר 72% ביאנקה 100 גר',
  manufactureName: 'ביאנקה',
  manufactureCountry: 'בלגיה',
}

const fullOffRaw = {
  status: 1,
  product: {
    product_name_he: 'ביסלי ברביקיו',
    product_name_en: 'Bissli BBQ',
    product_name: 'Bissli BBQ',
    nutriments: {
      'energy-kcal_100g': 480,
      proteins_100g: 7,
      fat_100g: 23,
      carbohydrates_100g: 60,
      fiber_100g: 3,
    },
  },
}

const hitEntry: OffCacheEntry = {
  status: 'hit',
  fetchedAt: '2026-04-21T12:00:00Z',
  raw: fullOffRaw,
}

const missEntry: OffCacheEntry = {
  status: 'miss',
  fetchedAt: '2026-04-21T12:00:00Z',
}

// ── normalizeOriginCountry ──

describe('normalizeOriginCountry()', () => {
  it('returns null for Hebrew Israel marker', () => {
    expect(normalizeOriginCountry('ישראל')).toBeNull()
  })

  it('returns null for ISO-3166 IL / ISR / ISRAEL (case-insensitive)', () => {
    expect(normalizeOriginCountry('IL')).toBeNull()
    expect(normalizeOriginCountry('il')).toBeNull()
    expect(normalizeOriginCountry('ISR')).toBeNull()
    expect(normalizeOriginCountry('israel')).toBeNull()
  })

  it('returns null for the Hebrew "unknown" sentinel', () => {
    expect(normalizeOriginCountry('לא ידוע')).toBeNull()
  })

  it('returns null for empty / whitespace-only strings', () => {
    expect(normalizeOriginCountry('')).toBeNull()
    expect(normalizeOriginCountry('   ')).toBeNull()
    expect(normalizeOriginCountry('\t\n')).toBeNull()
  })

  it('returns trimmed original for imported countries', () => {
    expect(normalizeOriginCountry('בלגיה')).toBe('בלגיה')
    expect(normalizeOriginCountry('  France  ')).toBe('France')
    expect(normalizeOriginCountry('USA')).toBe('USA')
  })

  it('preserves casing for non-null returns (no lowercasing side effects)', () => {
    expect(normalizeOriginCountry('Germany')).toBe('Germany')
    expect(normalizeOriginCountry('germany')).toBe('germany')
  })
})

// ── buildSeedRow ──

describe('buildSeedRow()', () => {
  it('returns null for a miss cache entry', () => {
    expect(buildSeedRow(domesticCatalogItem, missEntry)).toBeNull()
  })

  it('returns null when OFF hit has zero protein + fat + carbs (no usable data)', () => {
    const emptyMacrosRaw = {
      status: 1,
      product: {
        product_name_he: 'מוצר ריק',
        nutriments: { 'energy-kcal_100g': 100 }, // kcal only, no macros
      },
    }
    const row = buildSeedRow(domesticCatalogItem, {
      status: 'hit',
      fetchedAt: '2026-04-21T12:00:00Z',
      raw: emptyMacrosRaw,
    })
    expect(row).toBeNull()
  })

  it('returns null when OFF hit has no nutrition data at all (garbage hit)', () => {
    const garbageRaw = {
      status: 1,
      product: { product_name_he: "גרבאג'", nutriments: {} },
    }
    const row = buildSeedRow(domesticCatalogItem, {
      status: 'hit',
      fetchedAt: '2026-04-21T12:00:00Z',
      raw: garbageRaw,
    })
    expect(row).toBeNull()
  })

  it('keeps rows with any non-zero macro (even partial data is usable)', () => {
    const partialRaw = {
      status: 1,
      product: {
        product_name_he: 'חלקי',
        nutriments: {
          'energy-kcal_100g': 100,
          proteins_100g: 5, // protein present, fat/carbs missing
          fiber_100g: 1,
        },
      },
    }
    const row = buildSeedRow(domesticCatalogItem, {
      status: 'hit',
      fetchedAt: '2026-04-21T12:00:00Z',
      raw: partialRaw,
    })
    expect(row).not.toBeNull()
    expect(row!.proteinPer100g).toBe(5)
  })

  it('returns a TivTaamSeedRow with tt_<ean> id on hit', () => {
    const row = buildSeedRow(domesticCatalogItem, hitEntry)
    expect(row).not.toBeNull()
    expect(row!.id).toBe(`tt_${EAN}`)
    expect(row!.isUserCreated).toBe(false)
  })

  it('maps full OFF macros correctly', () => {
    const row = buildSeedRow(domesticCatalogItem, hitEntry)!
    expect(row.caloriesPer100g).toBe(480)
    expect(row.proteinPer100g).toBe(7)
    expect(row.fatPer100g).toBe(23)
    expect(row.carbsPer100g).toBe(60)
    expect(row.fiberPer100g).toBe(3)
  })

  it('sets originCountry from transparency feed (not OFF) for imported items', () => {
    const row = buildSeedRow(importedCatalogItem, hitEntry)!
    expect(row.originCountry).toBe('בלגיה')
  })

  it('sets originCountry = null for domestic items', () => {
    const row = buildSeedRow(domesticCatalogItem, hitEntry)!
    expect(row.originCountry).toBeNull()
  })

  it('falls back to transparency-feed name when OFF returned EAN as nameHe (unknown product)', () => {
    const offRawWithEanAsName = {
      status: 1,
      product: {
        // product_name_he absent → normalizer falls back through to EAN.
        // Macros present so the zero-macros drop doesn't mask the name test.
        nutriments: {
          'energy-kcal_100g': 100,
          proteins_100g: 3,
          fat_100g: 2,
          carbohydrates_100g: 15,
        },
      },
    }
    const row = buildSeedRow(domesticCatalogItem, {
      status: 'hit',
      fetchedAt: '2026-04-21T12:00:00Z',
      raw: offRawWithEanAsName,
    })!
    expect(row.nameHe).toBe(domesticCatalogItem.nameHe)
  })

  it('keeps OFF nameHe when it is a real Hebrew name', () => {
    const row = buildSeedRow(domesticCatalogItem, hitEntry)!
    expect(row.nameHe).toBe('ביסלי ברביקיו')
  })

  it('serializes servingSizes as JSON string (matches sh_/rl_/raw_ seed shape)', () => {
    const row = buildSeedRow(domesticCatalogItem, hitEntry)!
    expect(() => JSON.parse(row.servingSizesJson)).not.toThrow()
    const parsed = JSON.parse(row.servingSizesJson)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed[0]).toMatchObject({ grams: 100, unit: 'grams' })
  })

  it('category defaults to "snacks" (Phase 2 v1 limitation — see spec Open Questions)', () => {
    const row = buildSeedRow(domesticCatalogItem, hitEntry)!
    expect(row.category).toBe('snacks')
  })
})
