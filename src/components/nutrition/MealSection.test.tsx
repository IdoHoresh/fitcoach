/**
 * Tests for MealSection component.
 * UI-only — no store calls.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { MealSection } from './MealSection'
import type { FoodLogEntry } from '@/types'

const MOCK_ENTRIES: FoodLogEntry[] = [
  {
    id: 'entry_001',
    foodId: 'food_001',
    nameHe: 'חזה עוף',
    mealType: 'breakfast',
    date: '2026-04-10',
    servingAmount: 150,
    servingUnit: 'grams',
    gramsConsumed: 150,
    calories: 248,
    protein: 46.5,
    fat: 5.4,
    carbs: 0,
  },
]

const defaultProps = {
  mealType: 'breakfast' as const,
  date: '2026-04-10',
  foods: [],
  onAddFood: jest.fn(),
  onRemoveFood: jest.fn(),
  testID: 'meal-section',
}

describe('MealSection', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders meal name in header', () => {
    const { getByTestId } = render(<MealSection {...defaultProps} />)
    expect(getByTestId('meal-section-title')).toHaveTextContent('ארוחת בוקר')
  })

  it('shows empty state when no foods and no target', () => {
    const { getByTestId } = render(<MealSection {...defaultProps} />)
    expect(getByTestId('meal-section-empty')).toBeTruthy()
  })

  it('does not show empty state when foods exist', () => {
    const { queryByTestId } = render(<MealSection {...defaultProps} foods={MOCK_ENTRIES} />)
    expect(queryByTestId('meal-section-empty')).toBeNull()
  })

  it('renders a food row for each entry', () => {
    const { getByTestId } = render(<MealSection {...defaultProps} foods={MOCK_ENTRIES} />)
    expect(getByTestId('meal-section-food-entry_001')).toBeTruthy()
  })

  it('shows total calories in header', () => {
    const { getByTestId } = render(<MealSection {...defaultProps} foods={MOCK_ENTRIES} />)
    expect(getByTestId('meal-section-calories')).toHaveTextContent(/248/)
  })

  it('shows 0 calories when no foods', () => {
    const { getByTestId } = render(<MealSection {...defaultProps} />)
    expect(getByTestId('meal-section-calories')).toHaveTextContent(/^0/)
  })

  it('+ button is always present', () => {
    const { getByTestId } = render(<MealSection {...defaultProps} />)
    expect(getByTestId('meal-section-add')).toBeTruthy()
  })

  it('pressing + calls onAddFood on empty meal', () => {
    const onAddFood = jest.fn()
    const { getByTestId } = render(<MealSection {...defaultProps} onAddFood={onAddFood} />)
    fireEvent.press(getByTestId('meal-section-add'))
    expect(onAddFood).toHaveBeenCalledTimes(1)
  })

  it('pressing + calls onAddFood on non-empty meal', () => {
    const onAddFood = jest.fn()
    const { getByTestId } = render(
      <MealSection {...defaultProps} foods={MOCK_ENTRIES} onAddFood={onAddFood} />,
    )
    fireEvent.press(getByTestId('meal-section-add'))
    expect(onAddFood).toHaveBeenCalledTimes(1)
  })

  it('pressing remove on a food row calls onRemoveFood with entry id', () => {
    const onRemoveFood = jest.fn()
    const { getByTestId } = render(
      <MealSection {...defaultProps} foods={MOCK_ENTRIES} onRemoveFood={onRemoveFood} />,
    )
    fireEvent.press(getByTestId('meal-section-food-entry_001-remove'))
    expect(onRemoveFood).toHaveBeenCalledWith('entry_001')
  })

  it('works for lunch meal type', () => {
    const { getByTestId } = render(
      <MealSection {...defaultProps} mealType="lunch" testID="lunch-section" />,
    )
    expect(getByTestId('lunch-section-title')).toHaveTextContent('ארוחת צהריים')
  })

  describe('re-log previous meal pill', () => {
    it('renders PreviousMealPill when empty and previousMealDayWord is provided', () => {
      const { getByTestId } = render(
        <MealSection {...defaultProps} previousMealDayWord="אתמול" onRelog={jest.fn()} />,
      )
      expect(getByTestId('meal-section-relog')).toBeTruthy()
    })

    it('does not render PreviousMealPill when meal has foods', () => {
      const { queryByTestId } = render(
        <MealSection
          {...defaultProps}
          foods={MOCK_ENTRIES}
          previousMealDayWord="אתמול"
          onRelog={jest.fn()}
        />,
      )
      expect(queryByTestId('meal-section-relog')).toBeNull()
    })

    it('does not render PreviousMealPill when previousMealDayWord is null', () => {
      const { queryByTestId } = render(
        <MealSection {...defaultProps} previousMealDayWord={null} onRelog={jest.fn()} />,
      )
      expect(queryByTestId('meal-section-relog')).toBeNull()
    })

    it('fires onRelog when the pill is pressed', () => {
      const onRelog = jest.fn()
      const { getByTestId } = render(
        <MealSection {...defaultProps} previousMealDayWord="אתמול" onRelog={onRelog} />,
      )
      fireEvent.press(getByTestId('meal-section-relog'))
      expect(onRelog).toHaveBeenCalledTimes(1)
    })
  })
})
