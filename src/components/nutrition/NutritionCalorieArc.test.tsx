/**
 * Tests for NutritionCalorieArc component.
 * RED phase: written before the component exists.
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { NutritionCalorieArc } from './NutritionCalorieArc'

describe('NutritionCalorieArc', () => {
  it('renders the planned calorie number', () => {
    const { getByTestId } = render(
      <NutritionCalorieArc plannedCalories={1200} goalCalories={1852} testID="arc" />,
    )
    expect(getByTestId('arc-planned')).toHaveTextContent('1,200')
  })

  it('renders the goal calorie number', () => {
    const { getByTestId } = render(
      <NutritionCalorieArc plannedCalories={1200} goalCalories={1852} testID="arc" />,
    )
    expect(getByTestId('arc-goal')).toHaveTextContent(/1,852/)
  })

  it('renders the calories label', () => {
    const { getByTestId } = render(
      <NutritionCalorieArc plannedCalories={0} goalCalories={1852} testID="arc" />,
    )
    expect(getByTestId('arc-label')).toBeTruthy()
  })

  it('renders with zero planned calories', () => {
    const { getByTestId } = render(
      <NutritionCalorieArc plannedCalories={0} goalCalories={2000} testID="arc" />,
    )
    expect(getByTestId('arc-planned')).toHaveTextContent('0')
  })
})
