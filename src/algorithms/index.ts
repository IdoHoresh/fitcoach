/**
 * Algorithm module exports.
 * These are the "brains" of the app — pure logic, no UI, no side effects.
 */

// TDEE & BMR (component-based)
export {
  calculateBmr,
  calculateBmrMifflin,
  calculateBmrKatchMcArdle,
  calculateOccupationNeat,
  calculateStepNeat,
  calculateLifestyleNeat,
  estimateDailySteps,
  calculateTotalNeat,
  calculateEat,
  calculateTef,
  calculateTdeeBreakdown,
} from './tdee-calculator'

// Macronutrients
export {
  calculateTargetCalories,
  calculateProteinGrams,
  calculateFatGrams,
  calculateCarbGrams,
  calculateNutritionTargets,
} from './macro-calculator'

// Split selection
export { recommendSplitType, assignDayTypes, createSplitRecommendation } from './split-selector'
export type { SplitRecommendation, ScheduleDay } from './split-selector'

// Progressive overload
export {
  getWeightIncrement,
  allSetsAtTopOfRange,
  hasPerfDeclined,
  getProgressionAdvice,
} from './progressive-overload'

// Volume management
export {
  calculateWeeklyVolume,
  calculateAllVolumeTargets,
  assessVolumeStatus,
  shouldDeload,
} from './volume-manager'
export type { WeeklyVolumeTarget } from './volume-manager'

// Macro distribution across meals
export { distributeMacros, getMealTypesForCount } from './macro-distributor'
export type { MealMacroTarget } from './macro-distributor'

// Meal plan generation
export {
  calculateScaleFactor,
  calculateTemplateMacros,
  generateWeeklyMealPlan,
  isWithinTolerance,
  scaleTemplate,
  selectTemplate,
} from './meal-plan-generator'

// Per-meal macro targeting
export { computeMealTargets } from './meal-targets'
export type { MealMacroTargetByName, MealName } from './meal-targets'

// Meal generation
export { generateMeal } from './generate-meal'
export type { GeneratedMealItem } from './generate-meal'

// Deficit redistribution
export { computeRedistribution } from './redistribute-deficit'
export type { RedistributionResult, LoggedMacros, ToastMacro } from './redistribute-deficit'

// Streak calculation
export { calculateStreak } from './streak'

// Weekly recalibration
export {
  calculateCalorieAdjustment,
  calculateWeightTrend,
  determineAction,
  determineSeverity,
  getCoachMessageKey,
  recalibrate,
} from './weekly-recalibration'
