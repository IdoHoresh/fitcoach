/**
 * Streak Calculation — retention hook for the Home screen.
 *
 * Given a list of workout logs and a weekly goal, compute:
 *   - completedThisWeek: workouts finished in the current (Sunday-start) week
 *   - currentStreak: consecutive prior weeks that met the goal
 *
 * Week boundaries follow the Israeli calendar convention (Sunday → Saturday).
 * Only logs with `completedAt !== null` count — abandoned sessions are excluded.
 *
 * Pure function, no side effects.
 */

import type { WorkoutLog } from '../types'

/** Maximum weeks to walk back when computing streak (safety bound ≈ 10 years). */
const MAX_STREAK_WEEKS = 520

interface StreakResult {
  readonly completedThisWeek: number
  readonly currentStreak: number
}

export function calculateStreak(
  workoutLogs: readonly WorkoutLog[],
  weeklyGoal: number,
  now: Date,
): StreakResult {
  if (weeklyGoal <= 0) {
    return { completedThisWeek: 0, currentStreak: 0 }
  }

  // Bucket completed workouts by week-start key (Sunday, YYYY-MM-DD).
  const weekCounts = new Map<string, number>()
  for (const log of workoutLogs) {
    if (log.completedAt === null) continue
    const key = weekStartKey(parseLocalDate(log.date))
    weekCounts.set(key, (weekCounts.get(key) ?? 0) + 1)
  }

  const currentWeekKey = weekStartKey(now)
  const completedThisWeek = weekCounts.get(currentWeekKey) ?? 0

  // Walk backwards one week at a time. If the current week already hit the
  // goal, include it in the streak. Otherwise treat it as "in progress" —
  // don't count it yet, but don't break the streak either.
  let cursor = parseLocalDate(currentWeekKey)
  let streak = 0

  if (completedThisWeek >= weeklyGoal) {
    streak = 1
  }
  cursor = addDays(cursor, -7)

  for (let i = 0; i < MAX_STREAK_WEEKS; i++) {
    const count = weekCounts.get(toISODate(cursor)) ?? 0
    if (count >= weeklyGoal) {
      streak++
      cursor = addDays(cursor, -7)
    } else {
      break
    }
  }

  return { completedThisWeek, currentStreak: streak }
}

// ── Date helpers ────────────────────────────────────────────────────

/** Parse 'YYYY-MM-DD' as a local-time date (avoids UTC off-by-one). */
function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Format a Date as 'YYYY-MM-DD' in local time. */
function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Returns the Sunday that starts the week containing `date`, as YYYY-MM-DD. */
function weekStartKey(date: Date): string {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayOfWeek = local.getDay() // 0 = Sunday
  local.setDate(local.getDate() - dayOfWeek)
  return toISODate(local)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + days)
  return next
}
