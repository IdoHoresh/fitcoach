import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { PlanRow } from './PlanRow'
import type { PlanItem } from '@/utils/buildTodaysPlan'

function makeItem(overrides: Partial<PlanItem> = {}): PlanItem {
  return {
    kind: 'meal',
    id: 'breakfast',
    labelKey: 'breakfast',
    secondaryLabel: null,
    calories: 320,
    durationMinutes: null,
    done: false,
    isNext: false,
    routeTarget: 'nutrition',
    ...overrides,
  }
}

describe('PlanRow', () => {
  describe('done state', () => {
    it('shows check indicator when done', () => {
      render(<PlanRow item={makeItem({ done: true })} onPress={jest.fn()} testID="row" />)
      expect(screen.getByTestId('row-check')).toBeTruthy()
    })

    it('does not render the next pill when done', () => {
      render(<PlanRow item={makeItem({ done: true })} onPress={jest.fn()} testID="row" />)
      expect(screen.queryByTestId('row-next-pill')).toBeNull()
    })
  })

  describe('pending state (not next)', () => {
    it('shows empty circle indicator', () => {
      render(
        <PlanRow
          item={makeItem({ done: false, isNext: false })}
          onPress={jest.fn()}
          testID="row"
        />,
      )
      expect(screen.getByTestId('row-pending-circle')).toBeTruthy()
    })

    it('does not render the next pill', () => {
      render(
        <PlanRow
          item={makeItem({ done: false, isNext: false })}
          onPress={jest.fn()}
          testID="row"
        />,
      )
      expect(screen.queryByTestId('row-next-pill')).toBeNull()
    })
  })

  describe('next state', () => {
    it('renders a visible next-state marker', () => {
      render(<PlanRow item={makeItem({ isNext: true })} onPress={jest.fn()} testID="row" />)
      expect(screen.getByTestId('row-next-pill')).toBeTruthy()
    })

    it('uses the Log pill label for meal rows', () => {
      render(
        <PlanRow
          item={makeItem({ kind: 'meal', isNext: true })}
          onPress={jest.fn()}
          testID="row"
        />,
      )
      expect(screen.getByTestId('row-next-pill')).toHaveTextContent(/רשום|Log/)
    })

    it('uses the Start pill label for workout rows', () => {
      const item = makeItem({
        kind: 'workout',
        id: 'workout',
        labelKey: 'workout',
        secondaryLabel: 'Push A',
        durationMinutes: 45,
        calories: null,
        routeTarget: 'workout',
        isNext: true,
      })
      render(<PlanRow item={item} onPress={jest.fn()} testID="row" />)
      expect(screen.getByTestId('row-next-pill')).toHaveTextContent(/התחל|Start/)
    })
  })

  describe('rest day state', () => {
    const restItem = makeItem({
      kind: 'rest',
      id: 'rest',
      labelKey: 'restDay',
      calories: null,
      routeTarget: null,
    })

    it('renders a rest-day row', () => {
      render(<PlanRow item={restItem} onPress={jest.fn()} testID="row" />)
      expect(screen.getByTestId('row')).toBeTruthy()
    })

    it('does NOT call onPress when tapped (rest row is non-interactive)', () => {
      const onPress = jest.fn()
      render(<PlanRow item={restItem} onPress={onPress} testID="row" />)
      fireEvent.press(screen.getByTestId('row'))
      expect(onPress).not.toHaveBeenCalled()
    })

    it('is never marked as next', () => {
      // Even if someone constructs a rest item with isNext=true (shouldn't happen
      // via buildTodaysPlan), the component should never render a next pill.
      render(<PlanRow item={{ ...restItem, isNext: true }} onPress={jest.fn()} testID="row" />)
      expect(screen.queryByTestId('row-next-pill')).toBeNull()
    })
  })

  describe('ghost state', () => {
    const ghostItem = makeItem({
      kind: 'ghost',
      id: 'ghost-meal-0',
      labelKey: 'ghostMeal',
      calories: null,
      routeTarget: 'onboarding',
    })

    it('renders as a ghost row (muted via opacity)', () => {
      render(<PlanRow item={ghostItem} onPress={jest.fn()} testID="row" />)
      // Ghost rows are visually identified by reduced opacity on the row itself.
      const row = screen.getByTestId('row')
      expect(row).toHaveStyle({ opacity: 0.45 })
    })

    it('calls onPress when tapped (ghost rows are interactive)', () => {
      const onPress = jest.fn()
      render(<PlanRow item={ghostItem} onPress={onPress} testID="row" />)
      fireEvent.press(screen.getByTestId('row'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })
  })

  describe('interaction', () => {
    it('calls onPress when a meal row is tapped', () => {
      const onPress = jest.fn()
      render(<PlanRow item={makeItem()} onPress={onPress} testID="row" />)
      fireEvent.press(screen.getByTestId('row'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('calls onPress when the next pill is tapped', () => {
      const onPress = jest.fn()
      render(<PlanRow item={makeItem({ isNext: true })} onPress={onPress} testID="row" />)
      fireEvent.press(screen.getByTestId('row-next-pill'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })
  })

  describe('calorie display', () => {
    it('shows the calorie target for meal rows', () => {
      render(<PlanRow item={makeItem({ calories: 320 })} onPress={jest.fn()} testID="row" />)
      expect(screen.getByTestId('row-calories')).toHaveTextContent(/320/)
    })

    it('prefixes with ~ when meal is pending', () => {
      render(
        <PlanRow
          item={makeItem({ calories: 600, done: false })}
          onPress={jest.fn()}
          testID="row"
        />,
      )
      expect(screen.getByTestId('row-calories')).toHaveTextContent(/~.*600/)
    })

    it('does NOT prefix with ~ when meal is done', () => {
      render(
        <PlanRow item={makeItem({ calories: 320, done: true })} onPress={jest.fn()} testID="row" />,
      )
      expect(screen.getByTestId('row-calories')).toHaveTextContent('320 קל׳')
    })

    it('shows duration for workout rows instead of calories', () => {
      const item = makeItem({
        kind: 'workout',
        id: 'workout',
        labelKey: 'workout',
        secondaryLabel: 'Push A',
        durationMinutes: 45,
        calories: null,
        routeTarget: 'workout',
      })
      render(<PlanRow item={item} onPress={jest.fn()} testID="row" />)
      expect(screen.getByTestId('row-duration')).toHaveTextContent(/45/)
    })
  })
})
