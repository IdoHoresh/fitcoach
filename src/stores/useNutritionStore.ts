/**
 * Nutrition Store.
 *
 * Connects nutrition algorithms, food data, and repositories to the UI.
 *
 * Flow:
 *   Generate Plan → macros calculated from profile → weekly meal plan created
 *   Log Food → entry persisted → daily summary refreshed
 *   Weekly Check-in → weight trend analyzed → calories recalibrated
 *
 * Design decisions:
 * - Cross-store access: reads profile/TDEE from useUserStore
 * - Saved meals supported from day one (common Israeli meals)
 * - Weight tracking lives here (tightly coupled to recalibration)
 * - logSavedMeal computes per-item macros from FOOD_MAP at log time
 */

import { create } from 'zustand'
import type {
  AdherenceLevel,
  BodyMeasurement,
  DailyNutritionSummary,
  DayOfWeek,
  FoodLogEntry,
  MealAdherence,
  MealPlan,
  MealPlanDay,
  MealsPerDay,
  MealType,
  RecalibrationResult,
  SavedMeal,
  WeeklyCheckIn,
} from '../types'
import { generateWeeklyMealPlan } from '../algorithms/meal-plan-generator'
import { calculateNutritionTargets } from '../algorithms/macro-calculator'
import { recalibrate } from '../algorithms/weekly-recalibration'
import { computeMealTargets } from '../algorithms/meal-targets'
import type { MealMacroTargetByName, MealName } from '../algorithms/meal-targets'
import { generateMeal } from '../algorithms/generate-meal'
import { computeRedistribution } from '../algorithms/redistribute-deficit'
import type { ToastMacro } from '../algorithms/redistribute-deficit'
import { FOOD_MAP } from '../data/foods'
import {
  foodLogRepository,
  mealAdherenceRepository,
  mealPlanRepository,
  savedMealRepository,
  weeklyCheckInRepository,
  measurementRepository,
  todayISO,
} from '../db'
import { useUserStore } from './useUserStore'
import { he, en } from '../i18n'
import {
  validateInput,
  foodLogEntrySchema,
  bodyMeasurementSchema,
  mealAdherenceSchema,
} from '../security/validation'

// ── Store Interface ───────────────────────────────────────────────

interface NutritionStore {
  // State
  activePlan: MealPlan | null
  todaysLog: FoodLogEntry[]
  selectedDateLog: FoodLogEntry[] // food log for the date selected in NutritionDashboard
  dailySummary: DailyNutritionSummary | null
  savedMeals: SavedMeal[]
  recentCheckIns: WeeklyCheckIn[]
  latestRecalibration: RecalibrationResult | null
  weightLog: BodyMeasurement[]
  dateAdherence: MealAdherence[] // adherence records for selectedDate
  mealTargets: Record<MealName, MealMacroTargetByName> | null
  lastGeneratedFoodIds: Partial<Record<MealType, ReadonlySet<string>>>
  lastGeneratedEntryIds: Partial<Record<MealType, string[]>>
  redistributionToast: { macro: NonNullable<ToastMacro>; amount: number; mealName: MealName } | null
  isLoading: boolean
  error: string | null

  // Meal Plan
  generateMealPlan: (mealsPerDay: MealsPerDay) => Promise<void>
  regenerateMealPlan: () => Promise<void>
  loadActivePlan: () => Promise<void>

  // Food Logging
  logFood: (entry: Omit<FoodLogEntry, 'id'>) => Promise<void>
  removeFood: (entryId: string) => Promise<void>
  loadTodaysLog: () => Promise<void>
  loadLogForDate: (date: string) => Promise<void>

  // Meal Adherence
  setMealAdherence: (date: string, mealType: MealType, level: AdherenceLevel) => Promise<void>
  loadAdherenceForDate: (date: string) => Promise<void>

  // Saved Meals
  saveMeal: (meal: Omit<SavedMeal, 'id'>) => Promise<void>
  logSavedMeal: (savedMealId: string, mealType: MealType, date: string) => Promise<void>
  loadSavedMeals: () => Promise<void>
  deleteSavedMeal: (mealId: string) => Promise<void>

  // Weight
  logWeight: (weightKg: number, date: string) => Promise<void>
  loadWeightLog: (startDate: string, endDate: string) => Promise<void>

  // Weekly Check-In
  runWeeklyCheckIn: () => Promise<void>
  loadRecentCheckIns: () => Promise<void>

  // Meal Targets
  refreshMealTargets: () => void
  clearRedistributionToast: () => void

  // Meal Generation
  generateMealForSlot: (mealType: MealType, date: string) => Promise<void>
  regenerateMealForSlot: (mealType: MealType, date: string) => Promise<void>

  // Computed
  getRemainingMacros: () => {
    calories: number
    protein: number
    fat: number
    carbs: number
  } | null
  getMealPlanForToday: () => MealPlanDay | null
}

// ── Constants ─────────────────────────────────────────────────────

const DEFAULT_MEALS_PER_DAY = 4 as MealsPerDay
const RECENT_CHECKINS_LIMIT = 10

// ── Helpers ───────────────────────────────────────────────────────

/** Resolve a dot-path key like 'recalibration.stay_course' against a translation object. */
function resolveI18nKey(translations: Record<string, unknown>, key: string): string {
  const parts = key.split('.')
  let current: unknown = translations
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return key
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : key
}

/** Non-overlapping 7-day windows ending before today.
 *  weeksAgo=0 → yesterday to 7 days ago (most recent full week of data)
 *  weeksAgo=1 → 8 days ago to 14 days ago (week before that)
 */
function weekBounds(weeksAgo: number): { start: string; end: string } {
  const today = new Date(todayISO())
  const end = new Date(today)
  end.setDate(end.getDate() - 1 - weeksAgo * 7)
  const start = new Date(end)
  start.setDate(start.getDate() - 6)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

// ── Store ─────────────────────────────────────────────────────────

export const useNutritionStore = create<NutritionStore>((set, get) => ({
  // Initial state
  activePlan: null,
  todaysLog: [],
  selectedDateLog: [],
  dailySummary: null,
  savedMeals: [],
  recentCheckIns: [],
  latestRecalibration: null,
  weightLog: [],
  dateAdherence: [],
  mealTargets: null,
  lastGeneratedFoodIds: {},
  lastGeneratedEntryIds: {},
  redistributionToast: null,
  isLoading: false,
  error: null,

  // ── Meal Plan ─────────────────────────────────────────────────

  generateMealPlan: async (mealsPerDay: MealsPerDay) => {
    const { profile, tdeeBreakdown } = useUserStore.getState()
    if (!profile || !tdeeBreakdown) {
      set({ error: 'No user profile found. Complete onboarding first.' })
      return
    }

    set({ isLoading: true, error: null })

    try {
      const targets = calculateNutritionTargets(
        tdeeBreakdown.bmr,
        tdeeBreakdown.total,
        profile.weightKg,
        profile.heightCm,
        profile.bodyFatPercent,
        profile.goal,
      )

      const days = generateWeeklyMealPlan({
        proteinGrams: targets.proteinGrams,
        fatGrams: targets.fatGrams,
        carbGrams: targets.carbGrams,
        mealsPerDay,
        trainingDays: [...profile.trainingDays],
      })

      const today = todayISO()
      const endDate = new Date(today)
      endDate.setDate(endDate.getDate() + 6)

      const plan = await mealPlanRepository.savePlan({
        startDate: today,
        endDate: endDate.toISOString().slice(0, 10),
        status: 'active',
        targetCalories: targets.targetCalories,
        targetProtein: targets.proteinGrams,
        targetFat: targets.fatGrams,
        targetCarbs: targets.carbGrams,
        mealsPerDay,
        days,
      })

      set({ activePlan: plan })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to generate meal plan' })
    } finally {
      set({ isLoading: false })
    }
  },

  regenerateMealPlan: async () => {
    const { activePlan } = get()

    set({ isLoading: true, error: null })

    try {
      if (activePlan) {
        await mealPlanRepository.deactivatePlan(activePlan.id)
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to archive plan',
        isLoading: false,
      })
      return
    }

    const mealsPerDay = activePlan?.mealsPerDay ?? DEFAULT_MEALS_PER_DAY
    set({ activePlan: null, isLoading: false })
    await get().generateMealPlan(mealsPerDay)
  },

  loadActivePlan: async () => {
    set({ isLoading: true, error: null })

    try {
      const plan = await mealPlanRepository.getActivePlan()
      set({ activePlan: plan })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load plan' })
    } finally {
      set({ isLoading: false })
    }
  },

  // ── Food Logging ──────────────────────────────────────────────

  logFood: async (entryData: Omit<FoodLogEntry, 'id'>) => {
    set({ error: null })

    const validation = validateInput(foodLogEntrySchema, entryData)
    if (!validation.success) {
      set({ error: validation.errors.join('; ') })
      return
    }

    try {
      const entry = await foodLogRepository.addEntry(entryData)

      set((state) => ({
        todaysLog: [entry, ...state.todaysLog],
      }))

      const summary = await foodLogRepository.getDailySummary(todayISO())
      set({ dailySummary: summary })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to log food' })
    }
  },

  removeFood: async (entryId: string) => {
    set({ error: null })

    try {
      await foodLogRepository.deleteById(entryId)

      set((state) => ({
        todaysLog: state.todaysLog.filter((e) => e.id !== entryId),
        selectedDateLog: state.selectedDateLog.filter((e) => e.id !== entryId),
      }))

      const summary = await foodLogRepository.getDailySummary(todayISO())
      set({ dailySummary: summary })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to remove food' })
    }
  },

  loadTodaysLog: async () => {
    set({ isLoading: true, error: null })

    try {
      const today = todayISO()
      const [entries, summary] = await Promise.all([
        foodLogRepository.getEntriesByDate(today),
        foodLogRepository.getDailySummary(today),
      ])

      set({ todaysLog: entries, dailySummary: summary })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load today's log" })
    } finally {
      set({ isLoading: false })
    }
  },

  loadLogForDate: async (date: string) => {
    set({ error: null })

    try {
      const entries = await foodLogRepository.getEntriesByDate(date)
      set({ selectedDateLog: entries })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load food log' })
    }
  },

  // ── Meal Adherence ────────────────────────────────────────────

  setMealAdherence: async (date: string, mealType: MealType, level: AdherenceLevel) => {
    set({ error: null })

    const validation = validateInput(mealAdherenceSchema, { date, mealType, level })
    if (!validation.success) {
      set({ error: validation.errors.join('; ') })
      return
    }

    try {
      const adherence = await mealAdherenceRepository.saveAdherence({ date, mealType, level })

      set((state) => {
        const newDateAdherence = [
          ...state.dateAdherence.filter((a) => !(a.date === date && a.mealType === mealType)),
          adherence,
        ]

        // Silent redistribution — only for named meal slots that have a target
        const mealName = mealType as MealName
        const target = state.mealTargets?.[mealName]
        if (!target) return { dateAdherence: newDateAdherence }

        // Compute logged macros for this meal from selectedDateLog
        const mealEntries = state.selectedDateLog.filter((e) => e.mealType === mealType)
        const logged = {
          calories: mealEntries.reduce((s, e) => s + e.calories, 0),
          protein: mealEntries.reduce((s, e) => s + e.protein, 0),
          fat: mealEntries.reduce((s, e) => s + e.fat, 0),
          carbs: mealEntries.reduce((s, e) => s + e.carbs, 0),
        }

        // Remaining meals = those without adherence in the new list
        const MEAL_NAMES: MealName[] = ['breakfast', 'lunch', 'dinner', 'snack']
        const remainingMeals = MEAL_NAMES.filter(
          (m) => m !== mealName && !newDateAdherence.some((a) => a.mealType === m),
        )

        if (!state.mealTargets || remainingMeals.length === 0) {
          return { dateAdherence: newDateAdherence }
        }

        const { updatedTargets, toastMacro, toastAmount, toastMealName } = computeRedistribution(
          logged,
          target,
          remainingMeals,
          state.mealTargets,
        )

        const toast =
          toastMacro && toastMealName
            ? { macro: toastMacro, amount: toastAmount, mealName: toastMealName }
            : null

        return {
          dateAdherence: newDateAdherence,
          mealTargets: updatedTargets,
          redistributionToast: toast,
        }
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to save adherence' })
    }
  },

  loadAdherenceForDate: async (date: string) => {
    set({ error: null })

    try {
      const adherence = await mealAdherenceRepository.getAdherenceForDate(date)
      set({ dateAdherence: adherence })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load adherence' })
    }
  },

  // ── Saved Meals ───────────────────────────────────────────────

  saveMeal: async (mealData: Omit<SavedMeal, 'id'>) => {
    set({ error: null })

    try {
      const meal = await savedMealRepository.saveMeal(mealData)

      set((state) => ({
        savedMeals: [...state.savedMeals, meal],
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to save meal' })
    }
  },

  logSavedMeal: async (savedMealId: string, mealType: MealType, date: string) => {
    const { savedMeals } = get()
    const meal = savedMeals.find((m) => m.id === savedMealId)

    if (!meal) {
      set({ error: 'Saved meal not found.' })
      return
    }

    set({ error: null })

    try {
      const skippedItems: string[] = []

      for (const item of meal.items) {
        const food = FOOD_MAP.get(item.foodId)
        if (!food) {
          skippedItems.push(item.foodId)
          continue
        }

        const factor = item.gramsConsumed / 100

        await foodLogRepository.addEntry({
          foodId: item.foodId,
          mealType,
          date,
          servingAmount: item.servingAmount,
          servingUnit: item.servingUnit,
          gramsConsumed: item.gramsConsumed,
          calories: Math.round(food.caloriesPer100g * factor),
          protein: Math.round(food.proteinPer100g * factor),
          fat: Math.round(food.fatPer100g * factor),
          carbs: Math.round(food.carbsPer100g * factor),
        })
      }

      // Refresh today's log and summary
      const today = todayISO()
      const [entries, summary] = await Promise.all([
        foodLogRepository.getEntriesByDate(today),
        foodLogRepository.getDailySummary(today),
      ])

      set({ todaysLog: entries, dailySummary: summary })

      if (skippedItems.length > 0) {
        set({
          error: `Some items could not be logged (unknown food IDs: ${skippedItems.join(', ')})`,
        })
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to log saved meal' })
    }
  },

  loadSavedMeals: async () => {
    set({ error: null })

    try {
      const meals = await savedMealRepository.getSavedMeals()
      set({ savedMeals: meals })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load saved meals' })
    }
  },

  deleteSavedMeal: async (mealId: string) => {
    set({ error: null })

    try {
      await savedMealRepository.deleteSavedMeal(mealId)

      set((state) => ({
        savedMeals: state.savedMeals.filter((m) => m.id !== mealId),
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete saved meal' })
    }
  },

  // ── Weight Tracking ───────────────────────────────────────────

  logWeight: async (weightKg: number, date: string) => {
    set({ error: null })

    const entry = { date, weightKg, bodyFatPercent: null, notes: '' }
    const validation = validateInput(bodyMeasurementSchema, entry)
    if (!validation.success) {
      set({ error: validation.errors.join('; ') })
      return
    }

    try {
      const measurement = await measurementRepository.addMeasurement(entry)

      set((state) => ({
        weightLog: [...state.weightLog, measurement],
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to log weight' })
    }
  },

  loadWeightLog: async (startDate: string, endDate: string) => {
    set({ error: null })

    try {
      const measurements = await measurementRepository.getMeasurementsByDateRange(
        startDate,
        endDate,
      )
      set({ weightLog: measurements })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load weight log' })
    }
  },

  // ── Weekly Check-In ───────────────────────────────────────────

  runWeeklyCheckIn: async () => {
    const { activePlan } = get()
    if (!activePlan) {
      set({ error: 'No active meal plan. Generate a plan first.' })
      return
    }

    const { profile } = useUserStore.getState()
    if (!profile) {
      set({ error: 'No user profile found. Complete onboarding first.' })
      return
    }

    set({ isLoading: true, error: null })

    try {
      // Get weight averages for current and previous week
      const currentWeek = weekBounds(0)
      const previousWeek = weekBounds(1)

      const [prevAvgWeight, currentAvgWeight] = await Promise.all([
        measurementRepository.getWeeklyAverageWeight(previousWeek.start, previousWeek.end),
        measurementRepository.getWeeklyAverageWeight(currentWeek.start, currentWeek.end),
      ])

      if (prevAvgWeight === null || currentAvgWeight === null) {
        set({
          error: 'Not enough weight data for recalibration. Log weight daily.',
          isLoading: false,
        })
        return
      }

      // Get calorie adherence (how many days the user logged food)
      const dailySummaries = await foodLogRepository.getDailySummaries(
        currentWeek.start,
        currentWeek.end,
      )

      // Days in the week window (start to end inclusive)
      const msPerDay = 86400000
      const daysInWindow =
        Math.round(
          (new Date(currentWeek.end).getTime() - new Date(currentWeek.start).getTime()) / msPerDay,
        ) + 1
      const adherenceRate = daysInWindow > 0 ? dailySummaries.length / daysInWindow : 0

      // Run recalibration algorithm
      const result = recalibrate({
        weeklyAverages: [prevAvgWeight, currentAvgWeight],
        adherenceRate,
        currentCalories: activePlan.targetCalories,
        goal: profile.goal,
        sex: profile.sex,
        adjustedWeightKg: profile.weightKg,
        actualWeightKg: currentAvgWeight,
      })

      // Save check-in record
      const checkIn = await weeklyCheckInRepository.saveCheckIn({
        weekStartDate: currentWeek.start,
        weekEndDate: currentWeek.end,
        avgWeight: currentAvgWeight,
        prevAvgWeight,
        weightChange: result.weightChange,
        expectedChange: result.expectedChange,
        calorieAdjustment: result.calorieAdjustment,
        newTargetCalories: result.newTargetCalories,
        coachMessage: resolveI18nKey(he, result.coachMessageKey),
        coachMessageEn: resolveI18nKey(en, result.coachMessageKey),
      })

      // Update plan macros if adjustment needed
      if (result.calorieAdjustment !== 0) {
        await mealPlanRepository.updatePlanMacros(
          activePlan.id,
          result.newTargetCalories,
          result.newProteinGrams,
          result.newFatGrams,
          result.newCarbGrams,
        )
      }

      set((state) => ({
        latestRecalibration: result,
        recentCheckIns: [checkIn, ...state.recentCheckIns],
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to run weekly check-in' })
    } finally {
      set({ isLoading: false })
    }
  },

  loadRecentCheckIns: async () => {
    set({ error: null })

    try {
      const checkIns = await weeklyCheckInRepository.getRecentCheckIns(RECENT_CHECKINS_LIMIT)
      set({ recentCheckIns: checkIns })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load check-ins' })
    }
  },

  // ── Meal Targets ─────────────────────────────────────────────

  refreshMealTargets: () => {
    const { profile, tdeeBreakdown } = useUserStore.getState()
    if (!profile || !tdeeBreakdown) return

    try {
      const dailyTargets = calculateNutritionTargets(
        tdeeBreakdown.bmr,
        tdeeBreakdown.total,
        profile.weightKg,
        profile.heightCm,
        profile.bodyFatPercent,
        profile.goal,
      )
      const targets = computeMealTargets(
        dailyTargets,
        profile.workoutTime ?? 'flexible',
        profile.goal,
      )
      set({ mealTargets: targets })
    } catch {
      // Profile not complete enough yet — skip silently
    }
  },

  clearRedistributionToast: () => set({ redistributionToast: null }),

  // ── Meal Generation ───────────────────────────────────────────

  generateMealForSlot: async (mealType: MealType, date: string) => {
    const { mealTargets } = get()
    const target = mealTargets?.[mealType as MealName]
    if (!target) return

    set({ error: null })

    try {
      const items = generateMeal(target, FOOD_MAP)
      const entryIds: string[] = []

      for (const item of items) {
        const factor = item.grams / 100
        const entry = await foodLogRepository.addEntry({
          foodId: item.food.id,
          mealType,
          date,
          servingAmount: item.grams,
          servingUnit: 'grams',
          gramsConsumed: item.grams,
          calories: Math.round(item.food.caloriesPer100g * factor),
          protein: Math.round(item.food.proteinPer100g * factor),
          fat: Math.round(item.food.fatPer100g * factor),
          carbs: Math.round(item.food.carbsPer100g * factor),
        })
        entryIds.push(entry.id)
      }

      set((state) => ({
        lastGeneratedFoodIds: {
          ...state.lastGeneratedFoodIds,
          [mealType]: new Set(items.map((i) => i.food.id)),
        },
        lastGeneratedEntryIds: {
          ...state.lastGeneratedEntryIds,
          [mealType]: entryIds,
        },
      }))

      const [entries, summary] = await Promise.all([
        foodLogRepository.getEntriesByDate(date),
        foodLogRepository.getDailySummary(date),
      ])
      set({ selectedDateLog: entries, dailySummary: summary })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to generate meal' })
    }
  },

  regenerateMealForSlot: async (mealType: MealType, date: string) => {
    const { mealTargets, lastGeneratedFoodIds, lastGeneratedEntryIds } = get()
    const target = mealTargets?.[mealType as MealName]
    if (!target) return

    set({ error: null })

    try {
      // Remove previously generated entries for this meal
      const prevEntryIds = lastGeneratedEntryIds[mealType] ?? []
      for (const entryId of prevEntryIds) {
        await foodLogRepository.deleteById(entryId)
      }

      const excludeIds = lastGeneratedFoodIds[mealType]
      const items = generateMeal(target, FOOD_MAP, excludeIds)
      const entryIds: string[] = []

      for (const item of items) {
        const factor = item.grams / 100
        const entry = await foodLogRepository.addEntry({
          foodId: item.food.id,
          mealType,
          date,
          servingAmount: item.grams,
          servingUnit: 'grams',
          gramsConsumed: item.grams,
          calories: Math.round(item.food.caloriesPer100g * factor),
          protein: Math.round(item.food.proteinPer100g * factor),
          fat: Math.round(item.food.fatPer100g * factor),
          carbs: Math.round(item.food.carbsPer100g * factor),
        })
        entryIds.push(entry.id)
      }

      set((state) => ({
        lastGeneratedFoodIds: {
          ...state.lastGeneratedFoodIds,
          [mealType]: new Set(items.map((i) => i.food.id)),
        },
        lastGeneratedEntryIds: {
          ...state.lastGeneratedEntryIds,
          [mealType]: entryIds,
        },
      }))

      const [entries, summary] = await Promise.all([
        foodLogRepository.getEntriesByDate(date),
        foodLogRepository.getDailySummary(date),
      ])
      set({ selectedDateLog: entries, dailySummary: summary })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to regenerate meal' })
    }
  },

  // ── Computed ──────────────────────────────────────────────────

  getRemainingMacros: () => {
    const { activePlan, dailySummary } = get()
    if (!activePlan || !dailySummary) return null

    return {
      calories: activePlan.targetCalories - dailySummary.totalCalories,
      protein: activePlan.targetProtein - dailySummary.totalProtein,
      fat: activePlan.targetFat - dailySummary.totalFat,
      carbs: activePlan.targetCarbs - dailySummary.totalCarbs,
    }
  },

  getMealPlanForToday: () => {
    const { activePlan } = get()
    if (!activePlan) return null

    const todayDow = new Date().getDay() as DayOfWeek
    return activePlan.days.find((d) => d.dayOfWeek === todayDow) ?? null
  },
}))
