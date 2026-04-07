import React from 'react'
import { Text } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import {
  OnboardingLayout,
  OnboardingTitle,
  OnboardingSubtitle,
  OnboardingContent,
} from './OnboardingLayout'

describe('OnboardingLayout', () => {
  const defaultProps = {
    step: 1,
    onNext: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders children', () => {
      render(
        <OnboardingLayout {...defaultProps}>
          <Text>Test content</Text>
        </OnboardingLayout>,
      )
      expect(screen.getByText('Test content')).toBeTruthy()
    })

    it('renders progress bar', () => {
      render(
        <OnboardingLayout {...defaultProps}>
          <Text>Content</Text>
        </OnboardingLayout>,
      )
      expect(screen.getByTestId('onboarding-progress')).toBeTruthy()
    })

    it('renders next button', () => {
      render(
        <OnboardingLayout {...defaultProps}>
          <Text>Content</Text>
        </OnboardingLayout>,
      )
      expect(screen.getByTestId('onboarding-next')).toBeTruthy()
    })
  })

  describe('back button', () => {
    it('hides back button when onBack is not provided', () => {
      render(
        <OnboardingLayout {...defaultProps}>
          <Text>Content</Text>
        </OnboardingLayout>,
      )
      expect(screen.queryByTestId('onboarding-back')).toBeNull()
    })

    it('shows back button when onBack is provided', () => {
      render(
        <OnboardingLayout {...defaultProps} onBack={jest.fn()}>
          <Text>Content</Text>
        </OnboardingLayout>,
      )
      expect(screen.getByTestId('onboarding-back')).toBeTruthy()
    })

    it('calls onBack when back button is pressed', () => {
      const onBack = jest.fn()
      render(
        <OnboardingLayout {...defaultProps} onBack={onBack}>
          <Text>Content</Text>
        </OnboardingLayout>,
      )
      fireEvent.press(screen.getByTestId('onboarding-back'))
      expect(onBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('next button', () => {
    it('calls onNext when next button is pressed', () => {
      const onNext = jest.fn()
      render(
        <OnboardingLayout {...defaultProps} onNext={onNext}>
          <Text>Content</Text>
        </OnboardingLayout>,
      )
      fireEvent.press(screen.getByTestId('onboarding-next'))
      expect(onNext).toHaveBeenCalledTimes(1)
    })

    it('disables next button when nextDisabled is true', () => {
      const onNext = jest.fn()
      render(
        <OnboardingLayout {...defaultProps} onNext={onNext} nextDisabled>
          <Text>Content</Text>
        </OnboardingLayout>,
      )
      fireEvent.press(screen.getByTestId('onboarding-next'))
      expect(onNext).not.toHaveBeenCalled()
    })

    it('uses custom label when nextLabel is provided', () => {
      render(
        <OnboardingLayout {...defaultProps} nextLabel="Finish">
          <Text>Content</Text>
        </OnboardingLayout>,
      )
      expect(screen.getByText('Finish')).toBeTruthy()
    })
  })
})

describe('Staggered entrance wrappers', () => {
  it('OnboardingTitle renders children', () => {
    render(
      <OnboardingTitle>
        <Text>Title</Text>
      </OnboardingTitle>,
    )
    expect(screen.getByText('Title')).toBeTruthy()
  })

  it('OnboardingSubtitle renders children', () => {
    render(
      <OnboardingSubtitle>
        <Text>Subtitle</Text>
      </OnboardingSubtitle>,
    )
    expect(screen.getByText('Subtitle')).toBeTruthy()
  })

  it('OnboardingContent renders children', () => {
    render(
      <OnboardingContent>
        <Text>Content</Text>
      </OnboardingContent>,
    )
    expect(screen.getByText('Content')).toBeTruthy()
  })
})
