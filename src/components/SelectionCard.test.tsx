import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { SelectionCard } from './SelectionCard'
import { colors } from '@/theme/colors'

describe('SelectionCard', () => {
  const baseProps = {
    title: 'Build Muscle',
    description: 'Increase muscle mass',
    emoji: '💪',
    onPress: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders title, description, and emoji together', () => {
    render(<SelectionCard {...baseProps} selected={false} />)
    expect(screen.getByText('Build Muscle 💪')).toBeTruthy()
    expect(screen.getByText('Increase muscle mass')).toBeTruthy()
  })

  it('applies selected styles when selected', () => {
    render(<SelectionCard {...baseProps} selected testID="goal-card" />)
    expect(screen.getByTestId('goal-card')).toHaveStyle({
      borderColor: colors.primary,
    })
  })

  it('applies unselected styles when not selected', () => {
    render(<SelectionCard {...baseProps} selected={false} testID="goal-card" />)
    expect(screen.getByTestId('goal-card')).toHaveStyle({
      borderColor: 'transparent',
    })
  })

  it('calls onPress when tapped', () => {
    const onPress = jest.fn()
    render(<SelectionCard {...baseProps} onPress={onPress} selected={false} testID="goal-card" />)
    fireEvent.press(screen.getByTestId('goal-card'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('exposes radio accessibility state', () => {
    render(<SelectionCard {...baseProps} selected testID="goal-card" />)
    const card = screen.getByTestId('goal-card')
    expect(card.props.accessibilityRole).toBe('radio')
    expect(card.props.accessibilityState.selected).toBe(true)
  })
})
