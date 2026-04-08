import {
  calculateWeeklyVolume,
  calculateAllVolumeTargets,
  assessVolumeStatus,
  shouldDeload,
} from './volume-manager'
import type { MuscleGroup } from '../types'
import { VOLUME_LANDMARKS, MESOCYCLE } from '../data/constants'

// ── calculateWeeklyVolume ──────────────────────────────────────────

describe('calculateWeeklyVolume', () => {
  const totalWeeks = 6

  describe('beginner', () => {
    it('week_1_starts_at_mev_for_chest', () => {
      const result = calculateWeeklyVolume('chest', 1, totalWeeks, 'beginner')
      // progress = 0 → startVolume = mev = 6
      expect(result.targetSets).toBe(VOLUME_LANDMARKS.chest.mev)
      expect(result.isDeload).toBe(false)
    })

    it('final_working_week_reaches_mav_low', () => {
      // Week 5 of 6 (last working week, week 6 is deload)
      // progress = (5-1)/(5-1) = 1.0 → peakVolume = mavLow = 12
      const result = calculateWeeklyVolume('chest', 5, totalWeeks, 'beginner')
      expect(result.targetSets).toBe(VOLUME_LANDMARKS.chest.mavLow)
    })

    it('mid_week_is_between_mev_and_mav_low', () => {
      const result = calculateWeeklyVolume('chest', 3, totalWeeks, 'beginner')
      expect(result.targetSets).toBeGreaterThanOrEqual(VOLUME_LANDMARKS.chest.mev)
      expect(result.targetSets).toBeLessThanOrEqual(VOLUME_LANDMARKS.chest.mavLow)
    })

    it('volume_increases_over_working_weeks', () => {
      const w1 = calculateWeeklyVolume('chest', 1, totalWeeks, 'beginner')
      const w3 = calculateWeeklyVolume('chest', 3, totalWeeks, 'beginner')
      const w5 = calculateWeeklyVolume('chest', 5, totalWeeks, 'beginner')
      expect(w3.targetSets).toBeGreaterThanOrEqual(w1.targetSets)
      expect(w5.targetSets).toBeGreaterThanOrEqual(w3.targetSets)
    })
  })

  describe('intermediate', () => {
    it('week_1_starts_higher_than_beginner', () => {
      const beginner = calculateWeeklyVolume('chest', 1, totalWeeks, 'beginner')
      const intermediate = calculateWeeklyVolume('chest', 1, totalWeeks, 'intermediate')
      // intermediate startVolume = mev + (mavLow - mev)/2
      expect(intermediate.targetSets).toBeGreaterThan(beginner.targetSets)
    })

    it('final_working_week_reaches_mav_high', () => {
      const result = calculateWeeklyVolume('chest', 5, totalWeeks, 'intermediate')
      expect(result.targetSets).toBe(VOLUME_LANDMARKS.chest.mavHigh)
    })

    it('peaks_higher_than_beginner', () => {
      const beginner = calculateWeeklyVolume('chest', 5, totalWeeks, 'beginner')
      const intermediate = calculateWeeklyVolume('chest', 5, totalWeeks, 'intermediate')
      expect(intermediate.targetSets).toBeGreaterThan(beginner.targetSets)
    })
  })

  describe('deload_week', () => {
    it('returns_deload_flag_true_on_last_week', () => {
      const result = calculateWeeklyVolume('chest', totalWeeks, totalWeeks, 'beginner')
      expect(result.isDeload).toBe(true)
    })

    it('deload_volume_is_based_on_mv', () => {
      const result = calculateWeeklyVolume('chest', totalWeeks, totalWeeks, 'beginner')
      // deload = mv + round(mv * DELOAD_VOLUME_REDUCTION) = 4 + round(4 * 0.5) = 4 + 2 = 6
      const expected =
        VOLUME_LANDMARKS.chest.mv +
        Math.round(VOLUME_LANDMARKS.chest.mv * MESOCYCLE.DELOAD_VOLUME_REDUCTION)
      expect(result.targetSets).toBe(expected)
    })

    it('deload_is_less_than_peak_working_week', () => {
      const peak = calculateWeeklyVolume('chest', 5, totalWeeks, 'intermediate')
      const deload = calculateWeeklyVolume('chest', totalWeeks, totalWeeks, 'intermediate')
      expect(deload.targetSets).toBeLessThan(peak.targetSets)
    })

    it('mv_zero_muscles_get_zero_deload_sets', () => {
      // Glutes and abs have MV=0 — scientifically valid since they get
      // indirect work from compounds. Deload = 0 + round(0 * 0.5) = 0 sets.
      const glutes = calculateWeeklyVolume('glutes', totalWeeks, totalWeeks, 'beginner')
      const abs = calculateWeeklyVolume('abs', totalWeeks, totalWeeks, 'beginner')
      expect(glutes.targetSets).toBe(0)
      expect(abs.targetSets).toBe(0)
      expect(glutes.isDeload).toBe(true)
      expect(abs.isDeload).toBe(true)
    })
  })

  describe('different_muscles', () => {
    it('back_has_higher_mev_than_chest', () => {
      // back mev = 8, chest mev = 6
      const back = calculateWeeklyVolume('back', 1, totalWeeks, 'beginner')
      const chest = calculateWeeklyVolume('chest', 1, totalWeeks, 'beginner')
      expect(back.targetSets).toBeGreaterThan(chest.targetSets)
    })

    it('returns_correct_muscle_group_in_result', () => {
      const result = calculateWeeklyVolume('hamstrings', 1, totalWeeks, 'beginner')
      expect(result.muscleGroup).toBe('hamstrings')
    })
  })
})

// ── calculateAllVolumeTargets ──────────────────────────────────────

describe('calculateAllVolumeTargets', () => {
  it('returns_targets_for_all_10_muscle_groups', () => {
    const result = calculateAllVolumeTargets(1, 6, 'beginner')
    expect(result).toHaveLength(10)
  })

  it('includes_all_expected_muscles', () => {
    const result = calculateAllVolumeTargets(1, 6, 'beginner')
    const muscles = result.map((v) => v.muscleGroup)
    expect(muscles).toContain('chest')
    expect(muscles).toContain('back')
    expect(muscles).toContain('shoulders')
    expect(muscles).toContain('quads')
    expect(muscles).toContain('hamstrings')
    expect(muscles).toContain('biceps')
    expect(muscles).toContain('triceps')
    expect(muscles).toContain('glutes')
    expect(muscles).toContain('calves')
    expect(muscles).toContain('abs')
  })

  it('all_deload_week_targets_are_flagged', () => {
    const result = calculateAllVolumeTargets(6, 6, 'beginner')
    result.forEach((target) => {
      expect(target.isDeload).toBe(true)
    })
  })

  it('all_working_week_targets_are_not_flagged', () => {
    const result = calculateAllVolumeTargets(3, 6, 'beginner')
    result.forEach((target) => {
      expect(target.isDeload).toBe(false)
    })
  })

  it('all_targets_have_positive_sets', () => {
    const result = calculateAllVolumeTargets(1, 6, 'beginner')
    result.forEach((target) => {
      expect(target.targetSets).toBeGreaterThan(0)
    })
  })
})

// ── assessVolumeStatus ─────────────────────────────────────────────

describe('assessVolumeStatus', () => {
  // chest: { mv: 4, mev: 6, mavLow: 12, mavHigh: 18, mrv: 22 }

  it('returns_under_when_below_mev', () => {
    expect(assessVolumeStatus('chest', 3)).toBe('under')
    expect(assessVolumeStatus('chest', 5)).toBe('under')
  })

  it('returns_on_target_at_mev', () => {
    expect(assessVolumeStatus('chest', 6)).toBe('on_target')
  })

  it('returns_on_target_in_mav_range', () => {
    expect(assessVolumeStatus('chest', 12)).toBe('on_target')
    expect(assessVolumeStatus('chest', 15)).toBe('on_target')
    expect(assessVolumeStatus('chest', 18)).toBe('on_target')
  })

  it('returns_over_when_above_mav_high_but_below_mrv', () => {
    expect(assessVolumeStatus('chest', 19)).toBe('over')
    expect(assessVolumeStatus('chest', 22)).toBe('over')
  })

  it('returns_excessive_when_above_mrv', () => {
    expect(assessVolumeStatus('chest', 23)).toBe('excessive')
    expect(assessVolumeStatus('chest', 30)).toBe('excessive')
  })

  it('works_for_small_muscle_groups', () => {
    // biceps: { mv: 2, mev: 4, mavLow: 10, mavHigh: 14, mrv: 18 }
    expect(assessVolumeStatus('biceps', 1)).toBe('under')
    expect(assessVolumeStatus('biceps', 4)).toBe('on_target')
    expect(assessVolumeStatus('biceps', 10)).toBe('on_target')
    expect(assessVolumeStatus('biceps', 15)).toBe('over')
    expect(assessVolumeStatus('biceps', 20)).toBe('excessive')
  })

  it('returns_on_target_at_mav_high_boundary', () => {
    // mavHigh is the upper bound of on_target
    expect(assessVolumeStatus('chest', 18)).toBe('on_target')
  })

  it('returns_over_at_mrv_boundary', () => {
    // mrv = 22 for chest — assessVolumeStatus says > mavHigh = over, > mrv = excessive
    expect(assessVolumeStatus('chest', 22)).toBe('over')
  })
})

// ── shouldDeload ───────────────────────────────────────────────────

describe('shouldDeload', () => {
  it('returns_true_when_consecutive_declines_at_threshold', () => {
    const volumes = new Map<MuscleGroup, number>([['chest', 10]])
    expect(shouldDeload(MESOCYCLE.DECLINE_THRESHOLD, volumes)).toBe(true)
  })

  it('returns_true_when_consecutive_declines_above_threshold', () => {
    const volumes = new Map<MuscleGroup, number>([['chest', 10]])
    expect(shouldDeload(5, volumes)).toBe(true)
  })

  it('returns_true_when_any_muscle_exceeds_mrv', () => {
    // chest mrv = 22
    const volumes = new Map<MuscleGroup, number>([
      ['chest', 25],
      ['back', 10],
    ])
    expect(shouldDeload(0, volumes)).toBe(true)
  })

  it('returns_false_when_no_triggers', () => {
    const volumes = new Map<MuscleGroup, number>([
      ['chest', 15],
      ['back', 12],
    ])
    expect(shouldDeload(0, volumes)).toBe(false)
  })

  it('returns_false_when_one_decline_below_threshold', () => {
    const volumes = new Map<MuscleGroup, number>([['chest', 10]])
    expect(shouldDeload(1, volumes)).toBe(false)
  })

  it('returns_true_when_volume_at_exactly_mrv_plus_one', () => {
    // chest mrv = 22, so 23 should trigger
    const volumes = new Map<MuscleGroup, number>([['chest', 23]])
    expect(shouldDeload(0, volumes)).toBe(true)
  })

  it('returns_false_when_volume_exactly_at_mrv', () => {
    // At mrv, not above it
    const volumes = new Map<MuscleGroup, number>([['chest', 22]])
    expect(shouldDeload(0, volumes)).toBe(false)
  })

  it('returns_true_if_any_single_muscle_exceeds_mrv', () => {
    // Only calves exceed (mrv = 16)
    const volumes = new Map<MuscleGroup, number>([
      ['chest', 10],
      ['back', 12],
      ['calves', 17],
    ])
    expect(shouldDeload(0, volumes)).toBe(true)
  })

  it('handles_empty_volume_map', () => {
    const volumes = new Map<MuscleGroup, number>()
    expect(shouldDeload(0, volumes)).toBe(false)
  })
})
