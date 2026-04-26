import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ModeToggleSheet } from './ModeToggleSheet'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

describe('ModeToggleSheet', () => {
  const baseProps = {
    visible: true,
    currentMode: 'structured' as const,
    onSelect: jest.fn(),
    onClose: jest.fn(),
    testID: 'mode-toggle',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders both ModeCards with correct selected state from currentMode prop', () => {
    const { rerender } = render(<ModeToggleSheet {...baseProps} currentMode="structured" />)
    expect(screen.getByTestId('mode-toggle-structured').props.accessibilityState.selected).toBe(
      true,
    )
    expect(screen.getByTestId('mode-toggle-free').props.accessibilityState.selected).toBe(false)

    rerender(<ModeToggleSheet {...baseProps} currentMode="free" />)
    expect(screen.getByTestId('mode-toggle-structured').props.accessibilityState.selected).toBe(
      false,
    )
    expect(screen.getByTestId('mode-toggle-free').props.accessibilityState.selected).toBe(true)
  })

  it('tapping the unselected card fires onSelect with that mode', () => {
    const onSelect = jest.fn()
    render(<ModeToggleSheet {...baseProps} currentMode="structured" onSelect={onSelect} />)
    fireEvent.press(screen.getByTestId('mode-toggle-free'))
    expect(onSelect).toHaveBeenCalledWith('free')
  })

  it('tapping the unselected card fires onClose after onSelect', () => {
    const calls: string[] = []
    const onSelect = jest.fn(() => calls.push('select'))
    const onClose = jest.fn(() => calls.push('close'))
    render(
      <ModeToggleSheet
        {...baseProps}
        currentMode="structured"
        onSelect={onSelect}
        onClose={onClose}
      />,
    )
    fireEvent.press(screen.getByTestId('mode-toggle-free'))
    expect(calls).toEqual(['select', 'close'])
  })

  it('tapping the already-selected card still fires onSelect + onClose', () => {
    const onSelect = jest.fn()
    const onClose = jest.fn()
    render(
      <ModeToggleSheet
        {...baseProps}
        currentMode="structured"
        onSelect={onSelect}
        onClose={onClose}
      />,
    )
    fireEvent.press(screen.getByTestId('mode-toggle-structured'))
    expect(onSelect).toHaveBeenCalledWith('structured')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not render cards when visible={false}', () => {
    render(<ModeToggleSheet {...baseProps} visible={false} />)
    expect(screen.queryByTestId('mode-toggle-structured')).toBeNull()
    expect(screen.queryByTestId('mode-toggle-free')).toBeNull()
  })

  it('tapping the backdrop fires onClose', () => {
    const onClose = jest.fn()
    render(<ModeToggleSheet {...baseProps} onClose={onClose} />)
    const all = screen.UNSAFE_root.findAll(
      (n: { props: { testID?: string } }) => n.props?.testID === 'mode-toggle-backdrop',
    )
    expect(all.length).toBeGreaterThan(0)
    fireEvent.press(all[0])
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ⓘ button on a card opens the info sheet without firing onSelect or onClose', () => {
    const onSelect = jest.fn()
    const onClose = jest.fn()
    render(<ModeToggleSheet {...baseProps} onSelect={onSelect} onClose={onClose} />)
    fireEvent.press(screen.getByTestId('mode-toggle-structured-info'))
    expect(onSelect).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByTestId('mode-toggle-info-sheet')).toBeTruthy()
  })
})
