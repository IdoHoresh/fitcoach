import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { StepProgressHeader } from './StepProgressHeader'

describe('StepProgressHeader', () => {
  it('computes rounded percentage from step/total', () => {
    render(<StepProgressHeader step={1} total={11} testID="progress" />)
    expect(screen.getByText('9%')).toBeTruthy()
  })

  it('renders interpolated step label', () => {
    render(<StepProgressHeader step={3} total={11} testID="progress" />)
    expect(screen.getByText(/3/)).toBeTruthy()
    expect(screen.getByText(/11/)).toBeTruthy()
  })

  it('sets fill width to computed percent', () => {
    render(<StepProgressHeader step={2} total={10} testID="progress" />)
    expect(screen.getByTestId('progress-fill')).toHaveStyle({ width: '20%' })
  })

  it('caps at 100% when step equals total', () => {
    render(<StepProgressHeader step={11} total={11} testID="progress" />)
    expect(screen.getByText('100%')).toBeTruthy()
  })
})
