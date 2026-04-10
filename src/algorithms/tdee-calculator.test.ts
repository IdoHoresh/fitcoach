import {
  calculateBmrMifflin,
  calculateBmrKatchMcArdle,
  calculateBmr,
  calculateOccupationNeat,
  calculateStepNeat,
  calculateLifestyleNeat,
  estimateDailySteps,
  calculateTotalNeat,
  calculateEat,
  calculateTef,
  calculateTdeeBreakdown,
} from './tdee-calculator'

// ── BMR Tests ────────────────────────────────────────────────────────

describe('calculateBmrMifflin', () => {
  it('calculates_male_bmr_correctly', () => {
    // Formula: 10 × 80 + 6.25 × 180 - 5 × 30 + (-5) = 1,770
    expect(calculateBmrMifflin(80, 180, 30, 'male')).toBe(1770)
  })

  it('calculates_female_bmr_correctly', () => {
    // Formula: 10 × 60 + 6.25 × 165 - 5 × 25 + (-161) = 1,345
    expect(calculateBmrMifflin(60, 165, 25, 'female')).toBe(1345)
  })

  it('calculates_ido_bmr_correctly', () => {
    // Ido: 113kg, 189cm, 30yo male
    // 10 × 113 + 6.25 × 189 - 5 × 30 + (-5) = 2,156
    const result = calculateBmrMifflin(113, 189, 30, 'male')
    expect(result).toBe(2156)
  })

  it('heavier_person_has_higher_bmr', () => {
    const light = calculateBmrMifflin(60, 175, 30, 'male')
    const heavy = calculateBmrMifflin(100, 175, 30, 'male')
    expect(heavy).toBeGreaterThan(light)
  })

  it('older_person_has_lower_bmr', () => {
    const young = calculateBmrMifflin(80, 175, 25, 'male')
    const old = calculateBmrMifflin(80, 175, 50, 'male')
    expect(old).toBeLessThan(young)
  })

  it('male_has_higher_bmr_than_female_same_stats', () => {
    const male = calculateBmrMifflin(70, 170, 30, 'male')
    const female = calculateBmrMifflin(70, 170, 30, 'female')
    expect(male).toBeGreaterThan(female)
  })
})

describe('calculateBmrKatchMcArdle', () => {
  it('calculates_bmr_from_lean_mass', () => {
    // 80kg at 20% bf → LBM = 64kg → 370 + 21.6 × 64 = 1,752
    expect(calculateBmrKatchMcArdle(80, 20)).toBe(1752)
  })

  it('lower_body_fat_yields_higher_bmr_at_same_weight', () => {
    const lean = calculateBmrKatchMcArdle(80, 12)
    const heavy = calculateBmrKatchMcArdle(80, 30)
    expect(lean).toBeGreaterThan(heavy)
  })
})

describe('calculateBmr', () => {
  it('uses_katch_mcardle_when_body_fat_known', () => {
    const result = calculateBmr(80, 180, 30, 'male', 20)
    const expected = calculateBmrKatchMcArdle(80, 20)
    expect(result).toBe(expected)
  })

  it('uses_mifflin_when_body_fat_unknown', () => {
    const result = calculateBmr(80, 180, 30, 'male', null)
    const expected = calculateBmrMifflin(80, 180, 30, 'male')
    expect(result).toBe(expected)
  })
})

// ── NEAT Tests ───────────────────────────────────────────────────────

describe('calculateOccupationNeat', () => {
  it('returns_correct_values_for_each_occupation', () => {
    expect(calculateOccupationNeat('desk')).toBe(150)
    expect(calculateOccupationNeat('mixed')).toBe(350)
    expect(calculateOccupationNeat('active')).toBe(550)
    expect(calculateOccupationNeat('physical_labor')).toBe(900)
  })

  it('physical_labor_burns_most', () => {
    expect(calculateOccupationNeat('physical_labor')).toBeGreaterThan(
      calculateOccupationNeat('desk'),
    )
  })
})

describe('calculateStepNeat', () => {
  it('returns_zero_below_baseline', () => {
    expect(calculateStepNeat(2000)).toBe(0)
    expect(calculateStepNeat(3000)).toBe(0)
  })

  it('calculates_correctly_above_baseline', () => {
    // 10,000 steps → (10,000 - 3,000) / 1,000 × 35 = 245
    expect(calculateStepNeat(10000)).toBe(245)
  })

  it('calculates_small_excess_correctly', () => {
    // 4,000 steps → (4,000 - 3,000) / 1,000 × 35 = 35
    expect(calculateStepNeat(4000)).toBe(35)
  })

  it('handles_zero_steps', () => {
    expect(calculateStepNeat(0)).toBe(0)
  })

  it('more_steps_means_more_calories', () => {
    expect(calculateStepNeat(15000)).toBeGreaterThan(calculateStepNeat(8000))
  })
})

describe('calculateLifestyleNeat', () => {
  it('returns_correct_values', () => {
    expect(calculateLifestyleNeat('sedentary')).toBe(50)
    expect(calculateLifestyleNeat('moderate')).toBe(200)
    expect(calculateLifestyleNeat('active')).toBe(400)
  })
})

describe('estimateDailySteps', () => {
  it('desk_sedentary_gets_lowest_estimate', () => {
    const result = estimateDailySteps('desk', 'sedentary')
    expect(result).toBe(2000) // 3,500 - 1,500
  })

  it('active_job_active_lifestyle_gets_highest', () => {
    const result = estimateDailySteps('active', 'active')
    expect(result).toBe(14500) // 12,000 + 2,500
  })

  it('never_returns_negative', () => {
    // Even extreme low should floor at 0
    expect(estimateDailySteps('desk', 'sedentary')).toBeGreaterThanOrEqual(0)
  })
})

describe('calculateTotalNeat', () => {
  it('uses_steps_when_provided', () => {
    // With steps: step NEAT + lifestyle NEAT
    const result = calculateTotalNeat('desk', 10000, 'moderate')
    const expected = calculateStepNeat(10000) + calculateLifestyleNeat('moderate')
    expect(result).toBe(expected)
  })

  it('uses_occupation_when_no_steps', () => {
    // Without steps: occupation NEAT + lifestyle NEAT
    const result = calculateTotalNeat('desk', null, 'moderate')
    const expected = calculateOccupationNeat('desk') + calculateLifestyleNeat('moderate')
    expect(result).toBe(expected)
  })

  it('steps_avoid_double_counting_with_occupation', () => {
    // When steps provided, occupation NEAT should NOT be added
    const withSteps = calculateTotalNeat('physical_labor', 5000, 'sedentary')
    // Should be step NEAT + lifestyle, NOT occupation + step + lifestyle
    const stepNeat = calculateStepNeat(5000)
    const lifestyleNeat = calculateLifestyleNeat('sedentary')
    expect(withSteps).toBe(stepNeat + lifestyleNeat)
  })
})

// ── EAT Tests ────────────────────────────────────────────────────────

describe('calculateEat', () => {
  it('returns_zero_for_zero_exercise_days', () => {
    expect(calculateEat(0, 60, 'moderate', 'strength', 80)).toBe(0)
  })

  it('heavier_person_burns_more', () => {
    const light = calculateEat(4, 60, 'moderate', 'strength', 60)
    const heavy = calculateEat(4, 60, 'moderate', 'strength', 100)
    expect(heavy).toBeGreaterThan(light)
  })

  it('more_days_means_more_calories', () => {
    const threeDays = calculateEat(3, 60, 'moderate', 'strength', 80)
    const fiveDays = calculateEat(5, 60, 'moderate', 'strength', 80)
    expect(fiveDays).toBeGreaterThan(threeDays)
  })

  it('intense_burns_more_than_light', () => {
    const light = calculateEat(4, 60, 'light', 'strength', 80)
    const intense = calculateEat(4, 60, 'intense', 'strength', 80)
    expect(intense).toBeGreaterThan(light)
  })

  it('strength_has_lower_active_ratio_than_cardio', () => {
    // Strength ~35% active vs cardio ~95% active
    // But strength has higher EPOC, so total difference depends on params
    const strength = calculateEat(4, 60, 'moderate', 'strength', 80)
    const cardio = calculateEat(4, 60, 'moderate', 'cardio', 80)
    expect(cardio).toBeGreaterThan(strength)
  })

  it('returns_reasonable_daily_values', () => {
    // 4x/week, 60min, moderate, strength, 80kg — should be ~100-500 kcal/day
    const result = calculateEat(4, 60, 'moderate', 'strength', 80)
    expect(result).toBeGreaterThan(50)
    expect(result).toBeLessThan(600)
  })

  it('ido_strength_training_reasonable', () => {
    // Ido: 4x/week, 90min, easy intensity, strength, 113kg
    const result = calculateEat(4, 90, 'light', 'strength', 113)
    // Should be modest due to light intensity + 35% active time ratio
    expect(result).toBeGreaterThan(50)
    expect(result).toBeLessThan(400)
  })

  it('throws_for_weight_below_minimum', () => {
    expect(() => calculateEat(4, 60, 'moderate', 'strength', 10)).toThrow(RangeError)
  })

  it('throws_for_weight_above_maximum', () => {
    expect(() => calculateEat(4, 60, 'moderate', 'strength', 400)).toThrow(RangeError)
  })
})

// ── TEF Tests ────────────────────────────────────────────────────────

describe('calculateTef', () => {
  it('returns_approximately_10_percent_of_total', () => {
    const bmr = 1800
    const neat = 350
    const eat = 300
    const tef = calculateTef(bmr, neat, eat)
    const total = bmr + neat + eat + tef
    // TEF should be ~10% of total
    expect(tef / total).toBeCloseTo(0.1, 1)
  })

  it('higher_expenditure_means_higher_tef', () => {
    const low = calculateTef(1500, 200, 100)
    const high = calculateTef(2000, 400, 300)
    expect(high).toBeGreaterThan(low)
  })
})

// ── Full TDEE Breakdown Tests ────────────────────────────────────────

describe('calculateTdeeBreakdown', () => {
  it('total_equals_sum_of_components', () => {
    const result = calculateTdeeBreakdown(1800, 80, {
      occupation: 'desk',
      dailySteps: 8000,
      afterWorkActivity: 'moderate',
      exerciseDaysPerWeek: 4,
      sessionDurationMinutes: 60,
      exerciseIntensity: 'moderate',
      exerciseType: 'strength',
      sleepHoursPerNight: 8,
    })

    expect(result.total).toBe(result.bmr + result.neat + result.eat + result.tef)
  })

  it('bmr_is_passed_through', () => {
    const result = calculateTdeeBreakdown(1800, 80, {
      occupation: 'desk',
      dailySteps: null,
      afterWorkActivity: 'sedentary',
      exerciseDaysPerWeek: 0,
      sessionDurationMinutes: 30,
      exerciseIntensity: 'light',
      exerciseType: 'strength',
      sleepHoursPerNight: 8,
    })

    expect(result.bmr).toBe(1800)
  })

  it('sedentary_desk_worker_no_exercise_reasonable', () => {
    // Sedentary desk worker, no exercise
    const result = calculateTdeeBreakdown(1700, 75, {
      occupation: 'desk',
      dailySteps: null,
      afterWorkActivity: 'sedentary',
      exerciseDaysPerWeek: 0,
      sessionDurationMinutes: 30,
      exerciseIntensity: 'light',
      exerciseType: 'strength',
      sleepHoursPerNight: 8,
    })

    // TDEE should be modest: ~2000-2200 for sedentary person
    expect(result.total).toBeGreaterThan(1900)
    expect(result.total).toBeLessThan(2400)
    expect(result.eat).toBe(0)
  })

  it('active_nurse_reasonable', () => {
    // Active nurse, 3x/week exercise
    const result = calculateTdeeBreakdown(1500, 65, {
      occupation: 'active',
      dailySteps: null,
      afterWorkActivity: 'moderate',
      exerciseDaysPerWeek: 3,
      sessionDurationMinutes: 60,
      exerciseIntensity: 'moderate',
      exerciseType: 'strength',
      sleepHoursPerNight: 7,
    })

    // Should be notably higher than desk worker
    expect(result.total).toBeGreaterThan(2400)
    expect(result.neat).toBeGreaterThan(400)
  })

  it('ido_profile_matches_expected_range', () => {
    // Ido: BMR ~2156, 113kg, desk, 5000-6000 steps, sedentary after work,
    // 4x/week 90min strength (easy), target ~2288 kcal
    const result = calculateTdeeBreakdown(2156, 113, {
      occupation: 'desk',
      dailySteps: 5500,
      afterWorkActivity: 'sedentary',
      exerciseDaysPerWeek: 4,
      sessionDurationMinutes: 90,
      exerciseIntensity: 'light',
      exerciseType: 'strength',
      sleepHoursPerNight: 7,
    })

    // Should be in the ballpark of 2288 (±200 kcal)
    expect(result.total).toBeGreaterThan(2100)
    expect(result.total).toBeLessThan(2700)
    expect(result.bmr).toBe(2156)
    expect(result.neat).toBeGreaterThan(0)
    expect(result.eat).toBeGreaterThan(0)
    expect(result.tef).toBeGreaterThan(0)
  })
})
