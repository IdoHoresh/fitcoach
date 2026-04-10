import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ExerciseCard } from './ExerciseCard'
import { setLanguage } from '@/i18n'
import type { ExercisePrescription, Exercise } from '@/types/workout'

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
  gifUrl: 'https://static.exercisedb.dev/media/test.gif',
}

const MOCK_PRESCRIPTION: ExercisePrescription = {
  exerciseId: 'ex_001',
  sets: 3,
  minReps: 8,
  maxReps: 12,
  restSeconds: 90,
  order: 1,
}

describe('ExerciseCard', () => {
  const defaultProps = {
    exercise: MOCK_EXERCISE,
    prescription: MOCK_PRESCRIPTION,
    order: 1,
    onPress: jest.fn(),
    testID: 'exercise-card',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    setLanguage('en')
  })

  afterEach(() => {
    setLanguage('he')
  })

  it('renders the exercise name', () => {
    render(<ExerciseCard {...defaultProps} />)
    expect(screen.getByText('Barbell Bench Press')).toBeTruthy()
  })

  it('renders formatted sets and reps', () => {
    render(<ExerciseCard {...defaultProps} />)
    expect(screen.getByText('3 × 8-12')).toBeTruthy()
  })

  it('renders rest time', () => {
    render(<ExerciseCard {...defaultProps} />)
    expect(screen.getByText('1:30 rest')).toBeTruthy()
  })

  it('renders the primary muscle', () => {
    render(<ExerciseCard {...defaultProps} />)
    expect(screen.getByText('Chest')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const onPress = jest.fn()
    render(<ExerciseCard {...defaultProps} onPress={onPress} />)
    fireEvent.press(screen.getByTestId('exercise-card'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders single rep count when min === max', () => {
    const prescription = { ...MOCK_PRESCRIPTION, minReps: 10, maxReps: 10 }
    render(<ExerciseCard {...defaultProps} prescription={prescription} />)
    expect(screen.getByText('3 × 10')).toBeTruthy()
  })

  it('renders info button', () => {
    render(<ExerciseCard {...defaultProps} />)
    expect(screen.getByTestId('exercise-card-info')).toBeTruthy()
  })
})
