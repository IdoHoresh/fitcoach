/**
 * Tests for NutritionMacroPills component.
 * RED phase: written before the component exists.
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { NutritionMacroPills } from './NutritionMacroPills'

describe('NutritionMacroPills', () => {
  const defaultProps = {
    protein: { planned: 120, goal: 160 },
    carbs: { planned: 185, goal: 220 },
    fat: { planned: 45, goal: 65 },
    testID: 'pills',
  }

  it('renders all three macro pills', () => {
    const { getByTestId } = render(<NutritionMacroPills {...defaultProps} />)
    expect(getByTestId('pills-protein')).toBeTruthy()
    expect(getByTestId('pills-carbs')).toBeTruthy()
    expect(getByTestId('pills-fat')).toBeTruthy()
  })

  it('displays protein consumed grams', () => {
    const { getByTestId } = render(<NutritionMacroPills {...defaultProps} />)
    expect(getByTestId('pills-protein-value')).toHaveTextContent('120g')
  })

  it('displays carbs consumed grams', () => {
    const { getByTestId } = render(<NutritionMacroPills {...defaultProps} />)
    expect(getByTestId('pills-carbs-value')).toHaveTextContent('185g')
  })

  it('displays fat consumed grams', () => {
    const { getByTestId } = render(<NutritionMacroPills {...defaultProps} />)
    expect(getByTestId('pills-fat-value')).toHaveTextContent('45g')
  })

  it('displays Hebrew macro labels', () => {
    const { getByTestId } = render(<NutritionMacroPills {...defaultProps} />)
    expect(getByTestId('pills-protein-label')).toHaveTextContent('חלבון')
    expect(getByTestId('pills-carbs-label')).toHaveTextContent('פחמימות')
    expect(getByTestId('pills-fat-label')).toHaveTextContent('שומן')
  })
})
