/**
 * Tests for DaySelector pure helpers.
 * RED phase: written before the helpers exist.
 */

import { getWeekDates, isToday } from './daySelector.helpers'

describe('getWeekDates', () => {
  it('returns 7 dates for the week containing the anchor date', () => {
    const dates = getWeekDates('2026-04-10') // Friday
    expect(dates).toHaveLength(7)
  })

  it('starts from Sunday of the anchor week', () => {
    // 2026-04-10 is a Friday — Sunday of that week is 2026-04-05
    const dates = getWeekDates('2026-04-10')
    expect(dates[0]).toBe('2026-04-05')
  })

  it('ends on Saturday of the anchor week', () => {
    const dates = getWeekDates('2026-04-10')
    expect(dates[6]).toBe('2026-04-11')
  })

  it('returns sequential dates in YYYY-MM-DD format', () => {
    const dates = getWeekDates('2026-04-10')
    expect(dates[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(dates[1]).toBe('2026-04-06')
    expect(dates[2]).toBe('2026-04-07')
  })

  it('handles Sunday as anchor — returns the same week', () => {
    // 2026-04-05 is a Sunday
    const dates = getWeekDates('2026-04-05')
    expect(dates[0]).toBe('2026-04-05')
    expect(dates[6]).toBe('2026-04-11')
  })

  it('handles Saturday as anchor — returns the same week', () => {
    // 2026-04-11 is a Saturday
    const dates = getWeekDates('2026-04-11')
    expect(dates[0]).toBe('2026-04-05')
    expect(dates[6]).toBe('2026-04-11')
  })
})

describe('isToday', () => {
  it('returns true when date equals today', () => {
    expect(isToday('2026-04-10', '2026-04-10')).toBe(true)
  })

  it('returns false when date differs from today', () => {
    expect(isToday('2026-04-09', '2026-04-10')).toBe(false)
  })
})
