import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { TodaysPlanList } from './TodaysPlanList'
import { useWorkoutStore } from '@/stores/useWorkoutStore'
import { useNutritionStore } from '@/stores/useNutritionStore'
import { t } from '@/i18n'
import type { MealPlan, MealType, PlannedMeal } from '@/types/nutrition'
import type { GeneratedWorkoutDay } from '@/algorithms/workout-generator'
import type { WorkoutTemplate } from '@/types/workout'
import type { DayOfWeek } from '@/types/user'

// Mock @/db at the top of the test file so importing the workout / nutrition
// stores doesn't transitively pull in expo-sqlite (see lessons.md 2026-04-09).
jest.mock('@/db', () => ({
  workoutRepository: {
    savePlan: jest.fn(),
    getActivePlan: jest.fn(),
    deactivatePlan: jest.fn(),
    saveMesocycle: jest.fn(),
    getActiveMesocycle: jest.fn(),
    updateMesocycle: jest.fn(),
    saveWorkoutLog: jest.fn(),
    getRecentLogs: jest.fn(),
    getLogsByExercise: jest.fn(),
    archivePlan: jest.fn(),
    getArchivedPlans: jest.fn(),
  },
  nutritionRepository: {
    saveFoodLog: jest.fn(),
    getFoodLogsForDate: jest.fn(),
    deleteFoodLog: jest.fn(),
    saveSavedMeal: jest.fn(),
    getSavedMeals: jest.fn(),
    deleteSavedMeal: jest.fn(),
    saveMealPlan: jest.fn(),
    getActiveMealPlan: jest.fn(),
    deactivateMealPlan: jest.fn(),
  },
  weeklyCheckInRepository: {
    saveCheckIn: jest.fn(),
    getRecentCheckIns: jest.fn(),
  },
  measurementRepository: {
    saveMeasurement: jest.fn(),
    getMeasurementsInRange: jest.fn(),
    getLatestMeasurement: jest.fn(),
  },
  todayISO: () => '2026-04-09',
  nowISO: () => '2026-04-09T12:00:00Z',
}))

jest.mock('@/stores/useUserStore', () => ({
  useUserStore: {
    getState: () => ({ profile: null }),
  },
}))

// ── Fixture builders ──────────────────────────────────────────────

const TODAY_DOW: DayOfWeek = 4 // Thursday

function makeMeal(mealType: MealType, orderIndex: number, calories: number): PlannedMeal {
  return {
    id: `meal-${mealType}`,
    mealType,
    orderIndex,
    timeSlot: null,
    templateId: null,
    items: [],
    totalCalories: calories,
    totalProtein: 30,
    totalFat: 10,
    totalCarbs: 40,
  }
}

function makePlan(meals: readonly PlannedMeal[]): MealPlan {
  return {
    id: 'plan-1',
    startDate: '2026-04-09',
    endDate: '2026-04-16',
    status: 'active',
    targetCalories: 2400,
    targetProtein: 180,
    targetFat: 70,
    targetCarbs: 260,
    mealsPerDay: 4,
    days: [
      {
        dayOfWeek: TODAY_DOW,
        isTrainingDay: true,
        meals,
        totalCalories: meals.reduce((s, m) => s + m.totalCalories, 0),
        totalProtein: 0,
        totalFat: 0,
        totalCarbs: 0,
      },
    ],
    createdAt: '2026-04-07T09:00:00Z',
  }
}

function makeTemplate(): WorkoutTemplate {
  return {
    id: 'tmpl-push-a',
    dayType: 'push_a',
    splitType: 'push_pull_legs',
    nameHe: 'דחיפה A',
    nameEn: 'Push A',
    exercises: [],
    estimatedMinutes: 45,
  }
}

function makeDayMapping(template: WorkoutTemplate | null): Map<DayOfWeek, GeneratedWorkoutDay> {
  const map = new Map<DayOfWeek, GeneratedWorkoutDay>()
  map.set(TODAY_DOW, {
    dayOfWeek: TODAY_DOW,
    dayType: template ? 'push_a' : 'rest',
    template,
  })
  return map
}

function resetStores() {
  useWorkoutStore.setState({
    plan: null,
    planId: null,
    mesocycle: null,
    dayMapping: null,
    activeSession: null,
    recentLogs: [],
    isLoading: false,
    error: null,
  })
  useNutritionStore.setState({
    activePlan: null,
    todaysLog: [],
    dailySummary: null,
    savedMeals: [],
    recentCheckIns: [],
    latestRecalibration: null,
    weightLog: [],
    isLoading: false,
    error: null,
  })
}

const defaultCallbacks = {
  onMealPress: jest.fn(),
  onWorkoutPress: jest.fn(),
  onOnboardingPress: jest.fn(),
}

// Mock Date so `new Date().getDay()` returns Thursday (4) consistently.
beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-04-09T12:00:00') })
  resetStores()
  defaultCallbacks.onMealPress.mockClear()
  defaultCallbacks.onWorkoutPress.mockClear()
  defaultCallbacks.onOnboardingPress.mockClear()
})

afterEach(() => {
  jest.useRealTimers()
})

// ══════════════════════════════════════════════════════════════════

describe('TodaysPlanList', () => {
  describe('fresh install (no plan, no workout day)', () => {
    it('renders ghost rows', () => {
      render(<TodaysPlanList {...defaultCallbacks} testID="list" />)
      // 4 ghost meals + 1 ghost workout = 5 rows
      expect(screen.getAllByTestId(/^list-row-\d+$/)).toHaveLength(5)
    })

    it('routes to onboarding when a ghost row is tapped', () => {
      render(<TodaysPlanList {...defaultCallbacks} testID="list" />)
      fireEvent.press(screen.getByTestId('list-row-0'))
      expect(defaultCallbacks.onOnboardingPress).toHaveBeenCalledTimes(1)
    })

    it('does not render the celebration line', () => {
      render(<TodaysPlanList {...defaultCallbacks} testID="list" />)
      expect(screen.queryByTestId('list-celebration')).toBeNull()
    })
  })

  describe('full plan, mid-day partial progress', () => {
    beforeEach(() => {
      useNutritionStore.setState({
        activePlan: makePlan([
          makeMeal('breakfast', 0, 320),
          makeMeal('lunch', 1, 540),
          makeMeal('dinner', 2, 600),
          makeMeal('snack', 3, 200),
        ]),
      })
      useWorkoutStore.setState({
        dayMapping: makeDayMapping(makeTemplate()),
      })
    })

    it('renders meal rows + workout row (5 rows total)', () => {
      render(<TodaysPlanList {...defaultCallbacks} testID="list" />)
      expect(screen.getAllByTestId(/^list-row-\d+$/)).toHaveLength(5)
    })

    it('routes to nutrition tab when a meal row is tapped', () => {
      render(<TodaysPlanList {...defaultCallbacks} testID="list" />)
      fireEvent.press(screen.getByTestId('list-row-0'))
      expect(defaultCallbacks.onMealPress).toHaveBeenCalledTimes(1)
      expect(defaultCallbacks.onWorkoutPress).not.toHaveBeenCalled()
    })

    it('routes to workout tab when the workout row is tapped', () => {
      render(<TodaysPlanList {...defaultCallbacks} testID="list" />)
      // The workout row is the one where buildTodaysPlan placed it —
      // for meals [breakfast, lunch, dinner, snack] with no pre/post_workout,
      // the heuristic inserts before dinner. So order is:
      // 0: breakfast, 1: lunch, 2: workout, 3: dinner, 4: snack
      fireEvent.press(screen.getByTestId('list-row-2'))
      expect(defaultCallbacks.onWorkoutPress).toHaveBeenCalledTimes(1)
      expect(defaultCallbacks.onMealPress).not.toHaveBeenCalled()
    })

    it('shows the today title', () => {
      render(<TodaysPlanList {...defaultCallbacks} testID="list" />)
      expect(screen.getByText(t().home.v2.todayTitle)).toBeTruthy()
    })

    it('does not render the celebration line until everything is done', () => {
      render(<TodaysPlanList {...defaultCallbacks} testID="list" />)
      expect(screen.queryByTestId('list-celebration')).toBeNull()
    })
  })

  describe('all meals logged + workout done', () => {
    beforeEach(() => {
      useNutritionStore.setState({
        activePlan: makePlan([makeMeal('breakfast', 0, 320), makeMeal('lunch', 1, 540)]),
        todaysLog: [
          {
            id: 'log-1',
            foodId: 'food-1',
            mealType: 'breakfast',
            date: '2026-04-09',
            servingAmount: 1,
            servingUnit: 'serving',
            gramsConsumed: 100,
            calories: 150,
            protein: 10,
            fat: 5,
            carbs: 20,
          },
          {
            id: 'log-2',
            foodId: 'food-2',
            mealType: 'lunch',
            date: '2026-04-09',
            servingAmount: 1,
            servingUnit: 'serving',
            gramsConsumed: 100,
            calories: 150,
            protein: 10,
            fat: 5,
            carbs: 20,
          },
        ],
      })
      useWorkoutStore.setState({
        dayMapping: makeDayMapping(makeTemplate()),
        recentLogs: [
          {
            id: 'workout-log-1',
            date: '2026-04-09',
            templateId: 'tmpl-push-a',
            dayType: 'push_a',
            startedAt: '2026-04-09T18:00:00Z',
            completedAt: '2026-04-09T18:45:00Z',
            exercises: [],
            durationMinutes: 45,
          },
        ],
      })
    })

    it('renders the celebration line', () => {
      render(<TodaysPlanList {...defaultCallbacks} testID="list" />)
      expect(screen.getByTestId('list-celebration')).toBeTruthy()
      expect(screen.getByText(t().home.v2.celebration)).toBeTruthy()
    })
  })

  describe('rest day', () => {
    beforeEach(() => {
      useNutritionStore.setState({
        activePlan: makePlan([
          makeMeal('breakfast', 0, 320),
          makeMeal('lunch', 1, 540),
          makeMeal('dinner', 2, 600),
        ]),
      })
      useWorkoutStore.setState({
        dayMapping: makeDayMapping(null), // rest day
      })
    })

    it('renders a rest row', () => {
      render(<TodaysPlanList {...defaultCallbacks} testID="list" />)
      // Rest row is at the dinner-1 position (heuristic: before dinner)
      // Order: breakfast, lunch, rest, dinner (4 rows total)
      expect(screen.getAllByTestId(/^list-row-\d+$/)).toHaveLength(4)
      // Verify the rest row is non-interactive by checking the callback count
      fireEvent.press(screen.getByTestId('list-row-2'))
      expect(defaultCallbacks.onWorkoutPress).not.toHaveBeenCalled()
      expect(defaultCallbacks.onMealPress).not.toHaveBeenCalled()
      expect(defaultCallbacks.onOnboardingPress).not.toHaveBeenCalled()
    })
  })
})
