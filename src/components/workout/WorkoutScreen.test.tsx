import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { setLanguage } from '@/i18n'
import { useWorkoutStore } from '@/stores/useWorkoutStore'
import type { GeneratedWorkoutDay, GeneratedWorkoutPlan } from '@/algorithms/workout-generator'
import type { DayOfWeek } from '@/types/user'
import type { WorkoutTemplate, ExercisePrescription } from '@/types/workout'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

// Mock DB to prevent expo-sqlite import
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

// Must lazy-import WorkoutScreen AFTER mocks are hoisted
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: WorkoutScreen } = require('../../../app/(tabs)/workout')

// ── Fixtures ──────────────────────────────────────────────────────

const PRESCRIPTIONS: ExercisePrescription[] = [
  { exerciseId: 'ex_001', sets: 3, minReps: 8, maxReps: 12, restSeconds: 90, order: 1 },
  { exerciseId: 'ex_002', sets: 3, minReps: 8, maxReps: 12, restSeconds: 90, order: 2 },
]

const UPPER_TEMPLATE: WorkoutTemplate = {
  id: 'tpl_001',
  dayType: 'upper_a',
  splitType: 'upper_lower',
  nameHe: 'עליון A',
  nameEn: 'Upper A',
  exercises: PRESCRIPTIONS,
  estimatedMinutes: 60,
}

const WORKOUT_DAY: GeneratedWorkoutDay = {
  dayOfWeek: 4, // Thursday
  dayType: 'upper_a',
  template: UPPER_TEMPLATE,
}

const REST_DAY: GeneratedWorkoutDay = {
  dayOfWeek: 5,
  dayType: 'rest',
  template: null,
}

function buildPlanWithDayMapping(days: [DayOfWeek, GeneratedWorkoutDay][]) {
  const weeklySchedule = days.map(([, d]) => d)
  const plan: GeneratedWorkoutPlan = {
    splitType: 'upper_lower',
    reasoning: 'test',
    reasoningHe: 'test',
    weeklySchedule,
    mesocycleWeek: 1,
    totalMesocycleWeeks: 6,
  }
  const dayMapping = new Map<DayOfWeek, GeneratedWorkoutDay>(days)
  return { plan, dayMapping }
}

// ── Tests ──────────────────────────────────────────────────────────

describe('WorkoutScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-04-09T12:00:00') }) // Thursday
    setLanguage('en')
  })

  afterEach(() => {
    jest.useRealTimers()
    setLanguage('he')
    // Reset store to defaults
    useWorkoutStore.setState({
      plan: null,
      dayMapping: null,
      mesocycle: null,
      recentLogs: [],
      activeSession: null,
      isLoading: false,
      error: null,
    })
  })

  it('shows no-plan message when no workout plan exists', () => {
    useWorkoutStore.setState({ plan: null, dayMapping: null })
    render(<WorkoutScreen />)
    expect(screen.getByTestId('workout-no-plan')).toBeTruthy()
  })

  it('renders exercise list when plan exists for today', () => {
    const { plan, dayMapping } = buildPlanWithDayMapping([
      [4 as DayOfWeek, WORKOUT_DAY],
      [5 as DayOfWeek, REST_DAY],
    ])
    useWorkoutStore.setState({ plan, dayMapping })

    render(<WorkoutScreen />)
    expect(screen.getByTestId('workout-screen')).toBeTruthy()
    expect(screen.getByTestId('workout-exercise-0')).toBeTruthy()
    expect(screen.getByTestId('workout-exercise-1')).toBeTruthy()
  })

  it('shows disabled start workout button on workout days', () => {
    const { plan, dayMapping } = buildPlanWithDayMapping([[4 as DayOfWeek, WORKOUT_DAY]])
    useWorkoutStore.setState({ plan, dayMapping })

    render(<WorkoutScreen />)
    expect(screen.getByTestId('workout-start-btn')).toBeTruthy()
  })

  it('shows rest day card when today is a rest day', () => {
    // Fake Friday (5) as today
    jest.setSystemTime(new Date('2026-04-11T12:00:00')) // Friday
    const { plan, dayMapping } = buildPlanWithDayMapping([
      [4 as DayOfWeek, WORKOUT_DAY],
      [5 as DayOfWeek, REST_DAY],
    ])
    useWorkoutStore.setState({ plan, dayMapping })

    render(<WorkoutScreen />)
    expect(screen.getByTestId('workout-rest-card')).toBeTruthy()
    expect(screen.getByTestId('workout-tomorrow')).toBeTruthy()
  })

  it('renders day strip', () => {
    const { plan, dayMapping } = buildPlanWithDayMapping([[4 as DayOfWeek, WORKOUT_DAY]])
    useWorkoutStore.setState({ plan, dayMapping })

    render(<WorkoutScreen />)
    expect(screen.getByTestId('workout-day-strip')).toBeTruthy()
  })

  it('renders workout header', () => {
    const { plan, dayMapping } = buildPlanWithDayMapping([[4 as DayOfWeek, WORKOUT_DAY]])
    useWorkoutStore.setState({ plan, dayMapping })

    render(<WorkoutScreen />)
    expect(screen.getByTestId('workout-header')).toBeTruthy()
  })
})
