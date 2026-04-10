/**
 * Tests for MealAdherenceRepository.
 * RED phase: written before the repository exists.
 */

import type { MealAdherence } from '../types'
import { mealAdherenceRepository } from './nutrition-repository'

// ── Mock the database ─────────────────────────────────────────────

const mockRunAsync = jest.fn()
const mockGetFirstAsync = jest.fn()
const mockGetAllAsync = jest.fn()

jest.mock('./database', () => ({
  getDatabase: () => ({
    runAsync: mockRunAsync,
    getFirstAsync: mockGetFirstAsync,
    getAllAsync: mockGetAllAsync,
    withTransactionAsync: jest.fn((fn: () => Promise<void>) => fn()),
  }),
}))

jest.mock('expo-crypto', () => ({
  randomUUID: () => 'mock-uuid-abc123',
}))

// ── Fixtures ──────────────────────────────────────────────────────

const MOCK_ADHERENCE_ROW = {
  id: 'mock-uuid-abc123',
  date: '2026-04-10',
  meal_type: 'breakfast',
  level: 'accurate',
  created_at: '2026-04-10T08:00:00',
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ── saveAdherence ─────────────────────────────────────────────────

describe('MealAdherenceRepository.saveAdherence', () => {
  it('inserts a new adherence record and returns the domain object', async () => {
    mockRunAsync.mockResolvedValueOnce(undefined)

    const result = await mealAdherenceRepository.saveAdherence({
      date: '2026-04-10',
      mealType: 'breakfast',
      level: 'accurate',
    })

    expect(mockRunAsync).toHaveBeenCalledTimes(1)
    expect(mockRunAsync.mock.calls[0][0]).toContain('INSERT OR REPLACE INTO meal_adherence')
    expect(result.id).toBe('mock-uuid-abc123')
    expect(result.date).toBe('2026-04-10')
    expect(result.mealType).toBe('breakfast')
    expect(result.level).toBe('accurate')
  })

  it('upserts — second call for same date+mealType overwrites level', async () => {
    mockRunAsync.mockResolvedValue(undefined)

    await mealAdherenceRepository.saveAdherence({
      date: '2026-04-10',
      mealType: 'lunch',
      level: 'roughly',
    })

    await mealAdherenceRepository.saveAdherence({
      date: '2026-04-10',
      mealType: 'lunch',
      level: 'not_accurate',
    })

    // Both calls use INSERT OR REPLACE (upsert)
    expect(mockRunAsync).toHaveBeenCalledTimes(2)
    const secondCall = mockRunAsync.mock.calls[1][0] as string
    expect(secondCall).toContain('INSERT OR REPLACE INTO meal_adherence')
  })
})

// ── getAdherenceForDate ───────────────────────────────────────────

describe('MealAdherenceRepository.getAdherenceForDate', () => {
  it('returns mapped adherence entries for a given date', async () => {
    mockGetAllAsync.mockResolvedValueOnce([MOCK_ADHERENCE_ROW])

    const results = await mealAdherenceRepository.getAdherenceForDate('2026-04-10')

    expect(mockGetAllAsync).toHaveBeenCalledWith(expect.stringContaining('WHERE date = ?'), [
      '2026-04-10',
    ])
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject<Partial<MealAdherence>>({
      id: 'mock-uuid-abc123',
      date: '2026-04-10',
      mealType: 'breakfast',
      level: 'accurate',
    })
  })

  it('returns empty array when no adherence records exist for the date', async () => {
    mockGetAllAsync.mockResolvedValueOnce([])

    const results = await mealAdherenceRepository.getAdherenceForDate('2026-01-01')

    expect(results).toEqual([])
  })
})
