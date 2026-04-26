import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { SettingsRow } from './SettingsRow'

describe('SettingsRow', () => {
  const baseProps = {
    label: 'מצב יומן ארוחות',
    onPress: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders label and subtitle when both provided', () => {
    render(<SettingsRow {...baseProps} subtitle="תוכנית — יעד לכל ארוחה" />)
    expect(screen.getByText('מצב יומן ארוחות')).toBeTruthy()
    expect(screen.getByText('תוכנית — יעד לכל ארוחה')).toBeTruthy()
  })

  it('omits subtitle when not provided', () => {
    render(<SettingsRow {...baseProps} />)
    expect(screen.getByText('מצב יומן ארוחות')).toBeTruthy()
    expect(screen.queryByText('תוכנית — יעד לכל ארוחה')).toBeNull()
  })

  it('fires onPress when row is tapped', () => {
    const onPress = jest.fn()
    render(<SettingsRow {...baseProps} onPress={onPress} testID="settings-row" />)
    fireEvent.press(screen.getByTestId('settings-row'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('applies testID for navigation', () => {
    render(<SettingsRow {...baseProps} testID="settings-row" />)
    expect(screen.getByTestId('settings-row')).toBeTruthy()
  })
})
