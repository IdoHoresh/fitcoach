import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import * as Haptics from 'expo-haptics'
import * as rtlModule from '@/hooks/rtl'
import { OptionSelector } from './OptionSelector'
import { colors } from '@/theme/colors'

const SELECTED_BG = colors.primary + '26'

describe('OptionSelector', () => {
  const options = [
    { id: 'muscle', label: 'Muscle Gain', icon: '💪' },
    { id: 'fat', label: 'Fat Loss', icon: '🔥' },
    { id: 'maintain', label: 'Maintenance', icon: '⚖️' },
  ]

  const optionsWithDesc = [
    { id: 'beginner', label: 'Beginner', description: 'New to training' },
    { id: 'intermediate', label: 'Intermediate', description: '1+ years experience' },
  ]

  const defaultProps = {
    options,
    selected: 'muscle',
    onSelect: jest.fn(),
    layout: 'grid' as const,
    testID: 'goal',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(rtlModule, 'isRTL').mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // ── Rendering ──

  describe('rendering', () => {
    it('renders all option labels', () => {
      render(<OptionSelector {...defaultProps} />)
      expect(screen.getByText('Muscle Gain')).toBeTruthy()
      expect(screen.getByText('Fat Loss')).toBeTruthy()
      expect(screen.getByText('Maintenance')).toBeTruthy()
    })

    it('renders icon when provided', () => {
      render(<OptionSelector {...defaultProps} />)
      expect(screen.getByText('💪')).toBeTruthy()
      expect(screen.getByText('🔥')).toBeTruthy()
    })

    it('renders description when provided', () => {
      render(
        <OptionSelector
          {...defaultProps}
          options={optionsWithDesc}
          selected="beginner"
          layout="list"
        />,
      )
      expect(screen.getByText('New to training')).toBeTruthy()
      expect(screen.getByText('1+ years experience')).toBeTruthy()
    })

    it('does not render description element when not provided', () => {
      render(<OptionSelector {...defaultProps} />)
      expect(screen.queryByTestId('goal-option-muscle-description')).toBeNull()
    })
  })

  // ── Layout ──

  describe('layout', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('grid layout uses row direction in LTR', () => {
      jest.spyOn(rtlModule, 'isRTL').mockReturnValue(false)
      render(<OptionSelector {...defaultProps} layout="grid" />)
      const container = screen.getByTestId('goal-container')
      expect(container).toHaveStyle({ flexDirection: 'row', flexWrap: 'wrap' })
    })

    it('grid layout uses row-reverse in RTL', () => {
      jest.spyOn(rtlModule, 'isRTL').mockReturnValue(true)
      render(<OptionSelector {...defaultProps} layout="grid" />)
      const container = screen.getByTestId('goal-container')
      expect(container).toHaveStyle({ flexDirection: 'row-reverse', flexWrap: 'wrap' })
    })

    it('list layout uses column direction', () => {
      render(<OptionSelector {...defaultProps} layout="list" />)
      const container = screen.getByTestId('goal-container')
      expect(container).toHaveStyle({ flexDirection: 'column' })
    })
  })

  // ── Selection ──

  describe('selection', () => {
    it('calls onSelect with option id when pressed', () => {
      render(<OptionSelector {...defaultProps} />)
      fireEvent(screen.getByTestId('goal-option-fat'), 'pressIn')
      expect(defaultProps.onSelect).toHaveBeenCalledWith('fat')
    })

    it('selected option has primary tinted background', () => {
      render(<OptionSelector {...defaultProps} selected="muscle" />)
      expect(screen.getByTestId('goal-option-muscle')).toHaveStyle({
        backgroundColor: SELECTED_BG,
      })
    })

    it('selected option has primary border color', () => {
      render(<OptionSelector {...defaultProps} selected="muscle" />)
      expect(screen.getByTestId('goal-option-muscle')).toHaveStyle({
        borderColor: colors.primary,
      })
    })

    it('unselected option has surface background', () => {
      render(<OptionSelector {...defaultProps} selected="muscle" />)
      expect(screen.getByTestId('goal-option-fat')).toHaveStyle({
        backgroundColor: colors.surface,
      })
    })

    it('unselected option has border color', () => {
      render(<OptionSelector {...defaultProps} selected="muscle" />)
      expect(screen.getByTestId('goal-option-fat')).toHaveStyle({
        borderColor: colors.border,
      })
    })
  })

  // ── Haptics ──

  describe('haptics', () => {
    it('triggers haptic feedback on select', () => {
      render(<OptionSelector {...defaultProps} />)
      fireEvent(screen.getByTestId('goal-option-fat'), 'pressIn')
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
    })
  })

  // ── Accessibility ──

  describe('accessibility', () => {
    it('each option has accessibilityRole radio', () => {
      render(<OptionSelector {...defaultProps} />)
      const option = screen.getByTestId('goal-option-muscle')
      expect(option.props.accessibilityRole).toBe('radio')
    })

    it('selected option has accessibilityState selected true', () => {
      render(<OptionSelector {...defaultProps} selected="muscle" />)
      const option = screen.getByTestId('goal-option-muscle')
      expect(option.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }))
    })

    it('unselected option has accessibilityState selected false', () => {
      render(<OptionSelector {...defaultProps} selected="muscle" />)
      const option = screen.getByTestId('goal-option-fat')
      expect(option.props.accessibilityState).toEqual(expect.objectContaining({ selected: false }))
    })

    it('each option has accessibilityLabel matching label', () => {
      render(<OptionSelector {...defaultProps} />)
      const option = screen.getByTestId('goal-option-muscle')
      expect(option.props.accessibilityLabel).toBe('Muscle Gain')
    })
  })

  // ── RTL Support ──

  describe('RTL support', () => {
    it('renders in RTL mode without crashing', () => {
      jest.spyOn(rtlModule, 'isRTL').mockReturnValue(true)
      render(<OptionSelector {...defaultProps} />)
      expect(screen.getByText('Muscle Gain')).toBeTruthy()
    })
  })
})
