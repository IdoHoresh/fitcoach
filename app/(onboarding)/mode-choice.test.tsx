import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import ModeChoiceScreen from './mode-choice'
import { track } from '@/analytics/track'

const mockPush = jest.fn()
const mockUpdateDraft = jest.fn()
let mockDraft: { mealLoggingMode?: 'structured' | 'free' } = {}

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('@/stores/useUserStore', () => ({
  useUserStore: (selector: (state: unknown) => unknown) =>
    selector({ draft: mockDraft, updateDraft: mockUpdateDraft }),
}))

jest.mock('@/analytics/track', () => ({
  track: jest.fn(),
}))

const mockTrack = track as jest.MockedFunction<typeof track>

describe('ModeChoiceScreen analytics', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockUpdateDraft.mockClear()
    mockTrack.mockClear()
    mockDraft = {}
  })

  it('fires mode_choice_picked on continue with default mode (structured) and changed_from_default=false', () => {
    render(<ModeChoiceScreen />)

    fireEvent.press(screen.getByTestId('mode-choice-continue'))

    expect(mockTrack).toHaveBeenCalledTimes(1)
    const event = mockTrack.mock.calls[0][0]
    expect(event.type).toBe('mode_choice_picked')
    if (event.type === 'mode_choice_picked') {
      expect(event.mode).toBe('structured')
      expect(event.changed_from_default).toBe(false)
      expect(event.time_to_pick_ms).toBeGreaterThanOrEqual(0)
      expect(typeof event.time_to_pick_ms).toBe('number')
    }
  })

  it('fires mode_choice_picked with changed_from_default=true when user picks free', () => {
    render(<ModeChoiceScreen />)

    fireEvent.press(screen.getByTestId('mode-choice-free'))
    fireEvent.press(screen.getByTestId('mode-choice-continue'))

    expect(mockTrack).toHaveBeenCalledTimes(1)
    const event = mockTrack.mock.calls[0][0]
    expect(event.type).toBe('mode_choice_picked')
    if (event.type === 'mode_choice_picked') {
      expect(event.mode).toBe('free')
      expect(event.changed_from_default).toBe(true)
    }
  })

  it('fires mode_choice_picked with changed_from_default=false when user toggles free then back to structured', () => {
    render(<ModeChoiceScreen />)

    fireEvent.press(screen.getByTestId('mode-choice-free'))
    fireEvent.press(screen.getByTestId('mode-choice-structured'))
    fireEvent.press(screen.getByTestId('mode-choice-continue'))

    expect(mockTrack).toHaveBeenCalledTimes(1)
    const event = mockTrack.mock.calls[0][0]
    if (event.type === 'mode_choice_picked') {
      expect(event.mode).toBe('structured')
      expect(event.changed_from_default).toBe(false)
    }
  })

  it('time_to_pick_ms grows with elapsed time between mount and continue', () => {
    jest.useFakeTimers()
    try {
      render(<ModeChoiceScreen />)
      act(() => {
        jest.advanceTimersByTime(2500)
      })
      fireEvent.press(screen.getByTestId('mode-choice-continue'))

      const event = mockTrack.mock.calls[0][0]
      if (event.type === 'mode_choice_picked') {
        expect(event.time_to_pick_ms).toBeGreaterThanOrEqual(2500)
      }
    } finally {
      jest.useRealTimers()
    }
  })

  it('does not fire any event before continue is pressed', () => {
    render(<ModeChoiceScreen />)

    fireEvent.press(screen.getByTestId('mode-choice-free'))
    fireEvent.press(screen.getByTestId('mode-choice-structured'))

    expect(mockTrack).not.toHaveBeenCalled()
  })
})
