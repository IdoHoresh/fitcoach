import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { HomeHeader } from './HomeHeader'
import { t } from '@/i18n'

describe('HomeHeader', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders with testID', () => {
    render(<HomeHeader onAvatarPress={jest.fn()} testID="header" />)
    expect(screen.getByTestId('header')).toBeTruthy()
  })

  it('shows morning greeting at 8 AM', () => {
    jest.useFakeTimers({ now: new Date('2026-04-09T08:00:00') })
    render(<HomeHeader onAvatarPress={jest.fn()} testID="header" />)
    expect(screen.getByText(t().home.v2.greetingNoName.morning)).toBeTruthy()
  })

  it('shows afternoon greeting at 2 PM', () => {
    jest.useFakeTimers({ now: new Date('2026-04-09T14:00:00') })
    render(<HomeHeader onAvatarPress={jest.fn()} testID="header" />)
    expect(screen.getByText(t().home.v2.greetingNoName.afternoon)).toBeTruthy()
  })

  it('shows evening greeting at 8 PM', () => {
    jest.useFakeTimers({ now: new Date('2026-04-09T20:00:00') })
    render(<HomeHeader onAvatarPress={jest.fn()} testID="header" />)
    expect(screen.getByText(t().home.v2.greetingNoName.evening)).toBeTruthy()
  })

  it('shows night greeting at 2 AM', () => {
    jest.useFakeTimers({ now: new Date('2026-04-09T02:00:00') })
    render(<HomeHeader onAvatarPress={jest.fn()} testID="header" />)
    expect(screen.getByText(t().home.v2.greetingNoName.night)).toBeTruthy()
  })

  it('formats the date with weekday + day + month', () => {
    // 2026-04-09 is a Thursday (day 4 in JS getDay)
    jest.useFakeTimers({ now: new Date('2026-04-09T12:00:00') })
    render(<HomeHeader onAvatarPress={jest.fn()} testID="header" />)
    // Hebrew locale — the format is "יום {weekday}, {day} ב{month}"
    // Verify day number (9) and month name (אפריל) appear in the rendered text.
    expect(screen.getByTestId('header-date')).toHaveTextContent(/9/)
    expect(screen.getByTestId('header-date')).toHaveTextContent(/אפריל/)
  })

  it('calls onAvatarPress when the avatar is tapped', () => {
    jest.useFakeTimers({ now: new Date('2026-04-09T08:00:00') })
    const onAvatarPress = jest.fn()
    render(<HomeHeader onAvatarPress={onAvatarPress} testID="header" />)
    fireEvent.press(screen.getByTestId('header-avatar'))
    expect(onAvatarPress).toHaveBeenCalledTimes(1)
  })
})
