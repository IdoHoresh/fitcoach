import { computeRedistribution } from './redistribute-deficit'
import type { MealMacroTargetByName, MealName } from './meal-targets'

// ── Fixtures ─────────────────────────────────────────────────────────

const TARGET: MealMacroTargetByName = { calories: 500, protein: 40, fat: 15, carbs: 50 }

const BASE_TARGETS: Record<MealName, MealMacroTargetByName> = {
  breakfast: TARGET,
  lunch: TARGET,
  dinner: TARGET,
  snack: TARGET,
}

/** Logged macros with a 10g protein deficit */
const LOGGED_PROTEIN_DEFICIT = { calories: 460, protein: 30, fat: 15, carbs: 50 }

/** Logged macros with a small deficit (below 5g threshold) */
const LOGGED_SMALL_DEFICIT = { calories: 498, protein: 39, fat: 15, carbs: 50 }

/** Logged macros with a surplus (user ate more than target) */
const LOGGED_SURPLUS = { calories: 600, protein: 50, fat: 20, carbs: 60 }

/** Logged macros with a 60 kcal deficit but < 5g macros */
const LOGGED_CALORIE_DEFICIT = { calories: 440, protein: 38, fat: 14, carbs: 47 }

describe('computeRedistribution', () => {
  it('evenly_splits_deficit_across_remaining_meals', () => {
    // protein deficit = 40 - 30 = 10g, split across 2 remaining meals → +5g each
    const result = computeRedistribution(
      LOGGED_PROTEIN_DEFICIT,
      TARGET,
      ['lunch', 'dinner'],
      BASE_TARGETS,
    )

    expect(result.updatedTargets.lunch.protein).toBeCloseTo(TARGET.protein + 5, 0)
    expect(result.updatedTargets.dinner.protein).toBeCloseTo(TARGET.protein + 5, 0)
    // meals that are already done are not changed
    expect(result.updatedTargets.snack).toEqual(TARGET)
  })

  it('no_redistribution_when_no_remaining_meals', () => {
    const result = computeRedistribution(LOGGED_PROTEIN_DEFICIT, TARGET, [], BASE_TARGETS)

    expect(result.updatedTargets).toEqual(BASE_TARGETS)
    expect(result.toastMacro).toBeNull()
    expect(result.toastMealName).toBeNull()
  })

  it('toast_fires_when_protein_deficit_above_5g', () => {
    const result = computeRedistribution(
      LOGGED_PROTEIN_DEFICIT,
      TARGET,
      ['lunch', 'dinner'],
      BASE_TARGETS,
    )

    expect(result.toastMacro).toBe('protein')
    expect(result.toastAmount).toBeGreaterThan(5)
    expect(result.toastMealName).not.toBeNull()
  })

  it('no_toast_when_all_macros_within_threshold', () => {
    const result = computeRedistribution(
      LOGGED_SMALL_DEFICIT,
      TARGET,
      ['lunch', 'dinner'],
      BASE_TARGETS,
    )

    expect(result.toastMacro).toBeNull()
  })

  it('handles_surplus_reducing_remaining_targets', () => {
    // User ate more than target — remaining meals get reduced targets
    const result = computeRedistribution(LOGGED_SURPLUS, TARGET, ['lunch'], BASE_TARGETS)

    // lunch protein target should be reduced (surplus = -10g → lunch gets 40 - 10 = 30g)
    expect(result.updatedTargets.lunch.protein).toBeLessThan(TARGET.protein)
    expect(result.updatedTargets.lunch.calories).toBeLessThan(TARGET.calories)
  })

  it('calorie_toast_fires_when_diff_above_50_kcal', () => {
    // 60 kcal deficit, but macro diffs are all < 5g → should still fire toast on calories
    const result = computeRedistribution(LOGGED_CALORIE_DEFICIT, TARGET, ['lunch'], BASE_TARGETS)

    // calories deficit = 500 - 440 = 60 → triggers toast
    expect(result.toastMacro).not.toBeNull()
  })

  it('updated_targets_protein_is_non_negative', () => {
    // Even if surplus is massive, resulting targets should not go negative
    const hugeSurplus = { calories: 2000, protein: 200, fat: 100, carbs: 300 }
    const result = computeRedistribution(
      hugeSurplus,
      TARGET,
      ['lunch', 'dinner', 'snack'],
      BASE_TARGETS,
    )

    Object.values(result.updatedTargets).forEach((t) => {
      expect(t.protein).toBeGreaterThanOrEqual(0)
      expect(t.fat).toBeGreaterThanOrEqual(0)
      expect(t.carbs).toBeGreaterThanOrEqual(0)
      expect(t.calories).toBeGreaterThanOrEqual(0)
    })
  })
})
