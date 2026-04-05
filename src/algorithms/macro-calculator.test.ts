import {
  calculateAdjustedWeight,
  calculateTargetCalories,
  calculateProteinGrams,
  calculateFatGrams,
  calculateCarbGrams,
  calculateNutritionTargets,
} from './macro-calculator'

// ── calculateAdjustedWeight ─────────────────────────────────────────

describe('calculateAdjustedWeight', () => {
  // Body fat known → lean mass × 1.1
  it('uses_lean_mass_times_1_1_when_body_fat_known', () => {
    // 80kg at 20% BF → lean mass = 80 × 0.8 = 64 → adjusted = 64 × 1.1 = 70.4
    expect(calculateAdjustedWeight(80, 180, 20)).toBeCloseTo(70.4)
  })

  it('body_fat_0_percent_returns_weight_times_1_1', () => {
    // 80kg at 0% BF → lean mass = 80 → adjusted = 80 × 1.1 = 88
    expect(calculateAdjustedWeight(80, 180, 0)).toBeCloseTo(88)
  })

  it('high_body_fat_yields_much_lower_adjusted_weight', () => {
    // 100kg at 40% BF → lean mass = 60 → adjusted = 60 × 1.1 = 66
    expect(calculateAdjustedWeight(100, 175, 40)).toBeCloseTo(66)
  })

  // BMI ≤ 25 → actual weight
  it('returns_actual_weight_when_bmi_at_or_below_25_no_body_fat', () => {
    // 75kg, 180cm → BMI = 75 / 3.24 = 23.1 → ≤ 25, return actual
    expect(calculateAdjustedWeight(75, 180, null)).toBe(75)
  })

  it('returns_actual_weight_at_bmi_exactly_25', () => {
    // BMI = 25 at 180cm → weight = 25 × 1.8² = 81.0
    const weightAtBmi25 = 25 * 1.8 * 1.8 // 81.0
    expect(calculateAdjustedWeight(weightAtBmi25, 180, null)).toBe(weightAtBmi25)
  })

  // BMI > 25 → ideal + 0.4 × excess
  it('applies_adjustment_formula_when_bmi_above_25', () => {
    // 100kg, 175cm → BMI = 100 / 3.0625 = 32.65 → above 25
    // idealWeight = 25 × 1.75² = 76.5625
    // excess = 100 - 76.5625 = 23.4375
    // adjusted = 76.5625 + 0.4 × 23.4375 = 85.9375
    const result = calculateAdjustedWeight(100, 175, null)
    expect(result).toBeCloseTo(85.9375)
  })

  it('ido_example_189cm_113kg_returns_approximately_98_8', () => {
    // Ido: 189cm, 113kg → BMI = 113 / (1.89²) = 31.6
    // idealWeight = 25 × 1.89² = 25 × 3.5721 = 89.3025
    // excess = 113 - 89.3025 = 23.6975
    // adjusted = 89.3025 + 0.4 × 23.6975 = 98.7815
    const result = calculateAdjustedWeight(113, 189, null)
    expect(result).toBeCloseTo(98.78, 0)
  })

  it('body_fat_known_takes_precedence_over_bmi_check', () => {
    // Even with BMI > 25, body fat path is used when bodyFatPercent is provided
    // 113kg, 189cm, 25% BF → lean = 113 × 0.75 = 84.75 → adjusted = 84.75 × 1.1 = 93.225
    const result = calculateAdjustedWeight(113, 189, 25)
    expect(result).toBeCloseTo(93.225)
  })

  it('lean_person_with_known_body_fat_uses_lean_mass_path', () => {
    // 70kg, 180cm, 12% BF → lean = 70 × 0.88 = 61.6 → adjusted = 61.6 × 1.1 = 67.76
    expect(calculateAdjustedWeight(70, 180, 12)).toBeCloseTo(67.76)
  })
})

// ── calculateTargetCalories ─────────────────────────────────────────

describe('calculateTargetCalories', () => {
  const tdee = 2500

  it('muscle_gain_adds_midpoint_surplus_of_250', () => {
    // midpoint of {200, 300} = 250
    expect(calculateTargetCalories(tdee, 'muscle_gain')).toBe(2750)
  })

  it('fat_loss_subtracts_midpoint_deficit_of_400', () => {
    // midpoint of {-500, -300} = -400
    expect(calculateTargetCalories(tdee, 'fat_loss')).toBe(2100)
  })

  it('maintenance_returns_exact_tdee', () => {
    // midpoint of {0, 0} = 0
    expect(calculateTargetCalories(tdee, 'maintenance')).toBe(2500)
  })

  it('rounds_result_to_nearest_integer', () => {
    // 2501 + 250 = 2751 → already integer, but odd TDEE values should still round
    expect(calculateTargetCalories(2501, 'muscle_gain')).toBe(2751)
  })

  it('works_with_low_tdee', () => {
    expect(calculateTargetCalories(1500, 'fat_loss')).toBe(1100)
  })

  it('works_with_high_tdee', () => {
    expect(calculateTargetCalories(4000, 'muscle_gain')).toBe(4250)
  })
})

// ── calculateProteinGrams ───────────────────────────────────────────

describe('calculateProteinGrams', () => {
  it('muscle_gain_uses_midpoint_1_9_g_per_kg', () => {
    // midpoint of {1.6, 2.2} = 1.9
    // 80kg × 1.9 = 152
    expect(calculateProteinGrams(80, 'muscle_gain')).toBe(152)
  })

  it('fat_loss_uses_midpoint_2_0_g_per_kg', () => {
    // midpoint of {1.8, 2.2} = 2.0
    // 80kg × 2.0 = 160
    expect(calculateProteinGrams(80, 'fat_loss')).toBe(160)
  })

  it('maintenance_uses_midpoint_1_8_g_per_kg', () => {
    // midpoint of {1.6, 2.0} = 1.8
    // 80kg × 1.8 = 144
    expect(calculateProteinGrams(80, 'maintenance')).toBe(144)
  })

  it('higher_weight_produces_more_protein', () => {
    const light = calculateProteinGrams(60, 'muscle_gain')
    const heavy = calculateProteinGrams(100, 'muscle_gain')
    expect(heavy).toBeGreaterThan(light)
  })

  it('rounds_to_nearest_integer', () => {
    // 75kg × 1.9 = 142.5 → rounds to 143 (Math.round)
    expect(calculateProteinGrams(75, 'muscle_gain')).toBe(143)
  })

  it('ido_adjusted_weight_muscle_gain', () => {
    // Ido adjusted weight ≈ 98.78kg, muscle_gain midpoint = 1.9
    // 98.78 × 1.9 = 187.682 → rounds to 188
    expect(calculateProteinGrams(98.78, 'muscle_gain')).toBe(188)
  })
})

// ── calculateFatGrams ───────────────────────────────────────────────

describe('calculateFatGrams', () => {
  it('fat_loss_uses_midpoint_0_8_g_per_kg', () => {
    // midpoint of {0.7, 0.9} = 0.8
    // 80kg × 0.8 = 64
    expect(calculateFatGrams(80, 'fat_loss')).toBe(64)
  })

  it('muscle_gain_uses_midpoint_1_0_g_per_kg', () => {
    // midpoint of {0.8, 1.2} = 1.0
    // 80kg × 1.0 = 80
    expect(calculateFatGrams(80, 'muscle_gain')).toBe(80)
  })

  it('maintenance_uses_midpoint_0_9_g_per_kg', () => {
    // midpoint of {0.8, 1.0} = 0.9
    // 80kg × 0.9 = 72
    expect(calculateFatGrams(80, 'maintenance')).toBe(72)
  })

  it('higher_weight_produces_more_fat', () => {
    const light = calculateFatGrams(60, 'fat_loss')
    const heavy = calculateFatGrams(100, 'fat_loss')
    expect(heavy).toBeGreaterThan(light)
  })

  it('rounds_to_nearest_integer', () => {
    // 75kg × 0.8 = 60.0 → exact, try 77kg × 0.8 = 61.6 → rounds to 62
    expect(calculateFatGrams(77, 'fat_loss')).toBe(62)
  })

  it('fat_loss_has_lowest_fat_of_all_goals', () => {
    const weight = 80
    const fatLoss = calculateFatGrams(weight, 'fat_loss')
    const maintenance = calculateFatGrams(weight, 'maintenance')
    const muscleGain = calculateFatGrams(weight, 'muscle_gain')
    expect(fatLoss).toBeLessThan(maintenance)
    expect(maintenance).toBeLessThan(muscleGain)
  })
})

// ── calculateCarbGrams ──────────────────────────────────────────────

describe('calculateCarbGrams', () => {
  it('fills_remaining_calories_after_protein_and_fat', () => {
    // 2500 cal - (150g × 4) - (80g × 9) = 2500 - 600 - 720 = 1180 → 1180/4 = 295
    expect(calculateCarbGrams(2500, 150, 80)).toBe(295)
  })

  it('returns_zero_when_protein_and_fat_exceed_calories', () => {
    // 1000 cal - (200g × 4) - (100g × 9) = 1000 - 800 - 900 = -700 → clamped to 0
    expect(calculateCarbGrams(1000, 200, 100)).toBe(0)
  })

  it('returns_zero_when_protein_and_fat_exactly_equal_calories', () => {
    // proteinCal + fatCal = 100×4 + 100×9 = 400+900 = 1300
    expect(calculateCarbGrams(1300, 100, 100)).toBe(0)
  })

  it('rounds_to_nearest_integer', () => {
    // 2000 - (150×4) - (70×9) = 2000 - 600 - 630 = 770 → 770/4 = 192.5 → 193
    expect(calculateCarbGrams(2000, 150, 70)).toBe(193)
  })

  it('never_returns_negative', () => {
    expect(calculateCarbGrams(500, 200, 200)).toBe(0)
  })

  it('high_calorie_surplus_gives_generous_carbs', () => {
    // 4000 - (180×4) - (100×9) = 4000 - 720 - 900 = 2380 → 2380/4 = 595
    expect(calculateCarbGrams(4000, 180, 100)).toBe(595)
  })
})

// ── calculateNutritionTargets (integration) ─────────────────────────

describe('calculateNutritionTargets', () => {
  it('returns_all_expected_fields', () => {
    const result = calculateNutritionTargets(1800, 2500, 80, 180, null, 'maintenance')
    expect(result).toHaveProperty('bmr')
    expect(result).toHaveProperty('tdee')
    expect(result).toHaveProperty('targetCalories')
    expect(result).toHaveProperty('proteinGrams')
    expect(result).toHaveProperty('fatGrams')
    expect(result).toHaveProperty('carbGrams')
  })

  it('passes_through_bmr_and_tdee_unchanged', () => {
    const result = calculateNutritionTargets(1800, 2500, 80, 180, null, 'maintenance')
    expect(result.bmr).toBe(1800)
    expect(result.tdee).toBe(2500)
  })

  it('maintenance_healthy_bmi_produces_reasonable_totals', () => {
    // 75kg, 180cm, null BF, maintenance
    // adjustedWeight = 75 (BMI ~23.1, ≤ 25)
    // targetCalories = 2500 + 0 = 2500
    // protein = 75 × 1.8 = 135
    // fat = 75 × 0.9 = 68 (rounded)
    // carbs = (2500 - 135×4 - 68×9) / 4 = (2500 - 540 - 612) / 4 = 1348/4 = 337
    const result = calculateNutritionTargets(1800, 2500, 75, 180, null, 'maintenance')
    expect(result.targetCalories).toBe(2500)
    expect(result.proteinGrams).toBe(135)
    expect(result.fatGrams).toBe(68)
    expect(result.carbGrams).toBe(337)
  })

  it('muscle_gain_has_higher_calories_than_maintenance', () => {
    const gain = calculateNutritionTargets(1800, 2500, 80, 180, null, 'muscle_gain')
    const maint = calculateNutritionTargets(1800, 2500, 80, 180, null, 'maintenance')
    expect(gain.targetCalories).toBeGreaterThan(maint.targetCalories)
  })

  it('fat_loss_has_lower_calories_than_maintenance', () => {
    const loss = calculateNutritionTargets(1800, 2500, 80, 180, null, 'fat_loss')
    const maint = calculateNutritionTargets(1800, 2500, 80, 180, null, 'maintenance')
    expect(loss.targetCalories).toBeLessThan(maint.targetCalories)
  })

  it('overweight_person_gets_less_protein_than_raw_weight_would_give', () => {
    // 113kg person at 189cm — adjusted weight is ~98.78, not 113
    const result = calculateNutritionTargets(2100, 3000, 113, 189, null, 'muscle_gain')
    // If raw weight were used: 113 × 1.9 = 214.7 → 215g
    // With adjusted weight (~98.78): 98.78 × 1.9 = 187.7 → 188g
    expect(result.proteinGrams).toBeLessThan(215)
  })

  it('body_fat_known_affects_protein_calculation', () => {
    // Same person with/without body fat → different adjusted weight → different protein
    const withBf = calculateNutritionTargets(2100, 3000, 100, 180, 25, 'muscle_gain')
    const withoutBf = calculateNutritionTargets(2100, 3000, 100, 180, null, 'muscle_gain')
    // With BF: adjusted = 100 × 0.75 × 1.1 = 82.5 → protein = 82.5 × 1.9 = 157
    // Without BF: BMI = 30.9 → adjusted ≈ 90.9 → protein = 90.9 × 1.9 = 173
    expect(withBf.proteinGrams).not.toBe(withoutBf.proteinGrams)
  })

  it('macros_calories_roughly_equal_target_calories', () => {
    const result = calculateNutritionTargets(1800, 2500, 80, 180, null, 'muscle_gain')
    const macroCalories = result.proteinGrams * 4 + result.carbGrams * 4 + result.fatGrams * 9
    // Should be close to target — rounding can cause small difference
    expect(Math.abs(macroCalories - result.targetCalories)).toBeLessThan(10)
  })

  it('ido_fat_loss_scenario', () => {
    // Ido: 113kg, 189cm, no BF known, fat_loss
    // targetCalories = 3000 - 400 = 2600
    // adjustedWeight ≈ 98.78 → protein = 98.78 × 2.0 = 197.56 → 198
    // fat = 113 × 0.8 = 90.4 → 90
    // carbs = (2600 - 198×4 - 90×9) / 4 = (2600 - 792 - 810) / 4 = 998/4 = 249.5 → 250
    const result = calculateNutritionTargets(2100, 3000, 113, 189, null, 'fat_loss')
    expect(result.targetCalories).toBe(2600)
    expect(result.proteinGrams).toBe(198)
    expect(result.fatGrams).toBe(90)
    expect(result.carbGrams).toBe(250)
  })

  // Carb floor protection tests
  it('carb_floor_protection_reduces_fat_when_carbs_below_100', () => {
    // Craft a scenario where initial carbs < 100g
    // Use a light person on aggressive fat loss with low TDEE
    // TDEE = 1600, fat_loss → target = 1600 - 400 = 1200
    // 55kg, 160cm, null BF → BMI = 55/(1.6²) = 21.5 → adjusted = 55
    // protein = 55 × 2.0 = 110
    // initial fat = 55 × 0.8 = 44
    // initial carbs = (1200 - 110×4 - 44×9) / 4 = (1200 - 440 - 396) / 4 = 364/4 = 91
    // 91 < 100 → carb floor protection kicks in
    // hardFloorFat = 55 × 0.5 = 28 (rounded)
    // Reduce fat from 44 toward 28 until carbs ≥ 100 or fat = hardFloor
    const result = calculateNutritionTargets(1400, 1600, 55, 160, null, 'fat_loss')
    // Carbs should be at or above 100 (or fat is at hard floor)
    const hardFloorFat = Math.round(55 * 0.5) // 28
    if (result.fatGrams > hardFloorFat) {
      expect(result.carbGrams).toBeGreaterThanOrEqual(100)
    }
  })

  it('carb_floor_protection_does_not_push_fat_below_hard_floor', () => {
    // Very aggressive scenario: extremely low calories
    // 50kg, 160cm, null BF, fat_loss
    // target = 1400 - 400 = 1000
    // adjustedWeight = 50 (BMI 19.5)
    // protein = 50 × 2.0 = 100
    // fat = 50 × 0.8 = 40
    // carbs = (1000 - 400 - 360) / 4 = 240/4 = 60 → below 100
    // hardFloor = 50 × 0.5 = 25
    // Reduce fat from 40 → each g gives 9/4 = 2.25 more carb cals
    // Need 40 more carb grams = 160 cal from fat = 160/9 ≈ 18g fat reduction
    // 40 - 18 = 22, but hard floor is 25, so fat stops at 25
    const result = calculateNutritionTargets(1200, 1400, 50, 160, null, 'fat_loss')
    const hardFloorFat = Math.round(50 * 0.5) // 25
    expect(result.fatGrams).toBeGreaterThanOrEqual(hardFloorFat)
  })

  it('no_carb_floor_issue_with_high_calorie_surplus', () => {
    // Muscle gain with plenty of calories — carbs should be well above 100
    const result = calculateNutritionTargets(2000, 3000, 80, 180, null, 'muscle_gain')
    expect(result.carbGrams).toBeGreaterThan(100)
  })

  it('all_macro_grams_are_non_negative', () => {
    const goals: ('muscle_gain' | 'fat_loss' | 'maintenance')[] = [
      'muscle_gain',
      'fat_loss',
      'maintenance',
    ]
    for (const goal of goals) {
      const result = calculateNutritionTargets(1800, 2500, 80, 180, null, goal)
      expect(result.proteinGrams).toBeGreaterThanOrEqual(0)
      expect(result.fatGrams).toBeGreaterThanOrEqual(0)
      expect(result.carbGrams).toBeGreaterThanOrEqual(0)
    }
  })

  it('fat_loss_protein_higher_per_kg_than_maintenance', () => {
    // Fat loss uses 2.0 g/kg vs maintenance 1.8 g/kg on same adjusted weight
    const loss = calculateNutritionTargets(1800, 2500, 75, 180, null, 'fat_loss')
    const maint = calculateNutritionTargets(1800, 2500, 75, 180, null, 'maintenance')
    // Both use same adjusted weight (BMI ≤ 25 → 75kg)
    // loss protein = 75 × 2.0 = 150, maint protein = 75 × 1.8 = 135
    expect(loss.proteinGrams).toBeGreaterThan(maint.proteinGrams)
  })
})
