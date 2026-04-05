/**
 * Nutrition-related type definitions.
 * Covers food items, meal logging, and daily tracking.
 */

/** Food category for browsing and filtering */
export type FoodCategory =
  | 'protein'
  | 'carbs'
  | 'vegetables'
  | 'fruits'
  | 'dairy'
  | 'fats'
  | 'snacks'
  | 'traditional' // Traditional Israeli dishes
  | 'restaurant' // Restaurant chain items
  | 'custom' // User-created foods

/** Meal type for daily structure */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout'

/** Common serving unit */
export type ServingUnit =
  | 'grams'
  | 'ml'
  | 'piece' // 1 pita, 1 egg
  | 'tablespoon'
  | 'teaspoon'
  | 'cup'
  | 'serving' // Restaurant portion

/** Single food item in the database */
export interface FoodItem {
  readonly id: string
  readonly nameHe: string
  readonly nameEn: string
  readonly category: FoodCategory
  readonly isUserCreated: boolean

  // Nutrition per 100g (base unit for calculations)
  readonly caloriesPer100g: number
  readonly proteinPer100g: number
  readonly fatPer100g: number
  readonly carbsPer100g: number
  readonly fiberPer100g: number

  // Common serving sizes for quick-add
  readonly servingSizes: readonly ServingSize[]
}

/** A predefined serving size for a food item */
export interface ServingSize {
  readonly nameHe: string // e.g., "פיתה אחת", "כף"
  readonly nameEn: string
  readonly unit: ServingUnit
  readonly grams: number // How many grams this serving equals
}

/** A logged food entry in a meal */
export interface FoodLogEntry {
  readonly id: string
  readonly foodId: string
  readonly mealType: MealType
  readonly date: string // ISO date
  readonly servingAmount: number // e.g., 1.5
  readonly servingUnit: ServingUnit
  readonly gramsConsumed: number // Calculated: servingAmount × servingSize.grams
  readonly calories: number // Calculated from gramsConsumed
  readonly protein: number
  readonly fat: number
  readonly carbs: number
}

/** Saved meal template — a combination of foods the user eats regularly */
export interface SavedMeal {
  readonly id: string
  readonly nameHe: string
  readonly items: readonly SavedMealItem[]
  readonly totalCalories: number
  readonly totalProtein: number
  readonly totalFat: number
  readonly totalCarbs: number
}

/** Single item within a saved meal */
export interface SavedMealItem {
  readonly foodId: string
  readonly servingAmount: number
  readonly servingUnit: ServingUnit
  readonly gramsConsumed: number
}

/** Daily nutrition summary */
export interface DailyNutritionSummary {
  readonly date: string
  readonly totalCalories: number
  readonly totalProtein: number
  readonly totalFat: number
  readonly totalCarbs: number
  readonly totalFiber: number
  readonly mealCount: number
}
