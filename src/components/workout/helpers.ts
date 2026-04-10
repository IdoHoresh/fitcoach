import { t } from '@/i18n'
import type { DayOfWeek } from '@/types/user'
import type { MuscleGroup } from '@/types/workout'
import type { GeneratedWorkoutDay } from '@/algorithms/workout-generator'

/** Format sets and rep range: "3 × 8-12" or "3 × 10" when min === max */
export function formatSetsReps(sets: number, minReps: number, maxReps: number): string {
  const reps = minReps === maxReps ? `${minReps}` : `${minReps}-${maxReps}`
  return `${sets} × ${reps}`
}

/** Format rest time: "45s" for < 60, "1:30" for >= 60 */
export function formatRestTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/** Get the next day of week (Saturday wraps to Sunday) */
export function getNextDay(day: DayOfWeek): DayOfWeek {
  return ((day + 1) % 7) as DayOfWeek
}

/** Check if a day is a rest day (no template or undefined) */
export function isRestDay(day: GeneratedWorkoutDay | undefined): boolean {
  return day == null || day.template == null
}

/** Translate a muscle group key to the current locale */
export function translateMuscle(muscle: MuscleGroup): string {
  return t().workout.muscles[muscle]
}

/** Format a set summary for collapsed exercise card: "3/3 sets · 40kg" */
export function formatSetsSummary(
  loggedSets: number,
  totalSets: number,
  lastWeightKg: number | null,
): string {
  const sets = `${loggedSets}/${totalSets}`
  if (lastWeightKg != null && lastWeightKg > 0) {
    return `${sets} · ${lastWeightKg}${t().workout.kg}`
  }
  return sets
}

/** Get the midpoint of a rep range for pre-filling set rows */
export function getMidpointReps(minReps: number, maxReps: number): number {
  return Math.round((minReps + maxReps) / 2)
}

/** Format elapsed time from ISO start to now as "MM:SS" */
export function formatElapsed(startedAtISO: string): string {
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(startedAtISO).getTime()) / 1000))
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
