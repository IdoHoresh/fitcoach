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

  it('displays current/goal grams for each macro', () => {
    render(<MacroLegend {...defaultProps} testID="legend" />)
    expect(screen.getByText('60g/150g')).toBeTruthy()
    expect(screen.getByText('100g/250g')).toBeTruthy()
    expect(screen.getByText('40g/80g')).toBeTruthy()
  })

  it('shows the Hebrew letter labels when language is Hebrew (default)', () => {
    render(<MacroLegend {...defaultProps} testID="legend" />)
    expect(screen.getByText(t().home.v2.macroLegend.proteinLetter)).toBeTruthy()
    expect(screen.getByText(t().home.v2.macroLegend.carbsLetter)).toBeTruthy()
    expect(screen.getByText(t().home.v2.macroLegend.fatLetter)).toBeTruthy()
  })

  it('applies macro colors to the letter labels', () => {
    render(<MacroLegend {...defaultProps} testID="legend" />)
    expect(screen.getByTestId('legend-protein-letter')).toHaveStyle({
      color: colors.protein,
    })
    expect(screen.getByTestId('legend-carbs-letter')).toHaveStyle({
      color: colors.carbs,
    })
    expect(screen.getByTestId('legend-fat-letter')).toHaveStyle({
      color: colors.fat,
    })
  })

  it('displays the full macro label (חלבון / פחמימות / שומן) below the letter', () => {
    render(<MacroLegend {...defaultProps} testID="legend" />)
    expect(screen.getByText(t().home.v2.macroLegend.proteinLabel)).toBeTruthy()
    expect(screen.getByText(t().home.v2.macroLegend.carbsLabel)).toBeTruthy()
    expect(screen.getByText(t().home.v2.macroLegend.fatLabel)).toBeTruthy()
  })
})
