/**
 * Tests for FoodSearchSheet component.
 * UI-only tests — store is mocked.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { FoodSearchSheet } from './FoodSearchSheet'

jest.mock('@/stores/useNutritionStore', () => ({
  useNutritionStore: jest.fn(() => ({
    logFood: jest.fn(),
    selectedDateLog: [],
  })),
}))

jest.mock('@/db', () => ({
  todayISO: () => '2026-04-10',
}))

describe('FoodSearchSheet', () => {
  const defaultProps = {
    visible: true,
    mealType: 'breakfast' as const,
    date: '2026-04-10',
    onClose: jest.fn(),
    testID: 'search-sheet',
  }

  it('renders the search input when visible', () => {
    const { getByTestId } = render(<FoodSearchSheet {...defaultProps} />)
    expect(getByTestId('search-sheet-input')).toBeTruthy()
  })

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn()
    const { getByTestId } = render(<FoodSearchSheet {...defaultProps} onClose={onClose} />)
    fireEvent.press(getByTestId('search-sheet-close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders the add custom food button', () => {
    const { getByTestId } = render(<FoodSearchSheet {...defaultProps} />)
    expect(getByTestId('search-sheet-custom-food')).toBeTruthy()
  })

  it('does not render when visible is false', () => {
    const { queryByTestId } = render(<FoodSearchSheet {...defaultProps} visible={false} />)
    expect(queryByTestId('search-sheet-input')).toBeNull()
  })

  it('shows search results after typing a query', () => {
    const { getByTestId, getAllByTestId } = render(<FoodSearchSheet {...defaultProps} />)
    fireEvent.changeText(getByTestId('search-sheet-input'), 'עוף')
    const results = getAllByTestId(/^search-sheet-result-/)
    expect(results.length).toBeGreaterThan(0)
  })

  it('shows no results for an unmatched query', () => {
    const { getByTestId, queryAllByTestId } = render(<FoodSearchSheet {...defaultProps} />)
    fireEvent.changeText(getByTestId('search-sheet-input'), 'xyzxyzxyz')
    expect(queryAllByTestId(/^search-sheet-result-/).length).toBe(0)
  })
})
