import React from 'react'
import { Text } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ModeCard } from './ModeCard'
import { colors } from '@/theme/colors'

describe('ModeCard', () => {
  const baseProps = {
    title: 'אני רוצה תוכנית',
    subtitle: 'יעד לכל ארוחה · מנחה אותך שלב שלב',
    calloutLabel: 'יעד לארוחה',
    infoAccessibilityLabel: 'מידע נוסף',
    preview: <Text>PREVIEW</Text>,
    onPress: jest.fn(),
    onInfoPress: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders title, subtitle, and preview', () => {
    render(<ModeCard {...baseProps} selected={false} />)
    expect(screen.getByText('אני רוצה תוכנית')).toBeTruthy()
    expect(screen.getByText('יעד לכל ארוחה · מנחה אותך שלב שלב')).toBeTruthy()
    expect(screen.getByText('PREVIEW')).toBeTruthy()
  })

  it('renders callout label only when selected', () => {
    const { rerender } = render(<ModeCard {...baseProps} selected={false} />)
    expect(screen.queryByText('יעד לארוחה')).toBeNull()
    rerender(<ModeCard {...baseProps} selected />)
    expect(screen.getByText('יעד לארוחה')).toBeTruthy()
  })

  it('applies selected styles when selected', () => {
    render(<ModeCard {...baseProps} selected testID="mode-card" />)
    expect(screen.getByTestId('mode-card')).toHaveStyle({ borderColor: colors.primary })
  })

  it('applies unselected styles when not selected', () => {
    render(<ModeCard {...baseProps} selected={false} testID="mode-card" />)
    expect(screen.getByTestId('mode-card')).toHaveStyle({ borderColor: 'transparent' })
  })

  it('calls onPress when the card is tapped', () => {
    const onPress = jest.fn()
    render(<ModeCard {...baseProps} onPress={onPress} selected={false} testID="mode-card" />)
    fireEvent.press(screen.getByTestId('mode-card'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('calls onInfoPress when the info button is tapped, without firing onPress', () => {
    const onPress = jest.fn()
    const onInfoPress = jest.fn()
    render(
      <ModeCard
        {...baseProps}
        onPress={onPress}
        onInfoPress={onInfoPress}
        selected={false}
        testID="mode-card"
      />,
    )
    fireEvent.press(screen.getByTestId('mode-card-info'))
    expect(onInfoPress).toHaveBeenCalledTimes(1)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('exposes radio accessibility state with selection and hint', () => {
    render(<ModeCard {...baseProps} selected testID="mode-card" />)
    const card = screen.getByTestId('mode-card')
    expect(card.props.accessibilityRole).toBe('radio')
    expect(card.props.accessibilityState.selected).toBe(true)
    expect(card.props.accessibilityHint).toBe(baseProps.subtitle)
  })
})
