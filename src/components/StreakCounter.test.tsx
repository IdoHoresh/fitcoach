import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { StreakCounter } from './StreakCounter'
import { colors } from '@/theme/colors'

describe('StreakCounter', () => {
  describe('rendering', () => {
    it('renders with testID', () => {
      render(
        <StreakCounter completedThisWeek={2} weeklyGoal={4} currentStreak={3} testID="streak" />,
      )
      expect(screen.getByTestId('streak')).toBeTruthy()
    })

    it('displays completed/goal ratio', () => {
      render(
        <StreakCounter completedThisWeek={2} weeklyGoal={4} currentStreak={0} testID="streak" />,
      )
      expect(screen.getByText('2/4')).toBeTruthy()
    })

    it('displays current streak number', () => {
      render(
        <StreakCounter completedThisWeek={3} weeklyGoal={3} currentStreak={5} testID="streak" />,
      )
      expect(screen.getByTestId('streak-count')).toHaveTextContent('5')
    })

    it('renders exactly seven day dots', () => {
      render(
        <StreakCounter completedThisWeek={2} weeklyGoal={4} currentStreak={0} testID="streak" />,
      )
      for (let i = 0; i < 7; i++) {
        expect(screen.getByTestId(`streak-dot-${i}`)).toBeTruthy()
      }
    })
  })

  describe('dot states', () => {
    it('fills dots up to completedThisWeek count', () => {
      render(
        <StreakCounter completedThisWeek={3} weeklyGoal={5} currentStreak={0} testID="streak" />,
      )
      // First 3 dots filled
      expect(screen.getByTestId('streak-dot-0')).toHaveStyle({ backgroundColor: colors.success })
      expect(screen.getByTestId('streak-dot-1')).toHaveStyle({ backgroundColor: colors.success })
      expect(screen.getByTestId('streak-dot-2')).toHaveStyle({ backgroundColor: colors.success })
      // Remaining dots empty
      expect(screen.getByTestId('streak-dot-3')).toHaveStyle({ backgroundColor: colors.surface })
      expect(screen.getByTestId('streak-dot-6')).toHaveStyle({ backgroundColor: colors.surface })
    })

    it('fills all seven dots when completed equals seven', () => {
      render(
        <StreakCounter completedThisWeek={7} weeklyGoal={5} currentStreak={0} testID="streak" />,
      )
      for (let i = 0; i < 7; i++) {
        expect(screen.getByTestId(`streak-dot-${i}`)).toHaveStyle({
          backgroundColor: colors.success,
        })
      }
    })

    it('leaves all dots empty when nothing completed', () => {
      render(
        <StreakCounter completedThisWeek={0} weeklyGoal={3} currentStreak={0} testID="streak" />,
      )
      for (let i = 0; i < 7; i++) {
        expect(screen.getByTestId(`streak-dot-${i}`)).toHaveStyle({
          backgroundColor: colors.surface,
        })
      }
    })

    it('caps displayed fill at seven dots even if completed exceeds seven', () => {
      render(
        <StreakCounter completedThisWeek={99} weeklyGoal={3} currentStreak={0} testID="streak" />,
      )
      for (let i = 0; i < 7; i++) {
        expect(screen.getByTestId(`streak-dot-${i}`)).toHaveStyle({
          backgroundColor: colors.success,
        })
      }
    })
  })
})
