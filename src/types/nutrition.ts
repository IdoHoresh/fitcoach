/**
 * Nutrition-related type definitions.
 * Covers food items, meal logging, and daily tracking.
 */

import type { DayOfWeek } from './user'

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

/** How accurately a user followed a planned meal */
export type AdherenceLevel = 'accurate' | 'roughly' | 'not_accurate'

/** A recorded meal adherence entry */
export interface MealAdherence {
  readonly id: string
  readonly date: string // YYYY-MM-DD
  readonly mealType: MealType
  readonly level: AdherenceLevel
  readonly createdAt: string
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

// ── Meal Plan Types ─────────────────────────────────────────────────

/** How many meals per day the user wants */
export type MealsPerDay = 3 | 4 | 5 | 6

/** User's nutrition preferences (set during onboarding or settings) */
export interface NutritionPreferences {
  readonly mealsPerDay: MealsPerDay
}

/** A single food item within a planned meal */
export interface PlannedMealItem {
  readonly foodId: string
  readonly servingAmount: number
  readonly servingUnit: ServingUnit
  readonly gramsConsumed: number
  readonly calories: number
  readonly protein: number
  readonly fat: number
  readonly carbs: number
}

/** A single meal within a day plan (e.g., breakfast, lunch) */
export interface PlannedMeal {
  readonly id: string
  readonly mealType: MealType
  readonly orderIndex: number
  readonly timeSlot: string | null
  readonly templateId: string | null
  readonly items: readonly PlannedMealItem[]
  readonly totalCalories: number
  readonly totalProtein: number
  readonly totalFat: number
  readonly totalCarbs: number
}

/** One day within a meal plan */
export interface MealPlanDay {
  readonly dayOfWeek: DayOfWeek
  readonly isTrainingDay: boolean
  readonly meals: readonly PlannedMeal[]
  readonly totalCalories: number
  readonly totalProtein: number
  readonly totalFat: number
  readonly totalCarbs: number
}

/** Status of a meal plan */
export type MealPlanStatus = 'active' | 'archived'

/** A complete weekly meal plan */
export interface MealPlan {
  readonly id: string
  readonly startDate: string
  readonly endDate: string
  readonly status: MealPlanStatus
  readonly targetCalories: number
  readonly targetProtein: number
  readonly targetFat: number
  readonly targetCarbs: number
  readonly mealsPerDay: MealsPerDay
  readonly days: readonly MealPlanDay[]
  readonly createdAt: string
}

// ── Weekly Check-in & Recalibration Types ───────────────────────────

/** What the recalibration decided to do */
export type RecalibrationAction =
  | 'stay_course'
  | 'increase_calories'
  | 'decrease_calories'
  | 'increase_deficit'
  | 'reduce_surplus'
  | 'log_more'
  | 'goal_achieved'

/** How significant the adjustment is */
export type RecalibrationSeverity = 'on_track' | 'minor_adjust' | 'significant_adjust' | 'concern'

/** Output of the weekly recalibration algorithm */
export interface RecalibrationResult {
  readonly weightChange: number
  readonly expectedChange: number
  readonly isOnTrack: boolean
  readonly calorieAdjustment: number
  readonly newTargetCalories: number
  readonly newProteinGrams: number
  readonly newFatGrams: number
  readonly newCarbGrams: number
  readonly action: RecalibrationAction
  readonly severity: RecalibrationSeverity
  readonly coachMessageKey: string
}

/** A weekly check-in record (saved to DB) */
export interface WeeklyCheckIn {
  readonly id: string
  readonly weekStartDate: string
  readonly weekEndDate: string
  readonly avgWeight: number
  readonly prevAvgWeight: number | null
  readonly weightChange: number | null
  readonly expectedChange: number
  readonly calorieAdjustment: number
  readonly newTargetCalories: number
  readonly coachMessage: string
  readonly coachMessageEn: string
  readonly createdAt: string
}

// ── Meal Template Types ─────────────────────────────────────────────

/** Tag for meal template characteristics */
export type MealTemplateTag =
  | 'high_protein'
  | 'balanced'
  | 'high_carb'
  | 'light'
  | 'quick'
  | 'traditional'
  | 'vegetarian'

/** A single item within a meal template */
export interface MealTemplateItem {
  readonly foodId: string
  readonly defaultServingAmount: number
  readonly servingUnit: ServingUnit
  readonly scalable: boolean
}

/** A pre-built meal template used by the plan generator */
export interface MealTemplate {
  readonly id: string
  readonly nameHe: string
  readonly nameEn: string
  readonly mealType: MealType
  readonly tags: readonly MealTemplateTag[]
  readonly items: readonly MealTemplateItem[]
  readonly approxCalories: number
  readonly approxProtein: number
  readonly approxFat: number
  readonly approxCarbs: number
}
