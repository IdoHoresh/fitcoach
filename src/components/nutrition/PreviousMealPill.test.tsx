/**
 * Tests for PreviousMealPill.
 * Pure UI — renders the composed label and dispatches onPress.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { PreviousMealPill } from './PreviousMealPill'

describe('PreviousMealPill', () => {
  it('renders the composed label with meal and day interpolation', () => {
    const { getByText } = render(
      <PreviousMealPill
        mealTypeLabel="ארוחת בוקר"
        dayWord="אתמול"
        onPress={jest.fn()}
        testID="pill"
      />,
    )
    expect(getByText('אותה ארוחת בוקר כמו אתמול')).toBeTruthy()
  })

  it('renders a different day word when provided (walkback case)', () => {
    const { getByText } = render(
      <PreviousMealPill
        mealTypeLabel="ארוחת צהריים"
        dayWord="יום רביעי"
        onPress={jest.fn()}
        testID="pill"
      />,
    )
    expect(getByText('אותה ארוחת צהריים כמו יום רביעי')).toBeTruthy()
  })

  it('fires onPress when tapped', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <PreviousMealPill
        mealTypeLabel="ארוחת בוקר"
        dayWord="אתמול"
        onPress={onPress}
        testID="pill"
      />,
    )
    fireEvent.press(getByTestId('pill'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
