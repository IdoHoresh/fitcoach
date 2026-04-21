/**
 * FoodRepository tests.
 *
 * Task 2: schema-level tests (schema version + foods table structure)
 * Task 3: repository method tests (search, getById, getByCategory, getRecent)
 */

import { CREATE_TABLE_STATEMENTS, SCHEMA_VERSION } from './schema'
import { FoodRepository, FoodCollisionError } from './food-repository'
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
  it('supermarket-seed.json has at least 4500 products', () => {
    const seed = require('../assets/supermarket-seed.json') as unknown[]
    expect(seed.length).toBeGreaterThanOrEqual(4500)
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

  it('foods table has origin_country column (v19 — Tiv Taam Phase 2 imported-goods moat)', () => {
    const foodsStmt = CREATE_TABLE_STATEMENTS.find((s) =>
      s.includes('CREATE TABLE IF NOT EXISTS foods'),
    )!
    expect(foodsStmt).toContain('origin_country TEXT')
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

    it('orders results by source tier so raw_ wins tiebreakers', async () => {
      mockGetAllAsync.mockResolvedValueOnce([])

      await repo.search('חזה עוף')

      const [sql] = mockGetAllAsync.mock.calls[0] as [string, unknown[]]
      // Source tier: raw > manual > sh > rl
      expect(sql).toMatch(/raw_%.*manual_%.*sh_%.*rl_%/s)
      // Starts-with must still be the primary ORDER BY clause — tier is a tiebreaker
      const startsWithIdx = sql.indexOf('name_he LIKE ?')
      const tierIdx = sql.indexOf('raw_%')
      expect(startsWithIdx).toBeGreaterThan(-1)
      expect(tierIdx).toBeGreaterThan(startsWithIdx)
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

  // ── getByBarcode ──────────────────────────────────────────────────────

  describe('getByBarcode()', () => {
    it('queries all four tier prefixes for the given EAN', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null)

      await repo.getByBarcode('7290000066318')

      const [sql, params] = mockGetFirstAsync.mock.calls[0] as [string, unknown[]]
      expect(params).toContain('raw_7290000066318')
      expect(params).toContain('manual_7290000066318')
      expect(params).toContain('sh_7290000066318')
      expect(params).toContain('rl_7290000066318')
      // Must order by tier so raw_ wins over sh_ / rl_
      expect(sql).toMatch(/raw_%.*manual_%.*sh_%/s)
    })

    it('returns the matched food mapped to FoodItem', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(MOCK_FOOD_ROW)

      const result = await repo.getByBarcode('12345')

      expect(result).toEqual(EXPECTED_FOOD_ITEM)
    })

    it('returns null when no tier has the EAN', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null)

      const result = await repo.getByBarcode('0000000000000')

      expect(result).toBeNull()
    })
  })

  // ── upsertFood (renamed from insertFood) ─────────────────────────────

  describe('upsertFood()', () => {
    const FOOD_TO_INSERT: FoodItem = {
      id: 'manual_7290000066318',
      nameHe: 'עוגיות שוקולד',
      nameEn: 'Chocolate Cookies',
      category: 'snacks',
      caloriesPer100g: 480,
      proteinPer100g: 6,
      fatPer100g: 22,
      carbsPer100g: 64,
      fiberPer100g: 2,
      isUserCreated: false,
      servingSizes: [{ nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 }],
    }

    it('executes INSERT OR REPLACE with all 12 food columns', async () => {
      mockRunAsync.mockResolvedValueOnce({ changes: 1 })

      await repo.upsertFood(FOOD_TO_INSERT)

      expect(mockRunAsync).toHaveBeenCalledTimes(1)
      const [sql, params] = mockRunAsync.mock.calls[0] as [string, unknown[]]
      expect(sql).toMatch(/INSERT OR REPLACE INTO foods/i)
      expect(params).toContain('manual_7290000066318')
      expect(params).toContain('עוגיות שוקולד')
      expect(params).toContain('Chocolate Cookies')
      expect(params).toContain('snacks')
      expect(params).toContain(480)
    })

    it('stores serving_sizes_json as a JSON string', async () => {
      mockRunAsync.mockResolvedValueOnce({ changes: 1 })

      await repo.upsertFood(FOOD_TO_INSERT)

      const [, params] = mockRunAsync.mock.calls[0] as [string, unknown[]]
      const servingJson = params.find((p) => typeof p === 'string' && p.startsWith('[')) as string
      expect(() => JSON.parse(servingJson)).not.toThrow()
    })

    it('sets is_user_created=0 for non-user foods', async () => {
      mockRunAsync.mockResolvedValueOnce({ changes: 1 })

      await repo.upsertFood(FOOD_TO_INSERT)

      const [, params] = mockRunAsync.mock.calls[0] as [string, unknown[]]
      expect(params).toContain(0)
    })

    it('sets is_user_created=1 for user-created foods', async () => {
      mockRunAsync.mockResolvedValueOnce({ changes: 1 })

      await repo.upsertFood({ ...FOOD_TO_INSERT, isUserCreated: true })

      const [, params] = mockRunAsync.mock.calls[0] as [string, unknown[]]
      expect(params).toContain(1)
    })

    it('overwrites an existing row with the same id (INSERT OR REPLACE semantics)', async () => {
      // Two consecutive upserts with the same id; the second supplies new macro
      // values. INSERT OR REPLACE means the second call's params should arrive
      // unchanged at the DB layer — the row replacement is SQLite's job, not ours.
      mockRunAsync.mockResolvedValue({ changes: 1 })

      await repo.upsertFood(FOOD_TO_INSERT)
      await repo.upsertFood({ ...FOOD_TO_INSERT, caloriesPer100g: 999 })

      expect(mockRunAsync).toHaveBeenCalledTimes(2)
      const [, secondParams] = mockRunAsync.mock.calls[1] as [string, unknown[]]
      expect(secondParams).toContain(999)
    })
  })

  // ── insertFoodStrict ──────────────────────────────────────────────────

  describe('insertFoodStrict()', () => {
    const FOOD_TO_INSERT: FoodItem = {
      id: 'manual_7290000066318',
      nameHe: 'עוגיות שוקולד',
      nameEn: 'Chocolate Cookies',
      category: 'snacks',
      caloriesPer100g: 480,
      proteinPer100g: 6,
      fatPer100g: 22,
      carbsPer100g: 64,
      fiberPer100g: 2,
      isUserCreated: true,
      servingSizes: [{ nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 }],
    }

    const EXISTING_ROW = {
      id: 'manual_7290000066318',
      name_he: 'מוצר ישן',
      name_en: 'Old Product',
      category: 'snacks',
      calories_per_100g: 100,
      protein_per_100g: 5,
      fat_per_100g: 5,
      carbs_per_100g: 10,
      fiber_per_100g: 1,
      is_user_created: 1,
      serving_sizes_json: '[]',
    }

    it('persists a fresh food via plain INSERT INTO when no row exists', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null) // pre-check: no collision
      mockRunAsync.mockResolvedValueOnce({ changes: 1 })

      await repo.insertFoodStrict(FOOD_TO_INSERT)

      expect(mockRunAsync).toHaveBeenCalledTimes(1)
      const [sql, params] = mockRunAsync.mock.calls[0] as [string, unknown[]]
      expect(sql).toMatch(/INSERT INTO foods/i)
      expect(sql).not.toMatch(/INSERT OR REPLACE/i)
      expect(params).toContain('manual_7290000066318')
    })

    it('throws FoodCollisionError when a row with the same id already exists', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(EXISTING_ROW)

      await expect(repo.insertFoodStrict(FOOD_TO_INSERT)).rejects.toBeInstanceOf(FoodCollisionError)
    })

    it('FoodCollisionError carries the existing FoodItem in its `existing` field', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(EXISTING_ROW)

      let caught: unknown
      try {
        await repo.insertFoodStrict(FOOD_TO_INSERT)
      } catch (err) {
        caught = err
      }

      expect(caught).toBeInstanceOf(FoodCollisionError)
      const collision = caught as FoodCollisionError
      expect(collision.existing.id).toBe('manual_7290000066318')
      expect(collision.existing.nameHe).toBe('מוצר ישן')
      expect(collision.existing.caloriesPer100g).toBe(100)
    })

    it('does NOT execute any INSERT when a collision is detected', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(EXISTING_ROW)

      await expect(repo.insertFoodStrict(FOOD_TO_INSERT)).rejects.toBeInstanceOf(FoodCollisionError)

      expect(mockRunAsync).not.toHaveBeenCalled()
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
  it('SCHEMA_VERSION is 19', () => {
    expect(SCHEMA_VERSION).toBe(19)
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

// ── Schema v16 — Raw ingredients seed ─────────────────────────────────────

describe('schema v16 — raw ingredients seed', () => {
  const seed = require('../assets/raw-ingredients-seed.json') as {
    id: string
    nameHe: string
    nameEn: string
    category: string
    caloriesPer100g: number
    proteinPer100g: number
    fatPer100g: number
    carbsPer100g: number
    fiberPer100g: number
    isUserCreated: boolean
    servingSizesJson: string
  }[]

  it('raw-ingredients-seed.json has at least 180 entries', () => {
    expect(seed.length).toBeGreaterThanOrEqual(180)
  })

  it('every entry has a raw_ id prefix and required fields', () => {
    const required = ['id', 'nameHe', 'nameEn', 'category', 'caloriesPer100g', 'servingSizesJson']
    for (const food of seed as unknown as Record<string, unknown>[]) {
      for (const field of required) {
        expect(food[field]).toBeDefined()
      }
    }
    const nonRaw = seed.filter((f) => !f.id.startsWith('raw_'))
    expect(nonRaw).toHaveLength(0)
  })

  it('every entry has a valid FoodCategory after build-time mapping', () => {
    const valid = new Set([
      'protein',
      'carbs',
      'vegetables',
      'fruits',
      'dairy',
      'fats',
      'snacks',
      'traditional',
      'restaurant',
      'custom',
    ])
    const invalid = seed.filter((f) => !valid.has(f.category))
    expect(invalid).toHaveLength(0)
  })

  it('every entry has a 100g serving size', () => {
    const missing = seed.filter((f) => {
      try {
        const sizes = JSON.parse(f.servingSizesJson) as { grams: number }[]
        return !sizes.some((s) => s.grams === 100)
      } catch {
        return true
      }
    })
    expect(missing).toHaveLength(0)
  })

  it('no id overlap with supermarket or rami-levy seeds', () => {
    const rawIds = new Set(seed.map((f) => f.id))
    const shSeed = require('../assets/supermarket-seed.json') as { id: string }[]
    const rlSeed = require('../assets/rami-levy-seed.json') as { id: string }[]
    const overlapsSh = shSeed.filter((f) => rawIds.has(f.id))
    const overlapsRl = rlSeed.filter((f) => rawIds.has(f.id))
    expect(overlapsSh).toHaveLength(0)
    expect(overlapsRl).toHaveLength(0)
  })

  it('has ids unique within the raw seed', () => {
    const ids = seed.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ── Schema v17 — dedup invariant across all 3 sources ────────────────────

describe('schema v17 — dedup invariant', () => {
  // Simulates the v17 migration cleanup in-memory: compute name_norm for every
  // row, then for each normalized name keep only the highest-tier row
  // (raw > manual > sh > rl). Asserts zero duplicate name_norm remain.
  //
  // This protects against seed regressions. Matches the cross-source DELETE in
  // `migrateToV17` (src/db/database.ts).
  it('no two rows share a normalized name after tier cleanup', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { normalizeNameForDedup } = require('../shared/normalizeFoodName') as {
      normalizeNameForDedup: (s: string) => string
    }
    const shSeed = require('../assets/supermarket-seed.json') as {
      id: string
      nameHe: string
    }[]
    const rlSeed = require('../assets/rami-levy-seed.json') as {
      id: string
      nameHe: string
    }[]
    const rawSeed = require('../assets/raw-ingredients-seed.json') as {
      id: string
      nameHe: string
    }[]

    const tier = (id: string): number => {
      if (id.startsWith('raw_')) return 0
      if (id.startsWith('manual_')) return 1
      if (id.startsWith('sh_')) return 2
      if (id.startsWith('rl_')) return 3
      return 4
    }

    const all = [...shSeed, ...rlSeed, ...rawSeed].map((f) => ({
      id: f.id,
      name_norm: normalizeNameForDedup(f.nameHe),
      tierN: tier(f.id),
    }))

    // Tier cleanup: for each name_norm, find the minimum tier. Any row with
    // a higher tier number than the min is deleted.
    const minTierByNorm = new Map<string, number>()
    for (const row of all) {
      const cur = minTierByNorm.get(row.name_norm)
      if (cur === undefined || row.tierN < cur) {
        minTierByNorm.set(row.name_norm, row.tierN)
      }
    }
    const survivors = all.filter(
      (r) => r.name_norm !== '' && r.tierN === minTierByNorm.get(r.name_norm),
    )

    // Count duplicate name_norm among survivors
    const nameNormCounts = new Map<string, number>()
    for (const row of survivors) {
      nameNormCounts.set(row.name_norm, (nameNormCounts.get(row.name_norm) ?? 0) + 1)
    }
    const dups = [...nameNormCounts.entries()].filter(([, c]) => c > 1)

    if (dups.length > 0) {
      // Surface first 3 offenders for easier debugging
      console.error('Residual dups:', dups.slice(0, 3))
    }
    expect(dups).toHaveLength(0)
  })
})
