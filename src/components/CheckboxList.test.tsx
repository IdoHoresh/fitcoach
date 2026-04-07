import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import * as Haptics from 'expo-haptics'
import * as rtlModule from '@/hooks/rtl'
import { CheckboxList } from './CheckboxList'

describe('CheckboxList', () => {
  const options = [
    { id: 'barbell', label: 'Barbell', icon: '🏋️' },
    { id: 'dumbbells', label: 'Dumbbells', icon: '💪' },
    { id: 'cables', label: 'Cable Machine', icon: '🔗' },
    { id: 'pullup', label: 'Pull-up Bar', icon: '🔩' },
  ]

  const defaultProps = {
    options,
    selected: ['barbell'],
    onToggle: jest.fn(),
    testID: 'equipment',
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
      render(<CheckboxList {...defaultProps} />)
      expect(screen.getByText('Barbell')).toBeTruthy()
      expect(screen.getByText('Dumbbells')).toBeTruthy()
      expect(screen.getByText('Cable Machine')).toBeTruthy()
      expect(screen.getByText('Pull-up Bar')).toBeTruthy()
    })

    it('renders icon when provided', () => {
      render(<CheckboxList {...defaultProps} />)
      expect(screen.getByText('🏋️')).toBeTruthy()
      expect(screen.getByText('💪')).toBeTruthy()
    })

    it('renders select all row when showSelectAll is true', () => {
      render(<CheckboxList {...defaultProps} showSelectAll={true} />)
      expect(screen.getByTestId('equipment-select-all')).toBeTruthy()
    })

    it('renders select all row by default', () => {
      render(<CheckboxList {...defaultProps} />)
      expect(screen.getByTestId('equipment-select-all')).toBeTruthy()
    })

    it('does not render select all row when showSelectAll is false', () => {
      render(<CheckboxList {...defaultProps} showSelectAll={false} />)
      expect(screen.queryByTestId('equipment-select-all')).toBeNull()
    })
  })

  // ── Selection ──

  describe('selection', () => {
    it('calls onToggle with option id when row pressed', () => {
      render(<CheckboxList {...defaultProps} />)
      fireEvent(screen.getByTestId('equipment-option-dumbbells'), 'pressIn')
      expect(defaultProps.onToggle).toHaveBeenCalledWith('dumbbells')
    })

    it('selected items show checkmark', () => {
      render(<CheckboxList {...defaultProps} selected={['barbell']} />)
      expect(screen.getByTestId('equipment-checkmark-barbell')).toBeTruthy()
    })

    it('unselected items do not show checkmark', () => {
      render(<CheckboxList {...defaultProps} selected={['barbell']} />)
      expect(screen.queryByTestId('equipment-checkmark-dumbbells')).toBeNull()
    })
  })

  // ── Select All Logic ──

  describe('select all logic', () => {
    it('shows select all label when not all selected', () => {
      render(<CheckboxList {...defaultProps} selected={['barbell']} />)
      expect(screen.getByTestId('equipment-select-all')).toBeTruthy()
      // The text content should indicate "select all"
      const selectAllRow = screen.getByTestId('equipment-select-all-label')
      expect(selectAllRow.props.children).toBeTruthy()
    })

    it('calls onToggle for each unselected item when select all pressed', () => {
      render(<CheckboxList {...defaultProps} selected={['barbell']} />)
      fireEvent(screen.getByTestId('equipment-select-all'), 'pressIn')
      // Should call onToggle for dumbbells, cables, pullup (not barbell — already selected)
      expect(defaultProps.onToggle).toHaveBeenCalledWith('dumbbells')
      expect(defaultProps.onToggle).toHaveBeenCalledWith('cables')
      expect(defaultProps.onToggle).toHaveBeenCalledWith('pullup')
      expect(defaultProps.onToggle).not.toHaveBeenCalledWith('barbell')
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(3)
    })

    it('calls onToggle for each selected item when clear all pressed', () => {
      const allSelected = options.map((o) => o.id)
      render(<CheckboxList {...defaultProps} selected={allSelected} />)
      fireEvent(screen.getByTestId('equipment-select-all'), 'pressIn')
      // Should call onToggle for all items (to deselect them)
      expect(defaultProps.onToggle).toHaveBeenCalledWith('barbell')
      expect(defaultProps.onToggle).toHaveBeenCalledWith('dumbbells')
      expect(defaultProps.onToggle).toHaveBeenCalledWith('cables')
      expect(defaultProps.onToggle).toHaveBeenCalledWith('pullup')
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(4)
    })
  })

  // ── Haptics ──

  describe('haptics', () => {
    it('triggers haptic feedback on toggle', () => {
      render(<CheckboxList {...defaultProps} />)
      fireEvent(screen.getByTestId('equipment-option-dumbbells'), 'pressIn')
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
    })
  })

  // ── Accessibility ──

  describe('accessibility', () => {
    it('each row has accessibilityRole checkbox', () => {
      render(<CheckboxList {...defaultProps} />)
      const option = screen.getByTestId('equipment-option-barbell')
      expect(option.props.accessibilityRole).toBe('checkbox')
    })

    it('selected row has accessibilityState checked true', () => {
      render(<CheckboxList {...defaultProps} selected={['barbell']} />)
      const option = screen.getByTestId('equipment-option-barbell')
      expect(option.props.accessibilityState).toEqual(expect.objectContaining({ checked: true }))
    })

    it('unselected row has accessibilityState checked false', () => {
      render(<CheckboxList {...defaultProps} selected={['barbell']} />)
      const option = screen.getByTestId('equipment-option-dumbbells')
      expect(option.props.accessibilityState).toEqual(expect.objectContaining({ checked: false }))
    })

    it('each row has accessibilityLabel matching label', () => {
      render(<CheckboxList {...defaultProps} />)
      const option = screen.getByTestId('equipment-option-barbell')
      expect(option.props.accessibilityLabel).toBe('Barbell')
    })
  })

  // ── RTL Support ──

  describe('RTL support', () => {
    it('renders in RTL mode without crashing', () => {
      jest.spyOn(rtlModule, 'isRTL').mockReturnValue(true)
      render(<CheckboxList {...defaultProps} />)
      expect(screen.getByText('Barbell')).toBeTruthy()
    })
  })
})
