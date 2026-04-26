import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import ProfileScreen from './profile'
import { track } from '@/analytics/track'
import type { UserProfile } from '@/types'

const mockUpdateProfile = jest.fn()
let mockProfile: UserProfile | null = null

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('@/stores/useUserStore', () => ({
  useUserStore: (selector: (state: unknown) => unknown) =>
    selector({ profile: mockProfile, updateProfile: mockUpdateProfile }),
}))

jest.mock('@/stores/useNutritionStore', () => ({
  useNutritionStore: { getState: () => ({}), setState: jest.fn() },
}))

jest.mock('@/stores/useWorkoutStore', () => ({
  useWorkoutStore: { getState: () => ({}), setState: jest.fn() },
}))

jest.mock('@/analytics/track', () => ({
  track: jest.fn(),
}))

// resetApp pulls in expo-sqlite (native module, not test-compatible). The dev
// reset button is irrelevant to mode-switch analytics — stub it out.
jest.mock('../../src/dev/resetApp', () => ({
  resetApp: jest.fn(),
}))

const mockTrack = track as jest.MockedFunction<typeof track>

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'test-user',
    createdAt: '2026-04-20T00:00:00.000Z', // 7 days before mocked "now"
    updatedAt: '2026-04-20T00:00:00.000Z',
    name: 'Tester',
    heightCm: 175,
    weightKg: 75,
    age: 30,
    sex: 'male',
    bodyFatPercent: null,
    goal: 'maintenance',
    experience: 'intermediate',
    trainingDays: [1, 3, 5],
    equipment: { location: 'full_gym', availableEquipment: ['barbell'] },
    lifestyle: {
      occupation: 'desk',
      dailySteps: 8000,
      afterWorkActivity: 'moderate',
      exerciseDaysPerWeek: 3,
      exerciseType: 'strength',
      sessionDurationMinutes: 60,
      exerciseIntensity: 'moderate',
      sleepHoursPerNight: 7,
    },
    workoutTime: 'flexible',
    mealLoggingMode: 'structured',
    ...overrides,
  }
}

describe('ProfileScreen mode-switch analytics', () => {
  beforeEach(() => {
    mockUpdateProfile.mockClear()
    mockTrack.mockClear()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-04-27T00:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('fires mode_switched_in_settings when user switches structured → free', () => {
    mockProfile = makeProfile({ mealLoggingMode: 'structured' })

    render(<ProfileScreen />)
    fireEvent.press(screen.getByTestId('settings-meal-logging-mode-row'))
    fireEvent.press(screen.getByTestId('settings-mode-toggle-sheet-free'))

    expect(mockTrack).toHaveBeenCalledTimes(1)
    const event = mockTrack.mock.calls[0][0]
    expect(event.type).toBe('mode_switched_in_settings')
    if (event.type === 'mode_switched_in_settings') {
      expect(event.from).toBe('structured')
      expect(event.to).toBe('free')
      expect(event.days_since_onboarding).toBe(7)
    }
  })

  it('fires mode_switched_in_settings when user switches free → structured', () => {
    mockProfile = makeProfile({
      mealLoggingMode: 'free',
      createdAt: '2026-04-26T00:00:00.000Z', // 1 day before mocked now
    })

    render(<ProfileScreen />)
    fireEvent.press(screen.getByTestId('settings-meal-logging-mode-row'))
    fireEvent.press(screen.getByTestId('settings-mode-toggle-sheet-structured'))

    expect(mockTrack).toHaveBeenCalledTimes(1)
    const event = mockTrack.mock.calls[0][0]
    if (event.type === 'mode_switched_in_settings') {
      expect(event.from).toBe('free')
      expect(event.to).toBe('structured')
      expect(event.days_since_onboarding).toBe(1)
    }
  })

  it('does not fire when user taps the already-selected mode (no-op write)', () => {
    mockProfile = makeProfile({ mealLoggingMode: 'structured' })

    render(<ProfileScreen />)
    fireEvent.press(screen.getByTestId('settings-meal-logging-mode-row'))
    fireEvent.press(screen.getByTestId('settings-mode-toggle-sheet-structured'))

    expect(mockTrack).not.toHaveBeenCalled()
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('days_since_onboarding is 0 for same-day switch', () => {
    mockProfile = makeProfile({
      mealLoggingMode: 'structured',
      createdAt: '2026-04-26T20:00:00.000Z', // 4 hours before mocked now → 0 days
    })

    render(<ProfileScreen />)
    fireEvent.press(screen.getByTestId('settings-meal-logging-mode-row'))
    fireEvent.press(screen.getByTestId('settings-mode-toggle-sheet-free'))

    const event = mockTrack.mock.calls[0][0]
    if (event.type === 'mode_switched_in_settings') {
      expect(event.days_since_onboarding).toBe(0)
    }
  })
})
