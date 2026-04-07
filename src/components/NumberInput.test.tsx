import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import * as Haptics from 'expo-haptics'
import * as rtlModule from '@/hooks/rtl'
import { NumberInput } from './NumberInput'

jest.useFakeTimers()

describe('NumberInput', () => {
  const defaultProps = {
    label: 'Weight',
    value: 70,
    onChangeValue: jest.fn(),
    min: 30,
    max: 200,
    step: 1,
    testID: 'weight',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(rtlModule, 'isRTL').mockReturnValue(false)
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.restoreAllMocks()
  })

  // ── Rendering ──

  describe('rendering', () => {
    it('renders label text', () => {
      render(<NumberInput {...defaultProps} />)
      expect(screen.getByText('Weight')).toBeTruthy()
    })

    it('renders current value', () => {
      render(<NumberInput {...defaultProps} />)
      expect(screen.getByText('70')).toBeTruthy()
    })

    it('renders value with unit when provided', () => {
      render(<NumberInput {...defaultProps} unit="kg" />)
      expect(screen.getByText('kg')).toBeTruthy()
    })

    it('does not render unit when not provided', () => {
      render(<NumberInput {...defaultProps} />)
      expect(screen.queryByTestId('weight-unit')).toBeNull()
    })

    it('renders decrement and increment buttons', () => {
      render(<NumberInput {...defaultProps} />)
      expect(screen.getByTestId('weight-decrement')).toBeTruthy()
      expect(screen.getByTestId('weight-increment')).toBeTruthy()
    })
  })

  // ── Increment / Decrement ──

  describe('increment and decrement', () => {
    it('calls onChangeValue with value + step when increment pressed', () => {
      render(<NumberInput {...defaultProps} />)
      fireEvent(screen.getByTestId('weight-increment'), 'pressIn')
      expect(defaultProps.onChangeValue).toHaveBeenCalledWith(71)
    })

    it('calls onChangeValue with value - step when decrement pressed', () => {
      render(<NumberInput {...defaultProps} />)
      fireEvent(screen.getByTestId('weight-decrement'), 'pressIn')
      expect(defaultProps.onChangeValue).toHaveBeenCalledWith(69)
    })

    it('respects custom step size', () => {
      render(<NumberInput {...defaultProps} step={0.5} />)
      fireEvent(screen.getByTestId('weight-increment'), 'pressIn')
      expect(defaultProps.onChangeValue).toHaveBeenCalledWith(70.5)
    })

    it('clamps to max when increment would exceed', () => {
      render(<NumberInput {...defaultProps} value={200} />)
      fireEvent(screen.getByTestId('weight-increment'), 'pressIn')
      expect(defaultProps.onChangeValue).not.toHaveBeenCalled()
    })

    it('clamps to min when decrement would go below', () => {
      render(<NumberInput {...defaultProps} value={30} />)
      fireEvent(screen.getByTestId('weight-decrement'), 'pressIn')
      expect(defaultProps.onChangeValue).not.toHaveBeenCalled()
    })
  })

  // ── Bounds / Disabled State ──

  describe('bounds', () => {
    it('disables decrement button at min value', () => {
      render(<NumberInput {...defaultProps} value={30} />)
      const btn = screen.getByTestId('weight-decrement')
      expect(btn.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }))
    })

    it('disables increment button at max value', () => {
      render(<NumberInput {...defaultProps} value={200} />)
      const btn = screen.getByTestId('weight-increment')
      expect(btn.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }))
    })

    it('applies disabled opacity to decrement at min', () => {
      render(<NumberInput {...defaultProps} value={30} />)
      expect(screen.getByTestId('weight-decrement')).toHaveStyle({ opacity: 0.5 })
    })

    it('applies disabled opacity to increment at max', () => {
      render(<NumberInput {...defaultProps} value={200} />)
      expect(screen.getByTestId('weight-increment')).toHaveStyle({ opacity: 0.5 })
    })
  })

  // ── Long Press ──

  describe('long press', () => {
    it('fires multiple increments on long press', () => {
      render(<NumberInput {...defaultProps} />)
      const btn = screen.getByTestId('weight-increment')

      fireEvent(btn, 'pressIn')
      // Initial press fires once
      expect(defaultProps.onChangeValue).toHaveBeenCalledTimes(1)

      // After 500ms delay, repeating starts
      act(() => jest.advanceTimersByTime(500))
      // After another 400ms (2 ticks at ~150-200ms interval)
      act(() => jest.advanceTimersByTime(400))
      expect(defaultProps.onChangeValue.mock.calls.length).toBeGreaterThan(2)

      // Stops on pressOut
      fireEvent(btn, 'pressOut')
      const countAfterRelease = defaultProps.onChangeValue.mock.calls.length
      act(() => jest.advanceTimersByTime(500))
      expect(defaultProps.onChangeValue).toHaveBeenCalledTimes(countAfterRelease)
    })

    it('fires multiple decrements on long press', () => {
      render(<NumberInput {...defaultProps} value={100} />)
      const btn = screen.getByTestId('weight-decrement')

      fireEvent(btn, 'pressIn')
      act(() => jest.advanceTimersByTime(900))
      expect(defaultProps.onChangeValue.mock.calls.length).toBeGreaterThan(2)

      fireEvent(btn, 'pressOut')
    })
  })

  // ── Tap to Edit ──

  describe('tap to edit', () => {
    it('shows text input when value is tapped', () => {
      render(<NumberInput {...defaultProps} />)
      fireEvent.press(screen.getByTestId('weight-value'))
      expect(screen.getByTestId('weight-edit')).toBeTruthy()
    })

    it('calls onChangeValue with parsed number on submit', () => {
      render(<NumberInput {...defaultProps} />)
      fireEvent.press(screen.getByTestId('weight-value'))
      fireEvent.changeText(screen.getByTestId('weight-edit'), '85')
      fireEvent(screen.getByTestId('weight-edit'), 'submitEditing')
      expect(defaultProps.onChangeValue).toHaveBeenCalledWith(85)
    })

    it('clamps edited value to min/max', () => {
      render(<NumberInput {...defaultProps} />)
      fireEvent.press(screen.getByTestId('weight-value'))
      fireEvent.changeText(screen.getByTestId('weight-edit'), '999')
      fireEvent(screen.getByTestId('weight-edit'), 'submitEditing')
      expect(defaultProps.onChangeValue).toHaveBeenCalledWith(200)
    })

    it('reverts to current value on invalid input', () => {
      render(<NumberInput {...defaultProps} />)
      fireEvent.press(screen.getByTestId('weight-value'))
      fireEvent.changeText(screen.getByTestId('weight-edit'), 'abc')
      fireEvent(screen.getByTestId('weight-edit'), 'submitEditing')
      expect(defaultProps.onChangeValue).not.toHaveBeenCalled()
    })

    it('exits editing on blur', () => {
      render(<NumberInput {...defaultProps} />)
      fireEvent.press(screen.getByTestId('weight-value'))
      expect(screen.getByTestId('weight-edit')).toBeTruthy()
      fireEvent(screen.getByTestId('weight-edit'), 'blur')
      expect(screen.queryByTestId('weight-edit')).toBeNull()
    })
  })

  // ── Error State ──

  describe('error state', () => {
    it('renders error message when error prop is set', () => {
      render(<NumberInput {...defaultProps} error="Too heavy" />)
      expect(screen.getByText('Too heavy')).toBeTruthy()
    })

    it('error has correct testID', () => {
      render(<NumberInput {...defaultProps} error="Too heavy" />)
      expect(screen.getByTestId('weight-error')).toBeTruthy()
    })

    it('does not render error element when no error', () => {
      render(<NumberInput {...defaultProps} />)
      expect(screen.queryByTestId('weight-error')).toBeNull()
    })
  })

  // ── Haptics ──

  describe('haptics', () => {
    it('triggers haptic on increment', () => {
      render(<NumberInput {...defaultProps} />)
      fireEvent(screen.getByTestId('weight-increment'), 'pressIn')
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
    })

    it('triggers haptic on decrement', () => {
      render(<NumberInput {...defaultProps} />)
      fireEvent(screen.getByTestId('weight-decrement'), 'pressIn')
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
    })

    it('does not trigger haptic when at bounds', () => {
      render(<NumberInput {...defaultProps} value={200} />)
      fireEvent(screen.getByTestId('weight-increment'), 'pressIn')
      expect(Haptics.impactAsync).not.toHaveBeenCalled()
    })
  })

  // ── Accessibility ──

  describe('accessibility', () => {
    it('increment button has accessibility label', () => {
      render(<NumberInput {...defaultProps} />)
      const btn = screen.getByTestId('weight-increment')
      expect(btn.props.accessibilityLabel).toBeTruthy()
    })

    it('decrement button has accessibility label', () => {
      render(<NumberInput {...defaultProps} />)
      const btn = screen.getByTestId('weight-decrement')
      expect(btn.props.accessibilityLabel).toBeTruthy()
    })

    it('value display has accessibility label with value and unit', () => {
      render(<NumberInput {...defaultProps} unit="kg" />)
      const value = screen.getByTestId('weight-value')
      expect(value.props.accessibilityLabel).toContain('70')
      expect(value.props.accessibilityLabel).toContain('kg')
    })
  })

  // ── RTL Support ──

  describe('RTL support', () => {
    it('renders in RTL mode without crashing', () => {
      jest.spyOn(rtlModule, 'isRTL').mockReturnValue(true)
      render(<NumberInput {...defaultProps} />)
      expect(screen.getByText('Weight')).toBeTruthy()
    })
  })
})
