/**
 * Tests for AdherencePicker component.
 * RED phase: written before the component exists.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { AdherencePicker } from './AdherencePicker'

describe('AdherencePicker', () => {
  it('renders all 3 adherence buttons', () => {
    const { getByTestId } = render(
      <AdherencePicker value={null} onChange={jest.fn()} testID="adherence" />,
    )
    expect(getByTestId('adherence-accurate')).toBeTruthy()
    expect(getByTestId('adherence-roughly')).toBeTruthy()
    expect(getByTestId('adherence-not_accurate')).toBeTruthy()
  })

  it('renders correct Hebrew labels', () => {
    const { getByTestId } = render(
      <AdherencePicker value={null} onChange={jest.fn()} testID="adherence" />,
    )
    expect(getByTestId('adherence-accurate-label')).toHaveTextContent('מדויק')
    expect(getByTestId('adherence-roughly-label')).toHaveTextContent('בערך')
    expect(getByTestId('adherence-not_accurate-label')).toHaveTextContent('לא מדויק')
  })

  it('calls onChange with "accurate" when first button pressed', () => {
    const onChange = jest.fn()
    const { getByTestId } = render(
      <AdherencePicker value={null} onChange={onChange} testID="adherence" />,
    )
    fireEvent.press(getByTestId('adherence-accurate'))
    expect(onChange).toHaveBeenCalledWith('accurate')
  })

  it('calls onChange with "roughly" when second button pressed', () => {
    const onChange = jest.fn()
    const { getByTestId } = render(
      <AdherencePicker value={null} onChange={onChange} testID="adherence" />,
    )
    fireEvent.press(getByTestId('adherence-roughly'))
    expect(onChange).toHaveBeenCalledWith('roughly')
  })

  it('calls onChange with "not_accurate" when third button pressed', () => {
    const onChange = jest.fn()
    const { getByTestId } = render(
      <AdherencePicker value={null} onChange={onChange} testID="adherence" />,
    )
    fireEvent.press(getByTestId('adherence-not_accurate'))
    expect(onChange).toHaveBeenCalledWith('not_accurate')
  })

  it('marks the selected button with a selected testID', () => {
    const { getByTestId } = render(
      <AdherencePicker value="roughly" onChange={jest.fn()} testID="adherence" />,
    )
    expect(getByTestId('adherence-roughly-selected')).toBeTruthy()
  })

  it('does not mark unselected buttons as selected', () => {
    const { queryByTestId } = render(
      <AdherencePicker value="roughly" onChange={jest.fn()} testID="adherence" />,
    )
    expect(queryByTestId('adherence-accurate-selected')).toBeNull()
    expect(queryByTestId('adherence-not_accurate-selected')).toBeNull()
  })

  it('no button selected when value is null', () => {
    const { queryByTestId } = render(
      <AdherencePicker value={null} onChange={jest.fn()} testID="adherence" />,
    )
    expect(queryByTestId('adherence-accurate-selected')).toBeNull()
    expect(queryByTestId('adherence-roughly-selected')).toBeNull()
    expect(queryByTestId('adherence-not_accurate-selected')).toBeNull()
  })
})
