import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { RestDayCard } from './RestDayCard'
import { setLanguage } from '@/i18n'

describe('RestDayCard', () => {
  beforeEach(() => {
    setLanguage('en')
  })

  afterEach(() => {
    setLanguage('he')
  })

  it('renders rest day title', () => {
    render(<RestDayCard testID="rest-card" />)
    expect(screen.getByText('Rest Day')).toBeTruthy()
  })

  it('renders rest day message', () => {
    render(<RestDayCard testID="rest-card" />)
    expect(screen.getByText('Your muscles are growing — let your body recover')).toBeTruthy()
  })

  it('renders a recovery tip', () => {
    render(<RestDayCard testID="rest-card" />)
    expect(screen.getByTestId('rest-card-tip')).toBeTruthy()
  })

  it('renders with testID', () => {
    render(<RestDayCard testID="rest-card" />)
    expect(screen.getByTestId('rest-card')).toBeTruthy()
  })
})
