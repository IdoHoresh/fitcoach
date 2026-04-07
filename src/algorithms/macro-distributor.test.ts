/**
 * Macro Distributor — Tests.
 * Verifies per-meal macro distribution with even protein and training-day carb shift.
 */

import type { MealsPerDay } from '../types'
import { CALORIES_PER_GRAM, MEAL_CALORIE_DISTRIBUTION } from '../data/constants'
import { distributeMacros, getMealTypesForCount, type MealMacroTarget } from './macro-distributor'

// ── Helper ──────────────────────────────────────────────────────────

/** Sum a numeric field across all meals */
function sumField(meals: MealMacroTarget[], field: keyof MealMacroTarget): number {
  return meals.reduce((sum, m) => sum + (m[field] as number), 0)
}

// ── getMealTypesForCount ────────────────────────────────────────────

describe('getMealTypesForCount', () => {
  it('returns 3 meal types for 3 meals/day', () => {
    const types = getMealTypesForCount(3)
    expect(types).toEqual(['breakfast', 'lunch', 'dinner'])
  })

  it('returns 4 meal types for 4 meals/day', () => {
    const types = getMealTypesForCount(4)
    expect(types).toEqual(['breakfast', 'lunch', 'dinner', 'snack'])
  })

  it('returns 5 meal types for 5 meals/day', () => {
    const types = getMealTypesForCount(5)
    expect(types).toEqual(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout'])
  })

  it('returns 6 meal types for 6 meals/day', () => {
    const types = getMealTypesForCount(6)
    expect(types).toEqual(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'])
  })
})

// ── distributeMacros — protein distribution ─────────────────────────

describe('distributeMacros — protein distribution', () => {
  it('distributes protein evenly across 3 meals', () => {
    const meals = distributeMacros(150, 80, 200, 3, false)
    const proteins = meals.map((m) => m.protein)
    // Each meal should get 50g
    expect(proteins).toEqual([50, 50, 50])
  })

  it('handles non-evenly-divisible protein (200g / 3 meals)', () => {
    const meals = distributeMacros(200, 90, 250, 3, false)
    const proteins = meals.map((m) => m.protein)
    // 200 / 3 = 66.67 → two meals get 67, one gets 66
    expect(proteins.reduce((a, b) => a + b, 0)).toBe(200)
    expect(Math.max(...proteins) - Math.min(...proteins)).toBeLessThanOrEqual(1)
  })

  it('distributes protein evenly across 5 meals', () => {
    const meals = distributeMacros(200, 90, 250, 5, false)
    const proteins = meals.map((m) => m.protein)
    expect(proteins.reduce((a, b) => a + b, 0)).toBe(200)
    // 200 / 5 = 40 exactly
    expect(proteins).toEqual([40, 40, 40, 40, 40])
  })

  it('sum of protein always equals input for all meal counts', () => {
    const counts: MealsPerDay[] = [3, 4, 5, 6]
    for (const count of counts) {
      const meals = distributeMacros(198, 90, 172, count, false)
      expect(sumField(meals, 'protein')).toBe(198)
    }
  })
})

// ── distributeMacros — fat distribution ─────────────────────────────

describe('distributeMacros — fat distribution', () => {
  it('distributes fat proportionally to calorie distribution for 3 meals', () => {
    const meals = distributeMacros(150, 90, 200, 3, false)
    const dist = MEAL_CALORIE_DISTRIBUTION[3]
    // Breakfast should get ~30% of fat (27g), lunch/dinner ~35% each (31-32g)
    expect(meals[0].fat).toBe(Math.round(90 * dist.breakfast))
    expect(meals[1].fat).toBe(Math.round(90 * dist.lunch))
  })

  it('sum of fat always equals input for all meal counts', () => {
    const counts: MealsPerDay[] = [3, 4, 5, 6]
    for (const count of counts) {
      const meals = distributeMacros(198, 90, 172, count, false)
      expect(sumField(meals, 'fat')).toBe(90)
    }
  })
})

// ── distributeMacros — carb distribution (rest day) ─────────────────

describe('distributeMacros — carb distribution (rest day)', () => {
  it('distributes carbs proportionally on rest day', () => {
    const meals = distributeMacros(150, 80, 200, 3, false)
    const dist = MEAL_CALORIE_DISTRIBUTION[3]
    expect(meals[0].carbs).toBe(Math.round(200 * dist.breakfast))
  })

  it('sum of carbs always equals input on rest day', () => {
    const counts: MealsPerDay[] = [3, 4, 5, 6]
    for (const count of counts) {
      const meals = distributeMacros(198, 90, 172, count, false)
      expect(sumField(meals, 'carbs')).toBe(172)
    }
  })
})

// ── distributeMacros — training day carb shift ──────────────────────

describe('distributeMacros — training day carb shift', () => {
  it('does NOT shift carbs for 3 meals (no workout slots)', () => {
    const restMeals = distributeMacros(150, 80, 200, 3, false)
    const trainMeals = distributeMacros(150, 80, 200, 3, true)
    // Carb distribution should be identical
    expect(trainMeals.map((m) => m.carbs)).toEqual(restMeals.map((m) => m.carbs))
  })

  it('does NOT shift carbs for 4 meals (no workout slots)', () => {
    const restMeals = distributeMacros(150, 80, 200, 4, false)
    const trainMeals = distributeMacros(150, 80, 200, 4, true)
    expect(trainMeals.map((m) => m.carbs)).toEqual(restMeals.map((m) => m.carbs))
  })

  it('shifts 15% of carbs to pre_workout for 5 meals', () => {
    const restMeals = distributeMacros(200, 90, 250, 5, false)
    const trainMeals = distributeMacros(200, 90, 250, 5, true)

    const preWorkoutRest = restMeals.find((m) => m.mealType === 'pre_workout')!
    const preWorkoutTrain = trainMeals.find((m) => m.mealType === 'pre_workout')!

    // Pre-workout should have MORE carbs on training day
    expect(preWorkoutTrain.carbs).toBeGreaterThan(preWorkoutRest.carbs)

    // Total carbs should still equal 250
    expect(sumField(trainMeals, 'carbs')).toBe(250)
  })

  it('shifts 15% of carbs to pre + post workout for 6 meals', () => {
    const restMeals = distributeMacros(200, 90, 250, 6, false)
    const trainMeals = distributeMacros(200, 90, 250, 6, true)

    const preRest = restMeals.find((m) => m.mealType === 'pre_workout')!
    const preTrain = trainMeals.find((m) => m.mealType === 'pre_workout')!
    const postRest = restMeals.find((m) => m.mealType === 'post_workout')!
    const postTrain = trainMeals.find((m) => m.mealType === 'post_workout')!

    // Both workout meals should have more carbs on training day
    expect(preTrain.carbs).toBeGreaterThan(preRest.carbs)
    expect(postTrain.carbs).toBeGreaterThan(postRest.carbs)

    // Total carbs unchanged
    expect(sumField(trainMeals, 'carbs')).toBe(250)
  })

  it('does not change fat or protein on training day', () => {
    const restMeals = distributeMacros(200, 90, 250, 5, false)
    const trainMeals = distributeMacros(200, 90, 250, 5, true)

    expect(sumField(trainMeals, 'protein')).toBe(sumField(restMeals, 'protein'))
    expect(sumField(trainMeals, 'fat')).toBe(sumField(restMeals, 'fat'))
  })
})

// ── distributeMacros — calorie calculation ──────────────────────────

describe('distributeMacros — calorie calculation', () => {
  it('per-meal calories = protein*4 + carbs*4 + fat*9', () => {
    const meals = distributeMacros(198, 90, 172, 4, false)
    for (const meal of meals) {
      const expected =
        meal.protein * CALORIES_PER_GRAM.PROTEIN +
        meal.carbs * CALORIES_PER_GRAM.CARBS +
        meal.fat * CALORIES_PER_GRAM.FAT
      expect(meal.calories).toBe(expected)
    }
  })

  it('returns correct number of meals', () => {
    const counts: MealsPerDay[] = [3, 4, 5, 6]
    for (const count of counts) {
      const meals = distributeMacros(198, 90, 172, count, false)
      expect(meals).toHaveLength(count)
    }
  })

  it('each meal has the correct mealType', () => {
    const meals = distributeMacros(198, 90, 172, 5, false)
    const types = meals.map((m) => m.mealType)
    expect(types).toEqual(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout'])
  })
})

// ── distributeMacros — Ido's real stats ─────────────────────────────

describe('distributeMacros — real-world validation', () => {
  it("distributes Ido's macros (2288 kcal, 198P/90F/172C) across 4 meals", () => {
    const meals = distributeMacros(198, 90, 172, 4, false)

    // 198/4 = 49.5 → three meals get 50, last gets 48 (rounding remainder)
    // Max spread should be ≤2g (even distribution guarantee)
    const proteins = meals.map((m) => m.protein)
    expect(Math.max(...proteins) - Math.min(...proteins)).toBeLessThanOrEqual(2)

    // Totals must match exactly
    expect(sumField(meals, 'protein')).toBe(198)
    expect(sumField(meals, 'fat')).toBe(90)
    expect(sumField(meals, 'carbs')).toBe(172)
  })
})
