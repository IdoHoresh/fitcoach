import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { WorkoutDayStrip } from './WorkoutDayStrip'
import type { DayOfWeek } from '@/types/user'
import type { GeneratedWorkoutDay } from '@/algorithms/workout-generator'
import type { WorkoutTemplate } from '@/types/workout'

const MOCK_TEMPLATE_UPPER: WorkoutTemplate = {
  id: 'tpl_001',
  dayType: 'upper_a',
  splitType: 'upper_lower',
  nameHe: 'עליון A',
  nameEn: 'Upper A',
  exercises: [],
  estimatedMinutes: 60,
}

const MOCK_TEMPLATE_LOWER: WorkoutTemplate = {
  id: 'tpl_002',
  dayType: 'lower_a',
  splitType: 'upper_lower',
  nameHe: 'תחתון A',
  nameEn: 'Lower A',
  exercises: [],
  estimatedMinutes: 60,
}

function buildDayMapping(): ReadonlyMap<DayOfWeek, GeneratedWorkoutDay> {
  return new Map<DayOfWeek, GeneratedWorkoutDay>([
    [0, { dayOfWeek: 0, dayType: 'upper_a', template: MOCK_TEMPLATE_UPPER }],
    [1, { dayOfWeek: 1, dayType: 'rest', template: null }],
    [2, { dayOfWeek: 2, dayType: 'lower_a', template: MOCK_TEMPLATE_LOWER }],
    [3, { dayOfWeek: 3, dayType: 'rest', template: null }],
    [4, { dayOfWeek: 4, dayType: 'upper_a', template: MOCK_TEMPLATE_UPPER }],
    [5, { dayOfWeek: 5, dayType: 'rest', template: null }],
    [6, { dayOfWeek: 6, dayType: 'rest', template: null }],
  ])
}

const defaultProps = {
  dayMapping: buildDayMapping(),
  selectedDay: 0 as DayOfWeek,
  todayDayOfWeek: 0 as DayOfWeek,
  onDaySelect: jest.fn(),
  testID: 'day-strip',
}

describe('WorkoutDayStrip', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders 7 day cells', () => {
    render(<WorkoutDayStrip {...defaultProps} />)
    for (let i = 0; i < 7; i++) {
      expect(screen.getByTestId(`day-strip-day-${i}`)).toBeTruthy()
    }
  })

  it('highlights today with a distinct testID', () => {
    render(<WorkoutDayStrip {...defaultProps} todayDayOfWeek={4 as DayOfWeek} />)
    expect(screen.getByTestId('day-strip-day-4-today')).toBeTruthy()
  })

  it('marks the selected day', () => {
    render(<WorkoutDayStrip {...defaultProps} selectedDay={2 as DayOfWeek} />)
    expect(screen.getByTestId('day-strip-day-2-selected')).toBeTruthy()
  })

  it('calls onDaySelect when a day is tapped', () => {
    const onDaySelect = jest.fn()
    render(<WorkoutDayStrip {...defaultProps} onDaySelect={onDaySelect} />)
    fireEvent.press(screen.getByTestId('day-strip-day-3'))
    expect(onDaySelect).toHaveBeenCalledWith(3)
  })

  it('marks rest days with a rest testID', () => {
    render(<WorkoutDayStrip {...defaultProps} />)
    // Days 1, 3, 5, 6 are rest days
    expect(screen.getByTestId('day-strip-day-1-rest')).toBeTruthy()
    expect(screen.getByTestId('day-strip-day-3-rest')).toBeTruthy()
    // Day 0 is a workout day — should NOT have rest marker
    expect(screen.queryByTestId('day-strip-day-0-rest')).toBeNull()
  })

  it('handles null dayMapping gracefully', () => {
    render(<WorkoutDayStrip {...defaultProps} dayMapping={null} />)
    // All 7 cells should still render
    for (let i = 0; i < 7; i++) {
      expect(screen.getByTestId(`day-strip-day-${i}`)).toBeTruthy()
    }
  })
})
