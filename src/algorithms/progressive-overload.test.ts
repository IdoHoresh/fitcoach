import {
  getWeightIncrement,
  allSetsAtTopOfRange,
  hasPerfDeclined,
  getProgressionAdvice,
} from './progressive-overload'
import type { LoggedSet } from '../types'
import { WEIGHT_INCREMENT, MESOCYCLE } from '../data/constants'

// ── Helper: create a working set ───────────────────────────────────

function workingSet(reps: number, weightKg = 60): LoggedSet {
  return { setNumber: 1, weightKg, reps, rpe: null, isWarmup: false }
}

function warmupSet(reps: number, weightKg = 30): LoggedSet {
  return { setNumber: 1, weightKg, reps, rpe: null, isWarmup: true }
}

// ── getWeightIncrement ─────────────────────────────────────────────

describe('getWeightIncrement', () => {
  it('returns_small_upper_increment_for_biceps', () => {
    expect(getWeightIncrement('biceps')).toBe(WEIGHT_INCREMENT.SMALL_MUSCLE_UPPER) // 1.25
  })

  it('returns_small_upper_increment_for_triceps', () => {
    expect(getWeightIncrement('triceps')).toBe(WEIGHT_INCREMENT.SMALL_MUSCLE_UPPER)
  })

  it('returns_small_upper_increment_for_shoulders', () => {
    expect(getWeightIncrement('shoulders')).toBe(WEIGHT_INCREMENT.SMALL_MUSCLE_UPPER)
  })

  it('returns_small_lower_increment_for_calves', () => {
    expect(getWeightIncrement('calves')).toBe(WEIGHT_INCREMENT.SMALL_MUSCLE_LOWER) // 2.5
  })

  it('returns_upper_body_increment_for_chest', () => {
    expect(getWeightIncrement('chest')).toBe(WEIGHT_INCREMENT.UPPER_BODY) // 2.5
  })

  it('returns_upper_body_increment_for_back', () => {
    expect(getWeightIncrement('back')).toBe(WEIGHT_INCREMENT.UPPER_BODY)
  })

  it('returns_lower_body_increment_for_quads', () => {
    expect(getWeightIncrement('quads')).toBe(WEIGHT_INCREMENT.LOWER_BODY) // 5
  })

  it('returns_lower_body_increment_for_hamstrings', () => {
    expect(getWeightIncrement('hamstrings')).toBe(WEIGHT_INCREMENT.LOWER_BODY)
  })

  it('returns_lower_body_increment_for_glutes', () => {
    expect(getWeightIncrement('glutes')).toBe(WEIGHT_INCREMENT.LOWER_BODY)
  })

  it('returns_lower_body_increment_for_abs', () => {
    expect(getWeightIncrement('abs')).toBe(WEIGHT_INCREMENT.LOWER_BODY)
  })
})

// ── allSetsAtTopOfRange ────────────────────────────────────────────

describe('allSetsAtTopOfRange', () => {
  it('returns_true_when_all_working_sets_hit_max_reps', () => {
    const sets = [workingSet(12), workingSet(12), workingSet(12)]
    expect(allSetsAtTopOfRange(sets, 12)).toBe(true)
  })

  it('returns_true_when_sets_exceed_max_reps', () => {
    const sets = [workingSet(14), workingSet(13), workingSet(12)]
    expect(allSetsAtTopOfRange(sets, 12)).toBe(true)
  })

  it('returns_false_when_one_set_below_max', () => {
    const sets = [workingSet(12), workingSet(11), workingSet(12)]
    expect(allSetsAtTopOfRange(sets, 12)).toBe(false)
  })

  it('returns_false_when_no_sets_hit_max', () => {
    const sets = [workingSet(8), workingSet(9), workingSet(10)]
    expect(allSetsAtTopOfRange(sets, 12)).toBe(false)
  })

  it('returns_false_for_empty_array', () => {
    expect(allSetsAtTopOfRange([], 12)).toBe(false)
  })

  it('excludes_warmup_sets_from_check', () => {
    const sets = [warmupSet(5), workingSet(12), workingSet(12)]
    expect(allSetsAtTopOfRange(sets, 12)).toBe(true)
  })

  it('returns_false_when_only_warmup_sets', () => {
    const sets = [warmupSet(12), warmupSet(12)]
    expect(allSetsAtTopOfRange(sets, 12)).toBe(false)
  })
})

// ── hasPerfDeclined ────────────────────────────────────────────────

describe('hasPerfDeclined', () => {
  it('returns_true_when_more_than_half_below_min', () => {
    const sets = [workingSet(5), workingSet(5), workingSet(8)]
    // 2/3 below min of 8 → more than half
    expect(hasPerfDeclined(sets, 8)).toBe(true)
  })

  it('returns_false_when_exactly_half_below_min', () => {
    const sets = [workingSet(5), workingSet(5), workingSet(8), workingSet(9)]
    // 2/4 = exactly half → NOT more than half
    expect(hasPerfDeclined(sets, 8)).toBe(false)
  })

  it('returns_false_when_all_above_min', () => {
    const sets = [workingSet(10), workingSet(9), workingSet(8)]
    expect(hasPerfDeclined(sets, 8)).toBe(false)
  })

  it('returns_false_for_empty_array', () => {
    expect(hasPerfDeclined([], 8)).toBe(false)
  })

  it('excludes_warmup_sets', () => {
    const sets = [warmupSet(3), workingSet(10), workingSet(9)]
    expect(hasPerfDeclined(sets, 8)).toBe(false)
  })

  it('returns_true_when_all_below_min', () => {
    const sets = [workingSet(4), workingSet(5), workingSet(3)]
    expect(hasPerfDeclined(sets, 8)).toBe(true)
  })
})

// ── getProgressionAdvice ───────────────────────────────────────────

describe('getProgressionAdvice', () => {
  describe('deload', () => {
    it('triggers_deload_when_consecutive_declines_at_threshold', () => {
      const sets = [workingSet(8), workingSet(7), workingSet(6)]
      const result = getProgressionAdvice(60, sets, 8, 12, 'chest', MESOCYCLE.DECLINE_THRESHOLD)

      expect(result.action).toBe('deload')
    })

    it('triggers_deload_when_consecutive_declines_above_threshold', () => {
      const sets = [workingSet(8)]
      const result = getProgressionAdvice(60, sets, 8, 12, 'chest', 5)

      expect(result.action).toBe('deload')
    })

    it('suggests_10_percent_weight_reduction_on_deload', () => {
      const result = getProgressionAdvice(
        100,
        [workingSet(8)],
        8,
        12,
        'quads',
        MESOCYCLE.DECLINE_THRESHOLD,
      )

      // 100 × (1 - 0.1) = 90, rounded to nearest 0.5
      expect(result.suggestedWeightKg).toBe(90)
    })

    it('rounds_deload_weight_to_nearest_0_5kg', () => {
      const result = getProgressionAdvice(
        67,
        [workingSet(8)],
        8,
        12,
        'chest',
        MESOCYCLE.DECLINE_THRESHOLD,
      )

      // 67 × 0.9 = 60.3 → round to nearest 0.5 = 60.5
      expect(result.suggestedWeightKg).toBe(60.5)
    })

    it('deload_has_priority_over_increase_weight', () => {
      // All sets at top of range BUT declines at threshold → deload wins
      const sets = [workingSet(12), workingSet(12), workingSet(12)]
      const result = getProgressionAdvice(60, sets, 8, 12, 'chest', MESOCYCLE.DECLINE_THRESHOLD)

      expect(result.action).toBe('deload')
    })

    it('includes_reason_strings', () => {
      const result = getProgressionAdvice(
        60,
        [workingSet(8)],
        8,
        12,
        'chest',
        MESOCYCLE.DECLINE_THRESHOLD,
      )

      expect(result.reason).toContain('deload')
      expect(result.reasonHe).toContain('דילואד')
    })
  })

  describe('increase_weight', () => {
    it('suggests_increase_when_all_sets_at_top_of_range', () => {
      const sets = [workingSet(12), workingSet(12), workingSet(12)]
      const result = getProgressionAdvice(60, sets, 8, 12, 'chest', 0)

      expect(result.action).toBe('increase_weight')
    })

    it('adds_correct_increment_for_chest', () => {
      const sets = [workingSet(12), workingSet(12)]
      const result = getProgressionAdvice(60, sets, 8, 12, 'chest', 0)

      expect(result.suggestedWeightKg).toBe(60 + WEIGHT_INCREMENT.UPPER_BODY) // 62.5
    })

    it('adds_correct_increment_for_quads', () => {
      const sets = [workingSet(10), workingSet(10)]
      const result = getProgressionAdvice(100, sets, 6, 10, 'quads', 0)

      expect(result.suggestedWeightKg).toBe(100 + WEIGHT_INCREMENT.LOWER_BODY) // 105
    })

    it('adds_correct_increment_for_biceps', () => {
      const sets = [workingSet(15), workingSet(15)]
      const result = getProgressionAdvice(20, sets, 10, 15, 'biceps', 0)

      expect(result.suggestedWeightKg).toBe(20 + WEIGHT_INCREMENT.SMALL_MUSCLE_UPPER) // 21.25
    })

    it('includes_reason_with_reps_and_increment', () => {
      const sets = [workingSet(12), workingSet(12)]
      const result = getProgressionAdvice(60, sets, 8, 12, 'chest', 0)

      expect(result.reason).toContain('12 reps')
      expect(result.reason).toContain('Increase weight')
    })
  })

  describe('stay', () => {
    it('suggests_stay_when_not_all_sets_at_top', () => {
      const sets = [workingSet(10), workingSet(11), workingSet(9)]
      const result = getProgressionAdvice(60, sets, 8, 12, 'chest', 0)

      expect(result.action).toBe('stay')
    })

    it('keeps_current_weight_when_staying', () => {
      const sets = [workingSet(10), workingSet(11)]
      const result = getProgressionAdvice(60, sets, 8, 12, 'chest', 0)

      expect(result.suggestedWeightKg).toBe(60)
    })

    it('suggests_stay_when_one_decline_but_below_threshold', () => {
      const sets = [workingSet(9), workingSet(10)]
      const result = getProgressionAdvice(60, sets, 8, 12, 'chest', 1)

      expect(result.action).toBe('stay')
    })

    it('includes_reason_with_target_reps', () => {
      const sets = [workingSet(10)]
      const result = getProgressionAdvice(60, sets, 8, 12, 'chest', 0)

      expect(result.reason).toContain('12 reps')
      expect(result.reason).toContain('60kg')
    })
  })

  it('always_returns_empty_exercise_id', () => {
    const sets = [workingSet(10)]
    const result = getProgressionAdvice(60, sets, 8, 12, 'chest', 0)

    expect(result.exerciseId).toBe('')
  })
})
