/**
 * Tests for UserRepository — focuses on the coach marks flag round-trip.
 *
 * Profile CRUD is exercised through the store layer; this file targets
 * the standalone coach marks getter/setter that the store calls.
 */

import { userRepository } from './user-repository'

// ── Mock the database ─────────────────────────────────────────────

const mockRunAsync = jest.fn()
const mockGetFirstAsync = jest.fn()

jest.mock('./database', () => ({
  getDatabase: () => ({
    runAsync: mockRunAsync,
    getFirstAsync: mockGetFirstAsync,
  }),
}))

jest.mock('expo-crypto', () => ({
  randomUUID: () => 'mock-uuid-' + Math.random().toString(36).slice(2, 8),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('UserRepository.coachMarksCompleted', () => {
  describe('getCoachMarksCompleted', () => {
    it('returns_false_when_no_profile_row_exists', async () => {
      mockGetFirstAsync.mockResolvedValue(null)

      const result = await userRepository.getCoachMarksCompleted()

      expect(result).toBe(false)
    })

    it('returns_false_when_column_is_zero', async () => {
      mockGetFirstAsync.mockResolvedValue({ coach_marks_completed: 0 })

      const result = await userRepository.getCoachMarksCompleted()

      expect(result).toBe(false)
    })

    it('returns_true_when_column_is_one', async () => {
      mockGetFirstAsync.mockResolvedValue({ coach_marks_completed: 1 })

      const result = await userRepository.getCoachMarksCompleted()

      expect(result).toBe(true)
    })

    it('uses_parameterized_select', async () => {
      mockGetFirstAsync.mockResolvedValue({ coach_marks_completed: 0 })

      await userRepository.getCoachMarksCompleted()

      // Single SELECT call, no string interpolation of values
      expect(mockGetFirstAsync).toHaveBeenCalledTimes(1)
      const sql = mockGetFirstAsync.mock.calls[0][0] as string
      expect(sql).toContain('coach_marks_completed')
      expect(sql).toContain('FROM user_profile')
    })
  })

  describe('setCoachMarksCompleted', () => {
    it('writes_one_for_true', async () => {
      mockRunAsync.mockResolvedValue(undefined)

      await userRepository.setCoachMarksCompleted(true)

      expect(mockRunAsync).toHaveBeenCalledTimes(1)
      const [sql, params] = mockRunAsync.mock.calls[0] as [string, unknown[]]
      expect(sql).toContain('UPDATE user_profile')
      expect(sql).toContain('coach_marks_completed = ?')
      expect(params[0]).toBe(1)
    })

    it('writes_zero_for_false', async () => {
      mockRunAsync.mockResolvedValue(undefined)

      await userRepository.setCoachMarksCompleted(false)

      const [, params] = mockRunAsync.mock.calls[0] as [string, unknown[]]
      expect(params[0]).toBe(0)
    })

    it('uses_parameterized_update_no_string_concat', async () => {
      mockRunAsync.mockResolvedValue(undefined)

      await userRepository.setCoachMarksCompleted(true)

      const [sql] = mockRunAsync.mock.calls[0] as [string]
      // No literal "1" or "true" baked into the SQL (would indicate concatenation)
      expect(sql).not.toMatch(/coach_marks_completed\s*=\s*1/)
      expect(sql).not.toMatch(/coach_marks_completed\s*=\s*'1'/)
    })
  })
})
