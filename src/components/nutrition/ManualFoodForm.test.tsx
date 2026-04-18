/**
 * ManualFoodForm tests.
 * Pure component test — no DB, no network, no camera.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ManualFoodForm } from './ManualFoodForm'
import type { FoodItem } from '@/types'

const EAN = '7290000066318'

function setup(props: Partial<React.ComponentProps<typeof ManualFoodForm>> = {}) {
  const onSubmit = jest.fn<void, [FoodItem]>()
  const onCancel = jest.fn()
  const utils = render(
    <ManualFoodForm ean={EAN} onSubmit={onSubmit} onCancel={onCancel} testID="form" {...props} />,
  )
  return { ...utils, onSubmit, onCancel }
}

function fillField(
  getByTestId: ReturnType<typeof render>['getByTestId'],
  id: string,
  value: string,
) {
  fireEvent.changeText(getByTestId(`form-${id}-field`), value)
}

function fillValidMacros(getByTestId: ReturnType<typeof render>['getByTestId']) {
  fillField(getByTestId, 'name-he', 'פתיבר חלבון')
  fillField(getByTestId, 'calories', '350')
  fillField(getByTestId, 'protein', '30')
  fillField(getByTestId, 'fat', '10')
  fillField(getByTestId, 'carbs', '40')
}

describe('ManualFoodForm', () => {
  it('renders the EAN as read-only context', () => {
    const { getByTestId } = setup()
    expect(getByTestId('form-ean-display')).toHaveTextContent(EAN)
  })

  it('blocks submit when nameHe is empty', () => {
    const { getByTestId, onSubmit } = setup()
    // Fill macros but NOT nameHe
    fillField(getByTestId, 'calories', '350')
    fillField(getByTestId, 'protein', '30')
    fillField(getByTestId, 'fat', '10')
    fillField(getByTestId, 'carbs', '40')

    fireEvent.press(getByTestId('form-submit'))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(getByTestId('form-name-he-error')).toBeTruthy()
  })

  it('blocks submit when p+f+c > 101 with macro-sum error', () => {
    const { getByTestId, onSubmit } = setup()
    fillField(getByTestId, 'name-he', 'מוצר')
    fillField(getByTestId, 'calories', '500')
    fillField(getByTestId, 'protein', '40')
    fillField(getByTestId, 'fat', '35')
    fillField(getByTestId, 'carbs', '30')

    fireEvent.press(getByTestId('form-submit'))

    expect(onSubmit).not.toHaveBeenCalled()
    // macro-sum error surfaces at the protein field per schema path
    expect(getByTestId('form-protein-error')).toBeTruthy()
  })

  it('shows Atwater warning when kcal is 4x higher than expected (kJ-in-kcal typo)', () => {
    const { getByTestId, queryByTestId } = setup()
    fillField(getByTestId, 'name-he', 'מוצר')
    // Expected: 4*10 + 9*5 + 4*20 = 165; entered kcal 836 (kJ value) → delta ~4x
    fillField(getByTestId, 'calories', '836')
    fillField(getByTestId, 'protein', '10')
    fillField(getByTestId, 'fat', '5')
    fillField(getByTestId, 'carbs', '20')

    expect(queryByTestId('form-atwater-warning')).toBeTruthy()
  })

  it('does NOT show Atwater warning when kcal matches Atwater estimate', () => {
    const { getByTestId, queryByTestId } = setup()
    fillField(getByTestId, 'name-he', 'מוצר')
    // Expected: 4*10 + 9*5 + 4*20 = 165; entered 165 exactly
    fillField(getByTestId, 'calories', '165')
    fillField(getByTestId, 'protein', '10')
    fillField(getByTestId, 'fat', '5')
    fillField(getByTestId, 'carbs', '20')

    expect(queryByTestId('form-atwater-warning')).toBeNull()
  })

  it('does NOT block submit even when Atwater warning shows (soft warn only)', () => {
    const { getByTestId, onSubmit } = setup()
    fillField(getByTestId, 'name-he', 'מוצר')
    fillField(getByTestId, 'calories', '836') // kJ-in-kcal
    fillField(getByTestId, 'protein', '10')
    fillField(getByTestId, 'fat', '5')
    fillField(getByTestId, 'carbs', '20')

    fireEvent.press(getByTestId('form-submit'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('blocks submit when servingName is filled but servingGrams is empty', () => {
    const { getByTestId, onSubmit } = setup()
    fillValidMacros(getByTestId)
    fillField(getByTestId, 'serving-name', 'יחידה')

    fireEvent.press(getByTestId('form-submit'))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(getByTestId('form-serving-name-error')).toBeTruthy()
  })

  it('blocks submit when servingGrams is filled but servingName is empty', () => {
    const { getByTestId, onSubmit } = setup()
    fillValidMacros(getByTestId)
    fillField(getByTestId, 'serving-grams', '40')

    fireEvent.press(getByTestId('form-submit'))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits with only the 100g serving when both serving fields are blank', () => {
    const { getByTestId, onSubmit } = setup()
    fillValidMacros(getByTestId)

    fireEvent.press(getByTestId('form-submit'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.servingSizes).toHaveLength(1)
    expect(submitted.servingSizes[0]).toMatchObject({ grams: 100, unit: 'grams' })
  })

  it('submits with 100g + custom serving when both serving fields are filled', () => {
    const { getByTestId, onSubmit } = setup()
    fillValidMacros(getByTestId)
    fillField(getByTestId, 'serving-name', 'יחידה')
    fillField(getByTestId, 'serving-grams', '40')

    fireEvent.press(getByTestId('form-submit'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.servingSizes).toHaveLength(2)
    expect(submitted.servingSizes[0]).toMatchObject({ grams: 100 })
    expect(submitted.servingSizes[1]).toMatchObject({ nameHe: 'יחידה', grams: 40 })
  })

  it('copies nameHe into nameEn when nameEn is blank on submit', () => {
    const { getByTestId, onSubmit } = setup()
    fillValidMacros(getByTestId)

    fireEvent.press(getByTestId('form-submit'))

    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.nameHe).toBe('פתיבר חלבון')
    expect(submitted.nameEn).toBe('פתיבר חלבון')
  })

  it('preserves user-entered nameEn when provided', () => {
    const { getByTestId, onSubmit } = setup()
    fillValidMacros(getByTestId)
    fillField(getByTestId, 'name-en', 'Protein Bar')

    fireEvent.press(getByTestId('form-submit'))

    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.nameEn).toBe('Protein Bar')
  })

  it('constructs FoodItem with id manual_<ean>, isUserCreated=true, category=snacks', () => {
    const { getByTestId, onSubmit } = setup()
    fillValidMacros(getByTestId)

    fireEvent.press(getByTestId('form-submit'))

    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.id).toBe(`manual_${EAN}`)
    expect(submitted.isUserCreated).toBe(true)
    expect(submitted.category).toBe('snacks')
    expect(submitted.caloriesPer100g).toBe(350)
    expect(submitted.proteinPer100g).toBe(30)
    expect(submitted.fatPer100g).toBe(10)
    expect(submitted.carbsPer100g).toBe(40)
    expect(submitted.fiberPer100g).toBe(0) // default
  })

  it('calls onCancel when cancel button is tapped', () => {
    const { getByTestId, onCancel } = setup()

    fireEvent.press(getByTestId('form-cancel'))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
