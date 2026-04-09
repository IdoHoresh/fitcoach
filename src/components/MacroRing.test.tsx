import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { MacroRing } from './MacroRing'
import { colors } from '@/theme/colors'

const defaultProps = {
  consumedCalories: 1200,
  goalCalories: 2000,
  protein: { current: 80, goal: 150 },
  carbs: { current: 120, goal: 200 },
  fat: { current: 40, goal: 70 },
}

describe('MacroRing', () => {
  describe('rendering', () => {
    it('renders with testID', () => {
      render(<MacroRing {...defaultProps} testID="ring" />)
      expect(screen.getByTestId('ring')).toBeTruthy()
    })

    it('shows remaining calories in center', () => {
      render(<MacroRing {...defaultProps} testID="ring" />)
      // 2000 - 1200 = 800 remaining
      expect(screen.getByText('800')).toBeTruthy()
    })

    it('shows zero remaining when consumed equals goal', () => {
      render(<MacroRing {...defaultProps} consumedCalories={2000} testID="ring" />)
      expect(screen.getByText('0')).toBeTruthy()
    })

    it('shows zero remaining (not negative) when consumed exceeds goal', () => {
      render(<MacroRing {...defaultProps} consumedCalories={2500} testID="ring" />)
      expect(screen.getByText('0')).toBeTruthy()
    })

    it('renders each macro label', () => {
      render(<MacroRing {...defaultProps} testID="ring" />)
      expect(screen.getByTestId('ring-protein')).toBeTruthy()
      expect(screen.getByTestId('ring-carbs')).toBeTruthy()
      expect(screen.getByTestId('ring-fat')).toBeTruthy()
    })

    it('displays macro grams as current/goal format', () => {
      render(<MacroRing {...defaultProps} testID="ring" />)
      expect(screen.getByText('80 / 150 g')).toBeTruthy()
      expect(screen.getByText('120 / 200 g')).toBeTruthy()
      expect(screen.getByText('40 / 70 g')).toBeTruthy()
    })
  })

  describe('macro colors', () => {
    it('protein stat uses protein color', () => {
      render(<MacroRing {...defaultProps} testID="ring" />)
      expect(screen.getByTestId('ring-protein-dot')).toHaveStyle({
        backgroundColor: colors.protein,
      })
    })

    it('carbs stat uses carbs color', () => {
      render(<MacroRing {...defaultProps} testID="ring" />)
      expect(screen.getByTestId('ring-carbs-dot')).toHaveStyle({
        backgroundColor: colors.carbs,
      })
    })

    it('fat stat uses fat color', () => {
      render(<MacroRing {...defaultProps} testID="ring" />)
      expect(screen.getByTestId('ring-fat-dot')).toHaveStyle({
        backgroundColor: colors.fat,
      })
    })
  })

  describe('edge cases', () => {
    it('handles zero goal calories without crashing', () => {
      render(<MacroRing {...defaultProps} consumedCalories={0} goalCalories={0} testID="ring" />)
      expect(screen.getByTestId('ring')).toBeTruthy()
    })

    it('respects custom size prop', () => {
      const { getByTestId } = render(<MacroRing {...defaultProps} size={300} testID="ring" />)
      expect(getByTestId('ring')).toBeTruthy()
    })
  })
})
