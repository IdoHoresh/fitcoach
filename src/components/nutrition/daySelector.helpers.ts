/**
 * Pure helper functions for DaySelector.
 * No side effects — all inputs are explicit parameters.
 */

/**
 * Returns 7 YYYY-MM-DD strings for the full Sun–Sat week
 * that contains the given anchor date.
 */
export function getWeekDates(anchorDate: string): string[] {
  const anchor = new Date(anchorDate + 'T12:00:00') // noon avoids DST edge cases
  const dayOfWeek = anchor.getDay() // 0=Sun, 6=Sat
  const sunday = new Date(anchor)
  sunday.setDate(anchor.getDate() - dayOfWeek)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

/** Returns true when date === today (both YYYY-MM-DD). */
export function isToday(date: string, today: string): boolean {
  return date === today
}
