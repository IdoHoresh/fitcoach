import { generateMeal } from './generate-meal'
import type { FoodItem } from '../types'
import type { MealMacroTargetByName } from './meal-targets'

// ── Minimal mock foods ───────────────────────────────────────────────

function mockFood(
  id: string,
  category: FoodItem['category'],
  protein: number,
  fat: number,
  carbs: number,
): FoodItem {
  const cal = protein * 4 + fat * 9 + carbs * 4
  return {
    id,
    nameHe: id,
    nameEn: id,
    category,
    isUserCreated: false,
    caloriesPer100g: cal,
    proteinPer100g: protein,
    fatPer100g: fat,
    carbsPer100g: carbs,
    fiberPer100g: 0,
    servingSizes: [],
  }
}

// Protein foods: chicken (31g protein/100g), eggs (13g/100g), cottage (11g/100g — dairy)
const CHICKEN = mockFood('chicken', 'protein', 31, 3.6, 0)
const EGGS = mockFood('eggs', 'protein', 13, 11, 1)
const COTTAGE = mockFood('cottage', 'dairy', 11, 4, 3)

// Carb foods: rice (3g protein, 0.3g fat, 28g carbs), bread, oats
const RICE = mockFood('rice', 'carbs', 3, 0.3, 28)
const BREAD = mockFood('bread', 'carbs', 7, 1.5, 48)
const OATS = mockFood('oats', 'carbs', 5, 3, 55) // uses 'carbs' but oats also work as traditional

// Fat food: avocado (2g protein, 15g fat, 9g carbs)
const AVOCADO = mockFood('avocado', 'fats', 2, 15, 9)

const FOOD_MAP: ReadonlyMap<string, FoodItem> = new Map([
  [CHICKEN.id, CHICKEN],
  [EGGS.id, EGGS],
  [COTTAGE.id, COTTAGE],
  [RICE.id, RICE],
  [BREAD.id, BREAD],
  [OATS.id, OATS],
  [AVOCADO.id, AVOCADO],
])

const TARGET: MealMacroTargetByName = {
  calories: 500,
  protein: 40,
  fat: 15,
  carbs: 50,
}

describe('generateMeal', () => {
  it('returns_2_or_3_items', () => {
    const items = generateMeal(TARGET, FOOD_MAP)
    expect(items.length).toBeGreaterThanOrEqual(2)
    expect(items.length).toBeLessThanOrEqual(3)
  })

  it('first_item_is_protein_food', () => {
    const items = generateMeal(TARGET, FOOD_MAP)
    expect(['protein', 'dairy']).toContain(items[0].food.category)
  })

  it('second_item_is_proper_meal_carb_food', () => {
    const items = generateMeal(TARGET, FOOD_MAP)
    const mealCarbCategories: FoodItem['category'][] = ['carbs', 'traditional']
    expect(mealCarbCategories).toContain(items[1].food.category)
  })

  it('total_calories_do_not_exceed_target_by_more_than_15_percent', () => {
    for (let i = 0; i < 30; i++) {
      const items = generateMeal(TARGET, FOOD_MAP)
      const totalCal = items.reduce(
        (sum, item) => sum + (item.grams / 100) * item.food.caloriesPer100g,
        0,
      )
      expect(totalCal).toBeLessThanOrEqual(TARGET.calories * 1.15)
    }
  })

  it('grams_are_positive', () => {
    const items = generateMeal(TARGET, FOOD_MAP)
    items.forEach((item) => expect(item.grams).toBeGreaterThan(0))
  })

  it('omits_fat_item_when_fat_already_covered', () => {
    // protein + carb foods already contribute fat, so a target fat of 2g
    // means remaining fat after step 1+2 will be ≤ 5g → no fat food added
    const lowFatTarget: MealMacroTargetByName = { ...TARGET, fat: 2 }
    const items = generateMeal(lowFatTarget, FOOD_MAP)
    expect(items.length).toBe(2)
  })

  it('regenerate_picks_different_combination', () => {
    const first = generateMeal(TARGET, FOOD_MAP)
    const excludeIds = new Set(first.map((i) => i.food.id))
    const second = generateMeal(TARGET, FOOD_MAP, excludeIds)
    // At least one food should differ (or fallback returns same pool if all excluded)
    const firstIds = new Set(first.map((i) => i.food.id))
    const secondIds = new Set(second.map((i) => i.food.id))
    const overlap = [...firstIds].filter((id) => secondIds.has(id))
    // When there are enough alternatives, overlap should be less than total
    expect(overlap.length).toBeLessThan(first.length)
  })

  it('falls_back_to_full_pool_when_all_excluded', () => {
    const allIds = new Set([...FOOD_MAP.keys()])
    expect(() => generateMeal(TARGET, FOOD_MAP, allIds)).not.toThrow()
    const items = generateMeal(TARGET, FOOD_MAP, allIds)
    expect(items.length).toBeGreaterThanOrEqual(2)
  })
})
