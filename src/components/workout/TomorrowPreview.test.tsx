import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { TomorrowPreview } from './TomorrowPreview'
import { setLanguage } from '@/i18n'
import type { DayOfWeek } from '@/types/user'
import type { GeneratedWorkoutDay } from '@/algorithms/workout-generator'
import type { WorkoutTemplate, ExercisePrescription } from '@/types/workout'

const MOCK_PRESCRIPTIONS: ExercisePrescription[] = [
  { exerciseId: 'ex_001', sets: 3, minReps: 8, maxReps: 12, restSeconds: 90, order: 1 },
  { exerciseId: 'ex_002', sets: 3, minReps: 8, maxReps: 12, restSeconds: 90, order: 2 },
  { exerciseId: 'ex_003', sets: 4, minReps: 6, maxReps: 10, restSeconds: 120, order: 3 },
]

const MOCK_TEMPLATE: WorkoutTemplate = {
  id: 'tpl_001',
  dayType: 'upper_a',
  splitType: 'upper_lower',
  nameHe: 'עליון A',
  nameEn: 'Upper A',
  exercises: MOCK_PRESCRIPTIONS,
  estimatedMinutes: 60,
}

function buildDayMapping(
  tomorrowDay: DayOfWeek,
  template: WorkoutTemplate | null,
): ReadonlyMap<DayOfWeek, GeneratedWorkoutDay> {
  return new Map<DayOfWeek, GeneratedWorkoutDay>([
    [
      tomorrowDay,
      {
        dayOfWeek: tomorrowDay,
        dayType: template ? 'upper_a' : 'rest',
        template,
      },
    ],
  ])
}

describe('TomorrowPreview', () => {
  beforeEach(() => {
    setLanguage('en')
  })

  afterEach(() => {
    setLanguage('he')
  })

  it('renders tomorrow preview title', () => {
    const dayMapping = buildDayMapping(2 as DayOfWeek, MOCK_TEMPLATE)
    render(
      <TomorrowPreview dayMapping={dayMapping} todayDayOfWeek={1 as DayOfWeek} testID="preview" />,
    )
    expect(screen.getByText("Tomorrow's Workout")).toBeTruthy()
  })

  it('shows workout name and exercise count', () => {
    const dayMapping = buildDayMapping(2 as DayOfWeek, MOCK_TEMPLATE)
    render(
      <TomorrowPreview dayMapping={dayMapping} todayDayOfWeek={1 as DayOfWeek} testID="preview" />,
    )
    expect(screen.getByText('Upper A')).toBeTruthy()
    expect(screen.getByText('3 exercises')).toBeTruthy()
  })

  it('shows rest message when tomorrow is also rest', () => {
    const dayMapping = buildDayMapping(2 as DayOfWeek, null)
    render(
      <TomorrowPreview dayMapping={dayMapping} todayDayOfWeek={1 as DayOfWeek} testID="preview" />,
    )
    expect(screen.getByText(/rest day/i)).toBeTruthy()
  })

  it('handles null dayMapping', () => {
    render(<TomorrowPreview dayMapping={null} todayDayOfWeek={1 as DayOfWeek} testID="preview" />)
    expect(screen.getByTestId('preview')).toBeTruthy()
  })

  it('wraps Saturday to Sunday for tomorrow', () => {
    // Today is Saturday (6), tomorrow should be Sunday (0)
    const dayMapping = buildDayMapping(0 as DayOfWeek, MOCK_TEMPLATE)
    render(
      <TomorrowPreview dayMapping={dayMapping} todayDayOfWeek={6 as DayOfWeek} testID="preview" />,
    )
    expect(screen.getByText('Upper A')).toBeTruthy()
  })
})
