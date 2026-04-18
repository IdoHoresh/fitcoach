/**
 * ManualFoodCollisionSheet tests.
 * Pure component test — no DB, no network.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ManualFoodCollisionSheet } from './ManualFoodCollisionSheet'
import type { FoodItem } from '@/types'

const EXISTING: FoodItem = {
  id: 'manual_7290000066318',
  nameHe: 'פתיבר חלבון שוקולד',
  nameEn: 'Chocolate Protein Bar',
  category: 'snacks',
  caloriesPer100g: 350,
  proteinPer100g: 30,
  fatPer100g: 10,
  carbsPer100g: 40,
  fiberPer100g: 5,
  isUserCreated: true,
  servingSizes: [{ nameHe: '100 גרם', nameEn: '100g', unit: 'grams', grams: 100 }],
}

function setup(overrides: Partial<React.ComponentProps<typeof ManualFoodCollisionSheet>> = {}) {
  const onUseExisting = jest.fn()
  const onReplace = jest.fn()
  const onCancel = jest.fn()
  const utils = render(
    <ManualFoodCollisionSheet
      visible
      existing={EXISTING}
      onUseExisting={onUseExisting}
      onReplace={onReplace}
      onCancel={onCancel}
      testID="collision"
      {...overrides}
    />,
  )
  return { ...utils, onUseExisting, onReplace, onCancel }
}

describe('ManualFoodCollisionSheet', () => {
  it('renders the existing food name in the title', () => {
    const { getByTestId } = setup()
    expect(getByTestId('collision-title')).toHaveTextContent(/פתיבר חלבון שוקולד/)
  })

  it('calls onUseExisting when the "use existing" button is tapped', () => {
    const { getByTestId, onUseExisting, onReplace, onCancel } = setup()

    fireEvent.press(getByTestId('collision-use-existing'))

    expect(onUseExisting).toHaveBeenCalledTimes(1)
    expect(onReplace).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('calls onReplace when the "replace" button is tapped', () => {
    const { getByTestId, onUseExisting, onReplace, onCancel } = setup()

    fireEvent.press(getByTestId('collision-replace'))

    expect(onReplace).toHaveBeenCalledTimes(1)
    expect(onUseExisting).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('calls onCancel when the "cancel" button is tapped', () => {
    const { getByTestId, onUseExisting, onReplace, onCancel } = setup()

    fireEvent.press(getByTestId('collision-cancel'))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onUseExisting).not.toHaveBeenCalled()
    expect(onReplace).not.toHaveBeenCalled()
  })
})
