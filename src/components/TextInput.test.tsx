import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { TextInput } from './TextInput'
import { colors } from '@/theme/colors'

describe('TextInput', () => {
  describe('rendering', () => {
    it('renders label text', () => {
      render(<TextInput label="Name" value="" onChangeText={jest.fn()} />)
      expect(screen.getByText('Name')).toBeTruthy()
    })

    it('renders placeholder text', () => {
      render(<TextInput label="Name" value="" onChangeText={jest.fn()} placeholder="Enter name" />)
      expect(screen.getByPlaceholderText('Enter name')).toBeTruthy()
    })

    it('renders current value', () => {
      render(<TextInput label="Name" value="Ido" onChangeText={jest.fn()} />)
      expect(screen.getByDisplayValue('Ido')).toBeTruthy()
    })
  })

  describe('interactions', () => {
    it('calls onChangeText when text changes', () => {
      const onChangeText = jest.fn()
      render(<TextInput label="Name" value="" onChangeText={onChangeText} testID="input" />)
      fireEvent.changeText(screen.getByTestId('input-field'), 'Hello')
      expect(onChangeText).toHaveBeenCalledWith('Hello')
    })
  })

  describe('error state', () => {
    it('renders error message when error prop is set', () => {
      render(<TextInput label="Name" value="" onChangeText={jest.fn()} error="Required field" />)
      expect(screen.getByText('Required field')).toBeTruthy()
    })

    it('applies error border color', () => {
      render(
        <TextInput
          label="Name"
          value=""
          onChangeText={jest.fn()}
          error="Required"
          testID="input"
        />,
      )
      expect(screen.getByTestId('input-field')).toHaveStyle({
        borderColor: colors.error,
      })
    })

    it('does not render error when no error prop', () => {
      render(<TextInput label="Name" value="" onChangeText={jest.fn()} />)
      expect(screen.queryByTestId('input-error')).toBeNull()
    })
  })

  describe('accessibility', () => {
    it('has accessibility label on the input', () => {
      render(<TextInput label="Name" value="" onChangeText={jest.fn()} />)
      expect(screen.getByLabelText('Name')).toBeTruthy()
    })
  })
})
