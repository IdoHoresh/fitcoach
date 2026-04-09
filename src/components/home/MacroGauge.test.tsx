import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { MacroGauge, computeGaugeProgress } from './MacroGauge'

describe('computeGaugeProgress', () => {
  it('returns 0 when goalCalories is 0 (no division by zero)', () => {
    expect(computeGaugeProgress(500, 0)).toBe(0)
  })

  it('returns 0 when goalCalories is negative', () => {
    expect(computeGaugeProgress(500, -100)).toBe(0)
  })

  it('returns 0 when consumed is 0', () => {
    expect(computeGaugeProgress(0, 2400)).toBe(0)
  })

  it('returns 0.5 when consumed is half of goal', () => {
    expect(computeGaugeProgress(1200, 2400)).toBe(0.5)
  })

  it('returns 1 when consumed equals goal', () => {
    expect(computeGaugeProgress(2400, 2400)).toBe(1)
  })

  it('clamps to 1 when consumed exceeds goal', () => {
    expect(computeGaugeProgress(3000, 2400)).toBe(1)
  })

  it('clamps to 0 when consumed is negative', () => {
    expect(computeGaugeProgress(-100, 2400)).toBe(0)
  })
})

describe('MacroGauge', () => {
  it('renders with testID', () => {
    render(<MacroGauge consumedCalories={1200} goalCalories={2400} testID="gauge" />)
    expect(screen.getByTestId('gauge')).toBeTruthy()
  })

  it('displays the consumed and goal numbers', () => {
    render(<MacroGauge consumedCalories={1200} goalCalories={2400} testID="gauge" />)
    expect(screen.getByTestId('gauge-consumed')).toHaveTextContent('1,200')
    expect(screen.getByTestId('gauge-goal')).toHaveTextContent('2,400')
  })

  it('renders at zero-consumed state', () => {
    render(<MacroGauge consumedCalories={0} goalCalories={2400} testID="gauge" />)
    expect(screen.getByTestId('gauge-consumed')).toHaveTextContent('0')
    expect(screen.getByTestId('gauge-goal')).toHaveTextContent('2,400')
  })

  it('renders faded state when goalCalories is 0', () => {
    render(<MacroGauge consumedCalories={0} goalCalories={0} testID="gauge" />)
    // No crash, renders with a placeholder goal
    expect(screen.getByTestId('gauge')).toBeTruthy()
  })
})
