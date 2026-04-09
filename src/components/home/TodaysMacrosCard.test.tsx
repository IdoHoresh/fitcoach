import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { TodaysMacrosCard } from './TodaysMacrosCard'
import { useNutritionStore } from '@/stores/useNutritionStore'
import { t } from '@/i18n'
import type { MealPlan, DailyNutritionSummary } from '@/types/nutrition'

// Mock db + user store so importing the nutrition store doesn't pull in expo-sqlite.
// jest.mock calls are hoisted above the imports above at runtime.
jest.mock('@/db', () => ({
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
  todayISO: () => '2026-04-07',
  nowISO: () => '2026-04-07T09:00:00Z',
}))

jest.mock('@/stores/useUserStore', () => ({
  useUserStore: {
    getState: () => ({ profile: null }),
  },
}))

function resetStore() {
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

function makePlan(): MealPlan {
  return {
    id: 'plan-1',
    startDate: '2026-04-07',
    endDate: '2026-04-14',
    status: 'active',
    targetCalories: 2400,
    targetProtein: 180,
    targetFat: 70,
    targetCarbs: 260,
    mealsPerDay: 4,
    days: [],
    createdAt: '2026-04-07T09:00:00Z',
  }
}

function makeSummary(): DailyNutritionSummary {
  return {
    date: '2026-04-07',
    totalCalories: 1200,
    totalProtein: 90,
    totalFat: 35,
    totalCarbs: 130,
    totalFiber: 20,
    mealCount: 2,
  }
}

describe('TodaysMacrosCard', () => {
  beforeEach(() => {
    resetStore()
  })

  it('renders empty state when no meal plan is active', () => {
    render(<TodaysMacrosCard testID="macros" />)
    expect(screen.getByText(t().home.dashboard.noMealPlanYet)).toBeTruthy()
  })

  it('renders MacroRing with plan targets and zero consumed when no summary yet', () => {
    useNutritionStore.setState({ activePlan: makePlan(), dailySummary: null })
    render(<TodaysMacrosCard testID="macros" />)
    // MacroRing renders a labelled protein cell
    expect(screen.getByTestId('macros-ring-protein')).toBeTruthy()
    // Protein shows "0 / 180 g" because no summary yet
    expect(screen.getByText('0 / 180 g')).toBeTruthy()
  })

  it('renders MacroRing with consumed values from dailySummary', () => {
    useNutritionStore.setState({ activePlan: makePlan(), dailySummary: makeSummary() })
    render(<TodaysMacrosCard testID="macros" />)
    // Protein shows "90 / 180 g"
    expect(screen.getByText('90 / 180 g')).toBeTruthy()
    // Fat shows "35 / 70 g"
    expect(screen.getByText('35 / 70 g')).toBeTruthy()
    // Carbs shows "130 / 260 g"
    expect(screen.getByText('130 / 260 g')).toBeTruthy()
  })
})
