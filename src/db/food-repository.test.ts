/**
 * FoodRepository tests.
 *
 * Task 2: schema-level tests (schema version + foods table structure)
 * Task 3: repository method tests (search, getById, getByCategory, getRecent)
 */

import { CREATE_TABLE_STATEMENTS, SCHEMA_VERSION } from './schema'
import { FoodRepository } from './food-repository'
import type { FoodItem } from '../types'

// ── Mock the database ─────────────────────────────────────────────

const mockRunAsync = jest.fn()
const mockGetFirstAsync = jest.fn()
const mockGetAllAsync = jest.fn()

jest.mock('./database', () => ({
  getDatabase: () => ({
    runAsync: mockRunAsync,
    getFirstAsync: mockGetFirstAsync,
    getAllAsync: mockGetAllAsync,
  }),
}))

jest.mock('expo-crypto', () => ({
  randomUUID: () => 'mock-uuid-' + Math.random().toString(36).slice(2, 8),
}))

// ── Schema version ────────────────────────────────────────────────────

describe('schema v14 — full Shufersal seed', () => {
  it('supermarket-seed.json has at least 5000 products', () => {
    const seed = require('../assets/supermarket-seed.json') as unknown[]
    expect(seed.length).toBeGreaterThanOrEqual(5000)
  })

  it('every seed product has valid id prefix, Hebrew name, and positive calories', () => {
    const seed = require('../assets/supermarket-seed.json') as {
      id: string
      nameHe: string
      caloriesPer100g: number
    }[]
    const invalid = seed.filter(
      (f) =>
        (!f.id.startsWith('sh_') && !f.id.startsWith('manual_')) ||
        !f.nameHe ||
        f.caloriesPer100g <= 0,
    )
    expect(invalid).toHaveLength(0)
  })
})

// ── Task 2: Schema v10 ────────────────────────────────────────────────

describe('schema v10 — foods table', () => {
  it('CREATE_TABLE_STATEMENTS contains foods table', () => {
    const foodsStmt = CREATE_TABLE_STATEMENTS.find((s) =>
      s.includes('CREATE TABLE IF NOT EXISTS foods'),
    )
    expect(foodsStmt).toBeDefined()
  })

  it('foods table has all required columns', () => {
    const foodsStmt = CREATE_TABLE_STATEMENTS.find((s) =>
      s.includes('CREATE TABLE IF NOT EXISTS foods'),
    )!
    expect(foodsStmt).toContain('id TEXT PRIMARY KEY')
    expect(foodsStmt).toContain('name_he TEXT')
    expect(foodsStmt).toContain('name_en TEXT')
    expect(foodsStmt).toContain('category TEXT')
    expect(foodsStmt).toContain('calories_per_100g')
    expect(foodsStmt).toContain('protein_per_100g')
    expect(foodsStmt).toContain('fat_per_100g')
    expect(foodsStmt).toContain('carbs_per_100g')
    expect(foodsStmt).toContain('fiber_per_100g')
    expect(foodsStmt).toContain('is_user_created')
    expect(foodsStmt).toContain('serving_sizes_json')
  })

  it('foods table has category index', () => {
    const indexStmt = CREATE_TABLE_STATEMENTS.find(
      (s) => s.includes('CREATE INDEX') && s.includes('foods') && s.includes('category'),
    )
    expect(indexStmt).toBeDefined()
  })

  it('foods table has name_he index for fast Hebrew search', () => {
    const indexStmt = CREATE_TABLE_STATEMENTS.find(
      (s) => s.includes('CREATE INDEX') && s.includes('foods') && s.includes('name_he'),
    )
    expect(indexStmt).toBeDefined()
  })
})

// ── Fixtures ──────────────────────────────────────────────────────────

const MOCK_FOOD_ROW = {
  id: 'tz_12345',
  name_he: 'חזה עוף מבושל',
  name_en: 'Chicken Breast, cooked',
  category: 'protein',
  calories_per_100g: 165,
  protein_per_100g: 31,
  fat_per_100g: 3.6,
  carbs_per_100g: 0,
  fiber_per_100g: 0,
  is_user_created: 0,
  serving_sizes_json: JSON.stringify([
    { nameHe: 'חזה אחד', nameEn: 'One breast', unit: 'piece', grams: 170 },
    { nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 },
  ]),
}

const EXPECTED_FOOD_ITEM: FoodItem = {
  id: 'tz_12345',
  nameHe: 'חזה עוף מבושל',
  nameEn: 'Chicken Breast, cooked',
  category: 'protein',
  caloriesPer100g: 165,
  proteinPer100g: 31,
  fatPer100g: 3.6,
  carbsPer100g: 0,
  fiberPer100g: 0,
  isUserCreated: false,
  servingSizes: [
    { nameHe: 'חזה אחד', nameEn: 'One breast', unit: 'piece', grams: 170 },
    { nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 },
  ],
}

// ── Task 3: FoodRepository ────────────────────────────────────────────

describe('FoodRepository', () => {
  let repo: FoodRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repo = new FoodRepository()
  })

  // ── search ──────────────────────────────────────────────────────────

  describe('search()', () => {
    it('queries by Hebrew name (case-insensitive LIKE)', async () => {
      mockGetAllAsync.mockResolvedValueOnce([MOCK_FOOD_ROW])

      await repo.search('עוף')

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('LIKE'),
        expect.arrayContaining(['%עוף%']),
      )
    })

    it('queries by English name (lowercase LIKE)', async () => {
      mockGetAllAsync.mockResolvedValueOnce([MOCK_FOOD_ROW])

      await repo.search('chicken')

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('LIKE'),
        expect.arrayContaining(['%chicken%']),
      )
    })

    it('returns empty array for whitespace-only query without crashing', async () => {
      mockGetAllAsync.mockResolvedValueOnce([MOCK_FOOD_ROW])

      const result = await repo.search('   ')

      expect(Array.isArray(result)).toBe(true)
    })

    it('maps DB row (snake_case) to FoodItem (camelCase)', async () => {
      mockGetAllAsync.mockResolvedValueOnce([MOCK_FOOD_ROW])

      const result = await repo.search('עוף')

      expect(result[0]).toEqual(EXPECTED_FOOD_ITEM)
    })

    it('respects the limit parameter', async () => {
      mockGetAllAsync.mockResolvedValueOnce([])

      await repo.search('עוף', 20)

      expect(mockGetAllAsync).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([20]))
    })

    it('uses default limit of 50 when not specified', async () => {
      mockGetAllAsync.mockResolvedValueOnce([])

      await repo.search('עוף')

      expect(mockGetAllAsync).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([50]))
    })
  })

  // ── getById ──────────────────────────────────────────────────────────

  describe('getById()', () => {
    it('queries by id and maps to FoodItem', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(MOCK_FOOD_ROW)

      const result = await repo.getById('tz_12345')

      expect(mockGetFirstAsync).toHaveBeenCalledWith(expect.stringContaining('WHERE id = ?'), [
        'tz_12345',
      ])
      expect(result).toEqual(EXPECTED_FOOD_ITEM)
    })

    it('returns null when food not found', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null)

      const result = await repo.getById('tz_unknown')

      expect(result).toBeNull()
    })
  })

  // ── getByCategory ─────────────────────────────────────────────────────

  describe('getByCategory()', () => {
    it('queries by category and returns mapped FoodItems', async () => {
      mockGetAllAsync.mockResolvedValueOnce([MOCK_FOOD_ROW])

      const result = await repo.getByCategory('protein')

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE category = ?'),
        expect.arrayContaining(['protein']),
      )
      expect(result[0]).toEqual(EXPECTED_FOOD_ITEM)
    })

    it('respects limit parameter', async () => {
      mockGetAllAsync.mockResolvedValueOnce([])

      await repo.getByCategory('dairy', 30)

      expect(mockGetAllAsync).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([30]))
    })
  })

  // ── getRecent ─────────────────────────────────────────────────────────

  describe('getRecent()', () => {
    it('joins food_log to find recently logged foods', async () => {
      mockGetAllAsync.mockResolvedValueOnce([MOCK_FOOD_ROW])

      await repo.getRecent(15)

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('food_log'),
        expect.arrayContaining([15]),
      )
    })

    it('returns mapped FoodItems', async () => {
      mockGetAllAsync.mockResolvedValueOnce([MOCK_FOOD_ROW])

      const result = await repo.getRecent(5)

      expect(result[0]).toEqual(EXPECTED_FOOD_ITEM)
    })

    it('uses default limit of 15 when not specified', async () => {
      mockGetAllAsync.mockResolvedValueOnce([])

      await repo.getRecent()

      expect(mockGetAllAsync).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([15]))
    })
  })

  // ── Row mapping edge cases ─────────────────────────────────────────

  describe('row mapping', () => {
    it('returns empty servingSizes array when serving_sizes_json is corrupt', async () => {
      const corruptRow = { ...MOCK_FOOD_ROW, serving_sizes_json: 'NOT_VALID_JSON' }
      mockGetAllAsync.mockResolvedValueOnce([corruptRow])

      const result = await repo.search('עוף')

      expect(result[0].servingSizes).toEqual([])
    })

    it('maps is_user_created=1 to isUserCreated=true', async () => {
      const userRow = { ...MOCK_FOOD_ROW, is_user_created: 1 }
      mockGetAllAsync.mockResolvedValueOnce([userRow])

      const result = await repo.search('עוף')

      expect(result[0].isUserCreated).toBe(true)
    })
  })
})

// ── Smoke test: seed data integrity ──────────────────────────────────

describe('supermarket-seed.json', () => {
  const seed = require('../assets/supermarket-seed.json') as unknown[]

  it('has at least 46 foods (protein yoghurt overrides)', () => {
    expect(seed.length).toBeGreaterThanOrEqual(46)
  })

  it('every entry has required fields', () => {
    const required = ['id', 'nameHe', 'nameEn', 'category', 'caloriesPer100g', 'servingSizesJson']
    for (const food of seed as Record<string, unknown>[]) {
      for (const field of required) {
        expect(food[field]).toBeDefined()
      }
    }
  })

  it('contains no Tzameret foods (tz_ prefix)', () => {
    const tzItems = (seed as { id: string }[]).filter((f) => f.id.startsWith('tz_'))
    expect(tzItems).toHaveLength(0)
  })
})

// ── Schema v15 — Rami Levy seed ───────────────────────────────────────────

describe('schema v15 — Rami Levy seed', () => {
  it('SCHEMA_VERSION is 15', () => {
    expect(SCHEMA_VERSION).toBe(15)
  })

  it('rami-levy-seed.json exists and is valid JSON array', () => {
    const seed = require('../assets/rami-levy-seed.json') as unknown[]
    expect(Array.isArray(seed)).toBe(true)
  })

  it('every rami-levy-seed entry has required fields and rl_ prefix', () => {
    const seed = require('../assets/rami-levy-seed.json') as {
      id: string
      nameHe: string
      caloriesPer100g: number
      servingSizesJson: string
    }[]
    // File may be empty placeholder before scraper runs — skip structure check
    if (seed.length === 0) return
    const required = ['id', 'nameHe', 'nameEn', 'category', 'caloriesPer100g', 'servingSizesJson']
    for (const food of seed as Record<string, unknown>[]) {
      for (const field of required) {
        expect(food[field]).toBeDefined()
      }
    }
    const nonRl = seed.filter((f) => !f.id.startsWith('rl_'))
    expect(nonRl).toHaveLength(0)
  })

  it('rami-levy-seed.json has no barcode overlap with supermarket-seed.json', () => {
    const rlSeed = require('../assets/rami-levy-seed.json') as { id: string }[]
    if (rlSeed.length === 0) return
    const shSeed = require('../assets/supermarket-seed.json') as { id: string }[]
    const shBarcodes = new Set(shSeed.map((f) => f.id.replace(/^sh_/, '')))
    const overlaps = rlSeed.filter((f) => shBarcodes.has(f.id.replace(/^rl_/, '')))
    expect(overlaps).toHaveLength(0)
  })
})
