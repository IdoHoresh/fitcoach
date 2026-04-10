import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ExerciseDetailSheet } from './ExerciseDetailSheet'
import { setLanguage } from '@/i18n'
import type { Exercise, ExercisePrescription, ProgressionAdvice } from '@/types/workout'

const MOCK_EXERCISE: Exercise = {
  id: 'ex_001',
  nameHe: 'לחיצת חזה עם מוט',
  nameEn: 'Barbell Bench Press',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'shoulders'],
  movementPattern: 'horizontal_push',
  requiredEquipment: ['barbell', 'bench'],
  substitutionIds: [],
  instructions: 'Lower the bar to mid-chest, press back up.',
}

const MOCK_PRESCRIPTION: ExercisePrescription = {
  exerciseId: 'ex_001',
  sets: 3,
  minReps: 8,
  maxReps: 12,
  restSeconds: 90,
  order: 1,
}

const MOCK_ADVICE: ProgressionAdvice = {
  exerciseId: 'ex_001',
  action: 'increase_weight',
  suggestedWeightKg: 42.5,
  reason: 'All sets at top of range',
  reasonHe: 'כל הסטים בטווח העליון',
}

describe('ExerciseDetailSheet', () => {
  const defaultProps = {
    visible: true,
    exercise: MOCK_EXERCISE,
    prescription: MOCK_PRESCRIPTION,
    progressionAdvice: null as ProgressionAdvice | null,
    isLoadingAdvice: false,
    onClose: jest.fn(),
    testID: 'detail-sheet',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    setLanguage('en')
  })

  afterEach(() => {
    setLanguage('he')
  })

  it('renders exercise name when visible', () => {
    render(<ExerciseDetailSheet {...defaultProps} />)
    expect(screen.getByText('Barbell Bench Press')).toBeTruthy()
  })

  it('does not render content when not visible', () => {
    render(<ExerciseDetailSheet {...defaultProps} visible={false} />)
    expect(screen.queryByText('Barbell Bench Press')).toBeNull()
  })

  it('renders primary muscle', () => {
    render(<ExerciseDetailSheet {...defaultProps} />)
    expect(screen.getByText('Chest')).toBeTruthy()
  })

  it('renders secondary muscles', () => {
    render(<ExerciseDetailSheet {...defaultProps} />)
    expect(screen.getByText(/Triceps/)).toBeTruthy()
    expect(screen.getByText(/Shoulders/)).toBeTruthy()
  })

  it('renders instructions', () => {
    render(<ExerciseDetailSheet {...defaultProps} />)
    expect(screen.getByText('Lower the bar to mid-chest, press back up.')).toBeTruthy()
  })

  it('renders equipment', () => {
    render(<ExerciseDetailSheet {...defaultProps} />)
    expect(screen.getByText(/barbell/)).toBeTruthy()
    expect(screen.getByText(/bench/)).toBeTruthy()
  })

  it('renders sets and reps info', () => {
    render(<ExerciseDetailSheet {...defaultProps} />)
    expect(screen.getByText(/3 × 8-12/)).toBeTruthy()
  })

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn()
    render(<ExerciseDetailSheet {...defaultProps} onClose={onClose} />)
    fireEvent.press(screen.getByTestId('detail-sheet-close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows loading state for progression advice', () => {
    render(<ExerciseDetailSheet {...defaultProps} isLoadingAdvice={true} />)
    expect(screen.getByTestId('detail-sheet-advice-loading')).toBeTruthy()
  })

  it('renders progression advice when available', () => {
    render(<ExerciseDetailSheet {...defaultProps} progressionAdvice={MOCK_ADVICE} />)
    expect(screen.getByText(/42.5/)).toBeTruthy()
    expect(screen.getByText('All sets at top of range')).toBeTruthy()
  })

  it('handles null exercise gracefully', () => {
    render(<ExerciseDetailSheet {...defaultProps} exercise={null} prescription={null} />)
    // Should not crash — modal is visible but empty
    expect(screen.getByTestId('detail-sheet-close')).toBeTruthy()
  })
})
