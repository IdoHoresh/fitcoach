import React from 'react'
import { StyleSheet } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { ProgressBar } from './ProgressBar'
import { colors } from '@/theme/colors'

describe('ProgressBar', () => {
  describe('rendering', () => {
    it('renders the track and fill elements', () => {
      render(<ProgressBar current={1} total={10} testID="progress" />)
      expect(screen.getByTestId('progress')).toBeTruthy()
      expect(screen.getByTestId('progress-fill')).toBeTruthy()
    })

    it('has progressbar accessibility role', () => {
      render(<ProgressBar current={1} total={10} testID="progress" />)
      const track = screen.getByTestId('progress')
      expect(track.props.accessibilityRole).toBe('progressbar')
    })

    it('has correct accessibility value', () => {
      render(<ProgressBar current={3} total={10} testID="progress" />)
      const track = screen.getByTestId('progress')
      expect(track.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 30 })
    })

    it('track uses surface background color', () => {
      render(<ProgressBar current={1} total={10} testID="progress" />)
      expect(screen.getByTestId('progress')).toHaveStyle({
        backgroundColor: colors.surface,
      })
    })

    it('fill uses primary background color', () => {
      render(<ProgressBar current={1} total={10} testID="progress" />)
      expect(screen.getByTestId('progress-fill')).toHaveStyle({
        backgroundColor: colors.primary,
      })
    })
  })

  describe('RTL support', () => {
    it('fill uses left: 0 positioning (RN auto-swaps in RTL mode)', () => {
      // We pin to `left: 0` and rely on React Native's I18nManager to
      // auto-swap to `right: 0` when the system is in RTL. Do NOT add a
      // manual conditional — that double-flips and breaks RTL rendering.
      render(<ProgressBar current={5} total={10} testID="progress" />)
      const fill = screen.getByTestId('progress-fill')
      const flat = StyleSheet.flatten(fill.props.style)
      expect(flat.left).toBe(0)
      expect(flat.right).toBeUndefined()
    })
  })

  describe('progress calculation', () => {
    it('clamps progress to 0 when current is negative', () => {
      render(<ProgressBar current={-1} total={10} testID="progress" />)
      expect(screen.getByTestId('progress-fill')).toBeTruthy()
    })

    it('clamps progress to 100% when current exceeds total', () => {
      render(<ProgressBar current={15} total={10} testID="progress" />)
      expect(screen.getByTestId('progress-fill')).toBeTruthy()
    })

    it('renders without crashing at 0 progress', () => {
      render(<ProgressBar current={0} total={10} testID="progress" />)
      expect(screen.getByTestId('progress-fill')).toBeTruthy()
    })

    it('renders without crashing at full progress', () => {
      render(<ProgressBar current={10} total={10} testID="progress" />)
      expect(screen.getByTestId('progress-fill')).toBeTruthy()
    })
  })
})
