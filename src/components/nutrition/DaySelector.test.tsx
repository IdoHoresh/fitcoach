/**
 * Tests for DaySelector component.
 * RED phase: written before the component exists.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { DaySelector } from './DaySelector'

const WEEK_DATES = [
  '2026-04-05', // Sun
  '2026-04-06', // Mon
  '2026-04-07', // Tue
  '2026-04-08', // Wed
  '2026-04-09', // Thu
  '2026-04-10', // Fri — today
  '2026-04-11', // Sat
]

const TODAY = '2026-04-10'

describe('DaySelector', () => {
  it('renders 7 day pills', () => {
    const { getAllByTestId } = render(
      <DaySelector
        selectedDate={TODAY}
        weekDates={WEEK_DATES}
        todayDate={TODAY}
        onDaySelect={jest.fn()}
        testID="day-selector"
      />,
    )
    const pills = getAllByTestId(/^day-selector-day-/)
    expect(pills).toHaveLength(7)
  })

  it('calls onDaySelect with the correct date when a pill is pressed', () => {
    const onDaySelect = jest.fn()
    const { getByTestId } = render(
      <DaySelector
        selectedDate={TODAY}
        weekDates={WEEK_DATES}
        todayDate={TODAY}
        onDaySelect={onDaySelect}
        testID="day-selector"
      />,
    )
    fireEvent.press(getByTestId('day-selector-day-2026-04-07'))
    expect(onDaySelect).toHaveBeenCalledWith('2026-04-07')
  })

  it('renders Hebrew day abbreviations', () => {
    const { getByTestId } = render(
      <DaySelector
        selectedDate={TODAY}
        weekDates={WEEK_DATES}
        todayDate={TODAY}
        onDaySelect={jest.fn()}
        testID="day-selector"
      />,
    )
    // Sunday = א׳
    expect(getByTestId('day-selector-label-2026-04-05')).toBeTruthy()
  })

  it('marks the selected date pill with a selected testID', () => {
    const { getByTestId } = render(
      <DaySelector
        selectedDate="2026-04-07"
        weekDates={WEEK_DATES}
        todayDate={TODAY}
        onDaySelect={jest.fn()}
        testID="day-selector"
      />,
    )
    expect(getByTestId('day-selector-selected-2026-04-07')).toBeTruthy()
  })

  it('marks today with a today testID', () => {
    const { getByTestId } = render(
      <DaySelector
        selectedDate={TODAY}
        weekDates={WEEK_DATES}
        todayDate={TODAY}
        onDaySelect={jest.fn()}
        testID="day-selector"
      />,
    )
    expect(getByTestId('day-selector-today-2026-04-10')).toBeTruthy()
  })
})
