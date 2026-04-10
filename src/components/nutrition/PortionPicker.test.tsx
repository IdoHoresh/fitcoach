/**
 * Tests for PortionPicker component.
 * UI-only tests — store is mocked.
 */

import React from 'react'
import { render, fireEvent, act } from '@testing-library/react-native'
import { PortionPicker } from './PortionPicker'
import type { FoodItem } from '@/types'

const mockLogFood = jest.fn()

jest.mock('@/stores/useNutritionStore', () => ({
  useNutritionStore: jest.fn((selector: (s: unknown) => unknown) =>
    selector({ logFood: mockLogFood }),
  ),
}))

const MOCK_FOOD: FoodItem = {
  id: 'food_001',
  nameHe: 'חזה עוף',
  nameEn: 'Chicken Breast',
  category: 'protein',
  isUserCreated: false,
  caloriesPer100g: 165,
  proteinPer100g: 31,
  fatPer100g: 3.6,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [
    { nameHe: 'מנה קטנה', nameEn: 'small serving', unit: 'grams', grams: 100 },
    { nameHe: 'מנה גדולה', nameEn: 'large serving', unit: 'grams', grams: 200 },
  ],
}

const MOCK_FOOD_NO_SERVINGS: FoodItem = {
  ...MOCK_FOOD,
  id: 'food_002',
  servingSizes: [],
}

const defaultProps = {
  food: MOCK_FOOD,
  mealType: 'breakfast' as const,
  date: '2026-04-10',
  onBack: jest.fn(),
  onConfirmed: jest.fn(),
  testID: 'portion-picker',
}

describe('PortionPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders food name in header', () => {
    const { getByTestId } = render(<PortionPicker {...defaultProps} />)
    expect(getByTestId('portion-picker-name')).toHaveTextContent('חזה עוף')
  })

  it('renders serving size chips when food has servings', () => {
    const { getByTestId } = render(<PortionPicker {...defaultProps} />)
    expect(getByTestId('portion-picker-serving-0')).toBeTruthy()
    expect(getByTestId('portion-picker-serving-1')).toBeTruthy()
  })

  it('does not render serving chips when food has no servings', () => {
    const { queryByTestId } = render(
      <PortionPicker {...defaultProps} food={MOCK_FOOD_NO_SERVINGS} />,
    )
    expect(queryByTestId('portion-picker-serving-0')).toBeNull()
  })

  it('defaults grams to first serving size', () => {
    const { getByTestId } = render(<PortionPicker {...defaultProps} />)
    expect(getByTestId('portion-picker-grams')).toHaveTextContent('100')
  })

  it('selecting a serving chip updates grams', () => {
    const { getByTestId } = render(<PortionPicker {...defaultProps} />)
    fireEvent.press(getByTestId('portion-picker-serving-1'))
    expect(getByTestId('portion-picker-grams')).toHaveTextContent('200')
  })

  it('increment button increases grams by 10', () => {
    const { getByTestId } = render(<PortionPicker {...defaultProps} />)
    fireEvent.press(getByTestId('portion-picker-increment'))
    expect(getByTestId('portion-picker-grams')).toHaveTextContent('110')
  })

  it('decrement button decreases grams by 10', () => {
    const { getByTestId } = render(<PortionPicker {...defaultProps} />)
    fireEvent.press(getByTestId('portion-picker-increment')) // 110
    fireEvent.press(getByTestId('portion-picker-decrement')) // 100
    expect(getByTestId('portion-picker-grams')).toHaveTextContent('100')
  })

  it('decrement does not go below 1', () => {
    const { getByTestId } = render(<PortionPicker {...defaultProps} />)
    // Set to very low — press decrement many times
    for (let i = 0; i < 15; i++) {
      fireEvent.press(getByTestId('portion-picker-decrement'))
    }
    expect(getByTestId('portion-picker-grams')).toHaveTextContent('1')
  })

  it('macro preview shows calories for default grams', () => {
    const { getByTestId } = render(<PortionPicker {...defaultProps} />)
    // 165 cal/100g × 100g = 165 kcal
    expect(getByTestId('portion-picker-calories')).toHaveTextContent('165')
  })

  it('macro preview updates when grams change', () => {
    const { getByTestId } = render(<PortionPicker {...defaultProps} />)
    fireEvent.press(getByTestId('portion-picker-serving-1')) // 200g
    // 165 × 2 = 330 kcal
    expect(getByTestId('portion-picker-calories')).toHaveTextContent('330')
  })

  it('protein macro updates with grams', () => {
    const { getByTestId } = render(<PortionPicker {...defaultProps} />)
    // 31g/100g × 100g = 31g
    expect(getByTestId('portion-picker-protein')).toHaveTextContent('31.0g')
  })

  it('confirm button calls logFood with correct args', async () => {
    const onConfirmed = jest.fn()
    const { getByTestId } = render(<PortionPicker {...defaultProps} onConfirmed={onConfirmed} />)
    await act(async () => {
      fireEvent.press(getByTestId('portion-picker-confirm'))
    })
    expect(mockLogFood).toHaveBeenCalledWith(
      expect.objectContaining({
        foodId: 'food_001',
        mealType: 'breakfast',
        date: '2026-04-10',
        gramsConsumed: 100,
        calories: 165,
      }),
    )
  })

  it('confirm button calls onConfirmed after logging', async () => {
    const onConfirmed = jest.fn()
    const { getByTestId } = render(<PortionPicker {...defaultProps} onConfirmed={onConfirmed} />)
    await act(async () => {
      fireEvent.press(getByTestId('portion-picker-confirm'))
    })
    expect(onConfirmed).toHaveBeenCalledTimes(1)
  })

  it('back button calls onBack', () => {
    const onBack = jest.fn()
    const { getByTestId } = render(<PortionPicker {...defaultProps} onBack={onBack} />)
    fireEvent.press(getByTestId('portion-picker-back'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
