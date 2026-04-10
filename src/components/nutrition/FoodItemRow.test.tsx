/**
 * Tests for FoodItemRow component.
 * RED phase: written before the component exists.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { FoodItemRow } from './FoodItemRow'

describe('FoodItemRow', () => {
  const defaultProps = {
    nameHe: 'חזה עוף בגריל',
    grams: 150,
    calories: 248,
    onRemove: jest.fn(),
    testID: 'food-row',
  }

  it('renders the food name', () => {
    const { getByTestId } = render(<FoodItemRow {...defaultProps} />)
    expect(getByTestId('food-row-name')).toHaveTextContent('חזה עוף בגריל')
  })

  it('renders the gram amount', () => {
    const { getByTestId } = render(<FoodItemRow {...defaultProps} />)
    expect(getByTestId('food-row-grams')).toHaveTextContent(/150/)
  })

  it('renders the calorie count', () => {
    const { getByTestId } = render(<FoodItemRow {...defaultProps} />)
    expect(getByTestId('food-row-calories')).toHaveTextContent('248')
  })

  it('calls onRemove when remove button is pressed', () => {
    const onRemove = jest.fn()
    const { getByTestId } = render(<FoodItemRow {...defaultProps} onRemove={onRemove} />)
    fireEvent.press(getByTestId('food-row-remove'))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})
