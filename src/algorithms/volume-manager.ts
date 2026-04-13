/**
 * Volume Management Algorithm.
 *
 * Manages weekly training volume across mesocycles:
 * - Starts at MEV (Minimum Effective Volume)
 * - Progressively increases toward MAV (Maximum Adaptive Volume)
 * - Auto-triggers deload when approaching MRV or performance declines
 *
 * Based on RP Volume Landmarks (Israetel, Hoffmann, Smith 2020).
 * Pure functions only.
 */

import type { ExperienceLevel, MuscleGroup } from '../types'
import { MESOCYCLE, VOLUME_LANDMARKS } from '../data/constants'

/** Volume prescription for a single muscle group in a given week */
export interface WeeklyVolumeTarget {
  readonly muscleGroup: MuscleGroup
  readonly targetSets: number
  readonly isDeload: boolean
}

/**
 * Calculates the target weekly sets for a muscle group based on mesocycle week.
 *
 * Volume ramp:
 *   Week 1: MEV + small buffer (introductory)
 *   Week 2-3: Linear ramp toward MAV low
 *   Week 4-5: MAV mid to high
 *   Week 6 (deload): MV + round(MV × DELOAD_VOLUME_REDUCTION) — a partial step
 *     down from the peak toward maintenance. Ends above MV so fiber stimulation
 *     is preserved while fatigue dissipates. Still well below MEV/MAV peak.
 *
 * @param muscleGroup - The muscle to calculate volume for
 * @param weekNumber - Current week in the mesocycle (1-based)
 * @param totalWeeks - Total weeks in the mesocycle
 * @param experience - Affects starting volume
 */
export function calculateWeeklyVolume(
  muscleGroup: MuscleGroup,
  weekNumber: number,
  totalWeeks: number,
  experience: ExperienceLevel,
): WeeklyVolumeTarget {
  const landmarks = VOLUME_LANDMARKS[muscleGroup]
  const isDeload = weekNumber >= totalWeeks

  if (isDeload) {
    return {
      muscleGroup,
      targetSets: Math.round(landmarks.mv * MESOCYCLE.DELOAD_VOLUME_REDUCTION) + landmarks.mv,
      isDeload: true,
    }
  }

  // Calculate progression through the mesocycle (0 to 1)
  const workingWeeks = totalWeeks - 1 // Exclude deload week
  const progress = (weekNumber - 1) / Math.max(1, workingWeeks - 1)

  // Beginners start lower, intermediates start higher
  const startVolume =
    experience === 'beginner'
      ? landmarks.mev
      : landmarks.mev + Math.round((landmarks.mavLow - landmarks.mev) / 2)

  const peakVolume = experience === 'beginner' ? landmarks.mavLow : landmarks.mavHigh

  // Linear interpolation from start to peak
  const targetSets = Math.round(startVolume + progress * (peakVolume - startVolume))

  return {
    muscleGroup,
    targetSets,
    isDeload: false,
  }
}

/**
 * Calculates volume targets for ALL muscle groups in a given week.
 */
export function calculateAllVolumeTargets(
  weekNumber: number,
  totalWeeks: number,
  experience: ExperienceLevel,
): readonly WeeklyVolumeTarget[] {
  const allMuscles: MuscleGroup[] = [
    'chest',
    'back',
    'shoulders',
    'quads',
    'hamstrings',
    'biceps',
    'triceps',
    'glutes',
    'calves',
    'abs',
  ]

  return allMuscles.map((muscle) =>
    calculateWeeklyVolume(muscle, weekNumber, totalWeeks, experience),
  )
}

/**
 * Checks if a muscle group's actual volume is within acceptable range.
 * Returns whether the user is under, on target, or over their volume.
 */
export function assessVolumeStatus(
  muscleGroup: MuscleGroup,
  actualSets: number,
): 'under' | 'on_target' | 'over' | 'excessive' {
  const landmarks = VOLUME_LANDMARKS[muscleGroup]

  if (actualSets < landmarks.mev) return 'under'
  if (actualSets > landmarks.mrv) return 'excessive'
  if (actualSets > landmarks.mavHigh) return 'over'
  return 'on_target'
}

/**
 * Determines if a deload is needed based on performance signals.
 *
 * Triggers:
 * 1. Consecutive declining sessions exceed threshold
 * 2. Volume is approaching or exceeding MRV
 * 3. User reports high fatigue indicators
 */
export function shouldDeload(
  consecutiveDeclines: number,
  muscleVolumes: ReadonlyMap<MuscleGroup, number>,
): boolean {
  // Trigger 1: Performance decline
  if (consecutiveDeclines >= MESOCYCLE.DECLINE_THRESHOLD) {
    return true
  }

  // Trigger 2: Any muscle group exceeding MRV
  for (const [muscle, sets] of muscleVolumes) {
    if (sets > VOLUME_LANDMARKS[muscle].mrv) {
      return true
    }
  }

  return false
}
