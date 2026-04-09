import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { TodaysWorkoutCard } from './TodaysWorkoutCard'
import { useWorkoutStore } from '@/stores/useWorkoutStore'
import { t } from '@/i18n'
import { EXERCISE_DATABASE } from '@/data/exercises'
import type { GeneratedWorkoutPlan, GeneratedWorkoutDay } from '@/algorithms/workout-generator'
import type { WorkoutTemplate } from '@/types/workout'
import type { DayOfWeek } from '@/types/user'

// Mock db + user store so importing the workout store doesn't pull in expo-sqlite.
// jest.mock calls are hoisted above the imports above at runtime.
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
  todayISO: () => '2026-04-07',
  nowISO: () => '2026-04-07T09:00:00Z',
}))

jest.mock('@/stores/useUserStore', () => ({
  useUserStore: {
    getState: () => ({ profile: null }),
  },
}))

function resetStore() {
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
}

function makeTemplate(exerciseIds: readonly string[]): WorkoutTemplate {
  return {
    id: 'tmpl-push-a',
    dayType: 'push_a',
    splitType: 'push_pull_legs',
    nameHe: 'דחיפה A',
    nameEn: 'Push A',
    exercises: exerciseIds.map((exerciseId, idx) => ({
      exerciseId,
      sets: 3,
      minReps: 8,
      maxReps: 12,
      restSeconds: 120,
      order: idx,
    })),
    estimatedMinutes: 45,
  }
}

function seedPlan(todaysTemplate: WorkoutTemplate | null): void {
  const todayDow = new Date().getDay() as DayOfWeek
  const todaysDay: GeneratedWorkoutDay = {
    dayOfWeek: todayDow,
    dayType: todaysTemplate ? 'push_a' : 'rest',
    template: todaysTemplate,
  }
  const plan: GeneratedWorkoutPlan = {
    splitType: 'push_pull_legs',
    reasoning: '',
    reasoningHe: '',
    weeklySchedule: [todaysDay],
    mesocycleWeek: 1,
    totalMesocycleWeeks: 4,
  }
  const dayMapping = new Map<DayOfWeek, GeneratedWorkoutDay>()
  dayMapping.set(todayDow, todaysDay)
  useWorkoutStore.setState({ plan, dayMapping })
}

describe('TodaysWorkoutCard', () => {
  beforeEach(() => {
    resetStore()
  })

  it('renders empty state when no plan exists', () => {
    render(<TodaysWorkoutCard onStart={jest.fn()} testID="card" />)
    expect(screen.getByText(t().home.dashboard.noPlanYet)).toBeTruthy()
  })

  it('renders rest-day state when today has no template', () => {
    seedPlan(null)
    render(<TodaysWorkoutCard onStart={jest.fn()} testID="card" />)
    expect(screen.getByText(t().home.dashboard.restDay)).toBeTruthy()
  })

  it('renders workout name when today has a workout', () => {
    const template = makeTemplate([EXERCISE_DATABASE[0]!.id, EXERCISE_DATABASE[1]!.id])
    seedPlan(template)
    render(<TodaysWorkoutCard onStart={jest.fn()} testID="card" />)
    expect(screen.getByText('דחיפה A')).toBeTruthy()
  })

  it('renders first 3 exercises and "+N more" when more than 3', () => {
    const ids = EXERCISE_DATABASE.slice(0, 5).map((e) => e.id)
    seedPlan(makeTemplate(ids))
    render(<TodaysWorkoutCard onStart={jest.fn()} testID="card" />)

    // First three Hebrew names should be visible
    expect(screen.getByText(EXERCISE_DATABASE[0]!.nameHe)).toBeTruthy()
    expect(screen.getByText(EXERCISE_DATABASE[1]!.nameHe)).toBeTruthy()
    expect(screen.getByText(EXERCISE_DATABASE[2]!.nameHe)).toBeTruthy()
    // Fourth should be hidden
    expect(screen.queryByText(EXERCISE_DATABASE[3]!.nameHe)).toBeNull()
    // "+2 more" indicator present
    expect(screen.getByText(/\+2/)).toBeTruthy()
  })

  it('does not render "+N more" when template has exactly 3 exercises', () => {
    const ids = EXERCISE_DATABASE.slice(0, 3).map((e) => e.id)
    seedPlan(makeTemplate(ids))
    render(<TodaysWorkoutCard onStart={jest.fn()} testID="card" />)
    expect(screen.queryByText(/^\+/)).toBeNull()
  })

  it('invokes onStart when CTA is pressed and workout exists', () => {
    seedPlan(makeTemplate([EXERCISE_DATABASE[0]!.id]))
    const onStart = jest.fn()
    render(<TodaysWorkoutCard onStart={onStart} testID="card" />)
    fireEvent.press(screen.getByTestId('card-cta'))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('invokes onStart when empty-state CTA is pressed', () => {
    const onStart = jest.fn()
    render(<TodaysWorkoutCard onStart={onStart} testID="card" />)
    fireEvent.press(screen.getByTestId('card-cta'))
    expect(onStart).toHaveBeenCalledTimes(1)
  })
})
