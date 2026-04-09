import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { WeekdayStreakStrip } from './WeekdayStreakStrip'
import { colors } from '@/theme/colors'
import type { DayOfWeek } from '@/types/user'

const defaultProps = {
  weekNumber: 1,
  completedThisWeek: 2,
  weeklyGoal: 4,
  completedDaysOfWeek: [0, 2] as readonly DayOfWeek[], // Sun + Tue
  todayDayOfWeek: 4 as DayOfWeek, // Thursday
}

describe('WeekdayStreakStrip', () => {
  it('renders with testID', () => {
    render(<WeekdayStreakStrip {...defaultProps} testID="strip" />)
    expect(screen.getByTestId('strip')).toBeTruthy()
  })

  it('renders 7 day circles', () => {
    render(<WeekdayStreakStrip {...defaultProps} testID="strip" />)
    for (let i = 0; i < 7; i++) {
      expect(screen.getByTestId(`strip-day-${i}`)).toBeTruthy()
    }
  })

  it("highlights today's circle with a teal ring", () => {
    render(<WeekdayStreakStrip {...defaultProps} testID="strip" />)
    // Today = Thursday = 4
    expect(screen.getByTestId('strip-day-4-today')).toBeTruthy()
  })

  it('fills completed-day circles', () => {
    render(<WeekdayStreakStrip {...defaultProps} testID="strip" />)
    // Completed days = Sun (0) + Tue (2)
    expect(screen.getByTestId('strip-day-0-completed')).toBeTruthy()
    expect(screen.getByTestId('strip-day-2-completed')).toBeTruthy()
    // Non-completed days should NOT have the "-completed" variant
    expect(screen.queryByTestId('strip-day-1-completed')).toBeNull()
    expect(screen.queryByTestId('strip-day-3-completed')).toBeNull()
  })

  it('renders the week label with interpolated values', () => {
    render(<WeekdayStreakStrip {...defaultProps} testID="strip" />)
    expect(screen.getByTestId('strip-week-label')).toHaveTextContent(/1/)
    expect(screen.getByTestId('strip-week-label')).toHaveTextContent(/2\/4/)
  })

  it('hides the week label in fresh-install mode (weekNumber is null)', () => {
    render(
      <WeekdayStreakStrip
        {...defaultProps}
        weekNumber={null}
        completedThisWeek={0}
        completedDaysOfWeek={[]}
        testID="strip"
      />,
    )
    expect(screen.queryByTestId('strip-week-label')).toBeNull()
  })

  it('still highlights today in fresh-install mode', () => {
    render(
      <WeekdayStreakStrip
        {...defaultProps}
        weekNumber={null}
        completedThisWeek={0}
        completedDaysOfWeek={[]}
        testID="strip"
      />,
    )
    expect(screen.getByTestId('strip-day-4-today')).toBeTruthy()
  })

  it('renders the flame icon container', () => {
    render(<WeekdayStreakStrip {...defaultProps} testID="strip" />)
    // Flame is an Ionicons element; verify its parent container is present
    expect(screen.getByTestId('strip-flame')).toBeTruthy()
  })

  it('uses the success color for completed-day circles (visual verification via style)', () => {
    render(<WeekdayStreakStrip {...defaultProps} testID="strip" />)
    expect(screen.getByTestId('strip-day-0-completed')).toHaveStyle({
      backgroundColor: colors.success,
    })
  })
})
