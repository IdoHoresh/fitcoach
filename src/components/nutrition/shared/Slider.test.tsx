/**
 * Render-prop tests for the shared portion-slider primitive (A2).
 *
 * Gesture handling is NOT tested here — gesture/haptic wiring (Task 6) is
 * verified manually on device per lessons.md:101 (gesture & SVG-geometry
 * paths are not jest-testable).
 *
 * Coverage:
 *   - Header / pills / tick labels / hand icon / toggle render correctly
 *   - Toggle visibility is driven by the `variant` prop
 *   - Quick-pill press fires onChange with the tick's grams
 *   - Toggle press fires onVariantChange with the sibling food
 *   - Non-curated foods (no slug) fall back to servingSizes-derived ticks
 */

import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import type { FoodItem } from '@/types/nutrition'
import { Slider } from './Slider'

const chickenRaw: FoodItem = {
  id: 'food_001',
  slug: 'chicken_breast_raw',
  nameHe: 'חזה עוף (נא)',
  nameEn: 'Chicken Breast (raw)',
  category: 'protein',
  isUserCreated: false,
  caloriesPer100g: 120,
  proteinPer100g: 23,
  fatPer100g: 2.6,
  carbsPer100g: 0,
  fiberPer100g: 0,
  servingSizes: [{ nameHe: 'חזה אחד', nameEn: 'One breast', unit: 'piece', grams: 200 }],
}

const chickenCooked: FoodItem = {
  ...chickenRaw,
  id: 'food_002',
  slug: 'chicken_breast_cooked',
  nameHe: 'חזה עוף (מבושל)',
  nameEn: 'Chicken Breast (cooked)',
  caloriesPer100g: 165,
}

const orphanFood: FoodItem = {
  id: 'food_999',
  // No slug — represents a non-curated SQLite-seeded row (Shufersal/Rami Levy).
  nameHe: 'יוגורט תות דנונה',
  nameEn: 'Danone Strawberry Yogurt',
  category: 'dairy',
  isUserCreated: false,
  caloriesPer100g: 80,
  proteinPer100g: 4,
  fatPer100g: 1.5,
  carbsPer100g: 13,
  fiberPer100g: 0,
  servingSizes: [{ nameHe: 'גביע', nameEn: 'one tub', unit: 'piece', grams: 150 }],
}

describe('Slider', () => {
  it('renders the food name in the header', () => {
    const { getByText } = render(
      <Slider food={chickenRaw} grams={150} onChange={() => {}} testID="slider" />,
    )
    expect(getByText('חזה עוף (נא)')).toBeTruthy()
  })

  it('renders quick-pills for the primary ticks (max 3)', () => {
    // chicken_breast_raw primaries are at 150g, 200g, 300g.
    const { getAllByTestId } = render(
      <Slider food={chickenRaw} grams={150} onChange={() => {}} testID="slider" />,
    )
    const pills = getAllByTestId(/^slider-pill-/)
    expect(pills).toHaveLength(3)
  })

  it('renders dual-format labels (gram + natural name) on the tick row', () => {
    const { getByTestId, getAllByText } = render(
      <Slider food={chickenRaw} grams={200} onChange={() => {}} testID="slider" />,
    )
    expect(getByTestId('slider-tick-200')).toBeTruthy()
    // chicken_breast_raw curated entry has a 200g tick labeled 'חזה אחד'.
    // Same string can appear on the tick row AND on the (200g) quick-pill,
    // so use getAllByText.
    const matches = getAllByText('200 גר׳ · חזה אחד')
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders the hand-portion icon when the food has a hand-portion mapping', () => {
    // chicken_breast_raw → handPortion: 'palm'
    const { getByTestId } = render(
      <Slider food={chickenRaw} grams={150} onChange={() => {}} testID="slider" />,
    )
    expect(getByTestId('slider-hand-icon')).toBeTruthy()
  })

  it('omits the hand-portion icon when the food has no hand-portion mapping', () => {
    // orphanFood has no slug → no entry in SERVING_TICKS → no handPortion.
    const { queryByTestId } = render(
      <Slider food={orphanFood} grams={150} onChange={() => {}} testID="slider" />,
    )
    expect(queryByTestId('slider-hand-icon')).toBeNull()
  })

  it('renders the cooked/raw toggle when the variant prop is provided', () => {
    const { getByTestId } = render(
      <Slider
        food={chickenRaw}
        grams={150}
        onChange={() => {}}
        variant={{ food: chickenCooked, label: 'מבושל' }}
        onVariantChange={() => {}}
        testID="slider"
      />,
    )
    expect(getByTestId('slider-toggle')).toBeTruthy()
  })

  it('omits the cooked/raw toggle when the variant prop is undefined', () => {
    const { queryByTestId } = render(
      <Slider food={chickenRaw} grams={150} onChange={() => {}} testID="slider" />,
    )
    expect(queryByTestId('slider-toggle')).toBeNull()
  })

  it('calls onChange with the tick grams when a quick-pill is tapped', () => {
    const onChange = jest.fn()
    const { getByTestId } = render(
      <Slider food={chickenRaw} grams={150} onChange={onChange} testID="slider" />,
    )
    fireEvent.press(getByTestId('slider-pill-200'))
    expect(onChange).toHaveBeenCalledWith(200)
  })

  it('calls onVariantChange with the sibling food when the toggle is tapped', () => {
    const onVariantChange = jest.fn()
    const { getByTestId } = render(
      <Slider
        food={chickenRaw}
        grams={150}
        onChange={() => {}}
        variant={{ food: chickenCooked, label: 'מבושל' }}
        onVariantChange={onVariantChange}
        testID="slider"
      />,
    )
    fireEvent.press(getByTestId('slider-toggle-pill'))
    expect(onVariantChange).toHaveBeenCalledWith(chickenCooked)
  })

  it('falls back to servingSizes-derived ticks for foods with no slug', () => {
    // orphanFood has 1 servingSize (150g, gives 1 tick which is primary).
    const { getAllByTestId } = render(
      <Slider food={orphanFood} grams={150} onChange={() => {}} testID="slider" />,
    )
    const pills = getAllByTestId(/^slider-pill-/)
    expect(pills.length).toBeGreaterThan(0)
  })

  it('clamps the thumb position when grams is outside the tick range', () => {
    // chicken_breast_raw curated ticks span 50–300g. grams=0 below min;
    // grams=9999 above max. Both should render without crashing — the
    // thumb's left% is computed by computeThumbLeftPercent which clamps.
    const lowGrams = render(
      <Slider food={chickenRaw} grams={0} onChange={() => {}} testID="slider-low" />,
    )
    expect(lowGrams.getByTestId('slider-low-thumb')).toBeTruthy()

    const highGrams = render(
      <Slider food={chickenRaw} grams={9999} onChange={() => {}} testID="slider-high" />,
    )
    expect(highGrams.getByTestId('slider-high-thumb')).toBeTruthy()
  })

  it('renders the food name and stays mounted when food has empty servingSizes and no slug', () => {
    // Food with no slug AND no servingSizes — getServingTicks returns [].
    // Slider must not crash; quick-pills + tick-row are absent; food name
    // and thumb still render.
    const noTicksFood: FoodItem = {
      ...orphanFood,
      id: 'food_997',
      servingSizes: [],
    }
    const { getByText, getByTestId, queryAllByTestId } = render(
      <Slider food={noTicksFood} grams={100} onChange={() => {}} testID="slider" />,
    )
    expect(getByText(noTicksFood.nameHe)).toBeTruthy()
    expect(getByTestId('slider-thumb')).toBeTruthy()
    expect(queryAllByTestId(/^slider-pill-/)).toHaveLength(0)
    expect(queryAllByTestId(/^slider-tick-/)).toHaveLength(0)
  })

  it('exposes accessibilityValue on the thumb (min, max, now, text) for VoiceOver', () => {
    const { getByTestId } = render(
      <Slider food={chickenRaw} grams={150} onChange={() => {}} testID="slider" />,
    )
    const thumb = getByTestId('slider-thumb')
    // chicken_breast_raw curated ticks span 50–300g. Thumb at 150g.
    expect(thumb.props.accessibilityRole).toBe('adjustable')
    expect(thumb.props.accessibilityValue).toEqual(
      expect.objectContaining({ min: 50, max: 300, now: 150 }),
    )
    expect(typeof thumb.props.accessibilityValue.text).toBe('string')
    expect(thumb.props.accessibilityHint).toBeTruthy()
  })

  it('labels the active toggle pill with the current-selection prefix for VoiceOver', () => {
    const { UNSAFE_root } = render(
      <Slider
        food={chickenRaw}
        grams={150}
        onChange={() => {}}
        variant={{ food: chickenCooked, label: 'מבושל' }}
        onVariantChange={() => {}}
        testID="slider"
      />,
    )
    // chickenRaw → variantState = 'raw' → label is "<currentSelection>: <raw>"
    const labels = UNSAFE_root.findAll((node: { props?: Record<string, unknown> }) => {
      const label = node.props?.accessibilityLabel
      return typeof label === 'string' && label.includes('נא')
    })
    expect(labels.length).toBeGreaterThan(0)
  })
})
