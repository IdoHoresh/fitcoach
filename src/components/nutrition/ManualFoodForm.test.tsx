/**
 * ManualFoodForm tests.
 * Pure component test — no DB, no network, no camera.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ManualFoodForm } from './ManualFoodForm'
import type { FoodItem } from '@/types'

jest.mock('expo-crypto', () => ({
  randomUUID: () => '00000000-0000-0000-0000-000000000000',
}))

const EAN = '7290000066318'

function setup(props: Partial<React.ComponentProps<typeof ManualFoodForm>> = {}) {
  const onSubmit = jest.fn<void, [FoodItem]>()
  const onCancel = jest.fn()
  const utils = render(
    <ManualFoodForm ean={EAN} onSubmit={onSubmit} onCancel={onCancel} testID="form" {...props} />,
  )
  return { ...utils, onSubmit, onCancel }
}

function setupNoEan(props: Omit<React.ComponentProps<typeof ManualFoodForm>, 'ean'> | object = {}) {
  const onSubmit = jest.fn<void, [FoodItem]>()
  const onCancel = jest.fn()
  const utils = render(
    <ManualFoodForm onSubmit={onSubmit} onCancel={onCancel} testID="form" {...(props as object)} />,
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

  it('renders quick-pick chips for common Hebrew serving units', () => {
    const { getByTestId } = setup()
    expect(getByTestId('form-serving-chip-יחידה')).toBeTruthy()
    expect(getByTestId('form-serving-chip-פרוסה')).toBeTruthy()
    expect(getByTestId('form-serving-chip-כוס')).toBeTruthy()
    expect(getByTestId('form-serving-chip-כף')).toBeTruthy()
  })

  it('tapping a quick-pick chip fills the serving-name field', () => {
    const { getByTestId } = setup()
    expect(getByTestId('form-serving-name-field').props.value).toBe('')

    fireEvent.press(getByTestId('form-serving-chip-פרוסה'))

    expect(getByTestId('form-serving-name-field').props.value).toBe('פרוסה')
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

describe('ManualFoodForm — auto-calculate calories', () => {
  it('auto-fills calories with Atwater estimate when all three macros are entered', () => {
    const { getByTestId } = setup()
    fireEvent.changeText(getByTestId('form-name-he-field'), 'מוצר')
    fireEvent.changeText(getByTestId('form-protein-field'), '10')
    fireEvent.changeText(getByTestId('form-fat-field'), '5')
    fireEvent.changeText(getByTestId('form-carbs-field'), '20')

    // Expected: 4*10 + 9*5 + 4*20 = 165
    expect(getByTestId('form-calories-field').props.value).toBe('165')
  })

  it('does not auto-fill calories if the user typed calories first', () => {
    const { getByTestId } = setup()
    fireEvent.changeText(getByTestId('form-calories-field'), '500')
    fireEvent.changeText(getByTestId('form-protein-field'), '10')
    fireEvent.changeText(getByTestId('form-fat-field'), '5')
    fireEvent.changeText(getByTestId('form-carbs-field'), '20')

    // Calories remains at user's typed value, not the Atwater 165
    expect(getByTestId('form-calories-field').props.value).toBe('500')
  })

  it('stops auto-filling after user manually edits the auto-filled calories', () => {
    const { getByTestId } = setup()
    fireEvent.changeText(getByTestId('form-protein-field'), '10')
    fireEvent.changeText(getByTestId('form-fat-field'), '5')
    fireEvent.changeText(getByTestId('form-carbs-field'), '20')
    // Auto-filled to 165
    expect(getByTestId('form-calories-field').props.value).toBe('165')

    // User overrides to match a label-printed rounded value
    fireEvent.changeText(getByTestId('form-calories-field'), '170')
    expect(getByTestId('form-calories-field').props.value).toBe('170')

    // Further macro edits do NOT overwrite user's 170
    fireEvent.changeText(getByTestId('form-carbs-field'), '25')
    expect(getByTestId('form-calories-field').props.value).toBe('170')
  })

  it('rounds the Atwater estimate to the nearest whole kcal', () => {
    const { getByTestId } = setup()
    // 4*3.5 + 9*2.5 + 4*7 = 14 + 22.5 + 28 = 64.5 → rounds to 65
    fireEvent.changeText(getByTestId('form-protein-field'), '3.5')
    fireEvent.changeText(getByTestId('form-fat-field'), '2.5')
    fireEvent.changeText(getByTestId('form-carbs-field'), '7')

    expect(getByTestId('form-calories-field').props.value).toBe('65')
  })
})

describe('ManualFoodForm — flat layout + blank macros', () => {
  it('renders a "values per 100g" section header above the macro fields', () => {
    const { getByTestId } = setup()
    expect(getByTestId('form-per-100g-header')).toBeTruthy()
  })

  it('renders all fields inline — EN name, fiber, serving fields visible by default', () => {
    const { getByTestId } = setup()
    expect(getByTestId('form-name-en-field')).toBeTruthy()
    expect(getByTestId('form-fiber-field')).toBeTruthy()
    expect(getByTestId('form-serving-name-field')).toBeTruthy()
    expect(getByTestId('form-serving-grams-field')).toBeTruthy()
  })

  it('submits with macros = 0 when all three macro fields are left blank', () => {
    const { getByTestId, onSubmit } = setup()
    fireEvent.changeText(getByTestId('form-name-he-field'), 'מאפה')
    fireEvent.changeText(getByTestId('form-calories-field'), '400')
    // Leave protein/fat/carbs blank — valid, submit should succeed

    fireEvent.press(getByTestId('form-submit'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.caloriesPer100g).toBe(400)
    expect(submitted.proteinPer100g).toBe(0)
    expect(submitted.fatPer100g).toBe(0)
    expect(submitted.carbsPer100g).toBe(0)
  })

  it('submits partial macros (only protein filled) with the rest as 0', () => {
    const { getByTestId, onSubmit } = setup()
    fireEvent.changeText(getByTestId('form-name-he-field'), 'עוגה')
    fireEvent.changeText(getByTestId('form-calories-field'), '300')
    fireEvent.changeText(getByTestId('form-protein-field'), '5')
    // Leave fat and carbs blank

    fireEvent.press(getByTestId('form-submit'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.proteinPer100g).toBe(5)
    expect(submitted.fatPer100g).toBe(0)
    expect(submitted.carbsPer100g).toBe(0)
  })

  it('still requires calories > 0 when macros are blank', () => {
    const { getByTestId, onSubmit } = setup()
    fireEvent.changeText(getByTestId('form-name-he-field'), 'מאפה')
    // Leave everything else blank

    fireEvent.press(getByTestId('form-submit'))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(getByTestId('form-calories-error')).toBeTruthy()
  })
})

describe('ManualFoodForm — no-EAN mode (text-search entry point)', () => {
  it('renders the EAN input field inline when ean prop is undefined', () => {
    const { getByTestId } = setupNoEan()
    expect(getByTestId('form-ean-input-field')).toBeTruthy()
  })

  it('does NOT render the read-only EAN row when ean prop is undefined', () => {
    const { queryByTestId } = setupNoEan()
    expect(queryByTestId('form-ean-display')).toBeNull()
  })

  it('prefills nameHe from initialNameHe prop', () => {
    const { getByTestId } = setupNoEan({ initialNameHe: 'פתיבר ביתי' })
    expect(getByTestId('form-name-he-field').props.value).toBe('פתיבר ביתי')
  })

  it('does NOT prefill nameHe when initialNameHe is undefined', () => {
    const { getByTestId } = setupNoEan()
    expect(getByTestId('form-name-he-field').props.value).toBe('')
  })

  it('submits with id manual_<uuid> when EAN field is left blank', () => {
    const { getByTestId, onSubmit } = setupNoEan()
    fireEvent.changeText(getByTestId('form-name-he-field'), 'מוצר ידני')
    fireEvent.changeText(getByTestId('form-calories-field'), '350')
    fireEvent.changeText(getByTestId('form-protein-field'), '30')
    fireEvent.changeText(getByTestId('form-fat-field'), '10')
    fireEvent.changeText(getByTestId('form-carbs-field'), '40')

    fireEvent.press(getByTestId('form-submit'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.id).toBe('manual_00000000-0000-0000-0000-000000000000')
  })

  it('submits with id manual_<digits> when EAN field has typed digits (expander opened)', () => {
    const { getByTestId, onSubmit } = setupNoEan()
    fireEvent.changeText(getByTestId('form-name-he-field'), 'מוצר ידני')
    fireEvent.changeText(getByTestId('form-ean-input-field'), '7290012345678')
    fireEvent.changeText(getByTestId('form-calories-field'), '350')
    fireEvent.changeText(getByTestId('form-protein-field'), '30')
    fireEvent.changeText(getByTestId('form-fat-field'), '10')
    fireEvent.changeText(getByTestId('form-carbs-field'), '40')

    fireEvent.press(getByTestId('form-submit'))

    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.id).toBe('manual_7290012345678')
  })

  it('strips non-digit characters from typed EAN before constructing id', () => {
    const { getByTestId, onSubmit } = setupNoEan()
    fireEvent.changeText(getByTestId('form-name-he-field'), 'מוצר ידני')
    fireEvent.changeText(getByTestId('form-ean-input-field'), '7290 0123 45678')
    fireEvent.changeText(getByTestId('form-calories-field'), '350')
    fireEvent.changeText(getByTestId('form-protein-field'), '30')
    fireEvent.changeText(getByTestId('form-fat-field'), '10')
    fireEvent.changeText(getByTestId('form-carbs-field'), '40')

    fireEvent.press(getByTestId('form-submit'))

    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.id).toBe('manual_7290012345678')
  })

  it('falls through to manual_<uuid> when typed EAN has no digits', () => {
    const { getByTestId, onSubmit } = setupNoEan()
    fireEvent.changeText(getByTestId('form-name-he-field'), 'מוצר ידני')
    fireEvent.changeText(getByTestId('form-ean-input-field'), 'abc')
    fireEvent.changeText(getByTestId('form-calories-field'), '350')
    fireEvent.changeText(getByTestId('form-protein-field'), '30')
    fireEvent.changeText(getByTestId('form-fat-field'), '10')
    fireEvent.changeText(getByTestId('form-carbs-field'), '40')

    fireEvent.press(getByTestId('form-submit'))

    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.id).toBe('manual_00000000-0000-0000-0000-000000000000')
  })
})
