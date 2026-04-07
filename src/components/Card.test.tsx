import React from 'react'
import { Text } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import * as Haptics from 'expo-haptics'
import { Card } from './Card'
import { colors } from '@/theme/colors'

describe('Card', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders children', () => {
      render(
        <Card>
          <Text>Content</Text>
        </Card>,
      )
      expect(screen.getByText('Content')).toBeTruthy()
    })
  })

  describe('variants', () => {
    it('default variant uses surface background', () => {
      render(
        <Card testID="card">
          <Text>Content</Text>
        </Card>,
      )
      expect(screen.getByTestId('card')).toHaveStyle({
        backgroundColor: colors.surface,
      })
    })

    it('elevated variant uses surfaceElevated background', () => {
      render(
        <Card variant="elevated" testID="card">
          <Text>Content</Text>
        </Card>,
      )
      expect(screen.getByTestId('card')).toHaveStyle({
        backgroundColor: colors.surfaceElevated,
      })
    })

    it('outlined variant uses transparent background with border', () => {
      render(
        <Card variant="outlined" testID="card">
          <Text>Content</Text>
        </Card>,
      )
      expect(screen.getByTestId('card')).toHaveStyle({
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
      })
    })
  })

  describe('pressable behavior', () => {
    it('calls onPress when pressed', () => {
      const onPress = jest.fn()
      render(
        <Card onPress={onPress} testID="card">
          <Text>Tap me</Text>
        </Card>,
      )
      fireEvent.press(screen.getByTestId('card'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('triggers haptic on press when onPress provided', () => {
      render(
        <Card onPress={jest.fn()} testID="card">
          <Text>Tap me</Text>
        </Card>,
      )
      fireEvent(screen.getByTestId('card'), 'pressIn')
      expect(Haptics.impactAsync).toHaveBeenCalled()
    })

    it('has button role when pressable', () => {
      render(
        <Card onPress={jest.fn()}>
          <Text>Tap me</Text>
        </Card>,
      )
      expect(screen.getByRole('button')).toBeTruthy()
    })

    it('is a plain view when no onPress', () => {
      render(
        <Card testID="card">
          <Text>Static</Text>
        </Card>,
      )
      expect(screen.queryByRole('button')).toBeNull()
      expect(screen.getByTestId('card')).toBeTruthy()
    })
  })
})
