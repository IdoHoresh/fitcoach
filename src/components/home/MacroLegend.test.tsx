import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { MacroLegend } from './MacroLegend'
import { colors } from '@/theme/colors'
import { t } from '@/i18n'

const defaultProps = {
  protein: { current: 60, goal: 150 },
  carbs: { current: 100, goal: 250 },
  fat: { current: 40, goal: 80 },
}

describe('MacroLegend', () => {
  it('renders with testID', () => {
    render(<MacroLegend {...defaultProps} testID="legend" />)
    expect(screen.getByTestId('legend')).toBeTruthy()
  })

  it('renders all three macro columns', () => {
    render(<MacroLegend {...defaultProps} testID="legend" />)
    expect(screen.getByTestId('legend-protein')).toBeTruthy()
    expect(screen.getByTestId('legend-carbs')).toBeTruthy()
    expect(screen.getByTestId('legend-fat')).toBeTruthy()
  })

  it('displays current grams for each macro', () => {
    render(<MacroLegend {...defaultProps} testID="legend" />)
    expect(screen.getByText('60g')).toBeTruthy()
    expect(screen.getByText('100g')).toBeTruthy()
    expect(screen.getByText('40g')).toBeTruthy()
  })

  it('displays the full macro label (חלבון / פחמימות / שומן)', () => {
    render(<MacroLegend {...defaultProps} testID="legend" />)
    expect(screen.getByText(t().home.v2.macroLegend.proteinLabel)).toBeTruthy()
    expect(screen.getByText(t().home.v2.macroLegend.carbsLabel)).toBeTruthy()
    expect(screen.getByText(t().home.v2.macroLegend.fatLabel)).toBeTruthy()
  })

  it('renders a colored dot for each macro column', () => {
    render(<MacroLegend {...defaultProps} testID="legend" />)
    expect(screen.getByTestId('legend-protein-dot')).toBeTruthy()
    expect(screen.getByTestId('legend-carbs-dot')).toBeTruthy()
    expect(screen.getByTestId('legend-fat-dot')).toBeTruthy()
  })

  it('applies macro colors to each dot', () => {
    render(<MacroLegend {...defaultProps} testID="legend" />)
    expect(screen.getByTestId('legend-protein-dot')).toHaveStyle({
      backgroundColor: colors.protein,
    })
    expect(screen.getByTestId('legend-carbs-dot')).toHaveStyle({ backgroundColor: colors.carbs })
    expect(screen.getByTestId('legend-fat-dot')).toHaveStyle({ backgroundColor: colors.fat })
  })
})
