import type { FoodItem } from '@/types'
import type { OffResult } from '@/services/open-food-facts'
import { OffNetworkError } from '@/services/open-food-facts'
import { resolveScan, type ScanResolverDeps } from './scan-resolver'

// ── Fixtures ──────────────────────────────────────────────────────────

const LOCAL_FOOD: FoodItem = {
  id: 'sh_7290000066318',
  nameHe: 'מוצר מקומי',
  nameEn: 'Local Product',
  category: 'snacks',
  caloriesPer100g: 480,
  proteinPer100g: 6,
  fatPer100g: 22,
  carbsPer100g: 64,
  fiberPer100g: 2,
  isUserCreated: false,
  servingSizes: [{ nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 }],
}

const OFF_FOOD: FoodItem = {
  id: 'manual_7290000066318',
  nameHe: 'מוצר מ-OFF',
  nameEn: 'OFF Product',
  category: 'snacks',
  caloriesPer100g: 500,
  proteinPer100g: 8,
  fatPer100g: 20,
  carbsPer100g: 60,
  fiberPer100g: 3,
  isUserCreated: false,
  servingSizes: [{ nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 }],
}

const EAN = '7290000066318'

function makeDeps(overrides: Partial<ScanResolverDeps> = {}): ScanResolverDeps {
  return {
    getByBarcode: jest.fn().mockResolvedValue(null),
    fetchOffProduct: jest.fn().mockResolvedValue(null),
    upsertFood: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('resolveScan()', () => {
  it('returns local_hit when getByBarcode finds the food', async () => {
    const deps = makeDeps({ getByBarcode: jest.fn().mockResolvedValue(LOCAL_FOOD) })

    const result = await resolveScan(EAN, deps)

    expect(result).toEqual({ kind: 'local_hit', food: LOCAL_FOOD })
  })

  it('does not call fetchOffProduct when local hit', async () => {
    const deps = makeDeps({ getByBarcode: jest.fn().mockResolvedValue(LOCAL_FOOD) })

    await resolveScan(EAN, deps)

    expect(deps.fetchOffProduct).not.toHaveBeenCalled()
  })

  it('does not call upsertFood when local hit', async () => {
    const deps = makeDeps({ getByBarcode: jest.fn().mockResolvedValue(LOCAL_FOOD) })

    await resolveScan(EAN, deps)

    expect(deps.upsertFood).not.toHaveBeenCalled()
  })

  it('returns off_hit with isPartial=false on full OFF response (upsertFood called)', async () => {
    const offResult: OffResult = { food: OFF_FOOD, isPartial: false }
    const deps = makeDeps({ fetchOffProduct: jest.fn().mockResolvedValue(offResult) })

    const result = await resolveScan(EAN, deps)

    expect(result).toEqual({ kind: 'off_hit', food: OFF_FOOD, isPartial: false })
    expect(deps.upsertFood).toHaveBeenCalledWith(OFF_FOOD)
  })

  it('returns off_hit with isPartial=true on partial OFF response (upsertFood called)', async () => {
    const offResult: OffResult = { food: OFF_FOOD, isPartial: true }
    const deps = makeDeps({ fetchOffProduct: jest.fn().mockResolvedValue(offResult) })

    const result = await resolveScan(EAN, deps)

    expect(result).toEqual({ kind: 'off_hit', food: OFF_FOOD, isPartial: true })
    expect(deps.upsertFood).toHaveBeenCalledWith(OFF_FOOD)
  })

  it('returns not_found when both local DB and OFF return null (no insert)', async () => {
    const deps = makeDeps()

    const result = await resolveScan(EAN, deps)

    expect(result).toEqual({ kind: 'not_found' })
    expect(deps.upsertFood).not.toHaveBeenCalled()
  })

  it('returns network_error when fetchOffProduct throws OffNetworkError', async () => {
    const deps = makeDeps({
      fetchOffProduct: jest.fn().mockRejectedValue(new OffNetworkError('test')),
    })

    const result = await resolveScan(EAN, deps)

    expect(result).toEqual({ kind: 'network_error' })
    expect(deps.upsertFood).not.toHaveBeenCalled()
  })

  it("returns network_error on any unexpected error (preserves today's fallback)", async () => {
    const deps = makeDeps({
      fetchOffProduct: jest.fn().mockRejectedValue(new Error('json parse failed')),
    })

    const result = await resolveScan(EAN, deps)

    expect(result).toEqual({ kind: 'network_error' })
    expect(deps.upsertFood).not.toHaveBeenCalled()
  })
})
