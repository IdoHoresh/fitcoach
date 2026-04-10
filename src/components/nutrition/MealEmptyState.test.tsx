/**
 * Tests for MealEmptyState component.
 * RED phase: written before the component exists.
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { MealEmptyState } from './MealEmptyState'

describe('MealEmptyState', () => {
  it('renders the empty state message', () => {
    const { getByTestId } = render(<MealEmptyState testID="empty" />)
    expect(getByTestId('empty-message')).toHaveTextContent('עדיין לא תועדו פריטים')
  })

  it('renders with testID', () => {
    const { getByTestId } = render(<MealEmptyState testID="empty" />)
    expect(getByTestId('empty')).toBeTruthy()
  })
})
