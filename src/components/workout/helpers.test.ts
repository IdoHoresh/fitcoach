import { formatSetsReps, formatRestTime, getNextDay, isRestDay } from './helpers'
import type { DayOfWeek } from '@/types/user'
import type { GeneratedWorkoutDay } from '@/algorithms/workout-generator'
import type { WorkoutTemplate } from '@/types/workout'

// ── formatSetsReps ──────────────────────────────────────────────

describe('formatSetsReps', () => {
  it('formats sets with a rep range', () => {
    expect(formatSetsReps(3, 8, 12)).toBe('3 × 8-12')
  })

  it('formats sets with single rep count when min === max', () => {
    expect(formatSetsReps(4, 10, 10)).toBe('4 × 10')
  })

  it('handles 1 set', () => {
    expect(formatSetsReps(1, 6, 8)).toBe('1 × 6-8')
  })

  it('handles large rep ranges', () => {
    expect(formatSetsReps(2, 12, 20)).toBe('2 × 12-20')
  })
})

// ── formatRestTime ──────────────────────────────────────────────

describe('formatRestTime', () => {
  it('formats seconds under 60 as seconds', () => {
    expect(formatRestTime(45)).toBe('45s')
  })

  it('formats exactly 60 seconds as 1:00', () => {
    expect(formatRestTime(60)).toBe('1:00')
  })

  it('formats 90 seconds as 1:30', () => {
    expect(formatRestTime(90)).toBe('1:30')
  })

  it('formats 120 seconds as 2:00', () => {
    expect(formatRestTime(120)).toBe('2:00')
  })

  it('formats 180 seconds as 3:00', () => {
    expect(formatRestTime(180)).toBe('3:00')
  })

  it('formats 150 seconds as 2:30', () => {
    expect(formatRestTime(150)).toBe('2:30')
  })
})

// ── getNextDay ──────────────────────────────────────────────────

describe('getNextDay', () => {
  it('returns Monday (1) for Sunday (0)', () => {
    expect(getNextDay(0 as DayOfWeek)).toBe(1)
  })

  it('returns Sunday (0) for Saturday (6)', () => {
    expect(getNextDay(6 as DayOfWeek)).toBe(0)
  })

  it('returns Wednesday (3) for Tuesday (2)', () => {
    expect(getNextDay(2 as DayOfWeek)).toBe(3)
  })

  it('returns Saturday (6) for Friday (5)', () => {
    expect(getNextDay(5 as DayOfWeek)).toBe(6)
  })
})

// ── isRestDay ───────────────────────────────────────────────────

const MOCK_TEMPLATE: WorkoutTemplate = {
  id: 'tpl_001',
  dayType: 'upper_a',
  splitType: 'upper_lower',
  nameHe: 'עליון A',
  nameEn: 'Upper A',
  exercises: [],
  estimatedMinutes: 60,
}

describe('isRestDay', () => {
  it('returns true when day is undefined', () => {
    expect(isRestDay(undefined)).toBe(true)
  })

  it('returns true when template is null (rest day)', () => {
    const restDay: GeneratedWorkoutDay = {
      dayOfWeek: 0,
      dayType: 'rest',
      template: null,
    }
    expect(isRestDay(restDay)).toBe(true)
  })

  it('returns false when template exists (workout day)', () => {
    const workoutDay: GeneratedWorkoutDay = {
      dayOfWeek: 1,
      dayType: 'upper_a',
      template: MOCK_TEMPLATE,
    }
    expect(isRestDay(workoutDay)).toBe(false)
  })
})
