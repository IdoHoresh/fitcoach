import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import * as Haptics from 'expo-haptics'
import { Button } from './Button'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'

describe('Button', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders label text', () => {
      render(<Button label="Save" onPress={jest.fn()} />)
      expect(screen.getByText('Save')).toBeTruthy()
    })

    it('renders with default variant and size', () => {
      render(<Button label="Save" onPress={jest.fn()} testID="btn" />)
      const btn = screen.getByTestId('btn')
      expect(btn).toBeTruthy()
    })
  })

  describe('variants', () => {
    it('primary variant uses primary background color', () => {
      render(<Button label="Go" onPress={jest.fn()} variant="primary" testID="btn" />)
      expect(screen.getByTestId('btn')).toHaveStyle({
        backgroundColor: colors.primary,
      })
    })

    it('secondary variant uses surfaceElevated background color', () => {
      render(<Button label="Go" onPress={jest.fn()} variant="secondary" testID="btn" />)
      expect(screen.getByTestId('btn')).toHaveStyle({
        backgroundColor: colors.surfaceElevated,
      })
    })

    it('outline variant uses transparent background with border', () => {
      render(<Button label="Go" onPress={jest.fn()} variant="outline" testID="btn" />)
      expect(screen.getByTestId('btn')).toHaveStyle({
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
      })
    })

    it('ghost variant uses transparent background', () => {
      render(<Button label="Go" onPress={jest.fn()} variant="ghost" testID="btn" />)
      expect(screen.getByTestId('btn')).toHaveStyle({
        backgroundColor: 'transparent',
      })
    })
  })

  describe('sizes', () => {
    it('sm size applies smaller padding', () => {
      render(<Button label="Go" onPress={jest.fn()} size="sm" testID="btn" />)
      const btn = screen.getByTestId('btn')
      expect(btn).toHaveStyle({ paddingVertical: spacing.sm })
    })

    it('lg size applies larger padding', () => {
      render(<Button label="Go" onPress={jest.fn()} size="lg" testID="btn" />)
      const btn = screen.getByTestId('btn')
      expect(btn).toHaveStyle({ paddingVertical: spacing.md })
    })
  })

  describe('interactions', () => {
    it('calls onPress when pressed', () => {
      const onPress = jest.fn()
      render(<Button label="Tap" onPress={onPress} />)
      fireEvent.press(screen.getByText('Tap'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('does not call onPress when disabled', () => {
      const onPress = jest.fn()
      render(<Button label="Tap" onPress={onPress} disabled />)
      fireEvent.press(screen.getByText('Tap'))
      expect(onPress).not.toHaveBeenCalled()
    })

    it('triggers haptic feedback on press', () => {
      render(<Button label="Tap" onPress={jest.fn()} />)
      fireEvent(screen.getByText('Tap'), 'pressIn')
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
    })
  })

  describe('loading state', () => {
    it('shows activity indicator when loading', () => {
      render(<Button label="Save" onPress={jest.fn()} loading testID="btn" />)
      expect(screen.getByTestId('btn-loading')).toBeTruthy()
    })

    it('hides label when loading', () => {
      render(<Button label="Save" onPress={jest.fn()} loading />)
      expect(screen.queryByText('Save')).toBeNull()
    })

    it('does not call onPress when loading', () => {
      const onPress = jest.fn()
      render(<Button label="Save" onPress={onPress} loading />)
      fireEvent.press(screen.getByTestId('btn-loading'))
      expect(onPress).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('has button role', () => {
      render(<Button label="Save" onPress={jest.fn()} />)
      expect(screen.getByRole('button')).toBeTruthy()
    })

    it('has accessibility label matching button label', () => {
      render(<Button label="Save" onPress={jest.fn()} />)
      expect(screen.getByLabelText('Save')).toBeTruthy()
    })

    it('has disabled state when disabled', () => {
      render(<Button label="Save" onPress={jest.fn()} disabled />)
      const btn = screen.getByRole('button')
      expect(btn.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }))
    })
  })
})
