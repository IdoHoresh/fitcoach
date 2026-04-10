import { computeMealTargets } from './meal-targets'
import type { NutritionTargets } from '../types'

const DAILY: NutritionTargets = {
  bmr: 1600,
  tdee: 2200,
  targetCalories: 2000,
  proteinGrams: 160,
  fatGrams: 67,
  carbGrams: 220,
}

describe('computeMealTargets', () => {
  // ── Calorie totals ──────────────────────────────────────────────────

  it('flexible_total_calories_equals_daily_target', () => {
    const meals = computeMealTargets(DAILY, 'flexible', 'fat_loss')
    const total = Object.values(meals).reduce((s, m) => s + m.calories, 0)
    expect(total).toBeCloseTo(2000, -1) // within ±4 kcal
  })

  it.each([
    ['morning', 'fat_loss'],
    ['evening', 'maintenance'],
    ['flexible', 'muscle_gain'],
  ] as const)('all_macros_sum_to_daily_totals (%s/%s)', (wt, goal) => {
    const meals = computeMealTargets(DAILY, wt, goal)
    const vals = Object.values(meals)
    expect(vals.reduce((s, m) => s + m.protein, 0)).toBeCloseTo(160, 0)
    expect(vals.reduce((s, m) => s + m.fat, 0)).toBeCloseTo(67, 0)
    expect(vals.reduce((s, m) => s + m.carbs, 0)).toBeCloseTo(220, 0)
  })

  // ── Morning workout role checks ─────────────────────────────────────

  it('morning_workout_breakfast_fat_below_15_percent', () => {
    const b = computeMealTargets(DAILY, 'morning', 'fat_loss').breakfast
    expect((b.fat * 9) / b.calories).toBeLessThan(0.15)
  })

  it('morning_workout_lunch_protein_boosted_20_percent', () => {
    const evenShare = DAILY.proteinGrams / 4
    const lunch = computeMealTargets(DAILY, 'morning', 'fat_loss').lunch
    expect(lunch.protein).toBeGreaterThan(evenShare * 1.15)
  })

  // ── Evening workout role checks ─────────────────────────────────────

  it('evening_workout_dinner_fat_below_15_percent', () => {
    const d = computeMealTargets(DAILY, 'evening', 'fat_loss').dinner
    expect((d.fat * 9) / d.calories).toBeLessThan(0.15)
  })

  it('evening_workout_snack_protein_boosted', () => {
    const evenShare = DAILY.proteinGrams / 4
    const snack = computeMealTargets(DAILY, 'evening', 'fat_loss').snack
    expect(snack.protein).toBeGreaterThan(evenShare * 1.15)
  })

  // ── Flexible / maintenance split ────────────────────────────────────

  it('flexible_maintenance_uses_equal_25_percent_split', () => {
    const meals = computeMealTargets(DAILY, 'flexible', 'maintenance')
    const target = DAILY.targetCalories * 0.25
    Object.values(meals).forEach((m) => {
      expect(m.calories).toBeCloseTo(target, -1) // ±4 kcal each
    })
  })

  it('muscle_gain_breakfast_gets_25_percent', () => {
    const b = computeMealTargets(DAILY, 'morning', 'muscle_gain').breakfast
    expect(b.calories).toBeCloseTo(DAILY.targetCalories * 0.25, -1)
  })

  // ── Safety checks ───────────────────────────────────────────────────

  it('all_values_are_non_negative', () => {
    const workoutTimes = ['morning', 'evening', 'flexible'] as const
    const goals = ['fat_loss', 'muscle_gain', 'maintenance'] as const
    for (const wt of workoutTimes) {
      for (const g of goals) {
        const meals = computeMealTargets(DAILY, wt, g)
        Object.values(meals).forEach((m) => {
          expect(m.calories).toBeGreaterThanOrEqual(0)
          expect(m.protein).toBeGreaterThanOrEqual(0)
          expect(m.fat).toBeGreaterThanOrEqual(0)
          expect(m.carbs).toBeGreaterThanOrEqual(0)
        })
      }
    }
  })

  it('throws_RangeError_for_zero_calories', () => {
    expect(() =>
      computeMealTargets({ ...DAILY, targetCalories: 0 }, 'flexible', 'fat_loss'),
    ).toThrow(RangeError)
  })

  it('throws_RangeError_for_negative_calories', () => {
    expect(() =>
      computeMealTargets({ ...DAILY, targetCalories: -500 }, 'flexible', 'fat_loss'),
    ).toThrow(RangeError)
  })
})
