import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import * as Haptics from 'expo-haptics'
import { RestTimer } from './RestTimer'
import { colors } from '@/theme/colors'

describe('RestTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('rendering', () => {
    it('renders with testID', () => {
      render(<RestTimer durationSeconds={90} autoStart={false} testID="timer" />)
      expect(screen.getByTestId('timer')).toBeTruthy()
    })

    it('displays initial duration formatted as MM:SS', () => {
      render(<RestTimer durationSeconds={90} autoStart={false} testID="timer" />)
      expect(screen.getByTestId('timer-display')).toHaveTextContent('01:30')
    })

    it('pads single digit seconds with leading zero', () => {
      render(<RestTimer durationSeconds={65} autoStart={false} testID="timer" />)
      expect(screen.getByTestId('timer-display')).toHaveTextContent('01:05')
    })

    it('shows zero time for zero duration', () => {
      render(<RestTimer durationSeconds={0} autoStart={false} testID="timer" />)
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:00')
    })
  })

  describe('countdown', () => {
    it('decrements every second when running', () => {
      render(<RestTimer durationSeconds={10} autoStart testID="timer" />)
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:10')

      act(() => {
        jest.advanceTimersByTime(3000)
      })
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:07')
    })

    it('stops at zero and does not go negative', () => {
      render(<RestTimer durationSeconds={2} autoStart testID="timer" />)

      act(() => {
        jest.advanceTimersByTime(5000)
      })
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:00')
    })

    it('calls onComplete when countdown reaches zero', () => {
      const onComplete = jest.fn()
      render(<RestTimer durationSeconds={1} autoStart onComplete={onComplete} testID="timer" />)

      act(() => {
        jest.advanceTimersByTime(1000)
      })
      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('triggers heavy haptic when countdown completes', () => {
      render(<RestTimer durationSeconds={1} autoStart testID="timer" />)

      act(() => {
        jest.advanceTimersByTime(1000)
      })
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy)
    })

    it('does not count down when autoStart is false', () => {
      render(<RestTimer durationSeconds={10} autoStart={false} testID="timer" />)

      act(() => {
        jest.advanceTimersByTime(5000)
      })
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:10')
    })
  })

  describe('controls', () => {
    it('pause stops the countdown', () => {
      render(<RestTimer durationSeconds={10} autoStart testID="timer" />)

      act(() => {
        jest.advanceTimersByTime(2000)
      })
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:08')

      fireEvent.press(screen.getByTestId('timer-pause'))

      act(() => {
        jest.advanceTimersByTime(5000)
      })
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:08')
    })

    it('resume continues from paused value', () => {
      render(<RestTimer durationSeconds={10} autoStart testID="timer" />)

      act(() => {
        jest.advanceTimersByTime(2000)
      })
      fireEvent.press(screen.getByTestId('timer-pause'))
      fireEvent.press(screen.getByTestId('timer-pause')) // toggle back to running

      act(() => {
        jest.advanceTimersByTime(3000)
      })
      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:05')
    })

    it('reset restores original duration', () => {
      render(<RestTimer durationSeconds={10} autoStart testID="timer" />)

      act(() => {
        jest.advanceTimersByTime(4000)
      })
      fireEvent.press(screen.getByTestId('timer-reset'))

      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:10')
    })
  })

  describe('warning state', () => {
    it('display turns warning color when under ten seconds remain', () => {
      render(<RestTimer durationSeconds={12} autoStart testID="timer" />)

      act(() => {
        jest.advanceTimersByTime(3000)
      })
      expect(screen.getByTestId('timer-display')).toHaveStyle({ color: colors.warning })
    })

    it('display uses primary color when more than ten seconds remain', () => {
      render(<RestTimer durationSeconds={60} autoStart testID="timer" />)
      expect(screen.getByTestId('timer-display')).toHaveStyle({ color: colors.textPrimary })
    })
  })
})
