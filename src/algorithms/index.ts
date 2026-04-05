/**
 * Algorithm module exports.
 * These are the "brains" of the app — pure logic, no UI, no side effects.
 */

// TDEE & BMR
export {
  calculateBmr,
  calculateBmrMifflin,
  calculateBmrKatchMcArdle,
  calculateTdee,
} from './tdee-calculator';

// Macronutrients
export {
  calculateTargetCalories,
  calculateProteinGrams,
  calculateFatGrams,
  calculateCarbGrams,
  calculateNutritionTargets,
} from './macro-calculator';

// Split selection
export {
  recommendSplitType,
  assignDayTypes,
  createSplitRecommendation,
} from './split-selector';
export type { SplitRecommendation, ScheduleDay } from './split-selector';

// Progressive overload
export {
  getWeightIncrement,
  allSetsAtTopOfRange,
  hasPerfDeclined,
  getProgressionAdvice,
} from './progressive-overload';

// Volume management
export {
  calculateWeeklyVolume,
  calculateAllVolumeTargets,
  assessVolumeStatus,
  shouldDeload,
} from './volume-manager';
export type { WeeklyVolumeTarget } from './volume-manager';
