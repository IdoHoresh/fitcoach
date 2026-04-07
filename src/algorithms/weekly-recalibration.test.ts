/**
 * Weekly Recalibration — Tests.
 * Verifies weight trend analysis, calorie adjustment, and coach message generation.
 */

import {
  CALORIE_ADJUSTMENT_STEP,
  CALORIE_FLOOR,
  EXPECTED_WEEKLY_CHANGE,
  MAX_CALORIE_ADJUSTMENT,
} from '../data/constants'
import {
  calculateCalorieAdjustment,
  calculateWeightTrend,
  determineAction,
  determineSeverity,
  getCoachMessageKey,
  recalibrate,
} from './weekly-recalibration'

// ── calculateWeightTrend ────────────────────────────────────────────

describe('calculateWeightTrend', () => {
  it('returns null for fewer than 2 weeks of data', () => {
    expect(calculateWeightTrend([80])).toBeNull()
    expect(calculateWeightTrend([])).toBeNull()
  })

  it('returns correct delta for 2-week case', () => {
    // Lost 0.5 kg in a week
    expect(calculateWeightTrend([80, 79.5])).toBe(-0.5)
  })

  it('returns positive delta for weight gain', () => {
    expect(calculateWeightTrend([80, 80.3])).toBeCloseTo(0.3, 1)
  })

  it('uses only last two entries even with more data', () => {
    // 4 weeks of data, only last two matter
    expect(calculateWeightTrend([82, 81, 80.5, 80])).toBe(-0.5)
  })
})

// ── determineAction ─────────────────────────────────────────────────

describe('determineAction', () => {
  describe('fat_loss', () => {
    it('on track (-0.5 kg/week) → stay_course', () => {
      expect(determineAction(-0.5, 'fat_loss')).toBe('stay_course')
    })

    it('at range boundary (-0.3) → stay_course', () => {
      expect(determineAction(-0.3, 'fat_loss')).toBe('stay_course')
    })

    it('at range boundary (-0.7) → stay_course', () => {
      expect(determineAction(-0.7, 'fat_loss')).toBe('stay_course')
    })

    it('losing too fast (-1.0 kg/week) → increase_calories', () => {
      expect(determineAction(-1.0, 'fat_loss')).toBe('increase_calories')
    })

    it('not losing enough (-0.1 kg/week) → increase_deficit', () => {
      expect(determineAction(-0.1, 'fat_loss')).toBe('increase_deficit')
    })

    it('gaining weight (+0.2 kg/week) → decrease_calories', () => {
      expect(determineAction(0.2, 'fat_loss')).toBe('decrease_calories')
    })

    it('stalled (0 change) → increase_deficit', () => {
      expect(determineAction(0, 'fat_loss')).toBe('increase_deficit')
    })
  })

  describe('muscle_gain', () => {
    it('on track (+0.2 kg/week) → stay_course', () => {
      expect(determineAction(0.2, 'muscle_gain')).toBe('stay_course')
    })

    it('gaining too fast (+0.5 kg/week) → reduce_surplus', () => {
      expect(determineAction(0.5, 'muscle_gain')).toBe('reduce_surplus')
    })

    it('not gaining enough (+0.05 kg/week) → increase_calories', () => {
      expect(determineAction(0.05, 'muscle_gain')).toBe('increase_calories')
    })

    it('losing weight (-0.3 kg/week) → increase_calories', () => {
      expect(determineAction(-0.3, 'muscle_gain')).toBe('increase_calories')
    })
  })

  describe('maintenance', () => {
    it('stable (0 change) → stay_course', () => {
      expect(determineAction(0, 'maintenance')).toBe('stay_course')
    })

    it('within range (+0.2) → stay_course', () => {
      expect(determineAction(0.2, 'maintenance')).toBe('stay_course')
    })

    it('drifting up (+0.5) → decrease_calories', () => {
      expect(determineAction(0.5, 'maintenance')).toBe('decrease_calories')
    })

    it('drifting down (-0.5) → increase_calories', () => {
      expect(determineAction(-0.5, 'maintenance')).toBe('increase_calories')
    })
  })
})

// ── determineSeverity ───────────────────────────────────────────────

describe('determineSeverity', () => {
  it('stay_course → on_track', () => {
    expect(determineSeverity('stay_course', -0.5, EXPECTED_WEEKLY_CHANGE.fat_loss)).toBe('on_track')
  })

  it('minor deviation outside range → minor_adjust', () => {
    // Fat loss: expected -0.7 to -0.3, weight change = -0.2 (just outside)
    expect(determineSeverity('increase_deficit', -0.2, EXPECTED_WEEKLY_CHANGE.fat_loss)).toBe(
      'minor_adjust',
    )
  })

  it('large deviation → significant_adjust', () => {
    // Fat loss: expected -0.7 to -0.3, weight change = +0.3 (way outside)
    expect(determineSeverity('decrease_calories', 0.3, EXPECTED_WEEKLY_CHANGE.fat_loss)).toBe(
      'significant_adjust',
    )
  })

  it('extreme deviation → concern', () => {
    // Fat loss: expected -0.7 to -0.3, weight change = -1.5 (extreme)
    expect(determineSeverity('increase_calories', -1.5, EXPECTED_WEEKLY_CHANGE.fat_loss)).toBe(
      'concern',
    )
  })
})

// ── calculateCalorieAdjustment ──────────────────────────────────────

describe('calculateCalorieAdjustment', () => {
  it('stay_course → 0 adjustment', () => {
    expect(calculateCalorieAdjustment('stay_course', 'on_track')).toBe(0)
  })

  it('log_more → 0 adjustment', () => {
    expect(calculateCalorieAdjustment('log_more', 'on_track')).toBe(0)
  })

  it('minor increase_calories → +100', () => {
    expect(calculateCalorieAdjustment('increase_calories', 'minor_adjust')).toBe(
      CALORIE_ADJUSTMENT_STEP,
    )
  })

  it('significant decrease_calories → -200', () => {
    expect(calculateCalorieAdjustment('decrease_calories', 'significant_adjust')).toBe(
      -CALORIE_ADJUSTMENT_STEP * 2,
    )
  })

  it('concern level → capped at MAX_CALORIE_ADJUSTMENT', () => {
    const result = calculateCalorieAdjustment('increase_calories', 'concern')
    expect(Math.abs(result)).toBeLessThanOrEqual(MAX_CALORIE_ADJUSTMENT)
    expect(result).toBe(MAX_CALORIE_ADJUSTMENT)
  })

  it('increase_deficit returns negative (reduce calories)', () => {
    expect(calculateCalorieAdjustment('increase_deficit', 'minor_adjust')).toBe(
      -CALORIE_ADJUSTMENT_STEP,
    )
  })

  it('reduce_surplus returns negative (reduce calories)', () => {
    expect(calculateCalorieAdjustment('reduce_surplus', 'minor_adjust')).toBe(
      -CALORIE_ADJUSTMENT_STEP,
    )
  })
})

// ── getCoachMessageKey ──────────────────────────────────────────────

describe('getCoachMessageKey', () => {
  it('returns correct key for stay_course', () => {
    expect(getCoachMessageKey('stay_course', 'on_track')).toBe('recalibration.stay_course')
  })

  it('returns correct key for increase_calories with minor_adjust', () => {
    expect(getCoachMessageKey('increase_calories', 'minor_adjust')).toBe(
      'recalibration.increase_calories.minor_adjust',
    )
  })

  it('returns correct key for log_more', () => {
    expect(getCoachMessageKey('log_more', 'on_track')).toBe('recalibration.log_more')
  })
})

// ── recalibrate (integration) ───────────────────────────────────────

describe('recalibrate', () => {
  const baseParams = {
    weeklyAverages: [113, 112.5, 112],
    adherenceRate: 0.85,
    currentCalories: 2288,
    goal: 'fat_loss' as const,
    sex: 'male' as const,
    adjustedWeightKg: 98.8,
    actualWeightKg: 112,
  }

  it('returns log_more when adherence is below threshold', () => {
    const result = recalibrate({ ...baseParams, adherenceRate: 0.4 })
    expect(result.action).toBe('log_more')
    expect(result.calorieAdjustment).toBe(0)
    expect(result.newTargetCalories).toBe(baseParams.currentCalories)
  })

  it('returns log_more when insufficient weeks of data', () => {
    const result = recalibrate({ ...baseParams, weeklyAverages: [113] })
    expect(result.action).toBe('log_more')
    expect(result.calorieAdjustment).toBe(0)
  })

  it('on-track fat loss returns stay_course with 0 adjustment', () => {
    // 112.5 → 112 = -0.5 kg/week (within -0.7 to -0.3 range)
    const result = recalibrate(baseParams)
    expect(result.action).toBe('stay_course')
    expect(result.calorieAdjustment).toBe(0)
    expect(result.newTargetCalories).toBe(baseParams.currentCalories)
    expect(result.isOnTrack).toBe(true)
  })

  it('stalled fat loss decreases calories', () => {
    // 112.5 → 112.4 = -0.1 kg/week (too slow)
    const result = recalibrate({
      ...baseParams,
      weeklyAverages: [113, 112.5, 112.4],
    })
    expect(result.action).toBe('increase_deficit')
    expect(result.calorieAdjustment).toBeLessThan(0)
    expect(result.newTargetCalories).toBeLessThan(baseParams.currentCalories)
  })

  it('too-fast fat loss increases calories', () => {
    // 112.5 → 111.5 = -1.0 kg/week (too fast)
    const result = recalibrate({
      ...baseParams,
      weeklyAverages: [113, 112.5, 111.5],
    })
    expect(result.action).toBe('increase_calories')
    expect(result.calorieAdjustment).toBeGreaterThan(0)
    expect(result.newTargetCalories).toBeGreaterThan(baseParams.currentCalories)
  })

  it('new calories never drop below CALORIE_FLOOR for male', () => {
    const result = recalibrate({
      ...baseParams,
      currentCalories: 1550,
      weeklyAverages: [113, 112.5, 112.4],
    })
    expect(result.newTargetCalories).toBeGreaterThanOrEqual(CALORIE_FLOOR.male)
  })

  it('new calories never drop below CALORIE_FLOOR for female', () => {
    const result = recalibrate({
      ...baseParams,
      sex: 'female',
      currentCalories: 1250,
      weeklyAverages: [70, 69.8, 69.7],
    })
    expect(result.newTargetCalories).toBeGreaterThanOrEqual(CALORIE_FLOOR.female)
  })

  it('macros are recalculated from new calorie target', () => {
    const result = recalibrate({
      ...baseParams,
      weeklyAverages: [113, 112.5, 111.5],
    })
    // If calories changed, macros should be recalculated (not just old values)
    if (result.calorieAdjustment !== 0) {
      const macroCalories =
        result.newProteinGrams * 4 + result.newFatGrams * 9 + result.newCarbGrams * 4
      // Should be close to new target (within rounding)
      expect(Math.abs(macroCalories - result.newTargetCalories)).toBeLessThanOrEqual(10)
    }
  })

  it('coachMessageKey matches action and severity', () => {
    const result = recalibrate(baseParams)
    expect(result.coachMessageKey).toContain('recalibration')
    expect(result.coachMessageKey).toContain(result.action)
  })

  it('weightChange reflects actual difference', () => {
    const result = recalibrate(baseParams)
    expect(result.weightChange).toBeCloseTo(-0.5, 1)
  })

  it('expectedChange is midpoint of goal range', () => {
    const result = recalibrate(baseParams)
    const range = EXPECTED_WEEKLY_CHANGE.fat_loss
    expect(result.expectedChange).toBe((range.min + range.max) / 2)
  })
})
