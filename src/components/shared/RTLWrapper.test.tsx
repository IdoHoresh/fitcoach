import React from 'react'
import { Text } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { RTLWrapper } from './RTLWrapper'
import * as rtlModule from '@/hooks/rtl'

describe('RTLWrapper', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders children', () => {
    jest.spyOn(rtlModule, 'isRTL').mockReturnValue(false)
    render(
      <RTLWrapper>
        <Text>Hello</Text>
      </RTLWrapper>,
    )
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('uses row direction in LTR mode', () => {
    jest.spyOn(rtlModule, 'isRTL').mockReturnValue(false)
    render(
      <RTLWrapper testID="wrapper">
        <Text>LTR</Text>
      </RTLWrapper>,
    )
    const wrapper = screen.getByTestId('wrapper')
    expect(wrapper).toHaveStyle({ flexDirection: 'row' })
  })

  it('uses row-reverse direction in RTL mode', () => {
    jest.spyOn(rtlModule, 'isRTL').mockReturnValue(true)
    render(
      <RTLWrapper testID="wrapper">
        <Text>RTL</Text>
      </RTLWrapper>,
    )
    const wrapper = screen.getByTestId('wrapper')
    expect(wrapper).toHaveStyle({ flexDirection: 'row-reverse' })
  })

  it('merges custom styles', () => {
    jest.spyOn(rtlModule, 'isRTL').mockReturnValue(false)
    render(
      <RTLWrapper testID="wrapper" style={{ padding: 10 }}>
        <Text>Styled</Text>
      </RTLWrapper>,
    )
    const wrapper = screen.getByTestId('wrapper')
    expect(wrapper).toHaveStyle({ flexDirection: 'row', padding: 10 })
  })
})
