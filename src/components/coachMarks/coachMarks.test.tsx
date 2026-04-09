import React, { useEffect } from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { setLanguage } from '@/i18n'
import { CoachMarksProvider, CoachMarksOverlay, useCoachMarks, type CoachMarkStep } from './index'

const STEPS: CoachMarkStep[] = [
  { id: 'tab-home', title: 'Home', body: 'Your daily hub' },
  { id: 'tab-workout', title: 'Workout', body: 'Your training plan' },
  { id: 'tab-nutrition', title: 'Nutrition', body: 'Track your meals' },
]

/** Test helper that auto-starts a tour on mount. */
function AutoStart({ steps }: { steps: CoachMarkStep[] }) {
  const { startTour } = useCoachMarks()
  useEffect(() => {
    startTour(steps)
  }, [startTour, steps])
  return null
}

function renderTour(props: { steps?: CoachMarkStep[]; onFinish?: () => void } = {}) {
  const onFinish = props.onFinish ?? jest.fn()
  const utils = render(
    <CoachMarksProvider onFinish={onFinish}>
      <AutoStart steps={props.steps ?? STEPS} />
      <CoachMarksOverlay />
    </CoachMarksProvider>,
  )
  return { ...utils, onFinish }
}

beforeEach(() => {
  setLanguage('en')
})

describe('CoachMarks', () => {
  describe('rendering', () => {
    it('renders_nothing_when_not_started', () => {
      render(
        <CoachMarksProvider onFinish={jest.fn()}>
          <CoachMarksOverlay />
        </CoachMarksProvider>,
      )
      // No step content, no buttons
      expect(screen.queryByText('Skip')).toBeNull()
      expect(screen.queryByText('Next')).toBeNull()
    })

    it('renders_first_step_title_and_body_after_startTour', () => {
      renderTour()
      expect(screen.getByText('Home')).toBeTruthy()
      expect(screen.getByText('Your daily hub')).toBeTruthy()
    })

    it('shows_step_counter_in_english', () => {
      renderTour()
      expect(screen.getByText('1 of 3')).toBeTruthy()
    })

    it('shows_step_counter_in_hebrew', () => {
      setLanguage('he')
      renderTour()
      expect(screen.getByText('1 מתוך 3')).toBeTruthy()
    })

    it('shows_skip_button_on_intermediate_steps', () => {
      renderTour()
      expect(screen.getByText('Skip')).toBeTruthy()
    })

    it('next_button_shows_Next_on_intermediate_steps', () => {
      renderTour()
      expect(screen.getByText('Next')).toBeTruthy()
    })
  })

  describe('navigation', () => {
    it('next_advances_to_second_step', () => {
      renderTour()
      fireEvent.press(screen.getByText('Next'))
      expect(screen.getByText('Workout')).toBeTruthy()
      expect(screen.getByText('Your training plan')).toBeTruthy()
      expect(screen.getByText('2 of 3')).toBeTruthy()
    })

    it('next_advances_to_final_step_and_shows_done_label', () => {
      renderTour()
      fireEvent.press(screen.getByText('Next'))
      fireEvent.press(screen.getByText('Next'))
      expect(screen.getByText('Nutrition')).toBeTruthy()
      expect(screen.getByText('3 of 3')).toBeTruthy()
      // On the final step, the primary button label switches to the localized
      // "done" string ("Got it" in English).
      expect(screen.getByText('Got it')).toBeTruthy()
      expect(screen.queryByText('Next')).toBeNull()
    })

    it('done_on_final_step_calls_onFinish_and_dismisses', () => {
      const { onFinish } = renderTour()
      fireEvent.press(screen.getByText('Next'))
      fireEvent.press(screen.getByText('Next'))
      fireEvent.press(screen.getByText('Got it'))

      expect(onFinish).toHaveBeenCalledTimes(1)
      // Overlay dismissed: no more buttons
      expect(screen.queryByText('Got it')).toBeNull()
      expect(screen.queryByText('Skip')).toBeNull()
    })

    it('skip_dismisses_immediately_and_calls_onFinish', () => {
      const { onFinish } = renderTour()
      fireEvent.press(screen.getByText('Skip'))

      expect(onFinish).toHaveBeenCalledTimes(1)
      expect(screen.queryByText('Home')).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('startTour_with_empty_steps_does_not_open_overlay', () => {
      const onFinish = jest.fn()
      render(
        <CoachMarksProvider onFinish={onFinish}>
          <AutoStart steps={[]} />
          <CoachMarksOverlay />
        </CoachMarksProvider>,
      )
      expect(screen.queryByText('Next')).toBeNull()
      expect(screen.queryByText('Skip')).toBeNull()
      // Empty tour should NOT call onFinish — there was nothing to finish.
      expect(onFinish).not.toHaveBeenCalled()
    })

    it('useCoachMarks_throws_when_used_outside_provider', () => {
      const Bad = () => {
        useCoachMarks()
        return null
      }
      // Suppress expected console.error from React error boundary
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => render(<Bad />)).toThrow(/CoachMarksProvider/)
      spy.mockRestore()
    })
  })
})
