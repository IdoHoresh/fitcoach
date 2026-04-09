import { calculateStreak } from './streak'
import type { WorkoutLog } from '../types'

// ── Helpers ─────────────────────────────────────────────────────────

function workoutLog(date: string, completed = true): WorkoutLog {
  return {
    id: `log-${date}`,
    date,
    templateId: 'template-1',
    dayType: 'push_a',
    startedAt: `${date}T10:00:00.000Z`,
    completedAt: completed ? `${date}T11:00:00.000Z` : null,
    exercises: [],
    durationMinutes: 60,
  }
}

// Thursday, April 9, 2026. The ISO week (Sunday-start) containing this
// date runs Sunday April 5 → Saturday April 11.
const THURSDAY = new Date(2026, 3, 9)

// ── calculateStreak ────────────────────────────────────────────────

describe('calculateStreak', () => {
  describe('completedThisWeek', () => {
    it('returns_zero_for_empty_logs', () => {
      const result = calculateStreak([], 3, THURSDAY)
      expect(result.completedThisWeek).toBe(0)
    })

    it('counts_completed_workouts_in_current_week', () => {
      const logs: WorkoutLog[] = [
        workoutLog('2026-04-06'), // Mon of current week
        workoutLog('2026-04-08'), // Wed of current week
      ]
      const result = calculateStreak(logs, 3, THURSDAY)
      expect(result.completedThisWeek).toBe(2)
    })

    it('excludes_workouts_from_previous_week', () => {
      const logs: WorkoutLog[] = [
        workoutLog('2026-04-06'), // current week
        workoutLog('2026-04-02'), // previous week
      ]
      const result = calculateStreak(logs, 3, THURSDAY)
      expect(result.completedThisWeek).toBe(1)
    })

    it('excludes_abandoned_workouts_with_null_completedAt', () => {
      const logs: WorkoutLog[] = [
        workoutLog('2026-04-06', true),
        workoutLog('2026-04-07', false), // abandoned
      ]
      const result = calculateStreak(logs, 3, THURSDAY)
      expect(result.completedThisWeek).toBe(1)
    })

    it('counts_sunday_as_first_day_of_week', () => {
      const sundayLog = workoutLog('2026-04-05') // Sunday
      const result = calculateStreak([sundayLog], 3, THURSDAY)
      expect(result.completedThisWeek).toBe(1)
    })

    it('counts_saturday_as_last_day_of_week', () => {
      const saturdayLog = workoutLog('2026-04-11') // Saturday
      const saturday = new Date(2026, 3, 11)
      const result = calculateStreak([saturdayLog], 3, saturday)
      expect(result.completedThisWeek).toBe(1)
    })
  })

  describe('currentStreak', () => {
    it('returns_zero_for_empty_logs', () => {
      const result = calculateStreak([], 3, THURSDAY)
      expect(result.currentStreak).toBe(0)
    })

    it('returns_zero_when_weekly_goal_is_zero', () => {
      const logs: WorkoutLog[] = [workoutLog('2026-04-06')]
      const result = calculateStreak(logs, 0, THURSDAY)
      expect(result.currentStreak).toBe(0)
    })

    it('counts_current_week_when_goal_already_met', () => {
      const logs: WorkoutLog[] = [
        workoutLog('2026-04-05'),
        workoutLog('2026-04-06'),
        workoutLog('2026-04-07'),
      ]
      const result = calculateStreak(logs, 3, THURSDAY)
      expect(result.currentStreak).toBe(1)
    })

    it('skips_current_week_in_progress_but_counts_prior_weeks', () => {
      // Current week only 2 of 3 done — still in progress, don't break streak
      // Previous week hit goal → streak = 1
      const logs: WorkoutLog[] = [
        workoutLog('2026-04-06'),
        workoutLog('2026-04-08'),
        // previous week (March 29 - April 4)
        workoutLog('2026-03-30'),
        workoutLog('2026-04-01'),
        workoutLog('2026-04-03'),
      ]
      const result = calculateStreak(logs, 3, THURSDAY)
      expect(result.currentStreak).toBe(1)
    })

    it('counts_multiple_consecutive_weeks_hitting_goal', () => {
      const logs: WorkoutLog[] = [
        // current week — goal met
        workoutLog('2026-04-05'),
        workoutLog('2026-04-06'),
        workoutLog('2026-04-07'),
        // previous week — goal met
        workoutLog('2026-03-29'),
        workoutLog('2026-03-31'),
        workoutLog('2026-04-02'),
        // 2 weeks ago — goal met
        workoutLog('2026-03-22'),
        workoutLog('2026-03-24'),
        workoutLog('2026-03-26'),
      ]
      const result = calculateStreak(logs, 3, THURSDAY)
      expect(result.currentStreak).toBe(3)
    })

    it('breaks_streak_at_first_missed_week', () => {
      const logs: WorkoutLog[] = [
        // current week — met
        workoutLog('2026-04-05'),
        workoutLog('2026-04-06'),
        workoutLog('2026-04-07'),
        // previous week — missed (only 1)
        workoutLog('2026-03-30'),
        // 2 weeks ago — met
        workoutLog('2026-03-22'),
        workoutLog('2026-03-24'),
        workoutLog('2026-03-26'),
      ]
      const result = calculateStreak(logs, 3, THURSDAY)
      expect(result.currentStreak).toBe(1) // only current week counted
    })

    it('ignores_abandoned_workouts_when_computing_streak', () => {
      const logs: WorkoutLog[] = [
        // current week — appears to have 3, but 1 is abandoned
        workoutLog('2026-04-05', true),
        workoutLog('2026-04-06', true),
        workoutLog('2026-04-07', false),
      ]
      const result = calculateStreak(logs, 3, THURSDAY)
      expect(result.currentStreak).toBe(0)
    })
  })
})
